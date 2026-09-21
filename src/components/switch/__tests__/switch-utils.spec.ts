import { describe, expect, it } from 'vitest'
import { resolveRsSwitchChecked, resolveRsSwitchNext } from '../src/switch-utils'

describe('switch-utils', () => {
  it('matches checked with Object.is', () => {
    expect(resolveRsSwitchChecked(true, true)).toBe(true)
    expect(resolveRsSwitchChecked(false, true)).toBe(false)
    expect(resolveRsSwitchChecked('Y', 'Y')).toBe(true)
    expect(resolveRsSwitchChecked(0, 0)).toBe(true)
    expect(resolveRsSwitchChecked(1, 0)).toBe(false)
  })

  it('maps the next model value', () => {
    expect(resolveRsSwitchNext(true, 'Y', 'N')).toBe('Y')
    expect(resolveRsSwitchNext(false, 'Y', 'N')).toBe('N')
    expect(resolveRsSwitchNext(true, 1, 0)).toBe(1)
  })
})
