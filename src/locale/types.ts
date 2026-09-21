/** 内置语言。第三方用 `registerRsLocale` 加 BCP-47 码。 */
export type RsBuiltinLocale = 'zh-CN' | 'en-US'

/** BCP-47。内置码可自动补全；注册后的任意码也合法。 */
export type RsLocale = RsBuiltinLocale | (string & {})

export type RsLocaleMessages = Record<string, string>

export type RsTextDirection = 'ltr' | 'rtl'

/** 书写方向：auto 跟当前 locale 的 dir。 */
export type RsDirMode = RsTextDirection | 'auto'

/** 无法从本机语言识别时的回退。当前用户以中文为主，回退 zh-CN。 */
export const defaultLocale: RsBuiltinLocale = 'zh-CN'

/** 缺 key 时先回退到该语言，再回退 zh-CN。 */
export const fallbackLocale: RsBuiltinLocale = 'en-US'

export const localeAttribute = 'data-rs-locale'

export const dirAttribute = 'data-rs-dir'
