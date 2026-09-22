<script setup lang="ts">
import { computed, inject, onUnmounted, ref, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { rsConfigKey } from '../../../composables/useRsConfig'
import { resolveDirMode } from '../../../locale/apply'
import { readResolvedTheme } from '../../../theme/apply'
import {
  RS_TOAST_DEFAULT_GAP,
  RS_TOAST_DEFAULT_POSITION,
  type RsToastPosition,
} from '../../_shared/src/overlay-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  pauseRsToast,
  releaseRsToasterHost,
  resumeRsToast,
  rsToasts,
  syncRsToasterHost,
  dismissRsToast,
  type RsToastRecord,
} from './toast-store'
import {
  RS_TOAST_DEFAULT_DURATION,
  RS_TOAST_SWIPE_PX,
  clampToastGap,
  clampVisibleToasts,
  isToastTypingTarget,
  matchToastHotkey,
  resolveToastPosition,
  toastAriaLive,
  toastIconName,
  toastLiveRole,
} from './toast-utils'

defineOptions({ name: 'RsToaster' })

const props = withDefaults(
  defineProps<{
    /** 渠道。同一页面只挂一个同 id 的宿主。 */
    toasterId?: string
    position?: RsToastPosition
    closeButton?: boolean
    richColors?: boolean
    /** 为 false 时叠成一摞，悬停、焦点或快捷键展开。 */
    expand?: boolean
    /** 条间距（px）。 */
    gap?: number
    /** 未在单条上指定时的自动关闭毫秒。0 表示不自动关闭。 */
    duration?: number
    /** 同一方位最多同时显示几条。 */
    visibleToasts?: number
    /** 离视口边缘的距离（px）。未传走 --rs-space-lg，并让出安全区。 */
    offset?: number
    /** 滑动关闭。 */
    swipe?: boolean
    /** 悬停或焦点暂停倒计时。 */
    pauseOnHover?: boolean
    /** 例如 alt+t。空字符串关闭。按下后展开并聚焦通知区。 */
    hotkey?: string
    /** 覆盖 toaster.region。 */
    ariaLabel?: string
    teleportTo?: string | HTMLElement
    id?: string
  }>(),
  {
    toasterId: 'default',
    position: RS_TOAST_DEFAULT_POSITION,
    closeButton: true,
    richColors: false,
    expand: true,
    gap: RS_TOAST_DEFAULT_GAP,
    duration: RS_TOAST_DEFAULT_DURATION,
    visibleToasts: 3,
    swipe: true,
    pauseOnHover: true,
    hotkey: 'alt+t',
    teleportTo: 'body',
  },
)

const { t, locale } = useRsI18n()
const config = inject(rsConfigKey, null)
const regionRef = ref<HTMLElement | null>(null)
const hotkeyExpanded = ref(false)
const openStack = ref<RsToastPosition | null>(null)
const hostToken = Symbol('rs-toaster')

const swipes = new Map<string, { x: number; y: number; el: HTMLElement }>()

const theme = computed(() => config?.resolvedTheme.value ?? readResolvedTheme())
const textDir = computed(() => {
  if (config) return resolveDirMode(config.dir.value, config.locale.value)
  if (typeof document === 'undefined') return 'ltr'
  return document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr'
})
const regionLabel = computed(() => props.ariaLabel || t('toaster.region'))
const closeLabel = computed(() => t('toaster.close'))
const visibleLimit = computed(() => clampVisibleToasts(props.visibleToasts))
const gapPx = computed(() => clampToastGap(props.gap))

const rootStyle = computed(() => {
  const style: Record<string, string> = {
    '--rs-toaster-gap': `${gapPx.value}px`,
  }
  if (props.offset != null && Number.isFinite(props.offset) && props.offset >= 0) {
    style['--rs-toaster-offset'] = `${props.offset}px`
  }
  return style
})

const groups = computed(() => {
  const map = new Map<RsToastPosition, RsToastRecord[]>()
  for (const item of rsToasts.value) {
    if (item.toasterId !== props.toasterId) continue
    const position = resolveToastPosition(item.position, props.position)
    const list = map.get(position)
    if (list) list.push(item)
    else map.set(position, [item])
  }
  return [...map.entries()].map(([position, items]) => ({
    position,
    items: items.slice(0, visibleLimit.value),
  }))
})

