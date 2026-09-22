/** Popover 弹出方位。left / right 是物理方向，不跟 RTL 对调。 */
export type RsPopoverSide = 'top' | 'right' | 'bottom' | 'left'

/** Popover 交叉轴对齐。横向 start / end 在 RTL 对调。 */
export type RsPopoverAlign = 'start' | 'center' | 'end'

/** Popover 内容宽度档位 */
export type RsPopoverWidth = 'sm' | 'md' | 'lg' | 'auto'

/** 打开方式。可组合，默认只有 click，和原来点一下开关一致。 */
export type RsPopoverTrigger = 'click' | 'hover' | 'focus'

/** 浮层挂载点。返回空时回到 document.body。 */
export type RsPopoverGetPopupContainer = (
  trigger?: HTMLElement,
) => HTMLElement | string | null | undefined

/** 宿主可调用的命令。 */
export interface RsPopoverExpose {
  open: () => void
  close: () => void
  toggle: () => void
  focus: () => void
}

export type RsPopoverInstance = RsPopoverExpose

/** hover 延迟上限，避免一个超大定时器一直挂着。 */
export const RS_POPOVER_DELAY_MAX = 60_000

const POPOVER_TRIGGERS = new Set<RsPopoverTrigger>(['click', 'hover', 'focus'])

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function normalizePopoverTriggers(
  trigger: RsPopoverTrigger | readonly RsPopoverTrigger[] | undefined,
): RsPopoverTrigger[] {
  const list = Array.isArray(trigger) ? trigger : [trigger ?? 'click']
  const next = list.filter((item): item is RsPopoverTrigger => POPOVER_TRIGGERS.has(item))
  return next.length ? next : ['click']
}

export function clampPopoverDelay(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback
  return Math.min(RS_POPOVER_DELAY_MAX, Math.max(0, value))
}

/** Tab 在浮层内循环。current < 0 时落到第一项或最后一项。 */
export function nextPopoverFocusIndex(count: number, current: number, shift: boolean): number {
  if (count <= 0) return -1
  if (current < 0) return shift ? count - 1 : 0
  const delta = shift ? -1 : 1
  return (current + delta + count) % count
}

export function resolvePopoverPortalTarget(
  getPopupContainer: RsPopoverGetPopupContainer | undefined,
  trigger?: HTMLElement | null,
): string | HTMLElement {
  if (typeof document === 'undefined') return 'body'
  if (!getPopupContainer) return 'body'
  return getPopupContainer(trigger ?? undefined) ?? 'body'
}

/** 组件 ref 可能是元素，也可能是带 $el 的实例。无 DOM 时返回空。 */
export function resolvePopoverElement(value: unknown): HTMLElement | null {
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value
  if (value && typeof value === 'object' && '$el' in value) {
    const root = (value as { $el?: unknown }).$el
    if (typeof HTMLElement !== 'undefined' && root instanceof HTMLElement) return root
  }
  return null
}

export function listPopoverFocusable(root: ParentNode | null | undefined): HTMLElement[] {
  if (!root || typeof root.querySelectorAll !== 'function') return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    if (typeof el.closest === 'function' && el.closest('[hidden]')) return false
    return true
  })
}
