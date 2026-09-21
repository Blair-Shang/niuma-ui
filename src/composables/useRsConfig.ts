import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import {
  interpolateRsMessage,
  resolveRsTranslateArgs,
  type RsTranslateFn,
} from '../locale/interpolate'
import { resolveRsMessage } from '../locale/registry'
import { resolveHostLocale } from '../locale/resolve-host'
import { type RsDirMode, type RsLocale } from '../locale/types'
import { resolveThemeMode } from '../theme/apply'
import type { RsComponentSize, RsRadius, RsResolvedTheme, RsThemeMode } from '../theme/types'

export interface RsConfigContext {
  /** 用户偏好：light / dark / system */
  theme: Ref<RsThemeMode>
  /** 已解析的明暗，跟着 applyTheme 与系统偏好更新 */
  resolvedTheme: Ref<RsResolvedTheme>
  locale: Ref<RsLocale>
  /** 书写方向偏好：ltr / rtl / auto（跟 locale） */
  dir: Ref<RsDirMode>
  /** 全局默认控件尺寸（ssm / sm / md / lg）。 */
  controlSize: Ref<RsComponentSize>
  /**
   * 全局默认圆角。未设置时各组件保留自身默认档（如按钮 full、输入 sm）。
   * 设为 `none` 可整站直角风格。
   */
  controlRadius: Ref<RsRadius | undefined>
  setTheme: (mode: RsThemeMode) => void
  setLocale: (locale: RsLocale) => void
  setDir: (dir: RsDirMode) => void
  setControlSize: (size: RsComponentSize) => void
  setControlRadius: (radius: RsRadius | undefined) => void
  /** 系统偏好变化或 applyTheme 之后同步 resolvedTheme */
  syncResolvedTheme: () => void
  t: RsTranslateFn
}

export const rsConfigKey: InjectionKey<RsConfigContext> = Symbol('rs-config')

export function useRsConfig(): RsConfigContext {
  const ctx = inject(rsConfigKey)
  if (!ctx) {
    throw new Error('useRsConfig() must be used within RsConfigProvider')
  }
  return ctx
}

/** 可选读取；组件在 Provider 外也可独立使用。 */
export function useRsConfigOptional(): RsConfigContext | null {
  return inject(rsConfigKey, null)
}

export function createRsConfigState(
  initialTheme: RsThemeMode = 'light',
  initialLocale: RsLocale = resolveHostLocale(),
  initialControlSize: RsComponentSize = 'md',
  initialControlRadius?: RsRadius,
  initialDir: RsDirMode = 'auto',
): RsConfigContext {
  const theme = ref<RsThemeMode>(initialTheme)
  const resolvedTheme = ref<RsResolvedTheme>(resolveThemeMode(initialTheme))
  const locale = ref<RsLocale>(initialLocale)
  const dir = ref<RsDirMode>(initialDir)
  const controlSize = ref<RsComponentSize>(initialControlSize)
  const controlRadius = ref<RsRadius | undefined>(initialControlRadius)

  function setTheme(mode: RsThemeMode) {
    theme.value = mode
    resolvedTheme.value = resolveThemeMode(mode)
  }

  function syncResolvedTheme() {
    resolvedTheme.value = resolveThemeMode(theme.value)
  }

  function setLocale(next: RsLocale) {
    locale.value = next
  }

  function setDir(next: RsDirMode) {
    dir.value = next
  }

  function setControlSize(size: RsComponentSize) {
    controlSize.value = size
  }

  function setControlRadius(radius: RsRadius | undefined) {
    controlRadius.value = radius
  }

  const t: RsTranslateFn = (key, fallbackOrVars, vars) => {
    const parsed = resolveRsTranslateArgs(fallbackOrVars, vars)
    const raw = resolveRsMessage(locale.value, key) ?? parsed.fallback ?? key
    return interpolateRsMessage(raw, parsed.vars, locale.value)
  }

  return {
    theme,
    resolvedTheme,
    locale,
    dir,
    controlSize,
    controlRadius,
    setTheme,
    setLocale,
    setDir,
    setControlSize,
    setControlRadius,
    syncResolvedTheme,
    t,
  }
}

export function provideRsConfig(ctx: RsConfigContext) {
  provide(rsConfigKey, ctx)
}
