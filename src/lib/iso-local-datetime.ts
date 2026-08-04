/**
 * 带显式时区的 ISO-8601 ↔ 本机本地墙钟。
 * 用于表格展示 / 编辑草稿 / 写回，避免剥 Z 丢时区，并尽量保留毫秒。
 */

/** `YYYY-MM-DDTHH:mm:ssZ` = 20；含毫秒/偏移上限约 35，放宽到 40 */
const ISO_TZ_MIN_LEN = 20
const ISO_TZ_MAX_LEN = 40

const ISO_WITH_TZ_RE =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:?\d{2})$/i

/** 本地墙钟（无时区） */
const LOCAL_DATETIME_RE =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d{1,9})?$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function pad3(n: number): string {
  return String(n).padStart(3, '0')
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9'
}

/**
 * 廉价判定：是否像「带时区的 ISO 日期时间」。
 * 失败路径只做长度/字符检查，避免对普通文本跑正则。
 */
export function looksLikeIsoDateTimeWithTz(value: string): boolean {
  const n = value.length
  if (n < ISO_TZ_MIN_LEN || n > ISO_TZ_MAX_LEN) return false
  if (
    !isDigit(value[0]!) ||
    !isDigit(value[1]!) ||
    !isDigit(value[2]!) ||
    !isDigit(value[3]!) ||
    value[4] !== '-' ||
    !isDigit(value[5]!) ||
    !isDigit(value[6]!) ||
    value[7] !== '-' ||
    !isDigit(value[8]!) ||
    !isDigit(value[9]!)
  ) {
    return false
  }
  const sep = value[10]
  if (sep !== 'T' && sep !== 't' && sep !== ' ') return false
  const last = value[n - 1]!
  if (last === 'Z' || last === 'z') return true
  if (n >= 25 && (value.includes('+', 19) || value.lastIndexOf('-') > 19)) return true
  return false
}

function formatLocalFromDate(d: Date, withMs: boolean): string {
  const base =
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  if (!withMs) return base
  return `${base}.${pad3(d.getMilliseconds())}`
}

function formatUtcIsoFromDate(d: Date, withMs: boolean): string {
  const base =
    `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T` +
    `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
  if (!withMs) return `${base}Z`
  return `${base}.${pad3(d.getUTCMilliseconds())}Z`
}

function localSecondKey(local: string): string {
  // `YYYY-MM-DD HH:mm:ss` 前 19 字符；兼容 T 分隔
  const t = local.trim().replace('T', ' ')
  return t.length >= 19 ? t.slice(0, 19) : t
}

/** 将带时区的 ISO 串转为本地时间；无法识别则返回 null。 */
export function formatIsoUtcToLocal(value: string): string | null {
  const t = value.trim()
  if (!looksLikeIsoDateTimeWithTz(t)) return null

  const m = ISO_WITH_TZ_RE.exec(t)
  if (!m) return null

  const hasFrac = Boolean(m[3])
  const frac = hasFrac ? m[3]!.slice(0, 4) : ''
  const iso = `${m[1]}T${m[2]}${frac}${m[4]}`
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null

  return formatLocalFromDate(d, hasFrac)
}

/**
 * 将本地墙钟（或已带时区的 ISO）写回 UTC ISO。
 * - 与 previousIso 在「秒」级一致且输入无新小数秒 → 原样返回 previous（保留毫秒/更长小数）
 * - 否则按输入精度生成 `...Z`（有小数秒则到毫秒）
 */
export function parseLocalDateTimeToUtcIso(
  local: string,
  previousIso?: string,
): string | null {
  const t = local.trim()
  if (!t) return null

  if (looksLikeIsoDateTimeWithTz(t)) {
    const m = ISO_WITH_TZ_RE.exec(t)
    if (!m) return null
    const hasFrac = Boolean(m[3])
    const frac = hasFrac ? m[3]!.slice(0, 4) : ''
    const d = new Date(`${m[1]}T${m[2]}${frac}${m[4]}`)
    if (Number.isNaN(d.getTime())) return null
    const prev = previousIso?.trim()
    if (prev && looksLikeIsoDateTimeWithTz(prev)) {
      const prevLocal = formatIsoUtcToLocal(prev)
      if (
        prevLocal &&
        !hasFrac &&
        localSecondKey(prevLocal) === localSecondKey(formatLocalFromDate(d, false))
      ) {
        return prev
      }
    }
    return formatUtcIsoFromDate(d, hasFrac)
  }

  const m = LOCAL_DATETIME_RE.exec(t)
  if (!m) return null

  const hasFrac = Boolean(m[3])
  const frac = hasFrac ? m[3]!.slice(0, 4) : ''
  // 无 Z 的日期时间按 ES 本地时区解析
  const d = new Date(`${m[1]}T${m[2]}${frac}`)
  if (Number.isNaN(d.getTime())) return null

  const prev = previousIso?.trim()
  if (prev && looksLikeIsoDateTimeWithTz(prev)) {
    const prevLocal = formatIsoUtcToLocal(prev)
    if (prevLocal) {
      const inputNorm = t.replace('T', ' ')
      // 草稿与展示本地值完全一致 → 原样写回（保留 .NET 7 位等超毫秒小数）
      if (inputNorm === prevLocal) return prev
      // 日期选择器通常只到秒：未改秒则保留原始精度
      if (!hasFrac && localSecondKey(prevLocal) === localSecondKey(inputNorm)) return prev
    }
  }

  return formatUtcIsoFromDate(d, hasFrac)
}
