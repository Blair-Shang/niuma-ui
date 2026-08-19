<script setup lang="ts">
import { FitAddon } from '@xterm/addon-fit'
import type { ITheme } from '@xterm/xterm'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import {
  readTerminalFontFamily,
  readTerminalFontSizePx,
  readTerminalFontWeight,
  readTerminalFontWeightBold,
} from '../theme/css-token'
import {
  beginClipboardPrefetch,
  copyTextToClipboard,
  readClipboardText,
} from '../utils/rs-clipboard'
import RsContextMenu from './RsContextMenu.vue'
import type { RsContextMenuItem } from './context-menu-utils'
import RsLoading from './RsLoading.vue'
import {
  containsTuiRefreshSequence,
  mergeTerminalTheme,
  prepareTerminalForPtyWrite,
  resolveTerminalTheme,
  terminalShortcutLabel,
  type RsTerminalAction,
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

// class / style 需要落在 .rs-terminal 上；根节点是 RsContextMenu 的 as-child 触发器，
// 交给自动透传会落到触发器上，消费方只能在外面再套一层控制尺寸。
defineOptions({ inheritAttrs: false })

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
     * 右键是否自动选中光标下单词。
     * SSH/vim/less 等 TUI 场景建议 false，避免冲掉用户已拖选的大段文本。
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
    rightClickSelectsWord: true,
    shortcuts: true,
    scrollback: 5000,
    convertEol: false,
    zebraStripes: true,
    wheelScrollModifier: 'none',
    snapViewportOnTuiWrite: true,
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
}>()

