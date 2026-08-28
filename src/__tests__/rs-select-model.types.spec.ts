import { describe, expectTypeOf, it } from 'vitest'
import type { RsSelectLabeledValue, RsSelectResolvedModel } from '../components/select-utils'

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
})
