<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch } from 'vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from './reka'
import RsCalendarGrid from './RsCalendarGrid.vue'
import RsIcon from './RsIcon.vue'
import RsTimePicker from './RsTimePicker.vue'
import { useRsI18n } from '../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize } from '../theme/types'
import { useResolvedRsComponentSize } from './resolve-size'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
} from './form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from './form-rules'
import {
  compareDates,
  EMPTY_DATE_RANGE,
  extractTimeFromDateTime,
  formatDateParts,
  formatDateRangeLabel,
  formatDateDisplay,
  formatDateTimeDisplay,
  formatDateTimeParts,
  formatDateTimeRangeLabel,
  getNextMonth,
  getNowDateTime,
  formatTimestampValue,
  fromInternalPickerValue,
  getTodayDate,
  isDateRangeEmpty,
  isDateRangeOrdered,
  isDateWithinBounds,
  isTimestampRange,
  normalizeShortcutValue,
  parseDateTimeValue,
  parseDateValue,
  parseTimestampValue,
  toInternalPickerValue,
  toRangeEndpointString,
  type RsDatePickerModelValue,
  type RsDatePickerShortcut,
  type RsDatePickerValueFormat,
  type RsDateRangeValue,
  type RsParsedDate,
} from './date-picker-utils'
import { formatTimeParts } from './time-picker-utils'

export type {
  RsDatePickerModelValue,
  RsDatePickerShortcut,
  RsDatePickerValueFormat,
  RsDateRangeValue,
} from './date-picker-utils'
export type RsDatePickerLabelPosition = 'top' | 'left'

function isRangeModel(value: RsDatePickerModelValue): value is RsDateRangeValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('start' in value || 'end' in value)
}

defineOptions({ inheritAttrs: false })

const model = defineModel<RsDatePickerModelValue>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    /** 表单字段名，用于 RsForm rules 匹配与校验注册 */
    name?: string
    label?: string
    hint?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    range?: boolean
    minDate?: string
    maxDate?: string
    withTime?: boolean
    /**
     * 是否选择秒。未传时：withTime 为 true 则默认带秒，纯日期为 false。
     */
    withSeconds?: boolean
    /**
     * 绑定值格式（展示仍为墙钟）。
     * string：YYYY-MM-DD[/ HH:mm:ss]；timestamp：毫秒；iso：本地偏移 RFC3339；
     * 亦可传入 dayjs 模板（对齐 Element Plus value-format）。
     */
    valueFormat?: RsDatePickerValueFormat
    labelPosition?: RsDatePickerLabelPosition
    /** 底部快捷选项（有值时替代「今天/现在」链接） */
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
    withTime: false,
    valueFormat: 'string',
    labelPosition: 'top',
    showValidateMessage: true,
  },
)

const fieldId = useId()
const attrs = useAttrs()
const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const triggerIconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
/** withTime 默认带秒；显式 withSeconds 优先（勿与 prop 同名，避免模板取到未传 prop） */
const resolvedWithSeconds = computed(() =>
  props.withSeconds !== undefined ? props.withSeconds : props.withTime,
)
const formContext = useRsFormContext()
const formItem = useRsFormItemContext()
const boundToItem = computed(() =>
  isRsFormItemBoundControl(formItem, { id: props.id, name: props.name }),
)
const autoMessage = ref('')
const isInvalid = computed(() =>
  Boolean(
    props.invalid ||
      (boundToItem.value && formItem?.invalid.value) ||
      (!boundToItem.value && autoMessage.value),
  ),
)
const triggerId = computed(() => props.id || fieldId)
const visibleMessage = computed(() =>
  boundToItem.value || props.showValidateMessage === false ? '' : autoMessage.value,
)

const viewYear = ref(getTodayDate().year)
const viewMonth = ref(getTodayDate().month)
const startViewYear = ref(getTodayDate().year)
const startViewMonth = ref(getTodayDate().month)
const endViewYear = ref(getTodayDate().year)
const endViewMonth = ref(getTodayDate().month)

