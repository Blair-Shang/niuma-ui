<script setup lang="ts" generic="T extends import('./table-utils').RsTableRowData = any">
import { computed, ref, useSlots } from 'vue'
import RsContextMenu from './RsContextMenu.vue'
import { assembleRsTableApi } from '../composables/assembleRsTableApi'
import { bindRsTableViewContext } from '../composables/bindRsTableViewContext'
import { createRsTableEditEmitBridge } from '../composables/createRsTableEditEmitBridge'
import { useRsI18n } from '../composables/useRsI18n'
import { useTableCellTooltip } from '../composables/useTableCellTooltip'
import { useRsTableCore } from '../composables/useRsTableCore'
import { useRsTableEditLayer } from '../composables/useRsTableEditLayer'
import { useRsTableScrollHost } from '../composables/useRsTableScrollHost'
import { useRsTableShell } from '../composables/useRsTableShell'
import { useRsTableShellChrome } from '../composables/useRsTableShellChrome'
import { useRsTableSummary } from '../composables/useRsTableSummary'
import RsTableBody from './table/RsTableBody.vue'
import RsTableColGroup from './table/RsTableColGroup.vue'
import RsTableHeader from './table/RsTableHeader.vue'
import {
  RS_TABLE_PROP_DEFAULTS,
  type RsTableEmits,
  type RsTableProps,
} from './table/rs-table-props'
import RsTableSummaryRow from './table/RsTableSummaryRow.vue'
import type { RsTableFeature } from './table/table-features'
import { hasTableSummaryConfig } from './table/table-summary-utils'
import './table/rs-table.css'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<RsTableProps<T>>(), RS_TABLE_PROP_DEFAULTS)
const emit = defineEmits<RsTableEmits<T>>()
const slots = useSlots()
const { t } = useRsI18n()

const sharedTipRef = ref<HTMLElement | null>(null)
const {
  state: cellTipState,
  onPointerOver: onCellTipOver,
  onPointerOut: onCellTipOut,
  hide: hideCellTooltip,
} = useTableCellTooltip({
  enabled: () => props.cellTooltip,
  headerEnabled: () => props.headerTooltip,
  delay: () => props.cellTooltipDelay,
  tipRef: sharedTipRef,
})

const contextMenuEnabled = computed(() => props.contextMenu !== false)

/** 编辑层（早期）：须在 Shell 前，供 isEditingAny / 前缀列几何 */
const {
  tableEdit,
  rowHighlight,
  showEditGutterColumn,
  showIndexColumn,
  showRowStatusColumn,
  resolvedGutterWidth,
  resolvedIndexWidth,
  activeEditCellKey,
  activeFocusCellKey,
  activeErrorMapSize,
  activeValidatingMapSize,
  isEditingAny,
  cellTooltipEnabled,
  cellTooltipMode,
  cellTooltipText,
  cellTooltipFallbackTitle,
  bindActions: bindEditActions,
} = useRsTableEditLayer<T>({
  editable: () => props.editable,
  editGutter: () => props.editGutter,
  editGutterWidth: () => props.editGutterWidth,
  showIndex: () => props.showIndex,
  indexWidth: () => props.indexWidth,
  rowCommit: () => props.rowCommit,
  showRowStatus: () => props.showRowStatus,
  editUndoLimit: () => props.editUndoLimit,
  highlightRow: () => props.highlightRow,
  highlightRowOnClick: () => props.highlightRowOnClick,
  highlightedRowKey: () => props.highlightedRowKey,
  defaultHighlightedRowKey: () => props.defaultHighlightedRowKey,
  onHighlightUpdate: (value) => {
    if (props.highlightedRowKey !== undefined) emit('update:highlightedRowKey', value)
    emit('highlightChange', value)
  },
  cellTooltip: () => props.cellTooltip,
  hasColumnSlot: (key) => Boolean(slots[key]),
})

/**
 * 汇总 feature 轻量判定（先于 Core，避免与 Summary 循环依赖）。
 * 不构建 summaryCells，仅影响 feature id 登记。
 */
const summaryFeatureEnabledEarly = computed(
  () =>
    Boolean(props.showSummary) ||
    hasTableSummaryConfig({
      columns: props.columns,
      mode: props.summaryMode,
      summaryData: props.summaryData,
    }),
)

