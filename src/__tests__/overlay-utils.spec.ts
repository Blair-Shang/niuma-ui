import { describe, expect, it } from 'vitest'
import { placeAnchoredPopup, stepEnabledIndex } from '../components/overlay-utils'

describe('placeAnchoredPopup', () => {
  it('places the popup below the textbox when there is room', () => {
    const box = placeAnchoredPopup(
      { top: 80, left: 40, height: 32, width: 240 },
      { width: 240, height: 120 },
      { width: 800, height: 600 },
    )
    expect(box.placement).toBe('bottom')
    expect(box.top).toBe(116)
    expect(box.left).toBe(40)
    expect(box.width).toBe(240)
  })

  it('flips above when the viewport bottom is tight', () => {
    const box = placeAnchoredPopup(
      { top: 500, left: 40, height: 20, width: 160 },
      { width: 160, height: 120 },
      { width: 800, height: 560 },
    )
    expect(box.placement).toBe('top')
    expect(box.top).toBeLessThan(500)
  })

  it('clamps width and left inside the viewport', () => {
    const box = placeAnchoredPopup(
      { top: 20, left: 700, height: 32, width: 240 },
      { width: 240, height: 80 },
      { width: 800, height: 600 },
    )
    expect(box.left + box.width).toBeLessThanOrEqual(796)
    expect(box.left).toBeGreaterThanOrEqual(4)
  })
})

describe('stepEnabledIndex', () => {
  it('skips disabled options', () => {
    const options = [
      { label: 'A', disabled: false },
      { label: 'B', disabled: true },
      { label: 'C', disabled: false },
    ]
    expect(stepEnabledIndex(options, 0, 1)).toBe(2)
    expect(stepEnabledIndex(options, -1, 1)).toBe(0)
    expect(stepEnabledIndex(options, options.length, -1)).toBe(2)
  })
})
