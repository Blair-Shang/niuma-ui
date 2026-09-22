<script setup lang="ts">
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import type { ITheme } from '@xterm/xterm'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  readTerminalFontFamily,
  readTerminalFontSizePx,
  readTerminalFontWeight,
  readTerminalFontWeightBold,
} from '../../../theme/css-token'
import {
  beginClipboardPrefetch,
  copyTextToClipboard,
  readClipboardText,
} from '../../../utils/rs-clipboard'
import RsContextMenu from '../../context-menu/src/RsContextMenu.vue'
import type { RsContextMenuItem } from '../../context-menu/src/context-menu-utils'
import RsLoading from '../../loading/src/RsLoading.vue'
import {
  findTerminalHttpLinks,
  isSafeTerminalLink,
  mergeTerminalTheme,
  needsPtyWriteViewportPrep,
  prepareTerminalForPtyWrite,
  proposeTerminalGeometry,
  readXtermCssCellSize,
  resolveTerminalTheme,
  subscribeTerminalTheme,
  terminalLinkCellRange,
  terminalShortcutLabel,
  type RsTerminalAction,
  type RsTerminalCursorStyle,
  type RsTerminalExpose,
  type RsTerminalGeometry,
  type RsTerminalThemeMode,
} from './terminal-utils'
import {
  attachWheelScrollGuard,
  isAlternateTerminalBuffer,
  type RsTerminalWheelScrollModifier,
} from './terminal-wheel'

/** 单元格高度倍率（xterm options.lineHeight）。中文比 Canvas 测的西文高，1 会裁到下一行。 */
const TERMINAL_LINE_HEIGHT = 1.2

/** 令牌缺省字号；仅在挂载前（含 SSR）占位，挂载后由 syncResolvedFontSize 换成实测值。 */
const FALLBACK_FONT_SIZE_PX = 14

// class / style 落在 .rs-terminal 上。右键菜单包在外面，自动透传会落到菜单根上。
defineOptions({ name: 'RsTerminal', inheritAttrs: false })

type RsTerminalFontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    overlay?: string
    inputEnabled?: boolean
    cursorBlink?: boolean
    /** 缺省读取 `--rs-terminal-font-family` / `--rs-font-mono` */
    fontFamily?: string
    /** 缺省读取 `--rs-terminal-font-size`（对齐 `--rs-font-size-sm`） */
    fontSize?: number
    /** 缺省读取 `--rs-terminal-font-weight` */
    fontWeight?: RsTerminalFontWeight
    /** 缺省读取 `--rs-terminal-font-weight-bold` */
    fontWeightBold?: RsTerminalFontWeight
    allowTransparency?: boolean
    /** auto 跟随 data-rs-theme；也可强制 light / dark */
    themeMode?: RsTerminalThemeMode
    /** 覆盖内置调色板中的部分 token */
    theme?: Partial<ITheme>
    contextMenu?: boolean
    /** 右键菜单是否展示「询问 AI」（仅 emit，业务侧自行处理） */
    showAskAi?: boolean
    /**
     * 追加到内置右键菜单（复制/粘贴等）与「清空」之间。
     * `key` 勿与 copy / paste / selectAll / search / askAi / clear 冲突。
     */
    extraContextMenuItems?: RsContextMenuItem[]
    /**
     * 右键是否自动选中光标下单词。
     * 已经有拖选时不会缩成一个词，避免滚选大段文本时选区跳一下。
     * SSH/vim/less 等 TUI 场景建议 false。
     */
    rightClickSelectsWord?: boolean
    shortcuts?: boolean
    scrollback?: number
    /** 将裸 \\n 当作换行；PTY/SSH 建议 false，避免破坏 ncurses(top/vim) */
    convertEol?: boolean
    /** 奇数行斑马纹底色，提升长日志可读性 */
    zebraStripes?: boolean
    /**
     * none：滚轮始终翻 scrollback。
     * shift：普通 shell 翻 scrollback；仅 vim/top 等备用屏把滚轮转成方向键。
     */
    wheelScrollModifier?: RsTerminalWheelScrollModifier
    /** TUI 全屏刷新时若视口不在底部，自动滚回底部（修复 top 表头丢失） */
    snapViewportOnTuiWrite?: boolean
    /** 鼠标松开时若有选区则复制（接近原生终端 copy-on-select） */
    copyOnSelect?: boolean
    /** 启用 Ctrl/⌘+F 终端内搜索 */
    searchEnabled?: boolean
    /** 光标形状。缺省 block，与 xterm 一致。 */
    cursorStyle?: RsTerminalCursorStyle
    /**
     * 读屏模式。缺省关闭：打开后 xterm 会为每次光标移动暴露辅助节点。
     * 需要 NVDA / VoiceOver 跟随时再开。
     */
    screenReaderMode?: boolean
    /**
     * 点击 http(s) / mailto 时用新标签打开。
     * 设为 false 时只发 `link`，由宿主决定。javascript: 与 data: 一律忽略。
     */
    openLinks?: boolean
    /**
     * 单格宽、字形却更宽的字符（GB18030 歧义宽度）按格缩放。
     * 缺省开启。DOM 渲染器下无效。
     */
    rescaleOverlappingGlyphs?: boolean
    /** 区域的可访问名称。未传走 terminal.label。 */
    ariaLabel?: string
    /** 根节点 id。 */
    id?: string
    /**
     * 单元格前景相对背景的最低对比度（xterm `minimumContrastRatio`）。
     * `ls --color` 软链接常用黑底；浅色主题把青/蓝调深后会看不清，4.5 对齐 WCAG AA。
     * 传 1 关闭。
     */
    minimumContrastRatio?: number
  }>(),
  {
    loading: false,
    overlay: '',
    inputEnabled: true,
    cursorBlink: true,
    allowTransparency: false,
    themeMode: 'auto',
    theme: () => ({}),
    contextMenu: true,
    showAskAi: false,
    extraContextMenuItems: () => [],
    rightClickSelectsWord: true,
    shortcuts: true,
    scrollback: 5000,
    convertEol: false,
    zebraStripes: true,
    wheelScrollModifier: 'none',
    snapViewportOnTuiWrite: true,
    copyOnSelect: false,
    searchEnabled: false,
    cursorStyle: 'block',
    screenReaderMode: false,
    openLinks: true,
    rescaleOverlappingGlyphs: true,
    minimumContrastRatio: 4.5,
  },
)

