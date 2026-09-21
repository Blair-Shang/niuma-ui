import { enUS, zhCN } from './messages'
import {
  defaultLocale,
  fallbackLocale,
  type RsLocale,
  type RsLocaleMessages,
  type RsTextDirection,
} from './types'

export interface RsLocalePack {
  messages: RsLocaleMessages
  dir: RsTextDirection
}

const packs = new Map<string, RsLocalePack>()

const RTL_LANG = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'])

export function inferRsLocaleDir(code: string): RsTextDirection {
  const base = code.trim().split(/[-_]/)[0]?.toLowerCase() ?? ''
  return RTL_LANG.has(base) ? 'rtl' : 'ltr'
}

/**
 * 登记或合并一种语言。第二次调用同码会覆盖已给的 key，并保留未改的 dir（除非这次传了 dir）。
 * 内置 `zh-CN` / `en-US` 启动时已登记；第三方只调这一次即可被 `RsConfigProvider.locale` 使用。
 */
export function registerRsLocale(
  code: RsLocale,
  messages: RsLocaleMessages,
  options?: { dir?: RsTextDirection },
): void {
  const id = code.trim()
  if (!id) {
    throw new Error('registerRsLocale: code is required')
  }
  const prev = packs.get(id)
  packs.set(id, {
    messages: prev ? { ...prev.messages, ...messages } : { ...messages },
    dir: options?.dir ?? prev?.dir ?? inferRsLocaleDir(id),
  })
}

export function isRsLocaleRegistered(code: string): boolean {
  return packs.has(code)
}

export function listRsLocales(): string[] {
  return [...packs.keys()]
}

export function resolveRsLocalePack(code: string): RsLocalePack {
  return packs.get(code) ?? packs.get(defaultLocale)!
}

export function resolveRsLocaleDir(code: string): RsTextDirection {
  return packs.get(code)?.dir ?? inferRsLocaleDir(code)
}

/** 缺 key：当前语言 → en-US → zh-CN。 */
export function resolveRsMessage(code: string, key: string): string | undefined {
  return (
    packs.get(code)?.messages[key] ??
    packs.get(fallbackLocale)?.messages[key] ??
    packs.get(defaultLocale)?.messages[key]
  )
}

registerRsLocale('zh-CN', zhCN, { dir: 'ltr' })
registerRsLocale('en-US', enUS, { dir: 'ltr' })
