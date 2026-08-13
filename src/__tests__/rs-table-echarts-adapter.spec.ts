import { describe, expect, it } from 'vitest'
import { mapRsTableSeriesToEChartsOption } from '../components/table/rs-table-echarts-adapter'
import type { RsTableChartSeries } from '../components/table/table-chart-utils'

const bar: RsTableChartSeries = {
  id: 'by-status',
  kind: 'bar',
  points: [
    { key: 'ok', name: 'ok', value: 2, count: 2 },
    { key: 'wait', name: 'wait', value: 1, count: 1 },
  ],
  categories: ['ok', 'wait'],
  values: [2, 1],
}

const pie: RsTableChartSeries = {
  ...bar,
  id: 'pie',
  kind: 'pie',
}

describe('mapRsTableSeriesToEChartsOption', () => {
  it('柱状图产出类目轴 + values', () => {
    const option = mapRsTableSeriesToEChartsOption([bar])
    expect(option.tooltip?.trigger).toBe('axis')
    expect(option.xAxis).toEqual({ type: 'category', data: ['ok', 'wait'] })
    expect(option.series[0]).toMatchObject({
      id: 'by-status',
      type: 'bar',
      data: [2, 1],
    })
  })

  it('饼图产出 item tooltip 与 name/value 点', () => {
    const option = mapRsTableSeriesToEChartsOption([pie])
    expect(option.tooltip?.trigger).toBe('item')
    expect(option.series[0]?.type).toBe('pie')
    expect(option.series[0]?.data).toEqual([
      { name: 'ok', value: 2 },
      { name: 'wait', value: 1 },
    ])
  })
})
