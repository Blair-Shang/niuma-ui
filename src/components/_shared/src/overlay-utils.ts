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

/** 多条 Toast 之间的垂直间距（px），传给 vue-sonner `gap` */
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
