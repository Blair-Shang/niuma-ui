<script setup lang="ts" generic="T extends import('../table-utils').RsTableRowData">
/**
 * RsTable 表体视图：通过 ViewContext inject 取状态（多表互不串扰）。
 * 行级 v-memo 保留，避免抽离后丢失细粒度跳过渲染。
 */
import { isTableRowDisabled, resolveEntryKey } from '../table-utils'
import type { RsTableRowEntry } from '../table-utils'
import RsTableBodyRow from './RsTableBodyRow.vue'
import { useRsTableView } from './rs-table-view-context'

const view = useRsTableView<T>()

type RowEntry = Extract<RsTableRowEntry<T>, { type: 'row' }>

function editingColKeyFor(entry: RowEntry): string | null {
  const key = view.rowKeyFor(entry)
  return view.editingCell?.rowKey === key ? view.editingCell.colKey : null
}

function focusColKeyFor(entry: RowEntry): string | null {
  const key = view.rowKeyFor(entry)
  return view.focusCell?.rowKey === key ? view.focusCell.colKey : null
}

function memoEditingDraft(entry: RowEntry): string {
  return view.editingCell?.rowKey === view.rowKeyFor(entry) ? view.editingDraft : ''
}
</script>

<template>
  <tbody
    @pointerover.passive="view.onBodyPointerOver($event)"
    @pointerout.passive="view.onBodyPointerOut($event)"
  >
    <tr v-if="view.loading">
      <td class="rs-table__empty" :colspan="view.bodyColspan">
        <div class="rs-table__empty-content" :style="view.emptyContentStyle">
          {{ view.bodyLabels.loading }}
        </div>
      </td>
    </tr>
    <tr v-else-if="!view.hasData">
      <td class="rs-table__empty" :colspan="view.bodyColspan">
        <div class="rs-table__empty-content" :style="view.emptyContentStyle">
          <slot name="empty">{{ view.bodyLabels.empty }}</slot>
        </div>
      </td>
    </tr>
    <template v-else>
      <tr
        v-if="view.virtualScrollEnabled && view.virtualSlice.paddingTop > 0"
        class="rs-table__virtual-pad"
      >
        <td :colspan="view.bodyColspan" :style="{ height: `${view.virtualSlice.paddingTop}px` }" />
      </tr>
      <template
        v-for="entry in view.visibleEntries"
        :key="resolveEntryKey(entry, view.rowKey)"
      >
        <tr v-if="entry.type === 'group'" class="rs-table__group-row">
          <td class="rs-table__group-cell" :colspan="view.bodyColspan">
            <slot name="group" :key="entry.key" :label="entry.label">
              {{ entry.label }}
            </slot>
          </td>
        </tr>
        <tr v-else-if="entry.type === 'expand'" class="rs-table__expand-row">
          <td class="rs-table__expand-cell" :colspan="view.bodyColspan">
            <slot name="expand" :row="entry.row" :index="entry.rowIndex" />
          </td>
        </tr>
        <RsTableBodyRow
          v-else
          v-memo="[
            view.rowKeyFor(entry),
            entry.row,
            view.isRowSelected(entry),
            view.isRowIndeterminate(entry),
            view.isRowExpanded(entry),
            view.isHighlighted(view.rowKeyFor(entry)),
            view.rowEditPending(entry),
            view.stagedMapSize,
            memoEditingDraft(entry),
            view.activeEditCellKey,
            view.activeFocusCellKey,
            view.activeErrorMapSize,
            view.activeValidatingMapSize,
            view.dragRowKeys.join(','),
            view.dropRowTargetKey,
            view.dropRowPosition,
            view.columnPadLeft,
            view.columnPadRight,
            view.treeDepthOf(entry),
            view.canExpandRow(entry),
            view.treeLoadingKeySet.has(view.rowKeyFor(entry)),
            view.visibleDataColumns.map((c) => c.key).join('\0'),
            view.instanceId,
          ]"
          :row="entry.row"
          :row-index="entry.rowIndex"
          :row-key="view.rowKeyFor(entry)"
          :columns="view.visibleDataColumns"
          :column-pad-left="view.columnPadLeft"
          :column-pad-right="view.columnPadRight"
          :column-td-class-map="view.columnTdClassMap"
          :column-style-map="view.columnStyleMap"
          :show-row-drag-handle="view.showRowDragHandle"
          :expandable="view.detailExpandable"
          :tree-mode="view.treeMode"
          :tree-depth="view.treeDepthOf(entry)"
          :tree-has-children="view.canExpandRow(entry)"
          :tree-indent="view.treeIndentPx"
          :tree-column-key="view.treeExpandColumnKey"
          :tree-loading="view.treeLoadingKeySet.has(view.rowKeyFor(entry))"
          :selectable="view.showSelectColumn"
          :show-index="view.showIndexColumn"
          :show-edit-gutter="view.showEditGutterColumn"
          :striped="view.striped"
          :selection-type="view.selectionType"
          :is-radio-selection="view.isRadioSelection"
          :table-editable="view.editable"
          :edit-trigger="view.editTrigger"
          :row-commit="view.rowCommit"
          :allow-null="view.allowNull"
          :focus-mode="view.editFocusMode"
          :null-label="view.nullLabel"
          :show-row-status="view.showRowStatusColumn"
          :selected="view.isRowSelected(entry)"
          :indeterminate="view.isRowIndeterminate(entry)"
          :highlighted="view.isHighlighted(view.rowKeyFor(entry))"
          :expanded="view.isRowExpanded(entry)"
          :disabled="isTableRowDisabled(entry.row)"
          :row-drag-by-row="view.isRowDragByRow(entry)"
          :dragging="view.isRowDragging(entry)"
          :drop-target="view.isRowDropTarget(entry)"
          :drop-position="view.isRowDropTarget(entry) ? view.dropRowPosition : null"
          :drag-lead-style="view.dragLeadStyle"
          :expand-lead-style="view.expandLeadStyle"
          :select-lead-style="view.selectLeadStyle"
          :index-lead-style="view.indexLeadStyle"
          :gutter-lead-style="view.gutterLeadStyle"
          :can-expand="view.canExpandRow(entry)"
          :can-select="view.canSelectRow(entry)"
          :row-edit-pending="view.rowEditPending(entry)"
          :row-dirty="view.isRowDirty(view.rowKeyFor(entry))"
          :show-gutter-rollback="view.rowCommit || view.isExternalRowPending(entry)"
          :editing-col-key="editingColKeyFor(entry)"
          :focus-col-key="focusColKeyFor(entry)"
          :has-column-slot="view.hasColumnSlot"
          :has-edit-slot="view.hasEditSlot"
          :cell-tooltip-enabled="view.cellTooltipEnabled"
          :cell-tooltip-mode="view.cellTooltipMode"
          :cell-tooltip-text="view.cellTooltipText"
          :cell-tooltip-fallback-title="view.cellTooltipFallbackTitle"
          :get-cell-draft="view.getCellDraft"
          :is-cell-dirty="view.isCellDirty"
          :get-cell-error="view.getCellError"
          :is-cell-validating="view.isCellValidating"
          :drag-row-label="view.bodyLabels.dragRow"
          :expand-row-label="view.bodyLabels.expandRow"
          :collapse-row-label="view.bodyLabels.collapseRow"
          :select-row-label="view.bodyLabels.selectRow"
          :row-commit-label="view.bodyLabels.rowCommit"
          :row-rollback-label="view.bodyLabels.rowRollback"
          :gutter-commit-hint="view.bodyLabels.gutterCommit"
          @click="view.onRowClick(entry, $event)"
          @mousedown="view.onRowSelectMouseDown($event)"
          @cell-click="(colKey, event) => view.onCellClick(entry, colKey, event)"
          @cell-dblclick="(colKey, event) => view.onCellDblclick(entry, colKey, event)"
          @cell-contextmenu="(colKey, event) => view.onCellContextmenu(entry, colKey, event)"
          @dblclick="view.onRowDblclick(entry, $event)"
          @contextmenu="view.onRowContextmenu(entry, $event)"
          @dragover="view.onRowDragOver(entry, $event)"
          @dragleave="view.onRowDragLeave($event)"
          @drop="view.onRowDrop(entry, $event)"
          @row-drag-start="view.onRowDragStart(entry, $event)"
          @row-drag-end="view.onRowDragEnd()"
          @toggle-expand="view.onToggleExpand(entry)"
          @toggle-select="view.onToggleSelect(entry)"
          @cell-start-edit="view.onCellStartEdit(entry, $event)"
          @cell-commit="(colKey, value) => view.onCellCommit(entry, colKey, value)"
          @cell-cancel="view.onCellCancel(entry, $event)"
          @cell-update-draft="(colKey, value) => view.onCellUpdateDraft(entry, colKey, value)"
          @cell-navigate="(colKey, direction) => view.onCellNavigate(entry, colKey, direction)"
          @row-commit="view.onRowCommit(entry)"
          @row-rollback="view.onRowRollback(entry)"
          @gutter-commit="view.onGutterCommit(entry)"
        >
          <template v-for="column in view.visibleDataColumns" #[column.key]="slotProps">
            <slot :name="column.key" v-bind="slotProps" />
          </template>
          <template
            v-for="column in view.visibleDataColumns"
            :key="`edit-${column.key}`"
            #[`edit-${column.key}`]="slotProps"
          >
            <slot :name="`edit-${column.key}`" v-bind="slotProps" />
          </template>
        </RsTableBodyRow>
      </template>
      <tr
        v-if="view.virtualScrollEnabled && view.virtualSlice.paddingBottom > 0"
        class="rs-table__virtual-pad"
      >
        <td
          :colspan="view.bodyColspan"
          :style="{ height: `${view.virtualSlice.paddingBottom}px` }"
        />
      </tr>
      <tr v-if="view.infinite && view.loadingMore">
        <td class="rs-table__empty rs-table__empty--more" :colspan="view.bodyColspan">
          {{ view.bodyLabels.loadingMore }}
        </td>
      </tr>
    </template>
  </tbody>
</template>
