import { describe, expect, it } from 'vitest'
import { measureRsTablePrefixWidth } from '../composables/useRsTableColumnVirtual'

describe('measureRsTablePrefixWidth', () => {
  it('sums visible prefix columns only', () => {
    expect(
      measureRsTablePrefixWidth({
        showRowDragHandle: true,
        detailExpandable: true,
        showSelectColumn: true,
        showIndexColumn: true,
        indexWidth: 48,
      }),
    ).toBe(40 + 40 + 40 + 48)

    expect(
      measureRsTablePrefixWidth({
        showEditGutterColumn: true,
        gutterWidth: 32,
        showIndexColumn: true,
        indexWidth: 48,
      }),
    ).toBe(32)
  })
})
