/**
 * RsTable 内核装配（Columns + Engine + Scroll + Virtual + Analytics + Features）。
 *
 * 性能约定：
 * - data / columns 仅按引用浅层失效，不做 deep watch
 * - Feature 按 id + setup 引用签名重绑，避免无关 props 抖动拆掉图表订阅
 * - 行派生（dataRows / viewRows / keyMap）单次遍历 tableEntries
 *
 * 不负责：列宽拖拽 DOM、列虚拟（依赖 resize 快照）、编辑/右键交互、模板。
 */

import { computed, onUnmounted, watch } from 'vue'
import type {
  RsTableColumn,
  RsTableGroupBy,
  RsTableRowData,
  RsTableRowKey,
  RsTableSize,
  RsTableSortState,
  RsTableTreeConfig,
} from '../components/table-utils'
import { resolveTableRowHeight, resolveTableSize } from '../components/table-utils'
import {
  resolveBuiltinTableFeatures,
  type RsTableFeature,
} from '../components/table/table-features'
import { useRsTable } from './useRsTable'
import { useRsTableColumns, type UseRsTableColumnsEmit } from './useRsTableColumns'
import { useRsTableEngine, type UseRsTableEngineEmit } from './useRsTableEngine'
import { useRsTableScrollLayout } from './useRsTableScrollLayout'
import { useRsTableSelectionSource } from './useRsTableSelectionSource'
import {
  flattenVisibleCountRough,
  useRsTableVirtual,
} from './useRsTableVirtual'

/** useRsTableCore 入参：全部用 getter，避免捕获过期 props */
export interface UseRsTableCoreOptions<T extends RsTableRowData> {
  columns: () => RsTableColumn<T>[]
  data: () => T[]
  rowKey: () => RsTableRowKey<T> | undefined
  compact: () => boolean | undefined
  size: () => RsTableSize | undefined
  columnOrder: () => string[] | undefined
  defaultColumnOrder: string[]
  columnFilters: () => Record<string, string> | undefined
  defaultColumnFilters: Record<string, string>
  initialColumnWidths: () => Record<string, number> | undefined
  resizable: () => boolean
  columnLayout: () => 'auto' | 'fixed'
  sort: () => RsTableSortState | null | undefined
  defaultSort: RsTableSortState | null
  sorts: () => RsTableSortState[] | undefined
  defaultSorts: RsTableSortState[]
  multiSort: () => boolean
  remoteSort: () => boolean
  filterText: () => string | undefined
  filterKeys: () => string[] | undefined
  groupBy: () => RsTableGroupBy<T> | undefined
  groupLabel: () => ((key: string) => string) | undefined
  treeConfig: () => RsTableTreeConfig<T> | undefined
  expandable: () => boolean
  rowExpandable: () => ((row: T, index: number) => boolean) | undefined
  selectedRowKeys: () => string[] | undefined
  defaultSelectedRowKeys: string[]
  expandedRowKeys: () => string[] | undefined
  defaultExpandedRowKeys: string[]
  rowSelectable: () => ((row: T, index: number) => boolean) | undefined
  height: () => number | string | undefined
  layoutActive: () => boolean | undefined
  viewKey: () => string | number | undefined
  virtual: () => boolean | undefined
  virtualAutoThreshold: () => number
  fill: () => boolean
  infinite: () => boolean
  virtualOnInfinite: () => boolean
  overscan: () => number
  expandRowHeight: () => number | undefined
  rowHeight: () => number | undefined
  selectable: () => boolean
  editable: () => boolean
  contextMenu: () => boolean
  /** 汇总 feature 是否启用（由 Summary composable 或轻量判定注入） */
  summaryFeatureEnabled: () => boolean
  features: () => RsTableFeature<T>[] | undefined
  emit: UseRsTableColumnsEmit & UseRsTableEngineEmit
}

/**
 * 装配表格内核状态。
 */
