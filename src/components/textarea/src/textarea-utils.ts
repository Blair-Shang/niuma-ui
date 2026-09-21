export const RS_TEXTAREA_RESIZES = ['none', 'horizontal', 'vertical', 'both'] as const

export type RsTextareaResize = (typeof RS_TEXTAREA_RESIZES)[number]

/**
 * 自适应高度。true 从 rows 起往下长；对象可锁 minRows / maxRows。
 * 对齐 Ant Design autoSize、Element Plus autosize。
 */
export type RsTextareaAutosize = boolean | { minRows?: number; maxRows?: number }

export function isRsTextareaResize(value: unknown): value is RsTextareaResize {
  return typeof value === 'string' && (RS_TEXTAREA_RESIZES as readonly string[]).includes(value)
}

export function isRsTextareaAutosizeEnabled(autosize?: RsTextareaAutosize | null): boolean {
  return autosize === true || (typeof autosize === 'object' && autosize != null)
}

export function resolveRsTextareaAutosizeSpec(
  autosize?: RsTextareaAutosize | null,
): { minRows?: number; maxRows?: number } {
  return typeof autosize === 'object' && autosize ? autosize : {}
}

export function resolveRsTextareaDisplayRows(
  autosize?: RsTextareaAutosize | null,
  rows = 3,
): number {
  return resolveRsTextareaAutosizeSpec(autosize).minRows ?? rows
}

/** autosize 开启时强制 none，与 Element Plus 一致。 */
export function resolveRsTextareaResize(
  resize?: RsTextareaResize | null,
  autosize?: RsTextareaAutosize | null,
): RsTextareaResize {
  if (isRsTextareaAutosizeEnabled(autosize)) return 'none'
  return isRsTextareaResize(resize) ? resize : 'vertical'
}

export function parseTextareaLineHeight(el: HTMLTextAreaElement): number {
  const style = getComputedStyle(el)
  const lh = Number.parseFloat(style.lineHeight)
  if (Number.isFinite(lh) && lh > 0) return lh
  const fs = Number.parseFloat(style.fontSize) || 14
  return fs * 1.5
}

export function textareaAutosizePadding(el: HTMLTextAreaElement): number {
  const style = getComputedStyle(el)
  const pad = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
  if (style.boxSizing !== 'border-box') return 0
  const border =
    Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
  return (Number.isFinite(pad) ? pad : 0) + (Number.isFinite(border) ? border : 0)
}

/** 写入或清掉 autosize 高度。el 已卸载时直接返回。 */
export function applyTextareaAutosize(
  el: HTMLTextAreaElement | null,
  options: { enabled: boolean; minRows: number; maxRows?: number },
): void {
  if (!el) return
  if (!options.enabled) {
    el.style.height = ''
    el.style.overflowY = ''
    return
  }
  el.style.height = 'auto'
  el.style.overflowY = 'hidden'
  const lineHeight = parseTextareaLineHeight(el)
  const extra = textareaAutosizePadding(el)
  const min = lineHeight * options.minRows + extra
  const max = options.maxRows != null ? lineHeight * options.maxRows + extra : undefined
  let height = el.scrollHeight
  if (height < min) height = min
  if (max != null && height > max) {
    height = max
    el.style.overflowY = 'auto'
  }
  el.style.height = `${height}px`
}
