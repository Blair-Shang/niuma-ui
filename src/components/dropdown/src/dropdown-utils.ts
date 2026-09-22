import type {
  RsOverlayAnchorBox,
  RsOverlayBox,
  RsOverlayPopupSize,
  RsOverlayViewport,
} from '../../_shared/src/overlay-utils'

export interface RsDropdownItem {
  label: string
  value: string
  icon?: string
  /** 次要说明，工具条动作菜单等场景使用 */
  hint?: string
  disabled?: boolean
  /** divider 只画分隔线，不参与选中 */
  type?: 'item' | 'divider'
  /** danger 用于删除等破坏性命令 */
  tone?: RsDropdownTone
  href?: string
  target?: string
  rel?: string
  /** 展示用快捷键，不代绑全局热键 */
  shortcut?: string
  children?: RsDropdownItem[]
}

export interface RsDropdownItemGroup {
  label: string
  options: RsDropdownItem[]
}

export type RsDropdownItems = RsDropdownItem[] | RsDropdownItemGroup[]

/** 菜单宽度：trigger 对齐触发器；fit 随内容，不跟窄图标按钮 */
export type RsDropdownContentWidth = 'trigger' | 'fit'

export type RsDropdownTrigger = 'click' | 'hover' | 'contextmenu'

export type RsDropdownPlacement =
  | 'bottom'
  | 'top'
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'

export type RsDropdownTone = 'neutral' | 'danger'

export type RsDropdownGetPopupContainer = (
  trigger?: HTMLElement,
) => HTMLElement | null | undefined

export interface RsDropdownExpose {
  open: () => void
  close: () => void
  focus: () => void
  blur: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsDropdownInstance = RsDropdownExpose & { $el: HTMLElement }

export interface RsDropdownItemSlot {
  item: RsDropdownItem
  selected: boolean
  highlighted: boolean
}

export function isDropdownItemGroup(
  item: RsDropdownItem | RsDropdownItemGroup,
): item is RsDropdownItemGroup {
  return 'options' in item && Array.isArray(item.options)
}

export function isDropdownDivider(item: RsDropdownItem): boolean {
  return item.type === 'divider'
}

export function hasDropdownChildren(item: RsDropdownItem): boolean {
  return Boolean(item.children?.length)
}

export function flattenDropdownItems(items: RsDropdownItems): RsDropdownItem[] {
  const result: RsDropdownItem[] = []
  for (const item of items) {
    if (isDropdownItemGroup(item)) {
      result.push(...flattenDropdownItems(item.options))
      continue
    }
    if (isDropdownDivider(item)) continue
    result.push(item)
    if (item.children?.length) {
      result.push(...flattenDropdownItems(item.children))
    }
  }
  return result
}

/** 当前菜单层可点的项（不含分隔线与子菜单后代）。 */
export function listDropdownLayerItems(items: RsDropdownItems): RsDropdownItem[] {
  const result: RsDropdownItem[] = []
  for (const item of items) {
    if (isDropdownItemGroup(item)) {
      for (const option of item.options) {
        if (!isDropdownDivider(option)) result.push(option)
      }
      continue
    }
    if (!isDropdownDivider(item)) result.push(item)
  }
  return result
}

export function normalizeDropdownTriggers(
  trigger: RsDropdownTrigger | RsDropdownTrigger[] | undefined,
): RsDropdownTrigger[] {
  let list: RsDropdownTrigger[]
  if (Array.isArray(trigger)) list = trigger
  else if (trigger) list = [trigger]
  else list = ['click']
  const allowed = new Set<RsDropdownTrigger>(['click', 'hover', 'contextmenu'])
  const next = list.filter((item) => allowed.has(item))
  return next.length ? next : ['click']
}

export function resolveDropdownPortalTarget(
  getPopupContainer: RsDropdownGetPopupContainer | undefined,
  trigger?: HTMLElement | null,
): string | HTMLElement {
  if (typeof document === 'undefined') return 'body'
  if (!getPopupContainer) return 'body'
  return getPopupContainer(trigger ?? undefined) ?? 'body'
}

export function resolveDropdownMenuKeys(rtl: boolean): {
  next: string
  prev: string
  openSub: string
  closeSub: string
} {
  return {
    next: 'ArrowDown',
    prev: 'ArrowUp',
    openSub: rtl ? 'ArrowLeft' : 'ArrowRight',
    closeSub: rtl ? 'ArrowRight' : 'ArrowLeft',
  }
}

export function matchDropdownTypeahead(
  items: readonly RsDropdownItem[],
  query: string,
  fromIndex = -1,
): number {
  const needle = query.trim().toLowerCase()
  if (!needle || !items.length) return -1
  const start = Math.max(-1, fromIndex)
  for (let step = 1; step <= items.length; step += 1) {
    const index = (start + step) % items.length
    const item = items[index]
    if (!item || item.disabled || isDropdownDivider(item)) continue
    if (item.label.toLowerCase().startsWith(needle)) return index
  }
  return -1
}

export function escapeDropdownSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value
}

export function resolveDropdownExternalRel(item: RsDropdownItem): string | undefined {
  if (!item.href) return undefined
  if (item.rel) return item.rel
  if (item.target === '_blank') return 'noopener noreferrer'
  return undefined
}

/**
 * 下拉面板贴触发器：可指定上下与 start/end。
 * 视口不够仍翻转；start/end 在 RTL 对调。
 */
export function placeDropdownPopup(
  anchor: RsOverlayAnchorBox,
  popup: RsOverlayPopupSize,
  viewport: RsOverlayViewport,
  placement: RsDropdownPlacement,
  rtl = false,
  gap = 4,
): RsOverlayBox {
  const preferTop = placement.startsWith('top')
  const below = anchor.top + anchor.height + gap
  const above = anchor.top - popup.height - gap
  const roomBelow = below + popup.height <= viewport.height
  const roomAbove = above >= gap
  let side: 'top' | 'bottom'
  if (preferTop) {
    side = roomAbove || !roomBelow ? 'top' : 'bottom'
  } else {
    side = roomBelow || !roomAbove ? 'bottom' : 'top'
  }
  const top = side === 'bottom' ? below : Math.max(gap, above)
  const width = Math.min(popup.width, Math.max(0, viewport.width - gap * 2))
  const wantEnd = placement.endsWith('end')
  const alignRight = rtl ? !wantEnd : wantEnd
  const startLeft = anchor.left
  const endLeft = anchor.left + (anchor.width ?? 0) - width
  const rawLeft = alignRight ? endLeft : startLeft
  const maxLeft = Math.max(gap, viewport.width - width - gap)
  const left = Math.min(Math.max(gap, rawLeft), maxLeft)
  return { top, left, width, placement: side }
}
