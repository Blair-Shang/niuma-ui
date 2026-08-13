import type { InjectionKey } from 'vue'
import type { RsComponentSize } from '../theme/types'

/** Descriptions 尺寸与全局控件尺寸对齐：ssm / sm / md / lg */
export type RsDescriptionsSize = RsComponentSize

export type RsDescriptionsLabelPlacement = 'left' | 'top'

export type RsDescriptionsItem = {
  label: string
  value?: string | number | null
  span?: number
  key?: string | number
}

export type RsDescriptionsContext = {
  labelPlacement: RsDescriptionsLabelPlacement
  bordered: boolean
  size: RsDescriptionsSize
  columns: number
}

export const RS_DESCRIPTIONS_KEY: InjectionKey<RsDescriptionsContext> =
  Symbol('rs-descriptions')
