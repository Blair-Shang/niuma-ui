import type { VNodeChild } from 'vue'
import { isVNode } from 'vue'
import type {
  RsTableCellValueType,
  RsTableColumn,
  RsTableColumnEditorOptionsResolved,
  RsTableRowData,
} from '../table-utils'
import { getCellValue } from '../table-utils'
import { formatDateTimeValue, formatDateValue } from '../date-picker-utils'
import {
  formatIsoUtcToLocal,
  looksLikeIsoDateTimeWithTz,
  parseLocalDateTimeToUtcIso,
} from '../../lib/iso-local-datetime'

export type RsTableCellCommitTrigger = 'blur' | 'enter' | 'change' | 'manual'
export type RsTableCellEditTrigger = 'click' | 'dblclick'
export type RsTableCellEditFocusMode = 'end' | 'select' | 'start'
export type RsTableCellNavigateDirection = 'next' | 'prev' | 'up' | 'down'
export type RsTableCellEditorInputType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'textarea'

/** 编辑草稿中的显式 NULL 哨兵（与空字符串区分） */
export const RS_TABLE_NULL_DRAFT = '__rs_null__'

export function isNullDraft(text: string | undefined | null): boolean {
  return text === RS_TABLE_NULL_DRAFT
}

export function nullToEditText(): string {
  return RS_TABLE_NULL_DRAFT
}

export function resolveCellEditorInputType(
  valueType: RsTableCellValueType = 'text',
): RsTableCellEditorInputType {
  switch (valueType) {
    case 'number':
      return 'number'
    case 'date':
      return 'date'
    case 'datetime':
      return 'datetime-local'
    case 'textarea':
      return 'textarea'
    default:
      return 'text'
  }
}

export function resolveColumnValueType<T extends RsTableRowData>(
  column: RsTableColumn<T>,
): RsTableCellValueType {
  return column.valueType ?? 'text'
}

export function resolveColumnEditorOptions<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  row?: T,
  index = 0,
): RsTableColumnEditorOptionsResolved {
  const raw = column.editorOptions ?? {}
  const { options: rawOptions, ...rest } = raw
  let options: RsTableColumnEditorOptionsResolved['options']
  if (typeof rawOptions === 'function') {
    if (row != null) {
      options = rawOptions(row, index)
    } else {
      options = []
    }
  } else {
    options = rawOptions
  }
  return { ...rest, options }
}

/** 布尔列：展示态直接勾选切换，不挂载编辑器（大表友好）。 */
export function isBooleanToggleColumn<T extends RsTableRowData>(
  column: RsTableColumn<T>,
): boolean {
  return resolveColumnValueType(column) === 'boolean'
}

/** 浮层类编辑器（select/date）：点选即编辑，避免再双击。 */
export function usesOverlayEditor(valueType: RsTableCellValueType): boolean {
  return valueType === 'select' || valueType === 'date' || valueType === 'datetime'
}

export function resolveColumnEditTrigger<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  tableDefault: RsTableCellEditTrigger,
): RsTableCellEditTrigger {
  if (column.editTrigger) return column.editTrigger
  const valueType = resolveColumnValueType(column)
  if (usesOverlayEditor(valueType)) return 'click'
  return tableDefault
}

export function resolveColumnCommitOn<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  rowCommit: boolean,
): RsTableCellCommitTrigger {
  if (rowCommit) return 'manual'
  if (column.commitOn) return column.commitOn
  const valueType = resolveColumnValueType(column)
  if (valueType === 'boolean' || valueType === 'select') return 'change'
  // 日期/时间：非 rowCommit 时面板确认只写草稿，Enter/Tab 再提交（避免一点确认就写库）
  // rowCommit 走上方 manual：面板关闭即 stage，行首 ✓ 才写库
  if (valueType === 'date' || valueType === 'datetime') return 'enter'
  return 'blur'
}

/** 单元格数据值（编辑 / 复制 / 对比）；不含 `render` 展示结果。 */
export function resolveColumnRawValue<T extends RsTableRowData>(
  row: T,
  column: RsTableColumn<T>,
  _index: number,
): unknown {
  return getCellValue(row, column)
}

