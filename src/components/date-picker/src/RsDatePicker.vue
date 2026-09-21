<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import RsButton from '../../button/src/RsButton.vue'
import RsCalendarGrid from '../../calendar-grid/src/RsCalendarGrid.vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import RsTimePicker from '../../time-picker/src/RsTimePicker.vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { placeAnchoredPopup, type RsOverlayBox } from '../../_shared/src/overlay-utils'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
} from '../../form/src/form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from '../../form/src/form-rules'
import {
  compareDates,
  EMPTY_DATE_RANGE,
  extractTimeFromDateTime,
  formatDateParts,
  formatDateTimeParts,
  formatPickerDisplay,
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
  resolveDatePickerPortalTarget,
  resolveWeekStartsOn,
  toInternalPickerValue,
  toRangeEndpointString,
  type RsDatePickerDisabledDate,
  type RsDatePickerGetPopupContainer,
  type RsDatePickerModelValue,
  type RsDatePickerShortcut,
  type RsDatePickerValueFormat,
  type RsDateRangeValue,
  type RsParsedDate,
  type RsWeekStartsOn,
} from './date-picker-utils'
import {
  containOverlayWheel,
  formatTimeParts,
  isTimeColumnScrollTarget,
} from '../../time-picker/src/time-picker-utils'

export type {
  RsDatePickerDisabledDate,
  RsDatePickerGetPopupContainer,
  RsDatePickerModelValue,
  RsDatePickerShortcut,
  RsDatePickerValueFormat,
  RsDateRangeValue,
  RsWeekStartsOn,
} from './date-picker-utils'
export type RsDatePickerLabelPosition = 'top' | 'left'

export interface RsDatePickerExpose {
  setValue: (value: unknown) => void
  clearValidation: () => void
  setError: (message: string) => void
  validate: (trigger?: RsFormRuleTrigger) => Promise<{
    valid: boolean
    message?: string
    name?: string
  }>
  focus: () => void
  blur: () => void
}

export type RsDatePickerInstance = RsDatePickerExpose & { $el: HTMLElement }

function isRangeModel(value: RsDatePickerModelValue): value is RsDateRangeValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('start' in value || 'end' in value)
}

defineOptions({ name: 'RsDatePicker', inheritAttrs: false })

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
     * 绑定值格式（展示仍为墙钟，除非另传 format）。
     * string：YYYY-MM-DD[/ HH:mm:ss]；timestamp：毫秒；iso：本地偏移 RFC3339；
     * 亦可传入 dayjs 模板（对齐 Element Plus value-format）。
     */
    valueFormat?: RsDatePickerValueFormat
    /** 触发器展示模板（dayjs）。与 valueFormat 分离，默认墙钟。 */
    format?: string
    labelPosition?: RsDatePickerLabelPosition
    /** 底部快捷选项（有值时替代「今天/现在」链接） */
    shortcuts?: RsDatePickerShortcut[]
    size?: RsComponentSize
    radius?: RsRadius
    id?: string
    invalid?: boolean
    showValidateMessage?: boolean
    clearable?: boolean
    readonly?: boolean
    ariaLabel?: string
    /** 一周起始。未传跟 locale（en-US 周日，zh-CN 周一） */
    weekStartsOn?: RsWeekStartsOn
    disabledDates?: string[]
    disabledDate?: RsDatePickerDisabledDate
    getPopupContainer?: RsDatePickerGetPopupContainer
  }>(),
  {
    disabled: false,
    required: false,
    range: false,
    withTime: false,
    valueFormat: 'string',
    labelPosition: 'top',
    showValidateMessage: true,
    clearable: false,
    readonly: false,
    disabledDates: () => [],
  },
)

const emit = defineEmits<{
  change: [value: RsDatePickerModelValue]
  openChange: [open: boolean]
  clear: []
  focus: []
  blur: []
}>()

