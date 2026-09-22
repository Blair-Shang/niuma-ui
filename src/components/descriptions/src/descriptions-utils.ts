import type { InjectionKey } from 'vue'
import type { RsComponentSize } from '../../../theme/types'

/** Descriptions 尺寸与全局控件尺寸对齐：ssm / sm / md / lg */
export type RsDescriptionsSize = RsComponentSize

export type RsDescriptionsLabelPlacement = 'left' | 'top'

/** 标签对齐走书写方向，RTL 下 start / end 自动对调。 */
export type RsDescriptionsLabelAlign = 'start' | 'center' | 'end'

export type RsDescriptionsItem = {
  label: string
  value?: string | number | null
  span?: number
  key?: string | number
}

export type RsDescriptionsContext = {
  labelPlacement: RsDescriptionsLabelPlacement
  bordered: boolean
  size: RsDescriptionsSize
  columns: number
  colon: boolean
  colonMark: string
}

export const RS_DESCRIPTIONS_KEY: InjectionKey<RsDescriptionsContext> =
  Symbol('rs-descriptions')

const LABEL_WIDTH_UNSAFE = /[;{}]|url\s*\(/i

/** 列数至少为 1。非数字回退 3，小数向下取整。 */
export function resolveRsDescriptionsColumns(columns: number | undefined): number {
  if (columns === undefined || !Number.isFinite(columns)) return 3
  return Math.max(1, Math.floor(columns))
}

/** span 夹在 1 与列数之间。缺省、0、负数都当成 1。 */
export function clampRsDescriptionsSpan(span: number | undefined, columns: number): number {
  const limit = Math.max(1, columns)
  if (span === undefined || !Number.isFinite(span)) return 1
  return Math.min(Math.max(Math.floor(span), 1), limit)
}

export function resolveRsDescriptionsLabelAlign(
  align: RsDescriptionsLabelAlign | undefined,
): RsDescriptionsLabelAlign {
  if (align === 'center' || align === 'end') return align
  return 'start'
}

/**
 * 标签列宽。数字按 px。空串、负数、含 `;` `{` `}` 或 `url(` 的字符串忽略，
 * 避免写进 CSS 变量时打断声明。
 */
export function resolveRsDescriptionsLabelWidth(
  width: number | string | null | undefined,
): string | undefined {
  if (width === undefined || width === null || width === '') return undefined
  if (typeof width === 'number') {
    if (!Number.isFinite(width) || width < 0) return undefined
    return `${width}px`
  }
  const trimmed = width.trim()
  if (!trimmed || LABEL_WIDTH_UNSAFE.test(trimmed)) return undefined
  return trimmed
}

/**
 * 空值只替换 null / undefined，与原先 `value ?? '—'` 一致。
 * 空字符串和 0 原样显示。
 */
export function resolveRsDescriptionsValue(
  value: string | number | null | undefined,
  emptyText: string,
): string {
  if (value === null || value === undefined) return emptyText
  return String(value)
}