export function useRsTableCore<T extends RsTableRowData>(options: UseRsTableCoreOptions<T>) {
  const treeModeEarly = computed(() => Boolean(options.treeConfig()))
  const treeExpandColumnKeyEarly = computed(() => {
    const tree = options.treeConfig()
    if (!tree) return null
    return tree.expandColumnKey ?? options.columns()[0]?.key ?? null
  })
  const treeFixExpandColumnEarly = computed(() => options.treeConfig()?.fixExpandColumn !== false)

  const columnsApi = useRsTableColumns<T>({
    columns: () => options.columns(),
    columnOrder: () => options.columnOrder(),
    defaultColumnOrder: options.defaultColumnOrder,
    columnFilters: () => options.columnFilters(),
    defaultColumnFilters: options.defaultColumnFilters,
    initialColumnWidths: () => options.initialColumnWidths(),
    resizable: () => options.resizable(),
    columnLayout: () => options.columnLayout(),
    treeMode: treeModeEarly,
    treeFixExpandColumn: treeFixExpandColumnEarly,
    treeExpandColumnKey: treeExpandColumnKeyEarly,
    emit: options.emit,
  })

  const resolvedSize = computed(() =>
    resolveTableSize(options.compact() ?? false, options.size() ?? 'md'),
  )

  const engine = useRsTableEngine<T>({
    data: () => options.data(),
    displayColumns: () => columnsApi.displayColumns.value,
    rowKey: () => options.rowKey(),
    sort: () => options.sort(),
    defaultSort: options.defaultSort,
    sorts: () => options.sorts(),
    defaultSorts: options.defaultSorts,
    multiSort: () => options.multiSort(),
    remoteSort: () => options.remoteSort(),
    filterText: () => options.filterText(),
    filterKeys: () => options.filterKeys(),
    columnFilters: () => columnsApi.columnFiltersState.value,
    groupBy: () => options.groupBy(),
    groupLabel: () => options.groupLabel(),
    treeConfig: () => options.treeConfig(),
    expandable: () => options.expandable(),
    rowExpandable: () => options.rowExpandable(),
    selectedRowKeys: () => options.selectedRowKeys(),
    defaultSelectedRowKeys: options.defaultSelectedRowKeys,
    expandedRowKeys: () => options.expandedRowKeys(),
    defaultExpandedRowKeys: options.defaultExpandedRowKeys,
    rowSelectable: () => options.rowSelectable(),
    size: resolvedSize,
    emit: options.emit,
  })

  /** 树表阈值粗算：不构建完整 entries，避免与 virtual 循环依赖 */
  const tableEntriesForThreshold = computed(() => {
    const tree = options.treeConfig()
    if (!tree) return options.data().length
    return flattenVisibleCountRough(options.data(), engine.expandedKeySet.value, {
      childrenField: engine.treeChildrenField.value,
      isLeafField: engine.treeIsLeafField.value,
      lazy: engine.treeLazy.value,
      rowKey: options.rowKey(),
    })
  })

  const scroll = useRsTableScrollLayout({
    height: () => options.height(),
    layoutActive: () => options.layoutActive(),
    viewKey: () => options.viewKey(),
  })

  const fixedRowHeight = computed(() =>
    resolveTableRowHeight(resolvedSize.value, options.rowHeight()),
  )

  const virtual = useRsTableVirtual<T>({
    dataLength: () => options.data().length,
    treeMode: engine.treeMode,
    tableEntriesForThreshold,
    virtual: () => options.virtual(),
    virtualAutoThreshold: () => options.virtualAutoThreshold(),
    fill: () => options.fill(),
    infinite: () => options.infinite(),
    virtualOnInfinite: () => options.virtualOnInfinite(),
    overscan: () => options.overscan(),
    expandRowHeight: () => options.expandRowHeight(),
    scrollTop: scroll.scrollTop,
    viewportHeight: scroll.viewportHeight,
    fixedRowHeight,
    tableEntries: () => engine.tableEntries.value,
  })

  const analyticsSource = useRsTableSelectionSource<T>({
    viewRows: engine.viewRows,
    selectedRows: engine.selectedRows,
  })

  const tableSurface = useRsTable<T>()

  /** 列是否可筛选：只跟 columns 引用走，避免每次访问 .some */
  const hasFilterableColumn = computed(() => options.columns().some((c) => c.filterable))

  const builtinFeatureIds = computed(() =>
    resolveBuiltinTableFeatures({
      selectable: options.selectable(),
      filterable: hasFilterableColumn.value,
      virtual: options.virtual() === false ? false : options.virtual() ?? 'auto',
      editable: options.editable(),
      tree: Boolean(options.treeConfig()),
      contextMenu: options.contextMenu() !== false,
      summary: options.summaryFeatureEnabled(),
    }),
  )

  /**
   * Feature 重绑签名：builtin id 集合 + 实例 feature 的 id/setup 引用。
   * 不监听 data/viewRows，避免滚动/选中拆掉 analytics 订阅。
   */
  const featureBindSignature = computed(() => {
    const extras = options.features() ?? []
    return [
      builtinFeatureIds.value.join('\0'),
      extras.length,
      ...extras.map((f) => f.id),
      ...extras.map((f) => f.setup),
    ] as const
  })

  let disposeTableFeatures: (() => void) | null = null
  watch(
    featureBindSignature,
    () => {
      disposeTableFeatures?.()
      disposeTableFeatures = tableSurface.bindFeatures({
        builtinIds: builtinFeatureIds.value,
        instanceFeatures: options.features() ?? null,
        getViewRows: () => engine.viewRows.value,
        getSelectedRows: () => engine.selectedRows.value,
        getAnalyticsSnapshot: () => analyticsSource.getSnapshot(),
        subscribeAnalytics: (listener) => analyticsSource.subscribe(listener),
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    disposeTableFeatures?.()
    disposeTableFeatures = null
  })

  return {
    resolvedSize,
    fixedRowHeight,
    tableEntriesForThreshold,
    ...columnsApi,
    ...engine,
    ...scroll,
    ...virtual,
    analyticsSource,
    tableSurface,
    builtinFeatureIds,
  }
}

export type RsTableCoreApi<T extends RsTableRowData> = ReturnType<typeof useRsTableCore<T>>
