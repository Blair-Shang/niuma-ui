/**
 * RsTable 公开 props / emits / 默认值（从 SFC 抽出，削薄编排层）。
 */

import type { RsContextMenuItem } from '../context-menu-utils'
import type {
  RsTableColumn,
  RsTableGroupBy,
  RsTableRowData,
  RsTableRowDropPosition,
  RsTableRowKey,
  RsTableSelectionType,
  RsTableSize,
  RsTableSortState,
  RsTableTreeConfig,
} from '../table-utils'
import type { RsTableRowDragTrigger, RsTableRowDropMode } from '../table-drag'
import type { RsTableCellEditFocusMode } from './table-edit-utils'
import type { RsTableFeature } from './table-features'
import type { RsTableSummaryData, RsTableSummaryMode } from './table-summary-utils'

/** RsTable 组件 props */
export interface RsTableProps<T extends RsTableRowData = RsTableRowData> {
  columns: RsTableColumn<T>[]
  data: T[]
  rowKey?: RsTableRowKey<T>
  loading?: boolean
  bordered?: boolean
  columnBordered?: boolean
  /** 外容器圆角；嵌套在已有圆角/直角父级时可设为 false */
  rounded?: boolean
  /** 填充父级高度：表格自身成为受限滚动容器 */
  fill?: boolean
  compact?: boolean
  size?: RsTableSize
  scrollX?: number | string
  selectable?: boolean
  selectionType?: RsTableSelectionType
  selectedRowKeys?: string[]
  defaultSelectedRowKeys?: string[]
  rowSelectable?: (row: T, index: number) => boolean
  expandable?: boolean
  expandedRowKeys?: string[]
  defaultExpandedRowKeys?: string[]
  rowExpandable?: (row: T, index: number) => boolean
  expandRowHeight?: number
  /**
   * 树形表格：按 children 展平可见行，在指定列缩进展开。
   * 与 `expandable`（明细行）/ `groupBy` 互斥。
   */
  treeConfig?: RsTableTreeConfig<T>
  striped?: boolean
  showIndex?: boolean
  /** 行号列宽度（px，showIndex 且未显示 edit gutter 时生效） */
  indexWidth?: number
  showHeader?: boolean
  remoteSort?: boolean
  filterText?: string
  filterKeys?: string[]
  columnFilters?: Record<string, string>
  defaultColumnFilters?: Record<string, string>
  groupBy?: RsTableGroupBy<T>
  groupLabel?: (key: string) => string
  sort?: RsTableSortState | null
  defaultSort?: RsTableSortState | null
  multiSort?: boolean
  maxSort?: number
  sorts?: RsTableSortState[]
  defaultSorts?: RsTableSortState[]
  columnDraggable?: boolean
  columnOrder?: string[]
  defaultColumnOrder?: string[]
  rowDraggable?: boolean
  rowDragTrigger?: RsTableRowDragTrigger
  rowDropMode?: RsTableRowDropMode
  rowDraggableWhen?: (row: T, index: number) => boolean
  rowDropTargetWhen?: (row: T, index: number) => boolean
  canRowDrop?: (dragKeys: string[], dropKey: string) => boolean
  virtual?: boolean
  /** fill 模式下数据行数达到该阈值时自动启用虚拟滚动；0 表示禁用自动启用 */
  virtualAutoThreshold?: number
  /**
   * 列虚拟化：仅渲染横向可视区附近的数据列。
   * true 强制开；false 强制关；默认 `'auto'` 由 virtualColumnsAutoThreshold 判定。
   */
  virtualColumns?: boolean | 'auto'
  /** 数据列数达到该阈值时自动列虚拟化；0 表示禁用自动。默认 40 */
  virtualColumnsAutoThreshold?: number
  virtualColumnOverscan?: number
  height?: number | string
  rowHeight?: number
  overscan?: number
  infinite?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  infiniteDistance?: number
  virtualOnInfinite?: boolean
  resizable?: boolean
  columnLayout?: 'auto' | 'fixed'
  initialColumnWidths?: Record<string, number>
  minColumnWidth?: number
  maxColumnWidth?: number
  selectOnContextmenu?: boolean
  contextMenuItems?: (row: T | null, selectedRows: T[]) => RsContextMenuItem[]
  contextMenu?: boolean
  cellTooltip?: boolean
  cellTooltipDelay?: number
  headerTooltip?: boolean
  editable?: boolean
  editTrigger?: 'click' | 'dblclick'
  editGutter?: boolean
  editGutterWidth?: number
  highlightRow?: boolean
  highlightedRowKey?: string
  defaultHighlightedRowKey?: string
  highlightRowOnClick?: boolean
  rowCommit?: boolean
  rowPending?: (row: T, index: number) => boolean
  showRowStatus?: boolean
  allowNull?: boolean
  nullLabel?: string
  editFocusMode?: RsTableCellEditFocusMode
  editKeyboard?: boolean
  editUndo?: boolean
  editUndoLimit?: number
  editPaste?: boolean
  editBatch?: boolean
  summaryMode?: RsTableSummaryMode
  summaryData?: RsTableSummaryData | null
  showSummary?: boolean
  features?: RsTableFeature<T>[]
  viewKey?: string | number
  layoutActive?: boolean
  /** 无障碍名称；未传时回退 i18n `table.a11yLabel` */
  ariaLabel?: string
}

