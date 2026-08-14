import {
  dayjs,
  parseRsDateTimeDayjs,
  parseRsDayjs,
  RS_DATE_FORMAT,
  RS_DATETIME_FORMAT,
  RS_TIME_MINUTE_FORMAT,
  RS_TIME_SECONDS_FORMAT,
} from '../lib/rs-dayjs'

export interface RsParsedDate {
  year: number
  month: number
  day: number
}

export interface RsParsedDateTime extends RsParsedDate {
  hour: number
  minute: number
  second: number
}

export interface RsDateRangeValue {
  start?: string
  end?: string
}

/** valueFormat 预设：string 墙钟、timestamp 毫秒、iso 本地偏移 RFC3339 */
export const RS_DATE_PICKER_VALUE_FORMAT_PRESETS = ['string', 'timestamp', 'iso'] as const

/**
 * valueFormat 预设名。
 * string 为默认墙钟字符串；timestamp 为毫秒；iso 为带本地偏移的 RFC3339。
 */
export type RsDatePickerValueFormatPreset = (typeof RS_DATE_PICKER_VALUE_FORMAT_PRESETS)[number]

/**
 * v-model 取值格式，对齐 Element Plus `value-format` / Ant Design Vue `valueFormat`：
 * 展示格式与绑定格式分离。预设之外可传入任意 dayjs 模板，如 `YYYY-MM-DDTHH:mm:ssZ`。
 */
export type RsDatePickerValueFormat = RsDatePickerValueFormatPreset | (string & {})

/**
 * 内部墙钟字符串与对外 valueFormat 互转时的选项。
 */
export interface RsDatePickerValueConvertOptions {
  valueFormat: string
  withTime: boolean
}

/** 时间戳范围（毫秒），用于 valueFormat=timestamp 的 range 模式 */
export type RsDatePickerTimestampRange = [number, number]

/** 组件对外 v-model 联合类型 */
export type RsDatePickerModelValue =
  | string
  | number
  | null
  | RsDateRangeValue
  | RsDatePickerTimestampRange

/** 快捷项可返回字符串、时间戳或范围 */
export type RsDatePickerShortcutValue =
  | string
  | number
  | RsDateRangeValue
  | RsDatePickerTimestampRange

/** 日期/时间范围面板快捷项 */
export interface RsDatePickerShortcut {
  label: string
  value: () => RsDatePickerShortcutValue
}

/** 将毫秒时间戳格式化为组件内部日期时间字符串 */
export function formatTimestampValue(ms: number, withTime = true): string {
  const parsed = dayjs(ms)
  return withTime ? parsed.format(RS_DATETIME_FORMAT) : parsed.format(RS_DATE_FORMAT)
}

/** 将组件内部日期/日期时间字符串解析为毫秒时间戳 */
export function parseTimestampValue(value?: string): number | null {
  if (!value) return null
  const parsed = parseRsDateTimeDayjs(value) ?? parseRsDayjs(value)
  return parsed ? parsed.valueOf() : null
}

function parsePickerDayjs(value: string) {
  return parseRsDateTimeDayjs(value) ?? parseRsDayjs(value)
}

function isTimestampFormat(valueFormat: string): boolean {
  return valueFormat === 'timestamp'
}

function isIsoFormat(valueFormat: string): boolean {
  return valueFormat === 'iso'
}

function isStringFormat(valueFormat: string): boolean {
  return valueFormat === 'string' || valueFormat === ''
}

/**
 * 将对外 v-model 规范为控件内部墙钟字符串（`YYYY-MM-DD` / `YYYY-MM-DD HH:mm:ss`）。
 * 解析 ISO 时去掉 Z/偏移，按墙钟分量展示，不按浏览器时区换算。
 * @param value - 对外绑定值（字符串、毫秒时间戳或空）
 * @param options - valueFormat 与是否含时分秒
 * @returns 内部墙钟字符串；无法解析时尽量原样返回
 */
export function toInternalPickerValue(
  value: unknown,
  options: RsDatePickerValueConvertOptions,
): string {
  if (value == null || value === '') return ''
  if (typeof value === 'number') {
    return formatTimestampValue(value, options.withTime)
  }
  if (typeof value !== 'string') return ''

  const format = options.valueFormat || 'string'
  if (!isStringFormat(format) && !isTimestampFormat(format) && !isIsoFormat(format)) {
    const strict = dayjs(value, format, true)
    if (strict.isValid()) {
      return options.withTime ? strict.format(RS_DATETIME_FORMAT) : strict.format(RS_DATE_FORMAT)
    }
  }

  const parsed = parsePickerDayjs(value)
  if (!parsed) return value
  return options.withTime ? parsed.format(RS_DATETIME_FORMAT) : parsed.format(RS_DATE_FORMAT)
}

/**
 * 将控件内部墙钟字符串转为对外 valueFormat。
 * iso 空值返回 null，避免 JSON `""` 无法绑定到 Go `time.Time`。
 * @param internal - 内部墙钟字符串
 * @param options - valueFormat 与是否含时分秒
 * @returns 字符串、毫秒时间戳或 null
 */
