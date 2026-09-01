import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  splitSelectLabelHighlight,
  type RsSelectLabeledValue,
  type RsSelectModelValue,
  type RsSelectResolvedModel,
} from '../components/select-utils'

describe('RsSelect resolved model', () => {
  it('defaults to a string (single select)', () => {
    expectTypeOf<RsSelectResolvedModel>().toEqualTypeOf<string>()
  })

  it('multiple literal true is a string array', () => {
    expectTypeOf<RsSelectResolvedModel<string, true>>().toEqualTypeOf<string[]>()
  })

  it('number value stays number | empty', () => {
    expectTypeOf<RsSelectResolvedModel<number>>().toEqualTypeOf<number | ''>()
  })

  it('labelInValue literal true is labeled or empty', () => {
    expectTypeOf<RsSelectResolvedModel<string, false, true>>().toEqualTypeOf<
      RsSelectLabeledValue | ''
    >()
  })

  it('boolean multiple keeps the union so runtime flags still type-check', () => {
    expectTypeOf<RsSelectResolvedModel<string, boolean>>().toEqualTypeOf<
      string | string[]
    >()
  })

  it('highlights the first query match', () => {
    const parts = splitSelectLabelHighlight('PostgreSQL', 'sql')
    expect(parts.some((part) => part.highlight && part.text.toLowerCase() === 'sql')).toBe(true)
  })

  it('runtime model union includes number and labeled', () => {
    expectTypeOf<RsSelectModelValue>().toEqualTypeOf<
      | string
      | number
      | Array<string | number>
      | RsSelectLabeledValue
      | RsSelectLabeledValue[]
    >()
  })
})
