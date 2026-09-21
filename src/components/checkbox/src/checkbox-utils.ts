export type RsCheckboxAriaChecked = 'true' | 'false' | 'mixed'

export function resolveRsCheckboxAriaChecked(
  checked: boolean,
  indeterminate: boolean,
): RsCheckboxAriaChecked {
  if (indeterminate) return 'mixed'
  return checked ? 'true' : 'false'
}

/** `indeterminate` 不是 HTML 属性，必须写 IDL。 */
export function applyRsCheckboxIndeterminate(
  el: HTMLInputElement | null | undefined,
  indeterminate: boolean,
): void {
  if (!el) return
  el.indeterminate = indeterminate
}
