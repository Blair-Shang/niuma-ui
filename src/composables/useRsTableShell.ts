/**
 * RsTable 壳层装配：前缀列几何 + 列宽/列虚拟/列布局 + 交互 + 右键菜单。
 *
 * 性能约定（不可破）：
 * - 列宽拖拽仍走 useRsTableColumnResize 的 DOM 直写（禁止拖拽中写 reactive 全表宽）
 * - columnVirtual 在 isColumnResizing 时冻结切片，避免拖宽时重算窗口
 * - 不引入对 data 的 deep watch；状态经 getter / 受控 ref 读写
 *
 * 不做：Engine/Virtual 行切片（useRsTableCore）、编辑提交（useRsTableEditActions）、模板。
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import type { RsContextMenuItem } from '../components/context-menu-utils'
import type { RsTableRowDragTrigger, RsTableRowDropMode } from '../components/table-drag'
import type {
  RsTableColumn,
  RsTableRowData,
  RsTableRowEntry,
  RsTableRowKey,
  RsTableSelectionType,
  RsTableSortState,
  RsTableTreeConfig,
  RsTableTreeNodeIndex,
  RsTableRowDropPosition,
} from '../components/table-utils'
import { resolveScrollWidth, selectRowKeys } from '../components/table-utils'
import {
  measureRsTablePrefixWidth,
  RS_TABLE_PREFIX_COL_WIDTH,
  useRsTableColumnVirtual,
} from './useRsTableColumnVirtual'
import { useRsTableColumnLayout } from './useRsTableColumnLayout'
import { useRsTableColumnResize } from './useRsTableColumnResize'
import { useRsTableContextMenu } from './useRsTableContextMenu'
import { useRsTableInteraction } from './useRsTableInteraction'
import { resolveVirtualListHeight } from '../components/virtual-list-utils'

/** 壳层依赖的 Core 状态切片（显式列出，避免吞整个 core） */
export interface UseRsTableShellCoreSlice<T extends RsTableRowData> {
  displayColumns: ComputedRef<RsTableColumn<T>[]>
  resolvedColumnWidths: {
    get: () => Record<string, number>
    set: (value: Record<string, number>) => void
  } | Ref<Record<string, number>>
  useStableColumnWidths: ComputedRef<boolean>
  scrollLeft: Ref<number>
  measuredViewportWidth: Ref<number>
  virtualScrollEnabled: ComputedRef<boolean>
  dataRows: ComputedRef<Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>>
  selectedRows: ComputedRef<T[]>
  rowKeyByIndex: ComputedRef<Map<number, string>>
  selectedRowKeys: {
    get: () => string[]
    set: (keys: string[]) => void
  } | Ref<string[]>
  selectedKeySet: ComputedRef<Set<string>>
  selectableRowKeys: ComputedRef<string[]>
  selectAllState: ComputedRef<'checked' | 'indeterminate' | 'unchecked'>
  expandedRowKeys: {
    get: () => string[]
    set: (keys: string[]) => void
  } | Ref<string[]>
  expandedKeySet: ComputedRef<Set<string>>
  detailExpandable: ComputedRef<boolean>
  treeMode: ComputedRef<boolean>
  treeCheckStrictly: ComputedRef<boolean>
  treeLazy: ComputedRef<boolean>
  treeChildrenField: ComputedRef<string>
  treeIsLeafField: ComputedRef<string>
  treeLoadingKeys: {
    get: () => string[]
    set: (keys: string[]) => void
  } | Ref<string[]>
  treeLoadingKeySet: ComputedRef<Set<string>>
  tableTreeNodeIndex: ComputedRef<Map<string, RsTableTreeNodeIndex> | null>
  sortState: {
    get: () => RsTableSortState | null
    set: (value: RsTableSortState | null) => void
  } | Ref<RsTableSortState | null>
  sortsState: {
    get: () => RsTableSortState[]
    set: (value: RsTableSortState[]) => void
  } | Ref<RsTableSortState[]>
  columnOrderState: {
    get: () => string[]
    set: (value: string[]) => void
  } | Ref<string[]>
}

function asAccessor<T>(source: { get: () => T; set: (v: T) => void } | Ref<T>): {
  get: () => T
  set: (v: T) => void
} {
  if ('get' in source && typeof source.get === 'function') return source
  const r = source as Ref<T>
  return {
    get: () => r.value,
    set: (v) => {
      r.value = v
    },
  }
}

