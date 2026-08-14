/**
 * RsTable 无头驱动入口（无模板也能跑 Engine / Features / Api）。
 *
 * 适用：服务端预计算、自定义渲染器、图表只消费 snapshot。
 * 不含列宽 DOM / 右键 / 编辑交互（那些依赖视图壳）。
 *
 * 多表：每次调用产生独立 Core + FeatureHost；互不共享状态。
 * 唯一全局点是 RsTableModuleRegistry（显式 register 才会影响所有实例）。
 */

import type { Ref } from 'vue'
import type { RsTableColumn, RsTableRowData, RsTableRowKey } from '../components/table-utils'
import type { RsTableFeature } from '../components/table/table-features'
import { useRsTableCore, type UseRsTableCoreOptions } from './useRsTableCore'

export interface UseRsTableHeadlessOptions<T extends RsTableRowData> {
  columns: Ref<RsTableColumn<T>[]> | (() => RsTableColumn<T>[])
  data: Ref<T[]> | (() => T[])
  rowKey?: RsTableRowKey<T> | (() => RsTableRowKey<T> | undefined)
  selectable?: boolean
  features?: RsTableFeature<T>[] | (() => RsTableFeature<T>[] | undefined)
  /** 最小 emit 桩；受控同步时可传入 */
  emit?: UseRsTableCoreOptions<T>['emit']
}

function readRefOrGetter<T>(source: Ref<T> | (() => T)): () => T {
  return typeof source === 'function' ? (source as () => T) : () => (source as Ref<T>).value
}

/**
 * 无头表格：复用 useRsTableCore（已含 Feature 绑定），再装配 Api。
 */
export function useRsTableHeadless<T extends RsTableRowData>(
  options: UseRsTableHeadlessOptions<T>,
) {
  const getColumns = readRefOrGetter(options.columns)
  const getData = readRefOrGetter(options.data)
  const getRowKey = (): RsTableRowKey<T> | undefined => {
    const key = options.rowKey
    if (key == null) return undefined
    if (typeof key === 'string') return key
    // 无参函数视为配置 getter；带 row 参数的视为字段访问器
    if (typeof key === 'function' && key.length === 0) {
      return (key as () => RsTableRowKey<T> | undefined)()
    }
    return key as RsTableRowKey<T>
  }
  const getFeatures = () =>
    typeof options.features === 'function' ? options.features() : options.features

  const noopEmit = ((() => undefined) as unknown) as UseRsTableCoreOptions<T>['emit']

  const core = useRsTableCore<T>({
    columns: getColumns,
    data: getData,
    rowKey: getRowKey,
    compact: () => false,
    size: () => 'md',
    columnOrder: () => undefined,
    defaultColumnOrder: [],
    columnFilters: () => undefined,
    defaultColumnFilters: {},
    initialColumnWidths: () => undefined,
    resizable: () => false,
    columnLayout: () => 'auto',
    sort: () => undefined,
    defaultSort: null,
    sorts: () => undefined,
    defaultSorts: [],
    multiSort: () => false,
    remoteSort: () => false,
    filterText: () => undefined,
    filterKeys: () => undefined,
    groupBy: () => undefined,
    groupLabel: () => undefined,
    treeConfig: () => undefined,
    expandable: () => false,
    rowExpandable: () => undefined,
    selectedRowKeys: () => undefined,
    defaultSelectedRowKeys: [],
    expandedRowKeys: () => undefined,
    defaultExpandedRowKeys: [],
    rowSelectable: () => undefined,
    height: () => 320,
    layoutActive: () => true,
    viewKey: () => undefined,
    virtual: () => false,
    virtualAutoThreshold: () => 50,
    fill: () => false,
    infinite: () => false,
    virtualOnInfinite: () => true,
    overscan: () => 4,
    expandRowHeight: () => undefined,
    rowHeight: () => undefined,
    selectable: () => Boolean(options.selectable),
    editable: () => false,
    contextMenu: () => false,
    summaryFeatureEnabled: () => false,
    features: getFeatures,
    emit: options.emit ?? noopEmit,
  })

  const api = core.tableSurface.createApi(
    {
      getRowByKey: (rowKey) => {
        const entry = core.dataRows.value.find(
          (item) => core.rowKeyByIndex.value.get(item.rowIndex) === rowKey,
        )
        return entry?.row
      },
      getRowByIndex: (index) =>
        core.dataRows.value.find((item) => item.rowIndex === index)?.row,
      getColumnValues: () => [],
      getCellValue: () => undefined,
      getViewRows: () => core.viewRows.value,
      getSelectedRows: () => core.selectedRows.value,
      getSelectedRowKeys: () => [...core.selectedRowKeys.value],
      getAnalyticsSnapshot: () => core.analyticsSource.getSnapshot(),
      subscribeAnalytics: (listener) => core.analyticsSource.subscribe(listener),
      getHighlightedRowKey: () => undefined,
      setHighlightedRowKey: () => undefined,
      cancelCellEdit: () => undefined,
      cancelAllEdits: () => undefined,
      getDirtyCellKeys: () => [],
      getCellError: () => undefined,
      setCellError: () => undefined,
      stageCell: () => undefined,
      rejectRowEdit: () => undefined,
      undoEdit: () => undefined,
      redoEdit: () => undefined,
      commitRowEdits: () => undefined,
      rollbackRowEdits: () => undefined,
      getToolbarItems: () => core.tableSurface.getToolbarItems(),
      getOverlayContributions: () => core.tableSurface.getOverlayContributions(),
    },
    { provide: false },
  )

  return {
    api,
    core,
    getToolbarItems: () => core.tableSurface.getToolbarItems(),
    getOverlayContributions: () => core.tableSurface.getOverlayContributions(),
  }
}
