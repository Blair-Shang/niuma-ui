/**
 * 浮层 / 模态 z-index 常量，与 `styles.css` 中 `--rs-z-*` token 对齐。
 * 组件样式应使用 `z-index: var(--rs-z-*)`，禁止硬编码层级。
 */

/** 下拉 / Popover / Tooltip 浮层 */
export const RS_Z_DROPDOWN = 'var(--rs-z-dropdown)'

/** Shell 常驻面板（底部 Dock 等），须低于 modal */
export const RS_Z_PANEL = 'var(--rs-z-panel)'

/** 模态对话框 */
export const RS_Z_MODAL = 'var(--rs-z-modal)'

/** 顶栏加载进度条（低于 toast，避免遮挡通知） */
export const RS_Z_LOADING_BAR = 'var(--rs-z-loading-bar)'

/** 全局 Toast */
export const RS_Z_TOAST = 'var(--rs-z-toast)'

/** 反馈语义色调（Dialog 图标等） */
export type RsFeedbackTone = 'default' | 'info' | 'success' | 'warning' | 'danger'

export type RsToastType = 'success' | 'error' | 'info' | 'warning'

export type RsToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'

export const RS_TOAST_DEFAULT_POSITION: RsToastPosition = 'top-center'

/** 多条 Toast 之间的垂直间距（px） */
export const RS_TOAST_DEFAULT_GAP = 4

export const rsToastPositions = [
  'top-center',
  'top-left',
  'top-right',
  'bottom-center',
  'bottom-left',
  'bottom-right',
] as const satisfies readonly RsToastPosition[]

export function rsFeedbackIconClass(tone: RsFeedbackTone): string {
  return `rs-feedback-icon rs-feedback-icon--${tone}`
}

/** 视口内锚点矩形（输入框、插入符等）。 */
export interface RsOverlayAnchorBox {
  top: number
  left: number
  height: number
  width?: number
}

export interface RsOverlayPopupSize {
  width: number
  height: number
}

export interface RsOverlayViewport {
  width: number
  height: number
}

/** 锚点浮层最终盒子。placement 供翻转后的样式钩子使用。 */
export interface RsOverlayBox {
  top: number
  left: number
  width: number
  placement: 'top' | 'bottom'
}

/** 侧向浮层（折叠菜单 flyout 等）。placement 为翻转后的左右。 */
export interface RsSideOverlayBox {
  top: number
  left: number
  width: number
  placement: 'left' | 'right'
}

/**
 * 把浮层贴到锚点：优先下方，视口不够则翻到上方，左右夹进窗口。
 * 对齐 WAI-ARIA APG 浮层惯例与 CSS overflow 避让，不跟某一家组件库的 API。
 */
export function placeAnchoredPopup(
  anchor: RsOverlayAnchorBox,
  popup: RsOverlayPopupSize,
  viewport: RsOverlayViewport,
  gap = 4,
): RsOverlayBox {
  const below = anchor.top + anchor.height + gap
  const above = anchor.top - popup.height - gap
  const placement: 'top' | 'bottom' =
    below + popup.height <= viewport.height || above < gap ? 'bottom' : 'top'
  const top = placement === 'bottom' ? below : Math.max(gap, above)
  const width = Math.min(popup.width, Math.max(0, viewport.width - gap * 2))
  const maxLeft = Math.max(gap, viewport.width - width - gap)
  const left = Math.min(Math.max(gap, anchor.left), maxLeft)
  return { top, left, width, placement }
}

/**
 * 把浮层贴到锚点侧面：默认右侧，视口不够则翻到左侧，上下夹进窗口。
 * 折叠导航 flyout 用；不要在各组件再写一套 left/top。
 */
export function placeSidePopup(
  anchor: RsOverlayAnchorBox,
  popup: RsOverlayPopupSize,
  viewport: RsOverlayViewport,
  gap = 8,
  preferred: 'left' | 'right' = 'right',
): RsSideOverlayBox {
  const anchorWidth = anchor.width ?? 0
  const right = anchor.left + anchorWidth + gap
  const leftPos = anchor.left - popup.width - gap
  const roomRight = right + popup.width <= viewport.width - gap
  const roomLeft = leftPos >= gap
  let placement: 'left' | 'right' = preferred
  if (preferred === 'right' && !roomRight && roomLeft) placement = 'left'
  if (preferred === 'left' && !roomLeft && roomRight) placement = 'right'

  const width = Math.min(popup.width, Math.max(0, viewport.width - gap * 2))
  const rawLeft = placement === 'right' ? right : leftPos
  const maxLeft = Math.max(gap, viewport.width - width - gap)
  const left = Math.min(Math.max(gap, rawLeft), maxLeft)
  const maxTop = Math.max(gap, viewport.height - popup.height - gap)
  const top = Math.min(Math.max(gap, anchor.top), maxTop)
  return { top, left, width, placement }
}

