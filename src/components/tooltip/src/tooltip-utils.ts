import type { InjectionKey } from 'vue'

export const RS_TOOLTIP_SIDES = ['top', 'right', 'bottom', 'left'] as const
export const RS_TOOLTIP_ALIGNS = ['start', 'center', 'end'] as const

export type RsTooltipSide = (typeof RS_TOOLTIP_SIDES)[number]
export type RsTooltipAlign = (typeof RS_TOOLTIP_ALIGNS)[number]

export const RS_TOOLTIP_DEFAULT_DELAY = 300
export const RS_TOOLTIP_DEFAULT_SKIP_DELAY = 0
export const RS_TOOLTIP_MAX_DELAY_MS = 60_000
/** 指针从触发器移到气泡的空隙。关掉 interactive 时为 0。 */
export const RS_TOOLTIP_POINTER_GRACE_MS = 120

export type RsTooltipGetContainer = () => HTMLElement | null | undefined

export interface RsTooltipExpose {
  open: () => void
  close: () => void
}

/** 模板 ref：expose。根在非图标模式下是 display:contents，不把 $el 当布局盒。 */
export type RsTooltipInstance = RsTooltipExpose

export interface RsTooltipGroup {
  readonly delayDuration: number
  readonly skipDelayDuration: number
  readonly ignoreNonKeyboardFocus: boolean
  shouldSkipDelay: () => boolean
  notifyOpen: () => void
  notifyClose: () => void
}

export const rsTooltipGroupKey: InjectionKey<RsTooltipGroup> = Symbol('rs-tooltip-group')

export function clampTooltipDelay(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(RS_TOOLTIP_MAX_DELAY_MS, Math.max(0, value))
}

export function tooltipCssLength(value: number | string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`
  const text = String(value).trim()
  return text || '0px'
}

/** ignore 为 true 时只认 :focus-visible，避免对话框回焦误开。 */
export function isKeyboardFocusVisible(el: EventTarget | null, ignoreNonKeyboardFocus: boolean): boolean {
  if (!(el instanceof Element)) return false
  if (!ignoreNonKeyboardFocus) return true
  try {
    return el.matches(':focus-visible')
  } catch {
    return false
  }
}
