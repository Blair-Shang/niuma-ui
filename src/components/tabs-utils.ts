import type { RsContextMenuItem } from './context-menu-utils'

/** 选项卡项定义 */
export interface RsTabItem {
  value: string
  label: string
  icon?: string
  disabled?: boolean
  badge?: string | number
  /** 是否可关闭；未设置时继承 RsTabs 的 closable；fixed 为 true 时强制不可关 */
  closable?: boolean
  /** 固定/常驻标签（对齐 GTabs fixed / 浏览器固定标签），不可关闭、不可被批量关闭 */
  fixed?: boolean
  /** 是否可重命名；未设置时继承 RsTabs 的 renamable */
  renamable?: boolean
}

/** 选项卡尺寸 */
export type RsTabsSize = 'sm' | 'md'

/** line 下划线 · segmented 胶囊 · card 卡片（Ant editable-card） */
export type RsTabsVariant = 'line' | 'segmented' | 'card'

/**
 * 标签栏对齐：start 左齐 · center 居中 · evenly 均分空隙 · stretch 项等宽铺满。
 * 用于登录等场景，避免业务侧 :deep 改 list/trigger。
 */
export type RsTabsJustify = 'start' | 'center' | 'evenly' | 'stretch'

/**
 * 标题栏与内容区间距（主要用于 borderless）。
 * none=0 · sm=8px · md=12px · lg=16px · xl=24px；也可用 CSS 变量 --rs-tabs-content-gap 覆盖。
 */
export type RsTabsContentGap = 'none' | 'sm' | 'md' | 'lg' | 'xl'

/** 标签过多时的处理方式 */
export type RsTabsOverflow = 'scroll' | 'dropdown'

/** 批量关闭动作（顶栏导航右键菜单） */
export type RsTabsCloseAction = 'close' | 'others' | 'left' | 'right' | 'all'

/** 判断是否为固定标签 */
export function isTabFixed(item: RsTabItem): boolean {
  return item.fixed === true
}

/** 判断单项是否展示关闭按钮 */
export function isTabClosable(item: RsTabItem, globalClosable = false): boolean {
  if (isTabFixed(item)) return false
  if (item.closable !== undefined) return item.closable
  return globalClosable
}

/** 判断单项是否可双击重命名 */
export function isTabRenamable(item: RsTabItem, globalRenamable = false): boolean {
  if (item.renamable !== undefined) return item.renamable
  return globalRenamable
}

/** 关闭当前激活项时，解析应切换到的下一项（优先右侧，否则左侧） */
export function getNextTabAfterClose(
  items: RsTabItem[],
  closedValue: string,
  activeValue: string,
): string | undefined {
  if (activeValue !== closedValue) return activeValue
  const index = items.findIndex((item) => item.value === closedValue)
  if (index < 0) return undefined
  const remaining = items.filter((item) => item.value !== closedValue)
  if (!remaining.length) return undefined
  return remaining[index]?.value ?? remaining[index - 1]?.value ?? remaining[0]?.value
}

/**
 * 批量关闭后解析应保留的激活项。
 * 若当前激活项仍在剩余列表中则保持，否则取锚点（若仍在）或首项。
 */
export function getNextTabAfterBatchClose(
  remaining: RsTabItem[],
  activeValue: string,
  anchorValue?: string,
): string | undefined {
  if (!remaining.length) return undefined
  if (remaining.some((item) => item.value === activeValue)) return activeValue
  if (anchorValue && remaining.some((item) => item.value === anchorValue)) return anchorValue
  return remaining[0]?.value
}

/** 将 dragValue 对应的项移动到 dropValue 之前（fixed 项不可作为拖拽源或落点） */
export function reorderTabItems(
  items: RsTabItem[],
  dragValue: string,
  dropValue: string,
): RsTabItem[] {
  const from = items.findIndex((item) => item.value === dragValue)
  const to = items.findIndex((item) => item.value === dropValue)
  if (from < 0 || to < 0 || from === to) return items
  const dragItem = items[from]
  const dropItem = items[to]
  if (!dragItem || !dropItem || isTabFixed(dragItem) || isTabFixed(dropItem)) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (!moved) return items
  next.splice(to, 0, moved)
  return next
}

