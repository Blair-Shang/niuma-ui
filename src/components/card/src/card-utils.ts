/**
 * 卡片表面风格。
 * - grouped / plain / glass：偏 macOS 分层与仪表盘
 * - outlined / filled：偏 Material 3，后台信息面板常用 outlined
 */
export const RS_CARD_VARIANTS = ['grouped', 'plain', 'outlined', 'filled', 'glass'] as const

export type RsCardVariant = (typeof RS_CARD_VARIANTS)[number]

/**
 * 卡片密度（疏密），映射 header/body padding 与标题字号。
 * 与控件 RsComponentSize（高度）无关，勿混用。
 */
export const RS_CARD_SIZES = ['sm', 'md', 'lg'] as const

export type RsCardSize = (typeof RS_CARD_SIZES)[number]

export function isRsCardVariant(value: unknown): value is RsCardVariant {
  return typeof value === 'string' && (RS_CARD_VARIANTS as readonly string[]).includes(value)
}

export function isRsCardSize(value: unknown): value is RsCardSize {
  return typeof value === 'string' && (RS_CARD_SIZES as readonly string[]).includes(value)
}

export function resolveRsCardVariant(variant?: RsCardVariant | null): RsCardVariant {
  return isRsCardVariant(variant) ? variant : 'grouped'
}

export function resolveRsCardSize(size?: RsCardSize | null): RsCardSize {
  return isRsCardSize(size) ? size : 'md'
}

/** 根标签。空串回退 section。不限制自定义元素名。 */
export function resolveRsCardAs(as?: string | null): string {
  const tag = as?.trim()
  return tag || 'section'
}

export function hasRsCardHeader(input: {
  title?: string | null
  description?: string | null
  header?: boolean
  actions?: boolean
}): boolean {
  return Boolean(input.title || input.description || input.header || input.actions)
}
