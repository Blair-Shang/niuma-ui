<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  nextTick,
  onUnmounted,
  ref,
  useAttrs,
  useId,
  useSlots,
  useTemplateRef,
  watch,
  type VNode,
} from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import type { RsComponentSize, RsRadius } from '../../../theme/types'
import { placeAlignedPopup, type RsAlignedOverlayBox } from '../../_shared/src/overlay-utils'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  clampPopoverDelay,
  listPopoverFocusable,
  nextPopoverFocusIndex,
  normalizePopoverTriggers,
  resolvePopoverElement,
  resolvePopoverPortalTarget,
  type RsPopoverAlign,
  type RsPopoverExpose,
  type RsPopoverGetPopupContainer,
  type RsPopoverSide,
  type RsPopoverTrigger,
  type RsPopoverWidth,
} from './popover-utils'

defineOptions({ name: 'RsPopover', inheritAttrs: false })

export type {
  RsPopoverAlign,
  RsPopoverExpose,
  RsPopoverGetPopupContainer,
  RsPopoverInstance,
  RsPopoverSide,
  RsPopoverTrigger,
  RsPopoverWidth,
} from './popover-utils'

type OpenReason = 'click' | 'hover' | 'focus' | 'script'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    side?: RsPopoverSide
    align?: RsPopoverAlign
    sideOffset?: number
    alignOffset?: number
    modal?: boolean
    width?: RsPopoverWidth
    lazyMount?: boolean
    forceMount?: boolean
    /** 附加到弹出层，对齐 RsSelect popupClassName */
    popupClassName?: string
    trigger?: RsPopoverTrigger | RsPopoverTrigger[]
    disabled?: boolean
    title?: string
    arrow?: boolean
    showClose?: boolean
    closeOnEsc?: boolean
    closeOnOutside?: boolean
    mouseEnterDelay?: number
    mouseLeaveDelay?: number
    getPopupContainer?: RsPopoverGetPopupContainer
    size?: RsComponentSize
    radius?: RsRadius
    ariaLabel?: string
    id?: string
  }>(),
  {
    side: 'bottom',
    align: 'start',
    sideOffset: 6,
    alignOffset: 0,
    modal: false,
    width: 'md',
    lazyMount: true,
    forceMount: false,
    trigger: 'click',
    disabled: false,
    arrow: false,
    showClose: false,
    closeOnEsc: true,
    closeOnOutside: true,
    mouseEnterDelay: 100,
    mouseLeaveDelay: 150,
  },
)

const emit = defineEmits<{
  openChange: [open: boolean]
}>()

const attrs = useAttrs()
const slots = useSlots()
const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const autoId = useId()
const contentId = `${autoId}-content`
const titleId = `${autoId}-title`
const fallbackTriggerId = `${autoId}-trigger`

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
const triggerEl = ref<HTMLElement | null>(null)
const activeTriggerId = ref(fallbackTriggerId)
const panelTheme = ref<string | undefined>()
const layeredInDialog = ref(false)
const positionMode = ref<'fixed' | 'absolute'>('fixed')
const box = ref<RsAlignedOverlayBox>({
  top: 0,
  left: 0,
  side: props.side,
  align: props.align,
})

const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const triggers = computed(() => normalizePopoverTriggers(props.trigger))
const hasClick = computed(() => triggers.value.includes('click'))
const hasHover = computed(() => triggers.value.includes('hover'))
const hasFocusTrigger = computed(() => triggers.value.includes('focus'))
const enterDelay = computed(() => clampPopoverDelay(props.mouseEnterDelay, 100))
const leaveDelay = computed(() => clampPopoverDelay(props.mouseLeaveDelay, 150))
const isRtl = computed(
  () => resolveDirMode(config?.dir.value ?? 'auto', config?.locale.value ?? locale.value) === 'rtl',
)
const hasTitle = computed(() => Boolean(props.title) || Boolean(slots.title))
const showChrome = computed(() => hasTitle.value || props.showClose)
const closeLabel = computed(() => t('popover.close'))
const dialogLabel = computed(() => props.ariaLabel?.trim() || t('popover.label'))
const keepMounted = computed(() => props.forceMount || !props.lazyMount)
const portalMounted = computed(() => keepMounted.value || open.value)
const portalTarget = computed(() => resolvePopoverPortalTarget(props.getPopupContainer, triggerEl.value))

