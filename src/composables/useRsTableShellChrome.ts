/**
 * RsTable 壳层编排：i18n 文案、a11y 绑定、Grid 键盘、滚动宿主 class。
 * 从 RsTable.vue 下沉，SFC 只保留接线。
 */

import { computed, useAttrs, useSlots, type ComputedRef, type Ref } from 'vue'
import type { useTableEdit } from './useTableEdit'
import { useRsI18n } from './useRsI18n'
import { useRsTableA11y } from './useRsTableA11y'
import { useRsTableGridKeyboard } from './useRsTableGridKeyboard'
import type { RsTableColumn, RsTableRowData, RsTableRowEntry } from '../components/table-utils'

type TableEditApi = ReturnType<typeof useTableEdit>

export interface UseRsTableShellChromeOptions<T extends RsTableRowData> {
  ariaLabel: () => string | undefined
  loading: () => boolean
  dataRows:
    | Ref<Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>>
    | ComputedRef<Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>>
  visibleDataColumns: Ref<RsTableColumn<T>[]> | ComputedRef<RsTableColumn<T>[]>
  displayColumns: () => RsTableColumn<T>[]
  tableEdit: TableEditApi
  rowKeyFor: (entry: Extract<RsTableRowEntry<T>, { type: 'row' }>) => string
  applyRowClickHighlight: (rowKey: string) => void
  pageSize: () => number
  onTableKeydown: (event: KeyboardEvent) => void
  scrollContainerRef?: Ref<HTMLElement | null | undefined>
  /** 滚动宿主 class 所需状态 */
  hostClass: {
    bordered: () => boolean
    columnBordered: () => boolean
    rounded: () => boolean
    fill: () => boolean
    compact: () => boolean
    resolvedSize: () => string
    virtualScrollEnabled: () => boolean
    virtualColumnsEnabled: () => boolean
    dataLength: () => number
    infinite: () => boolean
    resizable: () => boolean
    columnLayout: () => string
    useFixedColumnLayout: () => boolean
    striped: () => boolean
    selectable: () => boolean
    isRowSelection: () => boolean
    detailExpandable: () => boolean
    treeMode: () => boolean
    rowDraggable: () => boolean
    columnDraggable: () => boolean
    scrollX: () => number | string | undefined
    overflowXEnabled: () => boolean
    contextMenuEnabled: () => boolean
    showEditGutterColumn: () => boolean
  }
}

/**
 * 壳层 chrome：文案 / a11y / 键盘 / 宿主 class。
 */
export function useRsTableShellChrome<T extends RsTableRowData>(
  options: UseRsTableShellChromeOptions<T>,
) {
  const { t } = useRsI18n()
  const slots = useSlots()
  const attrs = useAttrs()

  const hasData = computed(() => options.dataRows.value.length > 0)

  const headerLabels = computed(() => ({
    selectAll: t('table.selectAll'),
    index: t('table.index'),
    rowStatus: t('table.rowStatus'),
    dragColumn: t('table.dragColumn'),
    filterColumn: t('table.filterColumn'),
    filterPlaceholder: t('table.filterPlaceholder'),
    filterClear: t('table.filterClear'),
    filterApply: t('table.filterApply'),
  }))

  const bodyLabels = computed(() => ({
    loading: t('table.loading'),
    empty: t('table.empty'),
    loadingMore: t('table.loadingMore'),
    dragRow: t('table.dragRow'),
    expandRow: t('table.expandRow'),
    collapseRow: t('table.collapseRow'),
    selectRow: t('table.selectRow'),
    rowCommit: t('table.rowCommit'),
    rowRollback: t('table.rowRollback'),
    gutterCommit: t('table.gutterCommit'),
  }))

  function hasColumnSlot(key: string): boolean {
    return Boolean(slots[key])
  }

  function hasEditSlot(key: string): boolean {
    return Boolean(slots[`edit-${key}`])
  }

  const { shellA11y, tableA11y } = useRsTableA11y({
    ariaLabel: options.ariaLabel,
    defaultLabel: () => t('table.a11yLabel'),
    loading: options.loading,
    rowCount: () => options.dataRows.value.length,
    colCount: () => options.visibleDataColumns.value.length,
  })

  const shellBind = computed(() => ({
    ...shellA11y.value,
    ...attrs,
  }))

  const { onGridKeydown } = useRsTableGridKeyboard<T>({
    tableEdit: options.tableEdit,
    dataRows: () => options.dataRows.value,
    rowKeyFor: options.rowKeyFor,
    colKeys: () => options.visibleDataColumns.value.map((c) => c.key),
    displayColumns: options.displayColumns,
    applyRowClickHighlight: options.applyRowClickHighlight,
    pageSize: options.pageSize,
    scrollContainerRef: options.scrollContainerRef,
  })

  function onShellKeydown(event: KeyboardEvent): void {
    if (onGridKeydown(event)) return
    options.onTableKeydown(event)
  }

  const h = options.hostClass
  const scrollHostClass = computed(() => ({
    'rs-table--bordered': h.bordered(),
    'rs-table--column-bordered': h.columnBordered(),
    'rs-table--rounded': h.rounded(),
    'rs-table--fill': h.fill(),
    'rs-table--compact': h.compact(),
    [`rs-table--${h.resolvedSize()}`]: true,
    'rs-table--virtual': h.virtualScrollEnabled(),
    'rs-table--virtual-cols': h.virtualColumnsEnabled(),
    'rs-table--content-visibility': !h.virtualScrollEnabled() && h.dataLength() >= 30,
    'rs-table--infinite': h.infinite(),
    'rs-table--resizable': h.resizable(),
    'rs-table--col-auto': h.resizable() && h.columnLayout() === 'auto',
    'rs-table--col-fixed': h.useFixedColumnLayout(),
    'rs-table--striped': h.striped(),
    'rs-table--selectable': h.selectable(),
    'rs-table--row-select': h.isRowSelection(),
    'rs-table--expandable': h.detailExpandable(),
    'rs-table--tree': h.treeMode(),
    'rs-table--draggable': h.rowDraggable() || h.columnDraggable(),
    'rs-table--scroll-x': !!h.scrollX(),
    'rs-table--overflow-x': h.overflowXEnabled(),
    'rs-table--ctx': h.contextMenuEnabled(),
    'rs-table--edit-gutter': h.showEditGutterColumn(),
  }))

  return {
    t,
    hasData,
    headerLabels,
    bodyLabels,
    hasColumnSlot,
    hasEditSlot,
    tableA11y,
    shellBind,
    onShellKeydown,
    scrollHostClass,
  }
}
