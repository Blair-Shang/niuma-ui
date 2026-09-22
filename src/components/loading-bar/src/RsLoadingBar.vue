<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue'
import { RS_LOADING_BAR_KEY } from '../../../composables/useRsLoadingBar'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  advanceLoadingBar,
  clampLoadingBar,
  loadingBarHasTimerHost,
  nextLoadingBarInc,
  resolveLoadingBarAttach,
  resolveLoadingBarDelay,
  resolveLoadingBarDuration,
  resolveLoadingBarHeight,
  resolveLoadingBarPosition,
  resolveLoadingBarRange,
  resolveLoadingBarSpeed,
  resolveLoadingBarTone,
  RS_LOADING_BAR_DEFAULT_ERROR_MS,
  RS_LOADING_BAR_DEFAULT_FINISH_MS,
  RS_LOADING_BAR_DEFAULT_HEIGHT,
  type RsLoadingBarApi,
  type RsLoadingBarAttach,
  type RsLoadingBarPosition,
  type RsLoadingBarTone,
} from './loading-bar-utils'

defineOptions({ name: 'RsLoadingBar' })

const props = withDefaults(
  defineProps<{
    /** 受控进度 0–100。传入后显隐只跟这个值，命令式 API 不再改这条。 */
    progress?: number
    /** 条高（px）。默认 2，与 --rs-loading-bar-size 一致；未改默认时不写内联，方便覆盖 token。 */
    height?: number
    /** 进度色。未传走 tone / --rs-loading-bar-color。 */
    color?: string
    /** 失败色。未传走 --rs-loading-bar-error。 */
    errorColor?: string
    /** 色相。color 传入时以 color 为准。 */
    tone?: RsLoadingBarTone
    /** 贴上沿或下沿。 */
    position?: RsLoadingBarPosition
    /** viewport 固定在窗口；parent 绝对定位到最近的定位祖先。 */
    attach?: RsLoadingBarAttach
    /** 是否自动向 maximum 蠕动。 */
    trickle?: boolean
    /** trickle 间隔（ms）。小于 16 回落 200。 */
    trickleSpeed?: number
    /** start 的起步进度。 */
    minimum?: number
    /** trickle 停住的上限，finish 才会到 100。 */
    maximum?: number
    /** 短请求不闪条。delay 内 finish 则从不显示。0 与历史行为一致。 */
    delay?: number
    /** finish 后淡出毫秒。 */
    finishDuration?: number
    /** error 后淡出毫秒。 */
    errorDuration?: number
    /** 重叠的 start/finish 计数。默认关闭，每次 start 仍会回到 minimum。 */
    nesting?: boolean
    /** 未知进度：滑动条，不报 aria-valuenow。 */
    indeterminate?: boolean
    /** 覆盖可访问名称。未传走 loadingBar.label / loadingBar.error。 */
    ariaLabel?: string
    id?: string
  }>(),
  {
    height: RS_LOADING_BAR_DEFAULT_HEIGHT,
    tone: 'primary',
    position: 'top',
    attach: 'viewport',
    trickle: true,
    trickleSpeed: 200,
    minimum: 8,
    maximum: 92,
    delay: 0,
    finishDuration: RS_LOADING_BAR_DEFAULT_FINISH_MS,
    errorDuration: RS_LOADING_BAR_DEFAULT_ERROR_MS,
    nesting: false,
    indeterminate: false,
  },
)

const emit = defineEmits<{
  /** 每次 start。参数是当前未完成计数（未开 nesting 时为 1）。 */
  start: [pending: number]
  /** 一次 finish。参数是剩余计数，0 表示条将淡出。 */
  finish: [pending: number]
  error: []
  /** 展示进度的整数变化。受控 progress 不回写。 */
  change: [progress: number]
}>()

const { t } = useRsI18n()

const internalProgress = ref(0)
const visible = ref(false)
const errored = ref(false)

let pending = 0
let waiting = false
let lastPublished = -1
let trickleTimer: ReturnType<Window['setInterval']> | null = null
let hideTimer: ReturnType<Window['setTimeout']> | null = null
let delayTimer: ReturnType<Window['setTimeout']> | null = null

const tone = computed(() => resolveLoadingBarTone(props.tone))
const position = computed(() => resolveLoadingBarPosition(props.position))
const attach = computed(() => resolveLoadingBarAttach(props.attach))
const controlled = computed(() => props.progress !== undefined)
const indeterminateActive = computed(
  () => props.indeterminate && !controlled.value && !errored.value,
)

const displayProgress = computed(() =>
  controlled.value ? clampLoadingBar(props.progress ?? 0) : internalProgress.value,
)

const label = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (errored.value) return t('loadingBar.error')
  if (indeterminateActive.value) return t('loadingBar.indeterminate')
  return t('loadingBar.label')
})

const valueNow = computed(() => {
  if (!visible.value || indeterminateActive.value) return undefined
  return Math.round(displayProgress.value)
})

