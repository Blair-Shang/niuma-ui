export type RsMenuMode = 'vertical' | 'horizontal'

export type RsMenuTriggerAction = 'click' | 'hover'

export type RsMenuGetPopupContainer = () => HTMLElement | null | undefined

export interface RsMenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  children?: RsMenuItem[]
  /** 叶子可写成原生 a[href]。优先于 to。 */
  href?: string
  /** 未传 href 时写到 a[href]。Vue Router 请在 click 里 preventDefault 后 push。 */
  to?: string
  target?: string
  rel?: string
  /** 右侧辅助文案（折叠时隐藏） */
  extra?: string
  type?: 'item' | 'divider'
}

export interface RsMenuItemGroup {
  label: string
  children: RsMenuItem[]
}

export type RsMenuItems = RsMenuItem[] | RsMenuItemGroup[]

export interface RsMenuItemSlot {
  item: RsMenuItem
  active: boolean
  parentActive: boolean
  open: boolean
  collapsed: boolean
  depth: number
}

export interface RsMenuExpose {
  focus: () => void
  blur: () => void
}

export type RsMenuInstance = RsMenuExpose & { $el: HTMLElement }

export function isMenuItemGroup(
  item: RsMenuItem | RsMenuItemGroup,
): item is RsMenuItemGroup {
  return !('key' in item) && 'children' in item
}

export function isMenuDivider(item: RsMenuItem): boolean {
  return item.type === 'divider'
}

export function menuEntryKey(entry: RsMenuItem | RsMenuItemGroup, index: number): string {
  if (isMenuItemGroup(entry)) {
    return `group:${entry.label}:${index}`
  }
  return entry.key || `item:${index}`
}

export type RsMenuRenderBlock =
  | { type: 'group'; entry: RsMenuItemGroup; key: string }
  | { type: 'items'; items: RsMenuItem[]; key: string }

/** 连续叶子收成一块，分组单独一块，便于同一 ul 内方向键走动。 */
export function partitionMenuEntries(items: RsMenuItems): RsMenuRenderBlock[] {
  const out: RsMenuRenderBlock[] = []
  let batch: RsMenuItem[] = []
  let batchIndex = 0
  items.forEach((entry, index) => {
    if (isMenuItemGroup(entry)) {
      if (batch.length) {
        out.push({ type: 'items', items: batch, key: `items:${batchIndex}` })
        batch = []
        batchIndex += 1
      }
      out.push({ type: 'group', entry, key: menuEntryKey(entry, index) })
      return
    }
    batch.push(entry)
  })
  if (batch.length) {
    out.push({ type: 'items', items: batch, key: `items:${batchIndex}` })
  }
  return out
}

export function collectRootMenuItems(items: RsMenuItems): RsMenuItem[] {
  const out: RsMenuItem[] = []
  for (const entry of items) {
    if (isMenuItemGroup(entry)) {
      out.push(...entry.children)
    } else {
      out.push(entry)
    }
  }
  return out
}

export function findMenuParentKeys(items: RsMenuItems, key: string): string[] {
  function walk(list: RsMenuItem[], ancestors: string[]): string[] | null {
    for (const item of list) {
      if (item.key === key) {
        return ancestors
      }
      if (item.children?.length) {
        const found = walk(item.children, [...ancestors, item.key])
        if (found) {
          return found
        }
      }
    }
    return null
  }

  const found = walk(collectRootMenuItems(items), [])
  return found ?? []
}

/** 判断菜单项自身或其任意后代是否匹配 key（用于父级高亮） */
export function menuItemContainsKey(item: RsMenuItem, key: string): boolean {
  if (item.key === key) {
    return true
  }
  if (!item.children?.length) {
    return false
  }
  return item.children.some((child) => menuItemContainsKey(child, key))
}

/** 与 key 同层的子菜单 key（含自身），供 accordion 关兄弟。 */
export function findMenuSiblingKeys(items: RsMenuItems, key: string): string[] {
  function walk(list: RsMenuItem[]): string[] | null {
    const keys = list
      .filter((item) => !isMenuDivider(item) && Boolean(item.children?.length))
      .map((item) => item.key)
    if (keys.includes(key)) return keys
    for (const item of list) {
      if (item.children?.length) {
        const found = walk(item.children)
        if (found) return found
      }
    }
    return null
  }
  return walk(collectRootMenuItems(items)) ?? []
}

export function collectMenuDescendantKeys(items: RsMenuItems, key: string): string[] {
  function find(list: RsMenuItem[]): RsMenuItem | null {
    for (const item of list) {
      if (item.key === key) return item
      if (item.children?.length) {
        const found = find(item.children)
        if (found) return found
      }
    }
    return null
  }

  function collect(item: RsMenuItem, acc: string[]): string[] {
    if (!item.children?.length) return acc
    for (const child of item.children) {
      if (child.children?.length && !isMenuDivider(child)) {
        acc.push(child.key)
        collect(child, acc)
      }
    }
    return acc
  }

  const node = find(collectRootMenuItems(items))
  return node ? collect(node, []) : []
}

/** 选中叶子时并入祖先。已全部打开则返回原数组引用，避免多余 emit。 */
export function mergeOpenKeysWithParents(current: string[], parents: string[]): string[] {
  if (!parents.length) return current
  if (parents.every((key) => current.includes(key))) return current
  const next = new Set(current)
  for (const key of parents) next.add(key)
  return [...next]
}

export function toggleMenuOpenKeys(
  current: string[],
  key: string,
  open: boolean,
  items: RsMenuItems,
  accordion: boolean,
): string[] {
  if (!open) {
    const drop = new Set([key, ...collectMenuDescendantKeys(items, key)])
    return current.filter((item) => !drop.has(item))
  }
  if (!accordion) {
    if (current.includes(key)) return current
    return [...current, key]
  }
  const siblings = findMenuSiblingKeys(items, key)
  const drop = new Set<string>()
  for (const sibling of siblings) {
    if (sibling === key) continue
    drop.add(sibling)
    for (const descendant of collectMenuDescendantKeys(items, sibling)) {
      drop.add(descendant)
    }
  }
  const next = current.filter((item) => !drop.has(item))
  if (!next.includes(key)) next.push(key)
  return next
}

export function resolveMenuItemHref(item: RsMenuItem): string | undefined {
  if (item.href) return item.href
  if (item.to) return item.to
  return undefined
}

/** `_blank` 时补 noopener / noreferrer，并保留调用方已有 rel。 */
export function mergeMenuLinkRel(
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

export function menuArrowKeys(
  vertical: boolean,
  rtl: boolean,
): { next: string; prev: string; open: string } {
  if (vertical) {
    return {
      next: 'ArrowDown',
      prev: 'ArrowUp',
      open: rtl ? 'ArrowLeft' : 'ArrowRight',
    }
  }
  return {
    next: rtl ? 'ArrowLeft' : 'ArrowRight',
    prev: rtl ? 'ArrowRight' : 'ArrowLeft',
    open: 'ArrowDown',
  }
}

export function resolveMenuPortalTarget(
  getPopupContainer?: RsMenuGetPopupContainer,
): string | HTMLElement {
  if (typeof document === 'undefined') return 'body'
  const node = getPopupContainer?.()
  return node ?? document.body
}
