<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import {
  RS_COMPONENT_SIZE_ICON_PX,
  type RsComponentSize,
  type RsRadius,
} from '../../../theme/types'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import {
  buildCalendarGrid,
  getTodayDate,
  isSameDate,
  resolveWeekStartsOn,
  type RsDatePickerDisabledDate,
  type RsParsedDate,
  type RsWeekStartsOn,
} from '../../date-picker/src/date-picker-utils'
import { useRsFormContext } from '../../form/src/form-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  addCalendarMonths,
  calendarCellClass,
  chunkCalendarWeeks,
  resolveCalendarCellState,
  resolveFocusedDate,
  resolveKeyboardMove,
  sameYearMonth,
  toDisabledDateSet,
  weekNumberOfRow,
  type RsCalendarCellView,
  type RsCalendarGridCellSlot,
} from './calendar-grid-utils'

defineOptions({ name: 'RsCalendarGrid' })

export interface RsCalendarGridExpose {
  focus: () => void
  goToToday: () => void
}

export type RsCalendarGridInstance = RsCalendarGridExpose & { $el: HTMLElement }

const viewYear = defineModel<number>('viewYear', { required: true })
const viewMonth = defineModel<number>('viewMonth', { required: true })

const props = withDefaults(
  defineProps<{
    selected?: RsParsedDate | null
    rangeStart?: RsParsedDate | null
    rangeEnd?: RsParsedDate | null
    minDate?: string
    maxDate?: string
    disabledDates?: string[]
    /** 禁用某一天；与 disabledDates / minDate / maxDate 同时生效 */
    disabledDate?: RsDatePickerDisabledDate
    /** 一周起始。未传跟 locale（en-US 周日，zh-CN 周一） */
    weekStartsOn?: RsWeekStartsOn
    /** 控件密度。跟 Input / DatePicker 同一套 --rs-control-height-* */
    size?: RsComponentSize
    radius?: RsRadius
    /** 禁用整张月历（含翻页）。也会继承 Form.disabled */
    disabled?: boolean
    /** 今天描边。默认开 */
    highlightToday?: boolean
    /** 画出邻月日期。默认开，关了仍占 6 行以免把 DatePicker 撑跳 */
    showOutside?: boolean
    /** 点邻月日期是否发出 select。默认开，与原行为一致 */
    selectOutside?: boolean
    /** 行首 ISO 周序号。欧洲排班常用 */
    showWeekNumbers?: boolean
    /** 月历可访问名称 */
    ariaLabel?: string
    id?: string
  }>(),
  {
    selected: null,
    rangeStart: null,
    rangeEnd: null,
    disabledDates: () => [],
    disabled: false,
    highlightToday: true,
    showOutside: true,
    selectOutside: true,
    showWeekNumbers: false,
  },
)

const emit = defineEmits<{
  select: [date: RsParsedDate]
}>()

const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const form = useRsFormContext()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const rootRef = ref<HTMLElement | null>(null)
const focused = ref<RsParsedDate>(
  resolveFocusedDate(viewYear.value, viewMonth.value, props.selected),
)

const resolvedDisabled = computed(() => props.disabled || form?.disabled.value === true)
const writingDir = computed(() => resolveDirMode(config?.dir.value ?? 'auto', locale.value))
const resolvedWeekStartsOn = computed(() =>
  resolveWeekStartsOn(locale.value, props.weekStartsOn),
)
const navIconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const disabledDateSet = computed(() => toDisabledDateSet(props.disabledDates))
const todayDate = computed(() => (props.highlightToday ? getTodayDate() : null))

const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  const sunday = new Date(2024, 0, 7)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + ((resolvedWeekStartsOn.value + index) % 7))
    return formatter.format(date)
  })
})

const monthFormatter = computed(
  () => new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long' }),
)

const monthLabel = computed(() =>
  monthFormatter.value.format(new Date(viewYear.value, viewMonth.value - 1, 1)),
)

const cellAriaFormatter = computed(
  () => new Intl.DateTimeFormat(locale.value, { dateStyle: 'full' }),
)

const cellViews = computed(() => {
  const cells = buildCalendarGrid(viewYear.value, viewMonth.value, resolvedWeekStartsOn.value)
  return cells.map((cell) => ({
    cell,
    state: resolveCalendarCellState(cell, {
      selected: props.selected,
      rangeStart: props.rangeStart,
      rangeEnd: props.rangeEnd,
      today: todayDate.value,
      disabledDates: disabledDateSet.value,
      disabledDate: props.disabledDate,
      minDate: props.minDate,
      maxDate: props.maxDate,
      gridDisabled: resolvedDisabled.value,
    }),
  }))
})

