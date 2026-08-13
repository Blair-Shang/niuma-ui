/**
 * RsTable 编辑动作层：单元格提交、键盘导航、粘贴、行提交/回滚。
 *
 * 职责边界：
 * - 做：编排 useTableEdit 状态机与业务 emit
 * - 不做：草稿 Map 本身（useTableEdit）；虚拟滚动卸载行后草稿仍由 staged/editing 保留
 *
 * 性能约定：可编辑单元格列表仅在导航时构建，不在每次渲染扫描全表。
 */

import type { useTableEdit } from './useTableEdit'
import {
  isBooleanToggleColumn,
  isCellValueChanged,
  isColumnEditable,
  isColumnNullable,
  isRowEditPending,
  listBatchColumnTargets,
  navigateEditableCell,
  nullToEditText,
  parseCellEditInput,
  parseClipboardGrid,
  resolveCellEditText,
  resolveColumnEditTrigger,
  resolveColumnEditorOptions,
  resolveColumnRawValue,
  validateCellValueAsync,
  type RsTableCellNavigateDirection,
} from '../components/table/table-edit-utils'
import type { RsTableColumn, RsTableRowData, RsTableRowEntry } from '../components/table-utils'

type TableEditApi = ReturnType<typeof useTableEdit>

export interface UseRsTableEditActionsOptions<T extends RsTableRowData> {
  tableEdit: TableEditApi
  editable: () => boolean
  editTrigger: () => 'click' | 'dblclick'
  editKeyboard: () => boolean
  editUndo: () => boolean
  editPaste: () => boolean
  editBatch: () => boolean
  allowNull: () => boolean
  rowCommit: () => boolean
  selectable: () => boolean
  selectionType: () => string
  selectedRowKeys: () => string[]
  displayColumns: () => RsTableColumn<T>[]
  dataRows: () => Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>
  rowKeyFor: (entry: Extract<RsTableRowEntry<T>, { type: 'row' }>) => string
  rowPending?: (row: T, index: number) => boolean
  applyRowClickHighlight: (rowKey: string) => void
  onRowClick: (entry: RsTableRowEntry<T>, event?: MouseEvent) => void
  onRowDblclick: (entry: RsTableRowEntry<T>, event?: MouseEvent) => void
  emit: {
    cellView: (row: T, column: RsTableColumn<T>, index: number) => void
    cellEditStart: (row: T, column: RsTableColumn<T>, index: number) => void
    cellEditDialog: (row: T, column: RsTableColumn<T>, index: number, draft: string) => void
    cellEditCommit: (
      row: T,
      column: RsTableColumn<T>,
      index: number,
      value: unknown,
      previous: unknown,
    ) => void
    cellEditCancel: (row: T, column: RsTableColumn<T>, index: number) => void
    cellEditInvalid: (
      row: T,
      column: RsTableColumn<T>,
      index: number,
      message: string,
      value: unknown,
    ) => void
    cellEditBatchCommit: (
      column: RsTableColumn<T>,
      changes: Array<{ row: T; index: number; value: unknown; previous: unknown }>,
    ) => void
    cellEditUndo: (entry: {
      items: Array<{
        rowKey: string
        colKey: string
        rowIndex: number
        previous: unknown
        next: unknown
      }>
    }) => void
    cellEditRedo: (entry: {
      items: Array<{
        rowKey: string
        colKey: string
        rowIndex: number
        previous: unknown
        next: unknown
      }>
    }) => void
    cellEditReject: (row: T, index: number, reason?: string) => void
    rowEditCommit: (
      row: T,
      index: number,
      changes: Array<{ colKey: string; value: unknown; previous: unknown }>,
    ) => void
    rowEditRollback: (row: T, index: number) => void
  }
}

/**
 * 编辑交互 API。
 */
