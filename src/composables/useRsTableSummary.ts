/**
 * RsTable 汇总行编排：是否启用、footer 单元格、前缀 colspan。
 *
 * 纯聚合算法在 table-summary-utils；本 composable 对接 props / slots / 前缀列状态。
 */

import { computed, watch, type ComputedRef } from 'vue'
import type { RsTableColumn, RsTableRowData } from '../components/table-utils'
import {
  buildTableSummaryCells,
  hasTableSummaryConfig,
  warnSummaryCompatibility,
  type RsTableColumnSummary,
  type RsTableSummaryData,
  type RsTableSummaryMode,
} from '../components/table/table-summary-utils'

function read<T>(source: ComputedRef<T> | (() => T)): T {
  return typeof source === 'function' ? (source as () => T)() : source.value
}

type ColumnWithSummary<T extends RsTableRowData> = RsTableColumn<T> & {
  summary?: RsTableColumnSummary<T>
}

export interface UseRsTableSummaryOptions<T extends RsTableRowData> {
  /** 显式开启汇总行 */
  showSummary: ComputedRef<boolean | undefined> | (() => boolean | undefined)
  summaryMode: ComputedRef<RsTableSummaryMode> | (() => RsTableSummaryMode)
  summaryData: ComputedRef<RsTableSummaryData | null | undefined> | (() => RsTableSummaryData | null | undefined)
  /** 原始列（判断是否配置 summary） */
  columns: ComputedRef<ColumnWithSummary<T>[]> | (() => ColumnWithSummary<T>[])
  /** 展示列（footer 与表体对齐） */
  displayColumns: ComputedRef<ColumnWithSummary<T>[]> | (() => ColumnWithSummary<T>[])
  viewRows: ComputedRef<T[]> | (() => T[])
  /** 是否存在 #summary 插槽（有则不渲染内置行） */
  hasSummarySlot: ComputedRef<boolean> | (() => boolean)
  treeMode: ComputedRef<boolean> | (() => boolean)
  detailExpandable: ComputedRef<boolean> | (() => boolean)
  showRowDragHandle: ComputedRef<boolean> | (() => boolean)
  showSelectColumn: ComputedRef<boolean> | (() => boolean)
  showEditGutterOrIndex: ComputedRef<boolean> | (() => boolean)
  showRowStatusColumn: ComputedRef<boolean> | (() => boolean)
}

/**
 * 汇总 feature 状态。
 *
 * @returns enabled / cells / showBuiltinSummaryRow / prefixColspan
 */
export function useRsTableSummary<T extends RsTableRowData>(options: UseRsTableSummaryOptions<T>) {
  const summaryFeatureEnabled = computed(() => {
    if (read(options.showSummary)) return true
    return hasTableSummaryConfig({
      columns: read(options.columns),
      mode: read(options.summaryMode),
      summaryData: read(options.summaryData),
    })
  })

  const summaryCells = computed(() => {
    if (!summaryFeatureEnabled.value) return []
    return buildTableSummaryCells({
      columns: read(options.displayColumns),
      rows: read(options.viewRows),
      mode: read(options.summaryMode),
      summaryData: read(options.summaryData),
    })
  })

  const showBuiltinSummaryRow = computed(
    () => summaryFeatureEnabled.value && !read(options.hasSummarySlot),
  )

  const summaryPrefixColspan = computed(() => {
    let n = 0
    if (read(options.showRowDragHandle)) n += 1
    if (read(options.detailExpandable)) n += 1
    if (read(options.showSelectColumn)) n += 1
    if (read(options.showEditGutterOrIndex)) n += 1
    if (read(options.showRowStatusColumn)) n += 1
    return n
  })

  if (import.meta.env.DEV) {
    watch(
      () =>
        [
          summaryFeatureEnabled.value,
          read(options.treeMode),
          read(options.detailExpandable),
        ] as const,
      ([summaryEnabled, tree, detail]) => {
        warnSummaryCompatibility({
          summaryEnabled,
          tree,
          detailExpandable: detail,
        })
      },
      { immediate: true },
    )
  }

  return {
    summaryFeatureEnabled,
    summaryCells,
    showBuiltinSummaryRow,
    summaryPrefixColspan,
  }
}

/** 供 feature 注册表识别：summary 已由 useRsTableSummary 承载 */
export const RS_TABLE_SUMMARY_FEATURE_ID = 'summary' as const
