import { describe, expect, it } from 'vitest'
import {
  aggregateColumnSummary,
  buildTableSummaryCells,
  hasTableSummaryConfig,
} from '../components/table/table-summary-utils'
import type { RsTableColumn } from '../components/table-utils'

type Row = { id: number; name: string; amount: number }

const columns: Array<RsTableColumn<Row> & { summary?: any }> = [
  { key: 'name', title: '名称' },
  {
    key: 'amount',
    title: '金额',
    summary: { type: 'sum', formatter: (v: number | string) => `¥${v}` },
  },
]

const rows: Row[] = [
  { id: 1, name: 'A', amount: 10 },
  { id: 2, name: 'B', amount: 20 },
]

describe('table-summary-utils', () => {
  it('aggregates sum with formatter', () => {
    const cell = aggregateColumnSummary(columns[1]!, rows)
    expect(cell?.value).toBe(30)
    expect(cell?.text).toBe('¥30')
  })

  it('builds client summary cells', () => {
    const cells = buildTableSummaryCells({
      columns,
      rows,
      mode: 'client',
    })
    expect(cells.find((c) => c.key === 'amount')?.text).toBe('¥30')
    expect(cells.find((c) => c.key === 'name')?.text).toBe('')
  })

  it('uses server summaryData without local reduce', () => {
    const cells = buildTableSummaryCells({
      columns,
      rows,
      mode: 'server',
      summaryData: { amount: 999 },
    })
    expect(cells.find((c) => c.key === 'amount')?.text).toBe('¥999')
  })

  it('detects summary config', () => {
    expect(hasTableSummaryConfig({ columns, mode: 'client' })).toBe(true)
    expect(
      hasTableSummaryConfig({
        columns: [{ key: 'name', title: '名称' }],
        mode: 'server',
        summaryData: { name: 'x' },
      }),
    ).toBe(true)
  })
})
