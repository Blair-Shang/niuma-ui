/**
 * 将 Shell / Edit / Chrome 接线捆成 ViewContext provide（削薄 RsTable.vue）。
 */

import type { ComputedRef, Ref } from 'vue'
import type {
  RsTableRowData,
  RsTableRowEntry,
  RsTableRowKey,
  RsTableSelectionType,
} from '../components/table-utils'
import type { RsTableCellEditFocusMode, RsTableCellEditTrigger } from '../components/table/table-edit-utils'
import type { RsTableBodyLabels, RsTableHeaderLabels } from '../components/table/rs-table-view-context'
import type { useTableEdit } from './useTableEdit'
import {
  useRsTableViewProvide,
  type RsTableViewProvideHandlers,
  type RsTableViewProvideSources,
} from './useRsTableViewProvide'

type RowEntry<T extends RsTableRowData> = Extract<RsTableRowEntry<T>, { type: 'row' }>
type TableEditApi = ReturnType<typeof useTableEdit>

export interface BindRsTableViewContextDeps<T extends RsTableRowData> {
  props: {
    columnDraggable: () => boolean
    resizable: () => boolean
    multiSort: () => boolean
    loading: () => boolean
    loadingMore: () => boolean
    infinite: () => boolean
    rowKey: () => RsTableRowKey<T> | undefined
    striped: () => boolean
    selectionType: () => RsTableSelectionType
    editable: () => boolean
    editTrigger: () => RsTableCellEditTrigger
    rowCommit: () => boolean
    allowNull: () => boolean
    editFocusMode: () => RsTableCellEditFocusMode
    nullLabel: () => string
  }
  layout: Pick<
    RsTableViewProvideSources<T>,
    | 'useFixedColumnLayout'
    | 'showRowDragHandle'
    | 'detailExpandable'
    | 'showSelectColumn'
    | 'showEditGutterColumn'
    | 'showIndexColumn'
    | 'showRowStatusColumn'
    | 'columnPadLeft'
    | 'columnPadRight'
    | 'visibleDataColumns'
    | 'prefixWidths'
    | 'resolvedGutterWidth'
    | 'resolvedIndexWidth'
    | 'isRadioSelection'
    | 'selectAllState'
    | 'columnFiltersState'
    | 'dragColumnKey'
    | 'dropColumnKey'
    | 'dragLeadHeaderStyle'
    | 'expandLeadHeaderStyle'
    | 'selectLeadHeaderStyle'
    | 'gutterLeadHeaderStyle'
    | 'indexLeadHeaderStyle'
    | 'columnHeaderStyleMap'
    | 'bodyColspan'
    | 'emptyContentStyle'
    | 'virtualScrollEnabled'
    | 'virtualSlice'
    | 'visibleEntries'
    | 'treeMode'
    | 'treeIndentPx'
    | 'treeExpandColumnKey'
    | 'treeLoadingKeySet'
    | 'dragLeadStyle'
    | 'expandLeadStyle'
    | 'selectLeadStyle'
    | 'indexLeadStyle'
    | 'gutterLeadStyle'
    | 'columnTdClassMap'
    | 'columnStyleMap'
    | 'dragRowKeys'
    | 'dropRowTargetKey'
    | 'dropRowPosition'
  >
  chrome: {
    hasData: Ref<boolean> | ComputedRef<boolean>
    headerLabels: Ref<RsTableHeaderLabels> | ComputedRef<RsTableHeaderLabels>
    bodyLabels: Ref<RsTableBodyLabels> | ComputedRef<RsTableBodyLabels>
    hasColumnSlot: (key: string) => boolean
    hasEditSlot: (key: string) => boolean
  }
  edit: {
    tableEdit: TableEditApi
    activeEditCellKey: Ref<string> | ComputedRef<string>
    activeFocusCellKey: Ref<string> | ComputedRef<string>
    activeErrorMapSize: Ref<number> | ComputedRef<number>
    activeValidatingMapSize: Ref<number> | ComputedRef<number>
    cellTooltipEnabled: RsTableViewProvideHandlers<T>['cellTooltipEnabled']
    cellTooltipMode: RsTableViewProvideHandlers<T>['cellTooltipMode']
    cellTooltipText: RsTableViewProvideHandlers<T>['cellTooltipText']
    cellTooltipFallbackTitle: RsTableViewProvideHandlers<T>['cellTooltipFallbackTitle']
    rowEditPending: RsTableViewProvideHandlers<T>['rowEditPending']
    isExternalRowPending: RsTableViewProvideHandlers<T>['isExternalRowPending']
    onCellStartEdit: RsTableViewProvideHandlers<T>['onCellStartEdit']
    onCellCommit: RsTableViewProvideHandlers<T>['onCellCommit']
    onCellCancel: RsTableViewProvideHandlers<T>['onCellCancel']
    onCellUpdateDraft: RsTableViewProvideHandlers<T>['onCellUpdateDraft']
    onCellNavigate: RsTableViewProvideHandlers<T>['onCellNavigate']
    onRowCommit: RsTableViewProvideHandlers<T>['onRowCommit']
    onRowRollback: RsTableViewProvideHandlers<T>['onRowRollback']
    onGutterCommit: RsTableViewProvideHandlers<T>['onGutterCommit']
    onCellClick: RsTableViewProvideHandlers<T>['onCellClick']
    onCellDblclick: RsTableViewProvideHandlers<T>['onCellDblclick']
  }
  interaction: {
    isHighlighted: (key: string) => boolean
    onCellTipOver: (event: PointerEvent) => void
    onCellTipOut: (event: PointerEvent) => void
  } & Pick<
    RsTableViewProvideHandlers<T>,
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
    | 'rowKeyFor'
    | 'isRowSelected'
    | 'isRowIndeterminate'
    | 'isRowExpanded'
    | 'treeDepthOf'
    | 'canExpandRow'
    | 'canSelectRow'
    | 'isRowDragByRow'
    | 'isRowDragging'
    | 'isRowDropTarget'
    | 'onRowClick'
    | 'onRowSelectMouseDown'
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
  >
}

