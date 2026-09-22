import { themeAttribute, type RsResolvedTheme } from './types'

/**
 * 颜色主题身份。只标记当前皮肤，组件样式不要用它做选择器。
 * 明暗仍只写 `data-rs-theme="light|dark"`。
 */
export const colorThemeAttribute = 'data-rs-color-theme'

/** 文档级编辑器要同时观察明暗和颜色主题，否则同为暗色时换皮肤不会重读 token。 */
export const documentThemeAttributes = [themeAttribute, colorThemeAttribute] as const

/**
 * 主题包可以覆盖的语义令牌。表格、树、按钮等已用 var() 指向这些名字。
 * 键是主题文件里的字段，值是要写到元素上的 CSS 变量。
 */
export const RS_COLOR_THEME_VARS = {
  primary: '--rs-primary',
  primaryHover: '--rs-primary-hover',
  primaryForeground: '--rs-primary-foreground',
  primaryContainer: '--rs-primary-container',
  onPrimaryContainer: '--rs-on-primary-container',
  bg: '--rs-bg',
  surface: '--rs-surface',
  surfaceElevated: '--rs-surface-elevated',
  surfaceHover: '--rs-surface-hover',
  itemHover: '--rs-item-hover',
  inputBg: '--rs-input-bg',
  inputBorder: '--rs-input-border',
  inputBorderHover: '--rs-input-border-hover',
  border: '--rs-border',
  borderSubtle: '--rs-border-subtle',
  text: '--rs-text-primary',
  muted: '--rs-text-secondary',
  placeholder: '--rs-text-tertiary',
  textDisabled: '--rs-text-disabled',
  textInverse: '--rs-text-inverse',
  danger: '--rs-danger',
  dangerContainer: '--rs-danger-container',
  onDangerContainer: '--rs-on-danger-container',
  success: '--rs-success',
  successContainer: '--rs-success-container',
  onSuccessContainer: '--rs-on-success-container',
  warning: '--rs-warning',
  warningContainer: '--rs-warning-container',
  onWarningContainer: '--rs-on-warning-container',
  info: '--rs-info',
  infoContainer: '--rs-info-container',
  onInfoContainer: '--rs-on-info-container',
} as const

export type RsColorThemeToken = keyof typeof RS_COLOR_THEME_VARS

/** 一份可安装的颜色主题。`id` 不翻译；`label` 用英文，宿主自己做语言包。 */
export interface RsColorTheme {
  id: string
  label: string
  uiTheme: RsResolvedTheme
  colors: Partial<Record<RsColorThemeToken, string>>
}

const THEME_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const appliedVars = new WeakMap<HTMLElement, Set<string>>()

function themeTarget(el?: HTMLElement | null): HTMLElement | null {
  if (el) return el
  if (typeof document === 'undefined') return null
  return document.documentElement
}

/** 拒绝能逃出自定义属性、注入样式或外链的值。允许 hex、函数色和 var()。 */
export function isSafeColorThemeValue(value: string): boolean {
  const raw = value.trim()
  if (!raw || raw.length > 240) return false
  if (/[;{}<>]|url\s*\(|expression\s*\(|@import|\/\*|\*\//i.test(raw)) return false
  return true
}

export function isSafeColorThemeId(id: string): boolean {
  return THEME_ID.test(id)
}

/**
 * 把主题包写到元素的内联 `--rs-*` 上，盖过 styles.css 与 brand.css。
 * 未列出的字段保持样式表原值。非法 id 或没有目标元素时不改 DOM。
 */
export function applyColorTheme(theme: RsColorTheme, el?: HTMLElement | null): boolean {
  const target = themeTarget(el)
  if (!target || !isSafeColorThemeId(theme.id)) return false

  const previous = appliedVars.get(target) ?? new Set<string>()
  const next = new Set<string>()
  for (const key of Object.keys(RS_COLOR_THEME_VARS) as RsColorThemeToken[]) {
    const value = theme.colors[key]
    if (value == null) continue
    const raw = String(value).trim()
    if (!isSafeColorThemeValue(raw)) continue
    const prop = RS_COLOR_THEME_VARS[key]
    target.style.setProperty(prop, raw)
    next.add(prop)
  }
  for (const prop of previous) {
    if (!next.has(prop)) target.style.removeProperty(prop)
  }
  appliedVars.set(target, next)
  target.setAttribute(colorThemeAttribute, theme.id)
  return true
}

/** 去掉该元素上由颜色主题写上的变量，回到样式表。 */
export function clearColorTheme(el?: HTMLElement | null): void {
  const target = themeTarget(el)
  if (!target) return
  const previous = appliedVars.get(target)
  if (previous) {
    for (const prop of previous) target.style.removeProperty(prop)
    appliedVars.delete(target)
  }
  target.removeAttribute(colorThemeAttribute)
}
