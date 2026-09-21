/**
 * RsTable 无障碍基线：region / grid 语义与 loading busy。
 *
 * 与 useRsTableGridKeyboard + 单元格 role=gridcell 配合，形成可漫游网格。
 * tabindex 放在 role=grid 的 table 上（复合控件可聚焦），勿放在 region 壳层。
 */

import { computed, type ComputedRef, type Ref } from 'vue'

export interface UseRsTableA11yOptions {
  /** 显式无障碍名称；空则回退 defaultLabel */
  ariaLabel: () => string | undefined
  defaultLabel: () => string
  loading: () => boolean
  /** 业务行数（view / dataRows） */
  rowCount: Ref<number> | ComputedRef<number> | (() => number)
  /** 可见数据列数 */
  colCount: Ref<number> | ComputedRef<number> | (() => number)
}

function read(source: Ref<number> | ComputedRef<number> | (() => number)): number {
  return typeof source === 'function' ? source() : source.value
}

/**
 * 壳层 / table 元素无障碍属性。
 */
export function useRsTableA11y(options: UseRsTableA11yOptions) {
  const resolvedLabel = computed(
    () => options.ariaLabel()?.trim() || options.defaultLabel(),
  )

  const shellA11y = computed(() => ({
    role: 'region' as const,
    'aria-label': resolvedLabel.value,
    'aria-busy': options.loading() ? true : undefined,
  }))

  const tableA11y = computed(() => ({
    role: 'grid' as const,
    tabindex: 0,
    'aria-rowcount': Math.max(0, read(options.rowCount)),
    'aria-colcount': Math.max(0, read(options.colCount)),
    'aria-label': resolvedLabel.value,
  }))

  return {
    resolvedLabel,
    shellA11y,
    tableA11y,
  }
}
