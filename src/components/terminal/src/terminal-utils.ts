import type { ITheme, Terminal } from '@xterm/xterm'
import { documentThemeAttributes } from '../../../theme/color-theme'

export type RsTerminalThemeMode = 'auto' | 'light' | 'dark'
export type RsResolvedTerminalTheme = 'light' | 'dark'
export type RsTerminalCursorStyle = 'block' | 'underline' | 'bar'

export type RsTerminalAction = 'copy' | 'paste' | 'selectAll' | 'clear' | 'askAi' | 'search'

export type RsTerminalGeometry = { cols: number; rows: number }

/** `RsTerminal` 通过 `defineExpose` 公开的命令式接口。 */
export interface RsTerminalExpose {
  write: (data: string) => void
  clear: () => void
  focus: () => void
  fit: () => Promise<void>
  copySelection: () => Promise<void>
  pasteFromClipboard: () => Promise<void>
  selectAll: () => void
  getSelection: () => string
  hasSelection: () => boolean
  getGeometry: () => RsTerminalGeometry | null
  /**
   * 逃生舱口：直接取 xterm 实例。
   * 终端选项由组件按 props 托管，外部改写 `terminal.options` 会与之打架（尤其整体替换该对象
   * 会逐项重设、触发全量重测）。需要什么能力优先提为 prop 或加进本接口。
   */
  getTerminal: () => Terminal | null
}

const TERMINAL_CSS_KEYS: Array<[keyof ITheme, string]> = [
  ['background', '--rs-terminal-bg'],
  ['foreground', '--rs-terminal-fg'],
  ['cursor', '--rs-terminal-cursor'],
  ['cursorAccent', '--rs-terminal-cursor-accent'],
  ['selectionBackground', '--rs-terminal-selection-bg'],
  ['selectionForeground', '--rs-terminal-selection-fg'],
  ['black', '--rs-terminal-ansi-black'],
  ['red', '--rs-terminal-ansi-red'],
  ['green', '--rs-terminal-ansi-green'],
  ['yellow', '--rs-terminal-ansi-yellow'],
  ['blue', '--rs-terminal-ansi-blue'],
  ['magenta', '--rs-terminal-ansi-magenta'],
  ['cyan', '--rs-terminal-ansi-cyan'],
  ['white', '--rs-terminal-ansi-white'],
  ['brightBlack', '--rs-terminal-ansi-bright-black'],
  ['brightRed', '--rs-terminal-ansi-bright-red'],
  ['brightGreen', '--rs-terminal-ansi-bright-green'],
  ['brightYellow', '--rs-terminal-ansi-bright-yellow'],
  ['brightBlue', '--rs-terminal-ansi-bright-blue'],
  ['brightMagenta', '--rs-terminal-ansi-bright-magenta'],
  ['brightCyan', '--rs-terminal-ansi-bright-cyan'],
  ['brightWhite', '--rs-terminal-ansi-bright-white'],
]

const themeProbeCache = new Map<RsResolvedTerminalTheme, HTMLElement>()

const TERMINAL_ROW_STRIPE_VAR = '--rs-terminal-row-stripe'

function readCssVar(name: string, element: HTMLElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim()
}

function channelToHex(raw: string): string | null {
  const value = raw.endsWith('%')
    ? Math.round((Number(raw.slice(0, -1)) / 100) * 255)
    : Math.round(Number(raw))
  if (!Number.isFinite(value)) {
    return null
  }
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')
}

function parseRgbChannels(value: string): [string, string, string] | null {
  const lower = value.toLowerCase()
  if (!lower.startsWith('rgb')) {
    return null
  }
  const open = value.indexOf('(')
  const close = value.indexOf(')', open + 1)
  if (open === -1 || close === -1) {
    return null
  }
  const parts = value
    .slice(open + 1, close)
    .replaceAll('/', ' ')
    .replaceAll(',', ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length < 3) {
    return null
  }
  const r = channelToHex(parts[0])
  const g = channelToHex(parts[1])
  const b = channelToHex(parts[2])
  if (!r || !g || !b) {
    return null
  }
  return [r, g, b]
}

