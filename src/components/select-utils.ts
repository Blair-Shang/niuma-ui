export interface RsSelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface RsSelectOptionGroup {
  label: string
  options: RsSelectOption[]
}

export type RsSelectOptions = ReadonlyArray<RsSelectOption | RsSelectOptionGroup>

/**
 * Reka ComboboxItem 禁止 value 为空串（空串表示未选中 / placeholder）。
 * 选项若传入 value: ''，对内映射为此哨兵，避免崩溃；对外读写仍为 ''。
 */
export const RS_SELECT_EMPTY_VALUE = '__rs_select_empty__'

/** 业务 value → ComboboxItem value（仅处理空串） */
export function toComboboxValue(value: string): string {
  return value === '' ? RS_SELECT_EMPTY_VALUE : value
}

/** ComboboxItem value → 业务 value（仅处理空串哨兵） */
export function fromComboboxValue(value: string): string {
  return value === RS_SELECT_EMPTY_VALUE ? '' : value
}

export function isSelectOptionGroup(
  item: RsSelectOption | RsSelectOptionGroup,
): item is RsSelectOptionGroup {
  return 'options' in item && Array.isArray(item.options)
}

export function flattenSelectOptions(options: RsSelectOptions): RsSelectOption[] {
  const result: RsSelectOption[] = []
  for (const item of options) {
    if (isSelectOptionGroup(item)) {
      result.push(...item.options)
    } else {
      result.push(item)
    }
  }
  return result
}

export function buildOptionLabelMap(options: RsSelectOptions): Map<string, string> {
  const map = new Map<string, string>()
  for (const opt of flattenSelectOptions(options)) {
    map.set(opt.value, opt.label)
    if (opt.value === '') map.set(RS_SELECT_EMPTY_VALUE, opt.label)
  }
  return map
}

export function buildOptionDisabledMap(options: RsSelectOptions): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (const opt of flattenSelectOptions(options)) {
    const disabled = Boolean(opt.disabled)
    map.set(opt.value, disabled)
    if (opt.value === '') map.set(RS_SELECT_EMPTY_VALUE, disabled)
  }
  return map
}

export function filterSelectOptions(
  options: RsSelectOptions,
  query: string,
  contains: (text: string, search: string) => boolean,
): RsSelectOptions {
  const trimmed = query.trim()
  if (!trimmed) return options

  const result: Array<RsSelectOption | RsSelectOptionGroup> = []
  for (const item of options) {
    if (isSelectOptionGroup(item)) {
      const filtered = item.options.filter((opt) => contains(opt.label, trimmed))
      if (filtered.length > 0) {
        result.push({ label: item.label, options: filtered })
      }
    } else if (contains(item.label, trimmed)) {
      result.push(item)
    }
  }
  return result as RsSelectOptions
}

export function flattenSelectValues(options: RsSelectOptions): string[] {
  return flattenSelectOptions(options).map((opt) => toComboboxValue(opt.value))
}
