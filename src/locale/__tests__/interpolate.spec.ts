import { describe, expect, it } from 'vitest'
import { interpolateRsMessage } from '../interpolate'

describe('interpolateRsMessage', () => {
  it('replaces named placeholders', () => {
    expect(interpolateRsMessage('Hello {name}', { name: 'Ada' })).toBe('Hello Ada')
  })

  it('selects English plural categories', () => {
    const tmpl = '{count, plural, one {# file} other {# files}}'
    expect(interpolateRsMessage(tmpl, { count: 1 }, 'en-US')).toBe('1 file')
    expect(interpolateRsMessage(tmpl, { count: 2 }, 'en-US')).toBe('2 files')
    expect(interpolateRsMessage(tmpl, { count: 0 }, 'en-US')).toBe('0 files')
  })

  it('honors exact =N before PluralRules', () => {
    const tmpl = '{n, plural, =0 {none} one {#} other {#}}'
    expect(interpolateRsMessage(tmpl, { n: 0 }, 'en-US')).toBe('none')
  })

  it('uses other for Chinese (zh has no one)', () => {
    const tmpl = '{total, plural, one {# item} other {共 # 条}}'
    expect(interpolateRsMessage(tmpl, { total: 1 }, 'zh-CN')).toBe('共 1 条')
    expect(interpolateRsMessage(tmpl, { total: 8 }, 'zh-CN')).toBe('共 8 条')
  })

  it('keeps simple placeholders after plural', () => {
    const tmpl = '{count, plural, other {# hits}} for {q}'
    expect(interpolateRsMessage(tmpl, { count: 3, q: 'sql' }, 'en-US')).toBe('3 hits for sql')
  })
})
