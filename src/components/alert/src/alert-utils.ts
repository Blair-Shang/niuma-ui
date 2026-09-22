import type { RsComponentSize } from '../../../theme/types'

/** 与 RsFeedbackTone 同一套色相。历史 prop 名是 type，新代码用 tone。 */
export type RsAlertTone = 'default' | 'info' | 'success' | 'warning' | 'danger'

/** 形态轴：浅底 / 描边 / 实心。色相走 tone，不要用 variant 表示危险。 */
export type RsAlertVariant = 'soft' | 'outline' | 'solid'

/** 密度。ssm 落到 sm，避免提示条做成控件极小档。 */
export type RsAlertSize = 'sm' | 'md' | 'lg'

export type RsAlertRole = 'alert' | 'status'

export interface RsAlertExpose {
  /** 焦点落到关闭钮；没有关闭钮时落到根节点。 */
  focus: () => void
}

export type RsAlertInstance = RsAlertExpose & { $el: HTMLElement }

export const RS_ALERT_TONES = ['default', 'info', 'success', 'warning', 'danger'] as const

export const RS_ALERT_VARIANTS = ['soft', 'outline', 'solid'] as const

export const RS_ALERT_SIZES = ['sm', 'md', 'lg'] as const

export const RS_ALERT_DEFAULT_TONE: RsAlertTone = 'info'

export const RS_ALERT_DEFAULT_VARIANT: RsAlertVariant = 'soft'

export const RS_ALERT_DEFAULT_SIZE: RsAlertSize = 'md'

const ALERT_ICONS: Record<RsAlertTone, string> = {
  default: 'info',
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
}

export function isRsAlertTone(value: unknown): value is RsAlertTone {
  return typeof value === 'string' && (RS_ALERT_TONES as readonly string[]).includes(value)
}

export function isRsAlertVariant(value: unknown): value is RsAlertVariant {
  return typeof value === 'string' && (RS_ALERT_VARIANTS as readonly string[]).includes(value)
}

export function isRsAlertSize(value: unknown): value is RsAlertSize {
  return typeof value === 'string' && (RS_ALERT_SIZES as readonly string[]).includes(value)
}

/**
 * tone 优先，type 是兼容别名。两边都无效时回落 info（与旧默认一致）。
 */
export function resolveAlertTone(
  tone?: string | null,
  type?: string | null,
): RsAlertTone {
  if (isRsAlertTone(tone)) return tone
  if (isRsAlertTone(type)) return type
  return RS_ALERT_DEFAULT_TONE
}

export function resolveAlertVariant(variant?: string | null): RsAlertVariant {
  return isRsAlertVariant(variant) ? variant : RS_ALERT_DEFAULT_VARIANT
}

/** 未传或非法落到 md；ssm 并到 sm。 */
export function resolveAlertSize(size?: RsComponentSize | RsAlertSize | null): RsAlertSize {
  if (size === 'ssm' || size === 'sm') return 'sm'
  if (isRsAlertSize(size)) return size
  return RS_ALERT_DEFAULT_SIZE
}

export function resolveAlertIcon(tone: RsAlertTone): string {
  return ALERT_ICONS[tone]
}

/** 警告 / 错误用 alert（断言）；信息 / 成功 / 中性用 status，避免进页就打断读屏。 */
export function resolveAlertRole(tone: RsAlertTone): RsAlertRole {
  return tone === 'warning' || tone === 'danger' ? 'alert' : 'status'
}

export function shouldShowAlertIcon(showIcon: boolean, hasIconSlot: boolean): boolean {
  return hasIconSlot || showIcon
}

export function hasAlertTitle(title?: string | null, hasTitleSlot = false): boolean {
  return hasTitleSlot || Boolean(title)
}

export function hasAlertDescription(
  description?: string | null,
  hasDefaultSlot = false,
): boolean {
  return hasDefaultSlot || Boolean(description)
}