const valueText = computed(() => {
  if (!visible.value) return undefined
  if (errored.value) return t('loadingBar.error')
  if (indeterminateActive.value) return t('loadingBar.indeterminate')
  return undefined
})

const rootStyle = computed(() => {
  const style: Record<string, string> = {}
  const height = resolveLoadingBarHeight(props.height)
  if (height !== RS_LOADING_BAR_DEFAULT_HEIGHT) {
    style['--rs-loading-bar-size'] = `${height}px`
  }
  if (props.color) style['--rs-loading-bar-color'] = props.color
  if (props.errorColor) style['--rs-loading-bar-error'] = props.errorColor
  if (!indeterminateActive.value) {
    style['--rs-loading-bar-progress'] = `${displayProgress.value}%`
  }
  return style
})

function timerHost(): Window | null {
  if (typeof window === 'undefined') return null
  return loadingBarHasTimerHost(window) ? window : null
}

function publish(value: number): void {
  if (controlled.value || props.indeterminate) return
  const rounded = Math.round(value)
  if (rounded === lastPublished) return
  lastPublished = rounded
  emit('change', rounded)
}

function clearTrickle(): void {
  const host = timerHost()
  if (trickleTimer !== null && host) host.clearInterval(trickleTimer)
  trickleTimer = null
}

function clearHide(): void {
  const host = timerHost()
  if (hideTimer !== null && host) host.clearTimeout(hideTimer)
  hideTimer = null
}

function clearDelay(): void {
  const host = timerHost()
  if (delayTimer !== null && host) host.clearTimeout(delayTimer)
  delayTimer = null
  waiting = false
}

function clearTimers(): void {
  clearTrickle()
  clearHide()
  clearDelay()
}

function armHide(ms: number, done: () => void): void {
  clearHide()
  const host = timerHost()
  if (!host) {
    done()
    return
  }
  hideTimer = host.setTimeout(() => {
    hideTimer = null
    done()
  }, ms)
}

function hideLater(ms: number): void {
  armHide(ms, () => {
    visible.value = false
    errored.value = false
    internalProgress.value = 0
    lastPublished = -1
  })
}

function ensureTrickle(): void {
  if (controlled.value || !props.trickle || props.indeterminate) {
    clearTrickle()
    return
  }
  const { maximum } = resolveLoadingBarRange(props.minimum, props.maximum)
  if (internalProgress.value >= maximum) {
    clearTrickle()
    return
  }
  if (trickleTimer) return
  const host = timerHost()
  if (!host) return
  trickleTimer = host.setInterval(() => {
    const cap = resolveLoadingBarRange(props.minimum, props.maximum).maximum
    if (internalProgress.value >= cap) {
      clearTrickle()
      return
    }
    const next = advanceLoadingBar(internalProgress.value, cap)
    internalProgress.value = next
    publish(next)
    if (next >= cap) clearTrickle()
  }, resolveLoadingBarSpeed(props.trickleSpeed))
}

function reveal(value: number): void {
  errored.value = false
  visible.value = true
  if (props.indeterminate) {
    clearTrickle()
    return
  }
  internalProgress.value = value
  publish(value)
  ensureTrickle()
}

function complete(erroredNext: boolean): void {
  pending = 0
  waiting = false
  clearTrickle()
  clearDelay()
  errored.value = erroredNext
  visible.value = true
  if (!props.indeterminate || erroredNext) {
    internalProgress.value = 100
    if (!props.indeterminate) publish(100)
  }
  hideLater(
    resolveLoadingBarDuration(
      erroredNext ? props.errorDuration : props.finishDuration,
      erroredNext ? RS_LOADING_BAR_DEFAULT_ERROR_MS : RS_LOADING_BAR_DEFAULT_FINISH_MS,
    ),
  )
}

function start(): void {
  if (controlled.value) return
  clearHide()
  errored.value = false
  if (props.nesting && pending > 0) {
    pending += 1
    emit('start', pending)
    return
  }
  pending = 1
  clearTrickle()
  clearDelay()
  const delay = resolveLoadingBarDelay(props.delay)
  const minimum = resolveLoadingBarRange(props.minimum, props.maximum).minimum
  if (delay > 0) {
    const host = timerHost()
    if (!host) {
      reveal(minimum)
      emit('start', pending)
      return
    }
    waiting = true
    delayTimer = host.setTimeout(() => {
      delayTimer = null
      waiting = false
      if (pending <= 0) return
      reveal(minimum)
    }, delay)
    emit('start', pending)
    return
  }
  reveal(minimum)
  emit('start', pending)
}

function finish(): void {
  if (controlled.value) return
  if (props.nesting && pending > 1) {
    pending -= 1
    emit('finish', pending)
    return
  }
  if (waiting) {
    clearDelay()
    pending = 0
    emit('finish', 0)
    return
  }
  complete(false)
  emit('finish', 0)
}

function error(): void {
  if (controlled.value) return
  complete(true)
  emit('error')
}

