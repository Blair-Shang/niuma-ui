/**
 * RsTable 行/列交互：排序点击、列拖拽排序、行选/展开、行拖拽封装。
 *
 * 性能约定：
 * - 不引入对 data 的 deep watch
 * - rowKeyFor 走 Engine 的 rowKeyByIndex 缓存，避免热路径重复 resolve
 */

import { ref, type ComputedRef, type Ref } from 'vue'
import {
  createTableRowDragHandlers,
  createTableRowDragState,
  type RsTableRowDragTrigger,
  type RsTableRowDropMode,
} from '../components/table-drag'
import {
  getSortOrderForKey,
  getSortPriorityForKey,
  getTableTreeChildren,
  hasTableTreeChildren,
  isTableRowDisabled,
  reorderColumnKeys,
  resolveRowKey,
  resolveTableTreeCheckState,
  selectRowKeys,
  selectRowKeysByClick,
  toggleExpandedRowKeys,
  toggleMultiSortState,
  toggleSelectAll,
  toggleSortState,
  toggleTableTreeCheck,
  type RsTableColumn,
  type RsTableRowData,
  type RsTableRowEntry,
  type RsTableRowKey,
  type RsTableSelectionType,
  type RsTableSortOrder,
  type RsTableSortState,
  type RsTableTreeConfig,
  type RsTableTreeNodeIndex,
  type RsTableRowDropPosition,
} from '../components/table-utils'