/**
 * 按动作解析待关闭的 value 列表（跳过 fixed / 不可关闭项）。
 */
export function resolveTabsToClose(
  items: RsTabItem[],
  action: RsTabsCloseAction,
  anchorValue: string,
  globalClosable = false,
): string[] {
  const index = items.findIndex((item) => item.value === anchorValue)
  if (index < 0 && action !== 'all') return []

  const canClose = (item: RsTabItem) => isTabClosable(item, globalClosable)

  switch (action) {
    case 'close': {
      const item = items[index]
      return item && canClose(item) ? [item.value] : []
    }
    case 'others':
      return items
        .filter((item) => item.value !== anchorValue && canClose(item))
        .map((item) => item.value)
    case 'left':
      return items.filter((item, i) => i < index && canClose(item)).map((item) => item.value)
    case 'right':
      return items.filter((item, i) => i > index && canClose(item)).map((item) => item.value)
    case 'all':
      return items.filter((item) => canClose(item)).map((item) => item.value)
    default:
      return []
  }
}

export interface BuildTabContextMenuLabels {
  close: string
  closeOthers: string
  closeLeft: string
  closeRight: string
  closeAll: string
}

/**
 * 构建顶栏导航右键菜单项（关闭 / 关闭其他 / 左 / 右 / 全部）。
 */
export function buildTabContextMenuItems(
  items: RsTabItem[],
  anchor: RsTabItem,
  globalClosable: boolean,
  labels: BuildTabContextMenuLabels,
): RsContextMenuItem[] {
  const index = items.findIndex((item) => item.value === anchor.value)
  if (index < 0) return []

  const canCloseAnchor = isTabClosable(anchor, globalClosable)
  const others = resolveTabsToClose(items, 'others', anchor.value, globalClosable)
  const left = resolveTabsToClose(items, 'left', anchor.value, globalClosable)
  const right = resolveTabsToClose(items, 'right', anchor.value, globalClosable)
  const all = resolveTabsToClose(items, 'all', anchor.value, globalClosable)

  return [
    {
      key: 'close',
      label: labels.close,
      icon: 'x',
      disabled: !canCloseAnchor,
    },
    { key: 'sep-1', label: '', separator: true },
    {
      key: 'others',
      label: labels.closeOthers,
      icon: 'copy-x',
      disabled: others.length === 0,
    },
    {
      key: 'left',
      label: labels.closeLeft,
      icon: 'arrow-left-to-line',
      disabled: left.length === 0,
    },
    {
      key: 'right',
      label: labels.closeRight,
      icon: 'arrow-right-to-line',
      disabled: right.length === 0,
    },
    { key: 'sep-2', label: '', separator: true },
    {
      key: 'all',
      label: labels.closeAll,
      icon: 'trash-2',
      danger: true,
      disabled: all.length === 0,
    },
  ]
}

export interface ResolveVisibleTabOptions {
  /** dropdown 模式下为 false：激活项仅在「更多」展示，不占标签栏 */
  keepActiveVisible?: boolean
}

/**
 * 根据各标签宽度与可用宽度，计算应展示的标签 value 集合。
 */
export function resolveVisibleTabValues(
  items: RsTabItem[],
  widths: Map<string, number>,
  availableWidth: number,
  activeValue: string,
  reservedWidth = 0,
  options: ResolveVisibleTabOptions = {},
): Set<string> {
  const keepActiveVisible = options.keepActiveVisible ?? true

  if (availableWidth <= 0 || !items.length) {
    return new Set(items.map((item) => item.value))
  }

  const budget = Math.max(0, availableWidth - reservedWidth)
  const visible: string[] = []
  let used = 0

  for (const item of items) {
    const width = widths.get(item.value) ?? 0
    if (used + width > budget) break
    visible.push(item.value)
    used += width
  }

  if (keepActiveVisible && !visible.includes(activeValue)) {
    const activeIndex = items.findIndex((item) => item.value === activeValue)
    if (activeIndex >= 0) {
      if (visible.length > 1) visible.pop()
      if (!visible.includes(activeValue)) visible.push(activeValue)
    }
  }

  return new Set(visible)
}
