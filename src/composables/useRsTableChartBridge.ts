/**
 * 表格图表桥：订阅 SelectionSource，产出库无关 chart series。
 *
 * 业务页可：
 * - 把 series 丢给 ECharts option 组装
 * - 或在图表点击时用 point.key 反查行做联动筛选
 *
 * 性能：series 随 sourceRows 浅引用变化重算；defs 建议业务侧稳定引用。
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import type { RsTableRowData } from '../components/table-utils'
import {
  buildTableChartSeriesList,
  type RsTableChartSeries,
  type RsTableChartSeriesDef,
} from '../components/table/table-chart-utils'
import {
  useRsTableSelectionSource,
  type RsTableAnalyticsSnapshot,
} from './useRsTableSelectionSource'

export interface UseRsTableChartBridgeOptions<T extends RsTableRowData> {
  viewRows: Ref<T[]> | ComputedRef<T[]>
  selectedRows?: Ref<T[]> | ComputedRef<T[]>
  /** 系列定义列表；变化会触发重算 */
  seriesDefs: Ref<RsTableChartSeriesDef[]> | ComputedRef<RsTableChartSeriesDef[]> | RsTableChartSeriesDef[]
}

function readDefs(
  defs:
    | Ref<RsTableChartSeriesDef[]>
    | ComputedRef<RsTableChartSeriesDef[]>
    | RsTableChartSeriesDef[],
): RsTableChartSeriesDef[] {
  if (Array.isArray(defs)) return defs
  return defs.value ?? []
}

/**
 * 选中联动图表桥。
 *
 * @returns selection 源 + series 列表 + getSnapshot
 */
export function useRsTableChartBridge<T extends RsTableRowData>(
  options: UseRsTableChartBridgeOptions<T>,
) {
  const selection = useRsTableSelectionSource<T>({
    viewRows: options.viewRows,
    selectedRows: options.selectedRows,
  })

  const series = computed<RsTableChartSeries[]>(() =>
    buildTableChartSeriesList(selection.sourceRows.value, readDefs(options.seriesDefs)),
  )

  /** 按 id 取单系列，便于模板绑定 */
  function getSeriesById(id: string): RsTableChartSeries | undefined {
    return series.value.find((item) => item.id === id)
  }

  function getSnapshot(): RsTableAnalyticsSnapshot<T> & { series: RsTableChartSeries[] } {
    return {
      ...selection.getSnapshot(),
      series: series.value,
    }
  }

  return {
    ...selection,
    series,
    getSeriesById,
    getSnapshot,
  }
}

export type RsTableChartBridgeApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableChartBridge<T>
>
