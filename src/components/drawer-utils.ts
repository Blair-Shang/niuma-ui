import {
  resolveDialogOverlayStyle,
  runRsDialogBeforeClose,
  type RsDialogBeforeClose,
  type RsDialogCloseReason,
} from './dialog-utils'

/** 抽屉滑出方向 */
export type RsDrawerSide = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉尺寸预设（左右为宽度，上下为高度） */
export type RsDrawerSize = 'sm' | 'md' | 'lg' | 'full'

/**
 * 自定义面板尺寸：number 按 px；string 原样写入 CSS（如 `24rem` / `40%`）。
 * 与 size 同时传入时，自定义尺寸优先。
 */
export type RsDrawerDimension = number | string

/** 关闭来源，与 Dialog 共用语义，便于业务统一 beforeClose */
export type RsDrawerCloseReason = RsDialogCloseReason

/** 关闭前钩子：返回 false 阻止关闭；支持异步 */
export type RsDrawerBeforeClose = RsDialogBeforeClose

const SIZE_INLINE: Record<Exclude<RsDrawerSize, 'full'>, string> = {
  sm: '20rem',
  md: '28rem',
  lg: '36rem',
}

/** 将 size 预设解析为 CSS 长度（full 由样式类处理） */
export function resolveRsDrawerSizeCss(size: RsDrawerSize): string | undefined {
  if (size === 'full') return undefined
  return SIZE_INLINE[size]
}

/** 将自定义 width/height 规范为 CSS 长度 */
export function resolveRsDrawerDimensionCss(value: RsDrawerDimension | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return undefined
    return `${value}px`
  }
  const trimmed = String(value).trim()
  return trimmed || undefined
}

export function runRsDrawerBeforeClose(
  beforeClose: RsDrawerBeforeClose | undefined,
  reason: RsDrawerCloseReason,
): Promise<boolean> {
  return runRsDialogBeforeClose(beforeClose, reason)
}

/**
 * 遮罩样式：复用 Dialog 的 opacity/blur 解析，写入抽屉专用 CSS 变量。
 */
export function resolveDrawerOverlayStyle(options?: {
  overlayOpacity?: number
  overlayBlur?: number | string
}): Record<string, string> | undefined {
  const dialogStyle = resolveDialogOverlayStyle(options)
  if (!dialogStyle) return undefined
  const style: Record<string, string> = {}
  if (dialogStyle['--rs-dialog-overlay-bg']) {
    style['--rs-drawer-overlay-bg'] = dialogStyle['--rs-dialog-overlay-bg']
  }
  if (dialogStyle['--rs-dialog-overlay-blur']) {
    style['--rs-drawer-overlay-blur'] = dialogStyle['--rs-dialog-overlay-blur']
  }
  return Object.keys(style).length ? style : undefined
}
