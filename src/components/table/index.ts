export { default as RsTable } from './src/RsTable.vue'
export { default as RsTableCellEditor } from './src/table-body/RsTableCellEditor.vue'
export type {
  RsTableCellCommitTrigger,
  RsTableCellEditFocusMode,
  RsTableCellEditTrigger,
  RsTableCellEditorInputType,
  RsTableCellNavigateDirection,
  RsTableEditableCellRef,
} from './src/utils/table-edit-utils'
export {
  RS_TABLE_NULL_DRAFT,
  isNullDraft,
  nullToEditText,
  parseClipboardGrid,
  navigateEditableCell,
  listEditableCells,
  listBatchColumnTargets,
  validateCellValueAsync,
} from './src/utils/table-edit-utils'
export type { RsTableStagedCell, RsTableUndoEntry, RsTableFocusCell } from './src/composables/useTableEdit'
export {
  useRsTable,
  useRsTableApi,
  RS_TABLE_API_KEY,
  RS_TABLE_API_VERSION,
  isRsTableApi,
  RsTableModuleRegistry,
  resolveInstanceFeatures,
  type RsTableApi,
  type UseRsTableSurface,
} from './src/composables/useRsTable'
export { useRsTableCore, type RsTableCoreApi, type UseRsTableCoreOptions } from './src/composables/useRsTableCore'
export {
  useRsTableShell,
  type RsTableShellApi,
  type UseRsTableShellCoreSlice,
  type UseRsTableShellOptions,
} from './src/composables/useRsTableShell'
export {
  useRsTableEditLayer,
  type RsTableApiEditSlice,
  type RsTableEditLayerApi,
  type UseRsTableEditLayerOptions,
} from './src/composables/useRsTableEditLayer'
export {
  createRsTableApi,
  type RsTableColumnChartMeta,
  type RsTableColumnWithChartMeta,
} from './src/rs-table-api'
export {
  createRsTableFeatureHost,
  type RsTableContextMenuContributor,
  type RsTableFeatureHost,
} from './src/features/rs-table-feature-host'
export { useRsTableColumns } from './src/composables/useRsTableColumns'
export { useRsTableEngine } from './src/composables/useRsTableEngine'
export { flattenVisibleCountRough, useRsTableVirtual } from './src/composables/useRsTableVirtual'
export { useRsTableScrollLayout } from './src/composables/useRsTableScrollLayout'
export {
  measureRsTablePrefixWidth,
  RS_TABLE_PREFIX_COL_WIDTH,
  useRsTableColumnVirtual,
} from './src/composables/useRsTableColumnVirtual'
export { useRsTableColumnLayout } from './src/composables/useRsTableColumnLayout'
export { useRsTableColumnResize } from './src/composables/useRsTableColumnResize'
export { useRsTableContextMenu } from './src/composables/useRsTableContextMenu'
export { useRsTableEditActions } from './src/composables/useRsTableEditActions'
export { useRsTableInteraction } from './src/composables/useRsTableInteraction'
export { RS_TABLE_SUMMARY_FEATURE_ID, useRsTableSummary } from './src/composables/useRsTableSummary'
export {
  useRsTableSelectionSource,
  type RsTableAnalyticsSnapshot,
  type RsTableAnalyticsSourceMode,
} from './src/composables/useRsTableSelectionSource'
export { useRsTableChartBridge } from './src/composables/useRsTableChartBridge'
export type {
  RsTableChartKind,
  RsTableChartPoint,
  RsTableChartSeries,
  RsTableChartSeriesDef,
  RsTableChartValueAgg,
} from './src/utils/table-chart-utils'
export {
  buildTableChartSeries,
  buildTableChartSeriesList,
} from './src/utils/table-chart-utils'
export {
  mapRsTableSeriesToEChartsOption,
  type RsTableEChartsOption,
  type MapRsTableSeriesToEChartsOptions,
} from './src/utils/rs-table-echarts-adapter'
export type {
  RsTableBuiltinFeatureId,
  RsTableFeature,
  RsTableFeatureContext,
} from './src/features/table-features'
export {
  createAnalyticsTableFeature,
  createBuiltinTableFeatures,
  createChartSeriesTableFeature,
  createContextMenuTableFeature,
  createOverlayTableFeature,
  createToolbarTableFeature,
  resolveBuiltinTableFeatures,
  RS_TABLE_ANALYTICS_SHELL,
  RS_TABLE_FEATURE_COMPOSABLE_MAP,
  setupTableFeatures,
} from './src/features/table-features'
export {
  createRsTableViewContext,
  provideRsTableView,
  useRsTableView,
  RS_TABLE_VIEW_KEY,
  type RsTableViewContext,
} from './src/context/rs-table-view-context'
export type {
  RsTableOverlayContribution,
  RsTableToolbarItem,
} from './src/features/rs-table-feature-host'
export { useRsTableHeadless } from './src/composables/useRsTableHeadless'
export { useRsTableViewProvide } from './src/composables/useRsTableViewProvide'
export { useRsTableA11y } from './src/composables/useRsTableA11y'
export { useRsTableShellChrome } from './src/composables/useRsTableShellChrome'
export { useRsTableScrollHost } from './src/composables/useRsTableScrollHost'
export { createRsTableEditEmitBridge } from './src/createRsTableEditEmitBridge'
export { assembleRsTableApi } from './src/assembleRsTableApi'
export { bindRsTableViewContext } from './src/bindRsTableViewContext'
export {
  RS_TABLE_API_REQUIRED_METHODS,
  RS_TABLE_API_OPTIONAL_METHODS,
  RS_TABLE_STABLE_EMITS,
  RS_TABLE_COMPAT_API_VERSION,
} from './src/utils/rs-table-compat-matrix'
export type {
  RsTableProps,
  RsTableEmits,
  RsTableCellFocus,
  RsTableColumnSlotProps,
  RsTableEditSlotProps,
  RsTableHeaderSlotProps,
  RsTableExpandSlotProps,
  RsTableGroupSlotProps,
  RsTableSlots,
  RsTableSlotPropsOf,
} from './src/rs-table-props'
export { RS_TABLE_PROP_DEFAULTS } from './src/rs-table-props'
export { useRsTableGridKeyboard } from './src/composables/useRsTableGridKeyboard'
export {
  navigateGridCell,
  resolveGridNavDirection,
  type RsTableGridNavDirection,
  type RsTableGridCellRef,
} from './src/utils/rs-table-grid-nav'
export type {
  RsTableColumnSummary,
  RsTableSummaryCell,
  RsTableSummaryData,
  RsTableSummaryMode,
  RsTableSummaryType,
} from './src/utils/table-summary-utils'
export {
  aggregateColumnSummary,
  buildTableSummaryCells,
  hasTableSummaryConfig,
} from './src/utils/table-summary-utils'
export { default as RsTableSummaryRow } from './src/table-footer/RsTableSummaryRow.vue'
export { default as RsTableHeader } from './src/table-header/RsTableHeader.vue'
export { default as RsTableBody } from './src/table-body/RsTableBody.vue'
export { default as RsTableColGroup } from './src/table-body/RsTableColGroup.vue'
export type { RsTableHeaderProps } from './src/table-header/rs-table-header-types'
export type { RsTableRowDragTrigger, RsTableRowDropMode } from './src/utils/table-drag'
export type {
  RsTableCellRenderResult,
  RsTableColumn,
  RsTableColumnAlign,
  RsTableColumnEditorOptions,
  RsTableColumnEditorOptionsResolved,
  RsTableColumnFixed,
  RsTableCellValueType,
  RsTableFieldAccessor,
  RsTableGroupBy,
  RsTableRowConvention,
  RsTableRowData,
  RsTableRowDropPosition,
  RsTableRowEntry,
  RsTableRowKey,
  RsTableSelectAllState,
  RsTableSelectionType,
  RsTableSize,
  RsTableSortOrder,
  RsTableSortState,
  RsTableTreeCheckState,
  RsTableTreeConfig,
  RsTableTreeNodeIndex,
} from './src/utils/table-utils'
export {
  buildTableEntries,
  buildTableTreeEntries,
  buildTableTreeNodeIndex,
  clampColumnWidth,
  collectTableTreeDescendantKeys,
  collectTableTreeExpandableKeys,
  collectTableTreeHalfCheckedKeys,
  compareTableValues,
  createInitialColumnWidths,
  filterTableRows,
  filterTableTreeRows,
  fixedCellStyle,
  flattenVisibleTableTreeEntries,
  getCellValue,
  getSortOrderForKey,
  getSortPriorityForKey,
  getTableTreeChildren,
  getTableTreeIsLeaf,
  groupTableRows,
  hasStableTableTreeRowKey,
  hasTableTreeChildren,
  injectExpandRows,
  isNearScrollBottom,
  isTableRowDisabled,
  parseColumnWidth,
  reorderColumnKeys,
  reorderTableRows,
  resolveColumnOrder,
  resolveEntryKey,
  resolveFixedColumnStyles,
  resolveOrderedColumns,
  resolveRowKey,
  resolveSelectableRowKeys,
  resolveSelectAllState,
  resolveTableSize,
  resolveTableTreeCheckState,
  resolveTableTreeIndent,
  resolveTableTreeRowKey,
  resolveTableVirtualEnabled,
  selectRowKeys,
  selectRowKeysByClick,
  sliceVirtualTableEntries,
  sortTableRows,
  sortTableRowsMulti,
  sortTableTreeRows,
  toggleExpandedRowKeys,
  toggleMultiSortState,
  toggleRowSelection,
  toggleSelectAll,
  toggleSortState,
  toggleTableTreeCheck,
} from './src/utils/table-utils'
