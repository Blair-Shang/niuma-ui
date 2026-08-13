/**
 * RsTable 视图上下文（provide/inject）。
 *
 * 多表隔离（关键）：
 * - 每个 RsTable 实例在自身 setup 内 provide，子树 inject 最近祖先
 * - 同页多表互不影响：A 的 Header/Body 不会读到 B 的 view
 * - 禁止把 view 存到模块级单例；instanceId 仅用于诊断
 *
 * 对比：RsTableModuleRegistry 是进程级全局（同 AG Grid ModuleRegistry），
 * 会作用于所有实例；实例专属能力请用 props.features。
 */

import { inject, provide, type InjectionKey } from 'vue'
import type { CSSProperties } from 'vue'
import type {
  RsTableColumn,
  RsTableRowData,
  RsTableRowDropPosition,
  RsTableRowEntry,
  RsTableRowKey,
  RsTableSelectionType,
} from '../table-utils'
import type {
  RsTableCellEditFocusMode,
  RsTableCellEditTrigger,
  RsTableCellNavigateDirection,
} from './table-edit-utils'

/** 每实例递增，仅诊断用，不参与业务逻辑 */
let viewInstanceSeq = 0

export const RS_TABLE_VIEW_KEY: InjectionKey<RsTableViewContext> = Symbol('rsTableView')

/** 视图层内联样式（Vue CSSProperties 或普通字符串字典） */
export type RsTableViewStyle = CSSProperties | Record<string, string> | undefined

export type RsTableHeaderLabels = {
  selectAll: string
  index: string
  rowStatus: string
  dragColumn: string
  filterColumn: string
  filterPlaceholder: string
  filterClear: string
  filterApply: string
}

export type RsTableBodyLabels = {
  loading: string
  empty: string
  loadingMore: string
  dragRow: string
  expandRow: string
  collapseRow: string
  selectRow: string
  rowCommit: string
  rowRollback: string
  gutterCommit: string
}

type RowEntry<T extends RsTableRowData> = Extract<RsTableRowEntry<T>, { type: 'row' }>

/**
 * 视图只读状态 + 事件处理。
 * 状态字段经 getter 暴露，子组件 render 访问时收集依赖；多表各自刷新、互不串扰。
 */
export interface RsTableViewContext<T extends RsTableRowData = RsTableRowData> {
  readonly instanceId: string

  readonly useFixedColumnLayout: boolean
  readonly showRowDragHandle: boolean
  readonly detailExpandable: boolean
  readonly showSelectColumn: boolean
  readonly showEditGutterColumn: boolean
  readonly showIndexColumn: boolean
  readonly showRowStatusColumn: boolean
  readonly columnPadLeft: number
  readonly columnPadRight: number
  readonly visibleDataColumns: RsTableColumn<T>[]
  readonly prefixWidths: { drag: number; expand: number; select: number; status: number }
  readonly resolvedGutterWidth: number
  readonly resolvedIndexWidth: number
  resolvedDataColumnWidth: (key: string, fallback?: number | string) => number

  readonly isRadioSelection: boolean
  readonly selectAllState: 'checked' | 'indeterminate' | 'unchecked'
  readonly columnDraggable: boolean
  readonly resizable: boolean
  readonly multiSort: boolean
  readonly columnFiltersState: Record<string, string>
  readonly dragColumnKey: string | null
  readonly dropColumnKey: string | null
  readonly dragLeadHeaderStyle: RsTableViewStyle
  readonly expandLeadHeaderStyle: RsTableViewStyle
  readonly selectLeadHeaderStyle: RsTableViewStyle
  readonly gutterLeadHeaderStyle: RsTableViewStyle
  readonly indexLeadHeaderStyle: RsTableViewStyle
  readonly columnHeaderStyleMap: Map<string, Record<string, string> | undefined>
  readonly headerLabels: RsTableHeaderLabels
  columnFilterValue: (key: string) => string
  isColumnFilterActive: (filters: Record<string, string>, key: string) => boolean
  sortOrderFor: (key: string) => string | null | undefined
  sortPriorityFor: (key: string) => number
  sortIconName: (key: string) => string
  onToggleSelectAll: () => void
  onColumnDragOver: (key: string, event: DragEvent) => void
  onColumnDrop: (key: string, event: DragEvent) => void
  onColumnDragStart: (key: string, event: DragEvent) => void
  onColumnDragEnd: () => void
  updateColumnFilter: (key: string, value: string) => void
  onHeaderClick: (column: RsTableColumn<T>) => void
  onResizeStart: (key: string, event: MouseEvent) => void
  onHeaderPointerOver: (event: PointerEvent) => void
  onHeaderPointerOut: (event: PointerEvent) => void

