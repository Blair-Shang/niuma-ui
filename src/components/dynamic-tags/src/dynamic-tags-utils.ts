/** 提交前变换或拒绝草稿。false 表示不写入。 */
export type RsDynamicTagsParse = (value: string) => string | false

export type RsDynamicTagsRejectReason = 'duplicate' | 'max' | 'invalid'

export function normalizeRsDynamicTagsSeparators(
  separators?: string | readonly string[],
): string[] {
  if (separators == null) return []
  const list = typeof separators === 'string' ? [separators] : [...separators]
  return list.filter((item) => item.length > 0)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

/**
 * 按分隔符切开草稿。最后一段是尚未提交的 rest（可能为空）。
 * 多字符分隔符按长度优先匹配。
 */
export function splitRsDynamicTagsDraft(
  draft: string,
  separators: readonly string[],
): { tokens: string[]; rest: string } {
  if (!draft) return { tokens: [], rest: '' }
  if (!separators.length) return { tokens: [], rest: draft }
  const sorted = [...separators].sort((a, b) => b.length - a.length)
  const re = new RegExp(sorted.map(escapeRegExp).join('|'))
  const parts = draft.split(re)
  const rest = parts.pop() ?? ''
  const tokens = parts.map((item) => item.trim()).filter((item) => item.length > 0)
  return { tokens, rest }
}

export function draftHasRsDynamicTagsSeparator(
  draft: string,
  separators: readonly string[],
): boolean {
  if (!draft || !separators.length) return false
  return separators.some((item) => draft.includes(item))
}

export function parseRsDynamicTag(
  value: string,
  parse?: RsDynamicTagsParse,
): string | false {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (!parse) return trimmed
  const next = parse(trimmed)
  if (next === false) return false
  const out = String(next).trim()
  return out.length > 0 ? out : false
}

export function canAcceptRsDynamicTag(
  tags: readonly string[],
  value: string,
  options: { allowDuplicate?: boolean; max?: number },
): 'ok' | RsDynamicTagsRejectReason {
  if (options.max !== undefined && tags.length >= options.max) return 'max'
  if (!options.allowDuplicate && tags.includes(value)) return 'duplicate'
  return 'ok'
}

function asTagText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return ''
}

export function coerceRsDynamicTagsValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asTagText).filter((item) => item.length > 0)
  }
  const text = asTagText(value).trim()
  return text ? [text] : []
}
