/**
 * RsTable 右键菜单：上下文状态、默认复制项、捕获阶段预填。
 *
 * 选择联动（右键选中行）通过回调注入，避免 composable 直接持有 Engine。
 */

import { ref, watch, type ComputedRef, type Ref } from 'vue'
import type { RsContextMenuItem } from '../components/context-menu-utils'
import {
  buildDefaultTableContextMenuItems,
  resolveTableCellCopyText,
  resolveTableRowCopyText,
  TABLE_CTX_COPY_CELL,
  TABLE_CTX_COPY_ROW,
} from '../components/table/table-context-menu'
import { copyTextToClipboard } from '../utils/rs-clipboard'
import {
  resolveRowKey,
  type RsTableColumn,
  type RsTableRowData,
  type RsTableRowEntry,
  type RsTableRowKey,
  type RsTableSelectionType,
} from '../components/table-utils'

function read<T>(source: ComputedRef<T> | (() => T) | Ref<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

export interface UseRsTableContextMenuOptions<T extends RsTableRowData> {
  enabled: ComputedRef<boolean> | (() => boolean)
  dataRows: ComputedRef<Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>> | (() => Array<Extract<RsTableRowEntry<T>, { type: 'row' }>>)
  displayColumns: ComputedRef<RsTableColumn<T>[]> | (() => RsTableColumn<T>[])
  selectedRows: ComputedRef<T[]> | (() => T[])
  rowKey: ComputedRef<RsTableRowKey<T> | undefined> | (() => RsTableRowKey<T> | undefined)
  rowKeyByIndex: ComputedRef<Map<number, string>> | (() => Map<number, string>)
  copyCellLabel: ComputedRef<string> | (() => string)
  copyRowLabel: ComputedRef<string> | (() => string)
  contextMenuItems?: (
    row: T | null,
    selectedRows: T[],
  ) => RsContextMenuItem[]
  /**
   * Feature 贡献合并：在 props 自定义项之后调用。
   * 入参为已含默认复制 + 业务自定义的列表，应返回最终列表。
   */
  mergeFeatureMenuItems?: (
    items: RsContextMenuItem[],
    ctx: { row: T | null; selectedRows: T[] },
  ) => RsContextMenuItem[]
  /** 右键时是否选中该行 */
  shouldSelectOnContextmenu: () => boolean
  canSelectRow: (entry: Extract<RsTableRowEntry<T>, { type: 'row' }>) => boolean
  isRowSelected: (entry: Extract<RsTableRowEntry<T>, { type: 'row' }>) => boolean
  selectionType: () => RsTableSelectionType
  getSelectedRowKeys: () => string[]
  setSelectedRowKeys: (keys: string[]) => void
  selectRowKeys: (
    current: string[],
    key: string,
    type: RsTableSelectionType,
  ) => string[]
  getDraft: (rowKey: string, colKey: string) => string | undefined
  onSelect: (key: string, row: T | null, selected: T[]) => void
  onRowContextmenu: (row: T, rowIndex: number, event: MouseEvent) => void
}

/**
 * 表格右键菜单状态与交互。
 */
export function useRsTableContextMenu<T extends RsTableRowData>(
  options: UseRsTableContextMenuOptions<T>,
) {
  /** 当前右键行（null = 表体空白或尚未命中） */
  const ctxRow = ref<T | null>(null) as Ref<T | null>
  const ctxRowIndex = ref<number | null>(null)
  /** 右键命中的数据列 key */
  const ctxColKey = ref<string | null>(null)
  const ctxMenuItems = ref<RsContextMenuItem[]>([])

  function rowKeyFor(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): string {
    return (
      read(options.rowKeyByIndex).get(entry.rowIndex) ??
      entry.treeKey ??
      resolveRowKey(entry.row, entry.rowIndex, read(options.rowKey))
    )
  }

  /**
   * 重建菜单项：默认复制 + 业务自定义。
   * 有数据时预置复制项，避免 Trigger 打开瞬间 items 为空拒开。
   */
  function refreshCtxMenuItems(): void {
    if (!read(options.enabled)) {
      ctxMenuItems.value = []
      return
    }
    const hasDataRows = read(options.dataRows).length > 0
    const items = buildDefaultTableContextMenuItems({
      copyCellLabel: read(options.copyCellLabel),
      copyRowLabel: read(options.copyRowLabel),
      hasRow: ctxRow.value != null || hasDataRows,
      hasCell: ctxColKey.value != null || hasDataRows,
    })
    const selected = read(options.selectedRows)
    const custom =
      options.contextMenuItems?.(ctxRow.value as T | null, selected) ?? []
    if (custom.length > 0) {
      if (items.length > 0) {
        items.push({ key: '__ctx-sep', label: '', separator: true })
      }
      items.push(...custom)
    }
    const menuCtx = { row: ctxRow.value as T | null, selectedRows: selected }
    ctxMenuItems.value = options.mergeFeatureMenuItems
      ? options.mergeFeatureMenuItems(items, menuCtx)
      : items
  }

  watch(
    () => [read(options.enabled), read(options.dataRows).length] as const,
    () => {
      refreshCtxMenuItems()
    },
    { immediate: true },
  )

  async function copyCtxCell(): Promise<void> {
    if (!ctxRow.value || ctxRowIndex.value == null || !ctxColKey.value) return
    const column = read(options.displayColumns).find((item) => item.key === ctxColKey.value)
    if (!column) return
    const key = resolveRowKey(ctxRow.value, ctxRowIndex.value, read(options.rowKey))
    const text = resolveTableCellCopyText(
      ctxRow.value,
      column,
      ctxRowIndex.value,
      options.getDraft(key, column.key),
    )
    await copyTextToClipboard(text)
  }

  async function copyCtxRow(): Promise<void> {
    if (!ctxRow.value || ctxRowIndex.value == null) return
    const key = resolveRowKey(ctxRow.value, ctxRowIndex.value, read(options.rowKey))
    const text = resolveTableRowCopyText(
      ctxRow.value,
      ctxRowIndex.value,
      read(options.displayColumns),
      options.getDraft,
      key,
    )
    await copyTextToClipboard(text)
  }

  async function onCtxMenuSelect(key: string): Promise<void> {
    if (key === TABLE_CTX_COPY_CELL) {
      await copyCtxCell()
      options.onSelect(key, ctxRow.value as T | null, read(options.selectedRows))
      return
    }
    if (key === TABLE_CTX_COPY_ROW) {
      await copyCtxRow()
      options.onSelect(key, ctxRow.value as T | null, read(options.selectedRows))
      return
    }
    options.onSelect(key, ctxRow.value as T | null, read(options.selectedRows))
  }

  function prepareRowContextmenu(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): void {
    if (
      options.shouldSelectOnContextmenu() &&
      options.canSelectRow(entry) &&
      !options.isRowSelected(entry)
    ) {
      options.setSelectedRowKeys(
        options.selectRowKeys(
          options.getSelectedRowKeys(),
          rowKeyFor(entry),
          options.selectionType(),
        ),
      )
    }
    if (read(options.enabled)) {
      ctxRow.value = entry.row
      ctxRowIndex.value = entry.rowIndex
    }
  }

  /**
   * 捕获阶段预填：须早于 ContextMenuTrigger 冒泡打开。
   */
  function onContextmenuCapture(event: MouseEvent): void {
    if (!read(options.enabled)) return
    const target = event.target as HTMLElement | null
    if (!target) return
    const tr = target.closest('tr.rs-table__row') as HTMLElement | null
    if (!tr) return
    const rowKeyAttr = tr.getAttribute('data-row-key')
    if (!rowKeyAttr) return
    const entry = read(options.dataRows).find(
      (item) => (item.treeKey ?? read(options.rowKeyByIndex).get(item.rowIndex) ?? '') === rowKeyAttr,
    )
    if (!entry) return
    prepareRowContextmenu(entry)
    const td = target.closest('td.rs-table__td--data') as HTMLElement | null
    const colKey = td?.getAttribute('data-col-key')
    ctxColKey.value = colKey || null
    refreshCtxMenuItems()
  }

  function onTableContextmenu(event: MouseEvent): void {
    if (!read(options.enabled)) return
    const tr = (event.target as HTMLElement).closest('tr.rs-table__row')
    if (!tr) {
      ctxRow.value = null
      ctxRowIndex.value = null
      ctxColKey.value = null
      refreshCtxMenuItems()
    }
  }

  function onRowContextmenu(entry: RsTableRowEntry<T>, event: MouseEvent): void {
    if (entry.type !== 'row') return
    if ((event.target as HTMLElement).closest('.rs-table__td--data')) return
    prepareRowContextmenu(entry)
    ctxColKey.value = null
    refreshCtxMenuItems()
    options.onRowContextmenu(entry.row, entry.rowIndex, event)
  }

  function onCellContextmenu(entry: RsTableRowEntry<T>, colKey: string, event: MouseEvent): void {
    if (entry.type !== 'row') return
    prepareRowContextmenu(entry)
    ctxColKey.value = colKey
    refreshCtxMenuItems()
    options.onRowContextmenu(entry.row, entry.rowIndex, event)
  }

  return {
    ctxRow,
    ctxRowIndex,
    ctxColKey,
    ctxMenuItems,
    refreshCtxMenuItems,
    onCtxMenuSelect,
    onContextmenuCapture,
    onTableContextmenu,
    onRowContextmenu,
    onCellContextmenu,
    rowKeyFor,
  }
}

export type RsTableContextMenuApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableContextMenu<T>
>
