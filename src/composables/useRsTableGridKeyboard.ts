/**
 * RsTable ARIA Grid 键盘漫游（与编辑键盘解耦）。
 *
 * - 始终可在壳层焦点下移动 focusCell（只读表也可用）
 * - 编辑中 / 表单控件内不抢键
 * - 箭头 / Home / End / Ctrl+Home|End / PageUp|PageDown
 * - 移动后将焦点格 scrollIntoView（nearest）
 */

import { nextTick, type Ref } from 'vue'
import type { useTableEdit } from './useTableEdit'
import {
  navigateGridCell,
  resolveGridNavDirection,
  type RsTableGridCellRef,
} from '../components/table/rs-table-grid-nav'
import type { RsTableColumn, RsTableRowData, RsTableRowEntry } from '../components/table-utils'

type TableEditApi = ReturnType<typeof useTableEdit>

export interface UseRsTableGridKeyboardOptions<T extends RsTableRowData> {
  tableEdit: TableEditApi
  /** 默认 true；可关以兼容旧行为 */
  enabled?: () => boolean
  dataRows: () => Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>
  rowKeyFor: (entry: Extract<RsTableRowEntry<T>, { type: 'row' }>) => string
  /** 可见数据列（与虚拟列切片一致） */
  colKeys: () => string[]
  displayColumns?: () => RsTableColumn<T>[]
  applyRowClickHighlight: (rowKey: string) => void
  /** PageUp/Down 跨越行数，默认 10 */
  pageSize?: () => number
  /** 滚动容器：用于焦点格滚入视口 */
  scrollContainerRef?: Ref<HTMLElement | null | undefined>
}

function escapeAttr(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function scrollFocusCellIntoView(
  container: HTMLElement | null | undefined,
  cell: RsTableGridCellRef,
): void {
  if (!container) return
  const selector = `tr[data-row-key="${escapeAttr(cell.rowKey)}"] td[data-col-key="${escapeAttr(cell.colKey)}"]`
  const el = container.querySelector(selector) as HTMLElement | null
  // jsdom 无 scrollIntoView；浏览器 / happy-dom 才滚
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

/**
 * 网格键盘漫游 API。
 */
export function useRsTableGridKeyboard<T extends RsTableRowData>(
  options: UseRsTableGridKeyboardOptions<T>,
) {
  function buildRows(): Array<{ rowKey: string; rowIndex: number }> {
    return options.dataRows().map((entry) => ({
      rowKey: options.rowKeyFor(entry),
      rowIndex: entry.rowIndex,
    }))
  }

  function resolveColKeys(): string[] {
    const keys = options.colKeys()
    if (keys.length) return keys
    return (options.displayColumns?.() ?? []).map((c) => c.key)
  }

  /**
   * 处理网格导航键。已处理返回 true（调用方应停止后续编辑键逻辑中的箭头分支）。
   */
  function onGridKeydown(event: KeyboardEvent): boolean {
    if (options.enabled && !options.enabled()) return false
    if (options.tableEdit.editingCell.value) return false

    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      return false
    }

    const direction = resolveGridNavDirection(event)
    if (!direction) return false

    const rows = buildRows()
    const colKeys = resolveColKeys()
    if (!rows.length || !colKeys.length) return false

    const focus = options.tableEdit.focusCell.value
    const current: RsTableGridCellRef | null = focus
      ? {
          rowKey: focus.rowKey,
          colKey: focus.colKey,
          rowIndex: focus.rowIndex,
        }
      : null

    const next = navigateGridCell(
      rows,
      colKeys,
      current,
      direction,
      options.pageSize?.() ?? 10,
    )
    if (!next) return false

    event.preventDefault()
    options.tableEdit.setFocusCell(next)
    options.applyRowClickHighlight(next.rowKey)
    void nextTick(() => {
      scrollFocusCellIntoView(options.scrollContainerRef?.value, next)
    })
    return true
  }

  return { onGridKeydown }
}
