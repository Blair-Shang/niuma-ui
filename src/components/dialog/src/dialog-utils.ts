import { ref, type Component } from 'vue'
import type { RsLocale } from '../../../locale/types'
import type { RsThemeMode } from '../../../theme/types'
import { dialogViewportSize } from './dialog-viewport'
import type { RsFeedbackTone } from '../../_shared/src/overlay-utils'

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

/** 模板 ref。close 走 beforeClose；focus 把焦点送进确认框。 */
export interface RsConfirmDialogExpose {
  close: (reason?: RsConfirmCloseReason) => Promise<boolean>
  focus: () => void
}

export type RsConfirmDialogInstance = RsConfirmDialogExpose

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

/** 模板 ref 类型。close 走 beforeClose；focus 把焦点送进对话框。 */
export interface RsDialogExpose {
  close: (reason?: RsDialogCloseReason) => Promise<boolean>
  openDialog: () => void
  focus: () => void
}

export type RsDialogInstance = RsDialogExpose

const DIALOG_TAB_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/** 编辑器自己消费 Tab。对话框陷阱在这些节点上放手。 */
const DIALOG_TAB_OWNER = '.monaco-editor, .cm-editor, .cm-content, .xterm, [data-rs-dialog-tab-owner]'

const INERT_SKIP = 'script, style, link, meta, title'

/** 对话框内可 Tab 到的控件。不按 client rect 过滤：jsdom 没有布局。 */
export function listDialogTabbables(root: ParentNode | null | undefined): HTMLElement[] {
  if (!root || typeof root.querySelectorAll !== 'function') return []
  const nodes = root.querySelectorAll<HTMLElement>(DIALOG_TAB_SELECTOR)
  const seen = new Set<HTMLElement>()
  const out: HTMLElement[] = []
  for (const el of nodes) {
    if (seen.has(el)) continue
    if (el.tabIndex < 0) continue
    if (el.closest('[hidden], [inert]')) continue
    if (el.getAttribute('aria-disabled') === 'true') continue
    seen.add(el)
    out.push(el)
  }
  return out
}

export function dialogTargetOwnsTab(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(DIALOG_TAB_OWNER) != null
}

/** Tab 在对话框边界上的下一焦点。stay 表示交给浏览器。 */
export function resolveDialogTabTarget(
  root: HTMLElement,
  active: Element | null,
  shift: boolean,
): HTMLElement | 'stay' {
  const items = listDialogTabbables(root)
  const inside = active != null && root.contains(active)
  if (!items.length) return inside ? 'stay' : root
  const first = items[0]!
  const last = items[items.length - 1]!
  if (!inside) return shift ? last : first
  if (shift && (active === first || active === root)) return last
  if (!shift && active === last) return first
  return 'stay'
}

const dialogLayerIds: string[] = []

/** 层栈变化时递增，让每个实例重新判断自己是不是最上层。 */
export const dialogLayerTick = ref(0)

export function pushDialogLayer(id: string): void {
  const index = dialogLayerIds.indexOf(id)
  if (index >= 0) dialogLayerIds.splice(index, 1)
  dialogLayerIds.push(id)
  dialogLayerTick.value += 1
}

export function removeDialogLayer(id: string): void {
  const index = dialogLayerIds.indexOf(id)
  if (index < 0) return
  dialogLayerIds.splice(index, 1)
  dialogLayerTick.value += 1
}

export function isTopDialogLayer(id: string): boolean {
  return dialogLayerIds.at(-1) === id
}

let scrollLockCount = 0
let scrollLockSnapshot: { overflow: string; paddingInlineEnd: string } | null = null

/**
 * 模态层锁 body 滚动，并补上滚动条宽度，避免页面横跳。
 * 引用计数：嵌套对话框只在最后一层关闭时恢复。重复释放无操作。
 */
export function acquireDialogScrollLock(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (scrollLockCount === 0) {
    const body = document.body
    scrollLockSnapshot = {
      overflow: body.style.overflow,
      paddingInlineEnd: body.style.paddingInlineEnd,
    }
    const gap = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (gap > 0) {
      const current = Number.parseFloat(getComputedStyle(body).paddingInlineEnd) || 0
      body.style.paddingInlineEnd = `${current + gap}px`
    }
  }
  scrollLockCount += 1
  let released = false
  return () => {
    if (released) return
    released = true
    scrollLockCount = Math.max(0, scrollLockCount - 1)
    if (scrollLockCount !== 0 || !scrollLockSnapshot) return
    document.body.style.overflow = scrollLockSnapshot.overflow
    document.body.style.paddingInlineEnd = scrollLockSnapshot.paddingInlineEnd
    scrollLockSnapshot = null
  }
}

function markInert(el: HTMLElement, value: boolean): void {
  if (value) {
    el.setAttribute('inert', '')
    if ('inert' in el) el.inert = true
    return
  }
  if ('inert' in el) el.inert = false
  el.removeAttribute('inert')
}

function isInert(el: HTMLElement): boolean {
  if ('inert' in el && el.inert) return true
  return el.hasAttribute('inert')
}

function markInertSiblings(parent: HTMLElement, current: HTMLElement, touched: HTMLElement[]): void {
  for (const node of Array.from(parent.children)) {
    if (node === current || !(node instanceof HTMLElement)) continue
    if (node.matches(INERT_SKIP) || isInert(node)) continue
    markInert(node, true)
    touched.push(node)
  }
}

/**
 * 把对话框外壳的兄弟（以及祖先的兄弟）标成 inert，背后内容不可点、不可 Tab。
 * 不 inert body 本身，否则 Teleport 进去的对话框也会被冻住。
 * 已经 inert 的节点不动，释放时也不会被我们解开。
 */
export function inertDialogSiblings(layer: HTMLElement): () => void {
  if (typeof document === 'undefined' || !layer.parentElement) return () => {}
  const touched: HTMLElement[] = []
  let current: HTMLElement | null = layer
  while (current && current !== document.body) {
    const parent: HTMLElement | null = current.parentElement
    if (!parent) break
    markInertSiblings(parent, current, touched)
    current = parent
  }
  let released = false
  return () => {
    if (released) return
    released = true
    for (const el of touched) markInert(el, false)
  }
}

let inertRelease: (() => void) | null = null
let inertOwner: string | null = null

/** 只有最上层模态对话框持有 inert。别人释放不会清掉当前层。 */
export function claimDialogInert(ownerId: string, layer: HTMLElement): void {
  inertRelease?.()
  inertRelease = inertDialogSiblings(layer)
  inertOwner = ownerId
}

export function releaseDialogInert(ownerId: string): void {
  if (inertOwner !== ownerId) return
  inertRelease?.()
  inertRelease = null
  inertOwner = null
}

/** 测试收尾：清层栈、滚动锁和 inert，避免上一例失败把 body 留在 hidden。 */
export function resetDialogGuardsForTests(): void {
  dialogLayerIds.length = 0
  dialogLayerTick.value += 1
  inertRelease?.()
  inertRelease = null
  inertOwner = null
  scrollLockCount = 0
  if (scrollLockSnapshot && typeof document !== 'undefined') {
    document.body.style.overflow = scrollLockSnapshot.overflow
    document.body.style.paddingInlineEnd = scrollLockSnapshot.paddingInlineEnd
  }
  scrollLockSnapshot = null
}