export interface UseRsTableShellOptions<T extends RsTableRowData> {
  core: UseRsTableShellCoreSlice<T>
  // chrome / layout props
  rowDraggable: () => boolean
  rowDragTrigger: () => RsTableRowDragTrigger
  selectable: () => boolean
  selectionType: () => RsTableSelectionType
  scrollX: () => number | string | undefined
  resizable: () => boolean
  minColumnWidth: () => number | undefined
  maxColumnWidth: () => number | undefined
  columnLayout: () => 'auto' | 'fixed'
  virtualColumns: () => boolean | 'auto' | undefined
  virtualColumnsAutoThreshold: () => number | undefined
  virtualColumnOverscan: () => number | undefined
  fill: () => boolean
  infinite: () => boolean
  height: () => number | string | undefined
  showEditGutterColumn: () => boolean
  showIndexColumn: () => boolean
  showRowStatusColumn: () => boolean
  resolvedGutterWidth: () => number
  resolvedIndexWidth: () => number
  // interaction
  multiSort: () => boolean
  maxSort: () => number | undefined
  columnDraggable: () => boolean
  rowSelectable?: (row: T, index: number) => boolean
  rowDropMode: () => RsTableRowDropMode
  rowDraggableWhen?: (row: T, index: number) => boolean
  rowDropTargetWhen?: (row: T, index: number) => boolean
  canRowDrop?: (dragKeys: string[], dropKey: string) => boolean
  rowKey: () => RsTableRowKey<T> | undefined
  treeConfig: () => RsTableTreeConfig<T> | undefined
  expandable: () => boolean
  rowExpandable?: (row: T, index: number) => boolean
  isEditingAny: () => boolean
  applyRowClickHighlight: (key: string) => void
  onRowClickEmit: (row: T, index: number) => void
  onRowDblclickEmit: (row: T, index: number) => void
  onRowDragStartEmit: (dragKeys: string[], event: DragEvent) => void
  onRowDropEmit: (dragKeys: string[], dropKey: string, position: RsTableRowDropPosition) => void
  onColumnResize: (key: string, width: number) => void
  // context menu
  contextMenuEnabled: ComputedRef<boolean> | (() => boolean)
  copyCellLabel: () => string
  copyRowLabel: () => string
  contextMenuItems?: (row: T | null, selectedRows: T[]) => RsContextMenuItem[]
  mergeFeatureMenuItems?: (
    items: RsContextMenuItem[],
    ctx: { row: T | null; selectedRows: T[] },
  ) => RsContextMenuItem[]
  selectOnContextmenu: () => boolean
  getDraft: (rowKey: string, colKey: string) => string | undefined
  onContextMenuSelect: (key: string, row: T | null, selected: T[]) => void
  onRowContextmenuEmit: (row: T, rowIndex: number, event: MouseEvent) => void
}

/**
 * 装配壳层：列几何/布局/交互/右键。
 */
