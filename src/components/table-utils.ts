import type { VNodeChild } from 'vue'

export type RsTableColumnAlign = 'left' | 'center' | 'right'
export type RsTableColumnFixed = 'left' | 'right'
export type RsTableSortOrder = 'asc' | 'desc' | null
/**
 * 行选择模式：
 * - checkbox / radio：左侧选择列
 * - row：无选择列，点击行多选（Ctrl/Cmd 切换、Shift 范围）
 */
export type RsTableSelectionType = 'checkbox' | 'radio' | 'row'
export type RsTableSize = 'sm' | 'md' | 'lg'

/** 行数据最小约束：任意非原始类型对象（interface / type 均可） */
export type RsTableRowData = object

/**
 * 可选约定字段（非强制）。
 * - 未传 `rowKey` 时，`resolveRowKey` 依次回退 `id` → `key` → 行索引
 * - `disabled === true` 时行不可选
 */
export interface RsTableRowConvention {
  id?: string | number
  key?: string | number
  disabled?: boolean
}

/**
 * 行字段访问器：列 key（ keyof 字符串键）、任意路径字符串、或自定义函数。
 * 用于 `rowKey`、`groupBy` 等配置。
 */
export type RsTableFieldAccessor<T extends RsTableRowData = RsTableRowData> =
  | Extract<keyof T, string>
  | string
  | ((row: T) => string)

/** 行唯一键配置 */
export type RsTableRowKey<T extends RsTableRowData = RsTableRowData> = RsTableFieldAccessor<T>

/** 分组字段配置 */
export type RsTableGroupBy<T extends RsTableRowData = RsTableRowData> = RsTableFieldAccessor<T>

/** 单元格 render 返回值（文本、数字或 Vue VNode） */
export type RsTableCellRenderResult = VNodeChild

/** 单元格编辑/展示值类型 */
export type RsTableCellValueType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'textarea'

/** 列级编辑器选项（仅编辑挂载时读取，不影响展示路径）。 */
export interface RsTableColumnEditorOptions {
  /**
   * select：选项列表；也可按行返回（如外键引用表随 schema 变化）。
   * 函数形式在进入编辑态时按当前行解析。
   */
  options?:
    | import('./select-utils').RsSelectOptions
    | ((row: RsTableRowData, index: number) => import('./select-utils').RsSelectOptions)
  /** select：可搜索 */
  searchable?: boolean
  /**
   * select：允许搜索框手输自定义值（Enter / 「使用 xxx」）。
   * 适合类型名、厂商扩展类型等预设列表外的输入。
   */
  creatable?: boolean
  /**
   * select：多选。草稿仍为字符串，选项间以 `, ` 拼接；
   * 多选时在下拉关闭时提交（避免每点一项就结束编辑）。
   */
  multiple?: boolean
  /** select / date：可清空；表格单元格 select 默认 false（仅选择，无清除 X） */
  clearable?: boolean
  /** number：最小值（对齐 InputNumber min） */
  min?: number
  /** number：最大值 */
  max?: number
  /** number：步进 */
  step?: number | string
  /** number：小数位 */
  precision?: number
  /** number：是否显示步进按钮；inline 单元格默认 false */
  controls?: boolean
  /** datetime：是否含秒 */
  withSeconds?: boolean
  /** datetime：时区策略（utc 提交时补 Z） */
  timezone?: 'local' | 'utc'
  /** textarea：可见行数 */
  rows?: number
  /**
   * 编辑呈现：inline 为单元格内编辑；dialog 由外层弹窗承接（大字段）。
   * 为 dialog 时表格不进入行内编辑态，改为发出 cellEditDialog。
   */
  presentation?: 'inline' | 'dialog'
  /** 进入编辑时光标策略覆盖 */
  focusMode?: 'end' | 'select' | 'start'
}

/** 已按行解析后的编辑器选项（options 仅为列表，供单元格编辑器使用）。 */
export type RsTableColumnEditorOptionsResolved = Omit<RsTableColumnEditorOptions, 'options'> & {
  options?: import('./select-utils').RsSelectOptions
}

function readConvention(row: object): Partial<RsTableRowConvention> {
  const record = row as Record<string, unknown>
  const result: Partial<RsTableRowConvention> = {}
  const { id, key, disabled } = record
  if (typeof id === 'string' || typeof id === 'number') result.id = id
  if (typeof key === 'string' || typeof key === 'number') result.key = key
  if (typeof disabled === 'boolean') result.disabled = disabled
  return result
}

function formatComparableValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) return value.toISOString()
  return JSON.stringify(value)
}

function readRowKeyFallback(row: object): string | undefined {
  const { id, key } = readConvention(row)
  if (typeof id === 'string' || typeof id === 'number') return String(id)
  if (typeof key === 'string' || typeof key === 'number') return String(key)
  return undefined
}

export interface RsTableSortState {
  key: string
  order: Exclude<RsTableSortOrder, null>
}

