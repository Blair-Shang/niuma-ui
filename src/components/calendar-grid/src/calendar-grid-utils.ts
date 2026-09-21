import { dayjs } from '../../../utils/rs-dayjs'
import {
  formatDateParts,
  getTodayDate,
  isDateBetweenParsed,
  isDateWithinBounds,
  isSameDate,
  type RsCalendarCell,
  type RsDatePickerDisabledDate,
  type RsParsedDate,
  type RsWeekStartsOn,
} from '../../date-picker/src/date-picker-utils'

export type {
  RsCalendarCell,
  RsDatePickerDisabledDate,
  RsParsedDate,
  RsWeekStartsOn,
}

/** `#cell` 插槽载荷。墙钟年月日，不是 Date。 */
export interface RsCalendarGridCellSlot {
  date: RsParsedDate
  iso: string
  inCurrentMonth: boolean
  selected: boolean
  disabled: boolean
  today: boolean
  inRange: boolean
  rangeStart: boolean
  rangeEnd: boolean
  weekNumber: number
}

export interface RsCalendarCellState {
  iso: string
  selected: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
  endpoint: boolean
  today: boolean
  disabled: boolean
}

export interface RsCalendarCellView {
  cell: RsCalendarCell
  state: RsCalendarCellState
}

export interface RsCalendarWeekView {
  days: RsCalendarCellView[]
  weekNumber: number
}

export function toDisabledDateSet(dates: readonly string[] | undefined): Set<string> {
  return new Set(dates ?? [])
}

export function isCalendarCellDisabled(
  cell: RsParsedDate,
  options: {
    disabledDates: ReadonlySet<string>
    disabledDate?: RsDatePickerDisabledDate
    minDate?: string
    maxDate?: string
  },
): boolean {
  const iso = formatDateParts(cell)
  if (options.disabledDates.has(iso)) return true
  if (options.disabledDate?.({ year: cell.year, month: cell.month, day: cell.day })) return true
  return !isDateWithinBounds(cell.year, cell.month, cell.day, {
    minDate: options.minDate,
    maxDate: options.maxDate,
  })
}

export function resolveCalendarCellState(
  cell: RsCalendarCell,
  options: {
    selected?: RsParsedDate | null
    rangeStart?: RsParsedDate | null
    rangeEnd?: RsParsedDate | null
    today?: RsParsedDate | null
    disabledDates: ReadonlySet<string>
    disabledDate?: RsDatePickerDisabledDate
    minDate?: string
    maxDate?: string
    gridDisabled?: boolean
  },
): RsCalendarCellState {
  const selected = options.selected ? isSameDate(options.selected, cell) : false
  const rangeStart = options.rangeStart ? isSameDate(options.rangeStart, cell) : false
  const rangeEnd = options.rangeEnd ? isSameDate(options.rangeEnd, cell) : false
  const inRange = Boolean(
    options.rangeStart
    && options.rangeEnd
    && isDateBetweenParsed(cell, options.rangeStart, options.rangeEnd),
  )
  const endpoint = rangeStart || rangeEnd || selected
  return {
    iso: formatDateParts(cell),
    selected,
    rangeStart,
    rangeEnd,
    inRange: inRange && !endpoint,
    endpoint,
    today: options.today ? isSameDate(options.today, cell) : false,
    disabled: options.gridDisabled === true
      || isCalendarCellDisabled(cell, options),
  }
}

export function calendarCellClass(state: RsCalendarCellState, inCurrentMonth: boolean): Record<string, boolean> {
  return {
    'rs-calendar-grid__cell--outside': !inCurrentMonth,
    'rs-calendar-grid__cell--selected': state.selected,
    'rs-calendar-grid__cell--range-start': state.rangeStart,
    'rs-calendar-grid__cell--range-end': state.rangeEnd,
    'rs-calendar-grid__cell--in-range': state.inRange,
    'rs-calendar-grid__cell--endpoint': state.endpoint,
    'rs-calendar-grid__cell--today': state.today,
  }
}

