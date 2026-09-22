import type { RsToastPosition, RsToastType } from '../../_shared/src/overlay-utils'

/** 未传 duration 时的自动关闭（ms）。 */
export const RS_TOAST_DEFAULT_DURATION = 4000

/** 同一方位同时画在页面上的条数。 */
export const RS_TOAST_DEFAULT_VISIBLE = 3

/** 每个宿主在内存里最多保留的条数，防止循环调用把队列撑满。 */
export const RS_TOAST_MAX = 24

/** 离场过渡。减少动态时为 0，节点马上卸掉。 */
export const RS_TOAST_LEAVE_MS = 180

/** 滑动超过该距离才关闭。 */
export const RS_TOAST_SWIPE_PX = 72

export type RsToastKind = RsToastType | 'loading' | 'default'

export interface RsToastAction {
  label: string
  onClick?: (event: MouseEvent) => void
}

export interface RsToastOptions {
  title: string
  description?: string
  position?: RsToastPosition
  /** 毫秒。0 或 Infinity 表示不自动关闭。未传则用宿主默认。 */
  duration?: number
  id?: string
  toasterId?: string
  dismissible?: boolean
  closeButton?: boolean
  richColors?: boolean
  action?: RsToastAction
  cancel?: RsToastAction
  onDismiss?: (id: string) => void
  onAutoClose?: (id: string) => void
}

export type RsToastInput = string | RsToastOptions

export type RsToastPromiseMessage<T> = string | RsToastOptions | ((value: T) => string | RsToastOptions)

export interface RsToastPromiseMessages<T> {
  loading: string | RsToastOptions
  success?: RsToastPromiseMessage<T>
  error?: RsToastPromiseMessage<unknown>
  id?: string
  toasterId?: string
}

export function normalizeRsToastInput(input: RsToastInput): RsToastOptions {
  if (typeof input === 'string') return { title: input }
  return input
}

export function normalizePromiseMessage<T>(
  message: RsToastPromiseMessage<T> | undefined,
  value: T,
): RsToastOptions | null {
  if (message == null) return null
  const resolved = typeof message === 'function' ? message(value) : message
  if (typeof resolved === 'string') return { title: resolved }
  return resolved
}

/** 未传走 fallback；≤0 或非有限数表示常驻。 */
export function resolveRsToastDuration(duration: number | undefined, fallback: number): number {
  if (duration == null || Number.isNaN(duration)) {
    return resolveRsToastDuration(fallback, RS_TOAST_DEFAULT_DURATION)
  }
  if (duration <= 0 || !Number.isFinite(duration)) return Number.POSITIVE_INFINITY
  return duration
}

export function shouldArmToastTimer(duration: number, hasWindow: boolean): boolean {
  return hasWindow && Number.isFinite(duration) && duration > 0
}

export function clampVisibleToasts(value: number | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 1) return RS_TOAST_DEFAULT_VISIBLE
  return Math.min(RS_TOAST_MAX, Math.floor(value))
}

export function clampToastGap(value: number | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 4
  return value
}

/** 最新在前。超出上限时丢掉队尾。 */
export function trimToastList<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items
  return items.slice(0, max)
}

export function resolveToastPosition(
  item: RsToastPosition | undefined,
  host: RsToastPosition,
): RsToastPosition {
  return item ?? host
}

export function toastLiveRole(type: RsToastKind): 'alert' | 'status' {
  return type === 'error' ? 'alert' : 'status'
}

export function toastAriaLive(type: RsToastKind): 'assertive' | 'polite' {
  return type === 'error' ? 'assertive' : 'polite'
}

export function toastIconName(type: RsToastKind): string {
  switch (type) {
    case 'success':
      return 'circle-check'
    case 'error':
      return 'circle-alert'
    case 'warning':
      return 'triangle-alert'
    case 'loading':
      return 'loader-circle'
    default:
      return 'info'
  }
}

export function prefersReducedToastMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function toastLeaveDelay(): number {
  return prefersReducedToastMotion() ? 0 : RS_TOAST_LEAVE_MS
}

export function isToastTypingTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** `alt+t` 这种写法。空字符串表示不注册快捷键。 */
export function matchToastHotkey(event: KeyboardEvent, spec: string | undefined): boolean {
  if (!spec || event.repeat) return false
  const parts = spec
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return false
  const key = parts[parts.length - 1]
  const needAlt = parts.includes('alt')
  const needCtrl = parts.includes('ctrl') || parts.includes('control')
  const needShift = parts.includes('shift')
  const needMeta = parts.includes('meta')
  if (event.altKey !== needAlt || event.ctrlKey !== needCtrl) return false
  if (event.shiftKey !== needShift || event.metaKey !== needMeta) return false
  return event.key.toLowerCase() === key
}

export function errorToastText(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error && error.message) return error.message
  return ''
}
