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
    /**
     * 绑定值格式（展示仍为墙钟）。
     * string：YYYY-MM-DD HH:mm:ss；timestamp：毫秒；iso：本地偏移 RFC3339；
     * 亦可传入 dayjs 模板。
     */
    valueFormat?: RsDatePickerValueFormat
    labelPosition?: RsDateTimePickerLabelPosition
    shortcuts?: RsDatePickerShortcut[]
    size?: RsComponentSize
    id?: string
    invalid?: boolean
    showValidateMessage?: boolean
  }>(),
  {
    disabled: false,
    required: false,
    range: false,
    withSeconds: false,
    valueFormat: 'string',
    labelPosition: 'top',
    showValidateMessage: true,
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
