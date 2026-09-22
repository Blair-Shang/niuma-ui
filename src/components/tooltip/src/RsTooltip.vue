<script setup lang="ts">
import { computed, getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useId, useSlots, watch } from 'vue'
import { placeAlignedPopup, toContainerPoint } from '../../_shared/src/overlay-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  RS_TOOLTIP_DEFAULT_DELAY,
  RS_TOOLTIP_POINTER_GRACE_MS,
  clampTooltipDelay,
  isKeyboardFocusVisible,
  rsTooltipGroupKey,
  tooltipCssLength,
  type RsTooltipAlign,
  type RsTooltipExpose,
  type RsTooltipGetContainer,
  type RsTooltipSide,
} from './tooltip-utils'

defineOptions({ name: 'RsTooltip' })

const props = withDefaults(
  defineProps<{
    content?: string
    side?: RsTooltipSide
    align?: RsTooltipAlign
    sideOffset?: number
    disabled?: boolean
    /**
     * 仅键盘 :focus-visible 时因焦点打开。
     * 不传则跟随 RsTooltipProvider，再没有则为 true。
     */
    ignoreNonKeyboardFocus?: boolean
    /** 单行展示并按内容撑开宽度（适合集合名等标识符） */
    nowrap?: boolean
    /**
     * 标签后跟小图标，只在图标上悬停出提示。
     * 对齐表单帮助：名称在图标的 aria-label，长说明在气泡。
     */
    icon?: boolean
    /** 后缀图标名，默认 info */
    iconName?: string
    /** 帮助图标的无障碍名称；缺省用 content，再回退 locale `tooltip.help` */
    ariaLabel?: string
    /** 受控显隐。不传则组件自己管。 */
    open?: boolean
    /** 覆盖 Provider 的悬停延迟（毫秒）。上限 60 秒。 */
    delayDuration?: number
    /** 指针可以移进气泡选中文字。关掉则离开触发器立即收起。 */
    interactive?: boolean
    /** 指向触发器的小箭头 */
    arrow?: boolean
    /** 覆盖 --rs-tooltip-max-width */
    maxWidth?: number | string
    /** 气泡挂载点。返回空则回到 document.body。 */
    getContainer?: RsTooltipGetContainer
    /** 气泡元素 id，供 aria-describedby。不传则自动生成。 */
    id?: string
  }>(),
  {
    side: 'top',
    align: 'center',
    sideOffset: 6,
    disabled: false,
    nowrap: false,
    icon: false,
    iconName: 'info',
    interactive: true,
    arrow: false,
  },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
  openChange: [open: boolean]
}>()

const instance = getCurrentInstance()
const slots = useSlots()
const { t } = useRsI18n()
const group = inject(rsTooltipGroupKey, null)
const autoId = useId()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const innerOpen = ref(false)
const positioned = ref(false)
const placedSide = ref<RsTooltipSide>(props.side)
const popupStyle = ref<Record<string, string>>({})
const popupTheme = ref('')
const popupDir = ref<'ltr' | 'rtl'>('ltr')

/** 布尔 prop 未传时运行时是 false，不能用 undefined 判断受控。看 vnode 上有没有这次传入。 */
function passedProp(name: string): boolean {
  const raw = instance?.vnode.props
  if (!raw) return false
  if (Object.prototype.hasOwnProperty.call(raw, name)) return true
  const kebab = name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  return Object.prototype.hasOwnProperty.call(raw, kebab)
}