const emit = defineEmits<{
  ready: []
  data: [data: string]
  resize: [payload: { cols: number; rows: number }]
  action: [action: RsTerminalAction]
  /** 询问 AI：携带右键菜单打开时快照的选区（避免菜单点击后选区被清空） */
  askAi: [text: string]
  /** 选区变化，携带当前选中文本（无选区时为空串） */
  selectionChange: [text: string]
  /** 业务追加的右键项被选中 */
  extraSelect: [key: string]
  /** OSC 0 / 2 标题。宿主用来改页签或窗口名。 */
  titleChange: [title: string]
  /** BEL（\\x07）。组件不发声，由宿主决定。 */
  bell: []
  /** 点中 http(s) 或 mailto。不安全协议不发。 */
  link: [url: string]
}>()

const { t } = useRsI18n()
const hostEl = ref<HTMLElement | null>(null)
const regionLabel = computed(() => props.ariaLabel || t('terminal.label', 'Terminal'))
const terminalReady = ref(false)
const hasSelection = ref(false)
/**
 * 右键打开前的选区文本。不用 ref：菜单禁用只看 hasSelection，
 * 避免大段文本写回响应式数据时把菜单再排一次。
 */
let menuSelectionText = ''
const resolvedThemeMode = ref(resolveTerminalTheme(props.themeMode))
/** fit 后量一次真实行高，避免亚像素漂移；非每帧更新 */
const zebraRowStepPx = ref<number | null>(null)
/** 令牌字号的实测缓存：读 CSS 变量是 DOM 操作，不能放进 computed */
const resolvedFontSizePx = ref(props.fontSize ?? FALLBACK_FONT_SIZE_PX)

const showLoading = computed(() => !terminalReady.value || props.loading)

function asTerminalFontWeight(value: string): RsTerminalFontWeight {
  return value as RsTerminalFontWeight
}

function resolveTerminalFontFamily(): string {
  return props.fontFamily || readTerminalFontFamily(hostEl.value)
}

function resolveTerminalFontSize(): number {
  return props.fontSize ?? readTerminalFontSizePx(hostEl.value)
}

function resolveTerminalFontWeight(): RsTerminalFontWeight {
  return props.fontWeight ?? asTerminalFontWeight(readTerminalFontWeight(hostEl.value))
}

function resolveTerminalFontWeightBold(): RsTerminalFontWeight {
  return props.fontWeightBold ?? asTerminalFontWeight(readTerminalFontWeightBold(hostEl.value))
}

function syncResolvedFontSize(): void {
  resolvedFontSizePx.value = resolveTerminalFontSize()
}

const zebraStyle = computed((): Record<string, string> | undefined => {
  if (!props.zebraStripes) {
    return undefined
  }
  const fontSize = resolvedFontSizePx.value
  const step = zebraRowStepPx.value ?? fontSize * TERMINAL_LINE_HEIGHT
  return {
    '--rs-terminal-font-size': `${fontSize}px`,
    '--rs-terminal-line-height': String(TERMINAL_LINE_HEIGHT),
    '--rs-terminal-zebra-step': `${step}px`,
  }
})