function read<T>(source: ComputedRef<T> | (() => T) | Ref<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

export interface UseRsTableInteractionOptions<T extends RsTableRowData> {
  multiSort: () => boolean
  maxSort: () => number | undefined
  columnDraggable: () => boolean
  selectable: () => boolean
  selectionType: () => RsTableSelectionType
  rowSelectable?: (row: T, index: number) => boolean
  rowDraggable: () => boolean
  rowDragTrigger: () => RsTableRowDragTrigger
  rowDropMode: () => RsTableRowDropMode
  rowDraggableWhen?: (row: T, index: number) => boolean
  rowDropTargetWhen?: (row: T, index: number) => boolean
  canRowDrop?: (dragKeys: string[], dropKey: string) => boolean
  rowKey: () => RsTableRowKey<T> | undefined
  rowKeyByIndex: () => Map<number, string>
  selectedRowKeys: {
    get: () => string[]
    set: (keys: string[]) => void
  }
  selectedKeySet: () => Set<string>
  selectableRowKeys: () => string[]
  selectAllState: () => 'checked' | 'indeterminate' | 'unchecked'
  expandedRowKeys: {
    get: () => string[]
    set: (keys: string[]) => void
  }
  expandedKeySet: () => Set<string>
  treeMode: () => boolean
  treeCheckStrictly: () => boolean
  treeLazy: () => boolean
  treeChildrenField: () => string
  treeIsLeafField: () => string
  treeLoadingKeys: {
    get: () => string[]
    set: (keys: string[]) => void
  }
  treeLoadingKeySet: () => Set<string>
  tableTreeNodeIndex: () => Map<string, RsTableTreeNodeIndex> | null
  treeConfig: () => RsTableTreeConfig<T> | undefined
  expandable: () => boolean
  rowExpandable?: (row: T, index: number) => boolean
  sortState: {
    get: () => RsTableSortState | null
    set: (value: RsTableSortState | null) => void
  }
  sortsState: {
    get: () => RsTableSortState[]
    set: (value: RsTableSortState[]) => void
  }
  columnOrderState: {
    get: () => string[]
    set: (value: string[]) => void
  }
  /** 行选时若正在编辑则不改选中 */
  isEditingAny: () => boolean
  applyRowClickHighlight: (rowKey: string) => void
  onRowClickEmit: (row: T, index: number) => void
  onRowDblclickEmit: (row: T, index: number) => void
  onRowDragStartEmit: (dragKeys: string[], event: DragEvent) => void
  onRowDropEmit: (dragKeys: string[], dropKey: string, position: RsTableRowDropPosition) => void
}

/**
 * 表格交互 API（排序 / 列拖 / 行选展开 / 行拖）。
 */
export function useRsTableInteraction<T extends RsTableRowData>(
  options: UseRsTableInteractionOptions<T>,
) {
  const dragColumnKey = ref<string | null>(null)
  const dropColumnKey = ref<string | null>(null)
  const selectionAnchorKey = ref<string | null>(null)
  const rowDragState = createTableRowDragState()
  const { dragRowKeys, dropRowTargetKey, dropRowPosition } = rowDragState

  function rowKeyFor(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): string {
    return (
      options.rowKeyByIndex().get(entry.rowIndex) ??
      entry.treeKey ??
      resolveRowKey(entry.row, entry.rowIndex, options.rowKey())
    )
  }

  function sortOrderFor(key: string): RsTableSortOrder {
    if (options.multiSort()) return getSortOrderForKey(options.sortsState.get(), key)
    const sort = options.sortState.get()
    return sort?.key === key ? sort.order : null
  }

  function sortPriorityFor(key: string): number {
    if (!options.multiSort()) return 0
    return getSortPriorityForKey(options.sortsState.get(), key)
  }

  function sortIconName(key: string): string {
    const order = sortOrderFor(key)
    if (order === 'asc') return 'arrow-up'
    if (order === 'desc') return 'arrow-down'
    return 'arrow-up-down'
  }

  function onHeaderClick(column: RsTableColumn<T>): void {
    if (!column.sortable) return
    if (options.multiSort()) {
      options.sortsState.set(
        toggleMultiSortState(options.sortsState.get(), column.key, options.maxSort()),
      )
      return
    }
    options.sortState.set(toggleSortState(options.sortState.get(), column.key))
  }

  function onColumnDragStart(key: string, event: DragEvent): void {
    if (!options.columnDraggable()) return
    dragColumnKey.value = key
    dropColumnKey.value = null
    if (!event.dataTransfer) return
    event.dataTransfer.setData('text/plain', key)
    event.dataTransfer.effectAllowed = 'move'
  }

  function onColumnDragOver(key: string, event: DragEvent): void {
    if (!options.columnDraggable() || !dragColumnKey.value) return
    if (dragColumnKey.value === key) {
      if (dropColumnKey.value !== null) dropColumnKey.value = null
      return
    }
    event.preventDefault()
    if (dropColumnKey.value !== key) dropColumnKey.value = key
  }

  function onColumnDrop(key: string, event: DragEvent): void {
    if (!options.columnDraggable() || !dragColumnKey.value) return
    event.preventDefault()
    if (dragColumnKey.value === key) return
    options.columnOrderState.set(
      reorderColumnKeys(options.columnOrderState.get(), dragColumnKey.value, key),
    )
    dragColumnKey.value = null
    dropColumnKey.value = null
  }

  function onColumnDragEnd(): void {
    dragColumnKey.value = null
    dropColumnKey.value = null
  }

  const isRowSelection = () =>
    options.selectable() && options.selectionType() === 'row'

  function canSelectRow(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    if (isTableRowDisabled(entry.row)) return false
    return options.rowSelectable ? options.rowSelectable(entry.row, entry.rowIndex) : true
  }

  function isRowSelected(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    const key = rowKeyFor(entry)
    const index = options.tableTreeNodeIndex()
    if (index && !options.treeCheckStrictly()) {
      return resolveTableTreeCheckState(key, options.selectedKeySet(), index, false) === 'checked'
    }
    return options.selectedKeySet().has(key)
  }

  function isRowIndeterminate(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    const index = options.tableTreeNodeIndex()
    if (!index || options.treeCheckStrictly()) return false
    return (
      resolveTableTreeCheckState(rowKeyFor(entry), options.selectedKeySet(), index, false) ===
      'indeterminate'
    )
  }

  function onToggleRow(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): void {
    if (!canSelectRow(entry)) return
    const key = rowKeyFor(entry)
    const index = options.tableTreeNodeIndex()
    if (index && !options.treeCheckStrictly() && options.selectionType() !== 'radio') {
      options.selectedRowKeys.set(
        toggleTableTreeCheck(key, options.selectedKeySet(), index, false),
      )
      return
    }
    options.selectedRowKeys.set(
      selectRowKeys(options.selectedRowKeys.get(), key, options.selectionType()),
    )
  }

  function onToggleSelectAll(): void {
    const select = options.selectAllState() !== 'checked'
    options.selectedRowKeys.set(
      toggleSelectAll(options.selectedRowKeys.get(), options.selectableRowKeys(), select),
    )
  }

  function canExpandRow(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    if (options.treeMode()) {
      if (entry.hasChildren != null) return entry.hasChildren
      return hasTableTreeChildren(entry.row, {
        childrenField: options.treeChildrenField(),
        isLeafField: options.treeIsLeafField(),
        lazy: options.treeLazy(),
      })
    }
    if (!options.expandable()) return false
    if (options.rowExpandable) return options.rowExpandable(entry.row, entry.rowIndex)
    return true
  }

  function isRowExpanded(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    return options.expandedKeySet().has(rowKeyFor(entry))
  }

  function treeDepthOf(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): number {
    return entry.depth ?? 0
  }

  async function onToggleExpand(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
  ): Promise<void> {
    if (!canExpandRow(entry)) return
    const key = rowKeyFor(entry)
    const expanding = !options.expandedKeySet().has(key)
    const tree = options.treeConfig()

    if (
      options.treeMode() &&
      expanding &&
      options.treeLazy() &&
      tree?.loadData &&
      getTableTreeChildren(entry.row, options.treeChildrenField()).length === 0
    ) {
      if (options.treeLoadingKeySet().has(key)) return
      options.treeLoadingKeys.set([...options.treeLoadingKeys.get(), key])
      try {
        const loaded = await tree.loadData(entry.row, key)
        if (Array.isArray(loaded)) {
          ;(entry.row as Record<string, unknown>)[options.treeChildrenField()] = loaded
        }
      } finally {
        options.treeLoadingKeys.set(options.treeLoadingKeys.get().filter((item) => item !== key))
      }
    }

    options.expandedRowKeys.set(toggleExpandedRowKeys(options.expandedRowKeys.get(), key))
  }

  function onRowClick(entry: RsTableRowEntry<T>, event?: MouseEvent): void {
    if (entry.type !== 'row') return
    const rowKey = rowKeyFor(entry)
    if (isRowSelection() && canSelectRow(entry) && !options.isEditingAny()) {
      const toggle = Boolean(event && (event.ctrlKey || event.metaKey))
      const range = Boolean(event?.shiftKey)
      options.selectedRowKeys.set(
        selectRowKeysByClick(options.selectedRowKeys.get(), rowKey, {
          toggle,
          range,
          orderedKeys: options.selectableRowKeys(),
          anchorKey: selectionAnchorKey.value,
        }),
      )
      if (!range) selectionAnchorKey.value = rowKey
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges()
      }
    }
    options.applyRowClickHighlight(rowKey)
    options.onRowClickEmit(entry.row, entry.rowIndex)
  }

  function onRowSelectMouseDown(event: MouseEvent): void {
    if (!isRowSelection()) return
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault()
    }
  }

  function onRowDblclick(entry: RsTableRowEntry<T>, _event?: MouseEvent): void {
    if (entry.type !== 'row') return
    options.onRowDblclickEmit(entry.row, entry.rowIndex)
  }

  const rowDrag = createTableRowDragHandlers<T>({
    state: rowDragState,
    getRowDraggable: () => options.rowDraggable(),
    getRowDragTrigger: () => options.rowDragTrigger(),
    getRowDropMode: () => options.rowDropMode(),
    rowDraggableWhen: options.rowDraggableWhen,
    rowDropTargetWhen: options.rowDropTargetWhen,
    canRowDrop: options.canRowDrop,
    rowKeyFor: (row, index) => resolveRowKey(row, index, options.rowKey()),
    isRowDisabled: isTableRowDisabled,
    getSelectedKeys: () => options.selectedRowKeys.get(),
    onDragStart: (dragKeys, event) => options.onRowDragStartEmit(dragKeys, event),
    onDrop: (dragKeys, dropKey, position) =>
      options.onRowDropEmit(dragKeys, dropKey, position),
  })

  function onRowDragStart(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    event: DragEvent,
  ): void {
    rowDrag.onRowDragStart(entry.row, entry.rowIndex, event)
  }

  function onRowDragOver(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    event: DragEvent,
  ): void {
    rowDrag.onRowDragOver(entry.row, entry.rowIndex, event)
  }

  function onRowDragLeave(event: DragEvent): void {
    rowDrag.onRowDragLeave(event)
  }

  function onRowDrop(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    event: DragEvent,
  ): void {
    rowDrag.onRowDrop(entry.row, entry.rowIndex, event)
  }

  function onRowDragEnd(): void {
    rowDrag.onRowDragEnd()
  }

  function isRowDropTarget(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    return rowDrag.isRowDropTarget(rowKeyFor(entry))
  }

  function isRowDragging(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    return rowDrag.isRowDragging(rowKeyFor(entry))
  }

  function canDragRow(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    return rowDrag.canDragRow(entry.row, entry.rowIndex)
  }

  function isRowDragByRow(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    return options.rowDraggable() && options.rowDragTrigger() === 'row' && canDragRow(entry)
  }

  return {
    dragColumnKey,
    dropColumnKey,
    selectionAnchorKey,
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
  }
}

export type RsTableInteractionApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableInteraction<T>
>
