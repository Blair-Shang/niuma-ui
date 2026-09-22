import type { ComputedRef, InjectionKey } from 'vue'

export const RS_SIDEBAR_ORIENTATIONS = ['vertical', 'horizontal'] as const
export const RS_SIDEBAR_PLACEMENTS = ['left', 'right'] as const
export const RS_SIDEBAR_WIDTHS = ['sm', 'md', 'lg'] as const

export type RsSidebarOrientation = (typeof RS_SIDEBAR_ORIENTATIONS)[number]
export type RsSidebarPlacement = (typeof RS_SIDEBAR_PLACEMENTS)[number]
export type RsSidebarWidth = (typeof RS_SIDEBAR_WIDTHS)[number]

export interface RsSidebarExpose {
  expand: () => void
  collapse: () => void
  toggle: () => void
  focus: () => void
}

export type RsSidebarInstance = RsSidebarExpose & { $el: HTMLElement }

export interface RsSidebarContext {
  collapsed: ComputedRef<boolean>
  orientation: ComputedRef<RsSidebarOrientation>
  placement: ComputedRef<RsSidebarPlacement>
}

export const RS_SIDEBAR_KEY: InjectionKey<RsSidebarContext> = Symbol('rs-sidebar')

export interface RsSidebarHotkeyLike {
  key: string
  altKey: boolean
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

export function isRsSidebarOrientation(value: unknown): value is RsSidebarOrientation {
  return typeof value === 'string' && (RS_SIDEBAR_ORIENTATIONS as readonly string[]).includes(value)
}

export function isRsSidebarPlacement(value: unknown): value is RsSidebarPlacement {
  return typeof value === 'string' && (RS_SIDEBAR_PLACEMENTS as readonly string[]).includes(value)
}

export function isRsSidebarWidth(value: unknown): value is RsSidebarWidth {
  return typeof value === 'string' && (RS_SIDEBAR_WIDTHS as readonly string[]).includes(value)
}

export function resolveRsSidebarOrientation(
  orientation?: RsSidebarOrientation | null,
): RsSidebarOrientation {
  return isRsSidebarOrientation(orientation) ? orientation : 'vertical'
}

export function resolveRsSidebarPlacement(placement?: RsSidebarPlacement | null): RsSidebarPlacement {
  return isRsSidebarPlacement(placement) ? placement : 'left'
}

export function resolveRsSidebarWidth(width?: RsSidebarWidth | null): RsSidebarWidth {
  return isRsSidebarWidth(width) ? width : 'md'
}

/** 显式 collapsed 优先；未传（undefined）才跟 Sidebar 注入。 */
export function resolveRsSidebarCollapsed(
  explicit?: boolean | null,
  inherited?: boolean | null,
): boolean {
  return explicit ?? Boolean(inherited)
}

/** href 优先；没有 href 时用 to，保证只传 to 的项仍是带地址的 a。 */
export function resolveRsSidebarItemHref(href?: string, to?: string): string | undefined {
  if (href) return href
  if (to) return to
  return undefined
}

export function resolveRsSidebarItemTag(href?: string): 'a' | 'button' {
  return href ? 'a' : 'button'
}

/** `_blank` 时补 noopener / noreferrer，并保留调用方已有 rel。 */
export function mergeRsSidebarLinkRel(
  rel: string | undefined,
  target: string | undefined,
): string | undefined {
  const parts = (rel ?? '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (target === '_blank') {
    if (!parts.includes('noopener')) parts.push('noopener')
    if (!parts.includes('noreferrer')) parts.push('noreferrer')
  }
  return parts.length > 0 ? parts.join(' ') : undefined
}

export function resolveRsSidebarCollapseIcon(
  orientation: RsSidebarOrientation,
  placement: RsSidebarPlacement,
  collapsed: boolean,
): string {
  if (orientation === 'horizontal') return collapsed ? 'chevron-down' : 'chevron-up'
  if (placement === 'right') return collapsed ? 'chevron-left' : 'chevron-right'
  return collapsed ? 'chevron-right' : 'chevron-left'
}

/** hotkey 取最后一段字母；修饰键固定为 Ctrl 或 Meta，忽略输入框。 */
export function matchesRsSidebarHotkey(event: RsSidebarHotkeyLike, hotkey: string): boolean {
  const key = hotkey.trim().split('+').pop()?.toLowerCase()
  if (!key) return false
  if (event.key.toLowerCase() !== key) return false
  if (event.altKey || event.shiftKey) return false
  return event.ctrlKey || event.metaKey
}

export function isRsSidebarTypingTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
}

export function hasRsSidebarBadge(badge: string | number | undefined | null): boolean {
  if (badge == null || badge === '') return false
  return badge !== 0
}