/** 将 `render` / 展示内容压成纯文本（tooltip、无障碍等）；VNode 取文本子节点。 */
export function plainTextFromCellDisplay(content: VNodeChild): string {
  if (content == null || content === false || content === true) return ''
  if (typeof content === 'string' || typeof content === 'number') return String(content)
  if (Array.isArray(content)) {
    return content.map((item) => plainTextFromCellDisplay(item as VNodeChild)).join('')
  }
  if (isVNode(content)) {
    return plainTextFromCellDisplay(content.children as VNodeChild)
  }
  return ''
}

/**
 * 单元格展示内容：优先 `column.render`（支持 VNode），否则 formatter / 原始值。
 * `draft` 存在时展示编辑草稿的格式化文本。
 */
export function resolveColumnDisplayContent<T extends RsTableRowData>(
  row: T,
  column: RsTableColumn<T>,
  index: number,
  options?: { draft?: string; nullLabel?: string },
): VNodeChild {
  if (options?.draft !== undefined) {
    return formatCellDisplayValue(options.draft, row, column, index, {
      nullLabel: options.nullLabel,
    })
  }
  if (column.render) {
    return column.render(row, index)
  }
  return formatCellDisplayValue(getCellValue(row, column), row, column, index, {
    nullLabel: options?.nullLabel,
  })
}

export function isColumnEditable<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  row: T,
  index: number,
  tableEditable: boolean,
): boolean {
  if (!tableEditable) return false
  if (typeof column.editable === 'function') return column.editable(row, index)
  if (column.editable === false) return false
  if (column.editable === true) return true
  return tableEditable
}

export function isColumnNullable<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  tableAllowNull: boolean,
): boolean {
  if (column.nullable === false) return false
  if (column.nullable === true) return true
  return tableAllowNull
}

export function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
  // 含 PG bool 文本 't' / 'f'
  if (['false', '0', 'no', 'n', '否', 'f', ''].includes(text)) return false
  return ['true', '1', 'yes', 'y', '是', 't', '✓', '✔', '√'].includes(text)
}

export function booleanToEditText(value: unknown): string {
  return coerceBoolean(value) ? 'true' : 'false'
}

/** 去掉千分位等展示噪音，便于 number 解析 */
export function stripNumberDecorations(input: string): string {
  return String(input ?? '').replace(/,/g, '').replace(/\s/g, '').trim()
}

export function formatCellDisplayValue<T extends RsTableRowData>(
  value: unknown,
  row: T,
  column: RsTableColumn<T>,
  index: number,
  options?: { nullLabel?: string },
): string {
  if (column.formatter) return column.formatter(value, row, index)
  if (value === null || value === undefined) {
    return options?.nullLabel ?? '(NULL)'
  }
  if (isNullDraft(String(value))) return options?.nullLabel ?? '(NULL)'
  const valueType = resolveColumnValueType(column)
  if (valueType === 'boolean') {
    return coerceBoolean(value) ? '✓' : ''
  }
  // 与编辑态一致：带时区 ISO → 本地；其余 date/datetime 规范格式
  if (valueType === 'date') {
    const raw = String(value)
    const local = formatIsoUtcToLocal(raw)
    if (local) return local.slice(0, 10)
    return formatDateValue(raw) || raw
  }
  if (valueType === 'datetime') {
    const raw = String(value)
    const local = formatIsoUtcToLocal(raw)
    if (local) return local
    return formatDateTimeValue(raw) || raw
  }
  if (typeof value === 'string') {
    const local = formatIsoUtcToLocal(value)
    if (local) return local
  }
  return cellValueToText(value)
}

/** 单元格值 → 纯文本（对象用 JSON，避免 `[object Object]`）。 */
export function cellValueToText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }
  return String(value)
}

