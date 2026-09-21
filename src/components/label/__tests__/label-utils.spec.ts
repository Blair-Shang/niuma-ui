import { describe, expect, it } from 'vitest'
import { resolveRsLabelFor, resolveRsLabelHintId, showRsLabelOptional } from '../src/label-utils'

describe('label-utils', () => {
  it('resolves htmlFor over forId over for', () => {
    expect(resolveRsLabelFor('a', 'b', 'c')).toBe('a')
    expect(resolveRsLabelFor(undefined, 'b', 'c')).toBe('b')
    expect(resolveRsLabelFor(undefined, undefined, 'c')).toBe('c')
    expect(resolveRsLabelFor()).toBeUndefined()
    expect(resolveRsLabelFor('', '', '')).toBeUndefined()
  })

  it('assigns a hint id only when hint content exists', () => {
    expect(resolveRsLabelHintId('hint-email', 'auto', true)).toBe('hint-email')
    expect(resolveRsLabelHintId(undefined, 'auto', true)).toBe('auto')
    expect(resolveRsLabelHintId('hint-email', 'auto', false)).toBeUndefined()
  })

  it('hides optional when required is set', () => {
    expect(showRsLabelOptional(true, true)).toBe(false)
    expect(showRsLabelOptional(false, true)).toBe(true)
    expect(showRsLabelOptional(false, false)).toBe(false)
  })
})
