/**
 * RsTable 编辑编排层：状态机 + 高亮 + 动作 + Api 编辑切片。
 *
 * 分层：
 * - useRsTableEditLayer：早期挂载（须在 Shell 之前，供 isEditingAny）
 * - bindActions：Shell 交互就绪后绑定提交/键盘/粘贴
 * - toApiEditSlice：供 createRsTableApi 拼装，避免 expose 与内部漂移
 *
 * 性能：草稿/undo 仍用 shallow Map；不在此对 data 做 deep watch。
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import type { RsTableColumn, RsTableRowData, RsTableRowEntry } from '../components/table-utils'
import {
  columnUsesSharedTooltip,
  resolveCellTooltipMode,
  resolveCellTooltipText,
} from '../components/table-utils'
import { resolveColumnRawValue } from '../components/table/table-edit-utils'
import type { RsTableApi } from '../components/table/rs-table-api'
import { useTableEdit } from './useTableEdit'
import { useTableRowHighlight } from './useTableRowHighlight'
import {
  useRsTableEditActions,
  type UseRsTableEditActionsOptions,
} from './useRsTableEditActions'

export interface UseRsTableEditLayerOptions {
  editable: () => boolean
  editGutter: () => boolean
  editGutterWidth: () => number | undefined
  showIndex: () => boolean
  indexWidth: () => number | undefined
  rowCommit: () => boolean
  showRowStatus: () => boolean
  editUndoLimit: () => number | undefined
  highlightRow: () => boolean
  highlightRowOnClick: () => boolean
  highlightedRowKey: () => string | undefined
  defaultHighlightedRowKey: () => string | undefined
  onHighlightUpdate: (value: string | undefined) => void
  /** 共享 tooltip / 插槽探测 */
  cellTooltip: () => boolean
  hasColumnSlot: (key: string) => boolean
}

/**
 * Api 中与编辑/高亮相关的方法切片（不含行查询与 analytics）。
 */
export type RsTableApiEditSlice<T extends RsTableRowData> = Pick<
  RsTableApi<T>,
  | 'getHighlightedRowKey'
  | 'setHighlightedRowKey'
  | 'cancelCellEdit'
  | 'cancelAllEdits'
  | 'getDirtyCellKeys'
  | 'getCellError'
  | 'setCellError'
  | 'stageCell'
  | 'rejectRowEdit'
  | 'undoEdit'
  | 'redoEdit'
  | 'commitRowEdits'
  | 'rollbackRowEdits'
>

/**
 * 编辑层：早期状态 + 延迟 bindActions。
 */
