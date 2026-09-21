/** Switch v-model 取值：默认 boolean，也可为业务码如 'Y'/'N'、1/0 */
export type RsSwitchValue = boolean | string | number

export function resolveRsSwitchChecked(
  value: RsSwitchValue,
  checkedValue: RsSwitchValue,
): boolean {
  return Object.is(value, checkedValue)
}

export function resolveRsSwitchNext(
  checked: boolean,
  checkedValue: RsSwitchValue,
  uncheckedValue: RsSwitchValue,
): RsSwitchValue {
  return checked ? checkedValue : uncheckedValue
}
