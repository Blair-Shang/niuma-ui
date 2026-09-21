import { isRsLocaleRegistered, listRsLocales } from './registry'
import { defaultLocale, type RsLocale } from './types'

/**
 * 未设 locale 时按本机语言选已登记的包。
 * `zh*` → zh-CN，`en*` → en-US，其它按已登记码的语言前缀匹配。
 * 没有 navigator（SSR）或无法识别时回退 `defaultLocale`（zh-CN）。
 */
export function resolveHostLocale(): RsLocale {
  for (const tag of readHostLanguageTags()) {
    const matched = matchRegisteredLocale(tag)
    if (matched) return matched
  }
  return defaultLocale
}

function readHostLanguageTags(): string[] {
  const tags: string[] = []
  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) {
      tags.push(...navigator.languages)
    }
    if (navigator.language) {
      tags.push(navigator.language)
    }
  }
  const seen = new Set<string>()
  const unique: string[] = []
  for (const tag of tags) {
    const normalized = tag.trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(normalized)
  }
  return unique
}

function matchRegisteredLocale(tag: string): RsLocale | undefined {
  const normalized = tag.trim().replace(/_/g, '-')
  if (!normalized) return undefined
  if (isRsLocaleRegistered(normalized)) return normalized

  const lower = normalized.toLowerCase()
  for (const code of listRsLocales()) {
    if (code.toLowerCase() === lower) return code
  }

  const base = lower.split('-')[0] ?? ''
  if (base === 'zh' && isRsLocaleRegistered('zh-CN')) return 'zh-CN'
  if (base === 'en' && isRsLocaleRegistered('en-US')) return 'en-US'

  for (const code of listRsLocales()) {
    if (code.toLowerCase().split(/[-_]/)[0] === base) return code
  }
  return undefined
}
