/** 展示与过滤用的级别。success 是 UI 结果，不是 RFC 严重级别。 */
export type RsLogLevel =
  | 'trace'
  | 'debug'
  | 'info'
  | 'notice'
  | 'success'
  | 'warn'
  | 'error'
  | 'fatal'
  | 'plain'

/** 数字严重级别的标尺。auto：0–7 当 syslog，更大当 OTel。 */
export type RsLogSeverityScale = 'syslog' | 'otel' | 'auto'

/** 调用方补充的成功 / 失败等标识。字符串按拉丁词边界匹配（中日韩按子串），也可传 RegExp。 */
export type RsLogMarker = string | RegExp

/** 未写 level 时，在内置扫描之后用这些标识给正文上色。默认不启用。 */
export type RsLogInferMarkers = {
  [K in Exclude<RsLogLevel, 'plain'>]?: readonly RsLogMarker[]
}

export type InferLogLevelOptions = {
  markers?: RsLogInferMarkers
}

/** 一条结构化日志。level 缺省时可由 infer / severity 得出。 */
export type RsLogLine = {
  id?: string | number
  text: string
  /** 规范级别或别名（warning / critical…），由 parseRsLogLevel 收口 */
  level?: string
  /** RFC 5424 0–7 或 OTel 1–24；未写 level 时参与解析 */
  severity?: number
  time?: string | number | Date
}

export type RsLogLineInput = string | RsLogLine

/** 渲染用的归一化行。key 稳定，供虚拟列表复用。 */
export type RsNormalizedLogLine = {
  key: string
  text: string
  level: RsLogLevel
  time?: string
  /** 裁剪后的 1-based 序号 */
  seq: number
  /** RFC 5424 Severity，plain 为 null */
  syslog: number | null
  /** OpenTelemetry severity number，plain 为 null */
  otel: number | null
}

export const RS_LOG_LEVELS: readonly RsLogLevel[] = [
  'trace',
  'debug',
  'info',
  'notice',
  'success',
  'warn',
  'error',
  'fatal',
  'plain',
]

/** 可过滤的级别（不含 plain）。 */
export const RS_LOG_FILTER_LEVELS: readonly RsLogLevel[] = [
  'trace',
  'debug',
  'info',
  'notice',
  'success',
  'warn',
  'error',
  'fatal',
]

const LEVEL_SET = new Set<string>(RS_LOG_LEVELS)

/** RFC 5424：数字越小越严重。success 映射为 info(6)。 */
const SYSLOG_OF: Record<RsLogLevel, number | null> = {
  fatal: 2,
  error: 3,
  warn: 4,
  notice: 5,
  success: 6,
  info: 6,
  debug: 7,
  trace: 7,
  plain: null,
}

/** OTel：数字越大越严重。取各档下限。 */
const OTEL_OF: Record<RsLogLevel, number | null> = {
  trace: 1,
  debug: 5,
  info: 9,
  notice: 10,
  success: 9,
  warn: 13,
  error: 17,
  fatal: 21,
  plain: null,
}

const ALIAS_LEVEL: Record<string, RsLogLevel> = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  information: 'info',
  informational: 'info',
  notice: 'notice',
  success: 'success',
  ok: 'success',
  warn: 'warn',
  warning: 'warn',
  error: 'error',
  err: 'error',
  failed: 'error',
  failure: 'error',
  fatal: 'fatal',
  crit: 'fatal',
  critical: 'fatal',
  emerg: 'fatal',
  emergency: 'fatal',
  alert: 'fatal',
  panic: 'fatal',
  plain: 'plain',
  output: 'plain',
}

export function isRsLogLevel(value: unknown): value is RsLogLevel {
  return typeof value === 'string' && LEVEL_SET.has(value)
}

/** RFC 5424 Severity（0–7）。plain 返回 null。 */
export function syslogSeverityOf(level: RsLogLevel): number | null {
  return SYSLOG_OF[level]
}

/** OpenTelemetry severity number。plain 返回 null。 */
export function otelSeverityOf(level: RsLogLevel): number | null {
  return OTEL_OF[level]
}

function levelFromSyslog(value: number): RsLogLevel {
  if (value <= 2) return 'fatal'
  if (value === 3) return 'error'
  if (value === 4) return 'warn'
  if (value === 5) return 'notice'
  if (value === 6) return 'info'
  return 'debug'
}

function levelFromOtel(value: number): RsLogLevel {
  if (value >= 21) return 'fatal'
  if (value >= 17) return 'error'
  if (value >= 13) return 'warn'
  if (value >= 9) return 'info'
  if (value >= 5) return 'debug'
  return 'trace'
}

/**
 * 把别名、syslog 0–7、OTel 1–24 收成规范级别。
 * 无法识别时返回 undefined，由调用方决定是否再推断。
 */