export function fromInternalPickerValue(
  internal: string,
  options: RsDatePickerValueConvertOptions,
): string | number | null {
  const format = options.valueFormat || 'string'
  if (!internal) {
    return isTimestampFormat(format) || isIsoFormat(format) ? null : ''
  }
  if (isTimestampFormat(format)) {
    return parseTimestampValue(internal)
  }
  if (isStringFormat(format)) {
    return internal
  }

  const parsed = parsePickerDayjs(internal)
  if (!parsed) return internal

  if (isIsoFormat(format)) {
    const body = options.withTime
      ? parsed.format('YYYY-MM-DDTHH:mm:ss')
      : parsed.format('YYYY-MM-DDT00:00:00')
    return `${body}${parsed.format('Z')}`
  }

  return parsed.format(format)
}

/**
 * 将 fromInternalPickerValue 的结果写入 range.start/end（范围端点始终为字符串）。
 * @param value - 转换后的端点
 * @returns 范围对象可用的字符串；空为 `''`
 */
export function toRangeEndpointString(value: string | number | null): string {
  if (value == null) return ''
  return typeof value === 'number' ? String(value) : value
}

/** 判断是否为时间戳范围元组 */
export function isTimestampRange(value: unknown): value is RsDatePickerTimestampRange {
  return (
    Array.isArray(value)
    && value.length === 2
    && typeof value[0] === 'number'
    && typeof value[1] === 'number'
  )
}

/** 将快捷项返回值规范为内部 string / RsDateRangeValue */
export function normalizeShortcutValue(
  next: RsDatePickerShortcutValue,
  options?: { withTime?: boolean },
): string | RsDateRangeValue | null {
  const withTime = options?.withTime ?? true
  if (typeof next === 'number') {
    return formatTimestampValue(next, withTime)
  }
  if (isTimestampRange(next)) {
    return {
      start: formatTimestampValue(next[0], withTime),
      end: formatTimestampValue(next[1], withTime),
    }
  }
  if (typeof next === 'string') {
    return next || null
  }
  if (next && typeof next === 'object') {
    return { ...next }
  }
  return null
}

export interface RsCalendarCell extends RsParsedDate {
  inCurrentMonth: boolean
}

export const EMPTY_DATE_RANGE: RsDateRangeValue = {}

export function parseDateValue(value?: string): RsParsedDate | null {
  const parsed = parseRsDayjs(value)
  if (!parsed) return null
  return {
    year: parsed.year(),
    month: parsed.month() + 1,
    day: parsed.date(),
  }
}

export function parseDateTimeValue(value?: string): RsParsedDateTime | null {
  const parsed = parseRsDateTimeDayjs(value)
  if (!parsed) return null
  return {
    year: parsed.year(),
    month: parsed.month() + 1,
    day: parsed.date(),
    hour: parsed.hour(),
    minute: parsed.minute(),
    second: parsed.second(),
  }
}

export function formatDateValue(value?: string): string {
  const parsed = parseRsDayjs(value)
  return parsed ? parsed.format(RS_DATE_FORMAT) : (value ?? '')
}

export function formatDateParts(date: RsParsedDate): string {
  return dayjs()
    .year(date.year)
    .month(date.month - 1)
    .date(date.day)
    .format(RS_DATE_FORMAT)
}

export function formatDateTimeValue(value?: string): string {
  const parsed = parseRsDateTimeDayjs(value)
  return parsed ? parsed.format(RS_DATETIME_FORMAT) : (value ?? '')
}

export function formatDateTimeParts(
  date: RsParsedDate,
  time: string,
  withSeconds = true,
): string | null {
  const dateText = formatDateParts(date)
  const formats = withSeconds
    ? [`${RS_DATE_FORMAT} ${RS_TIME_SECONDS_FORMAT}`, `${RS_DATE_FORMAT} ${RS_TIME_MINUTE_FORMAT}`]
    : [`${RS_DATE_FORMAT} ${RS_TIME_MINUTE_FORMAT}`]
  for (const format of formats) {
    const parsed = dayjs(`${dateText} ${time}`, format, true)
    if (parsed.isValid()) {
      return parsed.format(withSeconds ? RS_DATETIME_FORMAT : `${RS_DATE_FORMAT} ${RS_TIME_MINUTE_FORMAT}`)
    }
  }
  return null
}

export function extractTimeFromDateTime(value?: string, withSeconds = true): string {
  const parsed = parseRsDateTimeDayjs(value)
  if (!parsed) return withSeconds ? '00:00:00' : '00:00'
  return parsed.format(withSeconds ? RS_TIME_SECONDS_FORMAT : RS_TIME_MINUTE_FORMAT)
}

export function isDateRangeOrdered(range: RsDateRangeValue): boolean {
  if (!range.start || !range.end) return true
  const start = parseRsDateTimeDayjs(range.start) ?? parseRsDayjs(range.start)
  const end = parseRsDateTimeDayjs(range.end) ?? parseRsDayjs(range.end)
  if (!start || !end) return range.start <= range.end
  return start.isSame(end) || start.isBefore(end)
}