/** RsTable 组件 emits（defineEmits 类型） */
export type RsTableEmits<T extends RsTableRowData = RsTableRowData> = {
  rowClick: [row: T, index: number]
  rowDblclick: [row: T, index: number]
  cellView: [row: T, column: RsTableColumn<T>, index: number]
  rowContextmenu: [row: T, index: number, event: MouseEvent]
  contextMenuSelect: [key: string, row: T | null, selectedRows: T[]]
  'update:sort': [value: RsTableSortState | null]
  'update:sorts': [value: RsTableSortState[]]
  sortsChange: [value: RsTableSortState[]]
  'update:columnOrder': [value: string[]]
  columnOrderChange: [value: string[]]
  'update:columnFilters': [value: Record<string, string>]
  columnFiltersChange: [value: Record<string, string>]
  rowDrop: [dragKeys: string[], dropKey: string, position: RsTableRowDropPosition]
  rowDragStart: [dragKeys: string[], event: DragEvent]
  'update:selectedRowKeys': [keys: string[]]
  'update:expandedRowKeys': [keys: string[]]
  selectionChange: [keys: string[]]
  expandChange: [keys: string[]]
  loadMore: []
  columnResize: [key: string, width: number]
  'update:highlightedRowKey': [key: string | undefined]
  highlightChange: [key: string | undefined]
  cellEditStart: [row: T, column: RsTableColumn<T>, index: number]
  cellEditDialog: [row: T, column: RsTableColumn<T>, index: number, draft: string]
  cellEditCommit: [
    row: T,
    column: RsTableColumn<T>,
    index: number,
    value: unknown,
    previous: unknown,
  ]
  cellEditCancel: [row: T, column: RsTableColumn<T>, index: number]
  cellEditInvalid: [
    row: T,
    column: RsTableColumn<T>,
    index: number,
    message: string,
    value: unknown,
  ]
  cellEditBatchCommit: [
    column: RsTableColumn<T>,
    changes: Array<{ row: T; index: number; value: unknown; previous: unknown }>,
  ]
  cellEditUndo: [
    entry: {
      items: Array<{
        rowKey: string
        colKey: string
        rowIndex: number
        previous: unknown
        next: unknown
      }>
    },
  ]
  cellEditRedo: [
    entry: {
      items: Array<{
        rowKey: string
        colKey: string
        rowIndex: number
        previous: unknown
        next: unknown
      }>
    },
  ]
  cellEditReject: [row: T, index: number, reason?: string]
  rowEditCommit: [
    row: T,
    index: number,
    changes: Array<{ colKey: string; value: unknown; previous: unknown }>,
  ]
  rowEditRollback: [row: T, index: number]
}

/**
 * 插槽回调按双变处理：宿主把 row 写成业务行类型时，不被逆变拒绝。
 * 列插槽名是动态的，vue-tsc 不能从子组件 inject 推断 T，必须由 RsTable 自身 declare。
 */