export function resolveCellEditText<T extends RsTableRowData>(
  row: T,
  column: RsTableColumn<T>,
  index: number,
  draft?: string,
): string {
  if (draft !== undefined) return draft
  const raw = resolveColumnRawValue(row, column, index)
  if (raw === null || raw === undefined) return RS_TABLE_NULL_DRAFT
  const valueType = resolveColumnValueType(column)
  if (valueType === 'boolean') return booleanToEditText(raw)
  // 带时区 ISO → 本地墙钟（含毫秒），与展示一致，便于写回还原
  if (typeof raw === 'string') {
    const local = formatIsoUtcToLocal(raw)
    if (local) {
      if (valueType === 'date') return local.slice(0, 10)
      return local
    }
  }
  // 日期/日期时间：规范为选择器可解析格式，保证弹层选中态与双向绑定一致
  if (valueType === 'date') {
    return formatDateValue(String(raw)) || String(raw)
  }
  if (valueType === 'datetime') {
    return formatDateTimeValue(String(raw)) || String(raw)
  }
  if (column.formatter) {
    return cellValueToText(raw)
  }
  // 行数据 → 编辑草稿：number 列等在此转为文本（草稿协议为 string）
  return cellValueToText(raw)
}

export function parseCellEditInput<T extends RsTableRowData>(
  input: string,
  row: T,
  column: RsTableColumn<T>,
  index: number,
  options?: { allowNull?: boolean },
): unknown {
  if (isNullDraft(input)) return null
  const allowNull = options?.allowNull ?? isColumnNullable(column, true)
  if (column.emptyAsNull && allowNull && input.trim() === '') return null
  if (column.parser) return column.parser(input, row, index)
  const valueType = resolveColumnValueType(column)
  if (valueType === 'boolean') return coerceBoolean(input)
  if (valueType === 'number') {
    const cleaned = stripNumberDecorations(input)
    if (!cleaned) return allowNull ? null : ''
    const parsed = Number(cleaned)
    return Number.isNaN(parsed) ? input : parsed
  }

  const trimmed = input.trim()
  const previous = resolveColumnRawValue(row, column, index)
  // 原值是带时区 ISO：本地草稿写回 UTC，未改秒则保留原始毫秒/更长小数
  if (typeof previous === 'string' && looksLikeIsoDateTimeWithTz(previous.trim())) {
    if (!trimmed) return allowNull ? null : ''
    const utc = parseLocalDateTimeToUtcIso(trimmed, previous)
    if (utc) return utc
  }

  if (valueType === 'datetime' && column.editorOptions?.timezone === 'utc') {
    if (!trimmed) return allowNull ? null : ''
    const utc = parseLocalDateTimeToUtcIso(trimmed)
    if (utc) return utc
    if (/Z$/i.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) return trimmed
    return `${trimmed.replace(' ', 'T')}Z`
  }
  return input
}

export function validateCellValue<T extends RsTableRowData>(
  value: unknown,
  row: T,
  column: RsTableColumn<T>,
  index: number,
): string | null {
  if (!column.validator) return null
  const result = column.validator(value, row, index)
  if (result instanceof Promise) {
    // 同步路径：异步 validator 请用 validateCellValueAsync
    return null
  }
  return result
}

export async function validateCellValueAsync<T extends RsTableRowData>(
  value: unknown,
  row: T,
  column: RsTableColumn<T>,
  index: number,
): Promise<string | null> {
  if (!column.validator) return null
  return column.validator(value, row, index)
}

export function isAsyncValidator<T extends RsTableRowData>(column: RsTableColumn<T>): boolean {
  // 运行期无法静态判定；提交时若返回 Promise 即按异步处理
  return typeof column.validator === 'function'
}

/** 多行同列批量填充目标 */
export function listBatchColumnTargets<T extends RsTableRowData>(options: {
  rows: Array<{ row: T; rowIndex: number; rowKey: string }>
  column: RsTableColumn<T>
  tableEditable: boolean
  selectedKeys: string[]
  anchorRowKey: string
}): Array<{ row: T; rowIndex: number; rowKey: string }> {
  const selected = new Set(options.selectedKeys)
  if (selected.size <= 1 || !selected.has(options.anchorRowKey)) {
    const anchor = options.rows.find((item) => item.rowKey === options.anchorRowKey)
    return anchor ? [anchor] : []
  }
  return options.rows.filter(
    (item) =>
      selected.has(item.rowKey) &&
      isColumnEditable(options.column, item.row, item.rowIndex, options.tableEditable),
  )
}

