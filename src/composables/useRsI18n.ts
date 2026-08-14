import { computed, inject } from 'vue'
import { interpolateRsMessage, resolveRsTranslateArgs, type RsI18nVars, type RsTranslateFn } from '../locale/interpolate'
import { localeMap } from '../locale/messages'
import { defaultLocale, type RsLocale } from '../locale/types'
import { rsConfigKey } from './useRsConfig'

export type { RsI18nVars, RsTranslateFn }

function translate(
  locale: RsLocale,
  key: string,
  fallbackOrVars?: string | RsI18nVars,
  vars?: RsI18nVars,
): string {
  const parsed = resolveRsTranslateArgs(fallbackOrVars, vars)
  const raw = localeMap[locale][key] ?? parsed.fallback ?? key
  return interpolateRsMessage(raw, parsed.vars)
}

/** 组件内安全取文案：Provider 内跟随 locale，否则回退 defaultLocale */
export function useRsI18n() {
  const ctx = inject(rsConfigKey, null)
  const locale = computed<RsLocale>(() => ctx?.locale.value ?? defaultLocale)

  const t: RsTranslateFn = (key, fallbackOrVars, vars) =>
    translate(locale.value, key, fallbackOrVars, vars)

  return { t, locale }
}

export function createTranslator(locale: RsLocale): RsTranslateFn {
  return (key, fallbackOrVars, vars) => translate(locale, key, fallbackOrVars, vars)
}