const draftDate = ref<RsParsedDate | null>(null)
const draftStart = ref<RsParsedDate | null>(null)
const draftEnd = ref<RsParsedDate | null>(null)
const draftTime = ref('')
const draftStartTime = ref('')
const draftEndTime = ref('')

const convertOptions = computed(() => ({
  valueFormat: props.valueFormat ?? 'string',
  withTime: props.withTime,
}))

const useTimestamp = computed(() => props.valueFormat === 'timestamp')

const rangeModel = computed<RsDateRangeValue>({
  get() {
    if (!props.range) return { ...EMPTY_DATE_RANGE }
    const value = model.value
    const opts = convertOptions.value
    if (isTimestampRange(value)) {
      return {
        start: formatTimestampValue(value[0], opts.withTime),
        end: formatTimestampValue(value[1], opts.withTime),
      }
    }
    if (!isRangeModel(value)) return { ...EMPTY_DATE_RANGE }
    return {
      start: toInternalPickerValue(value.start, opts) || undefined,
      end: toInternalPickerValue(value.end, opts) || undefined,
    }
  },
  set(value) {
    const opts = convertOptions.value
    if (useTimestamp.value) {
      const start = parseTimestampValue(value.start)
      const end = parseTimestampValue(value.end)
      model.value = start != null && end != null ? [start, end] : null
      return
    }
    model.value = {
      start: toRangeEndpointString(fromInternalPickerValue(value.start || '', opts)),
      end: toRangeEndpointString(fromInternalPickerValue(value.end || '', opts)),
    }
  },
})

const singleModel = computed({
  get() {
    if (props.range) return ''
    return toInternalPickerValue(model.value, convertOptions.value)
  },
  set(value: string) {
    model.value = fromInternalPickerValue(value, convertOptions.value)
  },
})

const startMaxDate = computed(() => {
  if (!draftEnd.value) return props.maxDate
  return formatDateParts(draftEnd.value)
})

const endMinDate = computed(() => {
  if (!draftStart.value) return props.minDate
  return formatDateParts(draftStart.value)
})

const isEmpty = computed(() =>
  props.range ? isDateRangeEmpty(rangeModel.value) : !singleModel.value,
)

const displayValue = computed(() => {
  if (props.range) {
    const formatted = props.withTime
      ? formatDateTimeRangeLabel(rangeModel.value, t('datePicker.separator'))
      : formatDateRangeLabel(rangeModel.value, t('datePicker.separator'))
    if (formatted) return formatted
    if (props.placeholder) return props.placeholder
    return props.withTime ? t('dateTimePicker.rangePlaceholder') : t('datePicker.rangePlaceholder')
  }

  if (!singleModel.value) {
    return props.placeholder ?? (props.withTime ? t('dateTimePicker.placeholder') : t('datePicker.placeholder'))
  }

  return props.withTime
    ? formatDateTimeDisplay(singleModel.value)
    : formatDateDisplay(singleModel.value)
})

const triggerIcon = computed(() => {
  if (props.range || props.withTime) return 'calendar-clock'
  return 'calendar-days'
})

function currentTimeValue(): string {
  const now = getNowDateTime()
  return formatTimeParts(now.hour, now.minute, resolvedWithSeconds.value ? now.second : undefined)
}

function resetRangeTimeDrafts(): void {
  const time = currentTimeValue()
  draftStartTime.value = time
  draftEndTime.value = time
}

function combineDraftDateTime(date: RsParsedDate, time: string): string | null {
  return formatDateTimeParts(date, time, resolvedWithSeconds.value)
}

function setEndViewFromStart(start: RsParsedDate): void {
  const next = getNextMonth(start.year, start.month)
  endViewYear.value = next.year
  endViewMonth.value = next.month
}