/** 内核：Columns + Engine + Scroll + Virtual + Analytics + Features（浅层 data，签名重绑） */
const {
  columnOrderState,
  columnFiltersState,
  displayColumns,
  resolvedColumnWidths,
  useStableColumnWidths,
  updateColumnFilter,
  columnFilterValue,
  resolvedSize,
  sortState,
  sortsState,
  selectedRowKeys,
  selectedKeySet,
  expandedRowKeys,
  expandedKeySet,
  treeMode,
  detailExpandable,
  treeChildrenField,
  treeIsLeafField,
  treeLazy,
  treeCheckStrictly,
  treeIndentPx,
  treeExpandColumnKey,
  treeFixExpandColumn,
  treeLoadingKeys,
  treeLoadingKeySet,
  tableTreeNodeIndex,
  tableEntries,
  dataRows,
  selectableRowKeys,
  rowKeyByIndex,
  selectedRows,
  selectAllState,
  viewRows,
  internalSelectedRowKeys,
  internalExpandedRowKeys,
  isExpandedControlled,
  isSelectionControlled,
  scrollTop,
  scrollLeft,
  scrollContainerRef,
  measuredViewportHeight,
  measuredViewportWidth,
  viewportHeight,
  captureScrollFromDom,
  scheduleVirtualLayoutSync,
  onScrollFrame,
  bindScrollElement,
  fixedRowHeight,
  virtualScrollEnabled,
  virtualHeightModel,
  virtualSlice,
  visibleEntries,
  analyticsSource,
  tableSurface,
} = useRsTableCore<T>({
  columns: () => props.columns,
  data: () => props.data,
  rowKey: () => props.rowKey,
  compact: () => props.compact,
  size: () => props.size,
  columnOrder: () => props.columnOrder,
  defaultColumnOrder: props.defaultColumnOrder,
  columnFilters: () => props.columnFilters,
  defaultColumnFilters: props.defaultColumnFilters ?? {},
  initialColumnWidths: () => props.initialColumnWidths,
  resizable: () => props.resizable,
  columnLayout: () => props.columnLayout,
  sort: () => props.sort,
  defaultSort: props.defaultSort ?? null,
  sorts: () => props.sorts,
  defaultSorts: props.defaultSorts,
  multiSort: () => props.multiSort,
  remoteSort: () => props.remoteSort,
  filterText: () => props.filterText,
  filterKeys: () => props.filterKeys,
  groupBy: () => props.groupBy,
  groupLabel: () => props.groupLabel,
  treeConfig: () => props.treeConfig,
  expandable: () => props.expandable,
  rowExpandable: () => props.rowExpandable,
  selectedRowKeys: () => props.selectedRowKeys,
  defaultSelectedRowKeys: props.defaultSelectedRowKeys,
  expandedRowKeys: () => props.expandedRowKeys,
  defaultExpandedRowKeys: props.defaultExpandedRowKeys,
  rowSelectable: () => props.rowSelectable,
  height: () => props.height,
  layoutActive: () => props.layoutActive,
  viewKey: () => props.viewKey,
  virtual: () => props.virtual,
  virtualAutoThreshold: () => props.virtualAutoThreshold ?? 0,
  fill: () => props.fill,
  infinite: () => Boolean(props.infinite),
  virtualOnInfinite: () => props.virtualOnInfinite !== false,
  overscan: () => props.overscan,
  expandRowHeight: () => props.expandRowHeight,
  rowHeight: () => props.rowHeight,
  selectable: () => props.selectable,
  editable: () => props.editable,
  contextMenu: () => props.contextMenu !== false,
  summaryFeatureEnabled: () => summaryFeatureEnabledEarly.value,
  features: () => props.features as RsTableFeature<T>[] | undefined,
  emit: emit as any,
})