export interface RsTableColumn<T extends RsTableRowData = Record<string, unknown>> {
  key: string
  title: string
  dataIndex?: Extract<keyof T, string> | string
  width?: number | string
  minWidth?: number | string
  align?: RsTableColumnAlign
  sortable?: boolean
  sorter?: (left: T, right: T) => number
  /** 表头显示筛选图标，配合表格 `columnFilters` 使用 */
  filterable?: boolean
  /** 自定义列筛选；默认对单元格值做包含匹配 */
  filter?: (value: unknown, row: T, query: string) => boolean
  fixed?: RsTableColumnFixed
  ellipsis?: boolean
  /**
   * 格子里看不到的额外提示（always）。不要重复可见文本。
   * 可见文本被截断时的提示用 `ellipsis`：只量表格自身省略容器。
   */
  tooltip?: (row: T, index: number) => string | null | undefined
  /** 表头原生 title（宽表勿逐列挂 RsTooltip，避免成百实例） */
  headerTip?: string
  /** 是否允许行内编辑；也可在表格级设置 editable */
  editable?: boolean | ((row: T, index: number) => boolean)
  /** 单元格值类型，控制行内编辑控件（默认 text） */
  valueType?: RsTableCellValueType
  /** 编辑器附加选项（select options 等）；仅进入编辑态时使用 */
  editorOptions?: RsTableColumnEditorOptions
  /** 展示格式化 */
  formatter?: (value: unknown, row: T, index: number) => string
  /** 编辑输入解析 */
  parser?: (input: string, row: T, index: number) => unknown
  /** 编辑校验，返回错误文案；支持异步 */
  validator?: (
    value: unknown,
    row: T,
    index: number,
  ) => string | null | Promise<string | null>
  /** 是否允许 NULL（覆盖表格 allowNull） */
  nullable?: boolean
  /** 空字符串提交为 null（需 nullable） */
  emptyAsNull?: boolean
  /** 提交时机 */
  commitOn?: 'blur' | 'enter' | 'change' | 'manual'
  /** 进入编辑的触发方式 */
  editTrigger?: 'click' | 'dblclick'
  /**
   * 自定义单元格展示内容（string / number / VNode 等 `VNodeChild`）。
   * 仅影响展示层；排序、筛选、编辑、复制仍读取 `dataIndex` / `key` 字段。
   * 纯文本格式化请优先用 `formatter`。
   */
  render?: (row: T, index: number) => RsTableCellRenderResult
  /**
   * 列汇总（footer / 分组小计）。配合表格 `summaryMode`：
   * - client：对当前 viewRows 做本地聚合
   * - server：展示 `summaryData[column.key]`
   */
  summary?: import('./table/table-summary-utils').RsTableColumnSummary<T>
}

export type RsTableSelectAllState = 'checked' | 'indeterminate' | 'unchecked'

export type RsTableRowEntry<T extends RsTableRowData = Record<string, unknown>> =
  | {
      type: 'row'
      row: T
      rowIndex: number
      /** 树表深度（根为 0）；非树表为 undefined */
      depth?: number
      /** 树表：是否有可展开子节点 */
      hasChildren?: boolean
      /** 树表：父行 key；根为 null */
      parentKey?: string | null
      /** 树表：展平时确定的稳定行 key（优先于重新 resolve） */
      treeKey?: string
    }
  | { type: 'group'; key: string; label: string }
  | { type: 'expand'; row: T; rowIndex: number; rowKey: string }

/**
 * 树形表格配置。
 * 与 detail 展开（`expandable`）互斥：树表在数据列内缩进展开，不插入 `#expand` 明细行。
 */
export interface RsTableTreeConfig<T extends RsTableRowData = RsTableRowData> {
  /** 子节点字段名，默认 `children` */
  childrenField?: string
  /** 叶子标记字段名，默认 `isLeaf`；为 true 时不可展开 */
  isLeafField?: string
  /**
   * 展示缩进与展开按钮的列 key；
   * 缺省为第一列（`columns[0].key`）。
   */
  expandColumnKey?: string
  /**
   * 是否自动将展开列设为 `fixed: 'left'`（避免横向滚动 / 列虚拟时丢失展开钮）。
   * @default true
   */
  fixExpandColumn?: boolean
  /** 每一层缩进像素；缺省按表格 size（sm/md/lg → 16/20/24） */
  indent?: number
  /**
   * 仅在首次有数据时展开全部可展开节点（非受控）。
   * 若同时提供非空 `defaultExpandedRowKeys`，则以后者为准且不再全开。
   */
  defaultExpandAll?: boolean
  /**
   * 勾选是否父子独立。
   * - `true`（默认）：与平面表一致，只切换当前行
   * - `false`：父子联动，父级可呈半选
   */
  checkStrictly?: boolean
  /**
   * 懒加载：无子节点且非叶子时仍显示展开按钮；
   * 首次展开时调用 `loadData`。
   */
  lazy?: boolean
  /**
   * 懒加载回调。可直接改 `row[childrenField]`，或返回子节点数组由表格写入。
   * 使用 bivarianceHack：具体行类型的 treeConfig 可赋给更宽泛的 treeConfig prop（如 RsGrid）。
   */
  loadData?: {
    bivarianceHack(row: T, key: string): void | T[] | Promise<void | T[]>
  }['bivarianceHack']
}

/** 树表节点索引（供级联勾选 / 半选） */
export interface RsTableTreeNodeIndex {
  parentKey: string | null
  childrenKeys: string[]
}

export type RsTableTreeCheckState = 'checked' | 'indeterminate' | 'unchecked'

export const TABLE_ROW_HEIGHT = {
  sm: 33,
  md: 41,
  lg: 48,
  group: 36,
  expand: 80,
} as const

export interface RsTableFixedCellStyle {
  fixed: RsTableColumnFixed
  left?: number
  right?: number
}

export function getCellValue<T extends RsTableRowData>(row: T, column: RsTableColumn<T>): unknown {
  return row[(column.dataIndex ?? column.key) as keyof T]
}

export type RsTableCellTooltipMode = 'overflow' | 'always'

export function columnUsesSharedTooltip<T extends RsTableRowData>(column: RsTableColumn<T>): boolean {
  return Boolean(column.ellipsis || column.tooltip)
}

export function resolveCellTooltipMode<T extends RsTableRowData>(
  column: RsTableColumn<T>,
): RsTableCellTooltipMode | null {
  if (column.tooltip) return 'always'
  if (column.ellipsis) return 'overflow'
  return null
}

export function resolveCellTooltipText<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  row: T,
  index: number,
): string {
  if (column.tooltip) {
    const tip = column.tooltip(row, index)
    if (tip != null && tip !== '') return String(tip)
    return ''
  }
  const value = getCellValue(row, column)
  if (column.formatter) {
    return column.formatter(value, row, index)
  }
  if (value == null) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }
  return String(value)
}

export function compareTableValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === undefined || a === null) return -1
  if (b === undefined || b === null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return formatComparableValue(a).localeCompare(formatComparableValue(b))
}