export const isDateTimeRangeOrdered = isDateRangeOrdered

export function formatDateRangeDisplay(
  range: RsDateRangeValue,
  options?: { separator?: string; datetime?: boolean },
): string {
  const separator = options?.separator ?? ' ~ '
  const format = options?.datetime ? formatDateTimeDisplay : formatDateDisplay
  const start = range.start ? format(range.start) : ''
  const end = range.end ? format(range.end) : ''
  if (start && end) return `${start}${separator}${end}`
  return start || end
}

export function formatLocalDate(date: Date): string {
  return dayjs(date).format(RS_DATE_FORMAT)
}

export function formatDateDisplay(value?: string): string {
  return formatDateValue(value)
}

export function formatDateTimeDisplay(value?: string): string {
  return formatDateTimeValue(value)
}

export function formatDateRangeLabel(range: RsDateRangeValue, separator = ' ~ '): string {
  return formatDateRangeDisplay(range, { separator })
}

export function formatDateTimeRangeLabel(range: RsDateRangeValue, separator = ' ~ '): string {
  return formatDateRangeDisplay(range, { separator, datetime: true })
}

export function isDateBetween(value: string, start?: string, end?: string): boolean {
  if (!start || !end) return false
  const current = parseRsDayjs(value)
  const from = parseRsDayjs(start)
  const to = parseRsDayjs(end)
  if (!current || !from || !to) return false
  const min = from.isBefore(to) ? from : to
  const max = from.isBefore(to) ? to : from
  return (current.isSame(min) || current.isAfter(min)) && (current.isSame(max) || current.isBefore(max))
}

export function getTodayDate(): RsParsedDate {
  const today = dayjs()
  return {
    year: today.year(),
    month: today.month() + 1,
    day: today.date(),
  }
}

export function formatTimeFromDateTimeParts(
  value: RsParsedDateTime,
  withSeconds = true,
): string {
  const hour = String(value.hour).padStart(2, '0')
  const minute = String(value.minute).padStart(2, '0')
  if (!withSeconds) return `${hour}:${minute}`
  const second = String(value.second).padStart(2, '0')
  return `${hour}:${minute}:${second}`
}

export function getNowDateTime(): RsParsedDateTime {
  const now = dayjs()
  return {
    year: now.year(),
    month: now.month() + 1,
    day: now.date(),
    hour: now.hour(),
    minute: now.minute(),
    second: now.second(),
  }
}

export function getNextMonth(year: number, month: number): Pick<RsParsedDate, 'year' | 'month'> {
  const next = dayjs().year(year).month(month - 1).add(1, 'month')
  return { year: next.year(), month: next.month() + 1 }
}

export function getDaysInMonth(year: number, month: number): number {
  return dayjs().year(year).month(month - 1).daysInMonth()
}

export function dateToNumber(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day
}

export function parseDateToNumber(value: string): number | null {
  const parsed = parseDateValue(value)
  if (!parsed) return null
  return dateToNumber(parsed.year, parsed.month, parsed.day)
}

export function compareDates(a: RsParsedDate, b: RsParsedDate): number {
  return dateToNumber(a.year, a.month, a.day) - dateToNumber(b.year, b.month, b.day)
}

export function isSameDate(a: RsParsedDate, b: RsParsedDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

export function isDateBetweenParsed(
  cell: RsParsedDate,
  start: RsParsedDate,
  end: RsParsedDate,
): boolean {
  const value = dateToNumber(cell.year, cell.month, cell.day)
  const from = dateToNumber(start.year, start.month, start.day)
  const to = dateToNumber(end.year, end.month, end.day)
  return value >= Math.min(from, to) && value <= Math.max(from, to)
}

export function isDateWithinBounds(
  year: number,
  month: number,
  day: number,
  options: { minDate?: string; maxDate?: string } = {},
): boolean {
  const candidate = dateToNumber(year, month, day)

  if (options.minDate) {
    const min = parseDateToNumber(options.minDate)
    if (min !== null && candidate < min) return false
  }

  if (options.maxDate) {
    const max = parseDateToNumber(options.maxDate)
    if (max !== null && candidate > max) return false
  }

  return true
}

export function isDateRangeEmpty(value: RsDateRangeValue): boolean {
  return !value.start && !value.end
}

export function buildCalendarGrid(
  year: number,
  month: number,
  weekStartsOn = 1,
): RsCalendarCell[] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = dayjs().year(year).month(month - 1).date(1).day()
  const leading = (firstWeekday - weekStartsOn + 7) % 7

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  const cells: RsCalendarCell[] = []

  for (let index = leading; index > 0; index -= 1) {
    cells.push({
      year: prevYear,
      month: prevMonth,
      day: daysInPrevMonth - index + 1,
      inCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ year, month, day, inCurrentMonth: true })
  }

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  let nextDay = 1

  while (cells.length < 42) {
    cells.push({
      year: nextYear,
      month: nextMonth,
      day: nextDay,
      inCurrentMonth: false,
    })
    nextDay += 1
  }

  return cells
}
