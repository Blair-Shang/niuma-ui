/**
 * RsBadge 语义色。芯片与角标共用同一套 variant，不另开 tone 轴。
 * 可关闭的筛选请用 RsTag，不要用本组件冒充标签。
 */
export const RS_BADGE_VARIANTS = ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const

export type RsBadgeVariant = (typeof RS_BADGE_VARIANTS)[number]

export const RS_BADGE_COUNT_MAX_DEFAULT = 99

export function isRsBadgeVariant(value: unknown): value is RsBadgeVariant {
  return typeof value === 'string' && (RS_BADGE_VARIANTS as readonly string[]).includes(value)
}

export function resolveRsBadgeVariant(variant?: RsBadgeVariant | null): RsBadgeVariant {
  return isRsBadgeVariant(variant) ? variant : 'default'
}

/** 未传 count、非有限数字、负数、或 0 且未 showZero 时不展示数字。 */
export function formatRsBadgeCount(
  count: number | string | null | undefined,
  max = RS_BADGE_COUNT_MAX_DEFAULT,
  showZero = false,
): string | null {
  if (count == null || count === '') return null
  const n = typeof count === 'number' ? count : Number(count)
  if (!Number.isFinite(n) || n < 0) return null
  if (n === 0 && !showZero) return null
  const cap = Number.isFinite(max) && max > 0 ? Math.floor(max) : RS_BADGE_COUNT_MAX_DEFAULT
  const value = Math.floor(n)
  if (value > cap) return `${cap}+`
  return String(value)
}
