import { describe, expect, it } from 'vitest'
import {
  asLogLineInputs,
  clampLogCount,
  countDroppedLines,
  filterLogLines,
  formatLogTime,
  inferLogLevel,
  joinLogLines,
  normalizeLogLines,
  otelSeverityOf,
  parseRsLogLevel,
  resolveLogCopyText,
  resolveLogLive,
  splitLogHighlight,
  splitLogText,
  syslogSeverityOf,
} from '../components/log-utils'

describe('splitLogText', () => {
  it('splits CRLF and drops a trailing empty line', () => {
    expect(splitLogText('a\r\nb\r\n')).toEqual(['a', 'b'])
  })

  it('keeps a single empty string as no lines', () => {
    expect(splitLogText('')).toEqual([])
  })
})

describe('inferLogLevel', () => {
  it('detects bracket tags, leading tokens, and toolchain line starts', () => {
    expect(inferLogLevel('[FATAL] abort')).toBe('fatal')
    expect(inferLogLevel('[ERROR] compile failed')).toBe('error')
    expect(inferLogLevel('[WARN] skip tests')).toBe('warn')
    expect(inferLogLevel('[debug] retry')).toBe('debug')
    expect(inferLogLevel('[info] start')).toBe('info')
    expect(inferLogLevel('[notice] quota')).toBe('notice')
    expect(inferLogLevel('[trace] enter')).toBe('trace')
    expect(inferLogLevel('[ok] uploaded')).toBe('success')
    expect(inferLogLevel('ERROR: compile failed')).toBe('error')
    expect(inferLogLevel('failed to start')).toBe('error')
    expect(inferLogLevel('BUILD SUCCESS')).toBe('success')
    expect(inferLogLevel('BUILD FAILURE')).toBe('error')
    expect(inferLogLevel('Exception in thread')).toBe('error')
    expect(inferLogLevel('panic: nil pointer')).toBe('fatal')
  })

  it('does not color product copy or paths', () => {
    expect(inferLogLevel('hello world')).toBe('plain')
    expect(inferLogLevel('')).toBe('plain')
    expect(inferLogLevel('构建失败：network timeout')).toBe('plain')
    expect(inferLogLevel('成功 12 个工程')).toBe('plain')
    expect(inferLogLevel('自动推送结束：成功 2，失败 0')).toBe('plain')
    expect(inferLogLevel('src/error/handler.ts')).toBe('plain')
    expect(inferLogLevel('uploaded successfully')).toBe('plain')
    expect(inferLogLevel('retry failed after timeout')).toBe('plain')
  })

  it('applies caller success / failure markers after built-in scan', () => {
    const markers = { success: ['成功'], error: ['失败'] }
    expect(inferLogLevel('构建失败：network timeout', { markers })).toBe('error')
    expect(inferLogLevel('成功 12 个工程', { markers })).toBe('success')
    expect(inferLogLevel('自动推送结束：成功 2，失败 0', { markers })).toBe('error')
    expect(inferLogLevel('[INFO] 失败', { markers })).toBe('info')
    expect(
      inferLogLevel('自动推送结束：成功 2，失败 0', {
        markers: { success: ['成功'], error: [/失败\s*[1-9]/] },
      }),
    ).toBe('success')
  })
})

describe('parseRsLogLevel / severity maps', () => {
  it('accepts aliases', () => {
    expect(parseRsLogLevel('warning')).toBe('warn')
    expect(parseRsLogLevel('CRITICAL')).toBe('fatal')
    expect(parseRsLogLevel('ok')).toBe('success')
  })

  it('maps syslog 0-7', () => {
    expect(parseRsLogLevel(0, 'syslog')).toBe('fatal')
    expect(parseRsLogLevel(3, 'syslog')).toBe('error')
    expect(parseRsLogLevel(4, 'syslog')).toBe('warn')
    expect(parseRsLogLevel(6, 'syslog')).toBe('info')
    expect(parseRsLogLevel(7, 'syslog')).toBe('debug')
  })

  it('maps OTel 1-24', () => {
    expect(parseRsLogLevel(1, 'otel')).toBe('trace')
    expect(parseRsLogLevel(9, 'otel')).toBe('info')
    expect(parseRsLogLevel(17, 'otel')).toBe('error')
    expect(parseRsLogLevel(21, 'otel')).toBe('fatal')
  })

  it('auto treats 0-7 as syslog and larger as OTel', () => {
    expect(parseRsLogLevel(3)).toBe('error')
    expect(parseRsLogLevel(17)).toBe('error')
  })

  it('exposes syslog / otel numbers', () => {
    expect(syslogSeverityOf('error')).toBe(3)
    expect(otelSeverityOf('error')).toBe(17)
    expect(syslogSeverityOf('plain')).toBeNull()
  })
})

