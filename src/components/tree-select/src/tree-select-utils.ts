import {
  buildTreeNodeIndex,
  getTreeLabel,
  resolveTreeFieldNames,
  type RsTreeFieldNames,
  type RsTreeNode,
  type RsTreeNodeIndex,
} from '../../tree/src/tree-utils'

export type RsTreeSelectModelValue = string | string[]

/** 勾选回显策略。只改触发器文案，不改 v-model。 */
export type RsTreeSelectShowCheckedStrategy = 'SHOW_ALL' | 'SHOW_PARENT' | 'SHOW_CHILD'

export type RsTreeSelectGetPopupContainer = (
  trigger?: HTMLElement,
) => string | HTMLElement | undefined | null

export function isTreeSelectMultiValue(multiple: boolean, checkable: boolean): boolean {
  return multiple || checkable
}

export function normalizeTreeSelectKeys(value: RsTreeSelectModelValue | null | undefined): string[] {
  if (Array.isArray(value)) return value.map(String).filter((key) => key !== '')
  if (value === '' || value == null) return []
  return [String(value)]
}

export function packTreeSelectValue(keys: string[], multi: boolean): RsTreeSelectModelValue {
  return multi ? [...keys] : (keys[0] ?? '')
}

export function emptyTreeSelectValue(multi: boolean): RsTreeSelectModelValue {
  return multi ? [] : ''
}

export function treeSelectHasValue(keys: readonly string[]): boolean {
  return keys.length > 0
}

/**
 * 触发器要展示的 key。
 * SHOW_PARENT：父节点已在集合里则藏子节点。
 * SHOW_CHILD：子节点已全部在集合里则藏父节点。
 */
export function resolveTreeSelectDisplayKeys(
  keys: readonly string[],
  index: ReadonlyMap<string, RsTreeNodeIndex>,
  strategy: RsTreeSelectShowCheckedStrategy,
  checkStrictly: boolean,
): string[] {
  if (checkStrictly || strategy === 'SHOW_ALL' || keys.length === 0) return [...keys]
  const set = new Set(keys)
  if (strategy === 'SHOW_PARENT') {
    return keys.filter((key) => {
      const parentKey = index.get(key)?.parentKey
      return !parentKey || !set.has(parentKey)
    })
  }
  return keys.filter((key) => {
    const children = index.get(key)?.childrenKeys ?? []
    if (children.length === 0) return true
    return !children.every((child) => set.has(child))
  })
}

export function resolveTreeSelectLabels(
  keys: readonly string[],
  index: ReadonlyMap<string, RsTreeNodeIndex>,
  fieldNames?: RsTreeFieldNames,
): string[] {
  const names = resolveTreeFieldNames(fieldNames)
  return keys.map((key) => {
    const entry = index.get(key)
    return entry ? getTreeLabel(entry.node, names) : key
  })
}

export function formatTreeSelectDisplay(
  labels: readonly string[],
  maxTagCount?: number,
  moreText?: string,
): string {
  if (maxTagCount == null || maxTagCount < 0 || labels.length <= maxTagCount) {
    return labels.join(', ')
  }
  const shown = labels.slice(0, maxTagCount)
  const omitted = labels.length - maxTagCount
  const more = moreText ?? `+${omitted}`
  return [...shown, more].join(', ')
}

export function buildTreeSelectIndex(
  nodes: readonly RsTreeNode[],
  fieldNames?: RsTreeFieldNames,
  lazy = false,
): Map<string, RsTreeNodeIndex> {
  return buildTreeNodeIndex(nodes, resolveTreeFieldNames(fieldNames), lazy)
}

export function resolveTreeSelectPortalTarget(
  getPopupContainer: RsTreeSelectGetPopupContainer | undefined,
  trigger?: HTMLElement | null,
): string | HTMLElement {
  if (!getPopupContainer) return 'body'
  return getPopupContainer(trigger ?? undefined) ?? 'body'
}
