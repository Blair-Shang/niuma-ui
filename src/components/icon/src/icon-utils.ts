import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize } from '../../../theme/types'

export type RsIconFlip = 'horizontal' | 'vertical' | 'both'

/** 数字 px、CSS 长度，或 ssm / sm / md / lg 档位字符串。 */
export type RsIconSize = number | string

/** 与控件档位同一套边长（ssm 12 / sm 14 / md 16 / lg 18）。 */
export function isRsIconSizePreset(size: unknown): size is RsComponentSize {
  return typeof size === 'string' && size in RS_COMPONENT_SIZE_ICON_PX
}

/** CSS 长度（如 `1.5rem`）不走 Lucide 的 size 数字。 */
export function rsIconUsesCssSize(size: RsIconSize | undefined): boolean {
  return typeof size === 'string' && !isRsIconSizePreset(size) && !/^\d+$/.test(size)
}

/** 解析成 Lucide / 自定义 mark 的像素边长；CSS 长度返回 undefined。 */
export function resolveRsIconPixelSize(size: RsIconSize | undefined): number | undefined {
  if (size == null) return RS_COMPONENT_SIZE_ICON_PX.md
  if (rsIconUsesCssSize(size)) return undefined
  if (typeof size === 'number' && Number.isFinite(size)) return size
  if (isRsIconSizePreset(size)) return RS_COMPONENT_SIZE_ICON_PX[size]
  return Number.parseInt(String(size), 10) || RS_COMPONENT_SIZE_ICON_PX.md
}

export function buildRsIconTransform(flip?: RsIconFlip, rotate?: number): string | undefined {
  const transforms: string[] = []
  if (flip === 'horizontal') transforms.push('scaleX(-1)')
  else if (flip === 'vertical') transforms.push('scaleY(-1)')
  else if (flip === 'both') transforms.push('scale(-1)')
  if (rotate) transforms.push(`rotate(${rotate}deg)`)
  return transforms.length ? transforms.join(' ') : undefined
}

export function buildRsIconStyle(options: {
  color?: string
  flip?: RsIconFlip
  rotate?: number
  size?: RsIconSize
}): Record<string, string> | undefined {
  const style: Record<string, string> = {}
  if (options.color) style.color = options.color

  const transform = buildRsIconTransform(options.flip, options.rotate)
  if (transform) style.transform = transform

  if (rsIconUsesCssSize(options.size) && typeof options.size === 'string') {
    style.width = options.size
    style.height = options.size
  }

  return Object.keys(style).length ? style : undefined
}