/** 将 CSS 颜色规范为 #RRGGBB（支持 hex 与 computed rgb） */
export function normalizeTerminalHexColor(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  const rgb = parseRgbChannels(trimmed)
  if (!rgb) {
    return null
  }
  return `#${rgb[0]}${rgb[1]}${rgb[2]}`
}

/** 将 lab()/color() 等现代 CSS 色值转为 xterm 可解析的 #RRGGBB */
export function resolveCssColorForXterm(value: string): string | null {
  const direct = normalizeTerminalHexColor(value)
  if (direct) {
    return direct
  }
  if (typeof document === 'undefined') {
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return null
  }
  try {
    ctx.fillStyle = '#000000'
    ctx.fillStyle = value
    if (typeof ctx.fillStyle !== 'string') {
      return null
    }
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    if (a === 0) {
      return null
    }
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
  } catch {
    return null
  }
}

const BACKGROUND_THEME_KEYS = new Set<keyof ITheme>(['background', 'selectionBackground'])

function readResolvedCssColor(cssVar: string, source: HTMLElement, asBackground: boolean): string {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  if (asBackground) {
    probe.style.backgroundColor = `var(${cssVar})`
  } else {
    probe.style.color = `var(${cssVar})`
  }
  source.appendChild(probe)
  const computed = getComputedStyle(probe)
  const raw = asBackground ? computed.backgroundColor : computed.color
  probe.remove()
  return raw
}

function themeProbeElement(mode: RsResolvedTerminalTheme): HTMLElement {
  const cached = themeProbeCache.get(mode)
  if (cached) {
    return cached
  }
  const probe = document.createElement('div')
  probe.dataset.rsTheme = mode
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  themeProbeCache.set(mode, probe)
  return probe
}

function themeSourceElement(mode: RsResolvedTerminalTheme): HTMLElement {
  if (document.documentElement.dataset.rsTheme === mode) {
    return document.documentElement
  }
  return themeProbeElement(mode)
}

/**
 * auto 看最近的 `data-rs-theme`，没有时看 documentElement。
 * 未写或不是 dark 时跟全库浅色。传入元素时深色岛不必改整页。
 */
export function resolveTerminalTheme(
  mode: RsTerminalThemeMode = 'auto',
  el?: HTMLElement | null,
): RsResolvedTerminalTheme {
  if (mode !== 'auto') {
    return mode
  }
  if (typeof document === 'undefined') {
    return 'light'
  }
  const themed = el?.closest?.('[data-rs-theme]')
  const node = themed ?? document.documentElement
  const themeName = node instanceof HTMLElement ? node.dataset.rsTheme : null
  return themeName === 'dark' ? 'dark' : 'light'
}

function pickThemeSource(mode: RsResolvedTerminalTheme, el?: HTMLElement | null): HTMLElement {
  if (el && resolveTerminalTheme('auto', el) === mode) {
    return el
  }
  return themeSourceElement(mode)
}

/** 从 `--rs-terminal-*` 构建 xterm 调色板。传入宿主时读继承到的 token。 */
export function readTerminalThemeFromCss(
  mode: RsResolvedTerminalTheme,
  el?: HTMLElement | null,
): ITheme {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return {}
  }
  const source = pickThemeSource(mode, el)
  const theme: ITheme = {}
  for (const [key, cssVar] of TERMINAL_CSS_KEYS) {
    const raw = readResolvedCssColor(cssVar, source, BACKGROUND_THEME_KEYS.has(key))
    const value = resolveCssColorForXterm(raw)
    if (value) {
      ;(theme as Record<string, string>)[key] = value
    }
  }
  return theme
}

