/**
 * 将 interaction + editActions 接到 RsTable.vue
 */
import fs from 'node:fs'

const path = new URL('../src/components/RsTable.vue', import.meta.url)
let s = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

function mustReplace(label, from, to) {
  const needle = from.replace(/\r\n/g, '\n')
  if (!s.includes(needle)) throw new Error(`patch miss: ${label}`)
  s = s.replace(needle, to.replace(/\r\n/g, '\n'))
}

mustReplace(
  'imports composables',
  `import { useRsTableContextMenu } from '../composables/useRsTableContextMenu'
import { useRsTableSummary } from '../composables/useRsTableSummary'`,
  `import { useRsTableContextMenu } from '../composables/useRsTableContextMenu'
import { useRsTableEditActions } from '../composables/useRsTableEditActions'
import { useRsTableInteraction } from '../composables/useRsTableInteraction'
import { useRsTableSummary } from '../composables/useRsTableSummary'`,
)

mustReplace(
  'trim edit util imports',
  `import {
  isBooleanToggleColumn,
  isCellValueChanged,
  isColumnEditable,
  isColumnNullable,
  isRowEditPending,
  listBatchColumnTargets,
  navigateEditableCell,
  nullToEditText,
  parseCellEditInput,
  parseClipboardGrid,
  resolveCellEditText,
  resolveColumnEditTrigger,
  resolveColumnEditorOptions,
  resolveColumnRawValue,
  validateCellValueAsync,
  type RsTableCellEditFocusMode,
  type RsTableCellNavigateDirection,
} from './table/table-edit-utils'`,
  `import {
  resolveColumnRawValue,
  type RsTableCellEditFocusMode,
} from './table/table-edit-utils'`,
)

mustReplace(
  'trim table-utils selection helpers',
  `  getSortOrderForKey,
  getSortPriorityForKey,
  getTableTreeChildren,
  hasStableTableTreeRowKey,
  hasTableTreeChildren,
  injectExpandRows,
  isColumnFilterActive,
  isNearScrollBottom,
  isTableRowDisabled,
  reorderColumnKeys,
  resolveCellTooltipMode,
  resolveCellTooltipText,
  resolveColumnOrder,
  resolveEntryKey,
  resolveOrderedColumns,
  resolveRowKey,
  resolveScrollWidth,
  resolveSelectAllState,
  resolveTableRowHeight,
  resolveTableSize,
  resolveTableTreeCheckState,
  resolveTableTreeIndent,
  resolveTableTreeRowKey,
  selectRowKeys,
  selectRowKeysByClick,
  sliceVirtualHeightModel,
  toggleExpandedRowKeys,
  toggleMultiSortState,
  toggleSelectAll,
  toggleSortState,
  toggleTableTreeCheck,
} from './table-utils'
import {
  createTableRowDragHandlers,
  createTableRowDragState,
  type RsTableRowDragTrigger,
  type RsTableRowDropMode,
} from './table-drag'`,
  `  columnUsesSharedTooltip,
  hasStableTableTreeRowKey,
  injectExpandRows,
  isColumnFilterActive,
  isNearScrollBottom,
  resolveCellTooltipMode,
  resolveCellTooltipText,
  resolveColumnOrder,
  resolveEntryKey,
  resolveOrderedColumns,
  resolveRowKey,
  resolveScrollWidth,
  resolveSelectAllState,
  resolveTableRowHeight,
  resolveTableSize,
  resolveTableTreeIndent,
  resolveTableTreeRowKey,
  selectRowKeys,
  sliceVirtualHeightModel,
} from './table-utils'
import type { RsTableRowDragTrigger, RsTableRowDropMode } from './table-drag'`,
)

mustReplace(
  'early drag state',
  `const dragColumnKey = ref<string | null>(null)
const dropColumnKey = ref<string | null>(null)
const rowDragState = createTableRowDragState()
const { dragRowKeys, dropRowTargetKey, dropRowPosition } = rowDragState
const showRowDragHandle = computed(
  () => props.rowDraggable && props.rowDragTrigger === 'handle',
)`,
  `const showRowDragHandle = computed(
  () => props.rowDraggable && props.rowDragTrigger === 'handle',
)`,
)

mustReplace(
  'selectionAnchor',
  `/** 行点击多选的 Shift 锚点 */
const selectionAnchorKey = ref<string | null>(null)

const fixedRowHeight`,
  `const fixedRowHeight`,
)

