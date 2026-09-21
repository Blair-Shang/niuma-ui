import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { RsComponentSize } from '../../../theme/types'

/** 单选值类型 */
export type RsRadioValue = string | number | boolean

export const RS_RADIO_ORIENTATIONS = ['horizontal', 'vertical'] as const

export type RsRadioOrientation = (typeof RS_RADIO_ORIENTATIONS)[number]

export function isRsRadioOrientation(value: unknown): value is RsRadioOrientation {
  return typeof value === 'string' && (RS_RADIO_ORIENTATIONS as readonly string[]).includes(value)
}

export function resolveRsRadioOrientation(
  orientation?: RsRadioOrientation | null,
): RsRadioOrientation {
  return isRsRadioOrientation(orientation) ? orientation : 'horizontal'
}

export function isRsRadioValueEqual(
  left: RsRadioValue | undefined,
  right: RsRadioValue | undefined,
): boolean {
  return left === right
}

/** 原生 radio 的 value 只能是 string；选型比较仍用原始 RsRadioValue。 */
export function rsRadioInputValue(value: RsRadioValue): string {
  return `${value}`
}

/** RadioGroup 向下注入的上下文 */
export type RsRadioGroupContext = {
  size: Ref<RsComponentSize>
  disabled: ComputedRef<boolean>
  name: ComputedRef<string>
  isChecked: (value: RsRadioValue) => boolean
  select: (value: RsRadioValue) => void
}

export const RS_RADIO_GROUP_KEY: InjectionKey<RsRadioGroupContext> = Symbol('rs-radio-group')