watch(
  () => ({
    toasterId: props.toasterId,
    position: props.position,
    duration: props.duration,
    closeButton: props.closeButton,
    richColors: props.richColors,
  }),
  (options, _, onCleanup) => {
    syncRsToasterHost(options.toasterId, hostToken, {
      position: options.position,
      duration: options.duration,
      closeButton: options.closeButton,
      richColors: options.richColors,
    })
    onCleanup(() => releaseRsToasterHost(options.toasterId, hostToken))
  },
  { immediate: true },
)

watch(
  () => props.hotkey,
  (spec, _, onCleanup) => {
    if (!spec || typeof window === 'undefined') return
    const onKey = (event: KeyboardEvent) => {
      if (!matchToastHotkey(event, spec) || isToastTypingTarget(event.target)) return
      hotkeyExpanded.value = true
      event.preventDefault()
      regionRef.value?.focus()
    }
    window.addEventListener('keydown', onKey)
    onCleanup(() => window.removeEventListener('keydown', onKey))
  },
  { immediate: true },
)

onUnmounted(() => {
  for (const swipe of swipes.values()) swipe.el.style.transform = ''
  swipes.clear()
})

function stackExpanded(position: RsToastPosition): boolean {
  return props.expand || hotkeyExpanded.value || openStack.value === position
}

function idsIn(position: RsToastPosition): string[] {
  return groups.value.find((group) => group.position === position)?.items.map((item) => item.id) ?? []
}

function hold(position: RsToastPosition): void {
  openStack.value = position
  if (!props.pauseOnHover) return
  for (const id of idsIn(position)) pauseRsToast(id, 'hover')
}

function release(position: RsToastPosition): void {
  if (openStack.value === position) openStack.value = null
  hotkeyExpanded.value = false
  if (!props.pauseOnHover) return
  for (const id of idsIn(position)) resumeRsToast(id, 'hover')
}

function onFocusOut(event: FocusEvent, position: RsToastPosition): void {
  const next = event.relatedTarget
  const current = event.currentTarget
  if (next instanceof Node && current instanceof Node && current.contains(next)) return
  release(position)
}

function showClose(item: RsToastRecord): boolean {
  return item.closeButton && item.dismissible
}

function onClose(item: RsToastRecord): void {
  if (!item.dismissible) return
  dismissRsToast(item.id)
}

function onAction(event: MouseEvent, item: RsToastRecord, kind: 'action' | 'cancel'): void {
  const button = kind === 'action' ? item.action : item.cancel
  try {
    button?.onClick?.(event)
  } finally {
    if (item.dismissible) dismissRsToast(item.id)
  }
}

function onToastKeydown(event: KeyboardEvent, item: RsToastRecord): void {
  if (event.key !== 'Escape' || !item.dismissible) return
  event.stopPropagation()
  dismissRsToast(item.id)
}

function onPointerDown(event: PointerEvent, item: RsToastRecord): void {
  if (!props.swipe || !item.dismissible || event.button !== 0) return
  const target = event.target
  if (target instanceof Element && target.closest('button, a')) return
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  swipes.set(item.id, { x: event.clientX, y: event.clientY, el })
  try {
    el.setPointerCapture(event.pointerId)
  } catch {
    // 指针已经失效时不挂 document 监听，卸载时清掉残留位移。
  }
  el.style.willChange = 'transform'
}

function onPointerMove(event: PointerEvent, item: RsToastRecord): void {
  const swipe = swipes.get(item.id)
  if (!swipe) return
  const dx = event.clientX - swipe.x
  const dy = event.clientY - swipe.y
  swipe.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
}

function endSwipe(item: RsToastRecord, dismiss: boolean): void {
  const swipe = swipes.get(item.id)
  if (!swipe) return
  swipe.el.style.transform = ''
  swipe.el.style.willChange = ''
  swipes.delete(item.id)
  if (dismiss && item.dismissible) dismissRsToast(item.id)
}