function syncSingleDraft(): void {
  if (props.withTime) {
    const parsed = parseDateTimeValue(singleModel.value)
    if (parsed) {
      draftDate.value = { year: parsed.year, month: parsed.month, day: parsed.day }
      draftTime.value = extractTimeFromDateTime(singleModel.value, resolvedWithSeconds.value)
      viewYear.value = parsed.year
      viewMonth.value = parsed.month
      return
    }

    const today = getTodayDate()
    draftDate.value = null
    draftTime.value = currentTimeValue()
    viewYear.value = today.year
    viewMonth.value = today.month
    return
  }

  const parsed = parseDateValue(singleModel.value)
  if (parsed) {
    draftDate.value = parsed
    viewYear.value = parsed.year
    viewMonth.value = parsed.month
    return
  }

  const today = getTodayDate()
  draftDate.value = null
  viewYear.value = today.year
  viewMonth.value = today.month
}

function syncRangeDraft(): void {
  const today = getTodayDate()
  const value = rangeModel.value

  if (props.withTime) {
    const start = parseDateTimeValue(value.start)
    const end = parseDateTimeValue(value.end)

    draftStart.value = start
      ? { year: start.year, month: start.month, day: start.day }
      : null
    draftEnd.value = end ? { year: end.year, month: end.month, day: end.day } : null

    if (start) {
      draftStartTime.value = extractTimeFromDateTime(value.start, resolvedWithSeconds.value)
      startViewYear.value = start.year
      startViewMonth.value = start.month
    } else {
      resetRangeTimeDrafts()
      startViewYear.value = today.year
      startViewMonth.value = today.month
    }

    if (end) {
      draftEndTime.value = extractTimeFromDateTime(value.end, resolvedWithSeconds.value)
      endViewYear.value = end.year
      endViewMonth.value = end.month
    } else if (start) {
      draftEndTime.value = draftStartTime.value
      setEndViewFromStart(start)
    } else {
      const next = getNextMonth(today.year, today.month)
      endViewYear.value = next.year
      endViewMonth.value = next.month
    }
    return
  }

  const start = parseDateValue(value.start)
  const end = parseDateValue(value.end)

  draftStart.value = start
  draftEnd.value = end

  if (start) {
    startViewYear.value = start.year
    startViewMonth.value = start.month
  } else {
    startViewYear.value = today.year
    startViewMonth.value = today.month
  }

  if (end) {
    endViewYear.value = end.year
    endViewMonth.value = end.month
  } else if (start) {
    setEndViewFromStart(start)
  } else {
    const next = getNextMonth(today.year, today.month)
    endViewYear.value = next.year
    endViewMonth.value = next.month
  }
}

function syncDraftFromModel(): void {
  if (props.range) {
    syncRangeDraft()
    return
  }
  syncSingleDraft()
}

function confirmSingleSelection(): void {
  if (!draftDate.value) return

  if (props.withTime) {
    const combined = combineDraftDateTime(draftDate.value, draftTime.value)
    if (!combined) return
    singleModel.value = combined
    open.value = false
    return
  }

  if (
    !isDateWithinBounds(draftDate.value.year, draftDate.value.month, draftDate.value.day, {
      minDate: props.minDate,
      maxDate: props.maxDate,
    })
  ) {
    return
  }

  singleModel.value = formatDateParts(draftDate.value)
  open.value = false
}

function confirmRangeSelection(): void {
  if (!draftStart.value || !draftEnd.value) return

  if (props.withTime) {
    const start = combineDraftDateTime(draftStart.value, draftStartTime.value)
    const end = combineDraftDateTime(draftEnd.value, draftEndTime.value)
    if (!start || !end) return
    if (!isDateRangeOrdered({ start, end })) return
    rangeModel.value = { start, end }
    open.value = false
    return
  }

  const start = formatDateParts(draftStart.value)
  const end = formatDateParts(draftEnd.value)
  if (!isDateRangeOrdered({ start, end })) return

  if (
    !isDateWithinBounds(draftStart.value.year, draftStart.value.month, draftStart.value.day, {
      minDate: props.minDate,
      maxDate: props.maxDate,
    })
    || !isDateWithinBounds(draftEnd.value.year, draftEnd.value.month, draftEnd.value.day, {
      minDate: props.minDate,
      maxDate: props.maxDate,
    })
  ) {
    return
  }

  rangeModel.value = { start, end }
  open.value = false
}