const fallbackId = useId()
const panelId = useId()
const attrs = useAttrs()
const { t, locale } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const triggerIconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const clearIconSize = computed(() => Math.max(12, triggerIconSize.value - 2))
/** withTime 默认带秒；显式 withSeconds 优先（勿与 prop 同名，避免模板取到未传 prop） */
const resolvedWithSeconds = computed(() =>
  props.withSeconds !== undefined ? props.withSeconds : props.withTime,
)
const resolvedWeekStartsOn = computed(() =>
  resolveWeekStartsOn(locale.value, props.weekStartsOn),
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
const triggerId = computed(() => props.id || fallbackId)
const visibleMessage = computed(() =>
  boundToItem.value || props.showValidateMessage === false ? '' : autoMessage.value,
)
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const canInteract = computed(() => !resolvedDisabled.value && !props.readonly)

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
const panelTheme = ref<string | undefined>()
const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })

const todaySeed = getTodayDate()
const viewYear = ref(todaySeed.year)
const viewMonth = ref(todaySeed.month)
const startViewYear = ref(todaySeed.year)
const startViewMonth = ref(todaySeed.month)
const endViewYear = ref(todaySeed.year)
const endViewMonth = ref(todaySeed.month)

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

const displayOptions = computed(() => ({
  format: props.format,
  withTime: props.withTime,
}))

const displayValue = computed(() => {
  if (props.range) {
    const start = formatPickerDisplay(rangeModel.value.start, displayOptions.value)
    const end = formatPickerDisplay(rangeModel.value.end, displayOptions.value)
    if (start || end) {
      const separator = t('datePicker.separator')
      if (start && end) return `${start}${separator}${end}`
      return start || end
    }
    if (props.placeholder) return props.placeholder
    return props.withTime ? t('dateTimePicker.rangePlaceholder') : t('datePicker.rangePlaceholder')
  }

  if (!singleModel.value) {
    return props.placeholder ?? (props.withTime ? t('dateTimePicker.placeholder') : t('datePicker.placeholder'))
  }

  return formatPickerDisplay(singleModel.value, displayOptions.value)
})

const triggerIcon = computed(() => {
  if (props.range || props.withTime) return 'calendar-clock'
  return 'calendar-days'
})

const showClear = computed(
  () => props.clearable && !isEmpty.value && canInteract.value,
)

const portalTarget = computed(() =>
  resolveDatePickerPortalTarget(props.getPopupContainer, triggerRef.value),
)

const panelStyle = computed(() => ({
  top: `${popup.value.top}px`,
  left: `${popup.value.left}px`,
  '--rs-date-picker-radius': rsRadiusCss(resolvedRadius.value),
}))

const rootStyle = computed(() => ({
  '--rs-date-picker-radius': rsRadiusCss(resolvedRadius.value),
}))

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

function emitChange(): void {
  emit('change', model.value)
}

function confirmSingleSelection(): void {
  if (!draftDate.value) return

  if (props.withTime) {
    const combined = combineDraftDateTime(draftDate.value, draftTime.value)
    if (!combined) return
    singleModel.value = combined
    open.value = false
    emitChange()
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
  emitChange()
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
    emitChange()
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
  emitChange()
}

function confirmSelection(): void {
  if (props.range) {
    confirmRangeSelection()
    return
  }
  confirmSingleSelection()
}

function applyShortcut(shortcut: RsDatePickerShortcut): void {
  if (!canInteract.value) return
  const normalized = normalizeShortcutValue(shortcut.value(), { withTime: props.withTime })
  if (!normalized) return

  if (props.range) {
    const rangeValue: RsDateRangeValue =
      typeof normalized === 'string' ? { start: normalized, end: normalized } : normalized
    if (!rangeValue.start || !rangeValue.end) return
    if (!isDateRangeOrdered(rangeValue)) return
    rangeModel.value = rangeValue
    open.value = false
    emitChange()
    return
  }

  if (typeof normalized !== 'string') return
  singleModel.value = normalized
  open.value = false
  emitChange()
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
  emit('clear')
  emitChange()
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

function focus(): void {
  triggerRef.value?.focus()
}

function blur(): void {
  triggerRef.value?.blur()
}

function toggleOpen(): void {
  if (!canInteract.value) return
  open.value = !open.value
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (!canInteract.value || event.isComposing) return
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    open.value = false
    return
  }
  if (open.value) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    open.value = true
  }
}

