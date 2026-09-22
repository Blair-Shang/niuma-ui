import {
  resolveDialogOverlayStyle,
  runRsDialogBeforeClose,
  type RsDialogBeforeClose,
  type RsDialogCloseReason,
} from '../../dialog/src/dialog-utils'

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

/** 左右抽屉默认可拖最小宽度 */
export const RS_DRAWER_MIN_SIZE_PX = 256
/** 相对视口的默认可拖上限比例 */
export const RS_DRAWER_MAX_VIEWPORT_RATIO = 0.9

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

/**
 * 将抽屉尺寸表达式解析为像素，供拖拽缩放夹紧。
 * 无法解析时返回 fallbackPx。
 */
export function resolveRsDrawerSizePx(
  value: RsDrawerDimension | undefined,
  fallbackPx: number,
  rootFontPx: number,
  viewportPx: number,
): number {
  if (value == null) return fallbackPx
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : fallbackPx
  }
  const trimmed = String(value).trim()
  const n = Number.parseFloat(trimmed)
  if (!Number.isFinite(n)) return fallbackPx
  if (trimmed.endsWith('rem')) return n * rootFontPx
  if (trimmed.endsWith('%') || trimmed.endsWith('vw') || trimmed.endsWith('vh')) {
    return (n / 100) * viewportPx
  }
  return n
}

/** 将拖拽得到的尺寸夹在 min/max 之间并取整。 */
export function clampRsDrawerSize(px: number, minPx: number, maxPx: number): number {
  const lo = Math.min(minPx, maxPx)
  const hi = Math.max(minPx, maxPx)
  return Math.round(Math.min(hi, Math.max(lo, px)))
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

/** 滑入 / 滑出时长，与样式 token 默认值一致。减少动态时退出不等待。 */
export const RS_DRAWER_MOTION_IN_MS = 240
export const RS_DRAWER_MOTION_OUT_MS = 180

export interface RsDrawerExpose {
  /** 请求关闭（走 beforeClose）。被拦截时返回 false。 */
  close: (reason?: RsDrawerCloseReason) => Promise<boolean>
  /** 打开抽屉 */
  openDrawer: () => void
  /** 把焦点移进面板（模态打开时也会自动调用） */
  focus: () => void
}

export type RsDrawerInstance = RsDrawerExpose

export function rsDrawerMotionOutMs(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return RS_DRAWER_MOTION_OUT_MS
  }
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
  } catch {
    return RS_DRAWER_MOTION_OUT_MS
  }
  return RS_DRAWER_MOTION_OUT_MS
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Tab 循环用。不读布局，避免在按键路径上强制回流。 */
export function listRsDrawerFocusables(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const out: HTMLElement[] = []
  for (const el of nodes) {
    if (el.closest('[hidden], [inert]')) continue
    if (el.getAttribute('aria-hidden') === 'true') continue
    out.push(el)
  }
  return out
}

const OWNED_POPUP_SELECTOR = [
  '[role="listbox"]',
  '[role="menu"]',
  '[role="tooltip"]',
  '[data-rs-popup]',
  '.rs-dialog__content',
  '.rs-dialog__overlay',
].join(',')

/**
 * 点在面板内，或点在从面板里弹出的列表 / 菜单 / 提示 / 对话框上，不算“外部”。
 * 另一个抽屉不算，上层抽屉仍能吃掉对下层的点击。
 */
export function isRsDrawerDismissExempt(target: EventTarget | null, content: HTMLElement | null): boolean {
  if (!(target instanceof Node) || !content) return false
  if (content.contains(target)) return true
  const el = target instanceof Element ? target : target.parentElement
  if (!el) return false
  const popup = el.closest(OWNED_POPUP_SELECTOR)
  if (!popup || popup === content || content.contains(popup)) return Boolean(popup)
  if (
    popup.classList.contains('rs-drawer__content') ||
    popup.classList.contains('rs-drawer__overlay')
  ) {
    return false
  }
  return true
}

const stack: string[] = []

export function pushRsDrawerLayer(id: string): () => void {
  if (!stack.includes(id)) stack.push(id)
  let released = false
  return () => {
    if (released) return
    released = true
    const index = stack.indexOf(id)
    if (index >= 0) stack.splice(index, 1)
  }
}

export function isTopRsDrawer(id: string): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id
}

export function resetRsDrawerStack(): void {
  stack.length = 0
}

let lockCount = 0
let prevOverflow: string | null = null
let prevPaddingRight: string | null = null

/**
 * 模态抽屉锁 body 滚动，并补上滚动条宽度，避免页面横跳。
 * 引用计数；释放函数可重复调用。无 document 时返回空操作。
 */
export function acquireRsDrawerScrollLock(): () => void {
  if (typeof document === 'undefined' || !document.body) return () => {}
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow
    prevPaddingRight = document.body.style.paddingRight
    const gap = window.innerWidth - document.documentElement.clientWidth
    const current = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${current + gap}px`
  }
  lockCount += 1
  let released = false
  return () => {
    if (released) return
    released = true
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0 && document.body) {
      document.body.style.overflow = prevOverflow ?? ''
      document.body.style.paddingRight = prevPaddingRight ?? ''
      prevOverflow = null
      prevPaddingRight = null
    }
  }
}

export function resetRsDrawerScrollLock(): void {
  if (typeof document !== 'undefined' && document.body && lockCount > 0) {
    document.body.style.overflow = prevOverflow ?? ''
    document.body.style.paddingRight = prevPaddingRight ?? ''
  }
  lockCount = 0
  prevOverflow = null
  prevPaddingRight = null
}

let pointerUsers = 0
let pointersDown = 0

function onDrawerPointerDown(): void {
  pointersDown += 1
}

function onDrawerPointerUp(): void {
  pointersDown = Math.max(0, pointersDown - 1)
}

/** 打开手势是否还按着指针。多实例共用一套监听，卸载减到 0 才摘掉。 */
export function acquireRsDrawerPointerTracking(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (pointerUsers === 0) {
    window.addEventListener('pointerdown', onDrawerPointerDown, true)
    window.addEventListener('pointerup', onDrawerPointerUp, true)
    window.addEventListener('pointercancel', onDrawerPointerUp, true)
  }
  pointerUsers += 1
  let released = false
  return () => {
    if (released) return
    released = true
    pointerUsers = Math.max(0, pointerUsers - 1)
    if (pointerUsers === 0) detachRsDrawerPointerTracking()
  }
}

function detachRsDrawerPointerTracking(): void {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointerdown', onDrawerPointerDown, true)
  window.removeEventListener('pointerup', onDrawerPointerUp, true)
  window.removeEventListener('pointercancel', onDrawerPointerUp, true)
  pointersDown = 0
}

export function rsDrawerPointersDown(): number {
  return pointersDown
}

export function resetRsDrawerPointerTracking(): void {
  pointerUsers = 0
  detachRsDrawerPointerTracking()
}

/** 单测收尾：栈、滚动锁、指针监听一起清掉。 */
export function resetRsDrawerRuntime(): void {
  resetRsDrawerStack()
  resetRsDrawerScrollLock()
  resetRsDrawerPointerTracking()
}