function confirmSelection(): void {
  if (props.range) {
    confirmRangeSelection()
    return
  }
  confirmSingleSelection()
}

function applyShortcut(shortcut: RsDatePickerShortcut): void {
  if (props.disabled) return
  const normalized = normalizeShortcutValue(shortcut.value(), { withTime: props.withTime })
  if (!normalized) return

  if (props.range) {
    const rangeValue: RsDateRangeValue =
      typeof normalized === 'string' ? { start: normalized, end: normalized } : normalized
    if (!rangeValue.start || !rangeValue.end) return
    if (!isDateRangeOrdered(rangeValue)) return
    rangeModel.value = rangeValue
    open.value = false
    return
  }

  if (typeof normalized !== 'string') return
  singleModel.value = normalized
  open.value = false
}

function clearSelection(): void {
  if (props.range) {
    if (useTimestamp.value) {
      model.value = null
    } else {
      rangeModel.value = { ...EMPTY_DATE_RANGE }
    }
    draftStart.value = null
    draftEnd.value = null
    if (props.withTime) resetRangeTimeDrafts()
  } else {
    singleModel.value = ''
    draftDate.value = null
    if (props.withTime) draftTime.value = currentTimeValue()
  }
  open.value = false
}

function selectToday(): void {
  const today = getTodayDate()
  const now = getNowDateTime()

  if (props.range) {
    draftStart.value = today
    draftEnd.value = today
    startViewYear.value = today.year
    startViewMonth.value = today.month
    endViewYear.value = today.year
    endViewMonth.value = today.month
    if (props.withTime) {
      const time = formatTimeParts(now.hour, now.minute, resolvedWithSeconds.value ? now.second : undefined)
      draftStartTime.value = time
      draftEndTime.value = time
    }
    confirmRangeSelection()
    return
  }

  draftDate.value = today
  viewYear.value = today.year
  viewMonth.value = today.month
  if (props.withTime) {
    draftTime.value = formatTimeParts(now.hour, now.minute, resolvedWithSeconds.value ? now.second : undefined)
  }
  confirmSingleSelection()
}

function handleDateSelect(date: RsParsedDate): void {
  draftDate.value = date
  viewYear.value = date.year
  viewMonth.value = date.month
}

function handleStartSelect(date: RsParsedDate): void {
  if (
    !isDateWithinBounds(date.year, date.month, date.day, {
      minDate: props.minDate,
      maxDate: startMaxDate.value,
    })
  ) {
    return
  }

  draftStart.value = date
  startViewYear.value = date.year
  startViewMonth.value = date.month

  if (draftEnd.value && compareDates(date, draftEnd.value) > 0) {
    draftEnd.value = null
    setEndViewFromStart(date)
  }
}

function handleEndSelect(date: RsParsedDate): void {
  if (
    !isDateWithinBounds(date.year, date.month, date.day, {
      minDate: endMinDate.value,
      maxDate: props.maxDate,
    })
  ) {
    return
  }

  if (draftStart.value && compareDates(date, draftStart.value) < 0) {
    return
  }

  draftEnd.value = date
  endViewYear.value = date.year
  endViewMonth.value = date.month
}

function clearValidation(): void {
  autoMessage.value = ''
}

