/**
 * RsInputNumber 纯函数工具（对齐 Ant InputNumber 核心语义）。
 * 展示/编辑过程用文本草稿；提交边界再解析为 number / string。
 */

export type RsInputNumberValue = number | string | null

export function countDecimalPlaces(value: number | string): number {
  const s = String(value)
  const exp = s.toLowerCase().indexOf('e')
  if (exp >= 0) {
    const base = s.slice(0, exp)
    const power = Number(s.slice(exp + 1))
    const baseDecimals = Math.max(0, (base.split('.')[1] ?? '').length)
    return Math.max(0, baseDecimals - power)
  }
  const dot = s.indexOf('.')
  return dot >= 0 ? s.length - dot - 1 : 0
}

export function resolveNumberPrecision(step: number | string, precision?: number): number {
  if (precision != null && Number.isFinite(precision) && precision >= 0) {
    return Math.floor(precision)
  }
  return countDecimalPlaces(step)
}

export function roundToPrecision(value: number, precision: number): number {
  if (!Number.isFinite(value)) return value
  if (precision <= 0) return Math.round(value)
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

/** 是否为尚可继续输入的中间态（如 `-`、`1.`、`1e`）。 */
export function isNumberInputInterim(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  // 末尾符号：继续输入小数/指数
  if (/[+-]$/.test(t) || /\.$/.test(t) || /[eE][+-]?$/.test(t)) return true
  if (!/^[+-]?(\d+\.?\d*|\.\d*)([eE][+-]?\d+)?$/.test(t)) return false
  return Number.isNaN(Number(t))
}

export function parseNumberInput(text: string): number | null {
  const t = text.trim()
  if (!t || t === '+' || t === '-' || t === '.' || t === '+.' || t === '-.') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function clampNumber(value: number, min?: number, max?: number): number {
  let next = value
  if (min != null && Number.isFinite(min) && next < min) next = min
  if (max != null && Number.isFinite(max) && next > max) next = max
  return next
}

export function formatNumberValue(
  value: number | null,
  opts?: {
    precision?: number
    formatter?: (value: number, info: { userTyping: boolean; input: string }) => string
    userTyping?: boolean
    input?: string
  },
): string {
  if (value == null || !Number.isFinite(value)) return ''
  if (opts?.formatter) {
    return opts.formatter(value, {
      userTyping: Boolean(opts.userTyping),
      input: opts.input ?? String(value),
    })
  }
  if (opts?.precision != null && opts.precision >= 0) {
    return value.toFixed(opts.precision)
  }
  return String(value)
}

export function stepNumberValue(
  current: number | null,
  direction: 1 | -1,
  opts: {
    step?: number | string
    min?: number
    max?: number
    precision?: number
  } = {},
): number {
  const step = Number(opts.step ?? 1)
  const safeStep = Number.isFinite(step) && step !== 0 ? Math.abs(step) : 1
  const precision = resolveNumberPrecision(safeStep, opts.precision)
  const base = current == null || !Number.isFinite(current) ? 0 : current
  const next = roundToPrecision(base + direction * safeStep, precision)
  return clampNumber(next, opts.min, opts.max)
}

export function normalizeCommittedNumber(
  raw: string,
  opts: {
    min?: number
    max?: number
    precision?: number
    step?: number | string
    parser?: (display: string) => string
  } = {},
): number | null {
  const text = opts.parser ? opts.parser(raw) : raw
  const parsed = parseNumberInput(text)
  if (parsed == null) return null
  const precision = resolveNumberPrecision(opts.step ?? 1, opts.precision)
  return clampNumber(roundToPrecision(parsed, precision), opts.min, opts.max)
}

export function toModelValue(
  value: number | null,
  stringMode: boolean,
): RsInputNumberValue {
  if (value == null) return null
  return stringMode ? String(value) : value
}

export function fromModelValue(value: RsInputNumberValue): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  return parseNumberInput(String(value))
}