  readonly loading: boolean
  readonly hasData: boolean
  readonly loadingMore: boolean
  readonly infinite: boolean
  readonly bodyColspan: number
  readonly emptyContentStyle: RsTableViewStyle
  readonly virtualScrollEnabled: boolean
  readonly virtualSlice: { paddingTop: number; paddingBottom: number }
  readonly visibleEntries: RsTableRowEntry<T>[]
  readonly rowKey: RsTableRowKey<T> | undefined
  readonly treeMode: boolean
  readonly treeIndentPx: number
  readonly treeExpandColumnKey: string | null
  readonly treeLoadingKeySet: Set<string>
  readonly striped: boolean
  readonly selectionType: RsTableSelectionType
  readonly editable: boolean
  readonly editTrigger: RsTableCellEditTrigger
  readonly rowCommit: boolean
  readonly allowNull: boolean
  readonly editFocusMode: RsTableCellEditFocusMode
  readonly nullLabel: string
  readonly dragLeadStyle: Record<string, string>
  readonly expandLeadStyle: Record<string, string>
  readonly selectLeadStyle: Record<string, string>
  readonly indexLeadStyle: Record<string, string>
  readonly gutterLeadStyle: Record<string, string>
  readonly columnTdClassMap: Map<string, string[]>
  readonly columnStyleMap: Map<string, Record<string, string> | undefined>
  readonly dragRowKeys: string[]
  readonly dropRowTargetKey: string | null
  readonly dropRowPosition: RsTableRowDropPosition | null
  readonly activeEditCellKey: string
  readonly activeFocusCellKey: string
  readonly activeErrorMapSize: number
  readonly activeValidatingMapSize: number
  readonly stagedMapSize: number
  readonly editingDraft: string
  readonly editingCell: { rowKey: string; colKey: string } | null
  readonly focusCell: { rowKey: string; colKey: string } | null
  readonly bodyLabels: RsTableBodyLabels
  rowKeyFor: (entry: RowEntry<T>) => string
  isRowSelected: (entry: RowEntry<T>) => boolean
  isRowIndeterminate: (entry: RowEntry<T>) => boolean
  isRowExpanded: (entry: RowEntry<T>) => boolean
  isHighlighted: (rowKey: string) => boolean
  rowEditPending: (entry: RowEntry<T>) => boolean
  isExternalRowPending: (entry: RowEntry<T>) => boolean
  treeDepthOf: (entry: RowEntry<T>) => number
  canExpandRow: (entry: RowEntry<T>) => boolean
  canSelectRow: (entry: RowEntry<T>) => boolean
  isRowDragByRow: (entry: RowEntry<T>) => boolean
  isRowDragging: (entry: RowEntry<T>) => boolean
  isRowDropTarget: (entry: RowEntry<T>) => boolean
  isRowDirty: (rowKey: string) => boolean
  hasColumnSlot: (key: string) => boolean
  hasEditSlot: (key: string) => boolean
  cellTooltipEnabled: (column: RsTableColumn<T>, rowIndex: number) => boolean
  cellTooltipMode: (column: RsTableColumn<T>, rowIndex: number) => string | undefined
  cellTooltipText: (column: RsTableColumn<T>, row: T, rowIndex: number) => string | undefined
  cellTooltipFallbackTitle: (column: RsTableColumn<T>, row: T, rowIndex: number) => string | undefined
  getCellDraft: (rowKey: string, colKey: string) => string | undefined
  isCellDirty: (rowKey: string, colKey: string) => boolean
  getCellError: (rowKey: string, colKey: string) => string | undefined
  isCellValidating: (rowKey: string, colKey: string) => boolean
  onBodyPointerOver: (event: PointerEvent) => void
  onBodyPointerOut: (event: PointerEvent) => void
  onRowClick: (entry: RowEntry<T>, event: MouseEvent) => void
  onRowSelectMouseDown: (event: MouseEvent) => void
  onCellClick: (entry: RowEntry<T>, colKey: string, event: MouseEvent) => void
  onCellDblclick: (entry: RowEntry<T>, colKey: string, event: MouseEvent) => void
  onCellContextmenu: (entry: RowEntry<T>, colKey: string, event: MouseEvent) => void
  onRowDblclick: (entry: RowEntry<T>, event: MouseEvent) => void
  onRowContextmenu: (entry: RowEntry<T>, event: MouseEvent) => void
  onRowDragOver: (entry: RowEntry<T>, event: DragEvent) => void
  onRowDragLeave: (event: DragEvent) => void
  onRowDrop: (entry: RowEntry<T>, event: DragEvent) => void
  onRowDragStart: (entry: RowEntry<T>, event: DragEvent) => void
  onRowDragEnd: () => void
  onToggleExpand: (entry: RowEntry<T>) => void
  onToggleSelect: (entry: RowEntry<T>) => void
  onCellStartEdit: (entry: RowEntry<T>, colKey: string) => void
  onCellCommit: (entry: RowEntry<T>, colKey: string, value: string) => void
  onCellCancel: (entry: RowEntry<T>, colKey: string) => void
  onCellUpdateDraft: (entry: RowEntry<T>, colKey: string, value: string) => void
  onCellNavigate: (
    entry: RowEntry<T>,
    colKey: string,
    direction: RsTableCellNavigateDirection,
  ) => void
  onRowCommit: (entry: RowEntry<T>) => void
  onRowRollback: (entry: RowEntry<T>) => void
  onGutterCommit: (entry: RowEntry<T>) => void
}

