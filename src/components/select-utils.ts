export type RsSelectValue = string | number

/** 过滤 / 回显比对字段名，默认 label；可传 value 或 fieldNames 映射后的键 */
export type RsSelectOptionFilterProp = string

export type RsSelectPlacement = 'top' | 'bottom' | 'left' | 'right'

export type RsSelectStatus = 'error' | 'warning' | ''

/** 自定义过滤（对齐 Ant Design filterOption）。返回 false 则隐藏该项。 */
export type RsSelectFilterOption = (query: string, option: RsSelectOption) => boolean

/** 过滤后排序（对齐 Ant Design filterSort） */
export type RsSelectFilterSort = (a: RsSelectOption, b: RsSelectOption) => number

export interface RsSelectOption {
  label: string
  value: RsSelectValue
  disabled?: boolean
  /** 原生 title；悬停展示补充说明 */
  title?: string
}

export interface RsSelectOptionGroup {
  label: string
  options: RsSelectOption[]
}

export type RsSelectOptions = ReadonlyArray<RsSelectOption | RsSelectOptionGroup>

/** 未正规化的选项（配合 fieldNames 可用 name/id/children 等业务字段） */
export type RsSelectOptionInput = RsSelectOption | RsSelectOptionGroup | Record<string, unknown>

export type RsSelectOptionsInput = ReadonlyArray<RsSelectOptionInput>

/** 对齐 Ant Design fieldNames */
export interface RsSelectFieldNames {
  label?: string
  value?: string
  options?: string
  disabled?: string
  groupLabel?: string
}

export type RsSelectGetPopupContainer = (triggerNode?: HTMLElement) => string | HTMLElement | undefined

/** labelInValue 时的 v-model 项（对齐 Ant Design） */
export interface RsSelectLabeledValue {
  label: string
  value: RsSelectValue
}

export type RsSelectModelValue =
  | RsSelectValue
  | RsSelectValue[]
  | RsSelectLabeledValue
  | RsSelectLabeledValue[]
  | ''

/**
 * 按泛型收窄后的 v-model。
 * 默认单选、值为 string：宿主 `@update:model-value="(v: string) => void"` 可直接赋值。
 * `multiple` / `labelInValue` 为字面量 true 时收成数组或 labeled；为 `boolean` 时保留联合。
 */
export type RsSelectResolvedModel<
  Value extends RsSelectValue = string,
  Multiple extends boolean = false,
  LabelInValue extends boolean = false,
> = LabelInValue extends true
  ? Multiple extends true
    ? RsSelectLabeledValue[]
    : Multiple extends false
      ? RsSelectLabeledValue | ''
      : RsSelectLabeledValue | RsSelectLabeledValue[] | ''
  : Multiple extends true
    ? Value[]
    : Multiple extends false
      ? Value | ''
      : Value | Value[] | ''

/**
 * Reka ComboboxItem 禁止 value 为空串（空串表示未选中 / placeholder）。
 * 选项若传入 value: ''，对内映射为此哨兵，避免崩溃；对外读写仍为 ''。
 */
export const RS_SELECT_EMPTY_VALUE = '__rs_select_empty__'

/**
 * Vue 对泛型 boolean prop 不会按 Boolean 收口。
 * 模板写 `multiple` 时运行时可能是 ''；个别版本还会落到 attrs 变成 'true' / 'multiple'。
 * Boolean('') 为 false，会把多选打成单选。
 */
export function isSelectMultiple(value: unknown): boolean {
  return value === true || value === '' || value === 'true' || value === 'multiple'
}

/** 业务 value → ComboboxItem token（空串走哨兵；数字转为十进制字符串） */
export function toComboboxValue(value: RsSelectValue): string {
  return value === '' ? RS_SELECT_EMPTY_VALUE : String(value)
}

/** ComboboxItem token → 业务字符串（仅还原空串哨兵，不恢复 number） */
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

