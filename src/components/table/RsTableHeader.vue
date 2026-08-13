<script setup lang="ts" generic="T extends import('../table-utils').RsTableRowData">
import RsIcon from '../RsIcon.vue'
import RsTableHeaderFilter from './RsTableHeaderFilter.vue'
import { useRsTableView } from './rs-table-view-context'

const view = useRsTableView<T>()
</script>

<template>
  <thead
    class="rs-table__head"
    @pointerover.passive="view.onHeaderPointerOver($event)"
    @pointerout.passive="view.onHeaderPointerOut($event)"
  >
    <tr role="row">
      <th
        v-if="view.showRowDragHandle"
        role="columnheader"
        class="rs-table__th rs-table__th--drag"
        :style="view.dragLeadHeaderStyle"
      />
      <th
        v-if="view.detailExpandable"
        role="columnheader"
        class="rs-table__th rs-table__th--expand"
        :style="view.expandLeadHeaderStyle"
      />
      <th
        v-if="view.showSelectColumn"
        role="columnheader"
        class="rs-table__th rs-table__th--selection"
        :style="view.selectLeadHeaderStyle"
      >
        <label
          v-if="!view.isRadioSelection"
          class="rs-table__checkbox"
          :class="{
            'rs-table__checkbox--checked': view.selectAllState === 'checked',
            'rs-table__checkbox--indeterminate': view.selectAllState === 'indeterminate',
          }"
        >
          <input
            type="checkbox"
            class="rs-table__checkbox-input"
            :checked="view.selectAllState === 'checked'"
            :aria-label="view.headerLabels.selectAll"
            @change="view.onToggleSelectAll()"
          >
          <span class="rs-table__checkbox-box" aria-hidden="true" />
        </label>
      </th>
      <th
        v-if="view.showEditGutterColumn"
        role="columnheader"
        class="rs-table__th rs-table__th--gutter rs-table__cell--center"
        :style="view.gutterLeadHeaderStyle"
      />
      <th
        v-else-if="view.showIndexColumn"
        role="columnheader"
        class="rs-table__th rs-table__th--index rs-table__cell--center"
        :style="view.indexLeadHeaderStyle"
      >
        {{ view.headerLabels.index }}
      </th>
      <th
        v-if="view.showRowStatusColumn"
        role="columnheader"
        class="rs-table__th rs-table__th--status rs-table__cell--center"
      >
        {{ view.headerLabels.rowStatus }}
      </th>
      <th
        v-if="view.columnPadLeft > 0"
        role="presentation"
        class="rs-table__th rs-table__col-pad"
        :style="{ width: `${view.columnPadLeft}px`, minWidth: `${view.columnPadLeft}px` }"
      />
      <th
        v-for="column in view.visibleDataColumns"
        :key="column.key"
        role="columnheader"
        :data-col-key="column.key"
        class="rs-table__th"
        :class="[
          `rs-table__cell--${column.align ?? 'left'}`,
          { 'rs-table__th--sortable': column.sortable },
          { 'rs-table__th--filterable': column.filterable },
          { 'rs-table__cell--fixed': column.fixed },
          { 'rs-table__th--dragging': view.dragColumnKey === column.key },
          { 'rs-table__th--drop-target': view.dropColumnKey === column.key },
        ]"
        :style="view.columnHeaderStyleMap.get(column.key)"
        @dragover="view.onColumnDragOver(column.key, $event)"
        @drop="view.onColumnDrop(column.key, $event)"
      >
        <span
          v-if="view.columnDraggable"
          class="rs-table__column-drag-handle"
          draggable="true"
          :aria-label="view.headerLabels.dragColumn"
          @click.stop
          @dragstart.stop="view.onColumnDragStart(column.key, $event)"
          @dragend.stop="view.onColumnDragEnd()"
        />
        <slot :name="`header-${column.key}`" :column="column">
          <span
            v-if="column.headerTip"
            class="rs-table__th-label rs-table__th-label--tip"
            :data-rs-table-header-tip="column.headerTip"
          >{{ column.title }}</span>
          <span v-else class="rs-table__th-label">{{ column.title }}</span>
        </slot>
        <span v-if="column.filterable || column.sortable" class="rs-table__header-actions">
          <RsTableHeaderFilter
            v-if="column.filterable"
            :model-value="view.columnFilterValue(column.key)"
            :column-title="column.title"
            :filter-label="view.headerLabels.filterColumn"
            :placeholder="view.headerLabels.filterPlaceholder"
            :clear-label="view.headerLabels.filterClear"
            :apply-label="view.headerLabels.filterApply"
            :active="view.isColumnFilterActive(view.columnFiltersState, column.key)"
            @update:model-value="view.updateColumnFilter(column.key, $event)"
          />
          <button
            v-if="column.sortable"
            type="button"
            class="rs-table__sort"
            :class="{ 'rs-table__sort--active': !!view.sortOrderFor(column.key) }"
            :title="column.title"
            :aria-label="column.title"
            @click.stop="view.onHeaderClick(column)"
          >
            <RsIcon :name="view.sortIconName(column.key)" size="sm" />
            <span
              v-if="view.multiSort && view.sortPriorityFor(column.key) > 1"
              class="rs-table__sort-priority"
            >
              {{ view.sortPriorityFor(column.key) }}
            </span>
          </button>
        </span>
        <span
          v-if="view.resizable"
          class="rs-table__resize-handle"
          @mousedown.stop="view.onResizeStart(column.key, $event)"
          @click.stop
        />
      </th>
      <th
        v-if="view.columnPadRight > 0"
        class="rs-table__th rs-table__col-pad"
        :style="{ width: `${view.columnPadRight}px`, minWidth: `${view.columnPadRight}px` }"
      />
    </tr>
  </thead>
</template>
