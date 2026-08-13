/**
 * 将 Core/Shell/Edit 装配结果安装为实例级 ViewContext。
 *
 * 从 RsTable.vue 下沉大块 provide 装配，便于壳层只做接线。
 * 多表：每次调用 provide 到当前实例树，互不串扰。
 */

import type { ComputedRef, Ref } from 'vue'
import { isColumnFilterActive } from '../components/table-utils'
import type {
  RsTableColumn,
  RsTableRowData,
  RsTableRowDropPosition,
  RsTableRowEntry,
  RsTableRowKey,
  RsTableSelectionType,
} from '../components/table-utils'
import type { RsTableCellEditFocusMode, RsTableCellEditTrigger } from '../components/table/table-edit-utils'
import {
  createRsTableViewContext,
  provideRsTableView,
  type RsTableBodyLabels,
  type RsTableHeaderLabels,
  type RsTableViewContext,
  type RsTableViewStyle,
} from '../components/table/rs-table-view-context'

type RowEntry<T extends RsTableRowData> = Extract<RsTableRowEntry<T>, { type: 'row' }>

function val<T>(source: Ref<T> | ComputedRef<T> | (() => T)): () => T {
  if (typeof source === 'function') return source as () => T
  return () => (source as Ref<T>).value
}

/** ViewContext 安装所需的状态源（getter / Ref 均可） */
export interface RsTableViewProvideSources<T extends RsTableRowData> {
  useFixedColumnLayout: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  showRowDragHandle: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  detailExpandable: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  showSelectColumn: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  showEditGutterColumn: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  showIndexColumn: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  showRowStatusColumn: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  columnPadLeft: Ref<number> | ComputedRef<number> | (() => number)
  columnPadRight: Ref<number> | ComputedRef<number> | (() => number)
  visibleDataColumns: Ref<RsTableColumn<T>[]> | ComputedRef<RsTableColumn<T>[]> | (() => RsTableColumn<T>[])
  prefixWidths: { drag: number; expand: number; select: number; status: number }
  resolvedGutterWidth: Ref<number> | ComputedRef<number> | (() => number)
  resolvedIndexWidth: Ref<number> | ComputedRef<number> | (() => number)
  isRadioSelection: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  selectAllState: Ref<'checked' | 'indeterminate' | 'unchecked'> | ComputedRef<'checked' | 'indeterminate' | 'unchecked'> | (() => 'checked' | 'indeterminate' | 'unchecked')
  columnDraggable: () => boolean
  resizable: () => boolean
  multiSort: () => boolean
  columnFiltersState: Ref<Record<string, string>> | ComputedRef<Record<string, string>> | (() => Record<string, string>)
  dragColumnKey: Ref<string | null> | (() => string | null)
  dropColumnKey: Ref<string | null> | (() => string | null)
  dragLeadHeaderStyle: Ref<RsTableViewStyle> | ComputedRef<RsTableViewStyle> | (() => RsTableViewStyle)
  expandLeadHeaderStyle: Ref<RsTableViewStyle> | ComputedRef<RsTableViewStyle> | (() => RsTableViewStyle)
  selectLeadHeaderStyle: Ref<RsTableViewStyle> | ComputedRef<RsTableViewStyle> | (() => RsTableViewStyle)
  gutterLeadHeaderStyle: Ref<RsTableViewStyle> | ComputedRef<RsTableViewStyle> | (() => RsTableViewStyle)
  indexLeadHeaderStyle: Ref<RsTableViewStyle> | ComputedRef<RsTableViewStyle> | (() => RsTableViewStyle)
  columnHeaderStyleMap: Ref<Map<string, Record<string, string> | undefined>> | ComputedRef<Map<string, Record<string, string> | undefined>> | (() => Map<string, Record<string, string> | undefined>)
  headerLabels: Ref<RsTableHeaderLabels> | ComputedRef<RsTableHeaderLabels> | (() => RsTableHeaderLabels)
  loading: () => boolean
  hasData: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  loadingMore: () => boolean
  infinite: () => boolean
  bodyColspan: Ref<number> | ComputedRef<number> | (() => number)
  emptyContentStyle: Ref<RsTableViewStyle> | ComputedRef<RsTableViewStyle> | (() => RsTableViewStyle)
  virtualScrollEnabled: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  virtualSlice: Ref<{ paddingTop: number; paddingBottom: number }> | ComputedRef<{ paddingTop: number; paddingBottom: number }> | (() => { paddingTop: number; paddingBottom: number })
  visibleEntries: Ref<RsTableRowEntry<T>[]> | ComputedRef<RsTableRowEntry<T>[]> | (() => RsTableRowEntry<T>[])
  rowKey: () => RsTableRowKey<T> | undefined
  treeMode: Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  treeIndentPx: Ref<number> | ComputedRef<number> | (() => number)
  treeExpandColumnKey: Ref<string | null> | ComputedRef<string | null> | (() => string | null)
  treeLoadingKeySet: Ref<Set<string>> | ComputedRef<Set<string>> | (() => Set<string>)
  striped: () => boolean
  selectionType: () => RsTableSelectionType
  editable: () => boolean
  editTrigger: () => RsTableCellEditTrigger
  rowCommit: () => boolean
  allowNull: () => boolean
  editFocusMode: () => RsTableCellEditFocusMode
  nullLabel: () => string
  dragLeadStyle: Ref<Record<string, string>> | ComputedRef<Record<string, string>> | (() => Record<string, string>)
  expandLeadStyle: Ref<Record<string, string>> | ComputedRef<Record<string, string>> | (() => Record<string, string>)
  selectLeadStyle: Ref<Record<string, string>> | ComputedRef<Record<string, string>> | (() => Record<string, string>)
  indexLeadStyle: Ref<Record<string, string>> | ComputedRef<Record<string, string>> | (() => Record<string, string>)
  gutterLeadStyle: Ref<Record<string, string>> | ComputedRef<Record<string, string>> | (() => Record<string, string>)
  columnTdClassMap: Ref<Map<string, string[]>> | ComputedRef<Map<string, string[]>> | (() => Map<string, string[]>)
  columnStyleMap: Ref<Map<string, Record<string, string> | undefined>> | ComputedRef<Map<string, Record<string, string> | undefined>> | (() => Map<string, Record<string, string> | undefined>)
  dragRowKeys: Ref<string[]> | (() => string[])
  dropRowTargetKey: Ref<string | null> | (() => string | null)
  dropRowPosition: Ref<RsTableRowDropPosition | null> | (() => RsTableRowDropPosition | null)
  activeEditCellKey: Ref<string> | ComputedRef<string> | (() => string)
  activeFocusCellKey: Ref<string> | ComputedRef<string> | (() => string)
  activeErrorMapSize: Ref<number> | ComputedRef<number> | (() => number)
  activeValidatingMapSize: Ref<number> | ComputedRef<number> | (() => number)
  stagedMapSize: () => number
  editingDraft: () => string
  editingCell: () => { rowKey: string; colKey: string } | null
  focusCell: () => { rowKey: string; colKey: string } | null
  bodyLabels: Ref<RsTableBodyLabels> | ComputedRef<RsTableBodyLabels> | (() => RsTableBodyLabels)
}

