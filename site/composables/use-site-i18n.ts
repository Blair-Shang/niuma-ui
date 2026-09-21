import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRsConfig } from 'niuma-ui'
import {
  nextSiteLocale,
  pickSitePair,
  pickSiteRecord,
  resolveSiteLocale,
  siteText,
  writeStoredSiteLocale,
  type SiteMessages,
} from '../i18n'

export type SiteDemoMessages<T> = { 'zh-CN': T; 'en-US': T } & Partial<Record<string, T>>

/**
 * 文档站语言 / 主题。
 * - 壳层文案：vue-i18n 的 `t` / `tm` / `chrome`
 * - 组件库文案：`setSiteLocale` 同步 RsConfigProvider.locale
 * - catalog 成对字段：`pair`
 * - 演示局部字典：`useSiteDemo`
 * - 明暗：`resolvedTheme`（跟顶栏 setTheme 同一条）
 */
export function useSiteI18n() {
  const { locale, resolvedTheme, dir, setLocale, setTheme } = useRsConfig()
  const vueI18n = useI18n({ useScope: 'global' })

  watch(
    locale,
    (next) => {
      const resolved = resolveSiteLocale(next)
      if (vueI18n.locale.value !== resolved) vueI18n.locale.value = resolved
    },
    { immediate: true },
  )

  const siteLocale = computed(() => resolveSiteLocale(locale.value))
  const chrome = computed<SiteMessages>(() => siteText(String(vueI18n.locale.value)))
  const nextLocale = computed(() => nextSiteLocale(locale.value))

  function setSiteLocale(next: string) {
    const resolved = resolveSiteLocale(next)
    writeStoredSiteLocale(resolved)
    vueI18n.locale.value = resolved
    setLocale(resolved)
  }

  function pick<T>(table: SiteDemoMessages<T>): T {
    return pickSiteRecord(table, locale.value)
  }

  function pair<T>(zh: T, en?: T | null): T {
    return pickSitePair(locale.value, zh, en)
  }

  return {
    locale,
    siteLocale,
    nextLocale,
    resolvedTheme,
    dir,
    chrome,
    t: vueI18n.t,
    tm: vueI18n.tm,
    te: vueI18n.te,
    setTheme,
    setSiteLocale,
    pick,
    pair,
  }
}

/** 演示预览文案：locale 为键。加语言时在表上加一块即可，未加回退 en-US。 */
export function useSiteDemo<T extends Record<string, unknown>>(messages: SiteDemoMessages<T>) {
  const i18n = useSiteI18n()
  const copy = computed(() => pickSiteRecord(messages, i18n.locale.value))
  return { ...i18n, copy }
}