export function useRsTableEditActions<T extends RsTableRowData>(
  options: UseRsTableEditActionsOptions<T>,
) {
  const { tableEdit, emit } = options

  function resolveColumnByKey(colKey: string): RsTableColumn<T> | undefined {
    return options.displayColumns().find((column) => column.key === colKey)
  }

  function findRowEntryByKey(
    rowKey: string,
  ): Extract<RsTableRowEntry<T>, { type: 'row' }> | undefined {
    return options.dataRows().find((item) => options.rowKeyFor(item) === rowKey)
  }

  /** 仅导航时调用；勿在模板渲染路径扫描 */
  function buildEditableCellList() {
    const result: Array<{ rowKey: string; colKey: string; rowIndex: number }> = []
    for (const entry of options.dataRows()) {
      const rowKey = options.rowKeyFor(entry)
      for (const column of options.displayColumns()) {
        if (!isColumnEditable(column, entry.row, entry.rowIndex, options.editable())) continue
        result.push({ rowKey, colKey: column.key, rowIndex: entry.rowIndex })
      }
    }
    return result
  }

  function onCellStartEdit(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    colKey: string,
  ): void {
    const column = resolveColumnByKey(colKey)
    if (!column) return
    if (isBooleanToggleColumn(column)) return
    if (!isColumnEditable(column, entry.row, entry.rowIndex, options.editable())) return
    const key = options.rowKeyFor(entry)
    const initialText = resolveCellEditText(
      entry.row,
      column,
      entry.rowIndex,
      tableEdit.getDraft(key, colKey),
    )
    const editorOpts = resolveColumnEditorOptions(column, entry.row, entry.rowIndex)
    if (editorOpts.presentation === 'dialog') {
      emit.cellEditDialog(entry.row, column, entry.rowIndex, initialText)
      return
    }
    tableEdit.startEdit({ rowKey: key, colKey, rowIndex: entry.rowIndex }, initialText)
    emit.cellEditStart(entry.row, column, entry.rowIndex)
  }

  function onCellUpdateDraft(
    _entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    _colKey: string,
    value: string,
  ): void {
    tableEdit.updateDraft(value)
  }

  function onCellCancelEdit(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    colKey: string,
  ): void {
    const column = resolveColumnByKey(colKey)
    tableEdit.cancelEdit()
    if (column) emit.cellEditCancel(entry.row, column, entry.rowIndex)
  }

  function moveEditFocus(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    colKey: string,
    direction: RsTableCellNavigateDirection,
    startEditNext: boolean,
  ): void {
    if (!options.editKeyboard()) return
    const cells = buildEditableCellList()
    const next = navigateEditableCell(
      cells,
      options.rowKeyFor(entry),
      colKey,
      direction,
      options.displayColumns().length || 1,
    )
    if (!next) return
    const nextEntry = findRowEntryByKey(next.rowKey)
    if (!nextEntry) return
    tableEdit.setFocusCell(next)
    options.applyRowClickHighlight(next.rowKey)
    if (startEditNext) {
      const column = resolveColumnByKey(next.colKey)
      if (column && isBooleanToggleColumn(column)) return
      onCellStartEdit(nextEntry, next.colKey)
    }
  }

  async function onCellCommitEdit(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    colKey: string,
    rawText: string,
    commitOptions?: {
      navigate?: RsTableCellNavigateDirection
      skipUndo?: boolean
      skipBatch?: boolean
    },
  ): Promise<boolean> {
    const column = resolveColumnByKey(colKey)
    if (!column) return false
    const allowNull = isColumnNullable(column, options.allowNull())
    const parsed = parseCellEditInput(rawText, entry.row, column, entry.rowIndex, { allowNull })
    const rowKey = options.rowKeyFor(entry)

    tableEdit.setValidating(rowKey, colKey, true)
    let error: string | null = null
    try {
      error = await validateCellValueAsync(parsed, entry.row, column, entry.rowIndex)
    } finally {
      tableEdit.setValidating(rowKey, colKey, false)
    }

    if (error) {
      tableEdit.updateDraft(rawText)
      tableEdit.setCellError(rowKey, colKey, error)
      emit.cellEditInvalid(entry.row, column, entry.rowIndex, error, parsed)
      return false
    }
    tableEdit.clearCellError(rowKey, colKey)

    const batchEnabled =
      options.editBatch() &&
      options.selectable() &&
      options.selectionType() !== 'radio' &&
      !options.rowCommit() &&
      !commitOptions?.skipBatch

    const targets = batchEnabled
      ? listBatchColumnTargets({
          rows: options.dataRows().map((item) => ({
            row: item.row,
            rowIndex: item.rowIndex,
            rowKey: options.rowKeyFor(item),
          })),
          column,
          tableEditable: options.editable(),
          selectedKeys: options.selectedRowKeys(),
          anchorRowKey: rowKey,
        })
      : [{ row: entry.row, rowIndex: entry.rowIndex, rowKey }]

    if (options.rowCommit()) {
      const previous = resolveColumnRawValue(entry.row, column, entry.rowIndex)
      if (!isCellValueChanged(previous, parsed)) {
        tableEdit.unstageCell(rowKey, colKey)
        tableEdit.cancelEdit()
        if (commitOptions?.navigate) moveEditFocus(entry, colKey, commitOptions.navigate, false)
        return true
      }
      tableEdit.stageCell({
        rowKey,
        colKey,
        rowIndex: entry.rowIndex,
        draft: rawText,
        original: previous,
      })
      if (commitOptions?.navigate) moveEditFocus(entry, colKey, commitOptions.navigate, true)
      return true
    }

    tableEdit.cancelEdit()

    const undoItems: Array<{
      rowKey: string
      colKey: string
      rowIndex: number
      previous: unknown
      next: unknown
    }> = []
    const batchChanges: Array<{ row: T; index: number; value: unknown; previous: unknown }> = []

    for (const target of targets) {
      const previous = resolveColumnRawValue(target.row, column, target.rowIndex)
      if (!isCellValueChanged(previous, parsed)) continue
      undoItems.push({
        rowKey: target.rowKey,
        colKey,
        rowIndex: target.rowIndex,
        previous,
        next: parsed,
      })
      batchChanges.push({
        row: target.row,
        index: target.rowIndex,
        value: parsed,
        previous,
      })
      emit.cellEditCommit(target.row, column, target.rowIndex, parsed, previous)
    }

    if (batchChanges.length > 1) {
      emit.cellEditBatchCommit(column, batchChanges)
    }

    if (!commitOptions?.skipUndo && options.editUndo() && undoItems.length) {
      tableEdit.pushUndo({ items: undoItems })
    }

    if (commitOptions?.navigate) moveEditFocus(entry, colKey, commitOptions.navigate, true)
    return true
  }

  async function onCellNavigate(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    colKey: string,
    direction: RsTableCellNavigateDirection,
  ): Promise<void> {
    const draft = tableEdit.editingDraft.value
    await onCellCommitEdit(entry, colKey, draft, { navigate: direction })
  }

  function onCellClick(entry: RsTableRowEntry<T>, colKey: string, event?: MouseEvent): void {
    if (entry.type !== 'row') return
    options.onRowClick(entry, event)
    const column = resolveColumnByKey(colKey)
    if (!column) return
    // 只读表也维护 focusCell，供 ARIA Grid 键盘漫游使用
    tableEdit.setFocusCell({
      rowKey: options.rowKeyFor(entry),
      colKey,
      rowIndex: entry.rowIndex,
    })
  }

  function onCellDblclick(entry: RsTableRowEntry<T>, colKey: string, event?: MouseEvent): void {
    if (entry.type !== 'row') return
    const column = resolveColumnByKey(colKey)
    if (
      column &&
      options.editable() &&
      resolveColumnEditTrigger(column, options.editTrigger()) === 'dblclick' &&
      isColumnEditable(column, entry.row, entry.rowIndex, options.editable()) &&
      !isBooleanToggleColumn(column)
    ) {
      onCellStartEdit(entry, colKey)
      return
    }
    if (column) {
      emit.cellView(entry.row, column, entry.rowIndex)
    }
    options.onRowDblclick(entry, event)
  }

  function applyUndoRedoValue(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    colKey: string,
    value: unknown,
  ): void {
    const column = resolveColumnByKey(colKey)
    if (!column) return
    const previous = resolveColumnRawValue(entry.row, column, entry.rowIndex)
    emit.cellEditCommit(entry.row, column, entry.rowIndex, value, previous)
  }

  function onEditUndo(): void {
    if (!options.editUndo()) return
    const entry = tableEdit.undo()
    if (!entry) return
    for (const item of entry.items) {
      const rowEntry = findRowEntryByKey(item.rowKey)
      if (!rowEntry) continue
      applyUndoRedoValue(rowEntry, item.colKey, item.previous)
    }
    emit.cellEditUndo(entry)
  }

  function onEditRedo(): void {
    if (!options.editUndo()) return
    const entry = tableEdit.redo()
    if (!entry) return
    for (const item of entry.items) {
      const rowEntry = findRowEntryByKey(item.rowKey)
      if (!rowEntry) continue
      applyUndoRedoValue(rowEntry, item.colKey, item.next)
    }
    emit.cellEditRedo(entry)
  }

  function coerceBooleanFromRow(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
    column: RsTableColumn<T>,
  ): boolean {
    const raw = resolveColumnRawValue(entry.row, column, entry.rowIndex)
    if (raw == null) return false
    if (typeof raw === 'boolean') return raw
    return String(raw).toLowerCase() === 'true' || raw === 1 || raw === '1'
  }

  function onTableKeydown(event: KeyboardEvent): void {
    if (!options.editable() || !options.editKeyboard()) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        if (!tableEdit.editingCell.value) {
          event.preventDefault()
          onEditUndo()
        }
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))
      ) {
        if (!tableEdit.editingCell.value) {
          event.preventDefault()
          onEditRedo()
        }
      }
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault()
      onEditUndo()
      return
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))
    ) {
      event.preventDefault()
      onEditRedo()
      return
    }

    const focus = tableEdit.focusCell.value
    if (!focus) return
    const entry = findRowEntryByKey(focus.rowKey)
    if (!entry) return
    const column = resolveColumnByKey(focus.colKey)
    if (!column) return

    if (event.key === 'F2' || event.key === 'Enter') {
      event.preventDefault()
      if (isBooleanToggleColumn(column)) {
        const next = !coerceBooleanFromRow(entry, column)
        void onCellCommitEdit(entry, focus.colKey, next ? 'true' : 'false')
        return
      }
      onCellStartEdit(entry, focus.colKey)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      tableEdit.cancelEdit()
      return
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!isColumnEditable(column, entry.row, entry.rowIndex, options.editable())) return
      event.preventDefault()
      const allowNull = isColumnNullable(column, options.allowNull())
      void onCellCommitEdit(entry, focus.colKey, allowNull ? nullToEditText() : '')
      return
    }

    // 箭头 / Home / End / Page* 由 useRsTableGridKeyboard 统一处理（全列漫游）
    if (event.key === 'Tab') {
      event.preventDefault()
      moveEditFocus(entry, focus.colKey, event.shiftKey ? 'prev' : 'next', false)
    }
  }

  function onTablePaste(event: ClipboardEvent): void {
    if (!options.editable() || !options.editPaste()) return
    if (tableEdit.editingCell.value) return
    const focus = tableEdit.focusCell.value
    if (!focus) return
    const text = event.clipboardData?.getData('text/plain')
    if (!text) return
    const grid = parseClipboardGrid(text)
    if (!grid.length) return
    event.preventDefault()

    const startEntry = findRowEntryByKey(focus.rowKey)
    if (!startEntry) return
    const rows = options.dataRows()
    const startRowPos = rows.findIndex((item) => options.rowKeyFor(item) === focus.rowKey)
    const cols = options.displayColumns()
    const startColIndex = cols.findIndex((column) => column.key === focus.colKey)
    if (startRowPos < 0 || startColIndex < 0) return

    for (let r = 0; r < grid.length; r += 1) {
      const rowEntry = rows[startRowPos + r]
      if (!rowEntry) break
      const line = grid[r] ?? []
      for (let c = 0; c < line.length; c += 1) {
        const column = cols[startColIndex + c]
        if (!column) break
        if (!isColumnEditable(column, rowEntry.row, rowEntry.rowIndex, options.editable())) continue
        void onCellCommitEdit(rowEntry, column.key, line[c] ?? '')
      }
    }
  }

  function rejectRowEdit(rowKey: string, reason?: string): void {
    const entry = findRowEntryByKey(rowKey)
    tableEdit.rollbackRow(rowKey)
    if (entry) emit.cellEditReject(entry.row, entry.rowIndex, reason)
  }

  async function onRowCommitEdit(
    entry: Extract<RsTableRowEntry<T>, { type: 'row' }>,
  ): Promise<void> {
    const rowKey = options.rowKeyFor(entry)
    const editing = tableEdit.editingCell.value
    if (editing?.rowKey === rowKey) {
      const ok = await onCellCommitEdit(entry, editing.colKey, tableEdit.editingDraft.value)
      if (!ok) return
    }
    const staged = tableEdit.commitRow(rowKey)
    if (!staged.length) return
    const changes = staged.map((item) => {
      const column = resolveColumnByKey(item.colKey)
      const allowNull = column ? isColumnNullable(column, options.allowNull()) : options.allowNull()
      const value = column
        ? parseCellEditInput(item.draft, entry.row, column, entry.rowIndex, { allowNull })
        : item.draft
      return {
        colKey: item.colKey,
        value,
        previous: item.original,
      }
    })
    emit.rowEditCommit(entry.row, entry.rowIndex, changes)
  }

  function isExternalRowPending(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    return Boolean(options.rowPending?.(entry.row, entry.rowIndex))
  }

  function onRowRollbackEdit(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): void {
    if (!options.rowCommit() && isExternalRowPending(entry)) {
      emit.rowEditRollback(entry.row, entry.rowIndex)
      return
    }
    tableEdit.rollbackRow(options.rowKeyFor(entry))
    emit.rowEditRollback(entry.row, entry.rowIndex)
  }

  function rowEditPending(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): boolean {
    if (isExternalRowPending(entry)) return true
    const rowKey = options.rowKeyFor(entry)
    return isRowEditPending(rowKey, entry.row, entry.rowIndex, {
      isRowDirty: tableEdit.isRowDirty,
      editingCell: tableEdit.editingCell.value,
      editingDraft: tableEdit.editingDraft.value,
      resolveColumn: resolveColumnByKey,
    })
  }

  function onGutterCommit(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): void {
    if (options.rowCommit()) {
      void onRowCommitEdit(entry)
      return
    }
    if (isExternalRowPending(entry)) {
      emit.rowEditCommit(entry.row, entry.rowIndex, [])
      return
    }
    const editing = tableEdit.editingCell.value
    if (editing?.rowKey !== options.rowKeyFor(entry)) return
    void onCellCommitEdit(entry, editing.colKey, tableEdit.editingDraft.value)
  }

  return {
    resolveColumnByKey,
    findRowEntryByKey,
    onCellStartEdit,
    onCellUpdateDraft,
    onCellCancelEdit,
    onCellCommitEdit,
    onCellNavigate,
    onCellClick,
    onCellDblclick,
    onEditUndo,
    onEditRedo,
    onTableKeydown,
    onTablePaste,
    rejectRowEdit,
    onRowCommitEdit,
    onRowRollbackEdit,
    isExternalRowPending,
    rowEditPending,
    onGutterCommit,
  }
}

export type RsTableEditActionsApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableEditActions<T>
>