/** 壳层：列宽 DOM 直写 + 列虚拟/布局 + 交互 + 右键（不碰 data deep watch） */
const {
  PREFIX_COL_WIDTH,
  showRowDragHandle,
  showSelectColumn,
  isRowSelection,
  isRadioSelection,
  tableRef,
  onResizeStart,
  virtualColumnsEnabled,
  visibleDataColumns,
  columnPadLeft,
  columnPadRight,
  useFixedColumnLayout,
  tableInlineStyle,
  overflowXEnabled,
  resolvedDataColumnWidth,
  columnStyleMap,
  columnHeaderStyleMap,
  columnTdClassMap,
  dragLeadStyle,
  expandLeadStyle,
  selectLeadStyle,
  indexLeadStyle,
  gutterLeadStyle,
  dragLeadHeaderStyle,
  expandLeadHeaderStyle,
  selectLeadHeaderStyle,
  indexLeadHeaderStyle,
  gutterLeadHeaderStyle,
  scrollContainerStyle,
  bodyColspan,
  emptyContentStyle,
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
  ctxMenuItems,
  onCtxMenuSelect,
  onContextmenuCapture,
  onTableContextmenu,
  onRowContextmenu,
  onCellContextmenu,
} = useRsTableShell<T>({
  core: {
    displayColumns,
    resolvedColumnWidths,
    useStableColumnWidths,
    scrollLeft,
    measuredViewportWidth,
    virtualScrollEnabled,
    dataRows,
    selectedRows,
    rowKeyByIndex,
    selectedRowKeys,
    selectedKeySet,
    selectableRowKeys,
    selectAllState,
    expandedRowKeys,
    expandedKeySet,
    detailExpandable,
    treeMode,
    treeCheckStrictly,
    treeLazy,
    treeChildrenField,
    treeIsLeafField,
    treeLoadingKeys,
    treeLoadingKeySet,
    tableTreeNodeIndex,
    sortState,
    sortsState,
    columnOrderState,
  },
  rowDraggable: () => props.rowDraggable,
  rowDragTrigger: () => props.rowDragTrigger,
  selectable: () => props.selectable,
  selectionType: () => props.selectionType,
  scrollX: () => props.scrollX,
  resizable: () => props.resizable,
  minColumnWidth: () => props.minColumnWidth,
  maxColumnWidth: () => props.maxColumnWidth,
  columnLayout: () => props.columnLayout,
  virtualColumns: () => props.virtualColumns,
  virtualColumnsAutoThreshold: () => props.virtualColumnsAutoThreshold,
  virtualColumnOverscan: () => props.virtualColumnOverscan,
  fill: () => props.fill,
  infinite: () => Boolean(props.infinite),
  height: () => props.height,
  showEditGutterColumn: () => showEditGutterColumn.value,
  showIndexColumn: () => showIndexColumn.value,
  showRowStatusColumn: () => showRowStatusColumn.value,
  resolvedGutterWidth: () => resolvedGutterWidth.value,
  resolvedIndexWidth: () => resolvedIndexWidth.value,
  multiSort: () => props.multiSort,
  maxSort: () => props.maxSort,
  columnDraggable: () => props.columnDraggable,
  rowSelectable: props.rowSelectable,
  rowDropMode: () => props.rowDropMode,
  rowDraggableWhen: props.rowDraggableWhen,
  rowDropTargetWhen: props.rowDropTargetWhen,
  canRowDrop: props.canRowDrop,
  rowKey: () => props.rowKey,
  treeConfig: () => props.treeConfig,
  expandable: () => props.expandable,
  rowExpandable: props.rowExpandable,
  isEditingAny,
  applyRowClickHighlight: (key) => rowHighlight.applyRowClickHighlight(key),
  onRowClickEmit: (row, index) => emit('rowClick', row, index),
  onRowDblclickEmit: (row, index) => emit('rowDblclick', row, index),
  onRowDragStartEmit: (dragKeys, event) => emit('rowDragStart', dragKeys, event),
  onRowDropEmit: (dragKeys, dropKey, position) => emit('rowDrop', dragKeys, dropKey, position),
  onColumnResize: (key, width) => emit('columnResize', key, width),
  contextMenuEnabled,
  copyCellLabel: () => t('table.copyCell'),
  copyRowLabel: () => t('table.copyRow'),
  contextMenuItems: (row, selected) => props.contextMenuItems?.(row, selected) ?? [],
  mergeFeatureMenuItems: (items, menuCtx) => tableSurface.mergeContextMenuItems(items, menuCtx),
  selectOnContextmenu: () => props.selectOnContextmenu ?? props.selectable,
  getDraft: tableEdit.getDraft,
  onContextMenuSelect: (key, row, selected) => emit('contextMenuSelect', key, row, selected),
  onRowContextmenuEmit: (row, rowIndex, event) => emit('rowContextmenu', row, rowIndex, event),
})

