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
import RsIcon from '../../icon/src/RsIcon.vue'
import RsTimePickerColumns from './RsTimePickerColumns.vue'
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
  containOverlayWheel,
  EMPTY_TIME_RANGE,
  formatTimeDisplay,
  formatTimeFromParts,
  formatTimeRangeDisplay,
  getCurrentTime,
  isTimeColumnScrollTarget,
  isTimeRangeEmpty,
  isTimeRangeOrderedValues,
  isTimeWithinBounds,
  parseTimeValue,
  pickEarlierTime,
  pickLaterTime,
  resolveTimePickerPortalTarget,
  type RsTimePickerDisabledTime,
  type RsTimePickerGetPopupContainer,
  type RsTimePickerHourCycle,
  type RsTimePickerModelValue,
  type RsTimePickerShortcut,
  type RsTimeRangeValue,
  type RsTimeUnit,
} from './time-picker-utils'

defineOptions({ name: 'RsTimePicker', inheritAttrs: false })

export type {
  RsTimePickerDisabledTime,
  RsTimePickerGetPopupContainer,
  RsTimePickerHourCycle,
  RsTimePickerModelValue,
  RsTimePickerShortcut,
  RsTimeRangeValue,
} from './time-picker-utils'
export type RsTimePickerLabelPosition = 'top' | 'left'

export interface RsTimePickerExpose {
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

export type RsTimePickerInstance = RsTimePickerExpose & { $el: HTMLElement }

export interface RsTimePickerColumnsExpose {
  scrollToSelectionAfterPaint: () => void
}

function isTimeRangeModel(value: RsTimePickerModelValue): value is RsTimeRangeValue {
  return typeof value === 'object' && value !== null && ('start' in value || 'end' in value)
}

const model = defineModel<RsTimePickerModelValue>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    name?: string
    label?: string
    hint?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    range?: boolean
    withSeconds?: boolean
    minTime?: string
    maxTime?: string
    embedded?: boolean
    labelPosition?: RsTimePickerLabelPosition
    size?: RsComponentSize
    radius?: RsRadius
    id?: string
    invalid?: boolean
    showValidateMessage?: boolean
    clearable?: boolean
    readonly?: boolean
    ariaLabel?: string
    hourCycle?: RsTimePickerHourCycle
    minuteStep?: number
    disabledTime?: RsTimePickerDisabledTime
    shortcuts?: RsTimePickerShortcut[]
    getPopupContainer?: RsTimePickerGetPopupContainer
  }>(),
  {
    disabled: false,
    required: false,
    range: false,
    withSeconds: false,
    embedded: false,
    labelPosition: 'top',
    showValidateMessage: true,
    clearable: false,
    readonly: false,
    hourCycle: 24,
    minuteStep: 1,
  },
)

const emit = defineEmits<{
  change: [value: RsTimePickerModelValue]
  openChange: [open: boolean]
  clear: []
  focus: []
  blur: []
}>()

const fallbackId = useId()
const panelId = useId()
const attrs = useAttrs()
const { t, locale } = useRsI18n()
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
  props.embedded || boundToItem.value || props.showValidateMessage === false ? '' : autoMessage.value,
)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const triggerIconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const clearIconSize = computed(() => Math.max(12, triggerIconSize.value - 2))
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const canInteract = computed(() => !resolvedDisabled.value && !props.readonly)
const columnsRef = useTemplateRef<RsTimePickerColumnsExpose>('columnsRef')
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
const panelTheme = ref<string | undefined>()
const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })

const draftHour = ref(0)
const draftMinute = ref(0)
const draftSecond = ref(0)
const draftStartTime = ref('')
const draftEndTime = ref('')

const rangeModel = computed<RsTimeRangeValue>({
  get() {
    if (!props.range) return { ...EMPTY_TIME_RANGE }
    return isTimeRangeModel(model.value) ? model.value : { ...EMPTY_TIME_RANGE }
  },
  set(value) {
    model.value = value
  },
})