const contextMenuItems = computed<RsContextMenuItem[]>(() => {
  const items: RsContextMenuItem[] = [
    {
      key: 'copy',
      label: t('terminal.copy', 'Copy'),
      icon: 'copy',
      shortcut: terminalShortcutLabel('C'),
      disabled: !hasSelection.value,
    },
    {
      key: 'paste',
      label: t('terminal.paste', 'Paste'),
      icon: 'clipboard-paste',
      shortcut: terminalShortcutLabel('V'),
      disabled: !props.inputEnabled,
    },
    {
      key: 'selectAll',
      label: t('terminal.selectAll', 'Select All'),
      icon: 'square-mouse-pointer',
      shortcut: terminalShortcutLabel('A'),
    },
  ]
  if (props.searchEnabled) {
    items.push({
      key: 'search',
      label: t('terminal.search', 'Search'),
      icon: 'search',
      shortcut: terminalShortcutLabel('F'),
    })
  }
  if (props.showAskAi) {
    items.push(
      { key: 'sep-ai', label: '', separator: true },
      {
        key: 'askAi',
        label: t('terminal.askAi', 'Ask AI'),
        icon: 'bot',
        disabled: !hasSelection.value,
      },
    )
  }
  if (props.extraContextMenuItems?.length) {
    items.push({ key: 'sep-extra', label: '', separator: true }, ...props.extraContextMenuItems)
  }
  items.push(
    { key: 'sep-1', label: '', separator: true },
    {
      key: 'clear',
      label: t('terminal.clear', 'Clear Terminal'),
      icon: 'eraser',
      shortcut: terminalShortcutLabel('K'),
      danger: true,
    },
  )
  return items
})

const searchOpen = ref(false)
const searchQuery = ref('')
const searchStatus = ref('')
const searchInputEl = ref<HTMLInputElement | null>(null)
const searchStatusId = useId()

type Disposable = { dispose: () => void }

let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let searchAddon: SearchAddon | null = null
let resizeObserver: ResizeObserver | null = null
let unsubscribeTheme: (() => void) | null = null
let detachWheelGuard: (() => void) | null = null
let dataDisposable: Disposable | null = null
let selectionDisposable: Disposable | null = null
let titleDisposable: Disposable | null = null
let bellDisposable: Disposable | null = null
let linkDisposable: Disposable | null = null
let motionMedia: MediaQueryList | null = null
let lastGeometry = { cols: 0, rows: 0 }
let fitRaf = 0
let selectionFrame = 0
let didInitialFit = false
let alive = true

function resolveAllowTransparency(): boolean {
  return props.allowTransparency || props.zebraStripes
}

