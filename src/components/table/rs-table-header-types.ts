/**
 * RsTableHeader 视图契约（对标列头渲染层，与 Engine 解耦）。
 */

import type { CSSProperties } from 'vue'
import type { RsTableColumn, RsTableRowData } from '../table-utils'

export interface RsTableHeaderProps<T extends RsTableRowData = RsTableRowData> {
  showRowDragHandle: boolean
  detailExpandable: boolean
  showSelectColumn: boolean
  isRadioSelection: boolean
  selectAllState: 'checked' | 'indeterminate' | 'unchecked'
  showEditGutterColumn: boolean
  showIndexColumn: boolean
  showRowStatusColumn: boolean
  columnPadLeft: number
  columnPadRight: number
  visibleDataColumns: RsTableColumn<T>[]
  columnDraggable: boolean
  resizable: boolean
  multiSort: boolean
  columnFiltersState: Record<string, string>
  dragColumnKey: string | null
  dropColumnKey: string | null
  dragLeadHeaderStyle: CSSProperties | Record<string, string> | undefined
  expandLeadHeaderStyle: CSSProperties | Record<string, string> | undefined
  selectLeadHeaderStyle: CSSProperties | Record<string, string> | undefined
  gutterLeadHeaderStyle: CSSProperties | Record<string, string> | undefined
  indexLeadHeaderStyle: CSSProperties | Record<string, string> | undefined
  columnHeaderStyleMap: Map<string, Record<string, string> | undefined>
  columnFilterValue: (key: string) => string
  isColumnFilterActive: (filters: Record<string, string>, key: string) => boolean
  sortOrderFor: (key: string) => string | null | undefined
  sortPriorityFor: (key: string) => number
  sortIconName: (key: string) => string
  labels: {
    selectAll: string
    index: string
    rowStatus: string
    dragColumn: string
    filterColumn: string
    filterPlaceholder: string
    filterClear: string
    filterApply: string
  }
}