export function getTerminalThemePalette(mode: RsResolvedTerminalTheme): ITheme {
  return readTerminalThemeFromCss(mode)
}

export function mergeTerminalTheme(
  mode: RsResolvedTerminalTheme,
  overrides?: Partial<ITheme>,
  el?: HTMLElement | null,
): ITheme {
  return {
    ...readTerminalThemeFromCss(mode, el),
    ...overrides,
  }
}

/** 读取斑马纹行底色（`--rs-terminal-row-stripe`，解析后供 xterm decoration 使用） */
export function readTerminalRowStripeFromCss(mode: RsResolvedTerminalTheme): string {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return ''
  }
  return readCssVar(TERMINAL_ROW_STRIPE_VAR, themeSourceElement(mode))
}

/** PTY 输出是否含终端控制序列（ESC / CSI），此类数据不应批量延迟。 */
export function containsEscapeSequence(data: string): boolean {
  return data.includes('\x1b') || data.includes('\x9b')
}

const TUI_REFRESH_PATTERN =
  /\x1b\[[0-9;]*[Hf]|\x1b\[2J|\x1b\[\?1049[hl]|\x1b\[\?47[hl]|\x1b\[1049[hl]/

/** 检测 ncurses/vim/top 等全屏刷新常用的光标定位与清屏序列 */
export function containsTuiRefreshSequence(data: string): boolean {
  return TUI_REFRESH_PATTERN.test(data)
}

const FULL_SCREEN_CLEAR_PATTERN = /\x1b\[[0-9;]*2J|\x1b\[[0-9;]*3J/
const ALT_SCREEN_ENTER_PATTERN = /\x1b\[\?1049h|\x1b\[\?47h|\x1b\[1049h/
const CURSOR_HOME_TOP_PATTERN = /^\x1b\[H|^\x1b\[1;1H|^\x1b\[1H/

const MIN_FITTED_TERMINAL_ROWS = 5
const MIN_MEASURED_ROW_HEIGHT_PX = 4
const DEFAULT_TERMINAL_SCROLLBAR_PX = 14

/**
 * 按宿主像素高度与实测行高计算能完整放下的行数。
 * FitAddon 用理论 cellHeight，亚像素取整后行盒往往更高，多报的行会被 overflow 裁掉
 *（top 按 1 展开几十上百核时，最后几行 CPU 就像被高度挡住）。
 */
export function computeFittedTerminalRows(
  hostHeight: number,
  rowHeight: number,
  minRows = MIN_FITTED_TERMINAL_ROWS,
): number | null {
  if (hostHeight <= 0 || rowHeight < MIN_MEASURED_ROW_HEIGHT_PX) {
    return null
  }
  return Math.max(minRows, Math.floor(hostHeight / rowHeight))
}

/** 读取 xterm 当前 CSS 单元格尺寸（与 FitAddon 同一套私有 dimensions）。 */
export function readXtermCssCellSize(terminal: Terminal): { width: number; height: number } | null {
  const core = terminal as unknown as {
    _core?: {
      _renderService?: {
        dimensions?: { css?: { cell?: { width: number; height: number } } }
      }
    }
  }
  const cell = core._core?._renderService?.dimensions?.css?.cell
  if (!cell || cell.width < 1 || cell.height < 1) {
    return null
  }
  return { width: cell.width, height: cell.height }
}

/**
 * 用宿主 client 宽高算行列，避开 FitAddon 对 computed `height: 100%` 走 parseInt 的偏差。
 * 偏差时 PTY 会停在默认 80×24，`top` 按 1 就只画二十来行 CPU。
 */
export function proposeTerminalGeometry(
  hostWidth: number,
  hostHeight: number,
  cellWidth: number,
  cellHeight: number,
  scrollbarWidth = DEFAULT_TERMINAL_SCROLLBAR_PX,
): { cols: number; rows: number } | null {
  if (hostWidth <= 0 || hostHeight <= 0 || cellWidth < 1 || cellHeight < 1) {
    return null
  }
  return {
    cols: Math.max(2, Math.floor((hostWidth - scrollbarWidth) / cellWidth)),
    rows: Math.max(1, Math.floor(hostHeight / cellHeight)),
  }
}

/** 进入备用屏（smcup），top/vim 全屏时常走这条 */
export function containsAltScreenEnter(data: string): boolean {
  return ALT_SCREEN_ENTER_PATTERN.test(data)
}

/** 全屏清屏（top/vim 新一轮绘制常见） */
export function containsFullScreenClear(data: string): boolean {
  return FULL_SCREEN_CLEAR_PATTERN.test(data)
}

/** 数据块以光标归位首行开头（top 每轮刷新常见） */
export function startsWithCursorHome(data: string): boolean {
  return CURSOR_HOME_TOP_PATTERN.test(data.trimStart())
}

/**
 * 在本地解析层重置滚动边距等模式（不发给 PTY）。
 * 仅在全屏清屏等明确「新一轮绘制」时调用，避免打断进行中的 TUI 光标位置。
 */
export function resetLocalTerminalModes(terminal: Terminal): void {
  terminal.write('\x1b[r')
}

export function snapTerminalViewportToBottom(terminal: Terminal): void {
  terminal.scrollToBottom()
}

/**
 * 是否要在写入前校正视口。
 * 只认清屏 / 进备用屏 / 已在备用屏且视口不在底部；普通 `\x1b[H` 不碰，以免把用户翻的 scrollback 拽回去。
 */
export function needsPtyWriteViewportPrep(data: string, terminal: Terminal): boolean {
  if (containsFullScreenClear(data) || containsAltScreenEnter(data)) {
    return true
  }
  if (terminal.buffer.active.type !== 'alternate') {
    return false
  }
  return (
    containsTuiRefreshSequence(data) && terminal.buffer.active.viewportY < terminal.buffer.active.baseY
  )
}

/** 处理 PTY 写入前的视口/模式准备（不移动写入光标，避免输入错位） */
export function prepareTerminalForPtyWrite(terminal: Terminal, data: string): void {
  if (containsFullScreenClear(data)) {
    resetLocalTerminalModes(terminal)
    snapTerminalViewportToBottom(terminal)
    return
  }
  if (containsAltScreenEnter(data)) {
    snapTerminalViewportToBottom(terminal)
    return
  }
  const buffer = terminal.buffer.active
  if (buffer.viewportY < buffer.baseY) {
    snapTerminalViewportToBottom(terminal)
  }
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/** 菜单/文档展示的修饰键标签 */
export function terminalShortcutLabel(key: string): string {
  return isMacPlatform() ? `⌘${key}` : `Ctrl+${key}`
}

type ThemeListener = () => void

const themeListeners = new Set<ThemeListener>()
let sharedThemeObserver: MutationObserver | null = null

function ensureTerminalThemeObserver(): void {
  if (sharedThemeObserver || typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return
  }
  sharedThemeObserver = new MutationObserver(() => {
    for (const listener of themeListeners) {
      listener()
    }
  })
  sharedThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [...documentThemeAttributes],
    subtree: true,
  })
}

/**
 * 多个终端共用一个 `data-rs-theme` 观察器（含主题岛）。
 * 最后一个退订时断开，避免卸载后仍监听整棵文档。
 */
export function subscribeTerminalTheme(listener: ThemeListener): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => undefined
  }
  themeListeners.add(listener)
  ensureTerminalThemeObserver()
  return () => {
    themeListeners.delete(listener)
    if (themeListeners.size === 0 && sharedThemeObserver) {
      sharedThemeObserver.disconnect()
      sharedThemeObserver = null
    }
  }
}

/** 当前仍挂着的主题订阅数。测试用来确认卸载成对退订。 */
export function terminalThemeSubscriptionCount(): number {
  return themeListeners.size
}

export type RsTerminalLinkHit = { start: number; end: number; text: string }

const TERMINAL_LINK_TRAILING = new Set(['.', ',', ';', ':', '!', '?', ')', '>', ']'])

function trimTerminalLinkPunctuation(raw: string): string {
  let end = raw.length
  while (end > 0 && TERMINAL_LINK_TRAILING.has(raw.charAt(end - 1))) {
    end -= 1
  }
  return raw.slice(0, end)
}

/** 只放行 http(s) 与 mailto。javascript: / data: 一律拒绝。 */
export function isSafeTerminalLink(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:'
  } catch {
    return false
  }
}

/** 从一行可见文本里找出可点的 http(s) / mailto。end 为不含尾标点的字符串下标。 */
export function findTerminalHttpLinks(line: string): RsTerminalLinkHit[] {
  if (!line.includes('http') && !line.includes('mailto')) {
    return []
  }
  const re = /(?:https?:\/\/|mailto:)[^\s<>"']+/gi
  const out: RsTerminalLinkHit[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(line))) {
    const text = trimTerminalLinkPunctuation(match[0])
    if (!text || !isSafeTerminalLink(text)) {
      continue
    }
    out.push({ start: match.index, end: match.index + text.length, text })
  }
  return out
}

/**
 * 把字符串下标换成 xterm 1-based 单元格列。
 * 宽字符占两格，后续 width 0 的格子跳过，避免链接框落在汉字上。
 */
export function terminalCellIndexForString(
  cells: ReadonlyArray<{ chars: string; width: number }>,
  stringIndex: number,
): number {
  let seen = 0
  for (let i = 0; i < cells.length; i += 1) {
    const width = cells[i]?.width ?? 1
    if (width < 1) {
      continue
    }
    if (seen >= stringIndex) {
      return i + 1
    }
    const chars = cells[i]?.chars ?? ''
    seen += chars.length || 1
  }
  return Math.max(1, cells.length)
}

export function terminalLinkCellRange(
  cells: ReadonlyArray<{ chars: string; width: number }>,
  start: number,
  end: number,
): { startX: number; endX: number } {
  const startX = terminalCellIndexForString(cells, start)
  const endX = terminalCellIndexForString(cells, Math.max(start, end - 1))
  return { startX, endX: Math.max(startX, endX) }
}

/** ANSI 16 色演示文本 */
export function buildAnsiColorDemo(): string {
  const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
  const rows = [0, 1].map((row) => {
    const base = row === 0 ? 30 : 90
    let line = ''
    for (let i = 0; i < 8; i += 1) {
      line += `\x1b[${base + i}m ${names[i].padEnd(8)} \x1b[0m`
    }
    return line
  })
  let gradient = ''
  for (let i = 16; i < 52; i += 1) {
    gradient += `\x1b[48;5;${i}m \x1b[0m`
  }
  const lines = [
    '\x1b[1mANSI 16 colors\x1b[0m',
    ...rows,
    '',
    '\x1b[1mStyles\x1b[0m  \x1b[1mbold\x1b[0m  \x1b[3mitalic\x1b[0m  \x1b[4munderline\x1b[0m  \x1b[9mstrikethrough\x1b[0m',
    '',
    '\x1b[38;5;196m256-color\x1b[0m sample:',
    gradient,
    '',
    '\x1b[1mls --color symlink\x1b[0m',
    `  23 Apr  1  2024 \x1b[01;36mbusiness-logs -> /wmsdata/business-logs/\x1b[0m`,
    `  23 Apr  1  2024 \x1b[01;36;40mbusiness-logs -> /wmsdata/business-logs/\x1b[0m`,
    `  23 Apr  1  2024 \x1b[40;31;01mbusiness-logs -> /wmsdata/business-logs/\x1b[0m`,
  ]
  return `${lines.join('\r\n')}\r\n`
}
