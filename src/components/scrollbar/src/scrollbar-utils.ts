export const RS_SCROLLBAR_TYPES = ['auto', 'always', 'scroll', 'hover'] as const

export type RsScrollbarType = (typeof RS_SCROLLBAR_TYPES)[number]

export const RS_SCROLLBAR_ORIENTATIONS = ['vertical', 'horizontal', 'both'] as const

export type RsScrollbarOrientation = (typeof RS_SCROLLBAR_ORIENTATIONS)[number]

export type RsScrollbarAxis = 'x' | 'y'

export interface RsScrollbarSizes {
  content: number
  viewport: number
  scrollbar: {
    size: number
    paddingStart: number
    paddingEnd: number
  }
}

const MIN_THUMB_PX = 18

export function isRsScrollbarType(value: unknown): value is RsScrollbarType {
  return typeof value === 'string' && (RS_SCROLLBAR_TYPES as readonly string[]).includes(value)
}

export function isRsScrollbarOrientation(value: unknown): value is RsScrollbarOrientation {
  return typeof value === 'string' && (RS_SCROLLBAR_ORIENTATIONS as readonly string[]).includes(value)
}

export function resolveRsScrollbarType(type?: RsScrollbarType | null): RsScrollbarType {
  return isRsScrollbarType(type) ? type : 'hover'
}

export function resolveRsScrollbarOrientation(
  orientation?: RsScrollbarOrientation | null,
): RsScrollbarOrientation {
  return isRsScrollbarOrientation(orientation) ? orientation : 'both'
}

export function resolveScrollbarSize(size: number | string | undefined): string | undefined {
  if (size === undefined) {
    return undefined
  }
  return typeof size === 'number' ? `${size}px` : size
}

export function showsRsScrollbarAxis(
  orientation: RsScrollbarOrientation | undefined,
  axis: RsScrollbarAxis,
): boolean {
  if (orientation === 'both') return true
  return axis === 'y' ? orientation === 'vertical' : orientation === 'horizontal'
}

export function isRsScrollbarOverflow(viewport: number, content: number): boolean {
  return content > viewport + 1
}

export function isRsScrollbarBarVisible(input: {
  type: RsScrollbarType
  overflowing: boolean
  hovering: boolean
  scrolling: boolean
  interacting?: boolean
}): boolean {
  if (input.type === 'always') return true
  if (!input.overflowing) return false
  if (input.type === 'auto') return true
  if (input.type === 'hover') return input.hovering
  return input.scrolling || Boolean(input.interacting)
}

export function getThumbRatio(viewportSize: number, contentSize: number): number {
  if (contentSize <= 0) return 0
  const ratio = viewportSize / contentSize
  return Number.isFinite(ratio) ? ratio : 0
}

export function getThumbSize(sizes: RsScrollbarSizes): number {
  const ratio = getThumbRatio(sizes.viewport, sizes.content)
  const padding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd
  const thumbSize = (sizes.scrollbar.size - padding) * ratio
  return Math.max(thumbSize, MIN_THUMB_PX)
}

export function clampRsNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function linearScale(input: readonly [number, number], output: readonly [number, number]) {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0]
    const ratio = (output[1] - output[0]) / (input[1] - input[0])
    return output[0] + ratio * (value - input[0])
  }
}

export function getThumbOffsetFromScroll(
  scrollPos: number,
  sizes: RsScrollbarSizes,
  dir: 'ltr' | 'rtl' = 'ltr',
): number {
  const thumbSizePx = getThumbSize(sizes)
  const padding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd
  const track = sizes.scrollbar.size - padding
  const maxScrollPos = sizes.content - sizes.viewport
  const maxThumbPos = track - thumbSizePx
  if (maxScrollPos <= 0 || maxThumbPos <= 0) return 0
  const range: [number, number] = dir === 'ltr' ? [0, maxScrollPos] : [maxScrollPos * -1, 0]
  const interpolate = linearScale([0, maxScrollPos], [0, maxThumbPos])
  return interpolate(clampRsNumber(scrollPos, range[0], range[1]))
}

export function getScrollPositionFromPointer(
  pointerPos: number,
  pointerOffset: number,
  sizes: RsScrollbarSizes,
  dir: 'ltr' | 'rtl' = 'ltr',
): number {
  const thumbSizePx = getThumbSize(sizes)
  const thumbCenter = thumbSizePx / 2
  const offset = pointerOffset || thumbCenter
  const thumbOffsetFromEnd = thumbSizePx - offset
  const minPointerPos = sizes.scrollbar.paddingStart + offset
  const maxPointerPos = sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd
  const maxScrollPos = sizes.content - sizes.viewport
  const scrollRange: [number, number] = dir === 'ltr' ? [0, maxScrollPos] : [maxScrollPos * -1, 0]
  const interpolate = linearScale([minPointerPos, maxPointerPos], scrollRange)
  return interpolate(pointerPos)
}

export function toCssInt(value?: string): number {
  return value ? Number.parseInt(value, 10) || 0 : 0
}

export function isScrollingWithinScrollbarBounds(scrollPos: number, maxScrollPos: number): boolean {
  return scrollPos > 0 && scrollPos < maxScrollPos
}
