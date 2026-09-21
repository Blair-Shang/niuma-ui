<script setup lang="ts">
import { useTemplateRef } from 'vue'
import RsDatePicker, {
  type RsDatePickerExpose,
  type RsDatePickerLabelPosition,
} from './RsDatePicker.vue'
import type { RsComponentSize, RsRadius } from '../../../theme/types'
import type {
  RsDatePickerDisabledDate,
  RsDatePickerGetPopupContainer,
  RsDatePickerModelValue,
  RsDatePickerShortcut,
  RsDatePickerValueFormat,
  RsDateRangeValue,
  RsWeekStartsOn,
} from './date-picker-utils'
import type { RsFormRuleTrigger } from '../../form/src/form-rules'

export type RsDateTimeRangeValue = RsDateRangeValue
export type RsDateTimePickerLabelPosition = RsDatePickerLabelPosition
export type {
  RsDatePickerDisabledDate,
  RsDatePickerGetPopupContainer,
  RsDatePickerModelValue,
  RsDatePickerShortcut,
  RsDatePickerValueFormat,
  RsWeekStartsOn,
}
export type RsDateTimePickerExpose = RsDatePickerExpose
export type RsDateTimePickerInstance = RsDateTimePickerExpose & { $el: HTMLElement }

defineOptions({ name: 'RsDateTimePicker' })

const model = defineModel<RsDatePickerModelValue>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

withDefaults(
  defineProps<{
    name?: string
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
     * 绑定值格式（展示仍为墙钟，除非另传 format）。
     * string：YYYY-MM-DD HH:mm:ss；timestamp：毫秒；iso：本地偏移 RFC3339；
     * 亦可传入 dayjs 模板。
     */
    valueFormat?: RsDatePickerValueFormat
    format?: string
    labelPosition?: RsDateTimePickerLabelPosition
    shortcuts?: RsDatePickerShortcut[]
    size?: RsComponentSize
    radius?: RsRadius
    id?: string
    invalid?: boolean
    showValidateMessage?: boolean
    clearable?: boolean
    readonly?: boolean
    ariaLabel?: string
    weekStartsOn?: RsWeekStartsOn
    disabledDates?: string[]
    disabledDate?: RsDatePickerDisabledDate
    getPopupContainer?: RsDatePickerGetPopupContainer
  }>(),
  {
    disabled: false,
    required: false,
    range: false,
    withSeconds: false,
    valueFormat: 'string',
    labelPosition: 'top',
    showValidateMessage: true,
    clearable: false,
    readonly: false,
  },
)

const pickerRef = useTemplateRef<RsDatePickerExpose>('pickerRef')

const emit = defineEmits<{
  change: [value: RsDatePickerModelValue]
  openChange: [open: boolean]
  clear: []
  focus: []
  blur: []
}>()

defineExpose<RsDateTimePickerExpose>({
  setValue: (value) => pickerRef.value?.setValue(value),
  clearValidation: () => pickerRef.value?.clearValidation(),
  setError: (message) => pickerRef.value?.setError(message),
  validate: (trigger?: RsFormRuleTrigger) =>
    pickerRef.value?.validate(trigger) ?? Promise.resolve({ valid: true }),
  focus: () => pickerRef.value?.focus(),
  blur: () => pickerRef.value?.blur(),
})
</script>

<template>
  <RsDatePicker
    ref="pickerRef"
    v-bind="$props"
    v-model="model"
    v-model:open="open"
    with-time
    :with-seconds="withSeconds"
    :value-format="valueFormat"
    @change="emit('change', $event)"
    @open-change="emit('openChange', $event)"
    @clear="emit('clear')"
    @focus="emit('focus')"
    @blur="emit('blur')"
  />
</template>
