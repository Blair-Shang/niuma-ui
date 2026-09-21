import { describe, expect, it } from 'vitest'
import {
  isRsButtonFilledVariant,
  placeRsButtonTip,
  resolveRsButtonTone,
  resolveRsButtonVariant,
  supportsRsButtonTone,
} from '../src/button-utils'

describe('button-utils', () => {
  it('resolves secondary as default and omitted as primary', () => {
    expect(resolveRsButtonVariant()).toBe('primary')
    expect(resolveRsButtonVariant('secondary')).toBe('default')
    expect(resolveRsButtonVariant('ghost')).toBe('ghost')
  })

  it('resolves tone orthogonal to variant', () => {
    expect(resolveRsButtonTone('default')).toBe('neutral')
    expect(resolveRsButtonTone('primary')).toBe('primary')
    expect(resolveRsButtonTone('link')).toBe('primary')
    expect(resolveRsButtonTone('danger')).toBe('danger')
    expect(resolveRsButtonTone('default', 'warning')).toBe('warning')
    expect(resolveRsButtonTone('primary', 'success')).toBe('success')
  })

  it('allows tone on every variant', () => {
    expect(supportsRsButtonTone('primary')).toBe(true)
    expect(supportsRsButtonTone('default')).toBe(true)
    expect(isRsButtonFilledVariant('default')).toBe(true)
    expect(isRsButtonFilledVariant('text')).toBe(false)
  })

  it('places the tip below when the viewport has room', () => {
    const box = placeRsButtonTip(
      { top: 80, left: 40, width: 80, height: 32 },
      { width: 72, height: 28 },
      { width: 800, height: 600 },
    )
    expect(box.top).toBe(118)
    expect(box.left).toBeGreaterThanOrEqual(6)
    expect(box.left + 72).toBeLessThanOrEqual(794)
  })

  it('flips the tip above when the bottom is tight', () => {
    const box = placeRsButtonTip(
      { top: 560, left: 40, width: 80, height: 32 },
      { width: 72, height: 28 },
      { width: 800, height: 600 },
    )
    expect(box.top).toBeLessThan(560)
  })
})