const isControlled = computed(() => {
  void props.open
  return passedProp('open') || passedProp('onUpdate:open')
})
const visible = computed(() => (isControlled.value ? Boolean(props.open) : innerOpen.value))
const hasLabelSlot = computed(() => Boolean(slots.default))
const hasBody = computed(() => Boolean(props.content?.trim()) || Boolean(slots.content))
const tipDomId = computed(() => props.id?.trim() || `rs-tooltip-${autoId}`)
const iconAriaLabel = computed(
  () => props.ariaLabel?.trim() || props.content?.trim() || t('tooltip.help', 'Help'),
)
const ignoreFocus = computed(() => {
  void props.ignoreNonKeyboardFocus
  if (passedProp('ignoreNonKeyboardFocus')) return Boolean(props.ignoreNonKeyboardFocus)
  return group?.ignoreNonKeyboardFocus ?? true
})
const openDelay = computed(() =>
  clampTooltipDelay(props.delayDuration ?? group?.delayDuration, RS_TOOLTIP_DEFAULT_DELAY),
)
const contentStyle = computed(() => {
  const style = { ...popupStyle.value }
  if (props.maxWidth != null && props.maxWidth !== '') style.maxWidth = tooltipCssLength(props.maxWidth)
  return style
})
const portalTarget = computed((): string | HTMLElement => resolvePortal() ?? 'body')

let applied = false
let followBound = false
let hovering = false
let boundEl: HTMLElement | null = null
let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null
let posRaf = 0
let resizeObserver: ResizeObserver | null = null

function currentTrigger(): HTMLElement | null {
  if (props.icon) return triggerRef.value
  const child = rootRef.value?.firstElementChild
  return child instanceof HTMLElement ? child : null
}

function clearOpenTimer(): void {
  if (openTimer == null) return
  clearTimeout(openTimer)
  openTimer = null
}

function clearCloseTimer(): void {
  if (closeTimer == null) return
  clearTimeout(closeTimer)
  closeTimer = null
}

function clearTimers(): void {
  clearOpenTimer()
  clearCloseTimer()
}

function cancelRaf(): void {
  if (typeof window === 'undefined' || !posRaf) return
  window.cancelAnimationFrame(posRaf)
  posRaf = 0
}

function readDir(el: HTMLElement | null): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr'
  if (el?.closest('[dir="rtl"], [data-rs-dir="rtl"]')) return 'rtl'
  const root = document.documentElement
  if (root.dir === 'rtl' || root.getAttribute('data-rs-dir') === 'rtl') return 'rtl'
  return 'ltr'
}

function shouldDescribe(): boolean {
  if (!props.icon) return true
  const name = iconAriaLabel.value.trim()
  const body = props.content?.trim() || ''
  if (!body) return true
  return name !== body
}

function syncDescribedBy(on: boolean): void {
  const el = currentTrigger()
  if (!el) return
  const id = tipDomId.value
  const parts = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((part) => part && part !== id)
  if (on && shouldDescribe()) parts.push(id)
  if (parts.length) el.setAttribute('aria-describedby', parts.join(' '))
  else el.removeAttribute('aria-describedby')
}

function resolvePortal(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  try {
    return props.getContainer?.() ?? null
  } catch {
    return null
  }
}

function updatePosition(): void {
  if (typeof window === 'undefined' || !applied) return
  const trigger = currentTrigger()
  const popup = contentRef.value
  if (!trigger || !popup) return
  const anchor = trigger.getBoundingClientRect()
  const size = popup.getBoundingClientRect()
  const rtl = readDir(trigger) === 'rtl'
  const box = placeAlignedPopup(
    { top: anchor.top, left: anchor.left, width: anchor.width, height: anchor.height },
    { width: size.width, height: size.height },
    { width: window.innerWidth, height: window.innerHeight },
    {
      side: props.side,
      align: props.align,
      sideOffset: props.sideOffset,
      padding: 8,
      rtl,
    },
  )
  const container = popup.parentElement
  const origin =
    container && container !== document.body && container !== document.documentElement
      ? { top: container.getBoundingClientRect().top, left: container.getBoundingClientRect().left }
      : null
  const point = toContainerPoint(Math.round(box.top), Math.round(box.left), origin)
  popupTheme.value = trigger.closest('[data-rs-theme]')?.getAttribute('data-rs-theme') || ''
  popupDir.value = rtl ? 'rtl' : 'ltr'
  const top = `${point.top}px`
  const left = `${point.left}px`
  if (
    positioned.value &&
    popupStyle.value.top === top &&
    popupStyle.value.left === left &&
    placedSide.value === box.side
  ) {
    return
  }
  placedSide.value = box.side
  popupStyle.value = { top, left }
  positioned.value = true
}