describe('formatLogTime', () => {
  it('keeps a display string', () => {
    expect(formatLogTime('12:00:01')).toBe('12:00:01')
  })

  it('formats an ISO instant with Intl', () => {
    const text = formatLogTime('2026-09-09T06:00:00Z', 'en-US')
    expect(text).toMatch(/\d{1,2}:\d{2}:\d{2}/)
  })
})

describe('normalizeLogLines', () => {
  it('keeps explicit level and infers the rest', () => {
    const rows = normalizeLogLines([
      { text: 'manual', level: 'warn' },
      'BUILD SUCCESS',
    ])
    expect(rows[0]?.level).toBe('warn')
    expect(rows[1]?.level).toBe('success')
    expect(rows[0]?.syslog).toBe(4)
    expect(rows[0]?.seq).toBe(1)
  })

  it('reads warning alias and numeric severity', () => {
    const rows = normalizeLogLines([
      { text: 'alias', level: 'warning' },
      { text: 'syslog', severity: 3 },
    ])
    expect(rows[0]?.level).toBe('warn')
    expect(rows[1]?.level).toBe('error')
  })

  it('can disable inference', () => {
    const rows = normalizeLogLines('failed hard', { inferLevel: false })
    expect(rows[0]?.level).toBe('plain')
  })

  it('passes inferMarkers into level scan', () => {
    const rows = normalizeLogLines('推送成功', { inferMarkers: { success: ['成功'] } })
    expect(rows[0]?.level).toBe('success')
  })

  it('keeps the newest maxLines rows', () => {
    const rows = normalizeLogLines(['a', 'b', 'c', 'd'], { maxLines: 2 })
    expect(rows.map((row) => row.text)).toEqual(['c', 'd'])
    expect(rows[0]?.seq).toBe(1)
  })

  it('uses id as key', () => {
    const rows = normalizeLogLines([{ id: 'j1', text: 'ok' }])
    expect(rows[0]?.key).toBe('j1')
  })
})

describe('filter / highlight / live', () => {
  const rows = normalizeLogLines([
    { text: 'alpha', level: 'info' },
    { text: 'beta error', level: 'error' },
  ])

  it('filters by level and search', () => {
    expect(filterLogLines(rows, { levels: ['error'] }).map((row) => row.text)).toEqual(['beta error'])
    expect(filterLogLines(rows, { search: 'ALPHA' }).map((row) => row.text)).toEqual(['alpha'])
  })

  it('splits highlight parts', () => {
    expect(splitLogHighlight('ftp_push failed', 'push')).toEqual([
      { text: 'ftp_', hit: false },
      { text: 'push', hit: true },
      { text: ' failed', hit: false },
    ])
  })

  it('resolves live mode', () => {
    expect(resolveLogLive(undefined)).toBe('off')
    expect(resolveLogLive(true)).toBe('polite')
    expect(resolveLogLive('assertive')).toBe('assertive')
  })

  it('counts dropped lines', () => {
    expect(countDroppedLines(10, 4)).toBe(6)
    expect(countDroppedLines(3, 4)).toBe(0)
  })

  it('prefers selection, then full text, then active line, then visible rows', () => {
    expect(resolveLogCopyText({ selection: '  picked  ', activeText: 'row', visibleTexts: ['a'] })).toEqual({
      text: 'picked',
      source: 'selection',
    })
    expect(resolveLogCopyText({ allTexts: ['a', 'b'], activeText: 'row', visibleTexts: ['b'] })).toEqual({
      text: 'a\nb',
      source: 'all',
    })
    expect(resolveLogCopyText({ activeText: 'row', visibleTexts: ['a', 'b'] })).toEqual({
      text: 'row',
      source: 'line',
    })
    expect(resolveLogCopyText({ visibleTexts: ['a', 'b'] })).toEqual({
      text: 'a\nb',
      source: 'visible',
    })
  })
})

describe('asLogLineInputs / clamp / join', () => {
  it('wraps a single line object', () => {
    expect(asLogLineInputs({ text: 'x' })).toEqual([{ text: 'x' }])
  })

  it('clamps from the tail', () => {
    expect(clampLogCount([1, 2, 3, 4], 2)).toEqual([3, 4])
  })

  it('joins normalized text', () => {
    expect(
      joinLogLines([
        { text: 'a' },
        { text: 'b' },
      ]),
    ).toBe('a\nb')
  })
})