export type RsTableViewProvideHandlers<T extends RsTableRowData> = Pick<
  RsTableViewContext<T>,
  | 'resolvedDataColumnWidth'
  | 'columnFilterValue'
  | 'sortOrderFor'
  | 'sortPriorityFor'
  | 'sortIconName'
  | 'onToggleSelectAll'
  | 'onColumnDragOver'
  | 'onColumnDrop'
  | 'onColumnDragStart'
  | 'onColumnDragEnd'
  | 'updateColumnFilter'
  | 'onHeaderClick'
  | 'onResizeStart'
  | 'onHeaderPointerOver'
  | 'onHeaderPointerOut'
  | 'rowKeyFor'
  | 'isRowSelected'
  | 'isRowIndeterminate'
  | 'isRowExpanded'
  | 'isHighlighted'
  | 'rowEditPending'
  | 'isExternalRowPending'
  | 'treeDepthOf'
  | 'canExpandRow'
  | 'canSelectRow'
  | 'isRowDragByRow'
  | 'isRowDragging'
  | 'isRowDropTarget'
  | 'isRowDirty'
  | 'hasColumnSlot'
  | 'hasEditSlot'
  | 'cellTooltipEnabled'
  | 'cellTooltipMode'
  | 'cellTooltipText'
  | 'cellTooltipFallbackTitle'
  | 'getCellDraft'
  | 'isCellDirty'
  | 'getCellError'
  | 'isCellValidating'
  | 'onBodyPointerOver'
  | 'onBodyPointerOut'
  | 'onRowClick'
  | 'onRowSelectMouseDown'
  | 'onCellClick'
  | 'onCellDblclick'
  | 'onCellContextmenu'
  | 'onRowDblclick'
  | 'onRowContextmenu'
  | 'onRowDragOver'
  | 'onRowDragLeave'
  | 'onRowDrop'
  | 'onRowDragStart'
  | 'onRowDragEnd'
  | 'onToggleExpand'
  | 'onToggleSelect'
  | 'onCellStartEdit'
  | 'onCellCommit'
  | 'onCellCancel'
  | 'onCellUpdateDraft'
  | 'onCellNavigate'
  | 'onRowCommit'
  | 'onRowRollback'
  | 'onGutterCommit'
