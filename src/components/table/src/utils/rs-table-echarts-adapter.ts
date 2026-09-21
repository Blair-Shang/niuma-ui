/**
 * RsTable 系列 → ECharts option 纯映射（不依赖 echarts 包）。
 *
 * 业务侧：`import('echarts').then(e => e.init(el).setOption(option))`
 * 内核保持库无关；本文件只产出普通 JSON 可序列化结构。
 */

import type { RsTableChartSeries } from './table-chart-utils'

/** 最小 ECharts option 面（刻意放宽，避免绑定具体 echarts 类型版本） */
export type RsTableEChartsOption = {
  tooltip?: { trigger?: string }
  legend?: { data?: string[] }
  xAxis?: { type?: string; data?: string[] } | Array<{ type?: string; data?: string[] }>
  yAxis?: { type?: string } | Array<{ type?: string }>
  series: Array<{
    id?: string
    name?: string
    type: 'bar' | 'line' | 'pie'
    data: Array<number | { name: string; value: number }>
  }>
}

export interface MapRsTableSeriesToEChartsOptions {
  /** 多系列时是否共用类目轴（默认 true；饼图忽略） */
  sharedCategoryAxis?: boolean
  /** tooltip.trigger，默认按首系列推断 */
  tooltipTrigger?: 'item' | 'axis'
}

function mapKind(kind: RsTableChartSeries['kind']): 'bar' | 'line' | 'pie' {
  if (kind === 'pie') return 'pie'
  if (kind === 'line') return 'line'
  return 'bar'
}

/**
 * 将库无关 series 映射为可直接 setOption 的 ECharts option。
 */
export function mapRsTableSeriesToEChartsOption(
  seriesList: readonly RsTableChartSeries[],
  options: MapRsTableSeriesToEChartsOptions = {},
): RsTableEChartsOption {
  if (!seriesList.length) {
    return { series: [] }
  }

  const allPie = seriesList.every((s) => s.kind === 'pie')
  const tooltipTrigger =
    options.tooltipTrigger ?? (allPie ? 'item' : 'axis')

  if (allPie) {
    return {
      tooltip: { trigger: tooltipTrigger },
      legend: { data: seriesList.flatMap((s) => s.categories) },
      series: seriesList.map((s) => ({
        id: s.id,
        name: s.id,
        type: 'pie' as const,
        data: s.points.map((p) => ({ name: p.name, value: p.value })),
      })),
    }
  }

  const shared = options.sharedCategoryAxis !== false
  const primary = seriesList[0]!
  return {
    tooltip: { trigger: tooltipTrigger },
    legend: { data: seriesList.map((s) => s.id) },
    xAxis: shared
      ? { type: 'category', data: primary.categories }
      : seriesList.map((s) => ({ type: 'category', data: s.categories })),
    yAxis: { type: 'value' },
    series: seriesList.map((s) => ({
      id: s.id,
      name: s.id,
      type: mapKind(s.kind),
      data: s.values,
    })),
  }
}
