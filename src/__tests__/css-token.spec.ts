import { afterEach, describe, expect, it } from 'vitest'
import {
  parseCssLengthToPx,
  readCodeFontFamily,
  readCodeFontSizePx,
  readCssLengthPx,
  readCssVar,
  readTerminalFontFamily,
  readTerminalFontSizePx,
  readTerminalFontWeight,
  readTerminalFontWeightBold,
} from '../theme/css-token'

describe('css-token', () => {
  afterEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('parses px / rem / unitless lengths', () => {
    expect(parseCssLengthToPx('12px', 16)).toBe(12)
    expect(parseCssLengthToPx('0.875rem', 16)).toBe(14)
    expect(parseCssLengthToPx('1.5em', 16)).toBe(24)
    expect(parseCssLengthToPx('14', 16)).toBe(14)
    expect(parseCssLengthToPx('var(--x)', 16)).toBeNull()
  })

  it('reads and unwraps nested custom properties', () => {
    const root = document.documentElement
    root.style.setProperty('--rs-font-size-sm', '0.875rem')
    root.style.setProperty('--rs-code-font-size', 'var(--rs-font-size-sm)')
    root.style.setProperty('--rs-font-mono', 'JetBrains Mono, monospace')
    root.style.setProperty('--rs-code-font-family', 'var(--rs-font-mono)')
    root.style.setProperty('--rs-font-weight-regular', '400')
    root.style.setProperty('--rs-terminal-font-weight', 'var(--rs-font-weight-regular)')

    expect(readCssVar('--rs-code-font-size')).toBe('0.875rem')
    expect(readCssLengthPx('--rs-code-font-size', 99)).toBe(14)
    expect(readCodeFontSizePx()).toBe(14)
    expect(readCodeFontFamily()).toBe('JetBrains Mono, monospace')
    expect(readTerminalFontWeight()).toBe('400')
  })

  it('falls back when tokens are missing', () => {
    expect(readCodeFontSizePx()).toBe(14)
    expect(readTerminalFontSizePx()).toBe(14)
    expect(readCodeFontFamily()).toContain('monospace')
    expect(readTerminalFontFamily()).toContain('monospace')
    expect(readTerminalFontWeight()).toBe('400')
    expect(readTerminalFontWeightBold()).toBe('500')
  })
})