export function useRsTableEditLayer<T extends RsTableRowData>(
  options: UseRsTableEditLayerOptions,
) {
  const showEditGutterColumn = computed(() => options.editable() && options.editGutter())
  const showIndexColumn = computed(() => options.showIndex() && !showEditGutterColumn.value)
  const showRowStatusColumn = computed(
    () => options.rowCommit() && options.showRowStatus() && !showEditGutterColumn.value,
  )
  const resolvedGutterWidth = computed(() => Math.max(24, options.editGutterWidth() || 32))
  const resolvedIndexWidth = computed(() => Math.max(24, options.indexWidth() || 48))

  const tableEdit = useTableEdit({
    enabled: () => options.editable(),
    undoLimit: () => options.editUndoLimit(),
  })

  const activeEditCellKey = computed(() => {
    const cell = tableEdit.editingCell.value
    return cell ? `${cell.rowKey}:${cell.colKey}` : ''
  })
  const activeFocusCellKey = computed(() => {
    const cell = tableEdit.focusCell.value
    return cell ? `${cell.rowKey}:${cell.colKey}` : ''
  })
  const activeErrorMapSize = computed(() => tableEdit.errorMap.value.size)
  const activeValidatingMapSize = computed(() => tableEdit.validatingMap.value.size)

  const isHighlightControlled = computed(() => options.highlightedRowKey() !== undefined)
  const rowHighlight = useTableRowHighlight({
    enabled: () => options.highlightRow(),
    highlightRowOnClick: () => options.highlightRowOnClick(),
    isControlled: () => isHighlightControlled.value,
    highlightedRowKey: () => options.highlightedRowKey(),
    defaultHighlightedRowKey: () => options.defaultHighlightedRowKey(),
    onUpdate: options.onHighlightUpdate,
  })

  function cellTooltipEnabled(column: RsTableColumn<T>, _rowIndex: number): boolean {
    return options.cellTooltip() && columnUsesSharedTooltip(column) && !options.hasColumnSlot(column.key)
  }

  function cellTooltipMode(column: RsTableColumn<T>, rowIndex: number): string | undefined {
    if (!cellTooltipEnabled(column, rowIndex)) return undefined
    return resolveCellTooltipMode(column) ?? undefined
  }

  function cellTooltipText(column: RsTableColumn<T>, row: T, rowIndex: number): string | undefined {
    if (!cellTooltipEnabled(column, rowIndex)) return undefined
    const text = resolveCellTooltipText(column, row, rowIndex)
    return text || undefined
  }

  function cellTooltipFallbackTitle(
    column: RsTableColumn<T>,
    row: T,
    rowIndex: number,
  ): string | undefined {
    if (options.cellTooltip() || !column.ellipsis || options.hasColumnSlot(column.key)) {
      return undefined
    }
    const text = resolveCellTooltipText(column, row, rowIndex)
    return text || undefined
  }

  /**
   * Shell 就绪后绑定编辑动作（依赖 rowKeyFor / onRowClick）。
   */
  function bindActions(
    actionOptions: Omit<UseRsTableEditActionsOptions<T>, 'tableEdit' | 'applyRowClickHighlight'>,
  ) {
    const actions = useRsTableEditActions<T>({
      ...actionOptions,
      tableEdit,
      applyRowClickHighlight: (key) => rowHighlight.applyRowClickHighlight(key),
    })

    function getRowByKey(
      rowKey: string,
      dataRows: Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>,
      rowKeyByIndex: Map<number, string>,
    ): T | undefined {
      const entry = dataRows.find((item) => rowKeyByIndex.get(item.rowIndex) === rowKey)
      return entry?.row
    }

    function getRowByIndex(
      index: number,
      dataRows: Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>,
    ): T | undefined {
      return dataRows.find((item) => item.rowIndex === index)?.row
    }

    function getColumnValues(
      colKey: string,
      dataRows: Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>,
    ): unknown[] {
      const column = actions.resolveColumnByKey(colKey)
      if (!column) return []
      return dataRows.map((entry) => resolveColumnRawValue(entry.row, column, entry.rowIndex))
    }

    function getCellValue(
      rowKey: string,
      colKey: string,
      dataRows: Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>,
      rowKeyByIndex: Map<number, string>,
    ): unknown {
      const row = getRowByKey(rowKey, dataRows, rowKeyByIndex)
      const column = actions.resolveColumnByKey(colKey)
      if (!row || !column) return undefined
      const entry = dataRows.find((item) => rowKeyByIndex.get(item.rowIndex) === rowKey)
      if (!entry) return undefined
      return resolveColumnRawValue(entry.row, column, entry.rowIndex)
    }

    function toApiEditSlice(ctx: {
      dataRows:
        | Ref<Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>>
        | ComputedRef<Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>>
      rowKeyByIndex: Ref<Map<number, string>> | ComputedRef<Map<number, string>>
    }): RsTableApiEditSlice<T> {
      return {
        getHighlightedRowKey: () => rowHighlight.highlightedKey.value,
        setHighlightedRowKey: rowHighlight.setHighlightedKey,
        cancelCellEdit: () => tableEdit.cancelEdit(),
        cancelAllEdits: () => tableEdit.cancelAll(),
        getDirtyCellKeys: () => [...tableEdit.stagedMap.value.keys()],
        getCellError: tableEdit.getCellError,
        setCellError: tableEdit.setCellError,
        stageCell: tableEdit.stageCell,
        rejectRowEdit: actions.rejectRowEdit,
        undoEdit: actions.onEditUndo,
        redoEdit: actions.onEditRedo,
        commitRowEdits: (rowKey: string) => {
          const entry = ctx.dataRows.value.find(
            (item) => ctx.rowKeyByIndex.value.get(item.rowIndex) === rowKey,
          )
          if (entry) void actions.onRowCommitEdit(entry)
        },
        rollbackRowEdits: (rowKey: string) => {
          const entry = ctx.dataRows.value.find(
            (item) => ctx.rowKeyByIndex.value.get(item.rowIndex) === rowKey,
          )
          if (entry) actions.onRowRollbackEdit(entry)
        },
      }
    }

    return {
      ...actions,
      getRowByKey,
      getRowByIndex,
      getColumnValues,
      getCellValue,
      toApiEditSlice,
    }
  }

  return {
    tableEdit,
    rowHighlight,
    showEditGutterColumn,
    showIndexColumn,
    showRowStatusColumn,
    resolvedGutterWidth,
    resolvedIndexWidth,
    activeEditCellKey,
    activeFocusCellKey,
    activeErrorMapSize,
    activeValidatingMapSize,
    isEditingAny: () => Boolean(tableEdit.editingCell.value),
    cellTooltipEnabled,
    cellTooltipMode,
    cellTooltipText,
    cellTooltipFallbackTitle,
    bindActions,
  }
}

export type RsTableEditLayerApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableEditLayer<T>
>