function set(progress: number): void {
  if (controlled.value || props.indeterminate) return
  const next = clampLoadingBar(progress)
  clearHide()
  clearDelay()
  errored.value = false
  if (next >= 100) {
    complete(false)
    emit('finish', 0)
    return
  }
  if (next <= 0) {
    pending = 0
    clearTrickle()
    visible.value = false
    internalProgress.value = 0
    publish(0)
    return
  }
  if (pending === 0) pending = 1
  visible.value = true
  internalProgress.value = next
  publish(next)
  ensureTrickle()
}

function inc(amount?: number): void {
  if (controlled.value || props.indeterminate) return
  if (pending <= 0 && !visible.value) {
    start()
    return
  }
  set(nextLoadingBarInc(internalProgress.value, amount))
}

function getProgress(): number {
  return Math.round(displayProgress.value)
}

function isStarted(): boolean {
  return pending > 0
}

const api = shallowRef<RsLoadingBarApi | null>({
  start,
  finish,
  error,
  set,
  inc,
  getProgress,
  isStarted,
})
provide(RS_LOADING_BAR_KEY, api)

watch(
  () => props.progress,
  (value) => {
    if (value === undefined) return
    clearHide()
    clearTrickle()
    const next = clampLoadingBar(value)
    if (next <= 0) {
      visible.value = false
      return
    }
    visible.value = true
    if (next >= 100) {
      hideLater(resolveLoadingBarDuration(props.finishDuration, RS_LOADING_BAR_DEFAULT_FINISH_MS))
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimers()
  pending = 0
  api.value = null
})

defineExpose<RsLoadingBarApi>({
  start,
  finish,
  error,
  set,
  inc,
  getProgress,
  isStarted,
})
</script>

<template>
  <!--
    默认插槽内的后代可通过 useRsLoadingBar() 获取 API。
    进度条 fixed / absolute，不参与布局。
  -->
  <div
    :id="id || undefined"
    class="rs-loading-bar"
    :class="{
      'rs-loading-bar--visible': visible,
      'rs-loading-bar--bottom': position === 'bottom',
      'rs-loading-bar--parent': attach === 'parent',
      'rs-loading-bar--error': errored,
      'rs-loading-bar--indeterminate': indeterminateActive,
      [`rs-loading-bar--${tone}`]: true,
    }"
    :style="rootStyle"
    :role="visible ? 'progressbar' : undefined"
    :aria-hidden="visible ? undefined : 'true'"
    :aria-label="visible ? label : undefined"
    :aria-valuemin="valueNow !== undefined ? 0 : undefined"
    :aria-valuemax="valueNow !== undefined ? 100 : undefined"
    :aria-valuenow="valueNow"
    :aria-valuetext="valueText"
  >
    <div class="rs-loading-bar__peg" />
  </div>
  <slot />
</template>

<style scoped>
.rs-loading-bar {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: var(--rs-z-loading-bar);
  height: var(--rs-loading-bar-size, 2px);
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--rs-transition-normal);
}

.rs-loading-bar--bottom {
  inset-block-start: auto;
  inset-block-end: 0;
}

.rs-loading-bar--parent {
  position: absolute;
}

.rs-loading-bar--visible {
  opacity: 1;
}

.rs-loading-bar--neutral {
  --rs-loading-bar-color: var(--rs-text-secondary);
}

.rs-loading-bar--info {
  --rs-loading-bar-color: var(--rs-info);
}

.rs-loading-bar--success {
  --rs-loading-bar-color: var(--rs-success);
}

.rs-loading-bar--warning {
  --rs-loading-bar-color: var(--rs-warning);
}

.rs-loading-bar--danger {
  --rs-loading-bar-color: var(--rs-danger);
}

.rs-loading-bar__peg {
  height: 100%;
  width: var(--rs-loading-bar-progress, 0%);
  background-color: var(--rs-loading-bar-color, var(--rs-primary));
  transition:
    width var(--rs-transition-normal),
    background-color var(--rs-transition-normal);
}

.rs-loading-bar--error .rs-loading-bar__peg {
  background-color: var(--rs-loading-bar-error, var(--rs-danger));
}

.rs-loading-bar--indeterminate .rs-loading-bar__peg {
  position: absolute;
  inset-block: 0;
  width: 38%;
  transition: none;
  animation: rs-loading-bar-slide 1.15s ease-in-out infinite;
}

@keyframes rs-loading-bar-slide {
  from {
    inset-inline-start: -40%;
  }
  to {
    inset-inline-start: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-loading-bar,
  .rs-loading-bar__peg {
    transition: none;
    animation: none;
  }

  .rs-loading-bar--indeterminate .rs-loading-bar__peg {
    width: 100%;
    inset-inline-start: 0;
  }
}

@media (forced-colors: active) {
  .rs-loading-bar__peg {
    forced-color-adjust: none;
    background-color: Highlight;
  }

  .rs-loading-bar--error .rs-loading-bar__peg {
    background-color: Mark;
  }
}
</style>
