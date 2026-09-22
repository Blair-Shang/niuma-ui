/** 加载指示器尺寸。不是表单控件四档，不跟 ConfigProvider。 */
export type RsLoadingSize = 'sm' | 'md' | 'lg'

/**
 * 色相。`default` 是旧调用，画面与 `neutral` 相同。
 * 形态仍由 variant 决定。
 */
export type RsLoadingTone =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

/** 加载指示器形态。 */
export type RsLoadingVariant = 'spinner' | 'dots' | 'skeleton'

const SIZES = new Set<RsLoadingSize>(['sm', 'md', 'lg'])
const TONES = new Set<RsLoadingTone>([
  'default',
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
])
const VARIANTS = new Set<RsLoadingVariant>(['spinner', 'dots', 'skeleton'])

/** 骨架行上限，避免一次挂出过多无限动画节点。 */
export const RS_LOADING_SKELETON_MAX = 12

/** delay / minDuration 上限（毫秒）。非法值或非有限数视为 0。 */
export const RS_LOADING_MAX_MS = 60_000

export function resolveRsLoadingSize(size?: string | null): RsLoadingSize {
  if (size && SIZES.has(size as RsLoadingSize)) return size as RsLoadingSize
  return 'md'
}

export function resolveRsLoadingTone(tone?: string | null): RsLoadingTone {
  if (tone && TONES.has(tone as RsLoadingTone)) return tone as RsLoadingTone
  return 'primary'
}

export function resolveRsLoadingVariant(variant?: string | null): RsLoadingVariant {
  if (variant && VARIANTS.has(variant as RsLoadingVariant)) return variant as RsLoadingVariant
  return 'spinner'
}

export function resolveRsLoadingSkeletonCount(lines: number | undefined, fallback = 4): number {
  const raw = typeof lines === 'number' && Number.isFinite(lines) ? Math.floor(lines) : fallback
  return Math.min(RS_LOADING_SKELETON_MAX, Math.max(1, raw))
}

export function clampRsLoadingDuration(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  return Math.min(value, RS_LOADING_MAX_MS)
}

export type RsLoadingVisibilityPlan =
  | { action: 'show'; shownAt: number }
  | { action: 'hide' }
  | { action: 'idle' }
  | { action: 'keep' }
  | { action: 'wait'; ms: number; then: 'show' | 'hide' }

/**
 * 纯函数：决定指示器现在出现、消失，还是再等一会儿。
 * 组件负责定时器，并在卸载时清掉。
 */
export function planRsLoadingVisibility(input: {
  loading: boolean
  visible: boolean
  delayMs: number
  minDurationMs: number
  shownAt: number | null
  now: number
}): RsLoadingVisibilityPlan {
  const delay = clampRsLoadingDuration(input.delayMs)
  const minDuration = clampRsLoadingDuration(input.minDurationMs)

  if (input.loading) {
    if (input.visible) return { action: 'keep' }
    if (delay <= 0) return { action: 'show', shownAt: input.now }
    return { action: 'wait', ms: delay, then: 'show' }
  }

  if (!input.visible) return { action: 'idle' }
  if (input.shownAt == null || minDuration <= 0) return { action: 'hide' }

  const remaining = minDuration - (input.now - input.shownAt)
  if (remaining <= 0) return { action: 'hide' }
  return { action: 'wait', ms: remaining, then: 'hide' }
}

function isElementNode(value: unknown): value is HTMLElement {
  return Boolean(value) && typeof value === 'object' && (value as { nodeType?: number }).nodeType === 1
}

/** 全屏传送目标。非全屏不调用 getContainer。失败或空节点回退 body。 */
export function resolveRsLoadingTeleportTarget(
  fullscreen: boolean,
  getContainer?: () => HTMLElement | string | null,
): string | HTMLElement {
  if (!fullscreen || !getContainer) return 'body'
  try {
    const target = getContainer()
    if (typeof target === 'string' && target.trim()) return target
    if (isElementNode(target)) return target
  } catch {
    return 'body'
  }
  return 'body'
}

let lockCount = 0
let previousOverflow: string | null = null
let previousPointer: string | null = null
let previousBusy: string | null = null

/**
 * 全屏锁滚动，并暂时挡住页面点击。引用计数，释放函数可重复调用。
 * 不改焦点陷阱。无 document 时返回空操作（SSR）。
 */
export function acquireRsLoadingScrollLock(): () => void {
  if (typeof document === 'undefined' || !document.body) return () => {}
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    previousPointer = document.body.style.pointerEvents
    previousBusy = document.documentElement.getAttribute('aria-busy')
    document.body.style.overflow = 'hidden'
    document.body.style.pointerEvents = 'none'
    document.documentElement.setAttribute('aria-busy', 'true')
  }
  lockCount += 1
  let released = false
  return () => {
    if (released) return
    released = true
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0 && document.body) {
      document.body.style.overflow = previousOverflow ?? ''
      document.body.style.pointerEvents = previousPointer ?? ''
      if (previousBusy == null) document.documentElement.removeAttribute('aria-busy')
      else document.documentElement.setAttribute('aria-busy', previousBusy)
      previousOverflow = null
      previousPointer = null
      previousBusy = null
    }
  }
}

/** 单测收尾。生产路径靠释放函数把计数减到 0。 */
export function resetRsLoadingScrollLock(): void {
  lockCount = 0
  previousOverflow = null
  previousPointer = null
  previousBusy = null
}
