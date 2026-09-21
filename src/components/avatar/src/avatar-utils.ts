/** 头像边长。不是控件四档，没有 ssm。 */
export const RS_AVATAR_SIZES = ['sm', 'md', 'lg'] as const

export type RsAvatarSize = (typeof RS_AVATAR_SIZES)[number]

export const RS_AVATAR_SHAPES = ['circle', 'square'] as const

export type RsAvatarShape = (typeof RS_AVATAR_SHAPES)[number]

export const RS_AVATAR_TONES = ['default', 'primary', 'success', 'warning', 'danger'] as const

export type RsAvatarTone = (typeof RS_AVATAR_TONES)[number]

/** 回退图标边长，跟原来 sm 14 / md 16 / lg 20 一致。 */
export const RS_AVATAR_ICON_PX: Record<RsAvatarSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
}

export function isRsAvatarSize(value: unknown): value is RsAvatarSize {
  return typeof value === 'string' && (RS_AVATAR_SIZES as readonly string[]).includes(value)
}

export function isRsAvatarShape(value: unknown): value is RsAvatarShape {
  return typeof value === 'string' && (RS_AVATAR_SHAPES as readonly string[]).includes(value)
}

export function isRsAvatarTone(value: unknown): value is RsAvatarTone {
  return typeof value === 'string' && (RS_AVATAR_TONES as readonly string[]).includes(value)
}

export function resolveRsAvatarSize(size?: RsAvatarSize | null): RsAvatarSize {
  return isRsAvatarSize(size) ? size : 'md'
}

export function resolveRsAvatarShape(shape?: RsAvatarShape | null): RsAvatarShape {
  return isRsAvatarShape(shape) ? shape : 'circle'
}

export function resolveRsAvatarTone(tone?: RsAvatarTone | null): RsAvatarTone {
  return isRsAvatarTone(tone) ? tone : 'primary'
}

/**
 * 从姓名提取缩写（最多 2 个字符）。
 * 单段取前两字；多段取前两段首字。空串返回空，由组件改走图标。
 */
export function getAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}