/** 四向浮层（Popover 等）。side 为翻转后的物理方向。 */
export type RsOverlaySide = 'top' | 'right' | 'bottom' | 'left'

/** 交叉轴对齐。start / end 在横向且 RTL 时对调。 */
export type RsOverlayAlign = 'start' | 'center' | 'end'

export interface RsAlignedOverlayOptions {
  side?: RsOverlaySide
  align?: RsOverlayAlign
  sideOffset?: number
  alignOffset?: number
  padding?: number
  rtl?: boolean
}

export interface RsAlignedOverlayBox {
  top: number
  left: number
  side: RsOverlaySide
  align: RsOverlayAlign
}

const RS_OVERLAY_OPPOSITE: Record<RsOverlaySide, RsOverlaySide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

/**
 * 把浮层贴到锚点四侧：主轴放不下就翻到对侧，交叉轴按 start / center / end，再夹进视口。
 * 横向的 start / end 在 RTL 对调；left / right 是物理方向，不跟书写方向对调。
 */
export function placeAlignedPopup(
  anchor: RsOverlayAnchorBox,
  popup: RsOverlayPopupSize,
  viewport: RsOverlayViewport,
  options: RsAlignedOverlayOptions = {},
): RsAlignedOverlayBox {
  const side = options.side ?? 'bottom'
  const align = options.align ?? 'start'
  const sideOffset = options.sideOffset ?? 6
  const alignOffset = options.alignOffset ?? 0
  const padding = options.padding ?? 8
  const rtl = options.rtl ?? false
  const anchorWidth = anchor.width ?? 0
  const popupWidth = Math.max(0, popup.width)
  const popupHeight = Math.max(0, popup.height)

  const fits = (candidate: RsOverlaySide): boolean => {
    if (candidate === 'bottom') {
      return anchor.top + anchor.height + sideOffset + popupHeight <= viewport.height - padding
    }
    if (candidate === 'top') return anchor.top - sideOffset - popupHeight >= padding
    if (candidate === 'right') {
      return anchor.left + anchorWidth + sideOffset + popupWidth <= viewport.width - padding
    }
    return anchor.left - sideOffset - popupWidth >= padding
  }

  const resolved = !fits(side) && fits(RS_OVERLAY_OPPOSITE[side]) ? RS_OVERLAY_OPPOSITE[side] : side
  const cross: RsOverlayAlign =
    (resolved === 'top' || resolved === 'bottom') && rtl && align !== 'center'
      ? align === 'start'
        ? 'end'
        : 'start'
      : align

  let top = anchor.top
  let left = anchor.left
  if (resolved === 'bottom') top = anchor.top + anchor.height + sideOffset
  else if (resolved === 'top') top = anchor.top - popupHeight - sideOffset
  else if (resolved === 'right') left = anchor.left + anchorWidth + sideOffset
  else left = anchor.left - popupWidth - sideOffset

  if (resolved === 'top' || resolved === 'bottom') {
    if (cross === 'end') left = anchor.left + anchorWidth - popupWidth - alignOffset
    else if (cross === 'center') left = anchor.left + (anchorWidth - popupWidth) / 2 + alignOffset
    else left = anchor.left + alignOffset
  } else if (cross === 'end') top = anchor.top + anchor.height - popupHeight - alignOffset
  else if (cross === 'center') top = anchor.top + (anchor.height - popupHeight) / 2 + alignOffset
  else top = anchor.top + alignOffset

  const maxLeft = Math.max(padding, viewport.width - popupWidth - padding)
  const maxTop = Math.max(padding, viewport.height - popupHeight - padding)
  return {
    top: Math.min(Math.max(padding, top), maxTop),
    left: Math.min(Math.max(padding, left), maxLeft),
    side: resolved,
    align,
  }
}

/** 视口坐标换成容器内坐标。容器是 body / 文档根时保持视口坐标（position: fixed）。 */
export function toContainerPoint(
  top: number,
  left: number,
  origin: { top: number; left: number } | null,
): { top: number; left: number } {
  if (!origin) return { top, left }
  return { top: top - origin.top, left: left - origin.left }
}

/** 在可选项里按方向跳过 disabled，供 combobox / listbox 方向键与 Home / End。 */
export function stepEnabledIndex<T extends { disabled?: boolean }>(
  options: readonly T[],
  current: number,
  delta: 1 | -1,
): number {
  if (!options.length) return 0
  let index = current
  for (let n = 0; n < options.length; n += 1) {
    index = (index + delta + options.length) % options.length
    if (!options[index]?.disabled) return index
  }
  return Math.max(0, current)
}
