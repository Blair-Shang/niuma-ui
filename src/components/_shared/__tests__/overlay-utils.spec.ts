import { describe, expect, it } from 'vitest'
import { placeAlignedPopup, placeAnchoredPopup, placeSidePopup, stepEnabledIndex, toContainerPoint } from '../src/overlay-utils'

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

describe('placeSidePopup', () => {
  it('places the popup to the right when there is room', () => {
    const box = placeSidePopup(
      { top: 80, left: 40, height: 32, width: 40 },
      { width: 160, height: 120 },
      { width: 800, height: 600 },
      8,
    )
    expect(box.placement).toBe('right')
    expect(box.left).toBe(88)
    expect(box.top).toBe(80)
    expect(box.width).toBe(160)
  })

  it('flips to the left when the right edge is tight', () => {
    const box = placeSidePopup(
      { top: 80, left: 700, height: 32, width: 40 },
      { width: 160, height: 120 },
      { width: 800, height: 600 },
      8,
    )
    expect(box.placement).toBe('left')
    expect(box.left + box.width).toBeLessThanOrEqual(792)
  })

  it('clamps top inside the viewport', () => {
    const box = placeSidePopup(
      { top: 520, left: 40, height: 32, width: 40 },
      { width: 160, height: 120 },
      { width: 800, height: 560 },
      8,
    )
    expect(box.top + 120).toBeLessThanOrEqual(552)
    expect(box.top).toBeGreaterThanOrEqual(8)
  })
})

describe('placeAlignedPopup', () => {
  const anchor = { top: 80, left: 40, height: 32, width: 120 }
  const popup = { width: 160, height: 80 }
  const viewport = { width: 800, height: 600 }

  it('places below and aligns to the start edge', () => {
    const box = placeAlignedPopup(anchor, popup, viewport, { side: 'bottom', align: 'start', sideOffset: 6 })
    expect(box.side).toBe('bottom')
    expect(box.top).toBe(118)
    expect(box.left).toBe(40)
  })

  it('aligns the end edge and centers on the cross axis', () => {
    const end = placeAlignedPopup(
      { top: 80, left: 200, height: 32, width: 200 },
      popup,
      viewport,
      { side: 'bottom', align: 'end' },
    )
    expect(end.left).toBe(200 + 200 - 160)
    const center = placeAlignedPopup(anchor, popup, viewport, { side: 'right', align: 'center', sideOffset: 6 })
    expect(center.side).toBe('right')
    expect(center.left).toBe(40 + 120 + 6)
    expect(center.top).toBe(80 + (32 - 80) / 2)
  })

  it('flips above when the bottom edge is tight', () => {
    const box = placeAlignedPopup(
      { top: 540, left: 40, height: 32, width: 120 },
      popup,
      viewport,
      { side: 'bottom', sideOffset: 6 },
    )
    expect(box.side).toBe('top')
    expect(box.top).toBeLessThan(540)
  })

  it('swaps start and end on the horizontal axis in RTL', () => {
    const wide = { top: 80, left: 200, height: 32, width: 120 }
    const ltr = placeAlignedPopup(wide, popup, viewport, { side: 'top', align: 'start' })
    const rtl = placeAlignedPopup(wide, popup, viewport, { side: 'top', align: 'start', rtl: true })
    expect(ltr.left).toBe(200)
    expect(rtl.left).toBe(200 + 120 - 160)
  })

  it('clamps a wide popup inside the viewport', () => {
    const box = placeAlignedPopup(
      { top: 20, left: 700, height: 32, width: 80 },
      { width: 240, height: 80 },
      viewport,
    )
    expect(box.left).toBeGreaterThanOrEqual(8)
    expect(box.left + 240).toBeLessThanOrEqual(792)
  })
})

describe('toContainerPoint', () => {
  it('keeps viewport coordinates when there is no origin', () => {
    expect(toContainerPoint(20, 30, null)).toEqual({ top: 20, left: 30 })
  })

  it('subtracts the container origin', () => {
    expect(toContainerPoint(20, 30, { top: 5, left: 8 })).toEqual({ top: 15, left: 22 })
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
