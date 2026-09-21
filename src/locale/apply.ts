import { resolveRsLocaleDir } from './registry'
import {
  defaultLocale,
  dirAttribute,
  localeAttribute,
  type RsDirMode,
  type RsLocale,
  type RsTextDirection,
} from './types'

export function resolveDirMode(mode: RsDirMode, locale: RsLocale): RsTextDirection {
  if (mode === 'ltr' || mode === 'rtl') {
    return mode
  }
  return resolveRsLocaleDir(locale)
}

/**
 * 写入语言与书写方向。色值不在这里。
 * `dir` 同时写元素的 HTML `dir` 与 `data-rs-dir`，Portal 跟 document 时才能翻。
 */
export function applyLocale(
  locale: RsLocale,
  dir: RsDirMode = 'auto',
  el: HTMLElement = document.documentElement,
) {
  const resolvedDir = resolveDirMode(dir, locale)
  el.setAttribute(localeAttribute, locale)
  el.setAttribute('lang', locale)
  el.setAttribute('dir', resolvedDir)
  el.setAttribute(dirAttribute, resolvedDir)
}

export function readDocumentLocale(el?: HTMLElement | null): RsLocale {
  if (typeof document === 'undefined') {
    return defaultLocale
  }
  const target = el ?? document.documentElement
  return target.getAttribute(localeAttribute) || defaultLocale
}