const singleModel = computed({
  get() {
    if (props.range) return ''
    return typeof model.value === 'string' ? model.value : ''
  },
  set(value: string) {
    model.value = value
  },
})

const startMaxTime = computed(() =>
  pickEarlierTime(props.maxTime, draftEndTime.value, props.withSeconds),
)

const endMinTime = computed(() =>
  pickLaterTime(props.minTime, draftStartTime.value, props.withSeconds),
)

const isEmpty = computed(() =>
  props.range ? isTimeRangeEmpty(rangeModel.value) : !singleModel.value,
)

const displayOptions = computed(() => ({
  hourCycle: props.hourCycle,
  withSeconds: props.withSeconds,
  locale: locale.value,
}))

const displayValue = computed(() => {
  if (props.range) {
    const formatted = formatTimeRangeDisplay(rangeModel.value, {
      separator: t('timePicker.separator'),
      ...displayOptions.value,
    })
    if (formatted) return formatted
    return props.placeholder ?? t('timePicker.rangePlaceholder')
  }

  if (!singleModel.value) {
    return props.placeholder ?? (props.embedded ? t('timePicker.embeddedPlaceholder') : t('timePicker.placeholder'))
  }
  return formatTimeDisplay(singleModel.value, displayOptions.value)
})

const draftTime = computed({
  get() {
    return formatTimeFromParts(
      draftHour.value,
      draftMinute.value,
      draftSecond.value,
      props.withSeconds,
    )
  },
  set(value: string) {
    const parsed = parseTimeValue(value, props.withSeconds)
    if (!parsed) return
    draftHour.value = parsed.hour
    draftMinute.value = parsed.minute
    draftSecond.value = parsed.second
  },
})

const showClear = computed(
  () => props.clearable && !isEmpty.value && canInteract.value && !props.embedded,
)

const portalTarget = computed(() =>
  resolveTimePickerPortalTarget(props.getPopupContainer, triggerRef.value),
)

const panelStyle = computed(() => ({
  top: `${popup.value.top}px`,
  left: `${popup.value.left}px`,
  '--rs-time-picker-radius': rsRadiusCss(resolvedRadius.value),
}))

const rootStyle = computed(() => ({
  '--rs-time-picker-radius': rsRadiusCss(resolvedRadius.value),
}))

function syncSingleDraft(): void {
  const parsed = parseTimeValue(singleModel.value, props.withSeconds)
  if (parsed) {
    draftHour.value = parsed.hour
    draftMinute.value = parsed.minute
    draftSecond.value = parsed.second
    return
  }

  const current = getCurrentTime()
  draftHour.value = current.hour
  draftMinute.value = current.minute
  draftSecond.value = current.second
}

function syncRangeDraft(): void {
  const start = parseTimeValue(rangeModel.value.start, props.withSeconds)
  const end = parseTimeValue(rangeModel.value.end, props.withSeconds)
  const current = getCurrentTime()

  draftStartTime.value = start
    ? formatTimeFromParts(start.hour, start.minute, start.second, props.withSeconds)
    : formatTimeFromParts(9, 0, 0, props.withSeconds)

  draftEndTime.value = end
    ? formatTimeFromParts(end.hour, end.minute, end.second, props.withSeconds)
    : formatTimeFromParts(
        start?.hour ?? Math.min(current.hour + 1, 23),
        start?.minute ?? current.minute,
        start?.second ?? current.second,
        props.withSeconds,
      )
}

function syncDraftFromModel(): void {
  if (props.range) {
    syncRangeDraft()
    return
  }
  syncSingleDraft()
}

function isUnitDisabled(unit: RsTimeUnit, value: number): boolean {
  if (props.disabledTime?.(unit, value)) return true
  const hour = unit === 'hour' ? value : draftHour.value
  const minute = unit === 'minute' ? value : draftMinute.value
  const second = unit === 'second' ? value : draftSecond.value
  return !isTimeWithinBounds(hour, minute, second, {
    minTime: props.minTime,
    maxTime: props.maxTime,
    withSeconds: props.withSeconds,
  })
}