export function findSelectOption(
  options: RsSelectOptions,
  token: string,
): RsSelectOption | undefined {
  const raw = fromComboboxValue(token)
  return flattenSelectOptions(options).find((opt) => String(opt.value) === String(raw))
}

/**
 * Combobox token → 业务 value。
 * 优先返回 options 里的原始类型（number 0 保持为 0）；手输/未知项保持字符串。
 */
export function restoreSelectValue(
  token: string,
  options: RsSelectOptions,
): RsSelectValue {
  const matched = findSelectOption(options, token)
  if (matched) return matched.value
  return fromComboboxValue(token)
}

export function restoreSelectValues(
  tokens: string[],
  options: RsSelectOptions,
): RsSelectValue[] {
  return tokens.map((token) => restoreSelectValue(token, options))
}

export function buildOptionLabelMap(options: RsSelectOptions): Map<string, string> {
  const map = new Map<string, string>()
  for (const opt of flattenSelectOptions(options)) {
    const key = toComboboxValue(opt.value)
    map.set(key, opt.label)
    if (opt.value === '') map.set('', opt.label)
  }
  return map
}

export function buildOptionDisabledMap(options: RsSelectOptions): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (const opt of flattenSelectOptions(options)) {
    const key = toComboboxValue(opt.value)
    map.set(key, Boolean(opt.disabled))
  }
  return map
}

function optionFieldText(option: RsSelectOption, prop: string): string {
  if (prop === 'value') return String(option.value)
  if (prop === 'label' || !prop) return String(option.label)
  const extra = Reflect.get(option, prop)
  return extra == null ? String(option.label) : String(extra)
}

function defaultMatchOption(
  option: RsSelectOption,
  query: string,
  contains: (text: string, search: string) => boolean,
  optionFilterProp: RsSelectOptionFilterProp,
): boolean {
  return contains(optionFieldText(option, optionFilterProp), query)
}

function coerceSelectValue(raw: unknown): RsSelectValue {
  if (typeof raw === 'number' || typeof raw === 'string') return raw
  if (raw == null) return ''
  return String(raw)
}

function mapSelectOption(
  raw: Record<string, unknown>,
  names: Required<Pick<RsSelectFieldNames, 'label' | 'value' | 'disabled'>>,
): RsSelectOption {
  const value = coerceSelectValue(raw[names.value])
  const label = raw[names.label]
  return {
    ...raw,
    value,
    label: label == null ? String(value) : String(label),
    disabled: Boolean(raw[names.disabled]),
    title: typeof raw.title === 'string' ? raw.title : undefined,
  }
}

/**
 * 按 fieldNames 把业务选项正规化为 { label, value, disabled }。
 * 默认键即为 label / value / options，既有调用无需改。
 */
export function normalizeSelectOptions(
  options: RsSelectOptionsInput,
  fieldNames?: RsSelectFieldNames,
): RsSelectOptions {
  const labelKey = fieldNames?.label ?? 'label'
  const valueKey = fieldNames?.value ?? 'value'
  const optionsKey = fieldNames?.options ?? 'options'
  const disabledKey = fieldNames?.disabled ?? 'disabled'
  const groupLabelKey = fieldNames?.groupLabel ?? labelKey
  const result: Array<RsSelectOption | RsSelectOptionGroup> = []

  for (const item of options) {
    if (!item || typeof item !== 'object') continue
    const raw = item as Record<string, unknown>
    const nested = raw[optionsKey]
    if (Array.isArray(nested)) {
      const children: RsSelectOption[] = []
      for (const child of nested) {
        if (!child || typeof child !== 'object') continue
        children.push(mapSelectOption(child as Record<string, unknown>, {
          label: labelKey,
          value: valueKey,
          disabled: disabledKey,
        }))
      }
      result.push({
        label: String(raw[groupLabelKey] ?? ''),
        options: children,
      })
      continue
    }
    result.push(mapSelectOption(raw, { label: labelKey, value: valueKey, disabled: disabledKey }))
  }
  return result
}

