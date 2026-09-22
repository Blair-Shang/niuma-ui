import {
  placeSidePopup,
  stepEnabledIndex,
  type RsOverlayPopupSize,
  type RsOverlayViewport,
} from '../../_shared/src/overlay-utils'

/** 右键菜单图标尺寸（与 Dropdown / Menu 一致） */
export const RS_CONTEXT_MENU_ICON_SIZE = 16
export const RS_CONTEXT_MENU_ARROW_SIZE = 14

/** 菜单项种类。缺省是普通命令。separator 仍用布尔字段，兼容旧数据。 */
export type RsContextMenuItemType = 'item' | 'checkbox' | 'radio'

/** 右键菜单项定义 */
export interface RsContextMenuItem {
  /** 唯一标识，选中时回传 */
  key: string
  label: string
  icon?: string
  /** 次要说明，不参与选中 */
  hint?: string
  disabled?: boolean
  /** 危险操作样式 */
  danger?: boolean
  /** 为 true 时渲染分隔线。带 label 时是分组标题，仍不可选。 */
  separator?: boolean
  /** 子菜单项。父级只负责展开，不发 select。 */
  children?: RsContextMenuItem[]
  /** 键盘快捷键提示（仅展示，不绑定事件），如 "⌘K"、"⌃C" */
  shortcut?: string
  /** checkbox / radio 用 menuitemcheckbox / menuitemradio。缺省是普通命令。 */
  type?: RsContextMenuItemType
  /** checkbox / radio 的勾选态，由调用方持有 */
  checked?: boolean
  /** 同一 radio 组的名字，只给无障碍和样式分组，不代管状态 */
  group?: string
  /** 叶子可写成链接。外链 target=_blank 会补 noopener noreferrer。 */
  href?: string
  target?: string
  rel?: string
  /**
   * 选中后是否关闭。
   * 缺省时普通项跟 hideOnSelect，checkbox / radio 保持打开。
   */
  closeOnSelect?: boolean
}

export type RsContextMenuGetPopupContainer = (
  trigger?: HTMLElement,
) => HTMLElement | null | undefined

export interface RsContextMenuPoint {
  x: number
  y: number
}

export interface RsContextMenuExpose {
  /** 在指针处或触发器下沿打开。禁用或没有可点项时无操作。 */
  open: (point?: RsContextMenuPoint) => void
  close: () => void
}

export interface RsContextMenuItemSlot {
  item: RsContextMenuItem
  highlighted: boolean
  checked: boolean
}

export interface RsContextMenuPointBox {
  top: number
  left: number
  maxHeight: number
  originX: 'left' | 'right'
  originY: 'top' | 'bottom'
}

export interface RsContextMenuLayerState {
  id: string
  items: RsContextMenuItem[]
  parentKey: string | null
}

const closers = new Set<() => void>()

/** 同时只留一个右键菜单，避免多层监听叠在 document 上。 */
export function claimContextMenu(close: () => void): void {
  for (const other of [...closers]) {
    if (other !== close) other()
  }
  closers.add(close)
}

export function releaseContextMenu(close: () => void): void {
  closers.delete(close)
}

export function isContextMenuSeparator(item: RsContextMenuItem): boolean {
  return item.separator === true
}

export function hasContextMenuChildren(item: RsContextMenuItem): boolean {
  return Boolean(item.children?.length)
}

export function isContextMenuCheck(item: RsContextMenuItem): boolean {
  return item.type === 'checkbox' || item.type === 'radio'
}

export function contextMenuItemRole(
  item: RsContextMenuItem,
): 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' {
  if (item.type === 'checkbox') return 'menuitemcheckbox'
  if (item.type === 'radio') return 'menuitemradio'
  return 'menuitem'
}

/** 是否存在可操作项（排除纯分隔线与分组标题），用于避免空菜单气泡 */
export function hasActionableContextMenuItems(items: RsContextMenuItem[] | undefined): boolean {
  if (!items?.length) return false
  return items.some((item) => !isContextMenuSeparator(item))
}

/** 当前层可聚焦的项（不含分隔线与分组标题）。 */
export function listContextMenuLayerItems(items: readonly RsContextMenuItem[]): RsContextMenuItem[] {
  return items.filter((item) => !isContextMenuSeparator(item))
}

export function firstEnabledContextMenuKey(items: readonly RsContextMenuItem[]): string {
  return listContextMenuLayerItems(items).find((item) => !item.disabled)?.key ?? ''
}

export function lastEnabledContextMenuKey(items: readonly RsContextMenuItem[]): string {
  const list = listContextMenuLayerItems(items)
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (!list[index]?.disabled) return list[index].key
  }
  return ''
}

export function stepContextMenuKey(
  items: readonly RsContextMenuItem[],
  current: string,
  delta: 1 | -1,
): string {
  const list = listContextMenuLayerItems(items)
  if (!list.length) return ''
  const index = list.findIndex((item) => item.key === current)
  let start = index
  if (index < 0) start = delta === 1 ? -1 : 0
  const next = stepEnabledIndex(list, start, delta)
  return list[next]?.key ?? ''
}

export function findContextMenuItem(
  items: readonly RsContextMenuItem[],
  key: string,
): RsContextMenuItem | undefined {
  for (const item of items) {
    if (item.key === key) return item
    if (item.children?.length) {
      const found = findContextMenuItem(item.children, key)
      if (found) return found
    }
  }
  return undefined
}

