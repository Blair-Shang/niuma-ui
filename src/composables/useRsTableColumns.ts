/**
 * RsTable 列模型编排：顺序、列筛选、宽度与 displayColumns。
 *
 * 从 RsTable.vue 抽离，保持受控 / 非受控 API 与原先行为一致。
 * 不负责虚拟列切片、列拖拽排序的 DOM 交互（仍由 RsTable 编排）。
 */

import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  createInitialColumnWidths,
  resolveColumnOrder,
  resolveOrderedColumns,
  type RsTableColumn,
  type RsTableRowData,
} from '../components/table-utils'

/** 列相关事件（与 RsTable emit 子集对齐） */
export interface UseRsTableColumnsEmit {
  (e: 'update:columnOrder', value: string[]): void
  (e: 'columnOrderChange', value: string[]): void
  (e: 'update:columnFilters', value: Record<string, string>): void
  (e: 'columnFiltersChange', value: Record<string, string>): void
}

/**
 * useRsTableColumns 入参。
 * 多数字段支持 ComputedRef 或 getter，便于在 RsTable 内直接绑定 props。
 */
export interface UseRsTableColumnsOptions<T extends RsTableRowData> {
  /** 原始列定义（未排序） */
  columns: ComputedRef<RsTableColumn<T>[]> | (() => RsTableColumn<T>[])
  /** 受控列顺序；undefined 表示非受控 */
  columnOrder: ComputedRef<string[] | undefined> | (() => string[] | undefined)
  /** 非受控初始列顺序 */
  defaultColumnOrder: string[]
  /** 受控列筛选；undefined 表示非受控 */
  columnFilters: ComputedRef<Record<string, string> | undefined> | (() => Record<string, string> | undefined)
  /** 非受控初始列筛选 */
  defaultColumnFilters: Record<string, string>
  /** 初始列宽（像素） */
  initialColumnWidths: ComputedRef<Record<string, number> | undefined> | (() => Record<string, number> | undefined)
  /** 是否允许拖拽改列宽 */
  resizable: ComputedRef<boolean> | (() => boolean)
  /** 列布局：auto 自适应；fixed 固定表布局 */
  columnLayout: ComputedRef<'auto' | 'fixed'> | (() => 'auto' | 'fixed')
  /** 是否树表（影响展开列固定） */
  treeMode: ComputedRef<boolean> | (() => boolean)
  /** 树表是否固定展开列到左侧 */
  treeFixExpandColumn: ComputedRef<boolean> | (() => boolean)
  /** 树表展开列 key */
  treeExpandColumnKey: ComputedRef<string | null> | (() => string | null)
  emit: UseRsTableColumnsEmit
}

/** 统一读取 ComputedRef / getter */
function read<T>(source: ComputedRef<T> | (() => T)): T {
  return typeof source === 'function' ? (source as () => T)() : source.value
}

/**
 * 列顺序 / 列筛选 / 列宽 / displayColumns。
 *
 * @returns
 * - `columnOrderState` / `columnFiltersState`：受控或非受控读写
 * - `displayColumns`：按顺序排列；树表可将展开列钉为 fixed-left
 * - `resolvedColumnWidths` / `useStableColumnWidths`：拖拽列宽与稳定布局判定
 * - `updateColumnFilter` / `columnFilterValue`：表头筛选写入与读取
 */
