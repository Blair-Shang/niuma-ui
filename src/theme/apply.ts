import {
  themeAttribute,
  themePrefAttribute,
  type RsResolvedTheme,
  type RsThemeMode,
} from './types'

function matchPrefersColorSchemeDark(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }
  return window.matchMedia('(prefers-color-scheme: dark)')
}

/** 系统是否偏好暗色。无 window 时视为浅色（与 :root 默认一致）。 */
export function prefersColorSchemeDark(): boolean {
  return matchPrefersColorSchemeDark()?.matches === true
}

/** 把偏好解析成 light / dark。色值仍只认 CSS，不读 themePresets。 */
export function resolveThemeMode(mode: RsThemeMode): RsResolvedTheme {
  if (mode === 'light' || mode === 'dark') {
    return mode
  }
  return prefersColorSchemeDark() ? 'dark' : 'light'
}

/**
 * 读已落到元素上的明暗。无属性或无法识别时按 light，
 * 与 styles.css 的 `:root` 默认一致，避免编辑器 / 弹层先闪暗色。
 */
export function readResolvedTheme(el?: HTMLElement | null): RsResolvedTheme {
  if (typeof document === 'undefined') {
    return 'light'
  }
  const target = el ?? document.documentElement
  const raw = target.getAttribute(themeAttribute)
  if (raw === 'light' || raw === 'dark') {
    return raw
  }
  if (raw === 'system') {
    return resolveThemeMode('system')
  }
  return 'light'
}

/**
 * 切换主题：只写属性。
 * `system` 解析后写 `data-rs-theme="light|dark"`，另标 `data-rs-theme-pref="system"`。
 * 组件选择器继续认 light / dark，不必为 system 再复制一套。
 */
export function applyTheme(
  mode: RsThemeMode,
  el: HTMLElement = document.documentElement,
) {
  const resolved = resolveThemeMode(mode)
  el.setAttribute(themeAttribute, resolved)
  if (mode === 'system') {
    el.setAttribute(themePrefAttribute, 'system')
  } else {
    el.removeAttribute(themePrefAttribute)
  }
}

/** 系统明暗变化时回调；返回取消订阅。 */
export function subscribePreferredColorScheme(onChange: () => void): () => void {
  const mq = matchPrefersColorSchemeDark()
  if (!mq) {
    return () => {}
  }
  const handler = () => onChange()
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