const contentClass = computed(() => [
  `rs-popover__content--${props.width}`,
  `rs-popover__content--size-${resolvedSize.value}`,
  props.popupClassName,
  { 'rs-popover__content--in-dialog': layeredInDialog.value },
])

const panelStyle = computed(() => ({
  position: positionMode.value,
  top: `${box.value.top}px`,
  left: `${box.value.left}px`,
  '--rs-popover-radius': rsRadiusCss(resolvedRadius.value),
  '--rs-popover-arrow-cross': arrowCross(props.align),
}))

let enterTimer: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined
let blurTimer: ReturnType<typeof setTimeout> | undefined
let frame = 0
let overlayBound = false
let movedFocus = false
let restoreOnClose = false
let pendingReason: OpenReason | null = null
let openWatchReady = false
let panelResize: ResizeObserver | undefined

function arrowCross(align: RsPopoverAlign): string {
  if (align === 'center') return 'calc(50% - 0.25rem)'
  if (align === 'end') return 'calc(100% - 1.25rem)'
  return '0.75rem'
}

function clearTimer(kind: 'enter' | 'leave' | 'blur') {
  if (kind === 'enter' && enterTimer) {
    clearTimeout(enterTimer)
    enterTimer = undefined
  }
  if (kind === 'leave' && leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = undefined
  }
  if (kind === 'blur' && blurTimer) {
    clearTimeout(blurTimer)
    blurTimer = undefined
  }
}

function clearHoverTimers() {
  clearTimer('enter')
  clearTimer('leave')
}

function setOpen(next: boolean, reason: OpenReason) {
  if (props.disabled && next) return
  pendingReason = reason
  if (open.value === next) {
    pendingReason = null
    return
  }
  open.value = next
}

function close() {
  restoreOnClose = movedFocus
  setOpen(false, 'script')
}

function focusTrigger() {
  triggerEl.value?.focus()
}

function focusContent() {
  const root = contentRef.value
  if (!root) return
  const target = listPopoverFocusable(root)[0] ?? root
  target.focus()
  movedFocus = document.activeElement === target || root.contains(document.activeElement)
}

function assignTrigger(value: unknown) {
  const node = resolvePopoverElement(value)
  triggerEl.value = node
  if (node?.id) activeTriggerId.value = node.id
}

function flattenPopoverNodes(nodes: unknown, out: VNode[] = []): VNode[] {
  if (nodes == null || typeof nodes === 'boolean') return out
  if (Array.isArray(nodes)) {
    for (const node of nodes) flattenPopoverNodes(node, out)
    return out
  }
  if (!isVNode(nodes)) return out
  if (nodes.type === Comment || nodes.type === Text) return out
  if (nodes.type === Fragment && Array.isArray(nodes.children)) {
    flattenPopoverNodes(nodes.children, out)
    return out
  }
  out.push(nodes)
  return out
}

function isOwnedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false
  const trigger = triggerEl.value
  if (trigger && (trigger === target || trigger.contains(target))) return true
  const content = contentRef.value
  if (content?.contains(target)) return true
  let node: Node | null = target
  while (node) {
    if (node instanceof HTMLElement && node.classList.contains('rs-popover__content')) {
      const owner = node.dataset.rsPopoverTrigger
      const ownerTrigger = owner ? document.getElementById(owner) : null
      if (ownerTrigger && content?.contains(ownerTrigger)) return true
    }
    node = node.parentNode
  }
  return false
}

function portalHost(): HTMLElement | null {
  const target = portalTarget.value
  if (typeof document === 'undefined') return null
  if (typeof target !== 'string') return target
  if (target === 'body') return document.body
  return document.querySelector(target)
}