/**
 * 显式区分 state getters 与 handlers，避免把零参 handler 误当成状态 getter。
 */
export function createRsTableViewContext<T extends RsTableRowData>(parts: {
  state: { [K in keyof RsTableViewContext<T>]?: () => RsTableViewContext<T>[K] }
  handlers: { [K in keyof RsTableViewContext<T>]?: RsTableViewContext<T>[K] }
}): RsTableViewContext<T> {
  const instanceId = `rs-table-view-${++viewInstanceSeq}`
  const ctx: Record<string, unknown> = { instanceId }
  for (const [key, getter] of Object.entries(parts.state)) {
    if (!getter) continue
    Object.defineProperty(ctx, key, {
      enumerable: true,
      configurable: true,
      get: getter as () => unknown,
    })
  }
  for (const [key, fn] of Object.entries(parts.handlers)) {
    if (fn !== undefined) ctx[key] = fn
  }
  return ctx as unknown as RsTableViewContext<T>
}

/** 在 RsTable 内 provide（每个实例调用一次） */
export function provideRsTableView<T extends RsTableRowData>(ctx: RsTableViewContext<T>): void {
  // 与 useRsTableView 对称：泛型 T 与默认 object 行类型在函数/数组位不重叠，经 unknown 擦除
  provide(RS_TABLE_VIEW_KEY, ctx as unknown as RsTableViewContext)
}

/**
 * 子视图 inject；必须在某个 RsTable 子树内。
 * 多表场景下自动绑定到最近的表格实例。
 */
export function useRsTableView<T extends RsTableRowData = RsTableRowData>(): RsTableViewContext<T> {
  const ctx = inject(RS_TABLE_VIEW_KEY, null)
  if (!ctx) {
    throw new Error(
      '[RsTable] useRsTableView() 必须在 RsTable 子树内调用（每表独立 provide，多表互不串扰）',
    )
  }
  // InjectionKey 无泛型实参；经 unknown 收窄到调用方 T（实例隔离由 provide 树保证）
  return ctx as unknown as RsTableViewContext<T>
}

/** 测试用：重置 instance 序号 */
export function resetRsTableViewInstanceSeqForTest(): void {
  viewInstanceSeq = 0
}