export function toggleSortState(current: RsTableSortState | null, key: string): RsTableSortState | null {
  if (current?.key !== key) return { key, order: 'asc' }
  if (current.order === 'asc') return { key, order: 'desc' }
  return null
}

export function toggleMultiSortState(
  sorts: readonly RsTableSortState[],
  key: string,
  maxSort = 3,
): RsTableSortState[] {
  const existingIndex = sorts.findIndex((item) => item.key === key)
  if (existingIndex < 0) {
    const next = [...sorts, { key, order: 'asc' as const }]
    return next.length > maxSort ? next.slice(next.length - maxSort) : next
  }
  const existing = sorts[existingIndex]
  if (!existing) return [...sorts]
  if (existing.order === 'asc') {
    return sorts.map((item, index) => (index === existingIndex ? { key, order: 'desc' as const } : item))
  }
  return sorts.filter((_, index) => index !== existingIndex)
}

export function getSortOrderForKey(sorts: readonly RsTableSortState[], key: string): RsTableSortOrder {
  return sorts.find((item) => item.key === key)?.order ?? null
}

export function getSortPriorityForKey(sorts: readonly RsTableSortState[], key: string): number {
  const index = sorts.findIndex((item) => item.key === key)
  return index >= 0 ? index + 1 : 0
}

export function compareTableRowsBySort<T extends RsTableRowData>(
  left: T,
  right: T,
  column: RsTableColumn<T>,
  order: Exclude<RsTableSortOrder, null>,
): number {
  const direction = order === 'asc' ? 1 : -1
  if (column.sorter) return column.sorter(left, right) * direction
  return compareTableValues(getCellValue(left, column), getCellValue(right, column)) * direction
}

export function sortTableRows<T extends RsTableRowData>(
  rows: readonly T[],
  columns: readonly RsTableColumn<T>[],
  sort: RsTableSortState | null,
): T[] {
  if (!sort) return rows as T[]
  const column = columns.find((item) => item.key === sort.key)
  if (!column) return rows as T[]
  return [...rows].sort((left, right) => compareTableRowsBySort(left, right, column, sort.order))
}

export function sortTableRowsMulti<T extends RsTableRowData>(
  rows: readonly T[],
  columns: readonly RsTableColumn<T>[],
  sorts: readonly RsTableSortState[],
): T[] {
  if (sorts.length === 0) return rows as T[]
  return [...rows].sort((left, right) => {
    for (const sort of sorts) {
      const column = columns.find((item) => item.key === sort.key)
      if (!column) continue
      const compare = compareTableRowsBySort(left, right, column, sort.order)
      if (compare !== 0) return compare
    }
    return 0
  })
}

export function filterTableRows<T extends RsTableRowData>(
  rows: readonly T[],
  query: string,
  columns: readonly RsTableColumn<T>[],
  keys?: string[],
): T[] {
  const trimmed = query.trim()
  if (!trimmed) return rows as T[]
  const searchKeys = keys ?? columns.map((column) => column.key)
  const lower = trimmed.toLowerCase()
  return rows.filter((row) =>
    searchKeys.some((key) => {
      const column = columns.find((item) => item.key === key)
      const value = column ? getCellValue(row, column) : row[key as keyof T]
      return formatComparableValue(value).toLowerCase().includes(lower)
    }),
  )
}

export function filterTableRowsByColumnFilters<T extends RsTableRowData>(
  rows: readonly T[],
  columns: readonly RsTableColumn<T>[],
  filters: Record<string, string>,
): T[] {
  const active = Object.entries(filters)
    .map(([key, query]) => [key, query.trim()] as const)
    .filter(([, query]) => query.length > 0)
  if (!active.length) return rows as T[]

  const columnMap = new Map(columns.map((column) => [column.key, column]))
  return rows.filter((row) =>
    active.every(([key, query]) => {
      const column = columnMap.get(key)
      if (!column) return true
      const value = getCellValue(row, column)
      if (column.filter) return column.filter(value, row, query)
      const lower = query.toLowerCase()
      return formatComparableValue(value).toLowerCase().includes(lower)
    }),
  )
}

export function isColumnFilterActive(filters: Record<string, string>, key: string): boolean {
  return Boolean(filters[key]?.trim())
}

export function resolveGroupKey<T extends RsTableRowData>(
  row: T,
  groupBy: RsTableGroupBy<T>,
): string {
  if (typeof groupBy === 'function') return groupBy(row)
  return String(row[groupBy as keyof T] ?? '')
}

export function groupTableRows<T extends RsTableRowData>(
  rows: readonly T[],
  groupBy: RsTableGroupBy<T>,
  labelFormatter?: (key: string) => string,
): RsTableRowEntry<T>[] {
  const result: RsTableRowEntry<T>[] = []
  let lastKey: string | null = null
  rows.forEach((row, rowIndex) => {
    const key = resolveGroupKey(row, groupBy)
    if (key !== lastKey) {
      result.push({ type: 'group', key, label: labelFormatter?.(key) ?? key })
      lastKey = key
    }
    result.push({ type: 'row', row, rowIndex })
  })
  return result
}

export function resolveColumnOrder<T extends RsTableRowData>(
  columns: readonly RsTableColumn<T>[],
  order?: readonly string[],
): string[] {
  const keys = columns.map((column) => column.key)
  if (!order?.length) return keys
  const valid = order.filter((key) => keys.includes(key))
  const missing = keys.filter((key) => !valid.includes(key))
  return [...valid, ...missing]
}

export function resolveOrderedColumns<T extends RsTableRowData>(
  columns: readonly RsTableColumn<T>[],
  order?: readonly string[],
): RsTableColumn<T>[] {
  const map = new Map(columns.map((column) => [column.key, column]))
  return resolveColumnOrder(columns, order)
    .map((key) => map.get(key))
    .filter((column): column is RsTableColumn<T> => column !== undefined)
}

export function reorderColumnKeys(order: readonly string[], dragKey: string, dropKey: string): string[] {
  if (dragKey === dropKey) return [...order]
  const next = order.filter((key) => key !== dragKey)
  const dropIndex = next.indexOf(dropKey)
  if (dropIndex < 0) return [...order]
  next.splice(dropIndex, 0, dragKey)
  return next
}