function syncPanelTheme() {
  const el = triggerEl.value ?? rootRef.value
  const themed = el?.closest('[data-rs-theme]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
  layeredInDialog.value = Boolean(el?.closest('dialog, [role="dialog"], .rs-dialog'))
}

function placePopup() {
  const trigger = triggerEl.value
  const content = contentRef.value
  if (!trigger || !content || !open.value || typeof window === 'undefined') return
  const host = portalHost()
  const viewportHost = !host || host === document.body || host === document.documentElement
  const triggerRect = trigger.getBoundingClientRect()
  const popupRect = content.getBoundingClientRect()
  const hostRect = viewportHost || !host ? null : host.getBoundingClientRect()
  box.value = placeAlignedPopup(
    {
      top: host && hostRect ? triggerRect.top - hostRect.top + host.scrollTop : triggerRect.top,
      left: host && hostRect ? triggerRect.left - hostRect.left + host.scrollLeft : triggerRect.left,
      width: triggerRect.width,
      height: triggerRect.height,
    },
    {
      width: popupRect.width || content.offsetWidth,
      height: popupRect.height || content.offsetHeight,
    },
    viewportHost
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: host?.clientWidth ?? window.innerWidth, height: host?.clientHeight ?? window.innerHeight },
    {
      side: props.side,
      align: props.align,
      sideOffset: props.sideOffset + (props.arrow ? 4 : 0),
      alignOffset: props.alignOffset,
      padding: 8,
      rtl: isRtl.value,
    },
  )
  positionMode.value = viewportHost ? 'fixed' : 'absolute'
}

function requestPlace() {
  if (typeof window === 'undefined' || frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function onWindowChange() {
  if (!open.value) return
  requestPlace()
}

function attachPanelObserver() {
  if (typeof ResizeObserver === 'undefined') return
  panelResize?.disconnect()
  panelResize = undefined
  if (!contentRef.value || !open.value) return
  panelResize = new ResizeObserver(() => requestPlace())
  panelResize.observe(contentRef.value)
  if (triggerEl.value) panelResize.observe(triggerEl.value)
}

function onDocPointerDown(event: PointerEvent) {
  if (!props.closeOnOutside || !open.value) return
  if (isOwnedTarget(event.target)) return
  restoreOnClose = false
  setOpen(false, 'script')
}

function onDocKeydown(event: KeyboardEvent) {
  if (!open.value || event.isComposing) return
  if (event.key === 'Escape') {
    if (!props.closeOnEsc) return
    event.preventDefault()
    restoreOnClose = true
    setOpen(false, 'script')
    return
  }
  if (!props.modal || event.key !== 'Tab') return
  const root = contentRef.value
  if (!root) return
  const items = listPopoverFocusable(root)
  event.preventDefault()
  if (!items.length) {
    root.focus()
    return
  }
  const active = document.activeElement
  const index = active instanceof HTMLElement ? items.indexOf(active) : -1
  const next = nextPopoverFocusIndex(items.length, index, event.shiftKey)
  items[next]?.focus()
}

function attachOverlay() {
  if (overlayBound || typeof window === 'undefined' || typeof document === 'undefined') return
  overlayBound = true
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('keydown', onDocKeydown, true)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachOverlay() {
  panelResize?.disconnect()
  panelResize = undefined
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (!overlayBound) return
  overlayBound = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown, true)
    document.removeEventListener('keydown', onDocKeydown, true)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
}

function scheduleOpenLayout(moveFocus: boolean) {
  void nextTick(() => {
    if (!open.value) return
    placePopup()
    attachPanelObserver()
    if (moveFocus) focusContent()
  })
}

function onTriggerClick(event?: MouseEvent) {
  if (!hasClick.value || props.disabled) return
  if (event && event.button !== 0) return
  if (open.value) {
    restoreOnClose = false
    setOpen(false, 'click')
    return
  }
  setOpen(true, 'click')
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (!hasClick.value || props.disabled || event.isComposing) return
  if (event.key !== 'Enter' && event.key !== ' ') return
  const tag = triggerEl.value?.tagName
  if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  event.preventDefault()
  onTriggerClick(new MouseEvent('click', { button: 0 }))
}

function onTriggerEnter() {
  if (!hasHover.value || props.disabled) return
  clearHoverTimers()
  enterTimer = setTimeout(() => {
    enterTimer = undefined
    setOpen(true, 'hover')
  }, enterDelay.value)
}

function onTriggerLeave() {
  if (!hasHover.value) return
  clearTimer('enter')
  clearTimer('leave')
  leaveTimer = setTimeout(() => {
    leaveTimer = undefined
    restoreOnClose = false
    setOpen(false, 'hover')
  }, leaveDelay.value)
}

function onContentEnter() {
  if (hasHover.value) clearTimer('leave')
}

function onContentLeave() {
  if (!hasHover.value) return
  clearTimer('leave')
  leaveTimer = setTimeout(() => {
    leaveTimer = undefined
    restoreOnClose = false
    setOpen(false, 'hover')
  }, leaveDelay.value)
}

function onTriggerFocus() {
  if (!hasFocusTrigger.value || props.disabled) return
  clearTimer('blur')
  setOpen(true, 'focus')
}

function onTriggerBlur() {
  if (!hasFocusTrigger.value) return
  clearTimer('blur')
  blurTimer = setTimeout(() => {
    blurTimer = undefined
    const active = document.activeElement
    if (active && isOwnedTarget(active)) return
    restoreOnClose = false
    setOpen(false, 'focus')
  }, 0)
}

function onContentFocusOut() {
  if (!hasFocusTrigger.value || !open.value) return
  onTriggerBlur()
}

const TriggerHost = defineComponent({
  name: 'RsPopoverTrigger',
  setup() {
    return () => {
      const nodes = flattenPopoverNodes(slots.default?.({ open: open.value, close }))
      const target = nodes[0]
      if (!target) return null
      const ownId = typeof target.props?.id === 'string' ? target.props.id : fallbackTriggerId
      const cloned = cloneVNode(
        target,
        {
          id: ownId,
          ref: assignTrigger,
          'aria-expanded': open.value ? 'true' : 'false',
          'aria-controls': portalMounted.value ? contentId : undefined,
          'aria-haspopup': 'dialog',
          onClick: onTriggerClick,
          onKeydown: onTriggerKeydown,
          onMouseenter: onTriggerEnter,
          onMouseleave: onTriggerLeave,
          onFocus: onTriggerFocus,
          onBlur: onTriggerBlur,
        },
        true,
      )
      return nodes.length === 1 ? cloned : [cloned, ...nodes.slice(1)]
    }
  },
})

watch(
  open,
  (isOpen) => {
    const skipEvent = !openWatchReady
    openWatchReady = true
    const reason = pendingReason ?? 'script'
    pendingReason = null
    if (isOpen) {
      if (props.disabled) {
        open.value = false
        return
      }
      const moveFocus = reason === 'click' || reason === 'script'
      if (typeof document !== 'undefined') {
        syncPanelTheme()
        attachOverlay()
        scheduleOpenLayout(moveFocus)
      }
      if (!skipEvent) emit('openChange', true)
      return
    }
    detachOverlay()
    clearHoverTimers()
    clearTimer('blur')
    const shouldRestore = restoreOnClose && movedFocus
    movedFocus = false
    restoreOnClose = false
    if (shouldRestore) focusTrigger()
    if (!skipEvent) emit('openChange', false)
  },
  { immediate: true },
)

watch(
  () =>
    [
      props.side,
      props.align,
      props.sideOffset,
      props.alignOffset,
      props.arrow,
      props.width,
      isRtl.value,
    ] as const,
  () => {
    if (open.value) requestPlace()
  },
)

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled && open.value) {
      restoreOnClose = false
      setOpen(false, 'script')
    }
  },
)