function emitChange(): void {
  emit('change', model.value)
}

function confirmSingleSelection(): void {
  if (
    !isTimeWithinBounds(draftHour.value, draftMinute.value, draftSecond.value, {
      minTime: props.minTime,
      maxTime: props.maxTime,
      withSeconds: props.withSeconds,
    })
  ) {
    return
  }

  singleModel.value = formatTimeFromParts(
    draftHour.value,
    draftMinute.value,
    draftSecond.value,
    props.withSeconds,
  )
  open.value = false
  emitChange()
}

function confirmRangeSelection(): void {
  const start = draftStartTime.value
  const end = draftEndTime.value
  const startParsed = parseTimeValue(start, props.withSeconds)
  const endParsed = parseTimeValue(end, props.withSeconds)
  if (!startParsed || !endParsed) return

  if (!isTimeRangeOrderedValues(start, end, props.withSeconds)) return
  if (
    !isTimeWithinBounds(startParsed.hour, startParsed.minute, startParsed.second, {
      minTime: props.minTime,
      maxTime: startMaxTime.value,
      withSeconds: props.withSeconds,
    }) ||
    !isTimeWithinBounds(endParsed.hour, endParsed.minute, endParsed.second, {
      minTime: endMinTime.value,
      maxTime: props.maxTime,
      withSeconds: props.withSeconds,
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

function clearSelection(): void {
  if (props.range) {
    rangeModel.value = { ...EMPTY_TIME_RANGE }
  } else {
    singleModel.value = ''
  }
  open.value = false
  emit('clear')
  emitChange()
}

function applyShortcut(shortcut: RsTimePickerShortcut): void {
  if (!canInteract.value) return
  const next = shortcut.value()
  if (props.range) {
    if (typeof next === 'string' || !next.start || !next.end) return
    if (!isTimeRangeOrderedValues(next.start, next.end, props.withSeconds)) return
    rangeModel.value = { start: next.start, end: next.end }
    open.value = false
    emitChange()
    return
  }
  if (typeof next !== 'string' || !parseTimeValue(next, props.withSeconds)) return
  singleModel.value = next
  open.value = false
  emitChange()
}

function selectPreset(): void {
  if (props.range) {
    draftStartTime.value = formatTimeFromParts(9, 0, 0, props.withSeconds)
    draftEndTime.value = formatTimeFromParts(18, 0, 0, props.withSeconds)
    confirmRangeSelection()
    return
  }

  const current = getCurrentTime()
  draftHour.value = current.hour
  draftMinute.value = current.minute
  draftSecond.value = current.second
  confirmSingleSelection()
}

function clearValidation(): void {
  autoMessage.value = ''
}

function setFieldValue(value: unknown): void {
  if (props.range) {
    if (isTimeRangeModel(value as RsTimePickerModelValue)) {
      model.value = value as RsTimeRangeValue
      return
    }
    if (Array.isArray(value) && value.length >= 2) {
      model.value = { start: String(value[0] ?? ''), end: String(value[1] ?? '') }
      return
    }
    model.value = { ...EMPTY_TIME_RANGE }
    return
  }
  model.value = value == null ? '' : String(value)
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
    ? Math.max(anchor.width, measured?.width || Math.min(28 * 16, window.innerWidth - 32))
    : Math.max(anchor.width, measured?.width || Math.min(18 * 16, window.innerWidth - 32))
  popup.value = placeAnchoredPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: prefWidth, height: measured?.height || 280 },
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
  if (target instanceof Element && target.closest('.rs-time-picker__content')) return
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

defineExpose<RsTimePickerExpose>({
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
      void nextTick(async () => {
        requestPlace()
        attachPanelObserver()
        attachPanelWheel()
        if (!props.range) {
          await nextTick()
          columnsRef.value?.scrollToSelectionAfterPaint()
        }
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
    :class="[
      embedded ? 'rs-time-picker-embedded' : 'rs-field',
      `rs-time-picker--${resolvedSize}`,
      !embedded && `rs-field--label-${labelPosition}`,
      { 'rs-time-picker-wrap--clearable': showClear },
    ]"
    :style="rootStyle"
  >
    <label v-if="!embedded && label" class="rs-field__label" :for="triggerId">
      {{ label }}
      <span v-if="required" class="rs-field__required" aria-hidden="true">*</span>
    </label>

    <div class="rs-time-picker">
      <button
        v-bind="embedded ? undefined : attrs"
        :id="embedded ? undefined : triggerId"
        ref="triggerRef"
        type="button"
        class="rs-time-picker__trigger"
        :class="{
          'rs-time-picker__trigger--placeholder': isEmpty,
          'rs-time-picker__trigger--embedded': embedded,
          'rs-time-picker__trigger--invalid': !embedded && isInvalid,
        }"
        :disabled="resolvedDisabled"
        :aria-invalid="!embedded && isInvalid ? true : undefined"
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
        <span class="rs-time-picker__leading">
          <RsIcon
            v-if="!embedded"
            name="clock"
            :size="triggerIconSize"
            class="rs-time-picker__icon"
            aria-hidden="true"
          />
          <span class="rs-time-picker__value">{{ displayValue }}</span>
        </span>
        <RsIcon name="chevron-down" :size="triggerIconSize" class="rs-time-picker__chevron" aria-hidden="true" />
      </button>
      <RsButton
        v-if="showClear"
        class="rs-time-picker__clear"
        variant="text"
        :bordered="false"
        size="ssm"
        radius="full"
        icon="x"
        :icon-size="clearIconSize"
        icon-only
        :aria-label="range ? t('timePicker.rangeClear') : t('timePicker.clear')"
        @pointerdown.stop
        @click.stop="clearSelection"
      />
    </div>

    <Teleport :to="portalTarget">
      <div
        v-if="open && canInteract"
        :id="panelId"
        ref="contentRef"
        class="rs-time-picker__content"
        :class="{
          'rs-time-picker__content--range': range && !embedded,
          'rs-time-picker__content--embedded': embedded,
        }"
        :data-placement="popup.placement"
        :data-rs-theme="panelTheme"
        :style="panelStyle"
        role="dialog"
        :aria-label="label || ariaLabel || (range ? t('timePicker.rangePlaceholder') : t('timePicker.placeholder'))"
      >
        <div class="rs-time-picker__panel">
          <template v-if="range">
            <div class="rs-time-picker__range-grid">
              <section class="rs-time-picker__range-pane">
                <span class="rs-time-picker__pane-title">{{ t('timePicker.rangeStart') }}</span>
                <RsTimePicker
                  v-model="draftStartTime"
                  embedded
                  :size="resolvedSize"
                  :radius="resolvedRadius"
                  :with-seconds="withSeconds"
                  :hour-cycle="hourCycle"
                  :minute-step="minuteStep"
                  :min-time="minTime"
                  :max-time="startMaxTime"
                  :disabled="resolvedDisabled"
                  :disabled-time="disabledTime"
                />
              </section>

              <section class="rs-time-picker__range-pane">
                <span class="rs-time-picker__pane-title">{{ t('timePicker.rangeEnd') }}</span>
                <RsTimePicker
                  v-model="draftEndTime"
                  embedded
                  :size="resolvedSize"
                  :radius="resolvedRadius"
                  :with-seconds="withSeconds"
                  :hour-cycle="hourCycle"
                  :minute-step="minuteStep"
                  :min-time="endMinTime"
                  :max-time="maxTime"
                  :disabled="resolvedDisabled"
                  :disabled-time="disabledTime"
                />
              </section>
            </div>
          </template>

          <template v-else>
            <RsTimePickerColumns
              ref="columnsRef"
              v-model="draftTime"
              :second="withSeconds"
              :size="resolvedSize"
              :disabled="resolvedDisabled"
              :hour-cycle="hourCycle"
              :minute-step="minuteStep"
              :is-unit-disabled="isUnitDisabled"
            />
          </template>

          <footer class="rs-time-picker__footer">
            <div class="rs-time-picker__footer-start">
              <div v-if="shortcuts?.length" class="rs-time-picker__shortcuts">
                <button
                  v-for="(item, index) in shortcuts"
                  :key="`${item.label}-${index}`"
                  type="button"
                  class="rs-time-picker__shortcut"
                  :disabled="resolvedDisabled"
                  @click="applyShortcut(item)"
                >
                  {{ item.label }}
                </button>
              </div>
              <button v-else type="button" class="rs-time-picker__link" @click="selectPreset">
                {{ range ? t('timePicker.rangePreset') : t('timePicker.now') }}
              </button>
            </div>
            <div class="rs-time-picker__actions">
              <button type="button" class="rs-time-picker__ghost" @click="clearSelection">
                {{ range ? t('timePicker.rangeClear') : t('timePicker.clear') }}
              </button>
              <button
                type="button"
                class="rs-time-picker__confirm"
                :disabled="range && (!draftStartTime || !draftEndTime)"
                @click="confirmSelection"
              >
                {{ t('timePicker.confirm') }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Teleport>

    <p v-if="visibleMessage" class="rs-time-picker-field__error" role="alert">
      {{ visibleMessage }}
    </p>
    <span v-if="!embedded && hint" class="rs-field__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.rs-time-picker {
  position: relative;
  width: 100%;
}
.rs-time-picker-embedded {
  min-width: 0;
}
.rs-time-picker-wrap--clearable .rs-time-picker__trigger {
  padding-inline-end: calc(var(--rs-space-md) + 2.25rem);
}
.rs-time-picker__trigger {
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
  border-radius: var(--rs-time-picker-radius, var(--rs-radius-sm));
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
.rs-time-picker--ssm .rs-time-picker__trigger {
  height: var(--rs-control-height-ssm);
  min-height: var(--rs-control-height-ssm);
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}
.rs-time-picker--sm .rs-time-picker__trigger {
  height: var(--rs-control-height-sm);
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}
.rs-time-picker--lg .rs-time-picker__trigger {
  height: var(--rs-control-height-lg);
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}
.rs-time-picker__trigger--embedded {
  min-width: 5.5rem;
  background: color-mix(in srgb, var(--rs-surface) 72%, transparent);
}
.rs-time-picker--ssm .rs-time-picker__trigger--embedded {
  min-width: 4.75rem;
}
.rs-time-picker--lg .rs-time-picker__trigger--embedded {
  min-width: 6.25rem;
}
.rs-time-picker__trigger:hover:not(:disabled) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}
.rs-time-picker__trigger:focus-visible {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
.rs-time-picker__trigger:disabled {
  opacity: var(--rs-time-picker-disabled-opacity, 0.38);
  cursor: not-allowed;
}
.rs-time-picker__trigger--placeholder .rs-time-picker__value {
  color: var(--rs-placeholder);
}
.rs-time-picker__trigger--invalid {
  border-color: var(--rs-danger, var(--rs-color-danger));
}
.rs-time-picker__trigger--invalid:focus-visible {
  border-color: var(--rs-danger, var(--rs-color-danger));
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px)
      color-mix(in srgb, var(--rs-danger) 14%, transparent);
}
.rs-time-picker__clear {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--rs-space-xs);
  z-index: 1;
  transform: translateY(-50%);
}
.rs-time-picker-field__error {
  margin: var(--rs-space-xs) 0 0;
  color: var(--rs-danger, var(--rs-color-danger));
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}
.rs-time-picker__leading {
  display: inline-flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: var(--rs-space-sm);
}
.rs-time-picker__icon,
.rs-time-picker__chevron {
  flex-shrink: 0;
  color: var(--rs-muted);
}
.rs-time-picker__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