function syncPanelTheme(): void {
  const el = triggerRef.value ?? rootRef.value
  if (!el) {
    panelTheme.value = undefined
    return
  }
  const themed = el.closest('[data-rs-theme]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
}

function placePopup(): void {
  const trigger = triggerRef.value
  const content = contentRef.value
  if (!trigger || !open.value || typeof window === 'undefined') return
  const anchor = trigger.getBoundingClientRect()
  const measured = content?.getBoundingClientRect()
  const prefWidth = props.range
    ? Math.max(anchor.width, measured?.width || Math.min(42 * 16, window.innerWidth - 32))
    : Math.max(anchor.width, measured?.width || Math.min(20 * 16, window.innerWidth - 32))
  popup.value = placeAnchoredPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: prefWidth, height: measured?.height || 320 },
    { width: window.innerWidth, height: window.innerHeight },
    6,
  )
}

let frame = 0
let overlayBound = false
let openWatchReady = false
let panelResize: ResizeObserver | undefined

function requestPlace(): void {
  if (typeof window === 'undefined') return
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function onDocPointerDown(event: PointerEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return
  if (rootRef.value?.contains(target)) return
  if (contentRef.value?.contains(target)) return
  if (target instanceof Element) {
    if (target.closest('.rs-time-picker__content')) return
  }
  open.value = false
}

function onWindowChange(event?: Event): void {
  if (!open.value) return
  if (event?.type === 'scroll' && isTimeColumnScrollTarget(event.target)) return
  requestPlace()
}

function attachPanelObserver(): void {
  if (typeof ResizeObserver === 'undefined') return
  panelResize?.disconnect()
  if (!contentRef.value) return
  panelResize = new ResizeObserver(() => requestPlace())
  panelResize.observe(contentRef.value)
}

function attachPanelWheel(): void {
  contentRef.value?.addEventListener('wheel', containOverlayWheel, { passive: false })
}

function detachPanelWheel(): void {
  contentRef.value?.removeEventListener('wheel', containOverlayWheel)
}

function attachOverlay(): void {
  if (overlayBound || typeof window === 'undefined') return
  overlayBound = true
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', onDocPointerDown)
  }
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachOverlay(): void {
  detachPanelWheel()
  panelResize?.disconnect()
  panelResize = undefined
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (!overlayBound) return
  overlayBound = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
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

defineExpose<RsDatePickerExpose>({
  setValue: setFieldValue,
  clearValidation,
  setError: (message: string) => {
    autoMessage.value = message
  },
  validate: runValidate,
  focus,
  blur,
})

watch(
  open,
  (isOpen) => {
    const skipEvent = !openWatchReady
    openWatchReady = true
    if (typeof document === 'undefined' || typeof window === 'undefined') return
    if (isOpen) {
      if (!canInteract.value) {
        open.value = false
        return
      }
      syncDraftFromModel()
      syncPanelTheme()
      attachOverlay()
      void nextTick(() => {
        requestPlace()
        attachPanelObserver()
        attachPanelWheel()
      })
      if (!skipEvent) emit('openChange', true)
      return
    }
    detachOverlay()
    if (!skipEvent) {
      emit('openChange', false)
      if (props.name) void runValidate('change')
    }
  },
  { immediate: true },
)

watch(resolvedDisabled, (disabled) => {
  if (disabled && open.value) open.value = false
})

onBeforeUnmount(detachOverlay)
</script>

<template>
  <div
    ref="rootRef"
    class="rs-field"
    :class="[`rs-field--label-${labelPosition}`, { 'rs-date-picker-wrap--clearable': showClear }]"
    :style="rootStyle"
  >
    <label v-if="label" class="rs-field__label" :for="triggerId">
      {{ label }}
      <span v-if="required" class="rs-field__required" aria-hidden="true">*</span>
    </label>

    <div class="rs-date-picker" :class="`rs-date-picker--${resolvedSize}`">
      <button
        v-bind="attrs"
        :id="triggerId"
        ref="triggerRef"
        type="button"
        class="rs-date-picker__trigger"
        :class="{
          'rs-date-picker__trigger--placeholder': isEmpty,
          'rs-date-picker__trigger--invalid': isInvalid,
        }"
        :disabled="resolvedDisabled"
        :aria-invalid="isInvalid || undefined"
        :aria-label="ariaLabel"
        aria-haspopup="dialog"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="open ? panelId : undefined"
        :aria-readonly="readonly || undefined"
        @click="toggleOpen"
        @keydown="onTriggerKeydown"
        @focus="emit('focus')"
        @blur="emit('blur')"
      >
        <span class="rs-date-picker__leading">
          <RsIcon :name="triggerIcon" :size="triggerIconSize" class="rs-date-picker__icon" aria-hidden="true" />
          <span class="rs-date-picker__value">{{ displayValue }}</span>
        </span>
        <RsIcon name="chevron-down" :size="triggerIconSize" class="rs-date-picker__chevron" aria-hidden="true" />
      </button>
      <RsButton
        v-if="showClear"
        class="rs-date-picker__clear"
        variant="text"
        :bordered="false"
        size="ssm"
        radius="full"
        icon="x"
        :icon-size="clearIconSize"
        icon-only
        :aria-label="withTime ? t('dateTimePicker.clear') : t('datePicker.clear')"
        @pointerdown.stop
        @click.stop="clearSelection"
      />
    </div>

    <Teleport :to="portalTarget">
      <div
        v-if="open && canInteract"
        :id="panelId"
        ref="contentRef"
        class="rs-date-picker__content"
        :class="{ 'rs-date-picker__content--range': range }"
        :data-placement="popup.placement"
        :data-rs-theme="panelTheme"
        :style="panelStyle"
        role="dialog"
        :aria-label="label || ariaLabel || (withTime ? t('dateTimePicker.placeholder') : t('datePicker.placeholder'))"
      >
        <div class="rs-date-picker__panel">
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
                  :disabled-dates="disabledDates"
                  :disabled-date="disabledDate"
                  :week-starts-on="resolvedWeekStartsOn"
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
                    :disabled="!draftStart || resolvedDisabled"
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
                  :disabled-dates="disabledDates"
                  :disabled-date="disabledDate"
                  :week-starts-on="resolvedWeekStartsOn"
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
                    :disabled="!draftEnd || resolvedDisabled"
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
              :disabled-dates="disabledDates"
              :disabled-date="disabledDate"
              :week-starts-on="resolvedWeekStartsOn"
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
                :disabled="!draftDate || resolvedDisabled"
              />
            </div>
          </template>

          <footer class="rs-date-picker__footer">
            <div class="rs-date-picker__footer-start">
              <div v-if="shortcuts?.length" class="rs-date-picker__shortcuts">
                <button
                  v-for="(item, index) in shortcuts"
                  :key="`${item.label}-${index}`"
                  type="button"
                  class="rs-date-picker__shortcut"
                  :disabled="resolvedDisabled"
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
      </div>
    </Teleport>

    <p v-if="visibleMessage" class="rs-date-picker-field__error" role="alert">
      {{ visibleMessage }}
    </p>
    <span v-if="hint" class="rs-field__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.rs-date-picker {
  position: relative;
  width: 100%;
}
.rs-date-picker-wrap--clearable .rs-date-picker__trigger {
  padding-inline-end: calc(var(--rs-space-md) + 2.25rem);
}
.rs-date-picker-wrap--clearable .rs-date-picker--ssm .rs-date-picker__trigger {
  padding-inline-end: calc(var(--rs-space-xs) + 2rem);
}
.rs-date-picker-wrap--clearable .rs-date-picker--sm .rs-date-picker__trigger {
  padding-inline-end: calc(var(--rs-space-sm) + 2rem);
}
.rs-date-picker-wrap--clearable .rs-date-picker--lg .rs-date-picker__trigger {
  padding-inline-end: calc(var(--rs-space-lg) + 2.25rem);
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
  border-radius: var(--rs-date-picker-radius, var(--rs-radius-sm));
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  text-align: start;
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
  opacity: var(--rs-date-picker-disabled-opacity, 0.38);
  cursor: not-allowed;
}
.rs-date-picker__trigger--placeholder .rs-date-picker__value {
  color: var(--rs-placeholder);
}
.rs-date-picker__trigger--invalid {
  border-color: var(--rs-danger, var(--rs-color-danger));
}
.rs-date-picker__trigger--invalid:focus-visible {
  border-color: var(--rs-danger, var(--rs-color-danger));
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px)
      color-mix(in srgb, var(--rs-danger) 14%, transparent);
}
.rs-date-picker__clear {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--rs-space-xs);
  z-index: 1;
  transform: translateY(-50%);
}
.rs-date-picker-field__error {
  margin: var(--rs-space-xs) 0 0;
  color: var(--rs-danger, var(--rs-color-danger));
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
