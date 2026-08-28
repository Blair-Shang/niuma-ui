import { describe, expectTypeOf, it } from 'vitest'
import type {
  RsTableColumnSlotProps,
  RsTableSlots,
} from '../components/table/rs-table-props'

describe('RsTable slot types', () => {
  it('column slot row is the table generic', () => {
    type Row = { id: string; name: string }
    expectTypeOf<RsTableColumnSlotProps<Row>['row']>().toEqualTypeOf<Row>()
    expectTypeOf<RsTableColumnSlotProps<Row>['index']>().toEqualTypeOf<number>()
  })

  it('named column slots stay callable with the row generic', () => {
    type Row = { id: string; name: string }
    type NameSlot = NonNullable<RsTableSlots<Row>['name']>
    expectTypeOf<NameSlot>().toBeFunction()
    expectTypeOf<NameSlot>().parameter(0).toMatchTypeOf<{ row: Row; index: number }>()
  })
})