const weeks = computed(() =>
  chunkCalendarWeeks(cellViews.value).map((days) => ({
    days,
    weekNumber: weekNumberOfRow(days, resolvedWeekStartsOn.value),
  })),
)

const gridLabel = computed(() => props.ariaLabel || t('calendarGrid.label'))

const rootStyle = computed(() => ({
  '--rs-calendar-grid-radius': rsRadiusCss(resolvedRadius.value),
}))

function cellAriaLabel(date: RsParsedDate): string {
  return cellAriaFormatter.value.format(new Date(date.year, date.month - 1, date.day))
}

function cellSlotProps(view: RsCalendarCellView, weekNumber: number): RsCalendarGridCellSlot {
  return {
    date: { year: view.cell.year, month: view.cell.month, day: view.cell.day },
    iso: view.state.iso,
    inCurrentMonth: view.cell.inCurrentMonth,
    selected: view.state.selected,
    disabled: view.state.disabled,
    today: view.state.today,
    inRange: view.state.inRange,
    rangeStart: view.state.rangeStart,
    rangeEnd: view.state.rangeEnd,
    weekNumber,
  }
}

function isCellInteractive(inCurrentMonth: boolean, disabled: boolean): boolean {
  if (disabled) return false
  if (!inCurrentMonth && !props.showOutside) return false
  if (!inCurrentMonth && !props.selectOutside) return false
  return true
}

function isCellTabbable(date: RsParsedDate, inCurrentMonth: boolean): boolean {
  if (!props.showOutside && !inCurrentMonth) return false
  return isSameDate(focused.value, date)
}

function applyView(next: RsParsedDate): void {
  if (next.year !== viewYear.value) viewYear.value = next.year
  if (next.month !== viewMonth.value) viewMonth.value = next.month
  focused.value = next
}

