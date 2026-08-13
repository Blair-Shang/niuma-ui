/**
 * RsTable 数据内核：排序 / 筛选 / 分组后的 entries，以及选择、展开、树索引。
 *
 * 职责边界：
 * - 做：受控/非受控 sort、selection、expand；构建 tableEntries / viewRows
 * - 不做：虚拟滚动、列宽、右键菜单 DOM、行内编辑提交（由 RsTable + 其它 composable 负责）
 *
 * `viewRows` 供 summary / 表外 analytics 使用（仅业务行，不含 group/expand 伪行）。
 */

import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  buildTableEntries,
  buildTableTreeEntries,
  buildTableTreeNodeIndex,
  collectTableTreeExpandableKeys,
  hasStableTableTreeRowKey,
  injectExpandRows,
  isTableRowDisabled,
  resolveRowKey,
  resolveSelectAllState,
  resolveTableTreeIndent,
  type RsTableColumn,
  type RsTableGroupBy,
  type RsTableRowData,
  type RsTableRowEntry,
  type RsTableRowKey,
  type RsTableSize,
  type RsTableSortState,
  type RsTableTreeConfig,
} from '../components/table-utils'

/** Engine 向外发出的状态同步事件（与 RsTable emit 子集对齐） */
export interface UseRsTableEngineEmit {
  (e: 'update:selectedRowKeys', value: string[]): void
  (e: 'selectionChange', value: string[]): void
  (e: 'update:expandedRowKeys', value: string[]): void
  (e: 'expandChange', value: string[]): void
  (e: 'update:sort', value: RsTableSortState | null): void
  (e: 'update:sorts', value: RsTableSortState[]): void
  (e: 'sortsChange', value: RsTableSortState[]): void
}

/**
 * useRsTableEngine 入参。
 * 数据源与列定义通过 getter/ComputedRef 注入，避免在 Engine 内直接依赖整个 props 对象。
 */
export interface UseRsTableEngineOptions<T extends RsTableRowData> {
  data: ComputedRef<T[]> | (() => T[])
  /** 已排序/钉住展开列后的展示列（通常来自 useRsTableColumns.displayColumns） */
  displayColumns: ComputedRef<RsTableColumn<T>[]> | (() => RsTableColumn<T>[])
  rowKey: ComputedRef<RsTableRowKey<T> | undefined> | (() => RsTableRowKey<T> | undefined)
  sort: ComputedRef<RsTableSortState | null | undefined> | (() => RsTableSortState | null | undefined)
  defaultSort: RsTableSortState | null
  sorts: ComputedRef<RsTableSortState[] | undefined> | (() => RsTableSortState[] | undefined)
  defaultSorts: RsTableSortState[]
  multiSort: ComputedRef<boolean> | (() => boolean)
  remoteSort: ComputedRef<boolean> | (() => boolean)
  filterText: ComputedRef<string | undefined> | (() => string | undefined)
  filterKeys: ComputedRef<string[] | undefined> | (() => string[] | undefined)
  columnFilters: ComputedRef<Record<string, string>> | (() => Record<string, string>)
  groupBy: ComputedRef<RsTableGroupBy<T> | undefined> | (() => RsTableGroupBy<T> | undefined)
  groupLabel: ComputedRef<((key: string) => string) | undefined> | (() => ((key: string) => string) | undefined)
  treeConfig: ComputedRef<RsTableTreeConfig<T> | undefined> | (() => RsTableTreeConfig<T> | undefined)
  expandable: ComputedRef<boolean> | (() => boolean)
  rowExpandable: ComputedRef<((row: T, index: number) => boolean) | undefined> | (() => ((row: T, index: number) => boolean) | undefined)
  selectedRowKeys: ComputedRef<string[] | undefined> | (() => string[] | undefined)
  defaultSelectedRowKeys: string[]
  expandedRowKeys: ComputedRef<string[] | undefined> | (() => string[] | undefined)
  defaultExpandedRowKeys: string[]
  rowSelectable: ComputedRef<((row: T, index: number) => boolean) | undefined> | (() => ((row: T, index: number) => boolean) | undefined)
  size: ComputedRef<RsTableSize> | (() => RsTableSize)
  emit: UseRsTableEngineEmit
}