watch(contentRef, (el) => {
  if (!el || !open.value) return
  placePopup()
  attachPanelObserver()
})

onUnmounted(() => {
  detachOverlay()
  clearHoverTimers()
  clearTimer('blur')
})

defineExpose<RsPopoverExpose>({
  open: () => setOpen(true, 'script'),
  close,
  toggle: () => {
    if (open.value) close()
    else setOpen(true, 'script')
  },
  focus: () => focusTrigger(),
})
</script>

<template>
  <span
    ref="rootRef"
    class="rs-popover"
    v-bind="attrs"
    :id="id"
    :data-disabled="disabled ? '' : undefined"
  >
    <TriggerHost />
  </span>
  <Teleport v-if="portalMounted" :to="portalTarget">
    <dialog
      :id="contentId"
      ref="contentRef"
      class="rs-popover__content rs-motion-reduce"
      :class="contentClass"
      :style="panelStyle"
      :open="open"
      :hidden="!open ? true : undefined"
      :tabindex="open ? -1 : undefined"
      :aria-modal="modal && open ? 'true' : undefined"
      :aria-labelledby="hasTitle && open ? titleId : undefined"
      :aria-label="hasTitle ? undefined : dialogLabel"
      :data-side="box.side"
      :data-align="align"
      :data-rs-theme="panelTheme"
      :data-rs-popover-trigger="activeTriggerId"
      @cancel.prevent
      @mouseenter="onContentEnter"
      @mouseleave="onContentLeave"
      @focusout="onContentFocusOut"
    >
      <span v-if="arrow" class="rs-popover__arrow" aria-hidden="true" />
      <div v-if="showChrome" class="rs-popover__head">
        <div v-if="hasTitle" :id="titleId" class="rs-popover__title">
          <slot name="title">{{ title }}</slot>
        </div>
        <button
          v-if="showClose"
          type="button"
          class="rs-popover__close"
          :aria-label="closeLabel"
          @click="close"
        >
          <RsIcon name="x" :size="14" />
        </button>
      </div>
      <div class="rs-popover__body">
        <slot name="content" :close="close" />
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.rs-popover {
  display: inline-flex;
  max-width: 100%;
  vertical-align: middle;
}

