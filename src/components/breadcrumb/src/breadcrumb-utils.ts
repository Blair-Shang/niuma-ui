export interface RsBreadcrumbItem {
  key?: string
  label: string
  /** SPA 路径。未传 href 时写到 a[href]。Vue Router 请在 click 里 preventDefault 后 push，或用 #item。 */
  to?: string
  /** 外链或完整地址。与 to 同时存在时以 href 为准。 */
  href?: string
  /** Lucide kebab-case，写在文案前。 */
  icon?: string
  disabled?: boolean
  target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})
  rel?: string
}

export interface RsBreadcrumbRenderItem {
  key: string
  sourceIndex: number
  source?: RsBreadcrumbItem
  label: string
  href?: string
  icon?: string
  target?: string
  rel?: string
  isLink: boolean
  isCurrent: boolean
  isDisabled: boolean
  isEllipsis: boolean
  hiddenItems?: RsBreadcrumbItem[]
}

export interface RsBreadcrumbCollapseOptions {
  maxItems?: number
  itemsBeforeCollapse?: number
  itemsAfterCollapse?: number
  expanded?: boolean
}

/** href 优先；没有 href 时用 to，保证只传 to 的项仍是带地址的 a。 */
export function resolveBreadcrumbHref(item: Pick<RsBreadcrumbItem, 'href' | 'to'>): string | undefined {
  if (item.href) return item.href
  if (item.to) return item.to
  return undefined
}

/** `_blank` 时补 noopener / noreferrer，并保留调用方已有 rel。 */
export function mergeBreadcrumbLinkRel(
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

export function pickCollapsedBreadcrumbIndexes(
  length: number,
  maxItems: number | undefined,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  expanded = false,
): { visible: number[]; hidden: number[]; insertEllipsisAt: number } | null {
  if (expanded || maxItems == null || maxItems < 2 || length <= maxItems) return null
  const before = Math.max(0, Math.floor(itemsBeforeCollapse))
  const after = Math.max(1, Math.floor(itemsAfterCollapse))
  if (before + after >= length) return null
  const hiddenStart = before
  const hiddenEnd = length - after
  if (hiddenStart >= hiddenEnd) return null
  const visible: number[] = []
  const hidden: number[] = []
  for (let index = 0; index < length; index += 1) {
    if (index >= hiddenStart && index < hiddenEnd) hidden.push(index)
    else visible.push(index)
  }
  return { visible, hidden, insertEllipsisAt: before }
}

export function buildBreadcrumbRenderItems(
  items: RsBreadcrumbItem[],
  options: RsBreadcrumbCollapseOptions = {},
): RsBreadcrumbRenderItem[] {
  const lastIndex = items.length - 1
  const mapped = items.map((item, index) => {
    const href = resolveBreadcrumbHref(item)
    const disabled = Boolean(item.disabled)
    return {
      key: item.key ?? String(index),
      sourceIndex: index,
      source: item,
      label: item.label,
      href,
      icon: item.icon,
      target: item.target,
      rel: mergeBreadcrumbLinkRel(item.rel, item.target),
      isLink: Boolean(href) && !disabled && index !== lastIndex,
      isCurrent: index === lastIndex,
      isDisabled: disabled,
      isEllipsis: false,
    } satisfies RsBreadcrumbRenderItem
  })

  const collapsed = pickCollapsedBreadcrumbIndexes(
    mapped.length,
    options.maxItems,
    options.itemsBeforeCollapse ?? 1,
    options.itemsAfterCollapse ?? 1,
    options.expanded ?? false,
  )
  if (!collapsed) return mapped

  const result: RsBreadcrumbRenderItem[] = []
  collapsed.visible.forEach((index, visibleIndex) => {
    if (visibleIndex === collapsed.insertEllipsisAt) {
      result.push({
        key: 'ellipsis',
        sourceIndex: -1,
        label: '',
        isLink: false,
        isCurrent: false,
        isDisabled: false,
        isEllipsis: true,
        hiddenItems: collapsed.hidden.map((hiddenIndex) => items[hiddenIndex]!),
      })
    }
    result.push(mapped[index]!)
  })
  return result
}