/** 根层 + 已展开路径上的子层。路径中断就停，不渲染未打开的分支。 */
export function resolveContextMenuLayers(
  items: readonly RsContextMenuItem[],
  path: readonly string[],
): RsContextMenuLayerState[] {
  const layers: RsContextMenuLayerState[] = [
    { id: 'root', items: [...items], parentKey: null },
  ]
  let current = items
  for (const key of path) {
    const parent = current.find((item) => item.key === key && hasContextMenuChildren(item))
    if (!parent?.children?.length) break
    layers.push({ id: key, items: parent.children, parentKey: key })
    current = parent.children
  }
  return layers
}

export function shouldCloseContextMenuOnSelect(
  item: RsContextMenuItem,
  hideOnSelect: boolean,
): boolean {
  if (item.closeOnSelect != null) return item.closeOnSelect
  if (isContextMenuCheck(item)) return false
  return hideOnSelect
}

export function resolveContextMenuKeys(rtl: boolean): {
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

export function matchContextMenuTypeahead(
  items: readonly RsContextMenuItem[],
  query: string,
  fromIndex = -1,
): number {
  const needle = query.trim().toLowerCase()
  if (!needle || !items.length) return -1
  const list = listContextMenuLayerItems(items)
  const start = Math.max(-1, fromIndex)
  for (let step = 1; step <= list.length; step += 1) {
    const index = (start + step) % list.length
    const item = list[index]
    if (!item || item.disabled) continue
    if (item.label.toLowerCase().startsWith(needle)) return index
  }
  return -1
}

export function escapeContextMenuSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/["\\]/g, '\\$&')
}

export function resolveContextMenuPortalTarget(
  getPopupContainer: RsContextMenuGetPopupContainer | undefined,
  trigger?: HTMLElement | null,
): string | HTMLElement {
  if (typeof document === 'undefined') return 'body'
  if (!getPopupContainer) return 'body'
  return getPopupContainer(trigger ?? undefined) ?? 'body'
}

export function resolveContextMenuRel(item: RsContextMenuItem): string | undefined {
  if (!item.href) return undefined
  if (item.rel) return item.rel
  if (item.target === '_blank') return 'noopener noreferrer'
  return undefined
}

export function resolveContextMenuElement(value: unknown): HTMLElement | null {
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value
  if (value && typeof value === 'object' && '$el' in value) {
    const root = (value as { $el?: unknown }).$el
    if (typeof HTMLElement !== 'undefined' && root instanceof HTMLElement) return root
  }
  return null
}

/**
 * 菜单从指针处展开：默认向右下，贴边翻到左或上，并给出可滚动的最大高度。
 * RTL 优先向左。padding 把菜单夹进视口。
 */
export function placeContextMenuPoint(
  point: RsContextMenuPoint,
  popup: RsOverlayPopupSize,
  viewport: RsOverlayViewport,
  padding = 8,
  rtl = false,
): RsContextMenuPointBox {
  const width = Math.min(Math.max(0, popup.width), Math.max(0, viewport.width - padding * 2))
  const spaceBelow = Math.max(0, viewport.height - point.y - padding)
  const spaceAbove = Math.max(0, point.y - padding)
  const openUp = popup.height > spaceBelow && spaceAbove > spaceBelow
  const maxHeight = Math.max(0, openUp ? spaceAbove : spaceBelow)
  const usedHeight = Math.min(Math.max(0, popup.height), maxHeight > 0 ? maxHeight : popup.height)
  let top = openUp ? point.y - usedHeight : point.y
  const maxTop = Math.max(padding, viewport.height - padding - Math.max(0, usedHeight))
  top = Math.min(Math.max(padding, top), maxTop)

  const spaceRight = Math.max(0, viewport.width - point.x - padding)
  const spaceLeft = Math.max(0, point.x - padding)
  const openLeft = rtl
    ? spaceLeft >= width || spaceLeft >= spaceRight
    : spaceRight < width && spaceLeft > spaceRight
  let left = openLeft ? point.x - width : point.x
  const maxLeft = Math.max(padding, viewport.width - width - padding)
  left = Math.min(Math.max(padding, left), maxLeft)

  return {
    top,
    left,
    maxHeight: maxHeight > 0 ? maxHeight : Math.max(0, viewport.height - padding * 2),
    originX: openLeft ? 'right' : 'left',
    originY: openUp ? 'bottom' : 'top',
  }
}

/** 子菜单贴父项侧面。视口不够时翻到另一侧，并限制可滚动高度。 */
export function placeContextMenuSubmenu(
  anchor: { top: number; left: number; width: number; height: number },
  popup: RsOverlayPopupSize,
  viewport: RsOverlayViewport,
  rtl: boolean,
  gap = 4,
): RsContextMenuPointBox {
  const placed = placeSidePopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    popup,
    viewport,
    gap,
    rtl ? 'left' : 'right',
  )
  return {
    top: placed.top,
    left: placed.left,
    maxHeight: Math.max(0, viewport.height - placed.top - gap),
    originX: placed.placement === 'left' ? 'right' : 'left',
    originY: 'top',
  }
}
