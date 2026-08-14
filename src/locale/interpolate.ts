export type RsI18nVars = Record<string, string | number>

export type RsTranslateFn = (
  key: string,
  fallbackOrVars?: string | RsI18nVars,
  vars?: RsI18nVars,
) => string

/**
 * 将文案中的 `{name}` 替换为 vars。
 * 对标 Ant Design / vue-i18n 的命名插值。
 */
export function interpolateRsMessage(template: string, vars?: RsI18nVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (matched, key: string) => {
    const value = vars[key]
    return value == null ? matched : String(value)
  })
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