export type RsTableRowDropPosition = 'before' | 'after' | 'into'

export function reorderTableRows<T>(
  rows: readonly T[],
  dragIndex: number,
  dropIndex: number,
  position: RsTableRowDropPosition,
): T[] {
  if (dragIndex < 0 || dropIndex < 0 || dragIndex === dropIndex) return [...rows]
  const next = [...rows]
  const [moved] = next.splice(dragIndex, 1)
  if (moved === undefined) return [...rows]
  let targetIndex = dropIndex
  if (dragIndex < dropIndex) targetIndex -= 1
  if (position === 'after') targetIndex += 1
  next.splice(targetIndex, 0, moved)
  return next
}

export function buildTableEntries<T extends RsTableRowData>(
  rows: readonly T[],
  columns: readonly RsTableColumn<T>[],
  options: {
    sort?: RsTableSortState | null
    sorts?: readonly RsTableSortState[]
    multiSort?: boolean
    filterText?: string
    filterKeys?: string[]
    columnFilters?: Record<string, string>
    groupBy?: RsTableGroupBy<T>
    groupLabel?: (key: string) => string
    remoteSort?: boolean
  } = {},
): RsTableRowEntry<T>[] {
  let processed: readonly T[] = rows
  const filterText = options.filterText ?? ''
  if (filterText.trim()) {
    processed = filterTableRows(processed, filterText, columns, options.filterKeys)
  }
  const columnFilters = options.columnFilters ?? {}
  if (Object.values(columnFilters).some((q) => q.trim())) {
    processed = filterTableRowsByColumnFilters(processed, columns, columnFilters)
  }
  if (!options.remoteSort) {
    if (options.multiSort && options.sorts?.length) {
      processed = sortTableRowsMulti(processed, columns, options.sorts)
    } else if (options.sort) {
      processed = sortTableRows(processed, columns, options.sort)
    }
  }
  if (options.groupBy) {
    const groupBy = options.groupBy
    processed = [...processed].sort((left, right) =>
      compareTableValues(resolveGroupKey(left, groupBy), resolveGroupKey(right, groupBy)),
    )
    return groupTableRows(processed, groupBy, options.groupLabel)
  }
  return processed.map((row, rowIndex) => ({ type: 'row' as const, row, rowIndex }))
}

export function injectExpandRows<T extends RsTableRowData>(
  entries: readonly RsTableRowEntry<T>[],
  expandedKeys: ReadonlySet<string>,
  rowKey?: RsTableRowKey<T>,
  rowExpandable?: (row: T, index: number) => boolean,
): RsTableRowEntry<T>[] {
  const result: RsTableRowEntry<T>[] = []
  for (const entry of entries) {
    result.push(entry)
    if (entry.type !== 'row') continue
    if (rowExpandable && !rowExpandable(entry.row, entry.rowIndex)) continue
    const key = resolveRowKey(entry.row, entry.rowIndex, rowKey)
    if (expandedKeys.has(key)) {
      result.push({ type: 'expand', row: entry.row, rowIndex: entry.rowIndex, rowKey: key })
    }
  }
  return result
}

export function toggleExpandedRowKeys(keys: readonly string[], key: string): string[] {
  const next = new Set(keys)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return [...next]
}

/** 读取树表子节点数组（非数组视为无子节点） */
export function getTableTreeChildren<T extends RsTableRowData>(
  row: T,
  childrenField = 'children',
): T[] {
  const value = (row as Record<string, unknown>)[childrenField]
  return Array.isArray(value) ? (value as T[]) : []
}

/** 是否为叶子（显式 isLeaf 优先） */
export function getTableTreeIsLeaf<T extends RsTableRowData>(
  row: T,
  isLeafField = 'isLeaf',
): boolean {
  return Boolean((row as Record<string, unknown>)[isLeafField])
}

/** 是否可展开：非叶子且（有子节点，或懒加载） */
export function hasTableTreeChildren<T extends RsTableRowData>(
  row: T,
  options: { childrenField?: string; isLeafField?: string; lazy?: boolean } = {},
): boolean {
  const childrenField = options.childrenField ?? 'children'
  const isLeafField = options.isLeafField ?? 'isLeaf'
  if (getTableTreeIsLeaf(row, isLeafField)) return false
  if (getTableTreeChildren(row, childrenField).length > 0) return true
  return Boolean(options.lazy)
}

/**
 * 解析树表行 key。
 * 有 `rowKey` 时走 `resolveRowKey`；否则用路径回退（避免兄弟下标跨分支碰撞）。
 * 树表强烈建议显式传 `rowKey`。
 */
export function resolveTableTreeRowKey<T extends RsTableRowData>(
  row: T,
  index: number,
  parentKey: string | null,
  rowKey?: RsTableRowKey<T>,
): string {
  if (rowKey !== undefined && rowKey !== null && rowKey !== '') {
    return resolveRowKey(row, index, rowKey)
  }
  return parentKey == null ? `tree:${index}` : `${parentKey}/${index}`
}

/** 是否配置了可用的稳定 rowKey（字段名或函数） */
export function hasStableTableTreeRowKey<T extends RsTableRowData>(
  rowKey?: RsTableRowKey<T>,
): boolean {
  return rowKey !== undefined && rowKey !== null && rowKey !== ''
}

/** 收集所有可展开节点 key（用于 defaultExpandAll） */
export function collectTableTreeExpandableKeys<T extends RsTableRowData>(
  rows: readonly T[],
  options: {
    childrenField?: string
    isLeafField?: string
    lazy?: boolean
    rowKey?: RsTableRowKey<T>
  } = {},
): string[] {
  const childrenField = options.childrenField ?? 'children'
  const keys: string[] = []
  const walk = (items: readonly T[], parentKey: string | null) => {
    items.forEach((row, index) => {
      const key = resolveTableTreeRowKey(row, index, parentKey, options.rowKey)
      if (hasTableTreeChildren(row, options)) {
        keys.push(key)
        walk(getTableTreeChildren(row, childrenField), key)
      }
    })
  }
  walk(rows, null)
  return keys
}