const { t } = useRsI18n()
const hostEl = ref<HTMLElement | null>(null)
const terminalReady = ref(false)
const hasSelection = ref(false)
/** 右键菜单打开瞬间的选区快照（capture 阶段，早于 xterm word-select） */
const menuSelectionSnapshot = ref('')
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
      disabled: false,
    },
    {
      key: 'paste',
      label: t('terminal.paste', 'Paste'),
      icon: 'clipboard-paste',
      shortcut: terminalShortcutLabel('V'),
    },
    {
      key: 'selectAll',
      label: t('terminal.selectAll', 'Select All'),
      icon: 'square-mouse-pointer',
      shortcut: terminalShortcutLabel('A'),
    },
  ]
  if (props.showAskAi) {
    items.push(
      { key: 'sep-ai', label: '', separator: true },
      {
        key: 'askAi',
        label: t('terminal.askAi', 'Ask AI'),
        icon: 'bot',
        disabled: !hasSelection.value && !menuSelectionSnapshot.value,
      },
    )
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

let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let detachWheelGuard: (() => void) | null = null
let lastGeometry = { cols: 0, rows: 0 }
let fitRaf = 0
let didInitialFit = false

function resolveAllowTransparency(): boolean {
  return props.allowTransparency || props.zebraStripes
}

function buildXtermTheme(): ITheme {
  // 主题背景保持不透明：反色行 (xterm-fg/bg-257) 依赖 opaque(background)；
  // 斑马纹通过 allowTransparency 让默认单元格透出底层 CSS 渐变。
  return mergeTerminalTheme(resolvedThemeMode.value, props.theme)
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
  resolvedThemeMode.value = resolveTerminalTheme(props.themeMode)
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
  if (!fitAddon || !terminal || !hostEl.value) {
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
  if (!fitAddon || !terminal) {
    return
  }
  try {
    fitAddon.fit()
  } catch {
    return
  }
  didInitialFit = true
  emitResizeIfChanged()
  syncZebraRowStepFromDom()
  syncResolvedFontSize()
}

function scheduleFit(): void {
  if (fitRaf) {
    return
  }
  fitRaf = requestAnimationFrame(() => {
    fitRaf = 0
    void fit()
  })
}

function write(data: string): void {
  const term = terminal
  if (!term) {
    return
  }
  if (props.snapViewportOnTuiWrite && containsTuiRefreshSequence(data)) {
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
  hasSelection.value = Boolean(terminal?.hasSelection())
  emit('selectionChange', getSelectionText())
}

/** 优先活选区；若被右键 word-select / 失焦冲掉，则回退菜单快照。 */
function resolveMenuSelectionText(): string {
  const live = getSelectionText().trim()
  const snap = menuSelectionSnapshot.value.trim()
  if (live && (!snap || live.length >= snap.length)) {
    return live
  }
  return snap
}

async function copySelection(): Promise<void> {
  const text = resolveMenuSelectionText()
  if (!text) {
    return
  }
  if (await copyTextToClipboard(text)) {
    emit('action', 'copy')
  }
}

async function pasteFromClipboard(): Promise<void> {
  if (!terminal || !props.inputEnabled) {
    return
  }
  terminal.focus()
  const textarea = terminal.element?.querySelector('textarea')
  if (textarea instanceof HTMLTextAreaElement) {
    textarea.focus()
  }
  const text = await readClipboardText()
  if (!text) {
    return
  }
  terminal.paste(text)
  emit('action', 'paste')
}

function onTerminalContextMenu(): void {
  void beginClipboardPrefetch()
  // capture 早于 xterm 的 rightClickSelectsWord，先保住用户拖选（vim/less 大段文本）
  const existing = getSelectionText().trim()
  if (existing) {
    menuSelectionSnapshot.value = existing
    hasSelection.value = true
  } else {
    menuSelectionSnapshot.value = ''
  }
  // xterm 在 target 阶段才 rightClickSelect，延后同步；无先验选区时采用 word-select 结果
  void nextTick(() => {
    syncSelectionState()
    const after = getSelectionText().trim()
    // 仅在无快照，或 word-select 反而选出更长文本时更新；避免冲掉用户拖选
    if (after && (!menuSelectionSnapshot.value || after.length > menuSelectionSnapshot.value.length)) {
      menuSelectionSnapshot.value = after
    }
    if (menuSelectionSnapshot.value) {
      hasSelection.value = true
    }
  })
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
  if (action === 'askAi') {
    const text = resolveMenuSelectionText()
    emit('askAi', text)
    emit('action', 'askAi')
  }
}

function onContextMenuSelect(key: string): void {
  void runTerminalAction(key as RsTerminalAction)
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

watch(
  () => props.cursorBlink,
  (value) => {
    if (terminal) {
      terminal.options.cursorBlink = value
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

onMounted(async () => {
  if (!hostEl.value) {
    return
  }
  refreshResolvedTheme()
  terminal = new Terminal({
    cursorBlink: props.cursorBlink,
    fontFamily: resolveTerminalFontFamily(),
    fontSize: resolveTerminalFontSize(),
    fontWeight: resolveTerminalFontWeight(),
    fontWeightBold: resolveTerminalFontWeightBold(),
    lineHeight: TERMINAL_LINE_HEIGHT,
    letterSpacing: 0,
    allowTransparency: resolveAllowTransparency(),
    drawBoldTextInBrightColors: true,
    scrollback: props.scrollback,
    convertEol: props.convertEol,
    rightClickSelectsWord: props.rightClickSelectsWord,
    theme: buildXtermTheme(),
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(hostEl.value)
  terminal.onData((data: string) => {
    if (props.inputEnabled) {
      emit('data', data)
    }
  })
  terminal.onSelectionChange(() => {
    syncSelectionState()
  })
  attachShortcuts()
  await nextTick()
  attachWheelGuard()
  terminalReady.value = true
  await fit()
  emit('ready')

  resizeObserver = new ResizeObserver(() => {
    scheduleFit()
  })
  resizeObserver.observe(hostEl.value)

  themeObserver = new MutationObserver(() => {
    if (props.themeMode === 'auto') {
      refreshResolvedTheme()
    }
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-rs-theme'],
  })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  resizeObserver?.disconnect()
  resizeObserver = null
  detachWheelGuard?.()
  detachWheelGuard = null
  if (fitRaf) {
    cancelAnimationFrame(fitRaf)
    fitRaf = 0
  }
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
      class="rs-terminal"
      :class="{ 'rs-terminal--zebra': zebraStripes }"
      :style="zebraStyle"
      @click="focus"
      @contextmenu.capture="onTerminalContextMenu"
    >
      <div ref="hostEl" class="rs-terminal__host" />
      <RsLoading v-if="showLoading" class="rs-terminal__loading" />
      <output v-if="overlay" class="rs-terminal__overlay">
        {{ overlay }}
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
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rs-terminal-fg) 5%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--rs-terminal-fg) 4%, transparent),
    0 1px 3px color-mix(in srgb, #000 32%, transparent);
  overflow: hidden;
}

[data-rs-theme='light'] .rs-terminal {
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 80%, transparent),
    inset 0 0 0 1px color-mix(in srgb, #000 4%, transparent),
    0 1px 4px color-mix(in srgb, #000 8%, transparent);
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
  padding: var(--rs-space-lg);
  color: color-mix(in srgb, var(--rs-terminal-fg) 92%, #fff 8%);
  background: color-mix(in srgb, var(--rs-terminal-bg) 84%, transparent);
  text-align: center;
  pointer-events: none;
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  line-height: var(--rs-line-height-normal);
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