function buildXtermTheme(): ITheme {
  // 主题背景保持不透明：反色行 (xterm-fg/bg-257) 依赖 opaque(background)；
  // 斑马纹通过 allowTransparency 让默认单元格透出底层 CSS 渐变。
  return mergeTerminalTheme(resolvedThemeMode.value, props.theme, hostEl.value)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function syncCursorBlink(): void {
  if (!terminal) {
    return
  }
  terminal.options.cursorBlink = props.cursorBlink && !prefersReducedMotion()
}

function onMotionPreference(): void {
  syncCursorBlink()
}

function syncInputEnabled(): void {
  if (!terminal) {
    return
  }
  terminal.options.disableStdin = !props.inputEnabled
}

function labelTerminalInput(): void {
  const textarea = hostEl.value?.querySelector('textarea')
  if (textarea instanceof HTMLTextAreaElement) {
    textarea.setAttribute('aria-label', regionLabel.value)
  }
}

function applyThemeToTerminal(): void {
  if (!terminal) {
    return
  }
  terminal.options.theme = buildXtermTheme()
}

function syncZebraRowStepFromDom(): void {
  zebraRowStepPx.value = null
  if (!props.zebraStripes || !hostEl.value) {
    return
  }
  const rowEl = hostEl.value.querySelector<HTMLElement>('.xterm-rows > div, .xterm-row')
  const height = rowEl?.offsetHeight ?? 0
  if (height > 0) {
    zebraRowStepPx.value = height
  }
}

function attachWheelGuard(): void {
  detachWheelGuard?.()
  detachWheelGuard = null
  if (!hostEl.value || props.wheelScrollModifier === 'none') {
    return
  }
  detachWheelGuard = attachWheelScrollGuard(hostEl.value, {
    modifier: () => props.wheelScrollModifier,
    inputEnabled: () => props.inputEnabled,
    isAlternateBuffer: () => isAlternateTerminalBuffer(terminal),
    onArrowKeys: (data) => {
      if (props.inputEnabled) {
        emit('data', data)
      }
    },
  })
}

function refreshResolvedTheme(): void {
  resolvedThemeMode.value = resolveTerminalTheme(props.themeMode, hostEl.value)
  applyThemeToTerminal()
}

function currentGeometry(): RsTerminalGeometry | null {
  if (!terminal) {
    return null
  }
  return {
    cols: terminal.cols || 80,
    rows: terminal.rows || 24,
  }
}

async function rafTwice(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function emitResizeIfChanged(): void {
  const geometry = currentGeometry()
  if (!geometry) {
    return
  }
  if (geometry.cols === lastGeometry.cols && geometry.rows === lastGeometry.rows) {
    return
  }
  lastGeometry = geometry
  emit('resize', geometry)
}

async function fit(): Promise<void> {
  if (!alive || !fitAddon || !terminal || !hostEl.value) {
    return
  }
  const { clientWidth, clientHeight } = hostEl.value
  if (clientWidth <= 0 || clientHeight <= 0) {
    return
  }
  if (!didInitialFit) {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready
    }
    await nextTick()
    await rafTwice()
  }
  if (!alive || !fitAddon || !terminal || !hostEl.value) {
    return
  }
  try {
    fitAddon.fit()
  } catch {
    // 仍用宿主 client 盒补算，避免停在 80×24
  }
  didInitialFit = true
  applyHostBoxGeometry()
  trimOverflowRow()
  syncZebraRowStepFromDom()
  emitResizeIfChanged()
  syncResolvedFontSize()
}

/** 以 host client 盒为准，纠正 FitAddon 把 100% 高度 parseInt 成内容高（默认 24 行）的情况。 */
function applyHostBoxGeometry(): void {
  if (!terminal || !hostEl.value) {
    return
  }
  const cell = readXtermCssCellSize(terminal)
  if (!cell) {
    return
  }
  const proposed = proposeTerminalGeometry(
    hostEl.value.clientWidth,
    hostEl.value.clientHeight,
    cell.width,
    cell.height,
  )
  if (!proposed) {
    return
  }
  const cols = Math.max(proposed.cols, 20)
  const rows = Math.max(proposed.rows, 5)
  if (cols !== terminal.cols || rows !== terminal.rows) {
    terminal.resize(cols, rows)
  }
}

/** 画布比宿主高出超过一行时再减行，避免裁掉最后一行。 */
function trimOverflowRow(): void {
  if (!terminal || !hostEl.value) {
    return
  }
  const screen = hostEl.value.querySelector<HTMLElement>('.xterm-screen')
  if (!screen) {
    return
  }
  const overflow = screen.offsetHeight - hostEl.value.clientHeight
  if (overflow <= 1) {
    return
  }
  const cell = readXtermCssCellSize(terminal)
  const cut = cell ? Math.max(1, Math.ceil(overflow / cell.height)) : 1
  const nextRows = Math.max(5, terminal.rows - cut)
  if (nextRows < terminal.rows) {
    terminal.resize(terminal.cols, nextRows)
  }
}

function scheduleFit(): void {
  if (!alive || fitRaf) {
    return
  }
  fitRaf = requestAnimationFrame(() => {
    fitRaf = 0
    if (!alive) {
      return
    }
    void fit()
  })
}

function write(data: string): void {
  const term = terminal
  if (!term) {
    return
  }
  if (props.snapViewportOnTuiWrite && needsPtyWriteViewportPrep(data, term)) {
    prepareTerminalForPtyWrite(term, data)
  }
  term.write(data)
}

function clear(): void {
  terminal?.clear()
  terminal?.clearSelection()
  syncSelectionState()
}

function focus(): void {
  terminal?.focus()
}

function getSelectionText(): string {
  return String(terminal?.getSelection?.() ?? '')
}

function syncSelectionState(): void {
  const text = getSelectionText()
  const selected = Boolean(terminal?.hasSelection())
  if (hasSelection.value !== selected) hasSelection.value = selected
  menuSelectionText = selected ? text.trim() : ''
  emit('selectionChange', text)
}

/** 选区文本留到下一帧再序列化，右键和松开鼠标先把画面画完。 */
function scheduleSelectionText(): void {
  if (selectionFrame) return
  selectionFrame = requestAnimationFrame(() => {
    selectionFrame = 0
    if (!alive) return
    syncSelectionState()
  })
}

/** 优先活选区；菜单抢走焦点后回退打开时记下的文本。 */
function resolveMenuSelectionText(): string {
  const live = getSelectionText().trim()
  if (live) return live
  return menuSelectionText
}

function ensureSearchAddon(): SearchAddon | null {
  if (!terminal || !props.searchEnabled) {
    return null
  }
  if (!searchAddon) {
    searchAddon = new SearchAddon()
    terminal.loadAddon(searchAddon)
  }
  return searchAddon
}

function openSearch(): void {
  if (!props.searchEnabled || !alive) {
    return
  }
  ensureSearchAddon()
  searchOpen.value = true
  searchStatus.value = ''
  void nextTick(() => {
    if (!alive) {
      return
    }
    searchInputEl.value?.focus()
    searchInputEl.value?.select()
  })
}

function closeSearch(): void {
  searchOpen.value = false
  searchStatus.value = ''
  searchAddon?.clearDecorations()
  if (alive) {
    terminal?.focus()
  }
}

function runSearch(direction: 'next' | 'prev'): void {
  const query = searchQuery.value
  const addon = ensureSearchAddon()
  if (!query || !addon) {
    searchStatus.value = ''
    return
  }
  const found = direction === 'prev' ? addon.findPrevious(query) : addon.findNext(query)
  searchStatus.value = found ? '' : t('terminal.searchEmpty', 'No matches')
}

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSearch()
    return
  }
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault()
    runSearch(event.shiftKey ? 'prev' : 'next')
  }
}

function onHostMouseUp(): void {
  if (!props.copyOnSelect || !terminal?.hasSelection()) {
    return
  }
  void copySelection()
}

async function copySelection(): Promise<void> {
  const text = resolveMenuSelectionText()
  if (!text || !alive) {
    return
  }
  const copied = await copyTextToClipboard(text)
  if (!alive || !copied) {
    return
  }
  emit('action', 'copy')
}

async function pasteFromClipboard(): Promise<void> {
  if (!alive || !terminal || !props.inputEnabled) {
    return
  }
  terminal.focus()
  const textarea = terminal.element?.querySelector('textarea')
  if (textarea instanceof HTMLTextAreaElement) {
    textarea.focus()
  }
  const text = await readClipboardText()
  if (!alive || !text || !terminal) {
    return
  }
  terminal.paste(text)
  emit('action', 'paste')
}