export function parseRsLogLevel(
  value: unknown,
  scale: RsLogSeverityScale = 'auto',
): RsLogLevel | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (scale === 'syslog') return levelFromSyslog(value)
    if (scale === 'otel') return levelFromOtel(value)
    return value <= 7 ? levelFromSyslog(value) : levelFromOtel(value)
  }
  if (typeof value !== 'string') return undefined
  const key = value.trim().toLowerCase()
  if (!key) return undefined
  if (LEVEL_SET.has(key)) return key as RsLogLevel
  if (key in ALIAS_LEVEL) return ALIAS_LEVEL[key]
  if (/^\d+$/.test(key)) return parseRsLogLevel(Number(key), scale)
  return undefined
}

/** 把任意输入收成日志行数组：字符串按行拆，对象原样保留。 */
export function asLogLineInputs(input: string | RsLogLineInput | RsLogLineInput[]): RsLogLineInput[] {
  if (typeof input === 'string') {
    return splitLogText(input)
  }
  if (Array.isArray(input)) {
    return input
  }
  return [input]
}

/** 拆成行。统一 CRLF；去掉末尾空行，避免 textarea 尾巴多一行。 */
export function splitLogText(text: string): string[] {
  if (!text) return []
  const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  const lines = normalized.split('\n')
  if (lines.length > 1 && lines.at(-1) === '') {
    lines.pop()
  }
  return lines
}

/** 多条用户标识同时命中时，按严重程度取最高档。 */
const MARKER_RANK: readonly Exclude<RsLogLevel, 'plain'>[] = [
  'fatal',
  'error',
  'warn',
  'notice',
  'success',
  'info',
  'debug',
  'trace',
]

/**
 * 从一行正文推断语义色。
 * 1. [error] / [ok] 等方括号级别（别名走 parseRsLogLevel）
 * 2. 行首级别词，如 ERROR: / WARN
 * 3. 工具链行首：BUILD SUCCESS / BUILD FAILURE / Exception in thread / panic:
 * 4. 调用方 markers：成功 / 失败等产品标识（默认不扫）
 * 行上已有 level / severity 时不会走到这里。
 */
export function inferLogLevel(text: string, options?: InferLogLevelOptions): RsLogLevel {
  const raw = text.trim()
  if (!raw) return 'plain'
  const tagged = levelFromBracketTag(raw)
  if (tagged) return tagged
  const leading = raw.match(/^([a-z]+)\b/i)?.[1]
  const fromLead = leading ? parseRsLogLevel(leading) : undefined
  if (fromLead && fromLead !== 'plain') return fromLead
  if (/^BUILD SUCCESS\b/i.test(raw)) return 'success'
  if (/^BUILD FAILURE\b/i.test(raw)) return 'error'
  if (/^Exception in thread\b/i.test(raw)) return 'error'
  if (/^panic:/i.test(raw)) return 'fatal'
  return levelFromMarkers(raw, options?.markers) ?? 'plain'
}

