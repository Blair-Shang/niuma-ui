const FALLBACK_ROOT_PX = 16

function unwrapCssVar(raw: string, el: HTMLElement, depth = 0): string {
  if (!raw || depth > 8) {
    return raw
  }
  const match = /^var\(\s*(--[\w-]+)\s*(?:,\s*((?:.|\s)+))?\)$/.exec(raw)
  if (!match) {
    return raw
  }
  const inner = getComputedStyle(el).getPropertyValue(match[1]).trim()
  if (inner) {
    return unwrapCssVar(inner, el, depth + 1)
  }
  const fallback = (match[2] || '').trim()
  return fallback ? unwrapCssVar(fallback, el, depth + 1) : ''
}

/**
 * 读取已计算的 CSS 自定义属性（不含首尾空白）。
 * 会展开嵌套 `var(--token)`，便于 jsdom 与宿主覆盖。
 * SSR / 无 DOM 时返回空字符串。
 */
export function readCssVar(name: string, el?: HTMLElement | null): string {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return ''
  }
  const target = el ?? document.documentElement
  return unwrapCssVar(getComputedStyle(target).getPropertyValue(name).trim(), target)
}

/** 根元素字号（px），供 rem 换算；失败时按 16。 */
export function readRootFontSizePx(): number {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return FALLBACK_ROOT_PX
  }
  const n = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(n) && n > 0 ? n : FALLBACK_ROOT_PX
}

/**
 * 将 `12px` / `0.875rem` / 无单位数字解析为 px。
 * 嵌套 `var()` 须先经 getComputedStyle 展开。
 */
export function parseCssLengthToPx(raw: string, rootPx = readRootFontSizePx()): number | null {
  const value = raw.trim()
  if (!value) {
    return null
  }
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) {
    return null
  }
  if (value.endsWith('px') || /^-?[\d.]+$/.test(value)) {
    return n
  }
  if (value.endsWith('rem') || value.endsWith('em')) {
    return n * rootPx
  }
  return null
}

/** 读取长度类 token 并转为 px，供 Monaco / xterm 等只接受数字的 API。 */
export function readCssLengthPx(
  name: string,
  fallback: number,
  el?: HTMLElement | null,
): number {
  const parsed = parseCssLengthToPx(readCssVar(name, el))
  return parsed == null ? fallback : parsed
}

const CODE_FONT_FALLBACK = 'ui-monospace, SF Mono, Consolas, Liberation Mono, Menlo, monospace'

/** 代码编辑器字体族：`--rs-code-font-family` → `--rs-font-mono`。 */
export function readCodeFontFamily(el?: HTMLElement | null): string {
  return readCssVar('--rs-code-font-family', el) || readCssVar('--rs-font-mono', el) || CODE_FONT_FALLBACK
}

/** 代码编辑器字号（px）：`--rs-code-font-size`，缺省按 sm=14。 */
export function readCodeFontSizePx(el?: HTMLElement | null): number {
  return readCssLengthPx('--rs-code-font-size', 14, el)
}

/** 终端字体族：`--rs-terminal-font-family` → `--rs-font-mono`。 */
export function readTerminalFontFamily(el?: HTMLElement | null): string {
  return readCssVar('--rs-terminal-font-family', el) || readCssVar('--rs-font-mono', el) || CODE_FONT_FALLBACK
}

/** 终端字号（px）：`--rs-terminal-font-size`，缺省按 sm=14。 */
export function readTerminalFontSizePx(el?: HTMLElement | null): number {
  return readCssLengthPx('--rs-terminal-font-size', 14, el)
}

/** 终端字重：`--rs-terminal-font-weight`，缺省 regular。 */
export function readTerminalFontWeight(el?: HTMLElement | null): string {
  return readCssVar('--rs-terminal-font-weight', el) || readCssVar('--rs-font-weight-regular', el) || '400'
}

/** 终端粗体字重：`--rs-terminal-font-weight-bold`，缺省 medium。 */
export function readTerminalFontWeightBold(el?: HTMLElement | null): string {
  return (
    readCssVar('--rs-terminal-font-weight-bold', el) ||
    readCssVar('--rs-font-weight-medium', el) ||
    '500'
  )
}
