import { describe, expect, it } from 'vitest'
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatDateTimeValue,
  formatDateValue,
  fromInternalPickerValue,
  parseDateTimeValue,
  parseDateValue,
  toInternalPickerValue,
} from '../components/date-picker-utils'
import { RS_DATE_FORMAT, RS_DATETIME_FORMAT } from '../lib/rs-dayjs'

describe('date-picker-utils (dayjs)', () => {
  it('uses fixed date format constant', () => {
    expect(RS_DATE_FORMAT).toBe('YYYY-MM-DD')
    expect(RS_DATETIME_FORMAT).toBe('YYYY-MM-DD HH:mm:ss')
  })

  it('formats and parses date values', () => {
    expect(formatDateValue('2025-06-16')).toBe('2025-06-16')
    expect(formatDateDisplay('2025-06-16')).toBe('2025-06-16')
    expect(parseDateValue('2025-06-16')).toEqual({ year: 2025, month: 6, day: 16 })
  })

  it('formats and parses datetime values', () => {
    expect(formatDateTimeValue('2025-06-16 14:30:00')).toBe('2025-06-16 14:30:00')
    expect(formatDateTimeDisplay('2025-06-16 14:30:00')).toBe('2025-06-16 14:30:00')
    expect(parseDateTimeValue('2025-06-16 14:30:00')).toEqual({
      year: 2025,
      month: 6,
      day: 16,
      hour: 14,
      minute: 30,
      second: 0,
    })
  })

  it('parses ISO-like datetime and normalizes to canonical form', () => {
    expect(parseDateTimeValue('2025-06-16T14:30:00')).toEqual({
      year: 2025,
      month: 6,
      day: 16,
      hour: 14,
      minute: 30,
      second: 0,
    })
    expect(parseDateTimeValue('2025-06-16T14:30')).toEqual({
      year: 2025,
      month: 6,
      day: 16,
      hour: 14,
      minute: 30,
      second: 0,
    })
    expect(parseDateTimeValue('2025-06-16 14:30')).toEqual({
      year: 2025,
      month: 6,
      day: 16,
      hour: 14,
      minute: 30,
      second: 0,
    })
    expect(formatDateTimeValue('2025-06-16T14:30:00')).toBe('2025-06-16 14:30:00')
    expect(formatDateTimeValue('2026-07-01T14:49:43Z')).toBe('2026-07-01 14:49:43')
  })

  it('rejects unrecognizable datetime strings', () => {
    expect(parseDateTimeValue('not-a-date')).toBeNull()
    expect(formatDateTimeValue('not-a-date')).toBe('not-a-date')
  })
})

describe('date-picker valueFormat conversion', () => {
  const datetimeOpts = { valueFormat: 'iso', withTime: true }
  const dateOpts = { valueFormat: 'iso', withTime: false }

  it('converts internal datetime to local-offset RFC3339', () => {
    const iso = fromInternalPickerValue('2025-06-16 14:30:00', datetimeOpts)
    expect(iso).toMatch(/^2025-06-16T14:30:00[+-]\d{2}:\d{2}$/)
  })

  it('converts internal date to RFC3339 at midnight local offset', () => {
    const iso = fromInternalPickerValue('2025-06-16', dateOpts)
    expect(iso).toMatch(/^2025-06-16T00:00:00[+-]\d{2}:\d{2}$/)
  })

  it('round-trips iso datetime as wall clock', () => {
    const iso = fromInternalPickerValue('2025-06-16 14:30:00', datetimeOpts)
    expect(toInternalPickerValue(iso, datetimeOpts)).toBe('2025-06-16 14:30:00')
    expect(toInternalPickerValue('2026-07-01T14:49:43Z', datetimeOpts)).toBe('2026-07-01 14:49:43')
    expect(toInternalPickerValue('2026-08-14T14:38:42+08:00', datetimeOpts)).toBe('2026-08-14 14:38:42')
  })

  it('keeps string format as internal wall clock', () => {
    expect(fromInternalPickerValue('2025-06-16 14:30:00', { valueFormat: 'string', withTime: true }))
      .toBe('2025-06-16 14:30:00')
    expect(toInternalPickerValue('2025-06-16 14:30:00', { valueFormat: 'string', withTime: true }))
      .toBe('2025-06-16 14:30:00')
  })

  it('converts timestamp format', () => {
    const ms = fromInternalPickerValue('2025-06-16 14:30:00', { valueFormat: 'timestamp', withTime: true })
    expect(typeof ms).toBe('number')
    expect(toInternalPickerValue(ms, { valueFormat: 'timestamp', withTime: true })).toBe('2025-06-16 14:30:00')
  })

  it('supports custom dayjs value-format templates', () => {
    const custom = { valueFormat: 'YYYY-MM-DDTHH:mm:ss', withTime: true }
    expect(fromInternalPickerValue('2025-06-16 14:30:00', custom)).toBe('2025-06-16T14:30:00')
    expect(toInternalPickerValue('2025-06-16T14:30:00', custom)).toBe('2025-06-16 14:30:00')
  })

  it('emits null for empty iso and timestamp', () => {
    expect(fromInternalPickerValue('', datetimeOpts)).toBeNull()
    expect(fromInternalPickerValue('', { valueFormat: 'timestamp', withTime: true })).toBeNull()
    expect(fromInternalPickerValue('', { valueFormat: 'string', withTime: true })).toBe('')
  })
})
