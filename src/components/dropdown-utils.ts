export interface RsDropdownItem {
  label: string
  value: string
  icon?: string
  /** 次要说明，工具条动作菜单等场景使用 */
  hint?: string
  disabled?: boolean
}

export interface RsDropdownItemGroup {
  label: string
  options: RsDropdownItem[]
}

export type RsDropdownItems = RsDropdownItem[] | RsDropdownItemGroup[]

/** 菜单宽度：trigger 对齐触发器；fit 随内容，不跟窄图标按钮 */
export type RsDropdownContentWidth = 'trigger' | 'fit'

export function isDropdownItemGroup(
  item: RsDropdownItem | RsDropdownItemGroup,
): item is RsDropdownItemGroup {
  return 'options' in item && Array.isArray(item.options)
}

export function flattenDropdownItems(items: RsDropdownItems): RsDropdownItem[] {
  const result: RsDropdownItem[] = []
  for (const item of items) {
    if (isDropdownItemGroup(item)) {
      result.push(...item.options)
    } else {
      result.push(item)
    }
  }
  return result
}