const {
  summaryFeatureEnabled,
  summaryCells,
  showBuiltinSummaryRow,
  summaryPrefixColspan,
} = useRsTableSummary<T>({
  showSummary: () => props.showSummary,
  summaryMode: () => props.summaryMode,
  summaryData: () => props.summaryData,
  columns: () => props.columns,
  displayColumns: () => displayColumns.value,
  viewRows: () => viewRows.value,
  hasSummarySlot: () => Boolean(slots.summary),
  treeMode,
  detailExpandable,
  showRowDragHandle,
  showSelectColumn,
  showEditGutterOrIndex: () => showEditGutterColumn.value || showIndexColumn.value,
  showRowStatusColumn,
})

const {
  onCellStartEdit,
  onCellUpdateDraft,
  onCellCancelEdit,
  onCellCommitEdit,
  onCellNavigate,
  onCellClick,
  onCellDblclick,
  onTableKeydown,
  onTablePaste,
  onRowCommitEdit,
  onRowRollbackEdit,
  isExternalRowPending,
  rowEditPending,
  onGutterCommit,
  getRowByKey,
  getRowByIndex,
  getColumnValues,
  getCellValue,
  toApiEditSlice,
} = bindEditActions({
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
  onRowClick,
  onRowDblclick,
  emit: createRsTableEditEmitBridge(emit),
})

const {
  hasData,
  headerLabels,
  bodyLabels,
  hasColumnSlot,
  hasEditSlot,
  tableA11y,
  shellBind,
  onShellKeydown,
  scrollHostClass,
} = useRsTableShellChrome<T>({
  ariaLabel: () => props.ariaLabel,
  loading: () => Boolean(props.loading),
  dataRows,
  visibleDataColumns,
  displayColumns: () => displayColumns.value,
  tableEdit,
  rowKeyFor,
  applyRowClickHighlight: (key) => rowHighlight.applyRowClickHighlight(key),
  pageSize: () =>
    Math.max(5, Math.floor((Number(props.height) || 320) / (fixedRowHeight.value || 36))),
  onTableKeydown,
  scrollContainerRef,
  hostClass: {
    bordered: () => props.bordered,
    columnBordered: () => props.columnBordered,
    rounded: () => props.rounded,
    fill: () => props.fill,
    compact: () => props.compact,
    resolvedSize: () => resolvedSize.value,
    virtualScrollEnabled: () => virtualScrollEnabled.value,
    virtualColumnsEnabled: () => virtualColumnsEnabled.value,
    dataLength: () => props.data.length,
    infinite: () => Boolean(props.infinite),
    resizable: () => props.resizable,
    columnLayout: () => props.columnLayout,
    useFixedColumnLayout: () => useFixedColumnLayout.value,
    striped: () => props.striped,
    selectable: () => props.selectable,
    isRowSelection: () => isRowSelection.value,
    detailExpandable: () => detailExpandable.value,
    treeMode: () => treeMode.value,
    rowDraggable: () => props.rowDraggable,
    columnDraggable: () => props.columnDraggable,
    scrollX: () => props.scrollX,
    overflowXEnabled: () => overflowXEnabled.value,
    contextMenuEnabled: () => contextMenuEnabled.value,
    showEditGutterColumn: () => showEditGutterColumn.value,
  },
})

const { onScroll } = useRsTableScrollHost({
  scrollContainerRef,
  scheduleVirtualLayoutSync,
  bindScrollElement,
  captureScrollFromDom,
  onScrollFrame,
  hideCellTooltip,
  infinite: () => Boolean(props.infinite),
  loading: () => Boolean(props.loading),
  loadingMore: () => Boolean(props.loadingMore),
  hasMore: () => Boolean(props.hasMore),
  infiniteDistance: () => props.infiniteDistance ?? 80,
  onLoadMore: () => emit('loadMore'),
})