/**
 * 装配并 provide ViewContext。
 */
export function bindRsTableViewContext<T extends RsTableRowData>(
  deps: BindRsTableViewContextDeps<T>,
) {
  const { props, layout, chrome, edit, interaction } = deps
  const { tableEdit } = edit

  return useRsTableViewProvide<T>(
    {
      ...layout,
      columnDraggable: props.columnDraggable,
      resizable: props.resizable,
      multiSort: props.multiSort,
      headerLabels: chrome.headerLabels,
      loading: props.loading,
      hasData: chrome.hasData,
      loadingMore: props.loadingMore,
      infinite: props.infinite,
      rowKey: props.rowKey,
      striped: props.striped,
      selectionType: props.selectionType,
      editable: props.editable,
      editTrigger: props.editTrigger,
      rowCommit: props.rowCommit,
      allowNull: props.allowNull,
      editFocusMode: props.editFocusMode,
      nullLabel: props.nullLabel,
      activeEditCellKey: edit.activeEditCellKey,
      activeFocusCellKey: edit.activeFocusCellKey,
      activeErrorMapSize: edit.activeErrorMapSize,
      activeValidatingMapSize: edit.activeValidatingMapSize,
      stagedMapSize: () => tableEdit.stagedMap.value.size,
      editingDraft: () => tableEdit.editingDraft.value,
      editingCell: () => tableEdit.editingCell.value,
      focusCell: () => tableEdit.focusCell.value,
      bodyLabels: chrome.bodyLabels,
    },
    {
      resolvedDataColumnWidth: interaction.resolvedDataColumnWidth,
      columnFilterValue: interaction.columnFilterValue,
      sortOrderFor: interaction.sortOrderFor,
      sortPriorityFor: interaction.sortPriorityFor,
      sortIconName: interaction.sortIconName,
      onToggleSelectAll: interaction.onToggleSelectAll,
      onColumnDragOver: interaction.onColumnDragOver,
      onColumnDrop: interaction.onColumnDrop,
      onColumnDragStart: interaction.onColumnDragStart,
      onColumnDragEnd: interaction.onColumnDragEnd,
      updateColumnFilter: interaction.updateColumnFilter,
      onHeaderClick: interaction.onHeaderClick,
      onResizeStart: interaction.onResizeStart,
      onHeaderPointerOver: interaction.onCellTipOver,
      onHeaderPointerOut: interaction.onCellTipOut,
      rowKeyFor: interaction.rowKeyFor,
      isRowSelected: interaction.isRowSelected,
      isRowIndeterminate: interaction.isRowIndeterminate,
      isRowExpanded: interaction.isRowExpanded,
      isHighlighted: interaction.isHighlighted,
      rowEditPending: edit.rowEditPending,
      isExternalRowPending: edit.isExternalRowPending,
      treeDepthOf: interaction.treeDepthOf,
      canExpandRow: interaction.canExpandRow,
      canSelectRow: interaction.canSelectRow,
      isRowDragByRow: interaction.isRowDragByRow,
      isRowDragging: interaction.isRowDragging,
      isRowDropTarget: interaction.isRowDropTarget,
      isRowDirty: tableEdit.isRowDirty,
      hasColumnSlot: chrome.hasColumnSlot,
      hasEditSlot: chrome.hasEditSlot,
      cellTooltipEnabled: edit.cellTooltipEnabled,
      cellTooltipMode: edit.cellTooltipMode,
      cellTooltipText: edit.cellTooltipText,
      cellTooltipFallbackTitle: edit.cellTooltipFallbackTitle,
      getCellDraft: tableEdit.getDraft,
      isCellDirty: tableEdit.isDirty,
      getCellError: tableEdit.getCellError,
      isCellValidating: tableEdit.isValidating,
      onBodyPointerOver: interaction.onCellTipOver,
      onBodyPointerOut: interaction.onCellTipOut,
      onRowClick: interaction.onRowClick,
      onRowSelectMouseDown: interaction.onRowSelectMouseDown,
      onCellClick: edit.onCellClick,
      onCellDblclick: edit.onCellDblclick,
      onCellContextmenu: interaction.onCellContextmenu,
      onRowDblclick: interaction.onRowDblclick,
      onRowContextmenu: interaction.onRowContextmenu,
      onRowDragOver: interaction.onRowDragOver,
      onRowDragLeave: interaction.onRowDragLeave,
      onRowDrop: interaction.onRowDrop,
      onRowDragStart: interaction.onRowDragStart,
      onRowDragEnd: interaction.onRowDragEnd,
      onToggleExpand: interaction.onToggleExpand,
      onToggleSelect: interaction.onToggleSelect,
      onCellStartEdit: edit.onCellStartEdit,
      onCellCommit: edit.onCellCommit,
      onCellCancel: edit.onCellCancel,
      onCellUpdateDraft: edit.onCellUpdateDraft,
      onCellNavigate: edit.onCellNavigate,
      onRowCommit: edit.onRowCommit,
      onRowRollback: edit.onRowRollback,
      onGutterCommit: edit.onGutterCommit,
    },
  )
}

export type { RowEntry }
