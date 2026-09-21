import { describe, expect, it } from 'vitest'
import {
  canAcceptRsDynamicTag,
  coerceRsDynamicTagsValue,
  draftHasRsDynamicTagsSeparator,
  normalizeRsDynamicTagsSeparators,
  parseRsDynamicTag,
  splitRsDynamicTagsDraft,
} from '../src/dynamic-tags-utils'

describe('dynamic-tags-utils', () => {
  it('normalizes separators from string or list', () => {
    expect(normalizeRsDynamicTagsSeparators(',')).toEqual([','])
    expect(normalizeRsDynamicTagsSeparators([',', ';', ''])).toEqual([',', ';'])
    expect(normalizeRsDynamicTagsSeparators()).toEqual([])
  })

  it('splits draft and keeps the unfinished rest', () => {
    expect(splitRsDynamicTagsDraft('vue,react,sv', [','])).toEqual({
      tokens: ['vue', 'react'],
      rest: 'sv',
    })
    expect(splitRsDynamicTagsDraft('a;;b;', [';'])).toEqual({
      tokens: ['a', 'b'],
      rest: '',
    })
  })

  it('prefers longer separators', () => {
    expect(splitRsDynamicTagsDraft('foo::bar:baz', ['::', ':'])).toEqual({
      tokens: ['foo', 'bar'],
      rest: 'baz',
    })
  })

  it('detects a separator in the draft', () => {
    expect(draftHasRsDynamicTagsSeparator('a,b', [','])).toBe(true)
    expect(draftHasRsDynamicTagsSeparator('ab', [','])).toBe(false)
  })

  it('parses and can reject a draft', () => {
    expect(parseRsDynamicTag('  Vue  ')).toBe('Vue')
    expect(parseRsDynamicTag('  ')).toBe(false)
    expect(parseRsDynamicTag('Vue', (value) => value.toLowerCase())).toBe('vue')
    expect(parseRsDynamicTag('nope', () => false)).toBe(false)
    expect(parseRsDynamicTag('x', () => '   ')).toBe(false)
  })

  it('rejects duplicate and max before accept', () => {
    expect(canAcceptRsDynamicTag(['a'], 'a', {})).toBe('duplicate')
    expect(canAcceptRsDynamicTag(['a'], 'a', { allowDuplicate: true })).toBe('ok')
    expect(canAcceptRsDynamicTag(['a', 'b'], 'c', { max: 2 })).toBe('max')
    expect(canAcceptRsDynamicTag(['a'], 'b', { max: 2 })).toBe('ok')
  })

  it('coerces unknown values into a string list', () => {
    expect(coerceRsDynamicTagsValue(['a', 1, null, { x: 1 }])).toEqual(['a', '1'])
    expect(coerceRsDynamicTagsValue('solo')).toEqual(['solo'])
    expect(coerceRsDynamicTagsValue('')).toEqual([])
    expect(coerceRsDynamicTagsValue(null)).toEqual([])
  })
})
