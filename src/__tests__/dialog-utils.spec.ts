import { afterEach, describe, expect, it } from 'vitest'
import { resolveRsDialogCssWidth, resolveRsDialogWidthPx } from '../components/dialog-utils'

describe('resolveRsDialogWidthPx', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('font-size')
  })

  it('returns undefined for presets', () => {
    expect(resolveRsDialogWidthPx('sm')).toBeUndefined()
    expect(resolveRsDialogWidthPx('md')).toBeUndefined()
    expect(resolveRsDialogWidthPx('lg')).toBeUndefined()
  })

  it('keeps numeric and px widths', () => {
    expect(resolveRsDialogWidthPx(1200)).toBe(1200)
    expect(resolveRsDialogWidthPx('960px')).toBe(960)
  })

  it('converts rem using root font size', () => {
    document.documentElement.style.fontSize = '16px'
    expect(resolveRsDialogWidthPx('40rem')).toBe(640)
  })

  it('converts percent against the given viewport width', () => {
    expect(resolveRsDialogWidthPx('90%', 1000)).toBe(900)
    expect(resolveRsDialogWidthPx('80%', 800)).toBe(640)
  })

  it('returns undefined for empty or unknown units', () => {
    expect(resolveRsDialogWidthPx('')).toBeUndefined()
    expect(resolveRsDialogWidthPx('min(90vw, 1200px)')).toBeUndefined()
    expect(resolveRsDialogWidthPx(0)).toBeUndefined()
  })
})

describe('resolveRsDialogCssWidth', () => {
  it('maps number to px and keeps custom CSS strings', () => {
    expect(resolveRsDialogCssWidth('md')).toBeUndefined()
    expect(resolveRsDialogCssWidth(520)).toBe('520px')
    expect(resolveRsDialogCssWidth('90%')).toBe('90%')
  })
})
