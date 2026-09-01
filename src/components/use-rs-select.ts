import { computed, nextTick, watch, type ModelRef } from 'vue'
import type { RsTranslateFn } from '../composables/useRsI18n'
import { useFilter } from './reka'
import {
  buildOptionDisabledMap,
  buildOptionLabelMap,
  comboboxBindingToTokens,
  filterSelectOptions,
  findSelectOption,
  flattenSelectOptions,
  flattenSelectValues,
  fromComboboxValue,
  isSelectLabeledValue,
  normalizeSelectOptions,
  optionDisplayLabel,
  packSelectModel,
  restoreSelectValue,
  restoreSelectValues,
  selectModelEntries,
  sortSelectOptions,
  splitByTokenSeparators,
  toComboboxValue,
  isSelectMultiple,
  toSelectedTokens,
  type RsSelectFieldNames,
  type RsSelectFilterOption,
  type RsSelectFilterSort,
  type RsSelectModelValue,
  type RsSelectOption,
  type RsSelectOptionFilterProp,
  type RsSelectOptionsInput,
  type RsSelectValue,
} from './select-utils'

/** RsSelect 行为层入参（不含尺寸 / 表单外观） */
export interface RsSelectEngineProps {
  options: RsSelectOptionsInput
  fieldNames?: RsSelectFieldNames
  optionLabelProp?: string
  optionFilterProp?: RsSelectOptionFilterProp
  filterOption?: RsSelectFilterOption | boolean
  filterSort?: RsSelectFilterSort
  searchable?: boolean
  creatable?: boolean
  multiple?: boolean
  remote?: boolean
  virtual?: boolean
  virtualThreshold?: number
  maxTagCount?: number
  maxTagPlaceholder?: string | ((omitted: number) => string)
  maxTagTooltip?: boolean
  maxTagTextLength?: number
  multipleLimit?: number
  labelInValue?: boolean
  tokenSeparators?: string[]
  autoClearSearchValue?: boolean
  /** 打开下拉时把当前选中值写入搜索框；默认不回填 */
  fillSearchWithValue?: boolean
  searchPlaceholder?: string
  emptyText?: string
  loadingText?: string
  placeholder?: string
}

export type RsSelectEngineEmit = {
  (e: 'search', query: string): void
  (e: 'select', value: RsSelectValue, option?: RsSelectOption): void
  (e: 'deselect', value: RsSelectValue, option?: RsSelectOption): void
  (e: 'clear'): void
}

/**
 * Select 过滤、选中、多选 tag、creatable / 分隔符提交。
 * 组件模板只消费返回值；表单校验仍留在 SFC。
 */