function onTerminalContextMenu(): void {
  void beginClipboardPrefetch()
  const term = terminal
  if (!term) return
  const selected = Boolean(term.hasSelection())
  if (selected && props.rightClickSelectsWord) {
    // 这一下右键先别把滚选缩成一个词。target 阶段读到 false，事件结束再恢复。
    term.options.rightClickSelectsWord = false
    queueMicrotask(() => {
      if (alive && terminal) terminal.options.rightClickSelectsWord = props.rightClickSelectsWord
    })
  }
  if (hasSelection.value !== selected) hasSelection.value = selected
  if (!selected) menuSelectionText = ''
  scheduleSelectionText()
}

function selectAll(): void {
  terminal?.selectAll()
  syncSelectionState()
  emit('action', 'selectAll')
}

function clearTerminal(): void {
  clear()
  emit('action', 'clear')
}

async function runTerminalAction(action: RsTerminalAction): Promise<void> {
  if (action === 'copy') {
    await copySelection()
    return
  }
  if (action === 'paste') {
    await pasteFromClipboard()
    return
  }
  if (action === 'selectAll') {
    selectAll()
    return
  }
  if (action === 'clear') {
    clearTerminal()
    return
  }
  if (action === 'search') {
    openSearch()
    emit('action', 'search')
    return
  }
  if (action === 'askAi') {
    const text = resolveMenuSelectionText()
    emit('askAi', text)
    emit('action', 'askAi')
  }
}

const BUILTIN_TERMINAL_ACTIONS = new Set<string>([
  'copy',
  'paste',
  'selectAll',
  'clear',
  'askAi',
  'search',
])

function onContextMenuSelect(key: string): void {
  if (BUILTIN_TERMINAL_ACTIONS.has(key)) {
    void runTerminalAction(key as RsTerminalAction)
    return
  }
  emit('extraSelect', key)
}

// xterm 只有一个 handler 槽位且无法卸载，所以恒定挂载、由 handler 内部实时读 props.shortcuts，
// 这样该 prop 关得掉也开得回来。
function attachShortcuts(): void {
  if (!terminal) {
    return
  }
  terminal.attachCustomKeyEventHandler((event) => {
    if (!props.shortcuts || event.type !== 'keydown') {
      return true
    }
    const mod = event.metaKey || event.ctrlKey
    if (!mod) {
      return true
    }
    const key = event.key.toLowerCase()
    if (key === 'c' && terminal?.hasSelection()) {
      event.preventDefault()
      event.stopPropagation()
      void copySelection()
      return false
    }
    if (key === 'v') {
      event.preventDefault()
      event.stopPropagation()
      void pasteFromClipboard()
      return false
    }
    if (key === 'a') {
      event.preventDefault()
      event.stopPropagation()
      selectAll()
      return false
    }
    if (key === 'k') {
      event.preventDefault()
      event.stopPropagation()
      clearTerminal()
      return false
    }
    if (key === 'f' && props.searchEnabled) {
      event.preventDefault()
      event.stopPropagation()
      openSearch()
      return false
    }
    return true
  })
}

// 逐项 watch：改字体会让 xterm 清空 WidthCache 并全量重测，不能被其他 prop 的变化连带触发。
watch(
  () => [props.fontFamily, props.fontSize, props.fontWeight, props.fontWeightBold] as const,
  () => {
    if (!terminal) {
      return
    }
    terminal.options.fontFamily = resolveTerminalFontFamily()
    terminal.options.fontSize = resolveTerminalFontSize()
    terminal.options.fontWeight = resolveTerminalFontWeight()
    terminal.options.fontWeightBold = resolveTerminalFontWeightBold()
    void fit()
  },
)

watch(() => props.cursorBlink, syncCursorBlink)

watch(
  () => props.cursorStyle,
  (value) => {
    if (terminal) {
      terminal.options.cursorStyle = value
    }
  },
)

watch(() => props.inputEnabled, syncInputEnabled)

watch(regionLabel, labelTerminalInput)

watch(searchQuery, () => {
  searchStatus.value = ''
})

watch(
  () => props.screenReaderMode,
  (value) => {
    if (terminal) {
      terminal.options.screenReaderMode = value
    }
  },
)

watch(
  () => props.rescaleOverlappingGlyphs,
  (value) => {
    if (terminal) {
      terminal.options.rescaleOverlappingGlyphs = value
    }
  },
)

watch(
  () => props.searchEnabled,
  (value) => {
    if (!value) {
      closeSearch()
    }
  },
)

watch(
  () => props.convertEol,
  (value) => {
    if (terminal) {
      terminal.options.convertEol = value
    }
  },
)

watch(
  () => props.scrollback,
  (value) => {
    if (terminal) {
      terminal.options.scrollback = value
    }
  },
)

watch(
  () => props.rightClickSelectsWord,
  (value) => {
    if (terminal) {
      terminal.options.rightClickSelectsWord = value
    }
  },
)