export function useRsTableShell<T extends RsTableRowData>(options: UseRsTableShellOptions<T>) {
  const { core } = options
  const PREFIX_COL_WIDTH = RS_TABLE_PREFIX_COL_WIDTH

  const showRowDragHandle = computed(
    () => options.rowDraggable() && options.rowDragTrigger() === 'handle',
  )
  const dragColumnOffset = computed(() => (showRowDragHandle.value ? 40 : 0))
  const expandColumnOffset = computed(
    () => dragColumnOffset.value + (core.detailExpandable.value ? 40 : 0),
  )
  const showSelectColumn = computed(
    () => options.selectable() && options.selectionType() !== 'row',
  )
  const isRowSelection = computed(
    () => options.selectable() && options.selectionType() === 'row',
  )
  const isRadioSelection = computed(() => options.selectionType() === 'radio')
  const selectColumnOffset = computed(
    () => expandColumnOffset.value + (showSelectColumn.value ? 40 : 0),
  )
  const tableMinWidth = computed(() => resolveScrollWidth(options.scrollX()))

  const selectedRowKeysAcc = asAccessor(core.selectedRowKeys)
  const expandedRowKeysAcc = asAccessor(core.expandedRowKeys)
  const treeLoadingKeysAcc = asAccessor(core.treeLoadingKeys)
  const sortStateAcc = asAccessor(core.sortState)
  const sortsStateAcc = asAccessor(core.sortsState)
  const columnOrderStateAcc = asAccessor(core.columnOrderState)
  const resolvedWidthsAcc = asAccessor(core.resolvedColumnWidths)

  const {
    tableRef,
    isColumnResizing,
    resizePaintWidths,
    onResizeStart,
  } = useRsTableColumnResize<T>({
    resizable: () => options.resizable(),
    minColumnWidth: () => options.minColumnWidth(),
    maxColumnWidth: () => options.maxColumnWidth(),
    displayColumns: () => core.displayColumns.value,
    resolvedColumnWidths: resolvedWidthsAcc,
    measurePrefixColumnWidth: () =>
      measureRsTablePrefixWidth({
        showRowDragHandle: showRowDragHandle.value,
        detailExpandable: core.detailExpandable.value,
        showSelectColumn: showSelectColumn.value,
        showEditGutterColumn: options.showEditGutterColumn(),
        showIndexColumn: options.showIndexColumn(),
        gutterWidth: options.resolvedGutterWidth(),
        indexWidth: options.resolvedIndexWidth(),
      }),
    tableMinWidth: () => tableMinWidth.value,
    onColumnResize: options.onColumnResize,
  })

  /** 拖拽帧用快照，否则持久化宽 —— 供布局/列虚拟共用，避免双份计算 */
  const effectiveColumnWidths = computed(
    () => resizePaintWidths.value ?? resolvedWidthsAcc.get(),
  )

  const {
    virtualColumnsEnabled,
    visibleDataColumns,
    columnPadLeft,
    columnPadRight,
  } = useRsTableColumnVirtual<T>({
    displayColumns: () => core.displayColumns.value,
    virtualColumns: () => options.virtualColumns(),
    virtualColumnsAutoThreshold: () => options.virtualColumnsAutoThreshold(),
    virtualColumnOverscan: () => options.virtualColumnOverscan(),
    isColumnResizing: () => isColumnResizing.value,
    scrollLeft: () => core.scrollLeft.value,
    measuredViewportWidth: () => core.measuredViewportWidth.value,
    columnWidths: () => effectiveColumnWidths.value,
    showRowDragHandle: () => showRowDragHandle.value,
    detailExpandable: () => core.detailExpandable.value,
    showSelectColumn: () => showSelectColumn.value,
    showEditGutterColumn: () => options.showEditGutterColumn(),
    showIndexColumn: () => options.showIndexColumn(),
    showRowStatusColumn: () => options.showRowStatusColumn(),
    resolvedGutterWidth: () => options.resolvedGutterWidth(),
    resolvedIndexWidth: () => options.resolvedIndexWidth(),
  })

  const layout = useRsTableColumnLayout<T>({
    displayColumns: () => core.displayColumns.value,
    effectiveColumnWidths: () => effectiveColumnWidths.value,
    measuredViewportWidth: () => core.measuredViewportWidth.value,
    tableMinWidth: () => tableMinWidth.value,
    resizable: () => options.resizable(),
    columnLayout: () => options.columnLayout(),
    useStableColumnWidths: () => core.useStableColumnWidths.value,
    isColumnResizing: () => isColumnResizing.value,
    virtualColumnsEnabled: () => virtualColumnsEnabled.value,
    scrollX: () => options.scrollX(),
    showRowDragHandle: () => showRowDragHandle.value,
    detailExpandable: () => core.detailExpandable.value,
    showSelectColumn: () => showSelectColumn.value,
    showEditGutterColumn: () => options.showEditGutterColumn(),
    showIndexColumn: () => options.showIndexColumn(),
    showRowStatusColumn: () => options.showRowStatusColumn(),
    resolvedGutterWidth: () => options.resolvedGutterWidth(),
    resolvedIndexWidth: () => options.resolvedIndexWidth(),
    dragColumnOffset: () => dragColumnOffset.value,
    expandColumnOffset: () => expandColumnOffset.value,
    selectColumnOffset: () => selectColumnOffset.value,
    resizePaintWidths: () => resizePaintWidths.value,
  })

  const useScrollContainer = computed(
    () =>
      core.virtualScrollEnabled.value ||
      options.infinite() ||
      virtualColumnsEnabled.value,
  )

  const scrollContainerStyle = computed(() => {
    const style: Record<string, string> = {}
    if (useScrollContainer.value && !options.fill()) {
      const resolvedHeight = resolveVirtualListHeight(options.height(), 320)
      if (resolvedHeight) {
        style.height = resolvedHeight
        style.maxHeight = resolvedHeight
      }
    }
    if (options.showEditGutterColumn()) {
      style['--rs-table-gutter-width'] = `${options.resolvedGutterWidth()}px`
    }
    if (showSelectColumn.value) {
      style['--rs-table-select-width'] = `${PREFIX_COL_WIDTH.select}px`
    }
    if (options.showIndexColumn()) {
      style['--rs-table-index-width'] = `${options.resolvedIndexWidth()}px`
    }
    return Object.keys(style).length ? style : undefined
  })

  const bodyColspan = computed(() => {
    let count = visibleDataColumns.value.length
    if (columnPadLeft.value > 0) count += 1
    if (columnPadRight.value > 0) count += 1
    if (showRowDragHandle.value) count += 1
    if (core.detailExpandable.value) count += 1
    if (showSelectColumn.value) count += 1
    if (options.showEditGutterColumn() || options.showIndexColumn()) count += 1
    if (options.showRowStatusColumn()) count += 1
    return count
  })

  const emptyContentStyle = computed(() => {
    const w = core.measuredViewportWidth.value
    if (w <= 0) return undefined
    return { width: `${w}px` }
  })

  const interaction = useRsTableInteraction<T>({
    multiSort: () => options.multiSort(),
    maxSort: () => options.maxSort(),
    columnDraggable: () => options.columnDraggable(),
    selectable: () => options.selectable(),
    selectionType: () => options.selectionType(),
    rowSelectable: options.rowSelectable,
    rowDraggable: () => options.rowDraggable(),
    rowDragTrigger: () => options.rowDragTrigger(),
    rowDropMode: () => options.rowDropMode(),
    rowDraggableWhen: options.rowDraggableWhen,
    rowDropTargetWhen: options.rowDropTargetWhen,
    canRowDrop: options.canRowDrop,
    rowKey: () => options.rowKey(),
    rowKeyByIndex: () => core.rowKeyByIndex.value,
    selectedRowKeys: selectedRowKeysAcc,
    selectedKeySet: () => core.selectedKeySet.value,
    selectableRowKeys: () => core.selectableRowKeys.value,
    selectAllState: () => core.selectAllState.value,
    expandedRowKeys: expandedRowKeysAcc,
    expandedKeySet: () => core.expandedKeySet.value,
    treeMode: () => core.treeMode.value,
    treeCheckStrictly: () => core.treeCheckStrictly.value,
    treeLazy: () => core.treeLazy.value,
    treeChildrenField: () => core.treeChildrenField.value,
    treeIsLeafField: () => core.treeIsLeafField.value,
    treeLoadingKeys: treeLoadingKeysAcc,
    treeLoadingKeySet: () => core.treeLoadingKeySet.value,
    tableTreeNodeIndex: () => core.tableTreeNodeIndex.value,
    treeConfig: () => options.treeConfig(),
    expandable: () => options.expandable(),
    rowExpandable: options.rowExpandable,
    sortState: sortStateAcc,
    sortsState: sortsStateAcc,
    columnOrderState: columnOrderStateAcc,
    isEditingAny: () => options.isEditingAny(),
    applyRowClickHighlight: options.applyRowClickHighlight,
    onRowClickEmit: options.onRowClickEmit,
    onRowDblclickEmit: options.onRowDblclickEmit,
    onRowDragStartEmit: options.onRowDragStartEmit,
    onRowDropEmit: options.onRowDropEmit,
  })

  const contextMenu = useRsTableContextMenu<T>({
    enabled: options.contextMenuEnabled,
    dataRows: () => core.dataRows.value,
    displayColumns: () => core.displayColumns.value,
    selectedRows: () => core.selectedRows.value,
    rowKey: () => options.rowKey(),
    rowKeyByIndex: () => core.rowKeyByIndex.value,
    copyCellLabel: () => options.copyCellLabel(),
    copyRowLabel: () => options.copyRowLabel(),
    contextMenuItems: (row, selected) => options.contextMenuItems?.(row, selected) ?? [],
    mergeFeatureMenuItems: options.mergeFeatureMenuItems,
    shouldSelectOnContextmenu: () => options.selectOnContextmenu(),
    canSelectRow: interaction.canSelectRow,
    isRowSelected: interaction.isRowSelected,
    selectionType: () => options.selectionType(),
    getSelectedRowKeys: () => selectedRowKeysAcc.get(),
    setSelectedRowKeys: (keys) => selectedRowKeysAcc.set(keys),
    selectRowKeys,
    getDraft: options.getDraft,
    onSelect: options.onContextMenuSelect,
    onRowContextmenu: options.onRowContextmenuEmit,
  })

  return {
    PREFIX_COL_WIDTH,
    showRowDragHandle,
    dragColumnOffset,
    expandColumnOffset,
    showSelectColumn,
    isRowSelection,
    isRadioSelection,
    selectColumnOffset,
    tableMinWidth,
    tableRef,
    isColumnResizing,
    resizePaintWidths,
    onResizeStart,
    effectiveColumnWidths,
    virtualColumnsEnabled,
    visibleDataColumns,
    columnPadLeft,
    columnPadRight,
    ...layout,
    useScrollContainer,
    scrollContainerStyle,
    bodyColspan,
    emptyContentStyle,
    ...interaction,
    ...contextMenu,
  }
}

export type RsTableShellApi<T extends RsTableRowData> = ReturnType<typeof useRsTableShell<T>>