/** 构建整棵树的 parent/children key 索引（级联勾选） */
export function buildTableTreeNodeIndex<T extends RsTableRowData>(
  rows: readonly T[],
  options: {
    childrenField?: string
    isLeafField?: string
    lazy?: boolean
    rowKey?: RsTableRowKey<T>
  } = {},
): Map<string, RsTableTreeNodeIndex> {
  const childrenField = options.childrenField ?? 'children'
  const map = new Map<string, RsTableTreeNodeIndex>()
  const walk = (items: readonly T[], parentKey: string | null) => {
    for (let i = 0; i < items.length; i += 1) {
      const row = items[i] as T
      const key = resolveTableTreeRowKey(row, i, parentKey, options.rowKey)
      const children = getTableTreeChildren(row, childrenField)
      const childrenKeys = hasTableTreeChildren(row, options)
        ? children.map((child, childIndex) =>
            resolveTableTreeRowKey(child, childIndex, key, options.rowKey),
          )
        : []
      map.set(key, { parentKey, childrenKeys })
      if (children.length > 0) walk(children, key)
    }
  }
  walk(rows, null)
  return map
}

export function collectTableTreeDescendantKeys(
  key: string,
  index: ReadonlyMap<string, RsTableTreeNodeIndex>,
): string[] {
  const entry = index.get(key)
  if (!entry) return []
  const result: string[] = []
  for (const childKey of entry.childrenKeys) {
    result.push(childKey, ...collectTableTreeDescendantKeys(childKey, index))
  }
  return result
}

export function resolveTableTreeCheckState(
  key: string,
  checkedKeys: ReadonlySet<string>,
  index: ReadonlyMap<string, RsTableTreeNodeIndex>,
  checkStrictly: boolean,
): RsTableTreeCheckState {
  if (checkStrictly) return checkedKeys.has(key) ? 'checked' : 'unchecked'
  if (checkedKeys.size === 0) return 'unchecked'

  const entry = index.get(key)
  if (!entry || entry.childrenKeys.length === 0) {
    return checkedKeys.has(key) ? 'checked' : 'unchecked'
  }

  const childStates = entry.childrenKeys.map((childKey) =>
    resolveTableTreeCheckState(childKey, checkedKeys, index, checkStrictly),
  )

  if (childStates.every((state) => state === 'checked')) return 'checked'
  if (childStates.some((state) => state === 'checked' || state === 'indeterminate')) {
    return 'indeterminate'
  }
  return 'unchecked'
}

export function collectTableTreeHalfCheckedKeys(
  index: ReadonlyMap<string, RsTableTreeNodeIndex>,
  checkedKeys: ReadonlySet<string>,
  checkStrictly: boolean,
): string[] {
  if (checkStrictly || checkedKeys.size === 0) return []
  const half: string[] = []
  for (const key of index.keys()) {
    if (resolveTableTreeCheckState(key, checkedKeys, index, checkStrictly) === 'indeterminate') {
      half.push(key)
    }
  }
  return half
}

/** 切换树表勾选；`checkStrictly=false` 时父子联动 */
export function toggleTableTreeCheck(
  key: string,
  checkedKeys: ReadonlySet<string>,
  index: ReadonlyMap<string, RsTableTreeNodeIndex>,
  checkStrictly: boolean,
): string[] {
  const next = new Set(checkedKeys)
  const current = resolveTableTreeCheckState(key, next, index, checkStrictly)
  const shouldCheck = current !== 'checked'

  if (checkStrictly) {
    if (shouldCheck) next.add(key)
    else next.delete(key)
    return [...next]
  }

  for (const id of [key, ...collectTableTreeDescendantKeys(key, index)]) {
    if (shouldCheck) next.add(id)
    else next.delete(id)
  }

  let parentKey = index.get(key)?.parentKey ?? null
  while (parentKey) {
    const parent = index.get(parentKey)
    if (!parent) break
    const allChecked = parent.childrenKeys.every(
      (childKey) => resolveTableTreeCheckState(childKey, next, index, false) === 'checked',
    )
    if (allChecked) next.add(parentKey)
    else next.delete(parentKey)
    parentKey = parent.parentKey
  }

  return [...next]
}

/**
 * 树过滤：匹配节点或其后代匹配时保留该节点，并裁剪子树。
 * 与 RsTree `filterTreeNodes` 语义一致（保留祖先路径）。
 */
export function filterTableTreeRows<T extends RsTableRowData>(
  rows: readonly T[],
  query: string,
  columns: readonly RsTableColumn<T>[],
  options: {
    childrenField?: string
    filterKeys?: string[]
    columnFilters?: Record<string, string>
  } = {},
): T[] {
  const childrenField = options.childrenField ?? 'children'
  const trimmed = query.trim()
  const columnFilters = options.columnFilters ?? {}
  const hasColumnFilters = Object.values(columnFilters).some((q) => q.trim())
  if (!trimmed && !hasColumnFilters) return rows as T[]

  const matchesSelf = (row: T): boolean => {
    let ok = true
    if (trimmed) {
      const filtered = filterTableRows([row], trimmed, columns, options.filterKeys)
      ok = filtered.length > 0
    }
    if (ok && hasColumnFilters) {
      const filtered = filterTableRowsByColumnFilters([row], columns, columnFilters)
      ok = filtered.length > 0
    }
    return ok
  }

  const walk = (items: readonly T[]): T[] => {
    const result: T[] = []
    for (const row of items) {
      const children = getTableTreeChildren(row, childrenField)
      const nextChildren = children.length ? walk(children) : []
      if (matchesSelf(row) || nextChildren.length > 0) {
        result.push(
          nextChildren.length || children.length
            ? ({ ...row, [childrenField]: nextChildren } as T)
            : row,
        )
      }
    }
    return result
  }
  return walk(rows)
}

