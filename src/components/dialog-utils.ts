import type { Component } from 'vue'
import type { RsLocale } from '../locale/types'
import type { RsThemeMode } from '../theme/types'
import { dialogViewportSize } from './dialog-viewport'
import type { RsFeedbackTone } from './overlay-utils'

/** 宽度预设（与历史 sm/md/lg 一致） */
export type RsDialogWidthPreset = 'sm' | 'md' | 'lg'

/**
 * 对话框宽度：预设或自定义（number 按 px；string 为 CSS 长度，如 `40rem` / `60%`）。
 * window 布局会在打开时把 px / rem / % 折成像素再居中（% 相对视口扣除 inset）；
 * form / confirm 布局仍把自定义宽度当作 CSS 写入。
 */
export type RsDialogWidth = RsDialogWidthPreset | number | string

/** window：可缩放工作窗；form：居中轻量表单/说明；confirm：历史别名，等同 form */
export type RsDialogLayout = 'window' | 'form' | 'confirm'

/** 关闭来源，供 beforeClose / afterClose 区分 */
export type RsDialogCloseReason =
  | 'close'
  | 'overlay'
  | 'escape'
  | 'cancel'
  | 'confirm'
  | 'programmatic'

/**
 * 关闭前钩子：返回 false 阻止关闭；支持异步。
 * 未提供或返回 void/true 时允许关闭。
 */
export type RsDialogBeforeClose = (
  reason: RsDialogCloseReason,
) => boolean | void | Promise<boolean | void>

export function isRsDialogWidthPreset(width: RsDialogWidth): width is RsDialogWidthPreset {
  return width === 'sm' || width === 'md' || width === 'lg'
}

/** 将自定义宽度规范为 CSS 长度 */
export function resolveRsDialogCssWidth(width: RsDialogWidth): string | undefined {
  if (isRsDialogWidthPreset(width)) return undefined
  if (typeof width === 'number') {
    if (!Number.isFinite(width) || width <= 0) return undefined
    return `${width}px`
  }
  const trimmed = String(width).trim()
  return trimmed || undefined
}

function rootFontSizePx(): number {
  if (typeof document === 'undefined') return 16
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
}

/**
 * 将自定义宽度折成 px，供 window 布局计算 bounds / 居中。
 * 支持 number、`px`、`rem`、`%`（相对视口可用宽度）；预设与无法解析的单位返回 undefined。
 */
export function resolveRsDialogWidthPx(
  width: RsDialogWidth,
  viewportWidth = dialogViewportSize().width,
): number | undefined {
  if (isRsDialogWidthPreset(width)) return undefined
  if (typeof width === 'number') {
    if (!Number.isFinite(width) || width <= 0) return undefined
    return Math.round(width)
  }
  const trimmed = String(width).trim()
  if (!trimmed) return undefined
  if (/^\d+(\.\d+)?px$/i.test(trimmed)) {
    return Math.round(Number.parseFloat(trimmed))
  }
  if (/^\d+(\.\d+)?rem$/i.test(trimmed)) {
    return Math.round(Number.parseFloat(trimmed) * rootFontSizePx())
  }
  if (/^\d+(\.\d+)?%$/.test(trimmed)) {
    if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return undefined
    return Math.round((Number.parseFloat(trimmed) / 100) * viewportWidth)
  }
  return undefined
}

export async function runRsDialogBeforeClose(
  beforeClose: RsDialogBeforeClose | undefined,
  reason: RsDialogCloseReason,
): Promise<boolean> {
  if (!beforeClose) return true
  const result = await beforeClose(reason)
  return result !== false
}

/** 确认框关闭来源，供 beforeClose 区分 */
export type RsConfirmCloseReason = 'confirm' | 'cancel' | 'escape' | 'programmatic'

/**
 * 确认框关闭前钩子：返回 false 阻止关闭；支持异步。
 * 未提供或返回 void/true 时允许关闭。
 */
export type RsConfirmBeforeClose = (
  reason: RsConfirmCloseReason,
) => boolean | void | Promise<boolean | void>

export interface RsConfirmOptions {
  title?: string
  /** 次要说明（标题与正文之间，对应业务侧常见 subtitle） */
  subtitle?: string
  description?: string
  tone?: RsFeedbackTone
  /** 自定义图标组件；不传则使用默认 "!" */
  icon?: Component
  /** 宽度：预设 sm/md/lg，或 number(px) / CSS 长度；默认保持 28rem */
  width?: RsDialogWidth
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  /** 是否显示取消按钮；false 时为单按钮提示（info/success/error） */
  showCancel?: boolean
  /** 受控加载态；若同时提供 onConfirm，命令式 API 会在执行期间自动置 true */
  confirmLoading?: boolean
  /**
   * 确认回调。返回 Promise 时对话框保持打开并进入 loading，
   * resolve 后关闭并 resolve(true)；reject 则取消 loading 并保持打开。
   */
  onConfirm?: () => void | Promise<void>
  /** 取消/关闭时回调（不区分来源） */
  onCancel?: () => void
  /** 关闭前钩子；返回 false 可阻止关闭 */
  beforeClose?: RsConfirmBeforeClose
  /**
   * 正文与按钮之间的额外内容（渲染函数）。
   * 声明式请用 RsConfirmDialog 的 #extra 插槽。
   */
  extra?: () => unknown
  showOverlay?: boolean
  /**
   * 遮罩不透明度 0–1；覆盖 CSS 变量 --rs-dialog-overlay-bg。
   * 未传时使用主题默认（最浅）。
   */
  overlayOpacity?: number
  /**
   * 遮罩模糊半径；number 按 px。覆盖 --rs-dialog-overlay-blur。
   * 未传时使用主题默认（0）。
   */
  overlayBlur?: number | string
  /** false 表示禁用 Teleport，就地渲染 */
  teleportTo?: string | HTMLElement | false
  /** 命令式挂载时覆盖主题；默认读 document data-rs-theme */
  theme?: RsThemeMode
  /** 命令式挂载时覆盖语言；默认读 document data-rs-locale */
  locale?: RsLocale
}

/** 运行确认框 beforeClose；未提供或非 false 视为允许关闭 */
export async function runRsConfirmBeforeClose(
  beforeClose: RsConfirmBeforeClose | undefined,
  reason: RsConfirmCloseReason,
): Promise<boolean> {
  if (!beforeClose) return true
  const result = await beforeClose(reason)
  return result !== false
}

/**
 * 将 overlayOpacity / overlayBlur 转为遮罩 CSS 变量（可挂到 overlay 节点 style）。
 */
export function resolveDialogOverlayStyle(options?: {
  overlayOpacity?: number
  overlayBlur?: number | string
}): Record<string, string> | undefined {
  if (!options) return undefined
  const style: Record<string, string> = {}
  if (options.overlayOpacity != null && Number.isFinite(options.overlayOpacity)) {
    const opacity = Math.min(1, Math.max(0, options.overlayOpacity))
    style['--rs-dialog-overlay-bg'] = `rgb(0 0 0 / ${opacity})`
  }
  if (options.overlayBlur != null && options.overlayBlur !== '') {
    style['--rs-dialog-overlay-blur'] =
      typeof options.overlayBlur === 'number' ? `${options.overlayBlur}px` : String(options.overlayBlur)
  }
  return Object.keys(style).length ? style : undefined
}
