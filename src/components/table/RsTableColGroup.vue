<script setup lang="ts" generic="T extends import('../table-utils').RsTableRowData">
import { useRsTableView } from './rs-table-view-context'

const view = useRsTableView<T>()
</script>

<template>
  <colgroup v-if="view.useFixedColumnLayout">
    <col v-if="view.showRowDragHandle" :style="{ width: `${view.prefixWidths.drag}px` }">
    <col v-if="view.detailExpandable" :style="{ width: `${view.prefixWidths.expand}px` }">
    <col v-if="view.showSelectColumn" :style="{ width: `${view.prefixWidths.select}px` }">
    <col
      v-if="view.showEditGutterColumn"
      data-col-key="gutter"
      :style="{ width: `${view.resolvedGutterWidth}px` }"
    >
    <col
      v-else-if="view.showIndexColumn"
      :style="{ width: `${view.resolvedIndexWidth}px` }"
    >
    <col v-if="view.showRowStatusColumn" :style="{ width: `${view.prefixWidths.status}px` }">
    <col
      v-if="view.columnPadLeft > 0"
      class="rs-table__col-pad"
      :style="{ width: `${view.columnPadLeft}px` }"
    >
    <col
      v-for="column in view.visibleDataColumns"
      :key="column.key"
      :data-col-key="column.key"
      :style="{
        width: `${view.resolvedDataColumnWidth(column.key, column.width ?? column.minWidth)}px`,
      }"
    >
    <col
      v-if="view.columnPadRight > 0"
      class="rs-table__col-pad"
      :style="{ width: `${view.columnPadRight}px` }"
    >
  </colgroup>
</template>