/** 树排序：仅对同级节点排序，递归处理子树 */
export function sortTableTreeRows<T extends RsTableRowData>(
  rows: readonly T[],
  columns: readonly RsTableColumn<T>[],
  options: {
    childrenField?: string
    sort?: RsTableSortState | null
    sorts?: readonly RsTableSortState[]
    multiSort?: boolean
  },
): T[] {
  const childrenField = options.childrenField ?? 'children'
  let sorted: T[]
  if (options.multiSort && options.sorts?.length) {
    sorted = sortTableRowsMulti(rows, columns, options.sorts)
  } else if (options.sort) {
    sorted = sortTableRows(rows, columns, options.sort)
  } else {
    sorted = rows as T[]
  }
  return sorted.map((row) => {
    const children = getTableTreeChildren(row, childrenField)
    if (!children.length) return row
    return {
      ...row,
      [childrenField]: sortTableTreeRows(children, columns, options),
    } as T
  })
}

/**
 * 按展开 key 展平可见树行为表格 row entries（不含 detail expand 行）。
 */
export function flattenVisibleTableTreeEntries<T extends RsTableRowData>(
  rows: readonly T[],
  expandedKeys: ReadonlySet<string>,
  options: {
    childrenField?: string
    isLeafField?: string
    lazy?: boolean
    rowKey?: RsTableRowKey<T>
  } = {},
): Extract<RsTableRowEntry<T>, { type: 'row' }>[] {
  const childrenField = options.childrenField ?? 'children'
  const result: Extract<RsTableRowEntry<T>, { type: 'row' }>[] = []

  const walk = (items: readonly T[], depth: number, parentKey: string | null) => {
    items.forEach((row, index) => {
      const key = resolveTableTreeRowKey(row, index, parentKey, options.rowKey)
      const hasChildren = hasTableTreeChildren(row, options)
      const rowIndex = result.length
      result.push({
        type: 'row',
        row,
        rowIndex,
        depth,
        hasChildren,
        parentKey,
        treeKey: key,
      })
      if (hasChildren && expandedKeys.has(key)) {
        walk(getTableTreeChildren(row, childrenField), depth + 1, key)
      }
    })
  }

  walk(rows, 0, null)
  return result
}

/**
 * 树表入口构建：过滤 → 同级排序 → 按展开状态展平。
 * 不支持与 `groupBy` / detail `expandable` 同时使用。
 */
export function buildTableTreeEntries<T extends RsTableRowData>(
  rows: readonly T[],
  columns: readonly RsTableColumn<T>[],
  expandedKeys: ReadonlySet<string>,
  options: {
    tree: RsTableTreeConfig<T>
    rowKey?: RsTableRowKey<T>
    sort?: RsTableSortState | null
    sorts?: readonly RsTableSortState[]
    multiSort?: boolean
    filterText?: string
    filterKeys?: string[]
    columnFilters?: Record<string, string>
    remoteSort?: boolean
  },
): RsTableRowEntry<T>[] {
  const childrenField = options.tree.childrenField ?? 'children'
  let processed: readonly T[] = rows

  const filterText = options.filterText ?? ''
  const columnFilters = options.columnFilters ?? {}
  if (filterText.trim() || Object.values(columnFilters).some((q) => q.trim())) {
    processed = filterTableTreeRows(processed, filterText, columns, {
      childrenField,
      filterKeys: options.filterKeys,
      columnFilters,
    })
  }

  if (!options.remoteSort && (options.sort || (options.multiSort && options.sorts?.length))) {
    processed = sortTableTreeRows(processed, columns, {
      childrenField,
      sort: options.sort,
      sorts: options.sorts,
      multiSort: options.multiSort,
    })
  }

  return flattenVisibleTableTreeEntries(processed, expandedKeys, {
    childrenField,
    isLeafField: options.tree.isLeafField,
    lazy: options.tree.lazy,
    rowKey: options.rowKey,
  })
}

/** 按表格 size 解析树缩进默认值 */
export function resolveTableTreeIndent(size: RsTableSize = 'md', custom?: number): number {
  if (custom !== undefined) return custom
  if (size === 'sm') return 16
  if (size === 'lg') return 24
  return 20
}

export function resolveTableSize(compact: boolean, size: RsTableSize = 'md'): RsTableSize {
  if (compact) return 'sm'
  return size
}

export function resolveTableRowHeight(size: RsTableSize = 'md', custom?: number): number {
  if (custom !== undefined) return custom
  return TABLE_ROW_HEIGHT[size]
}

export function resolveTableVirtualEnabled(options: {
  virtual?: boolean
  infinite?: boolean
  virtualOnInfinite?: boolean
}): boolean {
  if (options.virtual) return true
  if (options.infinite && options.virtualOnInfinite !== false) return true
  return false
}

export function isNearScrollBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  distance = 80,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= distance
}

export function entryHeight<T extends RsTableRowData>(
  entry: RsTableRowEntry<T>,
  rowHeight: number,
  groupRowHeight = TABLE_ROW_HEIGHT.group,
  expandRowHeight = TABLE_ROW_HEIGHT.expand,
): number {
  if (entry.type === 'group') return groupRowHeight
  if (entry.type === 'expand') return expandRowHeight
  return rowHeight
}

export function resolveScrollWidth(scrollX?: number | string, _columns?: readonly RsTableColumn[]): string | undefined {
  if (scrollX === undefined) return undefined
  if (typeof scrollX === 'number') return `${scrollX}px`
  return scrollX
}

export function resolveLeadingColumnWidth(options: {
  selectable?: boolean
  showIndex?: boolean
  showEditGutter?: boolean
  gutterWidth?: number
  indexWidth?: number
  expandable?: boolean
  rowDraggable?: boolean
}): number {
  let width = 0
  if (options.rowDraggable) width += 40
  if (options.expandable) width += 40
  if (options.selectable) width += 40
  if (options.showEditGutter) width += options.gutterWidth ?? 32
  else if (options.showIndex) width += options.indexWidth ?? 48
  return width
}