/** 统一读取 ComputedRef / Ref / getter */
function read<T>(source: ComputedRef<T> | (() => T) | Ref<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

/**
 * 表格数据内核。
 *
 * @returns 排序状态、选择/展开、树字段、tableEntries、dataRows、viewRows 等；
 *          行勾选/展开的「交互处理函数」仍留在 RsTable（依赖 DOM 与其它 UI 状态）。
 */
export function useRsTableEngine<T extends RsTableRowData>(options: UseRsTableEngineOptions<T>) {
  const internalSort = ref<RsTableSortState | null>(options.defaultSort ?? null)
  const internalSorts = ref<RsTableSortState[]>([...options.defaultSorts])
  const internalSelectedRowKeys = ref<string[]>([...options.defaultSelectedRowKeys])
  const internalExpandedRowKeys = ref<string[]>([...options.defaultExpandedRowKeys])
  /** 树懒加载中的行 key（UI loading 用） */
  const treeLoadingKeys = ref<string[]>([])

  const isSortControlled = computed(() => read(options.sort) !== undefined)

  /** 单列排序状态（受控或内部） */
  const sortState = computed({
    get: () => (isSortControlled.value ? read(options.sort) ?? null : internalSort.value),
    set: (value: RsTableSortState | null) => {
      if (isSortControlled.value) options.emit('update:sort', value)
      else internalSort.value = value
    },
  })

  const isSortsControlled = computed(() => read(options.sorts) !== undefined)

  /** 多列排序状态 */
  const sortsState = computed({
    get: () => (isSortsControlled.value ? read(options.sorts) ?? [] : internalSorts.value),
    set: (value: RsTableSortState[]) => {
      if (isSortsControlled.value) options.emit('update:sorts', value)
      else internalSorts.value = value
      options.emit('sortsChange', value)
    },
  })

  const isSelectionControlled = computed(() => read(options.selectedRowKeys) !== undefined)

  /** 已选行 key 列表；写入时同步 selectionChange */
  const selectedRowKeys = computed({
    get: () =>
      isSelectionControlled.value ? read(options.selectedRowKeys) ?? [] : internalSelectedRowKeys.value,
    set: (value: string[]) => {
      if (isSelectionControlled.value) options.emit('update:selectedRowKeys', value)
      else internalSelectedRowKeys.value = value
      options.emit('selectionChange', value)
    },
  })
  const selectedKeySet = computed(() => new Set(selectedRowKeys.value))

  const isExpandedControlled = computed(() => read(options.expandedRowKeys) !== undefined)

  /** 展开行 key（明细展开或树展开共用） */
  const expandedRowKeys = computed({
    get: () =>
      isExpandedControlled.value ? read(options.expandedRowKeys) ?? [] : internalExpandedRowKeys.value,
    set: (value: string[]) => {
      if (isExpandedControlled.value) options.emit('update:expandedRowKeys', value)
      else internalExpandedRowKeys.value = value
      options.emit('expandChange', value)
    },
  })
  const expandedKeySet = computed(() => new Set(expandedRowKeys.value))

  const treeMode = computed(() => Boolean(read(options.treeConfig)))
  /** 明细行展开：与 tree 互斥，树表下强制关闭 */
  const detailExpandable = computed(() => read(options.expandable) && !treeMode.value)
  const treeChildrenField = computed(() => read(options.treeConfig)?.childrenField ?? 'children')
  const treeIsLeafField = computed(() => read(options.treeConfig)?.isLeafField ?? 'isLeaf')
  const treeLazy = computed(() => Boolean(read(options.treeConfig)?.lazy))
  /** 默认严格勾选（父子不联动）；checkStrictly === false 时启用级联 */
  const treeCheckStrictly = computed(() => read(options.treeConfig)?.checkStrictly !== false)
  const treeIndentPx = computed(() =>
    resolveTableTreeIndent(read(options.size), read(options.treeConfig)?.indent),
  )
  const treeExpandColumnKey = computed(() => {
    const tree = read(options.treeConfig)
    if (!tree) return null
    return tree.expandColumnKey ?? read(options.displayColumns)[0]?.key ?? null
  })
  const treeFixExpandColumn = computed(() => read(options.treeConfig)?.fixExpandColumn !== false)
  const treeLoadingKeySet = computed(() => new Set(treeLoadingKeys.value))

  /** 全树索引：仅非严格勾选时构建，供级联半选等使用 */
  const tableTreeNodeIndex = computed(() => {
    const tree = read(options.treeConfig)
    if (!tree || treeCheckStrictly.value) return null
    return buildTableTreeNodeIndex(read(options.data), {
      childrenField: treeChildrenField.value,
      isLeafField: treeIsLeafField.value,
      lazy: treeLazy.value,
      rowKey: read(options.rowKey),
    })
  })

  if (import.meta.env.DEV) {
    watch(
      () => [read(options.treeConfig), read(options.expandable), read(options.groupBy)] as const,
      ([tree, expandable, groupBy]) => {
        if (!tree) return
        if (expandable) {
          console.warn('[RsTable] treeConfig 与 expandable（明细展开）互斥，已优先使用 treeConfig')
        }
        if (groupBy) {
          console.warn('[RsTable] treeConfig 与 groupBy 互斥，已忽略 groupBy')
        }
      },
      { immediate: true },
    )
    watch(
      () => [read(options.treeConfig), read(options.rowKey)] as const,
      ([tree, rowKey]) => {
        if (!tree) return
        if (!hasStableTableTreeRowKey(rowKey)) {
          console.warn(
            '[RsTable] 树表必须提供稳定的 rowKey（字段名或函数），否则跨分支节点可能 key 碰撞；当前将回退为路径 key。',
          )
        }
      },
      { immediate: true },
    )
  }

  /** defaultExpandAll 是否已种过种子（避免空数据把 seeded 提前锁死） */
  const treeExpandAllSeeded = ref(false)
  watch(
    () => read(options.data),
    (data) => {
      const tree = read(options.treeConfig)
      if (!tree?.defaultExpandAll) return
      if (isExpandedControlled.value) return
      if (treeExpandAllSeeded.value) return
      if (options.defaultExpandedRowKeys.length > 0) {
        treeExpandAllSeeded.value = true
        return
      }
      if (!data.length) return
      internalExpandedRowKeys.value = collectTableTreeExpandableKeys(data, {
        childrenField: treeChildrenField.value,
        isLeafField: treeIsLeafField.value,
        lazy: treeLazy.value,
        rowKey: read(options.rowKey),
      })
      treeExpandAllSeeded.value = true
    },
    { immediate: true },
  )

  /**
   * 渲染用 entry 流水线：
   * - 树表：buildTableTreeEntries
   * - 普通：buildTableEntries（sort/filter/group）再 injectExpandRows
   */
  const tableEntries = computed(() => {
    const tree = read(options.treeConfig)
    const columns = read(options.displayColumns)
    const data = read(options.data)
    const rowKey = read(options.rowKey)
    if (tree) {
      return buildTableTreeEntries(data, columns, expandedKeySet.value, {
        tree,
        rowKey,
        sort: sortState.value,
        sorts: sortsState.value,
        multiSort: read(options.multiSort),
        filterText: read(options.filterText),
        filterKeys: read(options.filterKeys),
        columnFilters: read(options.columnFilters),
        remoteSort: read(options.remoteSort),
      })
    }
    return injectExpandRows(
      buildTableEntries(data, columns, {
        sort: sortState.value,
        sorts: sortsState.value,
        multiSort: read(options.multiSort),
        filterText: read(options.filterText),
        filterKeys: read(options.filterKeys),
        columnFilters: read(options.columnFilters),
        groupBy: read(options.groupBy),
        groupLabel: read(options.groupLabel),
        remoteSort: read(options.remoteSort),
      }),
      expandedKeySet.value,
      rowKey,
      read(options.rowExpandable),
    )
  })

  /**
   * 单次遍历 tableEntries，产出 dataRows / viewRows / selectableRowKeys / rowKeyByIndex。
   * 不依赖 selectedKeySet，避免选中变化触发全量重遍历。
   */
  const rowDerivedState = computed(() => {
    const rows: Extract<RsTableRowEntry<T>, { type: 'row' }>[] = []
    const view: T[] = []
    const selKeys: string[] = []
    const keyByIndex = new Map<number, string>()
    const rowKey = read(options.rowKey)
    const rowSelectable = read(options.rowSelectable)
    for (const entry of tableEntries.value) {
      if (entry.type !== 'row') continue
      rows.push(entry)
      view.push(entry.row)
      const key = entry.treeKey ?? resolveRowKey(entry.row, entry.rowIndex, rowKey)
      keyByIndex.set(entry.rowIndex, key)
      const disabled = isTableRowDisabled(entry.row)
      if (!disabled && (rowSelectable ? rowSelectable(entry.row, entry.rowIndex) : true)) {
        selKeys.push(key)
      }
    }
    return { rows, view, selKeys, keyByIndex }
  })

  const dataRows = computed(() => rowDerivedState.value.rows)
  const selectableRowKeys = computed(() => rowDerivedState.value.selKeys)
  /** rowIndex → rowKey，供模板热路径 O(1) 查询 */
  const rowKeyByIndex = computed(() => rowDerivedState.value.keyByIndex)
  /** 当前筛选/排序后的业务行（不含 group/expand 伪行），与 dataRows 同趟产出 */
  const viewRows = computed(() => rowDerivedState.value.view)

  /** 当前已选行对象（依赖 dataRows + selectedKeySet；选中变化不重扫 tableEntries） */
  const selectedRows = computed<T[]>(() => {
    const keySet = selectedKeySet.value
    const keyMap = rowKeyByIndex.value
    const out: T[] = []
    for (const entry of dataRows.value) {
      if (keySet.has(keyMap.get(entry.rowIndex) ?? '')) out.push(entry.row)
    }
    return out
  })

  const selectAllState = computed(() =>
    resolveSelectAllState(selectedRowKeys.value, selectableRowKeys.value),
  )

  return {
    internalSort,
    internalSorts,
    internalSelectedRowKeys,
    internalExpandedRowKeys,
    treeLoadingKeys,
    isSortControlled,
    sortState,
    isSortsControlled,
    sortsState,
    isSelectionControlled,
    selectedRowKeys,
    selectedKeySet,
    isExpandedControlled,
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
    treeLoadingKeySet,
    tableTreeNodeIndex,
    tableEntries,
    dataRows,
    selectableRowKeys,
    rowKeyByIndex,
    selectedRows,
    selectAllState,
    viewRows,
  }
}

/** useRsTableEngine 返回值类型 */
export type RsTableEngineApi<T extends RsTableRowData> = ReturnType<typeof useRsTableEngine<T>>