watch(
  () => [props.allowTransparency, props.zebraStripes] as const,
  () => {
    if (!terminal) {
      return
    }
    terminal.options.allowTransparency = resolveAllowTransparency()
    void fit()
  },
)

// deep 只用于 theme 这一个对象 prop，避免把内联字面量的重建放大成全量重设。
watch(() => [props.themeMode, props.theme] as const, refreshResolvedTheme, { deep: true })

watch(() => props.wheelScrollModifier, attachWheelGuard)

watch(
  () => props.minimumContrastRatio,
  (value) => {
    if (terminal) {
      terminal.options.minimumContrastRatio = value
    }
  },
)

function releaseDisposable(handle: Disposable | null): void {
  handle?.dispose()
}

function openTerminalLink(raw: string): void {
  const text = raw.trim()
  if (!alive || !isSafeTerminalLink(text)) {
    return
  }
  emit('link', text)
  if (!props.openLinks || typeof window === 'undefined') {
    return
  }
  window.open(text, '_blank', 'noopener,noreferrer')
}

function attachLinkProvider(): void {
  if (!terminal) {
    return
  }
  linkDisposable = terminal.registerLinkProvider({
    provideLinks(bufferLineNumber, callback) {
      const term = terminal
      if (!alive || !term) {
        callback(undefined)
        return
      }
      const row = term.buffer.active.getLine(bufferLineNumber - 1)
      if (!row) {
        callback(undefined)
        return
      }
      const text = row.translateToString(true)
      const hits = findTerminalHttpLinks(text)
      if (!hits.length) {
        callback(undefined)
        return
      }
      const cells: Array<{ chars: string; width: number }> = []
      for (let index = 0; index < row.length; index += 1) {
        const cell = row.getCell(index)
        cells.push({
          chars: cell?.getChars() || '',
          width: cell?.getWidth() ?? 1,
        })
      }
      callback(
        hits.map((hit) => {
          const range = terminalLinkCellRange(cells, hit.start, hit.end)
          return {
            text: hit.text,
            range: {
              start: { x: range.startX, y: bufferLineNumber },
              end: { x: range.endX, y: bufferLineNumber },
            },
            activate(_event: MouseEvent, uri: string) {
              openTerminalLink(uri)
            },
          }
        }),
      )
    },
  })
}

function attachMotionPreference(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }
  motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionMedia.addEventListener('change', onMotionPreference)
}

function detachMotionPreference(): void {
  motionMedia?.removeEventListener('change', onMotionPreference)
  motionMedia = null
}

