/**
 * 指标卡纯函数。数字格式化只在调用方打开 format / precision 时走 Intl，
 * 默认把 number 转成与模板插值相同的字符串，避免改变已有仪表盘文案。
 */

export const RS_STAT_ACCENTS = ['primary', 'success', 'warning', 'danger', 'info'] as const

export type RsStatAccent = (typeof RS_STAT_ACCENTS)[number]

export const RS_STAT_TRENDS = ['up', 'down', 'flat'] as const

export type RsStatTrend = (typeof RS_STAT_TRENDS)[number]

export const RS_STAT_TREND_TONES = ['neutral', ...RS_STAT_ACCENTS] as const

export type RsStatTrendTone = (typeof RS_STAT_TREND_TONES)[number]

/** 疏密，不是控件高度。没有 ssm。 */
export const RS_STAT_SIZES = ['sm', 'md', 'lg'] as const

export type RsStatSize = (typeof RS_STAT_SIZES)[number]

/** true 使用当前 locale 的默认分组；对象传给 Intl.NumberFormat。false 保持原文。 */
export type RsStatFormat = boolean | Intl.NumberFormatOptions

const FORMATTER_CACHE_LIMIT = 24
const formatters = new Map<string, Intl.NumberFormat>()

export function isRsStatAccent(value: unknown): value is RsStatAccent {
  return typeof value === 'string' && (RS_STAT_ACCENTS as readonly string[]).includes(value)
}

export function isRsStatTrend(value: unknown): value is RsStatTrend {
  return typeof value === 'string' && (RS_STAT_TRENDS as readonly string[]).includes(value)
}

export function isRsStatTrendTone(value: unknown): value is RsStatTrendTone {
  return typeof value === 'string' && (RS_STAT_TREND_TONES as readonly string[]).includes(value)
}

export function isRsStatSize(value: unknown): value is RsStatSize {
  return typeof value === 'string' && (RS_STAT_SIZES as readonly string[]).includes(value)
}

export function resolveRsStatAccent(accent?: string | null): RsStatAccent {
  return isRsStatAccent(accent) ? accent : 'primary'
}

export function resolveRsStatTrend(trend?: string | null): RsStatTrend | null {
  return isRsStatTrend(trend) ? trend : null
}

export function resolveRsStatTrendTone(tone?: string | null): RsStatTrendTone {
  return isRsStatTrendTone(tone) ? tone : 'neutral'
}

export function resolveRsStatSize(size?: string | null): RsStatSize {
  return isRsStatSize(size) ? size : 'md'
}

export function rsStatTrendMark(trend: RsStatTrend): string {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '–'
}

export function rsStatTrendMessageKey(trend: RsStatTrend): string {
  return `statCard.trend.${trend}`
}

export function hasRsStatDelta(delta: string | number | null | undefined): boolean {
  return delta != null && delta !== ''
}

function clampPrecision(precision: number | null | undefined): number | null {
  if (precision == null || !Number.isFinite(precision)) return null
  return Math.min(20, Math.max(0, Math.trunc(precision)))
}

/** 未打开格式化时返回 null，调用方保持 String(value)。 */
export function resolveRsStatNumberFormat(
  format: RsStatFormat | null | undefined,
  precision: number | null | undefined,
): Intl.NumberFormatOptions | null {
  const digits = clampPrecision(precision)
  const explicit = format === true || (format != null && typeof format === 'object')
  if (!explicit && digits == null) return null
  const spec: Intl.NumberFormatOptions =
    format != null && typeof format === 'object' ? { ...format } : {}
  if (digits != null) {
    spec.minimumFractionDigits = digits
    spec.maximumFractionDigits = digits
  }
  return spec
}

function stableFormatKey(options: Intl.NumberFormatOptions): string {
  return Object.keys(options)
    .sort()
    .map((key) => `${key}=${String((options as Record<string, unknown>)[key])}`)
    .join('&')
}

function cachedFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}\0${stableFormatKey(options)}`
  const hit = formatters.get(key)
  if (hit) {
    formatters.delete(key)
    formatters.set(key, hit)
    return hit
  }
  const created = new Intl.NumberFormat(locale || undefined, options)
  if (formatters.size >= FORMATTER_CACHE_LIMIT) {
    const oldest = formatters.keys().next().value
    if (oldest !== undefined) formatters.delete(oldest)
  }
  formatters.set(key, created)
  return created
}

/** 测试观察缓存上限。不从包根导出。 */
export function rsStatFormatterCacheSize(): number {
  return formatters.size
}

/**
 * 字符串原样返回（调用方已经本地化）。
 * 有限数字在 format/precision 打开时用 locale 格式化；非法选项回退 String(value)，不抛。
 */
export function formatRsStatValue(
  value: string | number | null | undefined,
  input: {
    format?: RsStatFormat | null
    precision?: number | null
    locale: string
  },
): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') return value
  if (!Number.isFinite(value)) return String(value)
  const spec = resolveRsStatNumberFormat(input.format, input.precision)
  if (!spec) return String(value)
  try {
    return cachedFormatter(input.locale, spec).format(value)
  } catch {
    return String(value)
  }
}
