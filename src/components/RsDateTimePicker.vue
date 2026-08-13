<script setup lang="ts">
import RsDatePicker from './RsDatePicker.vue'
import type { RsComponentSize } from '../theme/types'
import type {
  RsDatePickerModelValue,
  RsDatePickerShortcut,
  RsDatePickerValueFormat,
  RsDateRangeValue,
} from './date-picker-utils'

export type RsDateTimeRangeValue = RsDateRangeValue
export type RsDateTimePickerLabelPosition = 'top' | 'left'
export type {
  RsDatePickerModelValue,
  RsDatePickerShortcut,
  RsDatePickerValueFormat,
}

const model = defineModel<RsDatePickerModelValue>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    range?: boolean
    withSeconds?: boolean
    minDate?: string
    maxDate?: string
    /** string：YYYY-MM-DD HH:mm:ss；timestamp：毫秒时间戳 / [start, end] */
    valueFormat?: RsDatePickerValueFormat
    labelPosition?: RsDateTimePickerLabelPosition
    shortcuts?: RsDatePickerShortcut[]
    size?: RsComponentSize
  }>(),
  {
    disabled: false,
    required: false,
    range: false,
    withSeconds: false,
    valueFormat: 'string',
    labelPosition: 'top',
  },
)
</script>

<template>
  <RsDatePicker
    v-bind="$props"
    v-model="model"
    v-model:open="open"
    with-time
    :with-seconds="withSeconds"
    :value-format="valueFormat"
  />
</template>
