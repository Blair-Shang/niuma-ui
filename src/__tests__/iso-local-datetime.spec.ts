import { describe, expect, it } from 'vitest'
import {
  formatIsoUtcToLocal,
  looksLikeIsoDateTimeWithTz,
  parseLocalDateTimeToUtcIso,
} from '../lib/iso-local-datetime'

function localParts(isoForDate: string): { date: string; time: string; ms: string } {
  const d = new Date(isoForDate)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    ms: pad(d.getMilliseconds(), 3),
  }
}

describe('iso-local-datetime', () => {
  it('formats Z to local with second / millisecond precision', () => {
    const sec = '2026-06-25T08:06:36Z'
    const { date, time } = localParts(sec)
    expect(formatIsoUtcToLocal(sec)).toBe(`${date} ${time}`)

    const ms = '2026-06-25T08:06:36.2263624Z'
    const p = localParts('2026-06-25T08:06:36.226Z')
    expect(formatIsoUtcToLocal(ms)).toBe(`${p.date} ${p.time}.${p.ms}`)
  })

  it('preserves original ISO when local second unchanged (picker strips ms)', () => {
    const prev = '2026-06-25T08:06:36.2263624Z'
    const local = formatIsoUtcToLocal(prev)!
    const withoutMs = local.replace(/\.\d+$/, '')
    expect(parseLocalDateTimeToUtcIso(withoutMs, prev)).toBe(prev)
  })

  it('writes new UTC ISO when local time changes', () => {
    const prev = '2026-06-25T08:06:36.226Z'
    const prevLocal = formatIsoUtcToLocal(prev)!
    // +1 second on local wall clock（无毫秒 → 写回秒精度）
    const d = new Date(prev)
    d.setSeconds(d.getSeconds() + 1)
    d.setMilliseconds(0)
    const pad = (n: number) => String(n).padStart(2, '0')
    const nextLocal =
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    expect(nextLocal).not.toBe(prevLocal.replace(/\.\d+$/, ''))
    const written = parseLocalDateTimeToUtcIso(nextLocal, prev)
    expect(written).toMatch(/Z$/i)
    expect(written).not.toBe(prev)
    expect(new Date(written!).getTime()).toBe(d.getTime())
  })

  it('rejects naive datetime for looksLike / format', () => {
    expect(looksLikeIsoDateTimeWithTz('2026-06-25T08:06:36')).toBe(false)
    expect(formatIsoUtcToLocal('2026-06-25T08:06:36')).toBeNull()
  })
})