export function resolveFixedColumnStyles<T extends RsTableRowData>(
  columns: readonly RsTableColumn<T>[],
  widths: Record<string, number | string>,
  options: {
    selectable?: boolean
    showIndex?: boolean
    showEditGutter?: boolean
    gutterWidth?: number
    indexWidth?: number
    expandable?: boolean
    rowDraggable?: boolean
  } = {},
): Map<string, RsTableFixedCellStyle> {
  const result = new Map<string, RsTableFixedCellStyle>()
  const leading = resolveLeadingColumnWidth(options)
  let leftOffset = leading

  for (const column of columns) {
    if (column.fixed !== 'left') continue
    result.set(column.key, { fixed: 'left', left: leftOffset })
    leftOffset += parseColumnWidth(widths[column.key] ?? column.width)
  }

  let rightOffset = 0
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    const column = columns[index]
    if (column?.fixed !== 'right') continue
    result.set(column.key, { fixed: 'right', right: rightOffset })
    rightOffset += parseColumnWidth(widths[column.key] ?? column.width)
  }

  return result
}

export function fixedCellStyle(
  style?: RsTableFixedCellStyle,
  options?: { header?: boolean },
): Record<string, string> | undefined {
  if (!style) return undefined
  const result: Record<string, string> = {
    position: 'sticky',
    zIndex: options?.header ? '4' : '2',
  }
  if (options?.header) result.top = '0'
  if (style.fixed === 'left' && style.left !== undefined) {
    result.left = `${style.left}px`
    return result
  }
  if (style.fixed === 'right' && style.right !== undefined) {
    result.right = `${style.right}px`
    return result
  }
  return undefined
}

export function selectRowKeys(
  selectedKeys: readonly string[],
  key: string,
  selectionType: RsTableSelectionType,
): string[] {
  if (selectionType === 'radio') return [key]
  return toggleRowSelection(selectedKeys, key)
}

/** 行点击多选（plain / Ctrl·Cmd / Shift），供 selectionType=`row` 使用。 */
export function selectRowKeysByClick(
  selectedKeys: readonly string[],
  key: string,
  options: {
    toggle: boolean
    range: boolean
    /** 有序行键（当前可见数据顺序），用于 Shift 范围选 */
    orderedKeys: readonly string[]
    /** Shift 范围的锚点行键 */
    anchorKey?: string | null
  },
): string[] {
  if (options.range && options.orderedKeys.length > 0) {
    const anchor = options.anchorKey && options.orderedKeys.includes(options.anchorKey)
      ? options.anchorKey
      : key
    const from = options.orderedKeys.indexOf(anchor)
    const to = options.orderedKeys.indexOf(key)
    if (from < 0 || to < 0) return [key]
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    return options.orderedKeys.slice(start, end + 1)
  }
  if (options.toggle) return toggleRowSelection(selectedKeys, key)
  return [key]
}

export function sliceVirtualTableEntries<T extends RsTableRowData>(
  entries: readonly RsTableRowEntry<T>[],
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  groupRowHeight = TABLE_ROW_HEIGHT.group,
  overscan = 4,
  expandRowHeight = TABLE_ROW_HEIGHT.expand,
): {
  entries: RsTableRowEntry<T>[]
  paddingTop: number
  paddingBottom: number
} {
  if (entries.length === 0) return { entries: [], paddingTop: 0, paddingBottom: 0 }
  const model = buildVirtualHeightModel(entries, rowHeight, groupRowHeight, expandRowHeight)
  return sliceVirtualHeightModel(model, scrollTop, viewportHeight, rowHeight, overscan)
}

/** 预计算行高前缀和，供虚拟滚动复用，避免每次 scroll 全量 map/reduce */
export function buildVirtualHeightModel<T extends RsTableRowData>(
  entries: readonly RsTableRowEntry<T>[],
  rowHeight: number,
  groupRowHeight = TABLE_ROW_HEIGHT.group,
  expandRowHeight = TABLE_ROW_HEIGHT.expand,
): {
  entries: readonly RsTableRowEntry<T>[]
  prefix: number[]
  total: number
} {
  const prefix = new Array<number>(entries.length + 1)
  prefix[0] = 0
  for (let index = 0; index < entries.length; index += 1) {
    prefix[index + 1] = prefix[index] + entryHeight(entries[index], rowHeight, groupRowHeight, expandRowHeight)
  }
  return { entries, prefix, total: prefix[entries.length] ?? 0 }
}

function findVirtualStartIndex(prefix: readonly number[], targetTop: number): number {
  let low = 0
  let high = prefix.length - 2
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if ((prefix[mid + 1] ?? 0) <= targetTop) low = mid + 1
    else high = mid
  }
  return low
}

export function sliceVirtualHeightModel<T extends RsTableRowData>(
  model: {
    entries: readonly RsTableRowEntry<T>[]
    prefix: readonly number[]
    total: number
  },
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  overscan = 4,
): {
  entries: RsTableRowEntry<T>[]
  paddingTop: number
  paddingBottom: number
} {
  const { entries, prefix, total } = model
  if (entries.length === 0) return { entries: [], paddingTop: 0, paddingBottom: 0 }

  const overscanPx = overscan * rowHeight
  const targetTop = Math.max(0, scrollTop - overscanPx)
  const start = findVirtualStartIndex(prefix, targetTop)
  const paddingTop = prefix[start] ?? 0

  const maxVisible = viewportHeight + overscanPx * 2
  let end = start
  while (end < entries.length && (prefix[end] ?? 0) - paddingTop < maxVisible) {
    end += 1
  }
  if (end === start) end = Math.min(start + 1, entries.length)

  const renderedBottom = prefix[end] ?? total
  const paddingBottom = Math.max(0, total - renderedBottom)

  return {
    entries: entries.slice(start, end) as RsTableRowEntry<T>[],
    paddingTop,
    paddingBottom,
  }
}

