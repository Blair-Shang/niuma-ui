import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  addCalendarMonths,
  calendarCellClass,
  chunkCalendarWeeks,
  isoWeekOf,
  resolveCalendarCellState,
  resolveFocusedDate,
  resolveKeyboardMove,
  shiftViewMonth,
  shiftViewYear,
  startOfCalendarWeek,
  toDisabledDateSet,
} from '../src/calendar-grid-utils'

describe('calendar-grid-utils', () => {
  it('shifts month across the year boundary', () => {
    expect(shiftViewMonth(2025, 1, -1)).toEqual({ year: 2024, month: 12 })
    expect(shiftViewMonth(2025, 12, 1)).toEqual({ year: 2026, month: 1 })
  })

  it('shifts year without touching the month', () => {
    expect(shiftViewYear(2025, 1)).toBe(2026)
    expect(shiftViewYear(2025, -1)).toBe(2024)
  })

  it('adds calendar days across months', () => {
    expect(addCalendarDays({ year: 2025, month: 6, day: 30 }, 1)).toEqual({
      year: 2025,
      month: 7,
      day: 1,
    })
  })

  it('clamps the day when adding months', () => {
    expect(addCalendarMonths({ year: 2025, month: 1, day: 31 }, 1)).toEqual({
      year: 2025,
      month: 2,
      day: 28,
    })
  })

  it('starts the week on Sunday or Monday', () => {
    const wednesday = { year: 2025, month: 6, day: 4 }
    expect(startOfCalendarWeek(wednesday, 0)).toEqual({ year: 2025, month: 6, day: 1 })
    expect(startOfCalendarWeek(wednesday, 1)).toEqual({ year: 2025, month: 6, day: 2 })
  })

  it('computes ISO week numbers', () => {
    expect(isoWeekOf({ year: 2025, month: 1, day: 1 })).toBe(1)
    expect(isoWeekOf({ year: 2025, month: 6, day: 16 })).toBe(25)
  })

  it('chunks 42 cells into six weeks', () => {
    const cells = Array.from({ length: 42 }, (_, index) => ({
      cell: { year: 2025, month: 6, day: index + 1, inCurrentMonth: true },
      state: resolveCalendarCellState(
        { year: 2025, month: 6, day: index + 1, inCurrentMonth: true },
        { disabledDates: new Set() },
      ),
    }))
    expect(chunkCalendarWeeks(cells)).toHaveLength(6)
  })

  it('looks up disabled dates in a Set', () => {
    const set = toDisabledDateSet(['2025-06-16'])
    const state = resolveCalendarCellState(
      { year: 2025, month: 6, day: 16, inCurrentMonth: true },
      { disabledDates: set },
    )
    expect(state.disabled).toBe(true)
    expect(state.iso).toBe('2025-06-16')
  })

  it('marks range endpoints once', () => {
    const state = resolveCalendarCellState(
      { year: 2025, month: 6, day: 10, inCurrentMonth: true },
      {
        disabledDates: new Set(),
        rangeStart: { year: 2025, month: 6, day: 10 },
        rangeEnd: { year: 2025, month: 6, day: 12 },
      },
    )
    expect(state.rangeStart).toBe(true)
    expect(state.inRange).toBe(false)
    expect(calendarCellClass(state, true)['rs-calendar-grid__cell--endpoint']).toBe(true)
  })

  it('maps APG keys to the next focused day', () => {
    const focused = { year: 2025, month: 6, day: 16 }
    expect(resolveKeyboardMove(focused, 'ArrowRight', { weekStartsOn: 1, rtl: false, shiftKey: false })).toEqual({
      year: 2025,
      month: 6,
      day: 17,
    })
    expect(resolveKeyboardMove(focused, 'ArrowLeft', { weekStartsOn: 1, rtl: true, shiftKey: false })?.day).toBe(17)
    expect(resolveKeyboardMove(focused, 'PageDown', { weekStartsOn: 1, rtl: false, shiftKey: true })).toEqual({
      year: 2026,
      month: 6,
      day: 16,
    })
  })

  it('prefers a selected day in the visible month for focus', () => {
    expect(
      resolveFocusedDate(2025, 6, { year: 2025, month: 6, day: 16 }),
    ).toEqual({ year: 2025, month: 6, day: 16 })
    expect(resolveFocusedDate(2025, 6, { year: 2024, month: 1, day: 1 }).day).toBeGreaterThan(0)
  })
})
