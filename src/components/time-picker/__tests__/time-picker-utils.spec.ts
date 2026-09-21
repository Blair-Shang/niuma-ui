import { describe, expect, it } from 'vitest'
import {
  containColumnWheel,
  containOverlayWheel,
  formatTimeDisplay,
  isTimeColumnScrollTarget,
  toHour12,
  toHour24,
} from '../src/time-picker-utils'

describe('time-picker hour cycle', () => {
  it('maps 24-hour values to 12-hour parts', () => {
    expect(toHour12(0)).toEqual({ hour: 12, period: 'am' })
    expect(toHour12(12)).toEqual({ hour: 12, period: 'pm' })
    expect(toHour12(14)).toEqual({ hour: 2, period: 'pm' })
    expect(toHour24(2, 'pm')).toBe(14)
    expect(toHour24(12, 'am')).toBe(0)
    expect(toHour24(12, 'pm')).toBe(12)
  })

  it('keeps 24-hour display by default', () => {
    expect(formatTimeDisplay('14:30')).toBe('14:30')
    expect(formatTimeDisplay('14:30:05', { withSeconds: true })).toBe('14:30:05')
    expect(formatTimeDisplay('')).toBe('')
  })

  it('formats a 12-hour locale string', () => {
    const text = formatTimeDisplay('14:30', { hourCycle: 12, locale: 'en-US' })
    expect(text.toLowerCase()).toMatch(/2:30/)
    expect(text.toLowerCase()).toMatch(/pm/)
  })
})

describe('time-picker overlay scroll contain', () => {
  function createColumnList(scrollTop: number, scrollHeight = 200, clientHeight = 100): HTMLDivElement {
    const list = document.createElement('div')
    list.className = 'rs-time-columns__list'
    Object.defineProperties(list, {
      scrollTop: { value: scrollTop, writable: true, configurable: true },
      scrollHeight: { value: scrollHeight, configurable: true },
      clientHeight: { value: clientHeight, configurable: true },
    })
    return list
  }

  it('recognizes a time-column scroll target', () => {
    const list = createColumnList(0)
    const item = document.createElement('button')
    list.appendChild(item)
    expect(isTimeColumnScrollTarget(item)).toBe(true)
    expect(isTimeColumnScrollTarget(document.createElement('div'))).toBe(false)
    expect(isTimeColumnScrollTarget(null)).toBe(false)
  })

  it('prevents wheel when the column is at the edge or cannot scroll', () => {
    const atTop = createColumnList(0)
    atTop.addEventListener('wheel', containColumnWheel)
    const up = new WheelEvent('wheel', { deltaY: -40, cancelable: true, bubbles: true })
    atTop.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)

    const atBottom = createColumnList(100)
    atBottom.addEventListener('wheel', containColumnWheel)
    const down = new WheelEvent('wheel', { deltaY: 40, cancelable: true, bubbles: true })
    atBottom.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
  })

  it('lets the column scroll when it still has room', () => {
    const list = createColumnList(40)
    list.addEventListener('wheel', containColumnWheel)
    const mid = new WheelEvent('wheel', { deltaY: 20, cancelable: true, bubbles: true })
    list.dispatchEvent(mid)
    expect(mid.defaultPrevented).toBe(false)
  })

  it('blocks overlay wheel outside the columns', () => {
    const panel = document.createElement('div')
    panel.addEventListener('wheel', containOverlayWheel)
    const event = new WheelEvent('wheel', { deltaY: 30, cancelable: true, bubbles: true })
    panel.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})