export function useRsTableColumns<T extends RsTableRowData>(options: UseRsTableColumnsOptions<T>) {
  const internalColumnOrder = ref<string[]>([...options.defaultColumnOrder])
  const internalColumnFilters = ref<Record<string, string>>({ ...options.defaultColumnFilters })
  const internalColumnWidths = ref<Record<string, number>>({})

  const isColumnOrderControlled = computed(() => read(options.columnOrder) !== undefined)

  /** 当前列 key 顺序；受控时写回 update:columnOrder */
  const columnOrderState = computed({
    get: () => {
      if (isColumnOrderControlled.value) {
        return read(options.columnOrder) ?? []
      }
      if (internalColumnOrder.value.length) {
        return internalColumnOrder.value
      }
      return resolveColumnOrder(read(options.columns))
    },
    set: (value: string[]) => {
      if (isColumnOrderControlled.value) options.emit('update:columnOrder', value)
      else internalColumnOrder.value = value
      options.emit('columnOrderChange', value)
    },
  })

  const isColumnFiltersControlled = computed(() => read(options.columnFilters) !== undefined)

  /** 当前列筛选 map（列 key → 查询串） */
  const columnFiltersState = computed(() => read(options.columnFilters) ?? internalColumnFilters.value)

  /**
   * 更新单列筛选值。
   * 空串会删除该 key；同时发出 update:columnFilters / columnFiltersChange。
   */
  function updateColumnFilter(key: string, value: string) {
    const next = { ...columnFiltersState.value }
    if (value.trim()) next[key] = value
    else delete next[key]
    if (isColumnFiltersControlled.value) options.emit('update:columnFilters', next)
    else internalColumnFilters.value = next
    options.emit('columnFiltersChange', next)
  }

  /** 读取单列当前筛选文案（无则空串） */
  function columnFilterValue(key: string): string {
    return columnFiltersState.value[key] ?? ''
  }

  /**
   * 渲染用列列表：先按 columnOrder 排序；
   * 树表且 fixExpandColumn 时，将展开列强制 fixed=left（已有 fixed 则不动）。
   */
  const displayColumns = computed(() => {
    const ordered = resolveOrderedColumns(read(options.columns), columnOrderState.value)
    if (!read(options.treeMode) || !read(options.treeFixExpandColumn)) return ordered
    const expandKey = read(options.treeExpandColumnKey)
    if (!expandKey) return ordered
    return ordered.map((column) => {
      if (column.key !== expandKey || column.fixed) return column
      return { ...column, fixed: 'left' as const }
    })
  })

  /** 持久化列宽（像素）；拖拽过程中由 RsTable 另用 DOM 直写避免整表重渲 */
  const resolvedColumnWidths = computed({
    get: () => internalColumnWidths.value,
    set: (value: Record<string, number>) => {
      internalColumnWidths.value = value
    },
  })

  /**
   * 是否启用「稳定列宽」布局（resizable 下避免松手回弹）。
   * fixed 布局，或每一列都有显式 width / 已测宽时为 true。
   */
  const useStableColumnWidths = computed(() => {
    if (!read(options.resizable)) return false
    if (read(options.columnLayout) === 'fixed') return true
    const widths = internalColumnWidths.value
    return displayColumns.value.every((col) => {
      return typeof widths[col.key] === 'number' || col.width !== undefined
    })
  })

  /**
   * 按当前 columns 重建内部列宽：保留已有测量值，合并 initialColumnWidths。
   * columns 变化时由 watch 调用。
   */
  function syncInternalColumnWidths(columns: RsTableColumn<T>[]): void {
    const preserved: Record<string, number> = {}
    for (const column of columns) {
      const width = internalColumnWidths.value[column.key]
      if (typeof width === 'number') preserved[column.key] = width
    }
    internalColumnWidths.value = createInitialColumnWidths(
      columns,
      { ...(read(options.initialColumnWidths) ?? {}), ...preserved },
      { forceAll: read(options.resizable) && useStableColumnWidths.value },
    )
  }

  watch(
    () => read(options.columns),
    (columns) => {
      syncInternalColumnWidths(columns)
      // 非受控：在保留已有顺序的前提下与新 columns 对齐
      if (!isColumnOrderControlled.value) {
        internalColumnOrder.value = resolveColumnOrder(columns, internalColumnOrder.value)
      }
    },
    { immediate: true },
  )

  return {
    internalColumnOrder,
    internalColumnFilters,
    internalColumnWidths,
    isColumnOrderControlled,
    columnOrderState,
    isColumnFiltersControlled,
    columnFiltersState,
    displayColumns,
    resolvedColumnWidths,
    useStableColumnWidths,
    syncInternalColumnWidths,
    updateColumnFilter,
    columnFilterValue,
  }
}

/** useRsTableColumns 返回值类型 */
export type RsTableColumnsApi<T extends RsTableRowData> = ReturnType<typeof useRsTableColumns<T>>
