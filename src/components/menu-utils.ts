export interface RsMenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  children?: RsMenuItem[]
}

export interface RsMenuItemGroup {
  label: string
  children: RsMenuItem[]
}

export type RsMenuItems = RsMenuItem[] | RsMenuItemGroup[]

export function isMenuItemGroup(
  item: RsMenuItem | RsMenuItemGroup,
): item is RsMenuItemGroup {
  return !('key' in item) && 'children' in item
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

  for (const entry of items) {
    const found = isMenuItemGroup(entry)
      ? walk(entry.children, [])
      : walk([entry], [])
    if (found) {
      return found
    }
  }

  return []
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
