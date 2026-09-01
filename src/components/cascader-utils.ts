import type { RsSelectValue } from './select-utils'

/** 级联选项，对齐 Ant Cascader options */
export interface RsCascaderOption {
  label: string
  value: RsSelectValue
  disabled?: boolean
  children?: RsCascaderOption[]
  isLeaf?: boolean
}

export type RsCascaderPath = RsSelectValue[]

export type RsCascaderExpandTrigger = 'click' | 'hover'

export function findCascaderOption(
  options: readonly RsCascaderOption[],
  value: RsSelectValue,
): RsCascaderOption | undefined {
  return options.find((item) => String(item.value) === String(value))
}

export function cascaderColumns(
  options: readonly RsCascaderOption[],
  path: RsCascaderPath,
): RsCascaderOption[][] {
  const columns: RsCascaderOption[][] = [options.slice()]
  let level = options
  for (const token of path) {
    const current = findCascaderOption(level, token)
    const children = current?.children
    if (!children?.length) break
    columns.push(children)
    level = children
  }
  return columns
}

export function cascaderLabels(
  options: readonly RsCascaderOption[],
  path: RsCascaderPath,
): string[] {
  const labels: string[] = []
  let level = options
  for (const token of path) {
    const current = findCascaderOption(level, token)
    if (!current) {
      labels.push(String(token))
      break
    }
    labels.push(current.label)
    level = current.children ?? []
  }
  return labels
}

export function cascaderDisplay(
  options: readonly RsCascaderOption[],
  path: RsCascaderPath,
  separator = ' / ',
): string {
  return cascaderLabels(options, path).join(separator)
}

export function isCascaderLeaf(option: RsCascaderOption): boolean {
  if (option.isLeaf === true) return true
  if (option.isLeaf === false) return false
  return !option.children?.length
}