type RsTableSlotFn<P> = {
  bivarianceHack(props: P): unknown
}['bivarianceHack']

/** 列单元格插槽参数（`#columnKey`） */
export interface RsTableColumnSlotProps<T extends RsTableRowData = RsTableRowData> {
  row: T
  column: RsTableColumn<T>
  index: number
}

/** 自定义编辑器插槽参数（`#edit-columnKey`） */
export interface RsTableEditSlotProps<T extends RsTableRowData = RsTableRowData>
  extends RsTableColumnSlotProps<T> {
  draft: string
  error: string | null
  update: (value: string) => void
  commit: () => void
  cancel: () => void
}

/** 列头插槽参数（`#header-columnKey`） */
export interface RsTableHeaderSlotProps<T extends RsTableRowData = RsTableRowData> {
  column: RsTableColumn<T>
}

/** 展开行插槽参数（`#expand`） */
export interface RsTableExpandSlotProps<T extends RsTableRowData = RsTableRowData> {
  row: T
  index: number
}

/** 分组行插槽参数（`#group`） */
export interface RsTableGroupSlotProps {
  key: string
  label: string
}

/**
 * 按插槽名解析参数。列名是动态 key；`edit-*` / `header-*` 用模板字面量区分。
 */
export type RsTableSlotPropsOf<T extends RsTableRowData, K extends string> = K extends
  | 'empty'
  | 'summary'
  ? Record<string, never>
  : K extends 'group'
    ? RsTableGroupSlotProps
    : K extends 'expand'
      ? RsTableExpandSlotProps<T>
      : K extends `header-${string}`
        ? RsTableHeaderSlotProps<T>
        : K extends `edit-${string}`
          ? RsTableEditSlotProps<T>
          : RsTableColumnSlotProps<T>

/**
 * RsTable 公开插槽。用映射类型而不是 string 索引，避免 empty/group 与列插槽冲突。
 */
export type RsTableSlots<T extends RsTableRowData = RsTableRowData> = {
  [K in string]?: RsTableSlotFn<RsTableSlotPropsOf<T, K>>
}

/** withDefaults 第二参（工厂默认用函数） */
export const RS_TABLE_PROP_DEFAULTS = {
  loading: false,
  bordered: true,
  columnBordered: false,
  rounded: false,
  fill: false,
  compact: false,
  size: 'md' as const,
  selectable: false,
  selectionType: 'checkbox' as const,
  expandable: false,
  defaultExpandedRowKeys: () => [] as string[],
  striped: false,
  showIndex: false,
  indexWidth: 48,
  showHeader: true,
  remoteSort: false,
  defaultSelectedRowKeys: () => [] as string[],
  defaultSorts: () => [] as RsTableSortState[],
  defaultColumnOrder: () => [] as string[],
  multiSort: false,
  maxSort: 3,
  columnDraggable: false,
  rowDraggable: false,
  rowDragTrigger: 'handle' as const,
  rowDropMode: 'reorder' as const,
  overscan: 4,
  virtualColumnOverscan: 2,
  infiniteDistance: 80,
  virtualOnInfinite: true,
  virtualAutoThreshold: 50,
  virtualColumns: 'auto' as const,
  virtualColumnsAutoThreshold: 40,
  resizable: false,
  columnLayout: 'auto' as const,
  minColumnWidth: 48,
  maxColumnWidth: 640,
  cellTooltip: true,
  cellTooltipDelay: 300,
  headerTooltip: true,
  editable: false,
  editTrigger: 'dblclick' as const,
  editGutter: true,
  editGutterWidth: 32,
  highlightRow: false,
  highlightRowOnClick: true,
  rowCommit: false,
  showRowStatus: true,
  allowNull: true,
  nullLabel: '(NULL)',
  editFocusMode: 'end' as const,
  editKeyboard: true,
  editUndo: true,
  editUndoLimit: 50,
  editPaste: true,
  editBatch: true,
  contextMenu: true,
  summaryMode: 'client' as const,
  showSummary: false,
}