function schedulePosition(): void {
  if (typeof window === 'undefined' || posRaf || !applied) return
  posRaf = window.requestAnimationFrame(() => {
    posRaf = 0
    if (applied) updatePosition()
  })
}

function observeContent(): void {
  resizeObserver?.disconnect()
  resizeObserver = null
  const el = contentRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => schedulePosition())
  resizeObserver.observe(el)
}

function bindFollow(on: boolean): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (on === followBound) return
  followBound = on
  const passiveCapture: AddEventListenerOptions = { capture: true, passive: true }
  if (on) {
    window.addEventListener('scroll', schedulePosition, passiveCapture)
    window.addEventListener('resize', schedulePosition, passiveCapture)
    window.addEventListener('keydown', onDocKeydown, true)
    document.addEventListener('pointerdown', onDocPointerDown, true)
    return
  }
  window.removeEventListener('scroll', schedulePosition, passiveCapture)
  window.removeEventListener('resize', schedulePosition, passiveCapture)
  window.removeEventListener('keydown', onDocKeydown, true)
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  cancelRaf()
  resizeObserver?.disconnect()
  resizeObserver = null
}

function syncSideEffects(next: boolean): void {
  if (applied === next) return
  applied = next
  if (next) {
    placedSide.value = props.side
    group?.notifyOpen()
    bindFollow(true)
    void nextTick(() => {
      if (!applied) return
      syncDescribedBy(true)
      updatePosition()
      observeContent()
    })
    return
  }
  group?.notifyClose()
  syncDescribedBy(false)
  positioned.value = false
  bindFollow(false)
}

function requestOpen(next: boolean): void {
  if (next && (props.disabled || !hasBody.value)) return
  if (visible.value === next) return
  if (!isControlled.value) innerOpen.value = next
  emit('update:open', next)
  emit('openChange', next)
}

function scheduleOpen(): void {
  clearCloseTimer()
  if (props.disabled || !hasBody.value || visible.value) return
  clearOpenTimer()
  const delay = group?.shouldSkipDelay() ? 0 : openDelay.value
  openTimer = setTimeout(() => {
    openTimer = null
    requestOpen(true)
  }, delay)
}

function scheduleClose(): void {
  clearOpenTimer()
  if (!visible.value) return
  clearCloseTimer()
  const grace = props.interactive ? RS_TOOLTIP_POINTER_GRACE_MS : 0
  if (grace <= 0) {
    requestOpen(false)
    return
  }
  closeTimer = setTimeout(() => {
    closeTimer = null
    requestOpen(false)
  }, grace)
}

function closeNow(): void {
  clearTimers()
  hovering = false
  requestOpen(false)
}

function onPointerEnter(event: PointerEvent): void {
  if (event.pointerType === 'touch') return
  hovering = true
  scheduleOpen()
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch') return
  if (hovering) return
  hovering = true
  scheduleOpen()
}

function onPointerLeave(event: PointerEvent): void {
  if (event.pointerType === 'touch') return
  hovering = false
  scheduleClose()
}

function onPointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'touch') return
  if (visible.value) closeNow()
  else scheduleOpen()
}

function onFocus(event: FocusEvent): void {
  const target = event.target instanceof Element ? event.target : event.currentTarget
  if (!isKeyboardFocusVisible(target, ignoreFocus.value)) return
  scheduleOpen()
}

function onBlur(): void {
  hovering = false
  scheduleClose()
}

function onContentEnter(): void {
  if (!props.interactive) return
  clearCloseTimer()
}

function onContentLeave(): void {
  if (!props.interactive) return
  scheduleClose()
}

function onDocKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !applied) return
  event.preventDefault()
  event.stopPropagation()
  closeNow()
}

function onDocPointerDown(event: PointerEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return
  if (currentTrigger()?.contains(target)) return
  if (contentRef.value?.contains(target)) return
  closeNow()
}

function unbindTrigger(): void {
  if (!boundEl) return
  boundEl.removeEventListener('pointerenter', onPointerEnter)
  boundEl.removeEventListener('pointermove', onPointerMove)
  boundEl.removeEventListener('pointerleave', onPointerLeave)
  boundEl.removeEventListener('pointerdown', onPointerDown)
  boundEl.removeEventListener('focus', onFocus)
  boundEl.removeEventListener('blur', onBlur)
  boundEl = null
}

function bindTrigger(el: HTMLElement | null): void {
  if (boundEl === el) return
  unbindTrigger()
  if (!el) return
  boundEl = el
  el.addEventListener('pointerenter', onPointerEnter)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerleave', onPointerLeave)
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('focus', onFocus)
  el.addEventListener('blur', onBlur)
}

function syncTriggerBinding(): void {
  bindTrigger(currentTrigger())
}

watch(visible, (next) => syncSideEffects(next), { immediate: true })

watch(
  () => props.disabled || !hasBody.value,
  (blocked) => {
    if (!blocked) return
    clearTimers()
    requestOpen(false)
  },
)

watch(
  () => [props.side, props.align, props.sideOffset] as const,
  () => {
    if (applied) schedulePosition()
  },
)

onMounted(syncTriggerBinding)
onUpdated(syncTriggerBinding)

onBeforeUnmount(() => {
  clearTimers()
  unbindTrigger()
  if (applied) {
    applied = false
    group?.notifyClose()
    syncDescribedBy(false)
    bindFollow(false)
  }
})

defineExpose<RsTooltipExpose>({
  open: () => {
    clearTimers()
    requestOpen(true)
  },
  close: () => closeNow(),
})
</script>

<template>
  <span
    ref="rootRef"
    class="rs-tooltip"
    :class="{ 'rs-tooltip--icon': icon, 'rs-tooltip__with-icon': icon }"
  >
    <template v-if="icon">
      <span v-if="hasLabelSlot" class="rs-tooltip__label">
        <slot />
      </span>
      <button
        ref="triggerRef"
        type="button"
        class="rs-tooltip__icon-trigger"
        :aria-label="iconAriaLabel"
      >
        <RsIcon :name="iconName" :size="12" />
      </button>
    </template>
    <slot v-else />

    <Teleport v-if="visible" :to="portalTarget">
      <div
        :id="tipDomId"
        ref="contentRef"
        role="tooltip"
        class="rs-tooltip__content"
        :class="{
          'rs-tooltip__content--nowrap': nowrap,
          'rs-tooltip__content--arrow': arrow,
          'rs-tooltip__content--interactive': interactive,
        }"
        :data-side="placedSide"
        :data-align="align"
        :data-ready="positioned ? 'true' : 'false'"
        :data-rs-theme="popupTheme || undefined"
        :dir="popupDir"
        :style="contentStyle"
        @pointerenter="onContentEnter"
        @pointerleave="onContentLeave"
      >
        <slot name="content">{{ content }}</slot>
        <span v-if="arrow" class="rs-tooltip__arrow" aria-hidden="true" />
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.rs-tooltip:not(.rs-tooltip--icon) {
  display: contents;
}

.rs-tooltip--icon {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--rs-space-xs);
  width: max-content;
  max-width: 100%;
  vertical-align: middle;
}

.rs-tooltip__label {
  display: inline;
  min-width: 0;
}

.rs-tooltip__icon-trigger {
  --rs-tooltip-icon: var(--rs-text-tertiary);
  --rs-tooltip-icon-hover: var(--rs-text-primary);
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding-block: 0;
  padding-inline: 0;
  border: none;
  background: transparent;
  color: var(--rs-tooltip-icon);
  cursor: help;
  line-height: 0;
  border-radius: var(--rs-radius-full);
}

