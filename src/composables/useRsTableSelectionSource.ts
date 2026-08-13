/**
 * 表格分析/图表数据源：viewRows + selectedRows → 稳定 sourceRows。
 *
 * 约定（便于柱状图/饼图等后期扩展）：
 * - 有选中行时 sourceMode='selected'，图表跟随勾选
 * - 无选中时回退 viewRows（筛选/排序后的业务行）
 * - subscribe 仅在浅层引用变化时通知，不做 deep watch
 */

import { computed, watch, type ComputedRef, type Ref } from 'vue'
import type { RsTableRowData } from '../components/table-utils'

export type RsTableAnalyticsSourceMode = 'selected' | 'view'

/** 分析快照：图表 / 指标卡 / 服务端请求共用 */
export interface RsTableAnalyticsSnapshot<T extends RsTableRowData = RsTableRowData> {
  viewRows: readonly T[]
  selectedRows: readonly T[]
  sourceRows: readonly T[]
  sourceMode: RsTableAnalyticsSourceMode
  selectedCount: number
  viewCount: number
}

export interface UseRsTableSelectionSourceOptions<T extends RsTableRowData> {
  viewRows: Ref<T[]> | ComputedRef<T[]>
  selectedRows?: Ref<T[]> | ComputedRef<T[]>
}

/**
 * 选中优先的分析数据源。
 *
 * @returns sourceRows / sourceMode / getSnapshot / subscribe
 */
export function useRsTableSelectionSource<T extends RsTableRowData>(
  options: UseRsTableSelectionSourceOptions<T>,
) {
  const viewRows = computed(() => options.viewRows.value ?? [])
  const selectedRows = computed(() => options.selectedRows?.value ?? [])

  const sourceMode = computed<RsTableAnalyticsSourceMode>(() =>
    selectedRows.value.length > 0 ? 'selected' : 'view',
  )

  const sourceRows = computed(() =>
    sourceMode.value === 'selected' ? selectedRows.value : viewRows.value,
  )

  function getSnapshot(): RsTableAnalyticsSnapshot<T> {
    return {
      viewRows: viewRows.value,
      selectedRows: selectedRows.value,
      sourceRows: sourceRows.value,
      sourceMode: sourceMode.value,
      selectedCount: selectedRows.value.length,
      viewCount: viewRows.value.length,
    }
  }

  /**
   * 订阅快照变化。
   * 依赖：viewRows 引用、selectedRows 引用、sourceMode。
   * @returns teardown
   */
  function subscribe(listener: (snap: RsTableAnalyticsSnapshot<T>) => void): () => void {
    const stop = watch(
      () => [viewRows.value, selectedRows.value, sourceMode.value] as const,
      () => {
        listener(getSnapshot())
      },
      { flush: 'post' },
    )
    listener(getSnapshot())
    return stop
  }

  return {
    viewRows,
    selectedRows,
    sourceRows,
    sourceMode,
    getSnapshot,
    subscribe,
  }
}

export type RsTableSelectionSourceApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableSelectionSource<T>
>
