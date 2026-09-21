/**
 * RsTag 语义色。只有色相、没有形态轴，不另开 tone。
 * 可增删的一组标签请用 RsDynamicTags。
 */
export const RS_TAG_VARIANTS = ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const

export type RsTagVariant = (typeof RS_TAG_VARIANTS)[number]

export function isRsTagVariant(value: unknown): value is RsTagVariant {
  return typeof value === 'string' && (RS_TAG_VARIANTS as readonly string[]).includes(value)
}

export function resolveRsTagVariant(variant?: RsTagVariant | null): RsTagVariant {
  return isRsTagVariant(variant) ? variant : 'default'
}
