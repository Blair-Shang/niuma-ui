import { createI18n } from 'vue-i18n'
import { enUS, zhCN, type SiteMessages } from './locales'

export type { SiteMessages }

/**
 * 文档站已登记的界面语言。新增语言：
 * 1. 复制 `site/locales/en-US/` 为 `site/locales/{code}/`（nav / home / doc…）
 * 2. 写入 SITE_LOCALES / SITE_LOCALE_SHORT / siteMessages
 * 3. 演示 `useSiteDemo` 表补一块（未补回退 en-US）
 */
export const SITE_LOCALES = ['zh-CN', 'en-US'] as const

export type SiteLocale = (typeof SITE_LOCALES)[number]

export const SITE_LOCALE_STORAGE_KEY = 'niuma-ui-site-locale'

/** 顶栏语言钮上的短标签（显示「下一个」语言）。 */
export const SITE_LOCALE_SHORT: Record<SiteLocale, string> = {
  'zh-CN': '中',
  'en-US': 'EN',
}

export const siteMessages: Record<SiteLocale, SiteMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export function isSiteLocale(value: string): value is SiteLocale {
  return (SITE_LOCALES as readonly string[]).includes(value)
}

export function isZhSiteLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith('zh')
}

/** 壳层语言包：精确匹配 → 同语种前缀 → en-US → zh-CN。 */
export function resolveSiteLocale(locale: string): SiteLocale {
  if (isSiteLocale(locale)) return locale
  const lang = locale.split('-')[0]?.toLowerCase()
  if (lang) {
    const hit = SITE_LOCALES.find(
      (code) => code.toLowerCase() === lang || code.toLowerCase().startsWith(`${lang}-`),
    )
    if (hit) return hit
  }
  return 'en-US'
}

export function nextSiteLocale(locale: string): SiteLocale {
  const current = resolveSiteLocale(locale)
  const index = SITE_LOCALES.indexOf(current)
  return SITE_LOCALES[(index + 1) % SITE_LOCALES.length]
}

export function siteLocaleShort(locale: string): string {
  return SITE_LOCALE_SHORT[resolveSiteLocale(locale)]
}

export function readStoredSiteLocale(): SiteLocale | undefined {
  if (typeof localStorage === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(SITE_LOCALE_STORAGE_KEY)
    return raw && isSiteLocale(raw) ? raw : undefined
  } catch {
    return undefined
  }
}

export function writeStoredSiteLocale(locale: SiteLocale): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SITE_LOCALE_STORAGE_KEY, locale)
  } catch {
    // 隐私模式写不进去时仍切换当前会话
  }
}

function readHostLanguage(): string {
  if (typeof navigator === 'undefined') return 'zh-CN'
  return navigator.language || navigator.languages?.[0] || 'zh-CN'
}

export function readInitialSiteLocale(): SiteLocale {
  return readStoredSiteLocale() ?? resolveSiteLocale(readHostLanguage())
}

/**
 * 按当前 locale 取表。catalog / 演示局部字典走这里，禁止 `locale === 'en-US'`。
 * 缺当前语言时：同语种 → en-US → zh-CN → 表里第一份。
 */
export function pickSiteRecord<T>(table: Partial<Record<string, T>>, locale: string): T {
  const exact = table[locale]
  if (exact != null) return exact
  const lang = locale.split('-')[0]?.toLowerCase()
  if (lang) {
    const prefixed = Object.entries(table).find(
      ([key, value]) =>
        value != null && (key.toLowerCase() === lang || key.toLowerCase().startsWith(`${lang}-`)),
    )
    if (prefixed?.[1] != null) return prefixed[1]
  }
  if (table['en-US'] != null) return table['en-US']
  if (table['zh-CN'] != null) return table['zh-CN']
  const first = Object.values(table).find((value) => value != null)
  if (first != null) return first
  throw new Error('[niuma-ui site] empty locale table')
}

/** catalog / DocDemo 的中英成对字段。非中文回退英文（没有英文再用中文）。 */
export function pickSitePair<T>(locale: string, zh: T, en?: T | null): T {
  if (zh == null && en == null) return zh
  return pickSiteRecord(
    {
      'zh-CN': zh,
      'en-US': (en ?? zh) as T,
    },
    locale,
  )
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: readInitialSiteLocale(),
  fallbackLocale: ['en-US', 'zh-CN'],
  missingWarn: false,
  fallbackWarn: false,
  messages: siteMessages,
})

export function siteText(locale: string): SiteMessages {
  const code = resolveSiteLocale(locale)
  const pack = i18n.global.getLocaleMessage(code) as SiteMessages | undefined
  return pack ?? siteMessages[code]
}