>

/**
 * 装配并 provide ViewContext；返回 ctx（便于测试读 instanceId）。
 */
export function useRsTableViewProvide<T extends RsTableRowData>(
  sources: RsTableViewProvideSources<T>,
  handlers: RsTableViewProvideHandlers<T>,
): RsTableViewContext<T> {
  const ctx = createRsTableViewContext<T>({
    state: {
      useFixedColumnLayout: val(sources.useFixedColumnLayout),
      showRowDragHandle: val(sources.showRowDragHandle),
      detailExpandable: val(sources.detailExpandable),
      showSelectColumn: val(sources.showSelectColumn),
      showEditGutterColumn: val(sources.showEditGutterColumn),
      showIndexColumn: val(sources.showIndexColumn),
      showRowStatusColumn: val(sources.showRowStatusColumn),
      columnPadLeft: val(sources.columnPadLeft),
      columnPadRight: val(sources.columnPadRight),
      visibleDataColumns: val(sources.visibleDataColumns),
      prefixWidths: () => sources.prefixWidths,
      resolvedGutterWidth: val(sources.resolvedGutterWidth),
      resolvedIndexWidth: val(sources.resolvedIndexWidth),
      isRadioSelection: val(sources.isRadioSelection),
      selectAllState: val(sources.selectAllState),
      columnDraggable: sources.columnDraggable,
      resizable: sources.resizable,
      multiSort: sources.multiSort,
      columnFiltersState: val(sources.columnFiltersState),
      dragColumnKey: val(sources.dragColumnKey),
      dropColumnKey: val(sources.dropColumnKey),
      dragLeadHeaderStyle: val(sources.dragLeadHeaderStyle),
      expandLeadHeaderStyle: val(sources.expandLeadHeaderStyle),
      selectLeadHeaderStyle: val(sources.selectLeadHeaderStyle),
      gutterLeadHeaderStyle: val(sources.gutterLeadHeaderStyle),
      indexLeadHeaderStyle: val(sources.indexLeadHeaderStyle),
      columnHeaderStyleMap: val(sources.columnHeaderStyleMap),
      headerLabels: val(sources.headerLabels),
      loading: sources.loading,
      hasData: val(sources.hasData),
      loadingMore: sources.loadingMore,
      infinite: sources.infinite,
      bodyColspan: val(sources.bodyColspan),
      emptyContentStyle: val(sources.emptyContentStyle),
      virtualScrollEnabled: val(sources.virtualScrollEnabled),
      virtualSlice: val(sources.virtualSlice),
      visibleEntries: val(sources.visibleEntries),
      rowKey: sources.rowKey,
      treeMode: val(sources.treeMode),
      treeIndentPx: val(sources.treeIndentPx),
      treeExpandColumnKey: val(sources.treeExpandColumnKey),
      treeLoadingKeySet: val(sources.treeLoadingKeySet),
      striped: sources.striped,
      selectionType: sources.selectionType,
      editable: sources.editable,
      editTrigger: sources.editTrigger,
      rowCommit: sources.rowCommit,
      allowNull: sources.allowNull,
      editFocusMode: sources.editFocusMode,
      nullLabel: sources.nullLabel,
      dragLeadStyle: val(sources.dragLeadStyle),
      expandLeadStyle: val(sources.expandLeadStyle),
      selectLeadStyle: val(sources.selectLeadStyle),
      indexLeadStyle: val(sources.indexLeadStyle),
      gutterLeadStyle: val(sources.gutterLeadStyle),
      columnTdClassMap: val(sources.columnTdClassMap),
      columnStyleMap: val(sources.columnStyleMap),
      dragRowKeys: val(sources.dragRowKeys),
      dropRowTargetKey: val(sources.dropRowTargetKey),
      dropRowPosition: val(sources.dropRowPosition),
      activeEditCellKey: val(sources.activeEditCellKey),
      activeFocusCellKey: val(sources.activeFocusCellKey),
      activeErrorMapSize: val(sources.activeErrorMapSize),
      activeValidatingMapSize: val(sources.activeValidatingMapSize),
      stagedMapSize: sources.stagedMapSize,
      editingDraft: sources.editingDraft,
      editingCell: sources.editingCell,
      focusCell: sources.focusCell,
      bodyLabels: val(sources.bodyLabels),
    },
    handlers: {
      ...handlers,
      isColumnFilterActive,
    },
  })
  provideRsTableView(ctx)
  return ctx
}

export type { RowEntry }
