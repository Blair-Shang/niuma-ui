import { describe, expect, it } from 'vitest'
import {
  clampPopoverDelay,
  listPopoverFocusable,
  nextPopoverFocusIndex,
  normalizePopoverTriggers,
  resolvePopoverElement,
  resolvePopoverPortalTarget,
  RS_POPOVER_DELAY_MAX,
} from '../src/popover-utils'

describe('popover-utils', () => {
  it('keeps click as the default trigger and drops unknown values', () => {
    expect(normalizePopoverTriggers(undefined)).toEqual(['click'])
    expect(normalizePopoverTriggers(['hover', 'focus'])).toEqual(['hover', 'focus'])
    expect(normalizePopoverTriggers([])).toEqual(['click'])
  })

  it('clamps hover delays into 0..60s', () => {
    expect(clampPopoverDelay(undefined, 100)).toBe(100)
    expect(clampPopoverDelay(Number.NaN, 100)).toBe(100)
    expect(clampPopoverDelay(-20, 100)).toBe(0)
    expect(clampPopoverDelay(RS_POPOVER_DELAY_MAX + 5, 100)).toBe(RS_POPOVER_DELAY_MAX)
  })

  it('wraps focus inside the dialog', () => {
    expect(nextPopoverFocusIndex(0, 0, false)).toBe(-1)
    expect(nextPopoverFocusIndex(3, -1, false)).toBe(0)
    expect(nextPopoverFocusIndex(3, -1, true)).toBe(2)
    expect(nextPopoverFocusIndex(3, 2, false)).toBe(0)
    expect(nextPopoverFocusIndex(3, 0, true)).toBe(2)
  })

  it('falls back to body when the container is missing', () => {
    expect(resolvePopoverPortalTarget(undefined, null)).toBe('body')
    expect(resolvePopoverPortalTarget(() => null, null)).toBe('body')
    const host = document.createElement('div')
    expect(resolvePopoverPortalTarget(() => host, null)).toBe(host)
  })

  it('reads an element from a component ref', () => {
    const button = document.createElement('button')
    expect(resolvePopoverElement(button)).toBe(button)
    expect(resolvePopoverElement({ $el: button })).toBe(button)
    expect(resolvePopoverElement(null)).toBeNull()
    expect(resolvePopoverElement({ $el: 'nope' })).toBeNull()
  })

  it('skips hidden and disabled controls', () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<button type="button" class="ok">Ok</button><button type="button" disabled>No</button><div hidden><button type="button" class="gone">Gone</button></div>'
    const items = listPopoverFocusable(root)
    expect(items.map((el) => el.className)).toEqual(['ok'])
    expect(listPopoverFocusable(null)).toEqual([])
  })
})
