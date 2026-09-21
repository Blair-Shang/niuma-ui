export const RS_INPUT_TYPES = [
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
] as const

export type RsInputType = (typeof RS_INPUT_TYPES)[number]

export function isRsInputType(value: unknown): value is RsInputType {
  return typeof value === 'string' && (RS_INPUT_TYPES as readonly string[]).includes(value)
}

export function resolveRsInputType(type?: string | null): RsInputType {
  return isRsInputType(type) ? type : 'text'
}

/** modelValue 契约恒为 string；兜住外部误传 number / null。 */
export function normalizeRsInputValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`
  }
  return ''
}

/** 未显式传 autocomplete 时关闭快捷填充；密码框用 new-password 更稳。 */
export function resolveRsInputAutocomplete(
  autocomplete: string | undefined,
  type: string,
): string {
  if (autocomplete != null && autocomplete !== '') return autocomplete
  return type === 'password' ? 'new-password' : 'off'
}

/** 密码显隐：可见时原生 type 改成 text，其余跟 prop。 */
export function resolveRsInputControlType(type: string, passwordVisible: boolean): string {
  if (type === 'password' && passwordVisible) return 'text'
  return type
}

export function hasRsInputAddonAfterContent(
  hasSlot: boolean,
  addonAfter?: string | null,
): boolean {
  return hasSlot || (addonAfter != null && addonAfter !== '')
}