/** 触发器 / tag 展示文案，对齐 Ant optionLabelProp */
export function optionDisplayLabel(option: RsSelectOption, prop = 'label'): string {
  return optionFieldText(option, prop)
}

export function comboboxBindingToTokens(value: unknown, multiple: boolean): string[] {
  if (multiple) return Array.isArray(value) ? value.map(String) : []
  if (value == null || value === '') return []
  return [String(value)]
}

export function selectModelEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value === '' || value == null) return []
  return [value]
}

export function filterSelectOptions(
  options: RsSelectOptions,
  query: string,
  contains: (text: string, search: string) => boolean,
  filterOption?: RsSelectFilterOption | boolean,
  optionFilterProp: RsSelectOptionFilterProp = 'label',
): RsSelectOptions {
  if (filterOption === false) return options
  const trimmed = query.trim()
  if (!trimmed) return options

  const match =
    typeof filterOption === 'function'
      ? (opt: RsSelectOption) => filterOption(trimmed, opt)
      : (opt: RsSelectOption) => defaultMatchOption(opt, trimmed, contains, optionFilterProp)

  const result: Array<RsSelectOption | RsSelectOptionGroup> = []
  for (const item of options) {
    if (isSelectOptionGroup(item)) {
      const filtered = item.options.filter(match)
      if (filtered.length > 0) {
        result.push({ label: item.label, options: filtered })
      }
    } else if (match(item)) {
      result.push(item)
    }
  }
  return result as RsSelectOptions
}

export function flattenSelectValues(options: RsSelectOptions): string[] {
  return flattenSelectOptions(options).map((opt) => toComboboxValue(opt.value))
}

export function toSelectedTokens(value: unknown, multiple: boolean): string[] {
  const entries = multiple
    ? selectModelEntries(value)
    : Array.isArray(value) || value === '' || value == null
      ? []
      : [value]
  const tokens: string[] = []
  for (const entry of entries) {
    const raw = unwrapSelectEntry(entry)
    if (raw === null) continue
    tokens.push(toComboboxValue(raw))
  }
  return tokens
}

export function isSelectLabeledValue(value: unknown): value is RsSelectLabeledValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'value' in value
}

export function unwrapSelectEntry(item: unknown): RsSelectValue | null {
  if (item == null || item === '') return null
  if (isSelectLabeledValue(item)) return item.value
  if (typeof item === 'string' || typeof item === 'number') return item
  return null
}

export function toLabeledValue(
  value: RsSelectValue,
  options: RsSelectOptions,
): RsSelectLabeledValue {
  const matched = flattenSelectOptions(options).find(
    (opt) => String(opt.value) === String(value),
  )
  return {
    value: matched ? matched.value : value,
    label: matched?.label ?? String(value),
  }
}

export function packSelectModel(
  values: RsSelectValue[],
  options: RsSelectOptions,
  multiple: boolean,
  labelInValue: boolean,
): RsSelectModelValue {
  if (multiple) {
    return labelInValue ? values.map((value) => toLabeledValue(value, options)) : values
  }
  const first = values[0]
  if (first === undefined) return ''
  return labelInValue ? toLabeledValue(first, options) : first
}

export function sortSelectOptions(
  options: RsSelectOptions,
  sort?: RsSelectFilterSort,
): RsSelectOptions {
  if (!sort) return options
  const next: Array<RsSelectOption | RsSelectOptionGroup> = []
  const flats: RsSelectOption[] = []
  const flushFlats = () => {
    if (!flats.length) return
    next.push(...[...flats].sort(sort))
    flats.length = 0
  }
  for (const item of options) {
    if (isSelectOptionGroup(item)) {
      flushFlats()
      next.push({ label: item.label, options: [...item.options].sort(sort) })
    } else {
      flats.push(item)
    }
  }
  flushFlats()
  return next as RsSelectOptions
}

export function splitByTokenSeparators(raw: string, separators: string[]): string[] | null {
  if (!separators.length) return null
  const found = separators.find((sep) => sep && raw.includes(sep))
  if (!found) return null
  return raw.split(found)
}
