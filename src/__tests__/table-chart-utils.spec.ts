import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { buildTableChartSeries } from '../components/table/table-chart-utils'
import { useRsTableChartBridge } from '../composables/useRsTableChartBridge'
import { useRsTableSelectionSource } from '../composables/useRsTableSelectionSource'

const rows = [
  { id: '1', status: 'ok', amount: 10 },
  { id: '2', status: 'ok', amount: 20 },
  { id: '3', status: 'wait', amount: 5 },
  { id: '4', status: 'wait', amount: 15 },
  { id: '5', status: 'fail', amount: 3 },
]

describe('buildTableChartSeries', () => {
  it('groups by category with count', () => {
    const series = buildTableChartSeries(rows, {
      id: 'by-status',
      kind: 'pie',
      categoryField: 'status',
      valueAgg: 'count',
    })
    expect(series.kind).toBe('pie')
    expect(series.categories).toEqual(['ok', 'wait', 'fail'])
    expect(series.values).toEqual([2, 2, 1])
  })

  it('sums valueField for bar', () => {
    const series = buildTableChartSeries(rows, {
      id: 'amount',
      kind: 'bar',
      categoryField: 'status',
      valueField: 'amount',
      valueAgg: 'sum',
    })
    const byName = Object.fromEntries(series.points.map((p) => [p.name, p.value]))
    expect(byName.ok).toBe(30)
    expect(byName.wait).toBe(20)
    expect(byName.fail).toBe(3)
  })

  it('merges tail into other when topN set', () => {
    const series = buildTableChartSeries(rows, {
      id: 'top1',
      kind: 'pie',
      categoryField: 'status',
      valueAgg: 'count',
      topN: 1,
      otherLabel: '其余',
    })
    expect(series.points).toHaveLength(2)
    expect(series.points[0]?.name).toBe('ok')
    expect(series.points[1]?.name).toBe('其余')
    expect(series.points[1]?.value).toBe(3)
  })
})

describe('useRsTableSelectionSource', () => {
  it('prefers selected rows as source', () => {
    const viewRows = ref(rows)
    const selectedRows = ref([rows[2]!])
    const src = useRsTableSelectionSource({ viewRows, selectedRows })
    expect(src.sourceMode.value).toBe('selected')
    expect(src.sourceRows.value).toEqual([rows[2]])
    selectedRows.value = []
    expect(src.sourceMode.value).toBe('view')
    expect(src.sourceRows.value).toHaveLength(5)
  })
})

describe('useRsTableChartBridge', () => {
  it('rebuilds pie series when selection changes', () => {
    const viewRows = ref(rows)
    const selectedRows = ref<typeof rows>([])
    const bridge = useRsTableChartBridge({
      viewRows,
      selectedRows,
      seriesDefs: [
        { id: 'status-pie', kind: 'pie', categoryField: 'status', valueAgg: 'count' },
      ],
    })
    expect(bridge.series.value[0]?.values).toEqual([2, 2, 1])
    selectedRows.value = [rows[0]!, rows[1]!]
    expect(bridge.sourceMode.value).toBe('selected')
    expect(bridge.series.value[0]?.categories).toEqual(['ok'])
    expect(bridge.series.value[0]?.values).toEqual([2])
  })
})
