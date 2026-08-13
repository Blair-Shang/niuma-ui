export interface RsParsedTime {
  hour: number
  minute: number
  second: number
}

export interface RsTimeRangeValue {
  start?: string
  end?: string
}

export const EMPTY_TIME_RANGE: RsTimeRangeValue = {}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const TIME_WITH_SECONDS_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/

export function scheduleAfterPaint(callback: () => void): () => void {
  let cancelled = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!cancelled) callback()
    })
  })
  return () => {
    cancelled = true
  }
}

export function rangeInclusive(max: number): number[] {
  return Array.from({ length: max + 1 }, (_, index) => index)
}

/** 时分秒列选项（value + 预格式化 label，避免模板内反复 padStart） */
export interface RsTimeUnitOption {
  value: number
  label: string
}

/** 时间列单位 */
export type RsTimeUnit = 'hour' | 'minute' | 'second'

export function formatTimeUnitLabel(value: number): string {
  return String(value).padStart(2, '0')
}

function buildTimeUnitOptions(max: number, step = 1): RsTimeUnitOption[] {
  const options: RsTimeUnitOption[] = []
  for (let value = 0; value <= max; value += step) {
    options.push({ value, label: formatTimeUnitLabel(value) })
  }
  return options
}

/** 小时列固定选项 00–23 */
export const TIME_HOUR_OPTIONS: readonly RsTimeUnitOption[] = buildTimeUnitOptions(23)

/** 秒列固定选项 00–59 */
export const TIME_SECOND_OPTIONS: readonly RsTimeUnitOption[] = buildTimeUnitOptions(59)

const minuteOptionsCache = new Map<number, readonly RsTimeUnitOption[]>()

/** 按步进缓存分钟列选项，默认 step=1 为 00–59 */
export function getTimeMinuteOptions(step = 1): readonly RsTimeUnitOption[] {
  const normalized = Math.max(1, Math.floor(step) || 1)
  const cached = minuteOptionsCache.get(normalized)
  if (cached) return cached
  const options = buildTimeUnitOptions(59, normalized)
  minuteOptionsCache.set(normalized, options)
  return options
}

/**
 * 将时间列滚到指定 value，只改容器 scrollTop。
 * 避免 scrollIntoView 带动外层页面 / Popover 滚动。
 */
export function scrollTimeColumnToValue(
  container: HTMLElement | null | undefined,
  value: number,
): void {
  if (!container) return
  const item = container.querySelector<HTMLElement>(`:scope > [data-value="${value}"]`)
  if (!item) return
  const top = item.offsetTop - (container.clientHeight - item.offsetHeight) / 2
  container.scrollTop = Math.max(0, top)
}

export function parseTimeValue(value?: string, withSeconds = false): RsParsedTime | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (withSeconds) {
    const withSec = TIME_WITH_SECONDS_PATTERN.exec(trimmed)
    if (withSec) {
      return {
        hour: Number.parseInt(withSec[1], 10),
        minute: Number.parseInt(withSec[2], 10),
        second: Number.parseInt(withSec[3], 10),
      }
    }
    // 兼容仅到分的旧值，秒补 0
    const minuteOnly = TIME_PATTERN.exec(trimmed)
    if (minuteOnly) {
      return {
        hour: Number.parseInt(minuteOnly[1], 10),
        minute: Number.parseInt(minuteOnly[2], 10),
        second: 0,
      }
    }
    return null
  }
  const match = TIME_PATTERN.exec(trimmed)
  if (!match) return null
  return {
    hour: Number.parseInt(match[1], 10),
    minute: Number.parseInt(match[2], 10),
    second: 0,
  }
}

export function formatTimeParts(hour: number, minute: number, second?: number): string {
  const h = String(hour).padStart(2, '0')
  const m = String(minute).padStart(2, '0')
  if (second !== undefined) return `${h}:${m}:${String(second).padStart(2, '0')}`
  return `${h}:${m}`
}

export function formatTimeFromParts(
  hour: number,
  minute: number,
  second: number,
  withSeconds = false,
): string {
  return formatTimeParts(hour, minute, withSeconds ? second : undefined)
}

export function getCurrentTime(): RsParsedTime {
  const now = new Date()
  return {
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
  }
}

export function formatTimeValue(value?: string): string {
  return value ?? ''
}

export function timeToSeconds(hour: number, minute: number, second = 0): number {
  return hour * 3600 + minute * 60 + second
}

export function parseTimeToSeconds(value: string, withSeconds = false): number | null {
  const parsed = parseTimeValue(value, withSeconds)
  if (!parsed) return null
  return timeToSeconds(parsed.hour, parsed.minute, parsed.second)
}

export function isTimeWithinBounds(
  hour: number,
  minute: number,
  second: number,
  options: { minTime?: string; maxTime?: string; withSeconds?: boolean } = {},
): boolean {
  const { minTime, maxTime, withSeconds = false } = options
  const candidate = timeToSeconds(hour, minute, second)

  if (minTime) {
    const minSeconds = parseTimeToSeconds(minTime, withSeconds)
    if (minSeconds !== null && candidate < minSeconds) return false
  }

  if (maxTime) {
    const maxSeconds = parseTimeToSeconds(maxTime, withSeconds)
    if (maxSeconds !== null && candidate > maxSeconds) return false
  }

  return true
}

export function isTimeRangeEmpty(value: RsTimeRangeValue): boolean {
  return !value.start?.trim() && !value.end?.trim()
}

export function isTimeRangeOrdered(
  range: RsTimeRangeValue,
  withSeconds = false,
): boolean {
  if (!range.start || !range.end) return true
  return isTimeRangeOrderedValues(range.start, range.end, withSeconds)
}

export function isTimeRangeOrderedValues(
  start: string,
  end: string,
  withSeconds = false,
): boolean {
  const startSeconds = parseTimeToSeconds(start, withSeconds)
  const endSeconds = parseTimeToSeconds(end, withSeconds)
  if (startSeconds === null || endSeconds === null) return true
  return startSeconds <= endSeconds
}

export function pickEarlierTime(
  a?: string,
  b?: string,
  withSeconds = false,
): string | undefined {
  if (!a) return b
  if (!b) return a
  const ta = parseTimeToSeconds(a, withSeconds)
  const tb = parseTimeToSeconds(b, withSeconds)
  if (ta === null) return b
  if (tb === null) return a
  return ta <= tb ? a : b
}

export function pickLaterTime(
  a?: string,
  b?: string,
  withSeconds = false,
): string | undefined {
  if (!a) return b
  if (!b) return a
  const ta = parseTimeToSeconds(a, withSeconds)
  const tb = parseTimeToSeconds(b, withSeconds)
  if (ta === null) return b
  if (tb === null) return a
  return ta >= tb ? a : b
}

export function formatTimeRangeDisplay(
  range: RsTimeRangeValue,
  options?: { separator?: string },
): string {
  const separator = options?.separator ?? ' ~ '
  const start = range.start ? formatTimeValue(range.start) : ''
  const end = range.end ? formatTimeValue(range.end) : ''
  if (start && end) return `${start}${separator}${end}`
  return start || end
}
