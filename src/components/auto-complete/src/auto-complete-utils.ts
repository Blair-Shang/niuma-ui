import {
  filterSelectOptions,
  type RsSelectFilterOption,
  type RsSelectOption,
} from '../../select/src/select-utils'

export type RsAutoCompleteOption = RsSelectOption
export type RsAutoCompleteFilterOption = RsSelectFilterOption
export type RsAutoCompleteOptionInput = string | RsSelectOption

export function normalizeRsAutoCompleteOptions(
  options: ReadonlyArray<RsAutoCompleteOptionInput> | undefined,
): RsAutoCompleteOption[] {
  if (!options?.length) return []
  return options.map((item) =>
    typeof item === 'string' ? { label: item, value: item } : item,
  )
}

const containsIgnoreCase = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query.toLowerCase())

/** filterOption === false 时不过滤，交给远程 @search。 */
export function filterRsAutoCompleteOptions(
  options: RsAutoCompleteOption[],
  query: string,
  filterOption?: RsAutoCompleteFilterOption | boolean,
): RsAutoCompleteOption[] {
  if (filterOption === false) return options
  return filterSelectOptions(
    options,
    query,
    containsIgnoreCase,
    filterOption,
  ) as RsAutoCompleteOption[]
}