/** 列像素宽：优先已测量/配置 widths，其次 column.width / minWidth */
export function resolveColumnPixelWidth<T extends RsTableRowData>(
  column: RsTableColumn<T>,
  widths?: Record<string, number | string>,
  fallback = 120,
): number {
  const fromMap = widths?.[column.key]
  if (fromMap !== undefined) return parseColumnWidth(fromMap, fallback)
  return parseColumnWidth(column.width ?? column.minWidth, fallback)
}

/**
 * 横向列虚拟切片（仅针对可横滚的流体列）。
 * 调用方负责：冻结列始终实体渲染；`scrollLeft` 为相对流体区起点的偏移
 * （即容器 scrollLeft 减去前缀列与左冻结列宽度）。
 */
export function sliceVirtualColumns<T extends RsTableRowData>(
  columns: readonly RsTableColumn<T>[],
  options: {
    scrollLeft: number
    viewportWidth: number
    getWidth: (column: RsTableColumn<T>) => number
    overscan?: number
  },
): {
  columns: RsTableColumn<T>[]
  paddingLeft: number
  paddingRight: number
  startIndex: number
  endIndex: number
} {
  const n = columns.length
  if (n === 0) {
    return { columns: [], paddingLeft: 0, paddingRight: 0, startIndex: 0, endIndex: 0 }
  }

  const overscan = options.overscan ?? 2
  const prefix: number[] = new Array(n + 1)
  prefix[0] = 0
  for (let i = 0; i < n; i += 1) {
    prefix[i + 1] = (prefix[i] ?? 0) + Math.max(1, options.getWidth(columns[i]!))
  }
  const total = prefix[n] ?? 0

  const viewLeft = Math.max(0, options.scrollLeft)
  const viewRight = viewLeft + Math.max(1, options.viewportWidth)

  let start = 0
  while (start < n && (prefix[start + 1] ?? 0) <= viewLeft) start += 1
  start = Math.max(0, start - overscan)

  let end = start
  while (end < n && (prefix[end] ?? 0) < viewRight) end += 1
  end = Math.min(n, Math.max(end + overscan, start + 1))

  return {
    columns: columns.slice(start, end) as RsTableColumn<T>[],
    paddingLeft: prefix[start] ?? 0,
    paddingRight: Math.max(0, total - (prefix[end] ?? total)),
    startIndex: start,
    endIndex: end,
  }
}

export function resolveRowKey<T extends RsTableRowData>(row: T, index: number, rowKey?: RsTableRowKey<T>): string {
  if (typeof rowKey === 'function') return rowKey(row)
  if (rowKey) return String(row[rowKey as keyof T])
  return readRowKeyFallback(row) ?? String(index)
}

export function resolveEntryKey<T extends RsTableRowData>(
  entry: RsTableRowEntry<T>,
  rowKey?: RsTableRowKey<T>,
): string {
  if (entry.type === 'group') return `group:${entry.key}`
  if (entry.type === 'expand') return `expand:${entry.rowKey}`
  if (entry.treeKey) return entry.treeKey
  return resolveRowKey(entry.row, entry.rowIndex, rowKey)
}

export function resolveColumnStyle<T extends RsTableRowData = Record<string, unknown>>(
  column: RsTableColumn<T>,
  widths?: Record<string, number | string>,
): Record<string, string> | undefined {
  const style: Record<string, string> = {}
  const width = widths?.[column.key] ?? column.width
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (column.minWidth !== undefined) {
    style.minWidth = typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth
  }
  return Object.keys(style).length ? style : undefined
}

export function clampColumnWidth(width: number, min = 48, max = 640): number {
  return Math.min(max, Math.max(min, width))
}

export function parseColumnWidth(width: number | string | undefined, fallback = 120): number {
  if (typeof width === 'number') return width
  if (typeof width === 'string' && width.endsWith('px')) return Number.parseInt(width, 10) || fallback
  return fallback
}

export function createInitialColumnWidths<T extends RsTableRowData>(
  columns: readonly RsTableColumn<T>[],
  overrides?: Record<string, number | string>,
  options?: { forceAll?: boolean },
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const column of columns) {
    const override = overrides?.[column.key]
    if (typeof override === 'number') {
      result[column.key] = override
      continue
    }
    if (typeof override === 'string' && override.endsWith('px')) {
      result[column.key] = Number.parseInt(override, 10) || parseColumnWidth(column.width)
      continue
    }
    if (typeof column.width === 'number') {
      result[column.key] = column.width
      continue
    }
    // resizable 模式下，确保所有列都有显式宽度，避免 table-layout:auto 重分配
    if (options?.forceAll) {
      result[column.key] = parseColumnWidth(column.width ?? column.minWidth)
    }
  }
  return result
}

export function isTableRowDisabled<T extends RsTableRowData>(row: T): boolean {
  return readConvention(row).disabled === true
}

export function resolveSelectableRowKeys<T extends RsTableRowData>(
  rows: readonly T[],
  rowKey?: RsTableRowKey<T>,
  rowSelectable?: (row: T, index: number) => boolean,
): string[] {
  return rows
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) => {
      if (isTableRowDisabled(row)) return false
      return rowSelectable ? rowSelectable(row, index) : true
    })
    .map(({ row, index }) => resolveRowKey(row, index, rowKey))
}

export function resolveSelectAllState(
  selectedKeys: readonly string[],
  allKeys: readonly string[],
): RsTableSelectAllState {
  if (allKeys.length === 0) return 'unchecked'
  const selectedCount = allKeys.filter((key) => selectedKeys.includes(key)).length
  if (selectedCount === 0) return 'unchecked'
  if (selectedCount === allKeys.length) return 'checked'
  return 'indeterminate'
}

export function toggleRowSelection(selectedKeys: readonly string[], key: string): string[] {
  const next = new Set(selectedKeys)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return [...next]
}

export function toggleSelectAll(
  selectedKeys: readonly string[],
  allKeys: readonly string[],
  select: boolean,
): string[] {
  const next = new Set(selectedKeys)
  if (select) {
    for (const key of allKeys) next.add(key)
  } else {
    for (const key of allKeys) next.delete(key)
  }
  return [...next]
}
