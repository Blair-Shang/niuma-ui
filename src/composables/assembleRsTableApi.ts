/**
 * 装配 RsTable 公开 Api（从 SFC 下沉，单一出口）。
 */

import type { ComputedRef, Ref } from 'vue'
import type { RsTableApi } from '../components/table/rs-table-api'
import type { RsTableRowData, RsTableRowEntry } from '../components/table-utils'
import type { RsTableAnalyticsSnapshot } from './useRsTableSelectionSource'
import type { useRsTable } from './useRsTable'

type RowEntry<T extends RsTableRowData> = Extract<RsTableRowEntry<T>, { type: 'row' }>

export interface AssembleRsTableApiOptions<T extends RsTableRowData> {
  tableSurface: ReturnType<typeof useRsTable<T>>
  dataRows: Ref<RowEntry<T>[]> | ComputedRef<RowEntry<T>[]>
  rowKeyByIndex: Ref<Map<number, string>> | ComputedRef<Map<number, string>>
  viewRows: Ref<T[]> | ComputedRef<T[]>
  selectedRows: Ref<T[]> | ComputedRef<T[]>
  selectedRowKeys: Ref<string[]> | ComputedRef<string[]>
  getAnalyticsSnapshot: () => RsTableAnalyticsSnapshot<T>
  subscribeAnalytics: (listener: (snap: RsTableAnalyticsSnapshot<T>) => void) => () => void
  getRowByKey: (
    rowKey: string,
    dataRows: RowEntry<T>[],
    rowKeyByIndex: Map<number, string>,
  ) => T | undefined
  getRowByIndex: (index: number, dataRows: RowEntry<T>[]) => T | undefined
  getColumnValues: (colKey: string, dataRows: RowEntry<T>[]) => unknown[]
  getCellValue: (
    rowKey: string,
    colKey: string,
    dataRows: RowEntry<T>[],
    rowKeyByIndex: Map<number, string>,
  ) => unknown
  toApiEditSlice: (ctx: {
    dataRows: Ref<RowEntry<T>[]> | ComputedRef<RowEntry<T>[]>
    rowKeyByIndex: Ref<Map<number, string>> | ComputedRef<Map<number, string>>
  }) => Pick<
    RsTableApi<T>,
    | 'getHighlightedRowKey'
    | 'setHighlightedRowKey'
    | 'cancelCellEdit'
    | 'cancelAllEdits'
    | 'getDirtyCellKeys'
    | 'getCellError'
    | 'setCellError'
    | 'stageCell'
    | 'rejectRowEdit'
    | 'undoEdit'
    | 'redoEdit'
    | 'commitRowEdits'
    | 'rollbackRowEdits'
  >
}

/**
 * 创建并返回 RsTableApi（含 feature 元数据）。
 */
export function assembleRsTableApi<T extends RsTableRowData>(
  options: AssembleRsTableApiOptions<T>,
): RsTableApi<T> {
  const { tableSurface, dataRows, rowKeyByIndex } = options
  return tableSurface.createApi({
    getRowByKey: (rowKey) =>
      options.getRowByKey(rowKey, dataRows.value, rowKeyByIndex.value),
    getRowByIndex: (index) => options.getRowByIndex(index, dataRows.value),
    getColumnValues: (colKey) => options.getColumnValues(colKey, dataRows.value),
    getCellValue: (rowKey, colKey) =>
      options.getCellValue(rowKey, colKey, dataRows.value, rowKeyByIndex.value),
    getViewRows: () => options.viewRows.value,
    getSelectedRows: () => options.selectedRows.value,
    getSelectedRowKeys: () => [...options.selectedRowKeys.value],
    getAnalyticsSnapshot: options.getAnalyticsSnapshot,
    subscribeAnalytics: options.subscribeAnalytics,
    ...options.toApiEditSlice({ dataRows, rowKeyByIndex }),
    getToolbarItems: () => tableSurface.getToolbarItems(),
    getOverlayContributions: () => tableSurface.getOverlayContributions(),
  })
}