export function useRsSelect(
  props: RsSelectEngineProps,
  model: ModelRef<RsSelectModelValue>,
  open: ModelRef<boolean>,
  searchQuery: ModelRef<string>,
  emit: RsSelectEngineEmit,
  t: RsTranslateFn,
) {
  const { contains } = useFilter({ sensitivity: 'base' })
  const isMultiple = computed(() => isSelectMultiple(props.multiple))

  const normalizedOptions = computed(() =>
    normalizeSelectOptions(props.options, props.fieldNames),
  )

  const resolvedPlaceholder = computed(() => props.placeholder ?? t('select.placeholder'))
  const resolvedSearchPlaceholder = computed(
    () => props.searchPlaceholder ?? t('select.searchPlaceholder'),
  )
  const resolvedEmptyText = computed(() => props.emptyText ?? t('select.empty'))
  const resolvedLoadingText = computed(() => props.loadingText ?? t('select.loading'))
  const isSearchable = computed(() => Boolean(props.searchable || props.creatable))

  const labelMap = computed(() => buildOptionLabelMap(normalizedOptions.value))
  const disabledMap = computed(() => buildOptionDisabledMap(normalizedOptions.value))
  const flatOptions = computed(() => flattenSelectOptions(normalizedOptions.value))
  const flatCount = computed(() => flatOptions.value.length)
  const useVirtual = computed(
    () => Boolean(props.virtual) || flatCount.value > (props.virtualThreshold ?? 50),
  )

  /**
   * 可搜索时一律走本地过滤，并关掉 Reka 内置 filter。
   * Reka 的 filterSearch 与搜索框 searchQuery 不同步（打开时会被清空），
   * 默认依赖内置过滤时会出现：手输「NVA」已出「使用 NVA」，但 NVARCHAR 仍被整表挡住。
   */
  const useManualFilter = computed(
    () =>
      Boolean(props.remote) ||
      useVirtual.value ||
      isSearchable.value ||
      typeof props.filterOption === 'function' ||
      props.filterOption === false ||
      Boolean(props.optionFilterProp && props.optionFilterProp !== 'label') ||
      Boolean(props.filterSort) ||
      Boolean(props.fieldNames),
  )

  const displayOptions = computed(() => {
    let next = normalizedOptions.value
    if (!props.remote && props.filterOption !== false) {
      if (useManualFilter.value || props.filterOption) {
        next = filterSelectOptions(
          normalizedOptions.value,
          searchQuery.value,
          contains,
          props.filterOption,
          props.optionFilterProp,
        )
      }
    }
    return sortSelectOptions(next, props.filterSort)
  })

  const createValue = computed(() => searchQuery.value.trim())

  const canCreate = computed(() => {
    if (!props.creatable) return false
    const q = createValue.value
    if (!q) return false
    const lower = q.toLowerCase()
    return !flatOptions.value.some(
      (opt) =>
        String(opt.value).toLowerCase() === lower || String(opt.label).toLowerCase() === lower,
    )
  })

  const createOptionLabel = computed(() =>
    t('select.createOption', '使用 “{query}”').replace('{query}', createValue.value),
  )

  const virtualValues = computed(() => {
    const values = flattenSelectValues(displayOptions.value)
    if (!canCreate.value) return values
    return [createValue.value, ...values.filter((item) => String(item) !== createValue.value)]
  })

  const selectedValues = computed(() => toSelectedTokens(model.value, isMultiple.value))
  const hasValue = computed(() => selectedValues.value.length > 0)

  const visibleTagTokens = computed(() => {
    const all = selectedValues.value
    if (!isMultiple.value || props.maxTagCount == null || all.length <= props.maxTagCount) {
      return all
    }
    return all.slice(0, Math.max(0, props.maxTagCount))
  })

  const omittedTagCount = computed(() =>
    Math.max(0, selectedValues.value.length - visibleTagTokens.value.length),
  )

  const omittedTagLabel = computed(() => {
    const count = omittedTagCount.value
    if (typeof props.maxTagPlaceholder === 'function') return props.maxTagPlaceholder(count)
    if (props.maxTagPlaceholder) return props.maxTagPlaceholder
    return t('select.maxTagPlaceholder', { count })
  })

  function optionFromToken(token: string): RsSelectOption | undefined {
    return findSelectOption(normalizedOptions.value, String(token))
  }

  function tokenLabel(token: string): string {
    if (props.labelInValue) {
      for (const entry of selectModelEntries(model.value)) {
        if (
          isSelectLabeledValue(entry) &&
          toComboboxValue(entry.value) === token &&
          entry.label
        ) {
          return entry.label
        }
      }
    }
    const option = optionFromToken(token)
    if (option) return optionDisplayLabel(option, props.optionLabelProp)
    return labelMap.value.get(token) ?? fromComboboxValue(token)
  }

  const omittedTagTitle = computed(() => {
    if (!props.maxTagTooltip) return omittedTagLabel.value
    const omitted = selectedValues.value.slice(visibleTagTokens.value.length)
    if (!omitted.length) return omittedTagLabel.value
    return omitted.map((token) => tokenLabel(token)).join('、')
  })

  function truncateTagLabel(label: string): string {
    const max = props.maxTagTextLength
    if (!max || max < 1 || label.length <= max) return label
    return `${label.slice(0, max)}…`
  }

  const atMultipleLimit = computed(
    () =>
      isMultiple.value &&
      props.multipleLimit != null &&
      props.multipleLimit > 0 &&
      selectedValues.value.length >= props.multipleLimit,
  )

  function isOptionLimited(option: RsSelectOption): boolean {
    if (!atMultipleLimit.value) return false
    return !selectedValues.value.includes(toComboboxValue(option.value))
  }

  function isTokenDisabled(token: string): boolean {
    if (disabledMap.value.get(String(token))) return true
    const option = optionFromToken(token)
    return option ? isOptionLimited(option) : false
  }

  const singleDisplayLabel = computed(() => {
    if (isMultiple.value || !hasValue.value) return ''
    return tokenLabel(selectedValues.value[0]!)
  })

  function writeTokens(tokens: string[]): void {
    const values = restoreSelectValues(tokens, normalizedOptions.value)
    model.value = packSelectModel(
      values,
      normalizedOptions.value,
      isMultiple.value,
      Boolean(props.labelInValue),
    )
  }

  function emitSelectionDiff(prev: string[], next: string[]): void {
    const prevSet = new Set(prev)
    const nextSet = new Set(next)
    for (const token of next) {
      if (prevSet.has(token)) continue
      const value = restoreSelectValue(token, normalizedOptions.value)
      emit('select', value, findSelectOption(normalizedOptions.value, token))
    }
    for (const token of prev) {
      if (nextSet.has(token)) continue
      const value = restoreSelectValue(token, normalizedOptions.value)
      emit('deselect', value, findSelectOption(normalizedOptions.value, token))
    }
  }

  const comboboxModel = computed<string | string[] | undefined>({
    get() {
      if (isMultiple.value) return selectedValues.value
      return hasValue.value ? selectedValues.value[0] : undefined
    },
    set(value) {
      const prev = selectedValues.value
      const tokens = comboboxBindingToTokens(value, isMultiple.value)
      emitSelectionDiff(prev, tokens)
      writeTokens(tokens)
      if (props.autoClearSearchValue) searchQuery.value = ''
    },
  })

  function currentValues(): RsSelectValue[] {
    return restoreSelectValues(selectedValues.value, normalizedOptions.value)
  }

  function commitCreatedValue(value: string): void {
    const next = value.trim()
    if (!next) return
    const values = currentValues()
    if (values.some((item) => String(item) === next)) return
    if (isMultiple.value) {
      if (atMultipleLimit.value) return
      const prev = selectedValues.value
      const packed = packSelectModel(
        [...values, next],
        normalizedOptions.value,
        true,
        Boolean(props.labelInValue),
      )
      model.value = packed
      emitSelectionDiff(prev, toSelectedTokens(packed, true))
    } else {
      const prev = selectedValues.value
      model.value = packSelectModel(
        [next],
        normalizedOptions.value,
        false,
        Boolean(props.labelInValue),
      )
      emitSelectionDiff(prev, toSelectedTokens(model.value, false))
      open.value = false
    }
    if (props.autoClearSearchValue) searchQuery.value = ''
  }

  function consumeTokenSeparators(raw: string): void {
    if (!isMultiple.value && !props.creatable) return
    const parts = splitByTokenSeparators(raw, props.tokenSeparators ?? [])
    if (!parts) return
    const rest = parts.pop() ?? ''
    for (const part of parts) {
      const token = part.trim()
      if (!token) continue
      const matched = flatOptions.value.find(
        (opt) => String(opt.value) === token || String(opt.label) === token,
      )
      if (matched) {
        const prev = selectedValues.value
        const key = toComboboxValue(matched.value)
        if (prev.includes(key)) continue
        if (isMultiple.value && atMultipleLimit.value) continue
        const nextTokens = isMultiple.value ? [...prev, key] : [key]
        emitSelectionDiff(prev, nextTokens)
        writeTokens(nextTokens)
        if (!isMultiple.value) open.value = false
      } else if (props.creatable) {
        commitCreatedValue(token)
      }
    }
    if (rest !== raw) searchQuery.value = rest
  }

  watch(searchQuery, (query) => {
    if (props.remote) emit('search', query)
    if (props.tokenSeparators?.length) consumeTokenSeparators(query)
  })

  watch(open, async (isOpen) => {
    if (isOpen) {
      const pending = searchQuery.value
      await nextTick()
      await nextTick()
      // ComboboxInput 挂载时会 resetSearchTerm，把选中值写进搜索框。
      // 默认清空；受控 / 未清理的 searchValue 写回；fillSearchWithValue 才回填当前选中。
      if (pending) {
        searchQuery.value = pending
      } else if (props.fillSearchWithValue && !isMultiple.value && hasValue.value) {
        searchQuery.value = singleDisplayLabel.value
      } else {
        searchQuery.value = ''
      }
      return
    }
    if (props.autoClearSearchValue) searchQuery.value = ''
  })

  function onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return
    if (!canCreate.value) return
    event.preventDefault()
    event.stopPropagation()
    commitCreatedValue(createValue.value)
  }

  function onClear(event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()
    emitSelectionDiff(selectedValues.value, [])
    emit('clear')
    model.value = isMultiple.value ? [] : ''
  }

  function removeTag(value: string, event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (!isMultiple.value) return
    const prev = selectedValues.value
    const tokens = prev.filter((item) => item !== value)
    emitSelectionDiff(prev, tokens)
    writeTokens(tokens)
  }

  function setValue(value: unknown): void {
    if (isMultiple.value) {
      const list = Array.isArray(value) ? value : value !== '' && value != null ? [value] : []
      writeTokens(toSelectedTokens(list, true))
      return
    }
    writeTokens(toSelectedTokens(value, false))
  }

  function restoreTokenValue(token: string): RsSelectValue {
    return restoreSelectValue(token, normalizedOptions.value)
  }

  function optionOrCreate(token: string): RsSelectOption {
    return (
      optionFromToken(token) ?? {
        label: fromComboboxValue(token),
        value: restoreTokenValue(token),
      }
    )
  }

  return {
    normalizedOptions,
    resolvedPlaceholder,
    resolvedSearchPlaceholder,
    resolvedEmptyText,
    resolvedLoadingText,
    isMultiple,
    isSearchable,
    labelMap,
    useVirtual,
    useManualFilter,
    displayOptions,
    createValue,
    canCreate,
    createOptionLabel,
    virtualValues,
    selectedValues,
    hasValue,
    visibleTagTokens,
    omittedTagCount,
    omittedTagLabel,
    omittedTagTitle,
    singleDisplayLabel,
    comboboxModel,
    tokenLabel,
    truncateTagLabel,
    optionFromToken,
    optionOrCreate,
    isOptionLimited,
    isTokenDisabled,
    restoreTokenValue,
    onSearchKeydown,
    onClear,
    removeTag,
    setValue,
    resetSearch: () => {
      searchQuery.value = ''
    },
  }
}