.rs-tooltip__icon-trigger:hover,
.rs-tooltip__icon-trigger:focus-visible {
  color: var(--rs-tooltip-icon-hover);
}

.rs-tooltip__icon-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tooltip__content {
  --rs-tooltip-bg: var(--rs-surface-elevated);
  --rs-tooltip-fg: var(--rs-text-primary);
  --rs-tooltip-border: var(--rs-border);
  --rs-tooltip-shadow: var(--rs-shadow-sm);
  --rs-tooltip-radius: var(--rs-radius-sm);
  position: fixed;
  z-index: var(--rs-tooltip-z);
  width: max-content;
  max-width: var(--rs-tooltip-max-width);
  margin: 0;
  padding-block: var(--rs-tooltip-pad-block);
  padding-inline: var(--rs-tooltip-pad-inline);
  border-radius: var(--rs-tooltip-radius);
  border: 1px solid var(--rs-tooltip-border);
  background: var(--rs-tooltip-bg);
  color: var(--rs-tooltip-fg);
  font-family: var(--rs-font-sans);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  line-height: var(--rs-line-height-tight);
  text-align: start;
  box-shadow: var(--rs-tooltip-shadow);
  overflow-wrap: break-word;
  pointer-events: none;
  opacity: 1;
  transition: opacity var(--rs-transition-fast);
}

.rs-tooltip__content--interactive {
  pointer-events: auto;
  user-select: text;
}

.rs-tooltip__content--nowrap {
  max-width: var(--rs-tooltip-max-width-nowrap);
  white-space: nowrap;
}

.rs-tooltip__content[data-ready='false'] {
  visibility: hidden;
  opacity: 0;
}

.rs-tooltip__arrow {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--rs-tooltip-bg);
  border: 1px solid var(--rs-tooltip-border);
  pointer-events: none;
  transform: rotate(45deg);
}

.rs-tooltip__content[data-side='top'] .rs-tooltip__arrow {
  bottom: -0.28rem;
  inset-inline-start: calc(50% - 0.25rem);
  border-block-start: none;
  border-inline-start: none;
}

.rs-tooltip__content[data-side='bottom'] .rs-tooltip__arrow {
  top: -0.28rem;
  inset-inline-start: calc(50% - 0.25rem);
  border-block-end: none;
  border-inline-end: none;
}

.rs-tooltip__content[data-side='left'] .rs-tooltip__arrow {
  inset-inline-end: -0.28rem;
  top: calc(50% - 0.25rem);
  border-block-end: none;
  border-inline-start: none;
}

.rs-tooltip__content[data-side='right'] .rs-tooltip__arrow {
  inset-inline-start: -0.28rem;
  top: calc(50% - 0.25rem);
  border-block-start: none;
  border-inline-end: none;
}

.rs-tooltip__content[data-side='top'][data-align='start'] .rs-tooltip__arrow,
.rs-tooltip__content[data-side='bottom'][data-align='start'] .rs-tooltip__arrow {
  inset-inline-start: 0.75rem;
}

.rs-tooltip__content[data-side='top'][data-align='end'] .rs-tooltip__arrow,
.rs-tooltip__content[data-side='bottom'][data-align='end'] .rs-tooltip__arrow {
  inset-inline-start: auto;
  inset-inline-end: 0.75rem;
}

.rs-tooltip__content[data-side='left'][data-align='start'] .rs-tooltip__arrow,
.rs-tooltip__content[data-side='right'][data-align='start'] .rs-tooltip__arrow {
  top: 0.75rem;
}

.rs-tooltip__content[data-side='left'][data-align='end'] .rs-tooltip__arrow,
.rs-tooltip__content[data-side='right'][data-align='end'] .rs-tooltip__arrow {
  top: auto;
  bottom: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .rs-tooltip__content {
    transition: none;
  }
}
</style>