function levelFromBracketTag(text: string): RsLogLevel | undefined {
  const tag = /\[([^\]\n]+)\]/g
  let match = tag.exec(text)
  while (match) {
    const level = parseRsLogLevel(match[1])
    if (level && level !== 'plain') return level
    match = tag.exec(text)
  }
  return undefined
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function markerHits(text: string, marker: RsLogMarker): boolean {
  if (marker instanceof RegExp) {
    const flags = marker.global ? marker.flags : `${marker.flags}g`
    const copy = new RegExp(marker.source, flags)
    copy.lastIndex = 0
    return copy.test(text)
  }
  const token = marker.trim()
  if (!token) return false
  const pattern = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(token)}(?![A-Za-z0-9_])`, 'i')
  return pattern.test(text)
}

function levelFromMarkers(text: string, markers?: RsLogInferMarkers): RsLogLevel | undefined {
  if (!markers) return undefined
  for (const level of MARKER_RANK) {
    const list = markers[level]
    if (!list?.length) continue
    for (const marker of list) {
      if (markerHits(text, marker)) return level
    }
  }
  return undefined
}

function lineText(input: RsLogLineInput): string {
  return typeof input === 'string' ? input : String(input.text ?? '')
}

function lineKey(input: RsLogLineInput, index: number): string {
  if (typeof input !== 'string' && input.id != null && input.id !== '') {
    return String(input.id)
  }
  return `${index}:${lineText(input).slice(0, 48)}`
}

function looksLikeInstant(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value) || value.includes('T')
}

const DEFAULT_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}

/** 能解析的瞬间走 Intl；已是展示串则原样保留。 */
export function formatLogTime(
  value: string | number | Date | undefined,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = DEFAULT_TIME_FORMAT,
): string | undefined {
  if (value == null || value === '') return undefined
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return new Intl.DateTimeFormat(locale, options).format(value)
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return new Intl.DateTimeFormat(locale, options).format(date)
  }
  if (typeof value === 'string') {
    if (looksLikeInstant(value)) {
      const parsed = Date.parse(value)
      if (!Number.isNaN(parsed)) {
        return new Intl.DateTimeFormat(locale, options).format(new Date(parsed))
      }
    }
    return value
  }
  return undefined
}

export type NormalizeLogLinesOptions = {
  inferLevel?: boolean
  /** 传给 inferLogLevel 的成功 / 失败等标识。inferLevel 为 false 时不使用。 */
  inferMarkers?: RsLogInferMarkers
  maxLines?: number
  severityScale?: RsLogSeverityScale
  locale?: string
  timeFormat?: Intl.DateTimeFormatOptions
}

function resolveLineLevel(
  item: RsLogLineInput,
  text: string,
  options: NormalizeLogLinesOptions,
): RsLogLevel {
  if (typeof item !== 'string') {
    const fromLevel = parseRsLogLevel(item.level, options.severityScale)
    if (fromLevel) return fromLevel
    const fromSeverity = parseRsLogLevel(item.severity, options.severityScale ?? 'auto')
    if (fromSeverity) return fromSeverity
  }
  return options.inferLevel !== false ? inferLogLevel(text, { markers: options.inferMarkers }) : 'plain'
}

/** 把 string / 行对象收成渲染结构。inferLevel 默认开。 */
export function normalizeLogLines(
  source: string | RsLogLineInput[] | undefined | null,
  options: NormalizeLogLinesOptions = {},
): RsNormalizedLogLine[] {
  const raw = source == null ? [] : typeof source === 'string' ? splitLogText(source) : source
  const max = options.maxLines
  const sliced = max != null && max > 0 && raw.length > max ? raw.slice(raw.length - max) : raw
  const locale = options.locale ?? 'en-US'
  return sliced.map((item, index) => {
    const text = lineText(item)
    const level = resolveLineLevel(item, text, options)
    const time =
      typeof item === 'string' ? undefined : formatLogTime(item.time, locale, options.timeFormat)
    return {
      key: lineKey(item, index),
      text,
      level,
      time,
      seq: index + 1,
      syslog: syslogSeverityOf(level),
      otel: otelSeverityOf(level),
    }
  })
}

/** 把一行收成可写回 v-model 的结构（字符串保持字符串）。 */
export function toLogLineInput(input: RsLogLineInput): RsLogLineInput {
  if (typeof input === 'string') return input
  const next: RsLogLine = { text: String(input.text ?? '') }
  const level = parseRsLogLevel(input.level)
  if (input.id != null && input.id !== '') next.id = input.id
  if (level) next.level = level
  if (input.severity != null) next.severity = input.severity
  if (input.time != null && input.time !== '') next.time = input.time
  return next
}

export function joinLogLines(lines: Array<{ text: string }>): string {
  return lines.map((line) => line.text).join('\n')
}

export function clampLogCount<T>(items: T[], maxLines?: number): T[] {
  if (maxLines == null || maxLines <= 0 || items.length <= maxLines) return items
  return items.slice(items.length - maxLines)
}

export function filterLogLines(
  lines: RsNormalizedLogLine[],
  options?: { levels?: readonly RsLogLevel[]; search?: string },
): RsNormalizedLogLine[] {
  const levels = options?.levels?.filter((level) => isRsLogLevel(level)) ?? []
  const query = options?.search?.trim().toLowerCase() ?? ''
  return lines.filter((line) => {
    if (levels.length > 0 && !levels.includes(line.level)) return false
    if (!query) return true
    return line.text.toLowerCase().includes(query) || line.level.includes(query)
  })
}

export type RsLogHighlightPart = { text: string; hit: boolean }

/** 按查询切开正文，供搜索高亮。大小写不敏感。 */
export function splitLogHighlight(text: string, query: string): RsLogHighlightPart[] {
  const needle = query.trim()
  if (!needle) return [{ text, hit: false }]
  const source = text.toLowerCase()
  const target = needle.toLowerCase()
  const parts: RsLogHighlightPart[] = []
  let cursor = 0
  while (cursor < text.length) {
    const index = source.indexOf(target, cursor)
    if (index < 0) {
      parts.push({ text: text.slice(cursor), hit: false })
      break
    }
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), hit: false })
    }
    parts.push({ text: text.slice(index, index + needle.length), hit: true })
    cursor = index + needle.length
  }
  return parts.length > 0 ? parts : [{ text, hit: false }]
}

export function resolveLogLive(live?: boolean | 'off' | 'polite' | 'assertive'): 'off' | 'polite' | 'assertive' {
  if (live === true) return 'polite'
  if (live === false || live == null || live === 'off') return 'off'
  return live
}

export function countDroppedLines(total: number, maxLines?: number): number {
  if (maxLines == null || maxLines <= 0 || total <= maxLines) return 0
  return total - maxLines
}

export type RsLogCopySource = 'selection' | 'line' | 'visible' | 'all'

/** 复制优先级：选区 > 全文 > 当前行 > 可见行（含搜索过滤结果）。 */
export function resolveLogCopyText(options: {
  selection?: string
  activeText?: string
  visibleTexts: string[]
  allTexts?: string[]
}): { text: string; source: RsLogCopySource } {
  const selection = options.selection?.trim()
  if (selection) return { text: selection, source: 'selection' }
  if (options.allTexts && options.allTexts.length > 0) {
    return { text: options.allTexts.join('\n'), source: 'all' }
  }
  const active = options.activeText?.trim()
  if (active) return { text: active, source: 'line' }
  return { text: options.visibleTexts.join('\n'), source: 'visible' }
}
