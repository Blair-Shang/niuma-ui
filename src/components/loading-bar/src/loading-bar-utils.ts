/** 色相。未传走 primary，对应 --rs-loading-bar-color。 */
export type RsLoadingBarTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/** 贴视口上沿或下沿。 */
export type RsLoadingBarPosition = 'top' | 'bottom'

/** viewport 相对窗口 fixed；parent 相对最近定位祖先 absolute。 */
export type RsLoadingBarAttach = 'viewport' | 'parent'

/** 命令式 API。useRsLoadingBar 与组件 ref 同一套方法。 */
export interface RsLoadingBarExpose {
  /** 开始。默认把进度拉到 minimum 并 trickle。nesting 时重复调用只加计数。 */
  start: () => void
  /** 结束。默认补到 100 后淡出。nesting 时计数归零才淡出。 */
  finish: () => void
  /** 失败。清计数，用错误色补到 100 后淡出。 */
  error: () => void
  /** 把未受控进度设到 0–100。100 等同结束，0 立刻隐藏。 */
  set: (progress: number) => void
  /** 在当前进度上增加。未开始时等同 start，不会加到 100。 */
  inc: (amount?: number) => void
  /** 当前展示进度（四舍五入）。未开始为 0。 */
  getProgress: () => number
  /** 是否仍有未结束的 start（含 delay 等待、nesting 计数）。淡出过程中为 false。 */
  isStarted: () => boolean
}

export type RsLoadingBarApi = RsLoadingBarExpose

export type RsLoadingBarInstance = RsLoadingBarExpose & { $el: HTMLElement }

export const RS_LOADING_BAR_TONES = [
  'primary',
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
] as const

export const RS_LOADING_BAR_POSITIONS = ['top', 'bottom'] as const

export const RS_LOADING_BAR_ATTACHES = ['viewport', 'parent'] as const

export const RS_LOADING_BAR_DEFAULT_HEIGHT = 2
export const RS_LOADING_BAR_DEFAULT_MINIMUM = 8
export const RS_LOADING_BAR_DEFAULT_MAXIMUM = 92
export const RS_LOADING_BAR_DEFAULT_SPEED = 200
export const RS_LOADING_BAR_DEFAULT_FINISH_MS = 280
export const RS_LOADING_BAR_DEFAULT_ERROR_MS = 400
/** inc 停在 100 以下，避免没调用 finish 就当成完成。 */
export const RS_LOADING_BAR_INC_CAP = 99.4

export function clampLoadingBar(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function isRsLoadingBarTone(value: unknown): value is RsLoadingBarTone {
  return typeof value === 'string' && (RS_LOADING_BAR_TONES as readonly string[]).includes(value)
}

export function isRsLoadingBarPosition(value: unknown): value is RsLoadingBarPosition {
  return typeof value === 'string' && (RS_LOADING_BAR_POSITIONS as readonly string[]).includes(value)
}

export function isRsLoadingBarAttach(value: unknown): value is RsLoadingBarAttach {
  return typeof value === 'string' && (RS_LOADING_BAR_ATTACHES as readonly string[]).includes(value)
}

export function resolveLoadingBarTone(tone?: string | null): RsLoadingBarTone {
  return isRsLoadingBarTone(tone) ? tone : 'primary'
}

export function resolveLoadingBarPosition(position?: string | null): RsLoadingBarPosition {
  return isRsLoadingBarPosition(position) ? position : 'top'
}

export function resolveLoadingBarAttach(attach?: string | null): RsLoadingBarAttach {
  return isRsLoadingBarAttach(attach) ? attach : 'viewport'
}

/** 非正数或非法回落 2，与历史默认高度一致。 */
export function resolveLoadingBarHeight(height?: number | null): number {
  if (typeof height !== 'number' || !Number.isFinite(height) || height <= 0) {
    return RS_LOADING_BAR_DEFAULT_HEIGHT
  }
  return height
}

/**
 * trickle 上限与起步值。minimum 大于 maximum 时把起步压到上限，避免一启动就停住。
 */
export function resolveLoadingBarRange(
  minimum?: number | null,
  maximum?: number | null,
): { minimum: number; maximum: number } {
  const min = typeof minimum === 'number' && Number.isFinite(minimum)
    ? clampLoadingBar(minimum)
    : RS_LOADING_BAR_DEFAULT_MINIMUM
  const max = typeof maximum === 'number' && Number.isFinite(maximum)
    ? clampLoadingBar(maximum)
    : RS_LOADING_BAR_DEFAULT_MAXIMUM
  return { minimum: Math.min(min, max), maximum: max }
}

/** 低于 16ms 视为误传，回落 200，避免 0 间隔打满主线程。 */
export function resolveLoadingBarSpeed(speed?: number | null): number {
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < 16) {
    return RS_LOADING_BAR_DEFAULT_SPEED
  }
  return speed
}

export function resolveLoadingBarDelay(delay?: number | null): number {
  if (typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0) return 0
  return delay
}

export function resolveLoadingBarDuration(duration: number | null | undefined, fallback: number): number {
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) return fallback
  return duration
}

/**
 * 与历史 trickle 相同：步长为剩余距离的 8%，至少 0.5，不超过 ceiling。
 */
export function advanceLoadingBar(current: number, ceiling: number): number {
  const value = clampLoadingBar(current)
  const cap = clampLoadingBar(ceiling)
  if (value >= cap) return value
  const step = Math.max(0.5, (cap - value) * 0.08)
  return Math.min(cap, value + step)
}

/**
 * 未知增量时越接近完成步长越小（NProgress 的 0–1 标度换成 0–100）。
 * 结果不超过 INC_CAP，把「到 100」留给 finish / error / set。
 */
export function nextLoadingBarInc(current: number, amount?: number): number {
  const value = clampLoadingBar(current)
  if (value >= 100) return 100
  let step = amount
  if (typeof step !== 'number' || !Number.isFinite(step)) {
    if (value < 20) step = 10
    else if (value < 50) step = 4
    else if (value < 80) step = 2
    else if (value < 99) step = 0.5
    else step = 0
  }
  return Math.min(RS_LOADING_BAR_INC_CAP, Math.max(0, value + step))
}

/** SSR / 无 window 时不排定时器。 */
export function loadingBarHasTimerHost(host: unknown): host is Pick<Window, 'setTimeout' | 'setInterval' | 'clearTimeout' | 'clearInterval'> {
  if (!host || typeof host !== 'object') return false
  const candidate = host as {
    setTimeout?: unknown
    setInterval?: unknown
    clearTimeout?: unknown
    clearInterval?: unknown
  }
  return (
    typeof candidate.setTimeout === 'function' &&
    typeof candidate.setInterval === 'function' &&
    typeof candidate.clearTimeout === 'function' &&
    typeof candidate.clearInterval === 'function'
  )
}
