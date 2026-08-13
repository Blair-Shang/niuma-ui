export type RsThemeMode = 'dark' | 'light'

/**
 * 控件尺寸（由小到大）：
 * - ssm：极小
 * - sm：小号
 * - md：中号（默认）
 * - lg：大号
 *
 * 高度由 `--rs-control-height-*` 统一控制，业务侧勿用 :deep 覆盖。
 */
export type RsComponentSize = 'ssm' | 'sm' | 'md' | 'lg'

export const RS_COMPONENT_SIZES: readonly RsComponentSize[] = ['ssm', 'sm', 'md', 'lg']

/** 各档控件图标默认像素边长。 */
export const RS_COMPONENT_SIZE_ICON_PX: Record<RsComponentSize, number> = {
  ssm: 12,
  sm: 14,
  md: 16,
  lg: 18,
}

/**
 * 圆角档位（由小到大）：
 * - none：直角（无圆角）
 * - xs / sm / md / lg：对应 `--rs-radius-*`
 * - full：胶囊 / 圆形
 *
 * 业务侧用组件 `radius` / `iconRadius` 等 prop，勿 :deep 改 border-radius。
 */
export type RsRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'full'

export const RS_RADII: readonly RsRadius[] = ['none', 'xs', 'sm', 'md', 'lg', 'full']

/** 各档圆角对应的 CSS 值（可直接赋给 border-radius / CSS 变量）。 */
export const RS_RADIUS_CSS: Record<RsRadius, string> = {
  none: '0',
  xs: 'var(--rs-radius-xs)',
  sm: 'var(--rs-radius-sm)',
  md: 'var(--rs-radius)',
  lg: 'var(--rs-radius-lg)',
  full: 'var(--rs-radius-full)',
}

/**
 * 字号档位（由小到大）：
 * - xs：Caption / 辅助
 * - sm：次要正文
 * - base：正文（默认）
 * - lg：强调正文
 * - xl：小标题
 * - 2xl：标题
 * - 3xl：展示级标题
 *
 * 对应 `--rs-font-size-*`；业务侧优先用 token，勿硬编码 px。
 */
export type RsFontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'

export const RS_FONT_SIZES: readonly RsFontSize[] = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
]

/** 各档字号对应的 CSS 值。 */
export const RS_FONT_SIZE_CSS: Record<RsFontSize, string> = {
  xs: 'var(--rs-font-size-xs)',
  sm: 'var(--rs-font-size-sm)',
  base: 'var(--rs-font-size-base)',
  lg: 'var(--rs-font-size-lg)',
  xl: 'var(--rs-font-size-xl)',
  '2xl': 'var(--rs-font-size-2xl)',
  '3xl': 'var(--rs-font-size-3xl)',
}

/**
 * 字重档位：
 * - regular：正文
 * - medium：标签 / 弱强调
 * - semibold：标题 / 表头
 * - bold：强强调
 */
export type RsFontWeight = 'regular' | 'medium' | 'semibold' | 'bold'

export const RS_FONT_WEIGHTS: readonly RsFontWeight[] = [
  'regular',
  'medium',
  'semibold',
  'bold',
]

/** 各档字重对应的 CSS 值。 */
export const RS_FONT_WEIGHT_CSS: Record<RsFontWeight, string> = {
  regular: 'var(--rs-font-weight-regular)',
  medium: 'var(--rs-font-weight-medium)',
  semibold: 'var(--rs-font-weight-semibold)',
  bold: 'var(--rs-font-weight-bold)',
}

/**
 * 设计 token
 * 色彩语义：Google MD3 容器色 + 字节 Arco 中性色 + 国际 SaaS 功能色
 * 文字语义：Ant / Arco 四级（primary / secondary / tertiary / disabled）+ link / inverse
 */
export interface RsThemeTokens {
  primary: string
  primaryHover: string
  primaryForeground: string
  primaryContainer: string
  onPrimaryContainer: string
  bg: string
  surface: string
  surfaceElevated: string
  surfaceHover: string
  inputBg: string
  border: string
  borderSubtle: string
  /** 主文案（与 --rs-text / --rs-text-primary 同步） */
  text: string
  /** 次要文案（与 --rs-muted / --rs-text-secondary 同步） */
  muted: string
  /** 占位 / 三级文案（与 --rs-placeholder / --rs-text-tertiary 同步） */
  placeholder: string
  /** 禁用文案（与 --rs-text-disabled 同步） */
  textDisabled: string
  /** 反色文案，用于主色 / 深色底（与 --rs-text-inverse 同步） */
  textInverse: string
  danger: string
  dangerContainer: string
  onDangerContainer: string
  success: string
  successContainer: string
  onSuccessContainer: string
  warning: string
  warningContainer: string
  onWarningContainer: string
  info: string
  infoContainer: string
  onInfoContainer: string
  focusRing: string
}

export const themeAttribute = 'data-rs-theme'
