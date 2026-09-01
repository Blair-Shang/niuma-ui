import { placeAnchoredPopup, stepEnabledIndex } from './overlay-utils'

export interface RsMentionOption {
  label: string
  value: string
  disabled?: boolean
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
] as const

export interface RsTextareaCaretMeter {
  measure: (textarea: HTMLTextAreaElement, index: number) => RsMentionCaretBox
  dispose: () => void
}

/** 复用隐藏镜像节点，避免每次按键 insert/remove 逼 reflow。 */
export function createTextareaCaretMeter(): RsTextareaCaretMeter {
  let mirror: HTMLDivElement | null = null
  let marker: HTMLSpanElement | null = null

  function ensure(): { mirror: HTMLDivElement; marker: HTMLSpanElement } {
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
    s.left = '-9999px'
    marker = document.createElement('span')
    marker.textContent = '.'
    document.body.appendChild(mirror)
    return { mirror, marker }
  }

  function measure(textarea: HTMLTextAreaElement, index: number): RsMentionCaretBox {
    const { mirror: box, marker: caret } = ensure()
    const style = window.getComputedStyle(textarea)
    for (const key of MIRROR_STYLE_KEYS) {
      box.style.setProperty(
        key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`),
        style[key],
      )
    }
    const text = textarea.value.slice(0, Math.max(0, index))
    box.textContent = text.endsWith('\n') ? `${text}\u00a0` : text
    box.appendChild(caret)
    const top = caret.offsetTop - textarea.scrollTop
    const left = caret.offsetLeft - textarea.scrollLeft
    const height = caret.offsetHeight || parseFloat(style.lineHeight) || 16
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
): RsMentionOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options.filter((item) => !item.disabled)
  return options.filter(
    (item) =>
      !item.disabled &&
      (item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)),
  )
}
