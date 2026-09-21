export const RS_CONTAINER_BREAKPOINTS = ['sm', 'md', 'lg', 'xl'] as const

export type RsContainerBreakpoint = (typeof RS_CONTAINER_BREAKPOINTS)[number]

export const RS_CONTAINER_MAX_WIDTHS = ['sm', 'md', 'lg', 'xl', 'full'] as const

export type RsContainerMaxWidth = (typeof RS_CONTAINER_MAX_WIDTHS)[number]

export const RS_CONTAINER_PADDINGS = ['none', 'sm', 'md', 'lg'] as const

export type RsContainerPadding = (typeof RS_CONTAINER_PADDINGS)[number]

export const RS_CONTAINER_GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const

export type RsContainerGap = (typeof RS_CONTAINER_GAPS)[number]

export type RsContainerResponsive<T> = Partial<Record<RsContainerBreakpoint, T>>

export type RsContainerMaybeResponsive<T> = T | RsContainerResponsive<T>

export const RS_CONTAINER_SPACE_CSS: Record<RsContainerGap | RsContainerPadding, string> = {
  none: '0',
  xs: 'var(--rs-space-xs)',
  sm: 'var(--rs-space-sm)',
  md: 'var(--rs-space-md)',
  lg: 'var(--rs-space-lg)',
  xl: 'var(--rs-space-xl)',
}

export const RS_CONTAINER_MAX_WIDTH_CSS: Record<RsContainerMaxWidth, string> = {
  sm: 'var(--rs-container-max-sm)',
  md: 'var(--rs-container-max-md)',
  lg: 'var(--rs-container-max-lg)',
  xl: 'var(--rs-container-max-xl)',
  full: 'var(--rs-container-max-full)',
}

export function isRsContainerResponsive<T>(
  value: RsContainerMaybeResponsive<T>,
): value is RsContainerResponsive<T> {
  return typeof value === 'object' && value !== null
}

export interface RsContainerStyleInput {
  maxWidth: RsContainerMaybeResponsive<RsContainerMaxWidth>
  padding: RsContainerMaybeResponsive<RsContainerPadding>
  fluid: boolean
  grid: boolean
  columns: RsContainerMaybeResponsive<number>
  gap: RsContainerMaybeResponsive<RsContainerGap>
}

function writeResponsiveVars<T>(
  style: Record<string, string | number>,
  prefix: string,
  value: RsContainerMaybeResponsive<T>,
  toCss: (item: T) => string | number | undefined,
): void {
  if (isRsContainerResponsive(value)) {
    for (const bp of RS_CONTAINER_BREAKPOINTS) {
      const item = value[bp]
      if (item === undefined) continue
      const css = toCss(item)
      if (css !== undefined) style[`${prefix}-${bp}`] = css
    }
    return
  }
  const css = toCss(value)
  if (css !== undefined) style[`${prefix}-current`] = css
}

/** 写入根节点的 CSS 变量。语义与原先 SFC 内联计算一致。 */
export function resolveRsContainerStyle(input: RsContainerStyleInput): Record<string, string | number> {
  const style: Record<string, string | number> = {}

  if (input.fluid) {
    style['--rs-container-max-current'] = 'none'
  } else {
    writeResponsiveVars(style, '--rs-container-max', input.maxWidth, (item) => RS_CONTAINER_MAX_WIDTH_CSS[item])
  }

  writeResponsiveVars(style, '--rs-container-padding', input.padding, (item) => RS_CONTAINER_SPACE_CSS[item])

  if (!input.grid) return style

  writeResponsiveVars(style, '--rs-container-columns', input.columns, (item) =>
    typeof item === 'number' ? item : undefined,
  )
  writeResponsiveVars(style, '--rs-container-gap', input.gap, (item) => RS_CONTAINER_SPACE_CSS[item])

  return style
}