function onPointerUp(event: PointerEvent, item: RsToastRecord): void {
  const swipe = swipes.get(item.id)
  if (!swipe) return
  const dx = event.clientX - swipe.x
  const dy = event.clientY - swipe.y
  const passed = Math.hypot(dx, dy) >= RS_TOAST_SWIPE_PX
  endSwipe(item, passed)
}

function onPointerCancel(_event: PointerEvent, item: RsToastRecord): void {
  endSwipe(item, false)
}

defineExpose({
  /** 供模板 ref 关闭。业务侧通常用 useRsToast().dismiss。 */
  dismiss: (id?: string) => dismissRsToast(id),
})
</script>

<template>
  <Teleport :to="teleportTo">
    <div
      :id="id"
      ref="regionRef"
      class="rs-toaster"
      :style="rootStyle"
      role="region"
      tabindex="-1"
      :aria-label="regionLabel"
      :data-position="position"
      :data-rs-theme="theme"
      :data-rs-dir="textDir"
      :dir="textDir"
      :lang="locale"
    >
      <ol
        v-for="group in groups"
        :key="group.position"
        class="rs-toaster__viewport"
        :class="[
          `rs-toaster__viewport--${group.position}`,
          { 'rs-toaster__viewport--collapsed': !stackExpanded(group.position) },
        ]"
        :data-position="group.position"
        @mouseenter="hold(group.position)"
        @mouseleave="release(group.position)"
        @focusin="hold(group.position)"
        @focusout="onFocusOut($event, group.position)"
      >
        <li
          v-for="(item, index) in group.items"
          :id="item.id"
          :key="item.id"
          class="rs-toast"
          :class="[
            `rs-toast--${item.type}`,
            {
              'rs-toast--rich': item.richColors,
              'rs-toast--leaving': item.leaving,
              'rs-toast--front': index === 0,
            },
          ]"
          :style="{ '--rs-toast-index': String(index) }"
          :role="toastLiveRole(item.type)"
          :aria-live="toastAriaLive(item.type)"
          aria-atomic="true"
          :data-type="item.type"
          :data-visible="item.leaving ? 'false' : 'true'"
          @keydown="onToastKeydown($event, item)"
          @pointerdown="onPointerDown($event, item)"
          @pointermove="onPointerMove($event, item)"
          @pointerup="onPointerUp($event, item)"
          @pointercancel="onPointerCancel($event, item)"
        >
          <span class="rs-toast__icon" data-icon aria-hidden="true">
            <RsIcon :name="toastIconName(item.type)" :size="20" :spin="item.type === 'loading'" />
          </span>
          <div class="rs-toast__body" data-content>
            <p :id="`${item.id}-title`" class="rs-toast__title">{{ item.title }}</p>
            <p
              v-if="item.description"
              :id="`${item.id}-desc`"
              class="rs-toast__description"
              data-description
            >
              {{ item.description }}
            </p>
            <div v-if="item.action || item.cancel" class="rs-toast__actions" data-button>
              <button
                v-if="item.action"
                type="button"
                class="rs-toast__action"
                @click="onAction($event, item, 'action')"
              >
                {{ item.action.label }}
              </button>
              <button
                v-if="item.cancel"
                type="button"
                class="rs-toast__action rs-toast__action--secondary"
                @click="onAction($event, item, 'cancel')"
              >
                {{ item.cancel.label }}
              </button>
            </div>
          </div>
          <button
            v-if="showClose(item)"
            type="button"
            class="rs-toast__close"
            data-close-button
            :aria-label="closeLabel"
            @click="onClose(item)"
          >
            <RsIcon name="x" :size="12" />
          </button>
        </li>
      </ol>
    </div>
  </Teleport>
</template>

<style>
.rs-toaster {
  --rs-toaster-offset: var(--rs-space-lg);
  --rs-toaster-gap: var(--rs-space-xs);
  --rs-toast-radius: var(--rs-radius-lg, 1rem);
  --rs-toast-bg: color-mix(in srgb, var(--rs-surface-elevated) 88%, transparent);
  --rs-toast-border: color-mix(in srgb, var(--rs-border) 72%, transparent);
  --rs-toast-shadow: var(--rs-shadow-lg);
  position: fixed;
  z-index: var(--rs-z-toast);
  pointer-events: none;
  font-family: inherit;
  color: var(--rs-text);
}

