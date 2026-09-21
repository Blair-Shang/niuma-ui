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
  if (typeof window === 'undefined') return () => {}
  let cancelled = false
  let inner = 0
  const outer = window.requestAnimationFrame(() => {
    inner = window.requestAnimationFrame(() => {
      if (!cancelled) callback()
    })
  })
  return () => {
    cancelled = true
    window.cancelAnimationFrame(outer)
    if (inner) window.cancelAnimationFrame(inner)
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

/** 列内部滚动：给浮层的 capture scroll 用，避免列一滚就重算面板位置。 */
export function isTimeColumnScrollTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.rs-time-columns__list'))
}

function resolveTimeColumnList(event: WheelEvent): HTMLElement | null {
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.classList.contains('rs-time-columns__list')) {
    return event.currentTarget
  }
  if (event.target instanceof Element) {
    return event.target.closest('.rs-time-columns__list')
  }
  return null
}

/**
 * 把滚轮留在时间列里。到顶/到底或列本身装不下时 preventDefault，避免带动页面。
 * 必须非 passive（`{ passive: false }`）。
 */
export function containColumnWheel(event: WheelEvent): void {
  event.stopPropagation()
  const list = resolveTimeColumnList(event)
  if (!list) {
    event.preventDefault()
    return
  }
  const delta = event.deltaY
  if (delta === 0) return
  const max = list.scrollHeight - list.clientHeight
  const top = list.scrollTop
  if (max <= 0 || (delta < 0 && top <= 0) || (delta > 0 && top >= max - 1)) {
    event.preventDefault()
  }
}

/** 面板非列区域：滚轮不要带动外层页面。列内交给 containColumnWheel。 */
export function containOverlayWheel(event: WheelEvent): void {
  if (isTimeColumnScrollTarget(event.target)) return
  event.stopPropagation()
  event.preventDefault()
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
  options?: { separator?: string; hourCycle?: RsTimePickerHourCycle; locale?: string; withSeconds?: boolean },
): string {
  const separator = options?.separator ?? ' ~ '
  const start = range.start
    ? formatTimeDisplay(range.start, {
        hourCycle: options?.hourCycle,
        locale: options?.locale,
        withSeconds: options?.withSeconds,
      })
    : ''
  const end = range.end
    ? formatTimeDisplay(range.end, {
        hourCycle: options?.hourCycle,
        locale: options?.locale,
        withSeconds: options?.withSeconds,
      })
    : ''
  if (start && end) return `${start}${separator}${end}`
  return start || end
}

/** 12 或 24 小时制。绑定值始终是 24 小时墙钟 HH:mm[:ss]。 */
export type RsTimePickerHourCycle = 12 | 24

/** 按列禁用某一档。hour 为 0–23。 */
export type RsTimePickerDisabledTime = (unit: RsTimeUnit, value: number) => boolean

export type RsTimePickerGetPopupContainer = (
  trigger?: HTMLElement,
) => HTMLElement | string | undefined

export interface RsTimePickerShortcut {
  label: string
  value: () => string | RsTimeRangeValue
}

export type RsTimePickerModelValue = string | RsTimeRangeValue

/** 12 小时列：12, 1, 2, … 11 */
export const TIME_HOUR12_OPTIONS: readonly RsTimeUnitOption[] = [
  { value: 12, label: '12' },
  ...Array.from({ length: 11 }, (_, index) => {
    const value = index + 1
    return { value, label: String(value) }
  }),
]

export function toHour12(hour24: number): { hour: number; period: 'am' | 'pm' } {
  const period = hour24 >= 12 ? 'pm' : 'am'
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour, period }
}

export function toHour24(hour12: number, period: 'am' | 'pm'): number {
  const hour = hour12 % 12
  return period === 'pm' ? hour + 12 : hour
}

/**
 * 触发器展示。hourCycle=12 用 Intl（上午/下午跟 locale）；未传则墙钟 HH:mm[:ss]。
 */
export function formatTimeDisplay(
  value: string | undefined,
  options?: { hourCycle?: RsTimePickerHourCycle; withSeconds?: boolean; locale?: string },
): string {
  if (!value) return ''
  const parsed = parseTimeValue(value, options?.withSeconds)
  if (!parsed) return value
  if (options?.hourCycle !== 12) {
    return formatTimeFromParts(parsed.hour, parsed.minute, parsed.second, options?.withSeconds)
  }
  const date = new Date(2000, 0, 1, parsed.hour, parsed.minute, parsed.second)
  try {
    return new Intl.DateTimeFormat(options.locale || undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: options.withSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(date)
  } catch {
    const { hour, period } = toHour12(parsed.hour)
    const body = formatTimeFromParts(hour % 12 === 0 && hour === 12 ? 12 : hour, parsed.minute, parsed.second, options.withSeconds)
    return `${body} ${period.toUpperCase()}`
  }
}

export function resolveTimePickerPortalTarget(
  getPopupContainer: RsTimePickerGetPopupContainer | undefined,
  trigger?: HTMLElement | null,
): string | HTMLElement {
  if (typeof document === 'undefined') return 'body'
  if (!getPopupContainer) return 'body'
  return getPopupContainer(trigger ?? undefined) ?? 'body'
}
