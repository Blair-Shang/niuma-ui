import type { RsFontSize, RsFontWeight } from '../../../theme/types'
import { RS_FONT_SIZE_CSS, RS_FONT_WEIGHT_CSS } from '../../../theme/types'

/**
 * 表单分组密度。只影响内边距与组内间距，不改变控件高度。
 */
export type RsFieldsetSize = 'sm' | 'md'

/**
 * 边框线型。对齐 CSS `border-style`（solid / dashed / dotted）。
 */
export type RsFieldsetBorderStyle = 'solid' | 'dashed' | 'dotted'

/**
 * 边框浓度。
 * - default：主题分隔线
 * - subtle：弱分隔
 * - faded：虚化（降低不透明度）
 */
export type RsFieldsetBorderTone = 'default' | 'subtle' | 'faded'

/**
 * 标题对比（清晰度）。
 * - strong：最高对比
 * - default：正文色
 * - muted：次要说明色
 */
export type RsFieldsetTitleTone = 'strong' | 'default' | 'muted'

/** 分组标题字号，只开放 caption / 次要 / 正文三档。 */
export type RsFieldsetTitleSize = Extract<RsFontSize, 'xs' | 'sm' | 'base'>

/** 解析标题字号 token。 */
export function resolveFieldsetTitleSize(size: RsFieldsetTitleSize): string {
  return RS_FONT_SIZE_CSS[size]
}

/** 解析标题字重 token。 */
export function resolveFieldsetTitleWeight(weight: RsFontWeight): string {
  return RS_FONT_WEIGHT_CSS[weight]
}

/** tooltip 优先；弃用的 description 仍映射到同一 tip。 */
export function resolveFieldsetTooltip(
  tooltip: string | undefined,
  description: string | undefined,
): string {
  return (tooltip || description || '').trim()
}

/** 显式 invalid，或有错误文案 / #error，都算组级失败。 */
export function resolveFieldsetInvalid(
  invalid: boolean,
  error: string | undefined,
  hasErrorSlot: boolean,
): boolean {
  return Boolean(invalid || error?.trim() || hasErrorSlot)
}