function focusCell(date: RsParsedDate): void {
  const iso = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const button = rootRef.value?.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`)
  button?.focus()
}

function goPrevYear(): void {
  if (resolvedDisabled.value) return
  applyView(addCalendarMonths({
    year: viewYear.value,
    month: viewMonth.value,
    day: focused.value.day,
  }, -12))
}

function goNextYear(): void {
  if (resolvedDisabled.value) return
  applyView(addCalendarMonths({
    year: viewYear.value,
    month: viewMonth.value,
    day: focused.value.day,
  }, 12))
}

function goPrevMonth(): void {
  if (resolvedDisabled.value) return
  applyView(addCalendarMonths({
    year: viewYear.value,
    month: viewMonth.value,
    day: focused.value.day,
  }, -1))
}

function goNextMonth(): void {
  if (resolvedDisabled.value) return
  applyView(addCalendarMonths({
    year: viewYear.value,
    month: viewMonth.value,
    day: focused.value.day,
  }, 1))
}

function selectDate(date: RsParsedDate, inCurrentMonth: boolean, disabled: boolean): void {
  if (!isCellInteractive(inCurrentMonth, disabled)) return
  focused.value = date
  emit('select', { year: date.year, month: date.month, day: date.day })
}

function moveFocus(next: RsParsedDate): void {
  applyView(next)
  void nextTick(() => focusCell(next))
}

function selectFocusedDate(): void {
  const view = cellViews.value.find((item) => isSameDate(item.cell, focused.value))
  if (view) selectDate(view.cell, view.cell.inCurrentMonth, view.state.disabled)
}

function onGridKeydown(event: KeyboardEvent): void {
  if (resolvedDisabled.value) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectFocusedDate()
    return
  }
  const next = resolveKeyboardMove(focused.value, event.key, {
    weekStartsOn: resolvedWeekStartsOn.value,
    rtl: writingDir.value === 'rtl',
    shiftKey: event.shiftKey,
  })
  if (!next) return
  event.preventDefault()
  moveFocus(next)
}

function focus(): void {
  if (resolvedDisabled.value) return
  if (!sameYearMonth(focused.value, viewYear.value, viewMonth.value)) {
    focused.value = resolveFocusedDate(viewYear.value, viewMonth.value, props.selected)
  }
  void nextTick(() => focusCell(focused.value))
}

function goToToday(): void {
  if (resolvedDisabled.value) return
  const today = getTodayDate()
  applyView(today)
  void nextTick(() => focusCell(today))
}

watch(
  () => [viewYear.value, viewMonth.value, props.selected] as const,
  () => {
    if (!sameYearMonth(focused.value, viewYear.value, viewMonth.value)) {
      focused.value = resolveFocusedDate(viewYear.value, viewMonth.value, props.selected)
    }
  },
)

defineExpose<RsCalendarGridExpose>({
  focus,
  goToToday,
})
</script>

<template>
  <div
    :id="id"
    ref="rootRef"
    class="rs-calendar-grid"
    :class="[`rs-calendar-grid--${resolvedSize}`, { 'rs-calendar-grid--disabled': resolvedDisabled }]"
    :style="rootStyle"
  >
    <div class="rs-calendar-grid__header">
      <div class="rs-calendar-grid__nav-group">
        <button
          type="button"
          class="rs-calendar-grid__nav rs-calendar-grid__nav--prev-year"
          :aria-label="t('calendarGrid.prevYear')"
          :disabled="resolvedDisabled"
          @click="goPrevYear"
        >
          <RsIcon name="chevrons-left" :size="navIconSize" />
        </button>
        <button
          type="button"
          class="rs-calendar-grid__nav rs-calendar-grid__nav--prev-month"
          :aria-label="t('calendarGrid.prevMonth')"
          :disabled="resolvedDisabled"
          @click="goPrevMonth"
        >
          <RsIcon name="chevron-left" :size="navIconSize" />
        </button>
      </div>
      <span class="rs-calendar-grid__title" aria-live="polite">
        <slot name="title" :year="viewYear" :month="viewMonth" :label="monthLabel">
          {{ monthLabel }}
        </slot>
      </span>
      <div class="rs-calendar-grid__nav-group">
        <button
          type="button"
          class="rs-calendar-grid__nav rs-calendar-grid__nav--next-month"
          :aria-label="t('calendarGrid.nextMonth')"
          :disabled="resolvedDisabled"
          @click="goNextMonth"
        >
          <RsIcon name="chevron-right" :size="navIconSize" />
        </button>
        <button
          type="button"
          class="rs-calendar-grid__nav rs-calendar-grid__nav--next-year"
          :aria-label="t('calendarGrid.nextYear')"
          :disabled="resolvedDisabled"
          @click="goNextYear"
        >
          <RsIcon name="chevrons-right" :size="navIconSize" />
        </button>
      </div>
    </div>

    <table
      class="rs-calendar-grid__table"
      :aria-label="gridLabel"
      @keydown="onGridKeydown"
    >
      <thead>
        <tr>
          <th
            v-if="showWeekNumbers"
            scope="col"
            class="rs-calendar-grid__weekday rs-calendar-grid__weekday--week"
          >
            {{ t('calendarGrid.week') }}
          </th>
          <th
            v-for="(label, index) in weekdayLabels"
            :key="index"
            scope="col"
            class="rs-calendar-grid__weekday"
          >
            {{ label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(week, weekIndex) in weeks" :key="weekIndex">
          <td
            v-if="showWeekNumbers"
            class="rs-calendar-grid__week-num"
          >
            {{ week.weekNumber }}
          </td>
          <td
            v-for="view in week.days"
            :key="view.state.iso"
            class="rs-calendar-grid__day"
          >
            <button
              v-if="view.cell.inCurrentMonth || showOutside"
              type="button"
              class="rs-calendar-grid__cell"
              :class="calendarCellClass(view.state, view.cell.inCurrentMonth)"
              :data-iso="view.state.iso"
              :disabled="view.state.disabled || (!view.cell.inCurrentMonth && !selectOutside)"
              :tabindex="isCellTabbable(view.cell, view.cell.inCurrentMonth) ? 0 : -1"
              :aria-selected="view.state.selected || view.state.rangeStart || view.state.rangeEnd"
              :aria-current="view.state.today ? 'date' : undefined"
              :aria-label="cellAriaLabel(view.cell)"
              @click="selectDate(view.cell, view.cell.inCurrentMonth, view.state.disabled)"
            >
              <slot name="cell" v-bind="cellSlotProps(view, week.weekNumber)">
                {{ view.cell.day }}
              </slot>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.rs-calendar-grid {
  display: flex;
  flex-direction: column;
  gap: var(--rs-calendar-grid-gap);
  --rs-calendar-grid-cell-size: var(--rs-control-height-md);
  --rs-calendar-grid-nav-size: var(--rs-control-height-sm);
  --rs-calendar-grid-font: var(--rs-font-size-sm);
}
.rs-calendar-grid--ssm {
  --rs-calendar-grid-cell-size: var(--rs-control-height-ssm);
  --rs-calendar-grid-nav-size: var(--rs-control-height-ssm);
  --rs-calendar-grid-font: var(--rs-font-size-xs);
}
.rs-calendar-grid--sm {
  --rs-calendar-grid-cell-size: var(--rs-control-height-sm);
  --rs-calendar-grid-nav-size: var(--rs-control-height-ssm);
  --rs-calendar-grid-font: var(--rs-font-size-xs);
}
.rs-calendar-grid--lg {
  --rs-calendar-grid-cell-size: var(--rs-control-height-lg);
  --rs-calendar-grid-nav-size: var(--rs-control-height-md);
  --rs-calendar-grid-font: var(--rs-font-size-base);
}
.rs-calendar-grid__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
}
.rs-calendar-grid__nav-group {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}
.rs-calendar-grid__title {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: var(--rs-calendar-grid-font);
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-calendar-grid-title);
}
.rs-calendar-grid__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rs-calendar-grid-nav-size);
  height: var(--rs-calendar-grid-nav-size);
  border: 0;
  border-radius: var(--rs-calendar-grid-radius);
  background: transparent;
  color: var(--rs-calendar-grid-nav);
  cursor: pointer;
  transition: background var(--rs-transition-fast), color var(--rs-transition-fast);
}
.rs-calendar-grid__nav:hover:not(:disabled) {
  background: var(--rs-calendar-grid-nav-hover);
  color: var(--rs-calendar-grid-title);
}
.rs-calendar-grid__nav:focus {
  outline: none;
}
.rs-calendar-grid__nav:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width) var(--rs-focus-ring);
}
.rs-calendar-grid__nav:disabled {
  opacity: var(--rs-calendar-grid-disabled-opacity);
  cursor: not-allowed;
}
.rs-calendar-grid__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: var(--rs-calendar-grid-cell-gap);
  table-layout: fixed;
}
.rs-calendar-grid__weekday {
  padding-block: var(--rs-space-xs);
  padding-inline: 0;
  text-align: center;
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  color: var(--rs-calendar-grid-weekday);
}
.rs-calendar-grid__weekday--week,
.rs-calendar-grid__week-num {
  width: var(--rs-calendar-grid-week-col);
  color: var(--rs-calendar-grid-week);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  text-align: center;
}
.rs-calendar-grid__day {
  padding: 0;
  text-align: center;
  vertical-align: middle;
}
.rs-calendar-grid__cell {
  width: 100%;
  min-width: var(--rs-calendar-grid-cell-size);
  height: var(--rs-calendar-grid-cell-size);
  border: 0;
  border-radius: var(--rs-calendar-grid-radius);
  background: transparent;
  color: var(--rs-calendar-grid-day);
  font-size: var(--rs-calendar-grid-font);
  cursor: pointer;
  transition:
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
}
.rs-calendar-grid__cell:hover:not(:disabled) {
  background: var(--rs-calendar-grid-day-hover);
}
.rs-calendar-grid__cell:focus {
  outline: none;
}
.rs-calendar-grid__cell:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width) var(--rs-focus-ring);
}
.rs-calendar-grid__cell--outside {
  color: var(--rs-calendar-grid-day-outside);
}
.rs-calendar-grid__cell--today:not(.rs-calendar-grid__cell--endpoint) {
  box-shadow: inset 0 0 0 1px var(--rs-calendar-grid-today);
  color: var(--rs-calendar-grid-today);
}
.rs-calendar-grid__cell--endpoint,
.rs-calendar-grid__cell--selected {
  background: var(--rs-calendar-grid-selected);
  color: var(--rs-calendar-grid-selected-fg);
}
.rs-calendar-grid__cell--in-range {
  border-radius: 0;
  background: var(--rs-calendar-grid-in-range);
  color: var(--rs-calendar-grid-today);
}
.rs-calendar-grid__cell--range-start:not(.rs-calendar-grid__cell--range-end) {
  border-start-start-radius: var(--rs-calendar-grid-radius);
  border-end-start-radius: var(--rs-calendar-grid-radius);
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.rs-calendar-grid__cell--range-end:not(.rs-calendar-grid__cell--range-start) {
  border-start-end-radius: var(--rs-calendar-grid-radius);
  border-end-end-radius: var(--rs-calendar-grid-radius);
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.rs-calendar-grid__cell:disabled {
  opacity: var(--rs-calendar-grid-disabled-opacity);
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
  .rs-calendar-grid__nav,
  .rs-calendar-grid__cell {
    transition: none;
  }
}
</style>