const tableApi = assembleRsTableApi<T>({
  tableSurface,
  dataRows,
  rowKeyByIndex,
  viewRows,
  selectedRows,
  selectedRowKeys,
  getAnalyticsSnapshot: () => analyticsSource.getSnapshot(),
  subscribeAnalytics: (listener) => analyticsSource.subscribe(listener),
  getRowByKey,
  getRowByIndex,
  getColumnValues,
  getCellValue,
  toApiEditSlice,
})

/** 实例级 ViewContext（多表 provide 互不串扰） */
bindRsTableViewContext<T>({
  props: {
    columnDraggable: () => props.columnDraggable,
    resizable: () => props.resizable,
    multiSort: () => props.multiSort,
    loading: () => Boolean(props.loading),
    loadingMore: () => Boolean(props.loadingMore),
    infinite: () => Boolean(props.infinite),
    rowKey: () => props.rowKey,
    striped: () => props.striped,
    selectionType: () => props.selectionType,
    editable: () => props.editable,
    editTrigger: () => props.editTrigger,
    rowCommit: () => props.rowCommit,
    allowNull: () => props.allowNull,
    editFocusMode: () => props.editFocusMode,
    nullLabel: () => props.nullLabel,
  },
  layout: {
    useFixedColumnLayout,
    showRowDragHandle,
    detailExpandable,
    showSelectColumn,
    showEditGutterColumn,
    showIndexColumn,
    showRowStatusColumn,
    columnPadLeft,
    columnPadRight,
    visibleDataColumns,
    prefixWidths: PREFIX_COL_WIDTH,
    resolvedGutterWidth,
    resolvedIndexWidth,
    isRadioSelection,
    selectAllState,
    columnFiltersState,
    dragColumnKey,
    dropColumnKey,
    dragLeadHeaderStyle,
    expandLeadHeaderStyle,
    selectLeadHeaderStyle,
    gutterLeadHeaderStyle,
    indexLeadHeaderStyle,
    columnHeaderStyleMap,
    bodyColspan,
    emptyContentStyle,
    virtualScrollEnabled,
    virtualSlice,
    visibleEntries,
    treeMode,
    treeIndentPx,
    treeExpandColumnKey,
    treeLoadingKeySet,
    dragLeadStyle,
    expandLeadStyle,
    selectLeadStyle,
    indexLeadStyle,
    gutterLeadStyle,
    columnTdClassMap,
    columnStyleMap,
    dragRowKeys,
    dropRowTargetKey,
    dropRowPosition,
  },
  chrome: {
    hasData,
    headerLabels,
    bodyLabels,
    hasColumnSlot,
    hasEditSlot,
  },
  edit: {
    tableEdit,
    activeEditCellKey,
    activeFocusCellKey,
    activeErrorMapSize,
    activeValidatingMapSize,
    cellTooltipEnabled,
    cellTooltipMode,
    cellTooltipText,
    cellTooltipFallbackTitle,
    rowEditPending,
    isExternalRowPending,
    onCellStartEdit,
    onCellCommit: onCellCommitEdit,
    onCellCancel: onCellCancelEdit,
    onCellUpdateDraft,
    onCellNavigate,
    onRowCommit: onRowCommitEdit,
    onRowRollback: onRowRollbackEdit,
    onGutterCommit,
    onCellClick,
    onCellDblclick,
  },
  interaction: {
    isHighlighted: (key) => rowHighlight.isHighlighted(key),
    onCellTipOver,
    onCellTipOut,
    resolvedDataColumnWidth,
    columnFilterValue,
    sortOrderFor,
    sortPriorityFor,
    sortIconName,
    onToggleSelectAll,
    onColumnDragOver,
    onColumnDrop,
    onColumnDragStart,
    onColumnDragEnd,
    updateColumnFilter,
    onHeaderClick,
    onResizeStart,
    rowKeyFor,
    isRowSelected,
    isRowIndeterminate,
    isRowExpanded,
    treeDepthOf,
    canExpandRow,
    canSelectRow,
    isRowDragByRow,
    isRowDragging,
    isRowDropTarget,
    onRowClick,
    onRowSelectMouseDown,
    onCellContextmenu,
    onRowDblclick,
    onRowContextmenu,
    onRowDragOver,
    onRowDragLeave,
    onRowDrop,
    onRowDragStart,
    onRowDragEnd,
    onToggleExpand,
    onToggleSelect: onToggleRow,
  },
})