const startMarker = 'const isRadioSelection = computed(() => props.selectionType === \'radio\')\n'
const endMarker = 'function getRowByKey(rowKey: string): T | undefined {'
const start = s.indexOf(startMarker)
const end = s.indexOf(endMarker)
if (start < 0 || end < 0 || end <= start) throw new Error('block markers miss')

const replacement = `${startMarker}
const {
  dragColumnKey,
  dropColumnKey,
  dragRowKeys,
  dropRowTargetKey,
  dropRowPosition,
  rowKeyFor,
  sortOrderFor,
  sortPriorityFor,
  sortIconName,
  onHeaderClick,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
  canSelectRow,
  isRowSelected,
  isRowIndeterminate,
  onToggleRow,
  onToggleSelectAll,
  canExpandRow,
  isRowExpanded,
  treeDepthOf,
  onToggleExpand,
  onRowClick,
  onRowSelectMouseDown,
  onRowDblclick,
  onRowDragStart,
  onRowDragOver,
  onRowDragLeave,
  onRowDrop,
  onRowDragEnd,
  isRowDropTarget,
  isRowDragging,
  canDragRow,
  isRowDragByRow,
} = useRsTableInteraction<T>({
  multiSort: () => props.multiSort,
  maxSort: () => props.maxSort,
  columnDraggable: () => props.columnDraggable,
  selectable: () => props.selectable,
  selectionType: () => props.selectionType,
  rowSelectable: props.rowSelectable,
  rowDraggable: () => props.rowDraggable,
  rowDragTrigger: () => props.rowDragTrigger,
  rowDropMode: () => props.rowDropMode,
  rowDraggableWhen: props.rowDraggableWhen,
  rowDropTargetWhen: props.rowDropTargetWhen,
  canRowDrop: props.canRowDrop,
  rowKey: () => props.rowKey,
  rowKeyByIndex: () => rowKeyByIndex.value,
  selectedRowKeys: {
    get: () => selectedRowKeys.value,
    set: (keys) => {
      selectedRowKeys.value = keys
    },
  },
  selectedKeySet: () => selectedKeySet.value,
  selectableRowKeys: () => selectableRowKeys.value,
  selectAllState: () => selectAllState.value,
  expandedRowKeys: {
    get: () => expandedRowKeys.value,
    set: (keys) => {
      expandedRowKeys.value = keys
    },
  },
  expandedKeySet: () => expandedKeySet.value,
  treeMode: () => treeMode.value,
  treeCheckStrictly: () => treeCheckStrictly.value,
  treeLazy: () => treeLazy.value,
  treeChildrenField: () => treeChildrenField.value,
  treeIsLeafField: () => treeIsLeafField.value,
  treeLoadingKeys: {
    get: () => treeLoadingKeys.value,
    set: (keys) => {
      treeLoadingKeys.value = keys
    },
  },
  treeLoadingKeySet: () => treeLoadingKeySet.value,
  tableTreeNodeIndex: () => tableTreeNodeIndex.value,
  treeConfig: () => props.treeConfig,
  expandable: () => props.expandable,
  rowExpandable: props.rowExpandable,
  sortState: {
    get: () => sortState.value,
    set: (value) => {
      sortState.value = value
    },
  },
  sortsState: {
    get: () => sortsState.value,
    set: (value) => {
      sortsState.value = value
    },
  },
  columnOrderState: {
    get: () => columnOrderState.value,
    set: (value) => {
      columnOrderState.value = value
    },
  },
  isEditingAny: () => Boolean(tableEdit.editingCell.value),
  applyRowClickHighlight: (key) => rowHighlight.applyRowClickHighlight(key),
  onRowClickEmit: (row, index) => emit('rowClick', row, index),
  onRowDblclickEmit: (row, index) => emit('rowDblclick', row, index),
  onRowDragStartEmit: (dragKeys, event) => emit('rowDragStart', dragKeys, event),
  onRowDropEmit: (dragKeys, dropKey, position) => emit('rowDrop', dragKeys, dropKey, position),
})

const {
  ctxMenuItems,
  onCtxMenuSelect,
  onContextmenuCapture,
  onTableContextmenu,
  onRowContextmenu,
  onCellContextmenu,
} = useRsTableContextMenu<T>({
  enabled: contextMenuEnabled,
  dataRows: () => dataRows.value,
  displayColumns: () => displayColumns.value,
  selectedRows: () => selectedRows.value,
  rowKey: () => props.rowKey,
  rowKeyByIndex: () => rowKeyByIndex.value,
  copyCellLabel: () => t('table.copyCell'),
  copyRowLabel: () => t('table.copyRow'),
  contextMenuItems: (row, selected) => props.contextMenuItems?.(row, selected) ?? [],
  shouldSelectOnContextmenu: () => props.selectOnContextmenu ?? props.selectable,
  canSelectRow,
  isRowSelected,
  selectionType: () => props.selectionType,
  getSelectedRowKeys: () => selectedRowKeys.value,
  setSelectedRowKeys: (keys) => {
    selectedRowKeys.value = keys
  },
  selectRowKeys,
  getDraft: tableEdit.getDraft,
  onSelect: (key, row, selected) => emit('contextMenuSelect', key, row, selected),
  onRowContextmenu: (row, rowIndex, event) => emit('rowContextmenu', row, rowIndex, event),
})

function cellTooltipEnabled(column: RsTableColumn<T>, rowIndex: number): boolean {
  return props.cellTooltip && columnUsesSharedTooltip(column) && !slots[column.key]
}

function cellTooltipMode(column: RsTableColumn<T>, rowIndex: number): string | undefined {
  if (!cellTooltipEnabled(column, rowIndex)) return undefined
  return resolveCellTooltipMode(column) ?? undefined
}

function cellTooltipText(column: RsTableColumn<T>, row: T, rowIndex: number): string | undefined {
  if (!cellTooltipEnabled(column, rowIndex)) return undefined
  const text = resolveCellTooltipText(column, row, rowIndex)
  return text || undefined
}

function cellTooltipFallbackTitle(column: RsTableColumn<T>, row: T, rowIndex: number): string | undefined {
  if (props.cellTooltip || !column.ellipsis || slots[column.key]) return undefined
  const text = resolveCellTooltipText(column, row, rowIndex)
  return text || undefined
}

function hasColumnSlot(key: string): boolean {
  return Boolean(slots[key])
}

function hasEditSlot(key: string): boolean {
  return Boolean(slots[\`edit-\${key}\`])
}

const {
  resolveColumnByKey,
  onCellStartEdit,
  onCellUpdateDraft,
  onCellCancelEdit,
  onCellCommitEdit,
  onCellNavigate,
  onCellClick,
  onCellDblclick,
  onEditUndo,
  onEditRedo,
  onTableKeydown,
  onTablePaste,
  rejectRowEdit,
  onRowCommitEdit,
  onRowRollbackEdit,
  rowEditPending,
  onGutterCommit,
} = useRsTableEditActions<T>({
  tableEdit,
  editable: () => props.editable,
  editTrigger: () => props.editTrigger,
  editKeyboard: () => props.editKeyboard,
  editUndo: () => props.editUndo,
  editPaste: () => props.editPaste,
  editBatch: () => props.editBatch,
  allowNull: () => props.allowNull,
  rowCommit: () => props.rowCommit,
  selectable: () => props.selectable,
  selectionType: () => props.selectionType,
  selectedRowKeys: () => selectedRowKeys.value,
  displayColumns: () => displayColumns.value,
  dataRows: () => dataRows.value,
  rowKeyFor,
  rowPending: props.rowPending,
  applyRowClickHighlight: (key) => rowHighlight.applyRowClickHighlight(key),
  onRowClick,
  onRowDblclick,
  emit: {
    cellView: (row, column, index) => emit('cellView', row, column, index),
    cellEditStart: (row, column, index) => emit('cellEditStart', row, column, index),
    cellEditDialog: (row, column, index, draft) => emit('cellEditDialog', row, column, index, draft),
    cellEditCommit: (row, column, index, value, previous) =>
      emit('cellEditCommit', row, column, index, value, previous),
    cellEditCancel: (row, column, index) => emit('cellEditCancel', row, column, index),
    cellEditInvalid: (row, column, index, message, value) =>
      emit('cellEditInvalid', row, column, index, message, value),
    cellEditBatchCommit: (column, changes) => emit('cellEditBatchCommit', column, changes),
    cellEditUndo: (entry) => emit('cellEditUndo', entry),
    cellEditRedo: (entry) => emit('cellEditRedo', entry),
    cellEditReject: (row, index, reason) => emit('cellEditReject', row, index, reason),
    rowEditCommit: (row, index, changes) => emit('rowEditCommit', row, index, changes),
    rowEditRollback: (row, index) => emit('rowEditRollback', row, index),
  },
})

`

s = s.slice(0, start) + replacement + s.slice(end)

fs.writeFileSync(path, s.replace(/\n/g, '\r\n'))
console.log('ok lines', s.split('\n').length)