onMounted(async () => {
  alive = true
  if (!hostEl.value) {
    return
  }
  refreshResolvedTheme()
  terminal = new Terminal({
    cursorBlink: props.cursorBlink && !prefersReducedMotion(),
    cursorStyle: props.cursorStyle,
    disableStdin: !props.inputEnabled,
    fontFamily: resolveTerminalFontFamily(),
    fontSize: resolveTerminalFontSize(),
    fontWeight: resolveTerminalFontWeight(),
    fontWeightBold: resolveTerminalFontWeightBold(),
    lineHeight: TERMINAL_LINE_HEIGHT,
    letterSpacing: 0,
    allowTransparency: resolveAllowTransparency(),
    drawBoldTextInBrightColors: true,
    minimumContrastRatio: props.minimumContrastRatio,
    scrollback: props.scrollback,
    convertEol: props.convertEol,
    rightClickSelectsWord: props.rightClickSelectsWord,
    screenReaderMode: props.screenReaderMode,
    rescaleOverlappingGlyphs: props.rescaleOverlappingGlyphs,
    theme: buildXtermTheme(),
    linkHandler: {
      activate(_event, text) {
        openTerminalLink(text)
      },
    },
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  if (props.searchEnabled) {
    ensureSearchAddon()
  }
  terminal.open(hostEl.value)
  labelTerminalInput()
  dataDisposable = terminal.onData((data: string) => {
    if (alive && props.inputEnabled) {
      emit('data', data)
    }
  })
  selectionDisposable = terminal.onSelectionChange(() => {
    if (!alive || !terminal) return
    const selected = Boolean(terminal.hasSelection())
    if (hasSelection.value !== selected) hasSelection.value = selected
    scheduleSelectionText()
  })
  titleDisposable = terminal.onTitleChange((title: string) => {
    if (alive) {
      emit('titleChange', title)
    }
  })
  bellDisposable = terminal.onBell(() => {
    if (alive) {
      emit('bell')
    }
  })
  attachLinkProvider()
  attachShortcuts()
  attachMotionPreference()
  await nextTick()
  if (!alive || !terminal || !hostEl.value) {
    return
  }
  attachWheelGuard()
  terminalReady.value = true
  await fit()
  if (!alive || !terminal || !hostEl.value) {
    return
  }
  emit('ready')

  resizeObserver = new ResizeObserver(() => {
    scheduleFit()
  })
  resizeObserver.observe(hostEl.value)
  unsubscribeTheme = subscribeTerminalTheme(() => {
    if (alive && props.themeMode === 'auto') {
      refreshResolvedTheme()
    }
  })
})

onBeforeUnmount(() => {
  alive = false
  unsubscribeTheme?.()
  unsubscribeTheme = null
  detachMotionPreference()
  resizeObserver?.disconnect()
  resizeObserver = null
  detachWheelGuard?.()
  detachWheelGuard = null
  if (fitRaf) {
    cancelAnimationFrame(fitRaf)
    fitRaf = 0
  }
  if (selectionFrame) {
    cancelAnimationFrame(selectionFrame)
    selectionFrame = 0
  }
  releaseDisposable(dataDisposable)
  releaseDisposable(selectionDisposable)
  releaseDisposable(titleDisposable)
  releaseDisposable(bellDisposable)
  releaseDisposable(linkDisposable)
  dataDisposable = null
  selectionDisposable = null
  titleDisposable = null
  bellDisposable = null
  linkDisposable = null
  searchAddon?.dispose?.()
  searchAddon = null
  terminal?.dispose()
  terminal = null
  fitAddon = null
  didInitialFit = false
})

const exposed: RsTerminalExpose = {
  write,
  clear,
  focus,
  fit,
  copySelection,
  pasteFromClipboard,
  selectAll,
  getSelection: getSelectionText,
  hasSelection: () => hasSelection.value,
  getGeometry: currentGeometry,
  getTerminal: () => terminal,
}

defineExpose(exposed)
</script>

<template>
  <RsContextMenu
    :disabled="!contextMenu"
    :items="contextMenuItems"
    @select="onContextMenuSelect"
  >
    <section
      v-bind="$attrs"
      :id="id"
      class="rs-terminal"
      :class="{
        'rs-terminal--zebra': zebraStripes,
      }"
      :style="zebraStyle"
      dir="ltr"
      :aria-label="regionLabel"
      :aria-busy="showLoading ? 'true' : undefined"
      :aria-readonly="inputEnabled ? undefined : 'true'"
      @click="focus"
      @contextmenu.capture="onTerminalContextMenu"
    >
      <div
        v-if="searchEnabled && searchOpen"
        class="rs-terminal__search"
        role="search"
        @click.stop
      >
        <input
          ref="searchInputEl"
          v-model="searchQuery"
          class="rs-terminal__search-input"
          type="search"
          enterkeyhint="search"
          :placeholder="t('terminal.searchPlaceholder', 'Find in terminal')"
          :aria-label="t('terminal.search', 'Search')"
          :aria-describedby="searchStatus ? searchStatusId : undefined"
          @keydown="onSearchKeydown"
        >
        <button type="button" class="rs-terminal__search-btn" @click="runSearch('prev')">
          {{ t('terminal.searchPrev', 'Previous') }}
        </button>
        <button type="button" class="rs-terminal__search-btn" @click="runSearch('next')">
          {{ t('terminal.searchNext', 'Next') }}
        </button>
        <button type="button" class="rs-terminal__search-btn" @click="closeSearch">
          {{ t('terminal.searchClose', 'Close search') }}
        </button>
        <output
          v-if="searchStatus"
          :id="searchStatusId"
          class="rs-terminal__search-status"
        >
          {{ searchStatus }}
        </output>
      </div>
      <div ref="hostEl" class="rs-terminal__host" @mouseup="onHostMouseUp" />
      <RsLoading v-if="showLoading" class="rs-terminal__loading" />
      <output
        v-if="overlay || $slots.overlayAction"
        class="rs-terminal__overlay"
        :class="{ 'rs-terminal__overlay--interactive': Boolean($slots.overlayAction) }"
      >
        <span v-if="overlay">{{ overlay }}</span>
        <div v-if="$slots.overlayAction" class="rs-terminal__overlay-action">
          <slot name="overlayAction" />
        </div>
      </output>
    </section>
  </RsContextMenu>
</template>

<style scoped>
.rs-terminal {
  position: relative;
  height: 100%;
  min-height: 0;
  /* 作为 flex/grid 项时，xterm 行盒的固有宽度不得撑开轨道，
     否则容器收窄后列数降不下来、行尾字符会被 overflow 裁掉。 */
  min-width: 0;
  border: 1px solid var(--rs-terminal-border);
  border-radius: var(--rs-radius-md);
  background: var(--rs-terminal-shell-bg, var(--rs-terminal-bg));
  color: var(--rs-terminal-fg);
  box-shadow: var(--rs-shadow-sm);
  overflow: hidden;
}

.rs-terminal__host {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  /* FitAddon 取整余量露底时，与单元格同色（勿用 shell 灰底） */
  background: var(--rs-terminal-bg);
}

.rs-terminal__loading,
.rs-terminal__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rs-terminal__overlay {
  flex-direction: column;
  gap: var(--rs-space-sm);
  padding: var(--rs-space-lg);
  color: var(--rs-terminal-fg);
  background: color-mix(in srgb, var(--rs-terminal-bg) 84%, transparent);
  text-align: center;
  pointer-events: none;
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  line-height: var(--rs-line-height-normal);
}

.rs-terminal__overlay--interactive {
  pointer-events: auto;
}

.rs-terminal__overlay-action {
  pointer-events: auto;
}

.rs-terminal__search {
  position: absolute;
  inset-block-start: var(--rs-space-xs);
  inset-inline-end: var(--rs-space-xs);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  max-inline-size: calc(100% - var(--rs-space-sm));
  gap: var(--rs-space-xs);
  padding: var(--rs-space-xs);
  border: 1px solid var(--rs-terminal-border);
  border-radius: var(--rs-radius-sm);
  background: color-mix(in srgb, var(--rs-terminal-bg) 92%, transparent);
}

.rs-terminal__search-input {
  inline-size: 12rem;
  max-inline-size: 100%;
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-xs);
  border: 1px solid var(--rs-terminal-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-terminal-bg);
  color: var(--rs-terminal-fg);
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-xs);
  outline: none;
}

