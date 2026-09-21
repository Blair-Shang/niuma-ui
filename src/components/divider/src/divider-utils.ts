export const RS_DIVIDER_ORIENTATIONS = ['horizontal', 'vertical'] as const

export type RsDividerOrientation = (typeof RS_DIVIDER_ORIENTATIONS)[number]

export function isRsDividerOrientation(value: unknown): value is RsDividerOrientation {
  return typeof value === 'string' && (RS_DIVIDER_ORIENTATIONS as readonly string[]).includes(value)
}

export function resolveRsDividerOrientation(
  orientation?: RsDividerOrientation | null,
): RsDividerOrientation {
  return isRsDividerOrientation(orientation) ? orientation : 'horizontal'
}