export function isCellValueChanged(previous: unknown, next: unknown): boolean {
  if (previous === next) return false
  if (previous == null && next == null) return false
  if (typeof previous === 'boolean' || typeof next === 'boolean') {
    return coerceBoolean(previous) !== coerceBoolean(next)
  }
  return cellValueToText(previous) !== cellValueToText(next)
}

export function isRowEditPending<T extends RsTableRowData>(
  rowKey: string,
  row: T,
  rowIndex: number,
  options: {
    isRowDirty: (rowKey: string) => boolean
    editingCell: { rowKey: string; colKey: string } | null
    editingDraft: string
    resolveColumn: (colKey: string) => RsTableColumn<T> | undefined
  },
): boolean {
  if (options.isRowDirty(rowKey)) return true
  const editing = options.editingCell
  if (!editing || editing.rowKey !== rowKey) return false
  const column = options.resolveColumn(editing.colKey)
  if (!column) return false
  const baseline = resolveCellEditText(row, column, rowIndex)
  return isCellValueChanged(baseline, options.editingDraft)
}

export interface RsTableEditableCellRef {
  rowKey: string
  colKey: string
  rowIndex: number
}

/** 按显示列顺序收集可编辑单元格（用于 Tab / 方向键） */
export function listEditableCells<T extends RsTableRowData>(options: {
  rows: T[]
  columns: RsTableColumn<T>[]
  tableEditable: boolean
  rowKeyOf: (row: T, index: number) => string
  skipBooleanToggle?: boolean
}): RsTableEditableCellRef[] {
  const result: RsTableEditableCellRef[] = []
  for (let rowIndex = 0; rowIndex < options.rows.length; rowIndex += 1) {
    const row = options.rows[rowIndex]!
    const rowKey = options.rowKeyOf(row, rowIndex)
    for (const column of options.columns) {
      if (!isColumnEditable(column, row, rowIndex, options.tableEditable)) continue
      if (options.skipBooleanToggle && isBooleanToggleColumn(column)) continue
      result.push({ rowKey, colKey: column.key, rowIndex })
    }
  }
  return result
}

export function findEditableCellIndex(
  cells: RsTableEditableCellRef[],
  rowKey: string,
  colKey: string,
): number {
  return cells.findIndex((cell) => cell.rowKey === rowKey && cell.colKey === colKey)
}

export function navigateEditableCell(
  cells: RsTableEditableCellRef[],
  rowKey: string,
  colKey: string,
  direction: RsTableCellNavigateDirection,
  columnsPerRow: number,
): RsTableEditableCellRef | null {
  if (!cells.length || columnsPerRow <= 0) return null
  const index = findEditableCellIndex(cells, rowKey, colKey)
  if (index < 0) return cells[0] ?? null
  if (direction === 'next') return cells[(index + 1) % cells.length] ?? null
  if (direction === 'prev') return cells[(index - 1 + cells.length) % cells.length] ?? null

  const current = cells[index]!
  const colKeys = [...new Set(cells.map((cell) => cell.colKey))]
  const colPos = colKeys.indexOf(current.colKey)
  const rowDelta = direction === 'down' ? 1 : -1
  const targetRow = current.rowIndex + rowDelta
  const sameCol = cells.find((cell) => cell.rowIndex === targetRow && cell.colKey === current.colKey)
  if (sameCol) return sameCol
  // 回退：同列最近的可编辑格
  const candidates = cells.filter((cell) => cell.colKey === current.colKey)
  if (!candidates.length) return null
  if (direction === 'down') {
    return candidates.find((cell) => cell.rowIndex > current.rowIndex) ?? candidates[0] ?? null
  }
  const prev = [...candidates].reverse().find((cell) => cell.rowIndex < current.rowIndex)
  return prev ?? candidates[candidates.length - 1] ?? null
}

/** 解析剪贴板 TSV/CSV（制表符优先） */
export function parseClipboardGrid(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines.map((line) => line.split('\t'))
}

export function applyFocusMode(
  input: HTMLInputElement | HTMLTextAreaElement,
  mode: RsTableCellEditFocusMode,
): void {
  const end = input.value.length
  if (mode === 'select') {
    input.select()
    return
  }
  if (mode === 'start') {
    input.setSelectionRange(0, 0)
    return
  }
  input.setSelectionRange(end, end)
}
