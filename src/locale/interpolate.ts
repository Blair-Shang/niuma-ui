export type RsI18nVars = Record<string, string | number>

export type RsTranslateFn = (
  key: string,
  fallbackOrVars?: string | RsI18nVars,
  vars?: RsI18nVars,
) => string

const PLURAL_HEAD = /^\{(\w+),\s*plural\s*,/

/**
 * 插值：`{name}` 换成 vars。
 * 复数（ICU 子集）：`{count, plural, one {# item} other {# items}}`，
 * 可用 `=0` / `=1`。`#` 换成数字。类别由 `Intl.PluralRules(locale)` 决定。
 */
export function interpolateRsMessage(
  template: string,
  vars?: RsI18nVars,
  locale = 'en-US',
): string {
  const withPlural = expandPluralBlocks(template, vars, locale)
  if (!vars) return withPlural
  return withPlural.replace(/\{(\w+)\}/g, (matched, key: string) => {
    const value = vars[key]
    return value == null ? matched : String(value)
  })
}

function expandPluralBlocks(template: string, vars: RsI18nVars | undefined, locale: string): string {
  let i = 0
  let out = ''
  while (i < template.length) {
    if (template[i] !== '{') {
      out += template[i]
      i += 1
      continue
    }
    const parsed = parsePluralBlock(template, i)
    if (!parsed) {
      const end = template.indexOf('}', i)
      if (end === -1) {
        out += template.slice(i)
        break
      }
      out += template.slice(i, end + 1)
      i = end + 1
      continue
    }
    const raw = vars?.[parsed.name]
    const n = typeof raw === 'number' ? raw : Number(raw)
    const clause = pickPluralClause(locale, n, parsed.clauses)
    const numeral = Number.isFinite(n) ? String(n) : raw == null ? '' : String(raw)
    out += clause.replace(/#/g, numeral)
    i = parsed.end
  }
  return out
}

function parsePluralBlock(
  source: string,
  start: number,
): { name: string; clauses: Map<string, string>; end: number } | null {
  const head = PLURAL_HEAD.exec(source.slice(start))
  if (!head) return null
  let i = start + head[0].length
  const clauses = new Map<string, string>()
  while (i < source.length) {
    while (source[i] === ' ' || source[i] === '\n' || source[i] === '\t') i += 1
    if (source[i] === '}') {
      return { name: head[1], clauses, end: i + 1 }
    }
    let selector = ''
    if (source[i] === '=') {
      let j = i + 1
      while (j < source.length && source[j] >= '0' && source[j] <= '9') j += 1
      selector = source.slice(i, j)
      i = j
    } else {
      let j = i
      while (j < source.length && source[j] >= 'a' && source[j] <= 'z') j += 1
      selector = source.slice(i, j)
      i = j
    }
    if (!selector) return null
    while (source[i] === ' ' || source[i] === '\t') i += 1
    if (source[i] !== '{') return null
    const inner = readBalanced(source, i)
    if (!inner) return null
    clauses.set(selector, inner.text)
    i = inner.end
  }
  return null
}

function readBalanced(source: string, open: number): { text: string; end: number } | null {
  if (source[open] !== '{') return null
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) {
        return { text: source.slice(open + 1, i), end: i + 1 }
      }
    }
  }
  return null
}

const pluralRulesByLocale = new Map<string, Intl.PluralRules>()

function pluralRulesFor(locale: string): Intl.PluralRules | undefined {
  const cached = pluralRulesByLocale.get(locale)
  if (cached) return cached
  try {
    const rules = new Intl.PluralRules(locale)
    pluralRulesByLocale.set(locale, rules)
    return rules
  } catch {
    return undefined
  }
}

function pickPluralClause(locale: string, n: number, clauses: Map<string, string>): string {
  if (Number.isFinite(n)) {
    const exact = clauses.get(`=${n}`)
    if (exact != null) return exact
    const category = pluralRulesFor(locale)?.select(n)
    if (category) {
      const matched = clauses.get(category)
      if (matched != null) return matched
    }
  }
  return clauses.get('other') ?? ''
}

/**
 * 解析 t() 的第 2、3 参：既兼容 `t(key, fallback)`，也支持 `t(key, vars)`。
 */
export function resolveRsTranslateArgs(
  fallbackOrVars?: string | RsI18nVars,
  vars?: RsI18nVars,
): { fallback?: string; vars?: RsI18nVars } {
  if (fallbackOrVars && typeof fallbackOrVars === 'object') {
    return { vars: fallbackOrVars }
  }
  return { fallback: fallbackOrVars, vars }
}