defineExpose(tableApi)

</script>

<template>
  <RsContextMenu
    :disabled="!contextMenuEnabled"
    :items="ctxMenuItems"
    @select="onCtxMenuSelect"
  >
    <!-- shell 作为 ContextMenuTrigger 宿主；::before 伪元素铺满 shell 捕获空白区右键 -->
    <div
      class="rs-table-shell"
      :class="{ 'rs-table-shell--ctx': contextMenuEnabled, 'rs-table-shell--fill': fill }"
      v-bind="shellBind"
      @contextmenu="onTableContextmenu"
    >
      <!--
        在 Trigger(shell) 之内、单元格之外捕获：先于单元格/冒泡填充 items，
        避免 ContextMenu 在 items 仍为空时拒开。
      -->
      <div
        ref="scrollContainerRef"
        class="rs-table rs-native-scrollbar"
        @contextmenu.capture="onContextmenuCapture"
        :class="scrollHostClass"
        :style="scrollContainerStyle"
        @scroll.passive="onScroll"
      >
    <!--
      列头 <th> 在 RsTableHeader 内；静态分析无法下钻子 SFC。
      同文件保留 thead/th（showHeader=false 时 sr-only），满足表头规则与 AT。
    -->
    <table
      ref="tableRef"
      class="rs-table__table"
      :style="tableInlineStyle"
      v-bind="tableA11y"
      @keydown="onShellKeydown"
      @paste="onTablePaste"
    >
      <RsTableColGroup />
      <thead
        v-if="!showHeader"
        class="rs-table__head rs-table__head--sr-only"
      >
        <tr role="row">
          <th
            v-for="column in visibleDataColumns"
            :key="column.key"
            scope="col"
            role="columnheader"
            class="rs-table__th"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>
      <RsTableHeader v-else>
        <template v-for="column in visibleDataColumns" #[`header-${column.key}`]="slotProps">
          <slot :name="`header-${column.key}`" v-bind="slotProps" />
        </template>
      </RsTableHeader>
      <RsTableBody>
        <template #empty>
          <slot name="empty">{{ t('table.empty') }}</slot>
        </template>
        <template #group="slotProps">
          <slot name="group" v-bind="slotProps" />
        </template>
        <template #expand="slotProps">
          <slot name="expand" v-bind="slotProps" />
        </template>
        <template v-for="column in visibleDataColumns" #[column.key]="slotProps">
          <slot :name="column.key" v-bind="slotProps" />
        </template>
        <template
          v-for="column in visibleDataColumns"
          :key="`edit-${column.key}`"
          #[`edit-${column.key}`]="slotProps"
        >
          <slot :name="`edit-${column.key}`" v-bind="slotProps" />
        </template>
      </RsTableBody>
      <tfoot v-if="$slots.summary || showBuiltinSummaryRow" class="rs-table__foot">
        <tr v-if="$slots.summary">
          <td class="rs-table__summary" :colspan="bodyColspan">
            <slot name="summary" />
          </td>
        </tr>
        <RsTableSummaryRow
          v-else
          :columns="visibleDataColumns"
          :cells="summaryCells"
          :prefix-colspan="summaryPrefixColspan"
          :pad-left="columnPadLeft"
          :pad-right="columnPadRight"
        />
      </tfoot>
    </table>
      </div>
      <Teleport to="body">
        <div
          v-if="cellTipState.visible"
          ref="sharedTipRef"
          class="rs-table__shared-tip"
          :class="{
            'rs-table__shared-tip--ready': cellTipState.ready,
            'rs-table__shared-tip--header': cellTipState.kind === 'header',
          }"
          :style="cellTipState.style"
          role="tooltip"
        >
          {{ cellTipState.text }}
        </div>
      </Teleport>
    </div>
  </RsContextMenu>
</template>
