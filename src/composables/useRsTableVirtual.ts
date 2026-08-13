/**
 * RsTable 行虚拟滚动：启用判定、高度前缀和、可视窗口切片。
 *
 * 横向列虚拟见 useRsTableColumnVirtual；滚动/视口见 useRsTableScrollLayout。
 * 本 composable 只消费已算好的 `tableEntries`，不参与 entries 构建，避免循环依赖。
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import {
  buildVirtualHeightModel,
  getTableTreeChildren,
  hasTableTreeChildren,
  resolveTableTreeRowKey,
  sliceVirtualHeightModel,
  type RsTableRowData,
  type RsTableRowEntry,
  type RsTableRowKey,
} from '../components/table-utils'

/**
 * useRsTableVirtual 入参。
 * `tableEntriesForThreshold` 用于 auto 阈值，不可直接依赖完整 tableEntries（会循环）。
 */
export interface UseRsTableVirtualOptions<T extends RsTableRowData> {
  /** 根数据行数（非树表阈值用） */
  dataLength: ComputedRef<number> | (() => number)
  treeMode: ComputedRef<boolean> | (() => boolean)
  /** 树表当前展开态下的可见条目粗算 */
  tableEntriesForThreshold: ComputedRef<number> | (() => number)
  /** virtual prop：true 强制开 / false 强制关 / undefined 走 auto */
  virtual: ComputedRef<boolean | undefined> | (() => boolean | undefined)
  /** auto 模式下的行数阈值 */
  virtualAutoThreshold: ComputedRef<number> | (() => number)
  /** fill 为 true 时才允许 auto 开启虚拟（需确定视口高度） */
  fill: ComputedRef<boolean> | (() => boolean)
  infinite: ComputedRef<boolean> | (() => boolean)
  /** infinite 时默认开启虚拟；可显式关掉 */
  virtualOnInfinite: ComputedRef<boolean> | (() => boolean)
  overscan: ComputedRef<number> | (() => number)
  expandRowHeight: ComputedRef<number | undefined> | (() => number | undefined)
  scrollTop: Ref<number>
  viewportHeight: ComputedRef<number> | (() => number)
  fixedRowHeight: ComputedRef<number> | (() => number)
  /** 完整 entry 列表（含 group / expand 伪行） */
  tableEntries: ComputedRef<RsTableRowEntry<T>[]> | (() => RsTableRowEntry<T>[])
}

/** 统一读取 ComputedRef / Ref / getter */
function read<T>(source: ComputedRef<T> | (() => T) | Ref<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

/**
 * 树表展开态下的可见行粗算，供 virtual 自动阈值使用。
 * 仅统计当前 expandedKeys 下可见节点，不做完整 entry 构建。
 *
 * @param rows 根节点列表
 * @param expandedKeys 已展开行 key 集合
 * @param options 树字段与 rowKey 约定
 * @returns 可见行数量（含未展开的叶子占位行本身）
 */
export function flattenVisibleCountRough<R extends RsTableRowData>(
  rows: readonly R[],
  expandedKeys: ReadonlySet<string>,
  options: {
    childrenField: string
    isLeafField: string
    lazy: boolean
    rowKey?: RsTableRowKey<R>
  },
): number {
  let count = 0
  const walk = (items: readonly R[], parentKey: string | null) => {
    for (let i = 0; i < items.length; i += 1) {
      const row = items[i] as R
      count += 1
      const key = resolveTableTreeRowKey(row, i, parentKey, options.rowKey)
      if (hasTableTreeChildren(row, options) && expandedKeys.has(key)) {
        walk(getTableTreeChildren(row, options.childrenField), key)
      }
    }
  }
  walk(rows, null)
  return count
}

/**
 * 行虚拟滚动状态。
 *
 * @returns
 * - `virtualScrollEnabled`：是否启用行虚拟
 * - `virtualHeightModel`：前缀高度模型（总高 / 定位）
 * - `virtualSlice`：当前窗口 entries + 上下 pad
 * - `visibleEntries`：切片后的 entries（模板渲染用）
 */
export function useRsTableVirtual<T extends RsTableRowData>(options: UseRsTableVirtualOptions<T>) {
  /**
   * 启用规则：
   * 1. virtual === true → 开
   * 2. infinite 且未关闭 virtualOnInfinite → 开
   * 3. virtual === false → 关
   * 4. 否则 auto：fill 且行数 >= threshold
   */
  const virtualScrollEnabled = computed(() => {
    if (read(options.virtual) === true) return true
    if (read(options.infinite) && read(options.virtualOnInfinite) !== false) return true
    if (read(options.virtual) === false) return false
    const threshold = read(options.virtualAutoThreshold) ?? 0
    const rowCount = read(options.treeMode)
      ? read(options.tableEntriesForThreshold)
      : read(options.dataLength)
    return Boolean(read(options.fill) && threshold > 0 && rowCount >= threshold)
  })

  /** 全量 entries 的高度前缀和模型 */
  const virtualHeightModel = computed(() =>
    buildVirtualHeightModel(
      read(options.tableEntries),
      read(options.fixedRowHeight),
      undefined,
      (read(options.expandRowHeight) ?? undefined) as 80 | undefined,
    ),
  )

  /**
   * 可视切片。未启用虚拟时返回全部 entries，pad 为 0。
   */
  const virtualSlice = computed(() => {
    if (!virtualScrollEnabled.value) {
      const entries = read(options.tableEntries)
      return { entries, paddingTop: 0, paddingBottom: 0 }
    }
    return sliceVirtualHeightModel(
      virtualHeightModel.value,
      options.scrollTop.value,
      read(options.viewportHeight),
      read(options.fixedRowHeight),
      read(options.overscan),
    )
  })

  const visibleEntries = computed(() => virtualSlice.value.entries)

  return {
    virtualScrollEnabled,
    virtualHeightModel,
    virtualSlice,
    visibleEntries,
  }
}

/** useRsTableVirtual 返回值类型 */
export type RsTableVirtualApi<T extends RsTableRowData> = ReturnType<typeof useRsTableVirtual<T>>
