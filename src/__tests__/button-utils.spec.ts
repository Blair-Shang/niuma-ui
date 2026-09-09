import { describe, expect, it } from 'vitest'
import {
  isRsButtonFilledVariant,
  resolveRsButtonTone,
  resolveRsButtonVariant,
  supportsRsButtonTone,
} from '../components/button-utils'

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
})
