import { placeAnchoredPopup, stepEnabledIndex } from '../../_shared/src/overlay-utils'

export interface RsMentionOption {
  label: string
  value: string
  disabled?: boolean
  title?: string
}

export type RsMentionOptionInput = string | RsMentionOption

export type RsMentionFilterOption =
  | boolean
  | ((query: string, option: RsMentionOption) => boolean)

export function normalizeRsMentionOptions(
  options: ReadonlyArray<RsMentionOptionInput> | undefined,
): RsMentionOption[] {
  if (!options?.length) return []
  return options.map((item) =>
    typeof item === 'string' ? { label: item, value: item } : { ...item },
  )
}

export interface RsMentionActive {
  prefix: string
  query: string
  start: number
  end: number
}

export function resolveMentionPrefixes(prefix: string | readonly string[]): string[] {
  const list = Array.isArray(prefix) ? prefix : [prefix]
  return list.map(String).filter(Boolean)
}

/** 光标前最近一个前缀 + 查询词（不含空格） */
export function findActiveMention(
  text: string,
  cursor: number,
  prefixes: readonly string[],
  split = ' ',
): RsMentionActive | null {
  const head = text.slice(0, Math.max(0, cursor))
  let found: RsMentionActive | null = null
  for (const token of prefixes) {
    const at = head.lastIndexOf(token)
    if (at < 0) continue
    const after = head.slice(at + token.length)
    if (after.includes(split) || after.includes('\n')) continue
    if (!found || at > found.start) {
      found = { prefix: token, query: after, start: at, end: cursor }
    }
  }
  return found
}

export function applyMention(
  text: string,
  active: RsMentionActive,
  value: string,
  split = ' ',
): { text: string; cursor: number } {
  const insert = `${active.prefix}${value}${split}`
  const next = `${text.slice(0, active.start)}${insert}${text.slice(active.end)}`
  return { text: next, cursor: active.start + insert.length }
}

export interface RsMentionCaretBox {
  top: number
  left: number
  height: number
}

export interface RsMentionPopupBox {
  top: number
  left: number
  placement: 'top' | 'bottom'
}

export function stepMentionIndex(
  options: readonly RsMentionOption[],
  current: number,
  delta: 1 | -1,
): number {
  return stepEnabledIndex(options, current, delta)
}

/** 视口内避让：下边不够就翻到上方，左右夹进窗口。 */
export function placeMentionPopup(
  caret: RsMentionCaretBox,
  popup: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 4,
): RsMentionPopupBox {
  const box = placeAnchoredPopup(caret, popup, viewport, gap)
  return { top: box.top, left: box.left, placement: box.placement }
}

const MIRROR_STYLE_KEYS = [
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontFamily',
  'letterSpacing',
  'textIndent',
  'textTransform',
  'wordSpacing',
  'tabSize',
  'lineHeight',
  'whiteSpace',
  'wordWrap',
  'direction',
] as const

export interface RsTextareaCaretMeter {
  measure: (textarea: HTMLTextAreaElement, index: number) => RsMentionCaretBox
  dispose: () => void
}

/** 复用隐藏镜像节点，避免每次按键 insert/remove 逼 reflow。 */
export function createTextareaCaretMeter(): RsTextareaCaretMeter {
  let mirror: HTMLDivElement | null = null
  let marker: HTMLSpanElement | null = null

  function ensure(): { mirror: HTMLDivElement; marker: HTMLSpanElement } | null {
    if (typeof document === 'undefined') return null
    if (mirror && marker) return { mirror, marker }
    mirror = document.createElement('div')
    mirror.setAttribute('aria-hidden', 'true')
    const s = mirror.style
    s.position = 'absolute'
    s.visibility = 'hidden'
    s.pointerEvents = 'none'
    s.whiteSpace = 'pre-wrap'
    s.wordWrap = 'break-word'
    s.top = '0'
    s.insetInlineStart = '-9999px'
    marker = document.createElement('span')
    marker.textContent = '.'
    document.body.appendChild(mirror)
    return { mirror, marker }
  }

  function measure(textarea: HTMLTextAreaElement, index: number): RsMentionCaretBox {
    const nodes = ensure()
    if (!nodes) return { top: 0, left: 0, height: 16 }
    const { mirror: box, marker: caret } = nodes
    const style = window.getComputedStyle(textarea)
    for (const key of MIRROR_STYLE_KEYS) {
      box.style.setProperty(
        key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`),
        style[key],
      )
    }
    box.dir = textarea.dir || document.documentElement.dir || 'ltr'
    const text = textarea.value.slice(0, Math.max(0, index))
    box.textContent = text.endsWith('\n') ? `${text}\u00a0` : text
    box.appendChild(caret)
    const top = caret.offsetTop - textarea.scrollTop
    const left = caret.offsetLeft - textarea.scrollLeft
    const height = caret.offsetHeight || Number.parseFloat(style.lineHeight) || 16
    return { top, left, height }
  }

  function dispose(): void {
    mirror?.remove()
    mirror = null
    marker = null
  }

  return { measure, dispose }
}

/** 相对 textarea 内容区的光标坐标（已扣滚动）。测试 / 单次调用用；热路径请复用 meter。 */
export function measureTextareaCaret(
  textarea: HTMLTextAreaElement,
  index: number,
): RsMentionCaretBox {
  const meter = createTextareaCaretMeter()
  try {
    return meter.measure(textarea, index)
  } finally {
    meter.dispose()
  }
}

export function filterMentionOptions(
  options: readonly RsMentionOption[],
  query: string,
  filterOption?: RsMentionFilterOption,
): RsMentionOption[] {
  if (filterOption === false) return options.slice()
  const q = query.trim()
  if (typeof filterOption === 'function') {
    return options.filter((item) => filterOption(q, item))
  }
  if (!q) return options.slice()
  const lower = q.toLowerCase()
  return options.filter(
    (item) =>
      item.label.toLowerCase().includes(lower) || item.value.toLowerCase().includes(lower),
  )
}