function setFieldValue(value: unknown): void {
  if (props.range) {
    if (isRangeModel(value as RsDatePickerModelValue)) {
      model.value = value as RsDateRangeValue
      return
    }
    if (Array.isArray(value) && value.length >= 2) {
      model.value = { start: String(value[0] ?? ''), end: String(value[1] ?? '') }
      return
    }
    model.value = { ...EMPTY_DATE_RANGE }
    return
  }
  model.value = value == null ? '' : (value as RsDatePickerModelValue)
}

async function runValidate(trigger: RsFormRuleTrigger = 'submit') {
  const formRules = formContext?.getFieldRules(props.name) ?? []
  const localRules = buildLocalInputRules({ required: props.required })
  const rules = [...formRules, ...localRules]
  if (!rules.length) {
    autoMessage.value = ''
    return { valid: true as const, name: props.name }
  }
  const result = await runFormFieldRules(model.value, rules, { trigger })
  autoMessage.value = result.message ?? ''
  return { valid: result.valid, message: result.message, name: props.name }
}

useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue: setFieldValue,
  validate: (trigger) => runValidate(trigger ?? 'submit'),
  clearValidation,
  setError: (message: string) => {
    autoMessage.value = message
  },
}))

defineExpose({
  setValue: setFieldValue,
  clearValidation,
  validate: runValidate,
})

watch(open, (isOpen) => {
  if (isOpen) syncDraftFromModel()
  // 关闭面板后按 change 触发校验（对齐选择类控件）
  if (!isOpen && props.name) void runValidate('change')
})
</script>

