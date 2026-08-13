import type { InjectionKey, Ref } from 'vue'
import type { RsComponentSize } from '../theme/types'

/** 单选值类型 */
export type RsRadioValue = string | number | boolean

/** RadioGroup 向下注入的上下文 */
export type RsRadioGroupContext = {
  size: Ref<RsComponentSize>
}

export const RS_RADIO_GROUP_KEY: InjectionKey<RsRadioGroupContext> = Symbol('rs-radio-group')