.rs-popover__content {
  z-index: var(--rs-z-dropdown);
  box-sizing: border-box;
  inset: auto;
  margin: 0;
  padding: var(--rs-popover-pad);
  border-radius: var(--rs-popover-radius, var(--rs-radius-sm));
  border: 1px solid var(--rs-popover-border);
  background: var(--rs-popover-bg);
  color: var(--rs-popover-fg);
  font-size: var(--rs-popover-font-size);
  line-height: var(--rs-line-height-normal);
  box-shadow: var(--rs-popover-shadow);
  outline: none;
  overflow: visible;
}

.rs-popover__content--in-dialog {
  z-index: calc(var(--rs-z-modal) + 2);
}

.rs-popover__content:focus-visible {
  outline: none;
  box-shadow:
    var(--rs-popover-shadow),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-popover__content--size-ssm {
  --rs-popover-pad: 0.5rem;
  --rs-popover-font-size: var(--rs-font-size-xs);
}

.rs-popover__content--size-sm {
  --rs-popover-pad: 0.625rem;
  --rs-popover-font-size: var(--rs-font-size-xs);
}

.rs-popover__content--size-md {
  --rs-popover-pad: 0.75rem;
  --rs-popover-font-size: var(--rs-font-size-sm);
}

.rs-popover__content--size-lg {
  --rs-popover-pad: 1rem;
  --rs-popover-font-size: var(--rs-font-size-md);
}

.rs-popover__content--sm {
  width: var(--rs-popover-width-sm);
  max-width: calc(100vw - 1rem);
}

.rs-popover__content--md {
  width: var(--rs-popover-width-md);
  max-width: calc(100vw - 1rem);
}

.rs-popover__content--lg {
  width: var(--rs-popover-width-lg);
  max-width: calc(100vw - 1rem);
}

.rs-popover__content--auto {
  width: auto;
  min-width: var(--rs-popover-width-auto-min);
  max-width: min(var(--rs-popover-width-lg), calc(100vw - 1rem));
}

.rs-popover__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--rs-popover-title-gap);
  margin-block-end: var(--rs-space-xs);
}

.rs-popover__title {
  min-width: 0;
  margin: 0;
  color: var(--rs-popover-title-fg);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
}

.rs-popover__close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  margin-inline-start: auto;
  padding: 0.125rem;
  border: none;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-popover-fg-muted);
  cursor: pointer;
  line-height: 0;
}

.rs-popover__close:hover {
  color: var(--rs-popover-fg);
}

.rs-popover__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-popover__body {
  min-width: 0;
}

.rs-popover__arrow {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--rs-popover-bg);
  border-block-start: 1px solid var(--rs-popover-border);
  border-inline-start: 1px solid var(--rs-popover-border);
  pointer-events: none;
}

.rs-popover__content[data-side='bottom'] > .rs-popover__arrow {
  top: 0;
  inset-inline-start: var(--rs-popover-arrow-cross, 0.75rem);
  transform: translateY(-50%) rotate(45deg);
}

.rs-popover__content[data-side='top'] > .rs-popover__arrow {
  bottom: 0;
  inset-inline-start: var(--rs-popover-arrow-cross, 0.75rem);
  transform: translateY(50%) rotate(225deg);
}

.rs-popover__content[data-side='left'] > .rs-popover__arrow,
.rs-popover__content[data-side='right'] > .rs-popover__arrow {
  inset-block-start: var(--rs-popover-arrow-cross, 0.75rem);
}

.rs-popover__content[data-side='right'] > .rs-popover__arrow {
  inset-inline-start: 0;
  transform: translateX(-50%) rotate(-45deg);
}

.rs-popover__content[data-side='left'] > .rs-popover__arrow {
  inset-inline-end: 0;
  transform: translateX(50%) rotate(135deg);
}
</style>