.rs-toaster__viewport {
  position: fixed;
  z-index: var(--rs-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--rs-toaster-gap);
  width: max-content;
  max-width: calc(100vw - 1.5rem);
  margin: 0;
  padding: 0;
  list-style: none;
  pointer-events: none;
}

.rs-toaster__viewport--top-left {
  top: max(var(--rs-toaster-offset), env(safe-area-inset-top));
  left: max(var(--rs-toaster-offset), env(safe-area-inset-left));
}

.rs-toaster__viewport--top-right {
  top: max(var(--rs-toaster-offset), env(safe-area-inset-top));
  right: max(var(--rs-toaster-offset), env(safe-area-inset-right));
}

.rs-toaster__viewport--top-center {
  top: max(var(--rs-toaster-offset), env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.rs-toaster__viewport--bottom-left {
  bottom: max(var(--rs-toaster-offset), env(safe-area-inset-bottom));
  left: max(var(--rs-toaster-offset), env(safe-area-inset-left));
  flex-direction: column-reverse;
}

.rs-toaster__viewport--bottom-right {
  bottom: max(var(--rs-toaster-offset), env(safe-area-inset-bottom));
  right: max(var(--rs-toaster-offset), env(safe-area-inset-right));
  flex-direction: column-reverse;
}

.rs-toaster__viewport--bottom-center {
  bottom: max(var(--rs-toaster-offset), env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
  align-items: center;
}

.rs-toaster__viewport--collapsed {
  display: grid;
}

.rs-toaster__viewport--collapsed .rs-toast {
  grid-area: 1 / 1;
}

.rs-toaster__viewport--collapsed .rs-toast:not(.rs-toast--front) {
  pointer-events: none;
  transform: translateY(calc(var(--rs-toast-index) * 0.45rem)) scale(calc(1 - var(--rs-toast-index) * 0.04));
}

.rs-toaster__viewport--bottom-left.rs-toaster__viewport--collapsed .rs-toast:not(.rs-toast--front),
.rs-toaster__viewport--bottom-right.rs-toaster__viewport--collapsed .rs-toast:not(.rs-toast--front),
.rs-toaster__viewport--bottom-center.rs-toaster__viewport--collapsed .rs-toast:not(.rs-toast--front) {
  transform: translateY(calc(var(--rs-toast-index) * -0.45rem)) scale(calc(1 - var(--rs-toast-index) * 0.04));
}

.rs-toast {
  --rs-toast-accent: color-mix(in srgb, var(--rs-info) 68%, transparent);
  --rs-toast-tint: color-mix(in srgb, var(--rs-info) 7%, transparent);
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--rs-space-sm);
  row-gap: var(--rs-space-xs);
  width: max-content;
  min-width: min(19rem, calc(100vw - 1.5rem));
  max-width: min(29rem, calc(100vw - 1.5rem));
  margin: 0;
  padding-block: var(--rs-space-md);
  padding-inline: var(--rs-space-md) 2.25rem;
  border: 1px solid var(--rs-toast-border);
  border-radius: var(--rs-toast-radius);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 38%),
    linear-gradient(135deg, var(--rs-toast-tint), transparent 34%),
    var(--rs-toast-bg);
  color: var(--rs-text);
  box-shadow: var(--rs-toast-shadow);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  pointer-events: auto;
  list-style: none;
  transition:
    opacity var(--rs-transition-fast),
    transform var(--rs-transition-fast),
    box-shadow var(--rs-transition-normal);
}

.rs-toast::before {
  content: '';
  position: absolute;
  inset-inline-start: var(--rs-space-sm);
  inset-block: var(--rs-space-sm);
  width: 2px;
  border-radius: var(--rs-radius-full);
  background: var(--rs-toast-accent);
  pointer-events: none;
}

.rs-toast:has([data-description]) {
  align-items: start;
}

.rs-toast--leaving {
  opacity: 0;
}

.rs-toast__icon {
  grid-column: 1;
  grid-row: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--rs-info);
}