export function shiftViewMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const next = dayjs().year(year).month(month - 1).date(1).add(delta, 'month')
  return { year: next.year(), month: next.month() + 1 }
}

export function shiftViewYear(year: number, delta: number): number {
  return year + delta
}

export function addCalendarDays(date: RsParsedDate, days: number): RsParsedDate {
  const next = dayjs().year(date.year).month(date.month - 1).date(date.day).add(days, 'day')
  return { year: next.year(), month: next.month() + 1, day: next.date() }
}

export function addCalendarMonths(date: RsParsedDate, months: number): RsParsedDate {
  const base = dayjs().year(date.year).month(date.month - 1).date(1)
  const nextMonth = base.add(months, 'month')
  const maxDay = nextMonth.daysInMonth()
  return {
    year: nextMonth.year(),
    month: nextMonth.month() + 1,
    day: Math.min(date.day, maxDay),
  }
}

export function startOfCalendarWeek(
  date: RsParsedDate,
  weekStartsOn: RsWeekStartsOn,
): RsParsedDate {
  const weekday = dayjs().year(date.year).month(date.month - 1).date(date.day).day()
  const delta = (weekday - weekStartsOn + 7) % 7
  return addCalendarDays(date, -delta)
}

export function endOfCalendarWeek(
  date: RsParsedDate,
  weekStartsOn: RsWeekStartsOn,
): RsParsedDate {
  return addCalendarDays(startOfCalendarWeek(date, weekStartsOn), 6)
}

/** ISO-8601 周序号（周四所在年）。不引入 dayjs isoWeek 插件。 */
export function isoWeekOf(date: RsParsedDate): number {
  const current = dayjs().year(date.year).month(date.month - 1).date(date.day)
  const weekday = current.day() || 7
  const thursday = current.add(4 - weekday, 'day')
  const jan1 = dayjs().year(thursday.year()).month(0).date(1)
  return Math.ceil((thursday.diff(jan1, 'day') + 1) / 7)
}

export function weekNumberOfRow(
  days: readonly RsCalendarCellView[],
  weekStartsOn: RsWeekStartsOn,
): number {
  const thursdayOffset = (4 - weekStartsOn + 7) % 7
  const pivot = days[thursdayOffset]?.cell ?? days[0]?.cell
  return pivot ? isoWeekOf(pivot) : 0
}

export function chunkCalendarWeeks(cells: readonly RsCalendarCellView[]): RsCalendarCellView[][] {
  const rows: RsCalendarCellView[][] = []
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7))
  }
  return rows
}

function arrowDayDelta(key: string, rtl: boolean): number | null {
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  if (key === 'ArrowRight') return rtl ? -1 : 1
  if (key === 'ArrowUp') return -7
  if (key === 'ArrowDown') return 7
  return null
}

export function resolveKeyboardMove(
  focused: RsParsedDate,
  key: string,
  options: {
    weekStartsOn: RsWeekStartsOn
    rtl: boolean
    shiftKey: boolean
  },
): RsParsedDate | null {
  const days = arrowDayDelta(key, options.rtl)
  if (days != null) return addCalendarDays(focused, days)
  if (key === 'Home') return startOfCalendarWeek(focused, options.weekStartsOn)
  if (key === 'End') return endOfCalendarWeek(focused, options.weekStartsOn)
  if (key === 'PageUp') return addCalendarMonths(focused, options.shiftKey ? -12 : -1)
  if (key === 'PageDown') return addCalendarMonths(focused, options.shiftKey ? 12 : 1)
  return null
}

export function resolveFocusedDate(
  viewYear: number,
  viewMonth: number,
  selected?: RsParsedDate | null,
): RsParsedDate {
  if (selected?.year === viewYear && selected.month === viewMonth) {
    return { year: selected.year, month: selected.month, day: selected.day }
  }
  const today = getTodayDate()
  if (today.year === viewYear && today.month === viewMonth) {
    return today
  }
  return { year: viewYear, month: viewMonth, day: 1 }
}

export function sameYearMonth(date: RsParsedDate, year: number, month: number): boolean {
  return date.year === year && date.month === month
}