<template>
  <div class="rs-field" :class="`rs-field--label-${labelPosition}`">
    <span v-if="label" class="rs-field__label">
      <label v-if="labelPosition === 'left'" :for="fieldId">{{ label }}</label>
      <template v-else>{{ label }}</template>
      <span v-if="required" class="rs-field__required" aria-hidden="true">*</span>
    </span>

    <div class="rs-date-picker" :class="`rs-date-picker--${resolvedSize}`">
      <PopoverRoot v-model:open="open">
        <PopoverTrigger
          v-bind="attrs"
          :id="triggerId"
          type="button"
          class="rs-date-picker__trigger"
          :class="{
            'rs-date-picker__trigger--placeholder': isEmpty,
            'rs-date-picker__trigger--invalid': isInvalid,
          }"
          :disabled="disabled"
          :aria-invalid="isInvalid || undefined"
        >
          <span class="rs-date-picker__leading">
            <RsIcon :name="triggerIcon" :size="triggerIconSize" class="rs-date-picker__icon" />
            <span class="rs-date-picker__value">{{ displayValue }}</span>
          </span>
          <RsIcon name="chevron-down" :size="triggerIconSize" class="rs-date-picker__chevron" />
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            class="rs-date-picker__content"
            :class="{ 'rs-date-picker__content--range': range }"
            :side-offset="6"
            align="start"
          >
            <div v-if="open" class="rs-date-picker__panel">
              <template v-if="range">
                <div class="rs-date-picker__range-grid">
                  <section class="rs-date-picker__range-pane">
                    <span class="rs-date-picker__pane-title">
                      {{ withTime ? t('dateTimePicker.rangeStart') : t('datePicker.rangeStart') }}
                    </span>
                    <RsCalendarGrid
                      v-model:view-year="startViewYear"
                      v-model:view-month="startViewMonth"
                      :selected="draftStart"
                      :range-start="draftStart"
                      :range-end="draftEnd"
                      :min-date="minDate"
                      :max-date="startMaxDate"
                      @select="handleStartSelect"
                    />
                    <div v-if="withTime" class="rs-date-picker__time-row">
                      <span class="rs-date-picker__time-label">{{ t('dateTimePicker.time') }}</span>
                      <RsTimePicker
                        v-model="draftStartTime"
                        class="rs-date-picker__time-picker"
                        embedded
                        :size="resolvedSize"
                        :with-seconds="resolvedWithSeconds"
                        :disabled="!draftStart || disabled"
                      />
                    </div>
                  </section>

                  <section class="rs-date-picker__range-pane">
                    <span class="rs-date-picker__pane-title">
                      {{ withTime ? t('dateTimePicker.rangeEnd') : t('datePicker.rangeEnd') }}
                    </span>
                    <RsCalendarGrid
                      v-model:view-year="endViewYear"
                      v-model:view-month="endViewMonth"
                      :selected="draftEnd"
                      :range-start="draftStart"
                      :range-end="draftEnd"
                      :min-date="endMinDate"
                      :max-date="maxDate"
                      @select="handleEndSelect"
                    />
                    <div v-if="withTime" class="rs-date-picker__time-row">
                      <span class="rs-date-picker__time-label">{{ t('dateTimePicker.time') }}</span>
                      <RsTimePicker
                        v-model="draftEndTime"
                        class="rs-date-picker__time-picker"
                        embedded
                        :size="resolvedSize"
                        :with-seconds="resolvedWithSeconds"
                        :disabled="!draftEnd || disabled"
                      />
                    </div>
                  </section>
                </div>
              </template>

              <template v-else>
                <RsCalendarGrid
                  v-model:view-year="viewYear"
                  v-model:view-month="viewMonth"
                  :selected="draftDate"
                  :min-date="minDate"
                  :max-date="maxDate"
                  @select="handleDateSelect"
                />
                <div v-if="withTime" class="rs-date-picker__time-row">
                  <span class="rs-date-picker__time-label">{{ t('dateTimePicker.time') }}</span>
                  <RsTimePicker
                    v-model="draftTime"
                    class="rs-date-picker__time-picker"
                    embedded
                    :size="resolvedSize"
                    :with-seconds="resolvedWithSeconds"
                    :disabled="!draftDate || disabled"
                  />
                </div>
              </template>

              <footer class="rs-date-picker__footer">
                <div class="rs-date-picker__footer-start">
                  <div v-if="shortcuts?.length" class="rs-date-picker__shortcuts">
                    <button
                      v-for="item in shortcuts"
                      :key="item.label"
                      type="button"
                      class="rs-date-picker__shortcut"
                      :disabled="disabled"
                      @click="applyShortcut(item)"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                  <button v-else type="button" class="rs-date-picker__link" @click="selectToday">
                    {{
                      range
                        ? withTime
                          ? t('dateTimePicker.now')
                          : t('datePicker.rangeToday')
                        : withTime
                          ? t('dateTimePicker.now')
                          : t('datePicker.today')
                    }}
                  </button>
                </div>
                <div class="rs-date-picker__actions">
                  <button type="button" class="rs-date-picker__ghost" @click="clearSelection">
                    {{ withTime ? t('dateTimePicker.clear') : t('datePicker.clear') }}
                  </button>
                  <button
                    type="button"
                    class="rs-date-picker__confirm"
                    :disabled="range ? !draftStart || !draftEnd : !draftDate || (withTime && !draftTime)"
                    @click="confirmSelection"
                  >
                    {{ t('datePicker.confirm') }}
                  </button>
                </div>
              </footer>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </div>

    <p v-if="visibleMessage" class="rs-date-picker-field__error" role="alert">
      {{ visibleMessage }}
    </p>
    <span v-if="hint" class="rs-field__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.rs-date-picker {
  width: 100%;
}
.rs-date-picker__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  width: 100%;
  height: var(--rs-control-height-md);
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  text-align: left;
  cursor: pointer;
  outline: none;
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
}
.rs-date-picker--ssm .rs-date-picker__trigger {
  height: var(--rs-control-height-ssm);
  min-height: var(--rs-control-height-ssm);
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}
.rs-date-picker--sm .rs-date-picker__trigger {
  height: var(--rs-control-height-sm);
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}
.rs-date-picker--lg .rs-date-picker__trigger {
  height: var(--rs-control-height-lg);
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}
.rs-date-picker__trigger:hover:not(:disabled) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}
.rs-date-picker__trigger:focus-visible {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-input-bg);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
.rs-date-picker__trigger:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.rs-date-picker__trigger--placeholder .rs-date-picker__value {
  color: var(--rs-placeholder);
}
.rs-date-picker__trigger--invalid {
  border-color: var(--rs-danger, var(--rs-color-danger, #dc2626));
}
.rs-date-picker__trigger--invalid:focus-visible {
  border-color: var(--rs-danger, var(--rs-color-danger, #dc2626));
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px)
      color-mix(in srgb, var(--rs-danger, #dc2626) 14%, transparent);
}
.rs-date-picker-field__error {
  margin: var(--rs-space-xs) 0 0;
  color: var(--rs-danger, var(--rs-color-danger, #dc2626));
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}
.rs-date-picker__leading {
  display: inline-flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: var(--rs-space-sm);
}
.rs-date-picker__icon,
.rs-date-picker__chevron {
  flex-shrink: 0;
  color: var(--rs-muted);
}
.rs-date-picker__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<style>
.rs-date-picker__content {
  /* 高于 RsDialog，避免在对话框内被遮挡 */
  z-index: calc(var(--rs-z-modal) + 2);
  padding: 0.75rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow-lg);
  outline: none;
  /* 允许页脚/时间行完整展示，避免被裁切 */
  overflow: visible;
}
.rs-date-picker__content--range {
  width: min(42rem, calc(100vw - 2rem));
}
.rs-date-picker__content:not(.rs-date-picker__content--range) {
  width: min(20rem, calc(100vw - 2rem));
}
.rs-date-picker__panel {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
  overflow: visible;
}
.rs-date-picker__range-grid {
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 40rem) {
  .rs-date-picker__range-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.rs-date-picker__range-pane {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
  padding: 0.5rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  background: color-mix(in srgb, var(--rs-surface) 72%, transparent);
}
.rs-date-picker__pane-title {
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-muted);
}
.rs-date-picker__footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  margin-top: var(--rs-space-xs);
  padding-top: 0.75rem;
  border-top: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface-elevated);
}
.rs-date-picker__footer-start {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
}
.rs-date-picker__shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
}
.rs-date-picker__shortcut {
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-text);
  font-size: var(--rs-font-size-xs);
  line-height: 1.5;
  cursor: pointer;
  transition:
    border-color var(--rs-transition-fast),
    color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}
.rs-date-picker__shortcut:hover:not(:disabled) {
  border-color: var(--rs-primary);
  color: var(--rs-primary);
  background: color-mix(in srgb, var(--rs-primary) 8%, transparent);
}
.rs-date-picker__shortcut:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.rs-date-picker__link {
  border: 0;
  background: transparent;
  color: var(--rs-primary);
  font-size: var(--rs-font-size-xs);
  cursor: pointer;
}
.rs-date-picker__link:hover {
  text-decoration: underline;
}
.rs-date-picker__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
}
.rs-date-picker__ghost,
.rs-date-picker__confirm {
  border: 0;
  border-radius: var(--rs-radius-sm);
  padding: 0.375rem 0.625rem;
  font-size: var(--rs-font-size-xs);
  cursor: pointer;
}
.rs-date-picker__ghost {
  background: transparent;
  color: var(--rs-muted);
}
.rs-date-picker__ghost:hover {
  background: var(--rs-surface-hover);
  color: var(--rs-text);
}
.rs-date-picker__confirm {
  background: var(--rs-primary);
  color: var(--rs-primary-foreground);
}
.rs-date-picker__confirm:hover:not(:disabled) {
  opacity: 0.92;
}
.rs-date-picker__confirm:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.rs-date-picker__time-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  padding-top: var(--rs-space-sm);
  border-top: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface-elevated);
}
.rs-date-picker__time-label {
  flex-shrink: 0;
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  color: var(--rs-muted);
}
.rs-date-picker__time-picker {
  flex: 1;
  min-width: 0;
}
</style>
