<script setup lang="ts" generic="T extends import('../table-utils').RsTableRowData">
/**
 * 表格 footer 汇总行：按列渲染 summaryCells.text。
 *
 * 前缀列（拖拽/展开/选择/序号等）用 colspan 占位，与表体列对齐；
 * padLeft / padRight 对齐列虚拟滚动的左右垫片。
 */
import type { RsTableColumn } from '../table-utils'
import type { RsTableSummaryCell } from './table-summary-utils'

defineProps<{
  /** 与表体一致的展示列（通常为 displayColumns） */
  columns: RsTableColumn<T>[]
  /** 与 columns 按 key 对应的汇总单元格 */
  cells: RsTableSummaryCell[]
  /** 前缀列占位 colspan（拖拽/展开/选择/序号/状态等） */
  prefixColspan?: number
  /** 列虚拟左侧垫片宽度（px） */
  padLeft?: number
  /** 列虚拟右侧垫片宽度（px） */
  padRight?: number
}>()
</script>

<template>
  <tr class="rs-table__summary-row">
    <td
      v-if="(prefixColspan ?? 0) > 0"
      class="rs-table__summary-cell rs-table__summary-cell--prefix"
      :colspan="prefixColspan"
    />
    <td
      v-if="(padLeft ?? 0) > 0"
      class="rs-table__summary-cell rs-table__summary-cell--pad"
      :style="{ width: `${padLeft}px`, minWidth: `${padLeft}px` }"
    />
    <td
      v-for="column in columns"
      :key="column.key"
      class="rs-table__summary-cell"
      :class="column.align ? `rs-table__summary-cell--${column.align}` : undefined"
      :data-col-key="column.key"
    >
      {{ cells.find((c) => c.key === column.key)?.text ?? '' }}
    </td>
    <td
      v-if="(padRight ?? 0) > 0"
      class="rs-table__summary-cell rs-table__summary-cell--pad"
      :style="{ width: `${padRight}px`, minWidth: `${padRight}px` }"
    />
  </tr>
</template>