.rs-toast:has([data-description]) .rs-toast__icon {
  align-self: start;
  margin-top: 0.125rem;
}

.rs-toast__body {
  grid-column: 2;
  grid-row: 1;
  display: grid;
  gap: 0.1875rem;
  min-width: 0;
}

.rs-toast__actions {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
}

.rs-toast__title {
  margin: 0;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
}

.rs-toast__description {
  margin: 0;
  color: var(--rs-text-secondary, var(--rs-muted));
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.rs-toast__close {
  position: absolute;
  top: 50%;
  inset-inline-end: var(--rs-space-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--rs-radius-full);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  transform: translateY(-50%);
}

.rs-toast:has([data-description]) .rs-toast__close {
  top: var(--rs-space-sm);
  transform: none;
}

.rs-toast__close:hover {
  color: var(--rs-text);
  border-color: color-mix(in srgb, var(--rs-border) 68%, transparent);
  background: color-mix(in srgb, var(--rs-surface-hover, var(--rs-item-hover)) 70%, transparent);
}

.rs-toast__close:focus-visible,
.rs-toast__action:focus-visible,
.rs-toaster:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-toast__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--rs-control-height-sm);
  padding-inline: var(--rs-space-sm);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-full);
  background: var(--rs-primary);
  color: var(--rs-primary-foreground);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  line-height: 1;
  cursor: pointer;
}

.rs-toast__action--secondary {
  border-color: color-mix(in srgb, var(--rs-border) 72%, transparent);
  background: color-mix(in srgb, var(--rs-surface) 82%, transparent);
  color: var(--rs-text);
}

.rs-toast--success {
  --rs-toast-accent: color-mix(in srgb, var(--rs-success) 68%, transparent);
  --rs-toast-tint: color-mix(in srgb, var(--rs-success) 8%, transparent);
}

.rs-toast--success .rs-toast__icon {
  color: var(--rs-success);
}

.rs-toast--error {
  --rs-toast-accent: color-mix(in srgb, var(--rs-danger) 68%, transparent);
  --rs-toast-tint: color-mix(in srgb, var(--rs-danger) 8%, transparent);
}

.rs-toast--error .rs-toast__icon {
  color: var(--rs-danger);
}

.rs-toast--warning {
  --rs-toast-accent: color-mix(in srgb, var(--rs-warning) 72%, transparent);
  --rs-toast-tint: color-mix(in srgb, var(--rs-warning) 8%, transparent);
}

.rs-toast--warning .rs-toast__icon {
  color: var(--rs-warning);
}

.rs-toast--loading {
  --rs-toast-accent: color-mix(in srgb, var(--rs-primary) 68%, transparent);
  --rs-toast-tint: color-mix(in srgb, var(--rs-primary) 8%, transparent);
}

.rs-toast--loading .rs-toast__icon {
  color: var(--rs-primary);
}

.rs-toast--rich.rs-toast--success {
  background: color-mix(in srgb, var(--rs-success) 16%, var(--rs-surface-elevated));
  border-color: color-mix(in srgb, var(--rs-success) 42%, var(--rs-border));
}

.rs-toast--rich.rs-toast--error {
  background: color-mix(in srgb, var(--rs-danger) 16%, var(--rs-surface-elevated));
  border-color: color-mix(in srgb, var(--rs-danger) 42%, var(--rs-border));
}

.rs-toast--rich.rs-toast--warning {
  background: color-mix(in srgb, var(--rs-warning) 18%, var(--rs-surface-elevated));
  border-color: color-mix(in srgb, var(--rs-warning) 46%, var(--rs-border));
}

.rs-toast--rich.rs-toast--info,
.rs-toast--rich.rs-toast--default {
  background: color-mix(in srgb, var(--rs-info) 14%, var(--rs-surface-elevated));
  border-color: color-mix(in srgb, var(--rs-info) 40%, var(--rs-border));
}

@media (max-width: 640px) {
  .rs-toast {
    min-width: min(100%, 18.5rem);
    max-width: calc(100vw - 1rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-toast,
  .rs-toast__action,
  .rs-toast__close {
    transition: none;
  }

  .rs-toast {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .rs-toast {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--rs-surface-elevated);
  }
}
</style>