.rs-terminal__search-input:focus-visible,
.rs-terminal__search-btn:focus-visible {
  outline: var(--rs-focus-ring-width, 2px) solid var(--rs-focus-border);
  outline-offset: 1px;
}

.rs-terminal__search-btn {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-xs);
  border: 1px solid var(--rs-terminal-border);
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-terminal-fg);
  font-size: var(--rs-font-size-xs);
  cursor: pointer;
}

.rs-terminal__search-status {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
}

/*
 * letter-spacing 必须在终端内归零：宿主应用常在祖先上设负字距（NiuMa 的 .nm-app 是 -0.011em）。
 * 它会继承进 xterm 隐藏的字宽测量元素（.xterm-helpers 下的 WidthCache），使 offsetWidth 量到的
 * 字形比实际渲染窄；而 CharSizeService 走 canvas measureText 不受 CSS 影响、单元格宽是准的。
 * DOM 渲染器于是按 `cellWidth - 测量值` 给每个字符补正字距，行盒却仍是 cols × cellWidth，
 * 逐列累积后整行溢出十几到几十像素，被行盒的 overflow:hidden 切掉行尾几个字符。
 */
.rs-terminal :deep(.xterm) {
  width: 100%;
  height: 100%;
  line-height: normal;
  letter-spacing: normal;
}

/*
 * xterm 6 官方仍给空的 .xterm-viewport 写 overflow-y:scroll + 背景 #000。
 * 真正滚动的是 .xterm-scrollable-element；空层滚动条会挡住最后一列。
 */
.rs-terminal :deep(.xterm .xterm-viewport) {
  overflow: hidden;
  background-color: transparent;
}

/*
 * xterm 兜底的滑块是占满 14px 轨道的直角块，配色取终端前景色 20% 不透明度，与 RsScrollbar
 * 的圆角胶囊不一致。轨道宽度由 overviewRuler.width 决定，改它会给每个终端实例多建一块
 * overview ruler 画布，因此只重绘滑块：热区仍是 14px，靠透明边框内缩出 10px 可见胶囊。
 */
.rs-terminal :deep(.xterm-scrollable-element > .scrollbar > .slider) {
  box-sizing: border-box;
  border: var(--rs-scrollbar-padding, 2px) solid transparent;
  border-radius: var(--rs-radius-full);
  background-color: color-mix(in srgb, var(--rs-muted) 60%, transparent);
  background-clip: padding-box;
  transition: background-color var(--rs-transition-fast);
}

@media (prefers-reduced-motion: reduce) {
  .rs-terminal :deep(.xterm-scrollable-element > .scrollbar > .slider) {
    transition: none;
  }
}

@media (forced-colors: active) {
  .rs-terminal {
    background: Canvas;
    color: CanvasText;
    border-color: ButtonText;
    box-shadow: none;
  }

  .rs-terminal__search-input:focus-visible,
  .rs-terminal__search-btn:focus-visible {
    outline: var(--rs-focus-ring-width, 2px) solid Highlight;
  }
}

.rs-terminal :deep(.xterm-scrollable-element > .scrollbar > .slider:hover) {
  background-color: color-mix(in srgb, var(--rs-primary) 40%, var(--rs-muted));
}

.rs-terminal :deep(.xterm-scrollable-element > .scrollbar > .slider.active) {
  background-color: color-mix(in srgb, var(--rs-primary) 55%, var(--rs-muted));
}

.rs-terminal--zebra :deep(.xterm-rows),
.rs-terminal--zebra :deep(.xterm-rows > div),
.rs-terminal--zebra :deep(.xterm-row) {
  background-color: transparent !important;
}

.rs-terminal--zebra :deep(.xterm-scrollable-element) {
  background-color: transparent !important;
  background-image: repeating-linear-gradient(
    to bottom,
    var(--rs-terminal-bg) 0,
    var(--rs-terminal-bg) var(--rs-terminal-zebra-step, 1lh),
    var(--rs-terminal-row-stripe) var(--rs-terminal-zebra-step, 1lh),
    var(--rs-terminal-row-stripe) calc(var(--rs-terminal-zebra-step, 1lh) * 2)
  );
  background-attachment: local;
}

.rs-terminal--zebra :deep(.xterm-screen) {
  background-color: transparent !important;
}

.rs-terminal :deep(.xterm-fg-257) {
  color: var(--rs-terminal-bg) !important;
}

.rs-terminal :deep(.xterm-bg-257) {
  background-color: var(--rs-terminal-fg) !important;
}
</style>
