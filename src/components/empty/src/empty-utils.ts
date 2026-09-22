export const RS_EMPTY_PRESETS = ['default', 'simple', 'search'] as const

export type RsEmptyPreset = (typeof RS_EMPTY_PRESETS)[number]

export const RS_EMPTY_SIZES = ['sm', 'md', 'lg'] as const

export type RsEmptySize = (typeof RS_EMPTY_SIZES)[number]

export type RsEmptyLocaleKey = 'empty.description' | 'empty.search'

export function isRsEmptyPreset(value: unknown): value is RsEmptyPreset {
  return typeof value === 'string' && (RS_EMPTY_PRESETS as readonly string[]).includes(value)
}

export function isRsEmptySize(value: unknown): value is RsEmptySize {
  return typeof value === 'string' && (RS_EMPTY_SIZES as readonly string[]).includes(value)
}

export function resolveRsEmptyPreset(preset?: RsEmptyPreset | null): RsEmptyPreset {
  return isRsEmptyPreset(preset) ? preset : 'default'
}

export function resolveRsEmptySize(size?: RsEmptySize | null): RsEmptySize {
  return isRsEmptySize(size) ? size : 'md'
}

export function resolveRsEmptyLocaleKey(preset: RsEmptyPreset): RsEmptyLocaleKey {
  return preset === 'search' ? 'empty.search' : 'empty.description'
}

/** 未传走 locale；显式 `''` 表示隐藏描述。 */
export function resolveRsEmptyDescription(
  description: string | undefined,
  fallback: string,
): string {
  return description ?? fallback
}

export function shouldShowRsEmptyTitle(
  title: string | undefined,
  hasTitleSlot: boolean,
): boolean {
  return hasTitleSlot || Boolean(title)
}

export function shouldShowRsEmptyDescription(
  description: string,
  hasDescriptionSlot: boolean,
): boolean {
  return hasDescriptionSlot || description !== ''
}

export function shouldShowRsEmptyIllustration(options: {
  showImage: boolean
  hasIconSlot: boolean
  hasImageSlot: boolean
}): boolean {
  return options.hasImageSlot || options.hasIconSlot || options.showImage
}

/** `#image` 整图替换；仅 `#icon` 时保留圆形徽章底。 */
export function shouldUseRsEmptyBadgeChrome(
  hasIconSlot: boolean,
  hasImageSlot: boolean,
): boolean {
  return hasIconSlot && !hasImageSlot
}

export function shouldShowRsEmptyRemoteImage(options: {
  image?: string
  failedSrc: string | null
  hasIconSlot: boolean
  hasImageSlot: boolean
}): boolean {
  const src = options.image?.trim()
  if (!src || options.hasIconSlot || options.hasImageSlot) return false
  return src !== options.failedSrc
}

export function resolveRsEmptyImageSizeCss(
  size?: number | string,
): string | undefined {
  if (size == null || size === '') return undefined
  if (typeof size === 'number' && Number.isFinite(size)) return `${size}px`
  const text = String(size).trim()
  return text || undefined
}
