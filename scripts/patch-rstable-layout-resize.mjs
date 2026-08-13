/**
 * 将 column layout / resize 接到 RsTable.vue（CRLF 安全）
 */
import fs from 'node:fs'

const path = new URL('../src/components/RsTable.vue', import.meta.url)
let s = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

function mustReplace(label, from, to) {
  const needle = from.replace(/\r\n/g, '\n')
  if (!s.includes(needle)) throw new Error(`patch miss: ${label}`)
  s = s.replace(needle, to.replace(/\r\n/g, '\n'))
}

mustReplace(
  'imports',
  `import { RS_TABLE_PREFIX_COL_WIDTH, useRsTableColumnVirtual } from '../composables/useRsTableColumnVirtual'
import { useRsTableContextMenu } from '../composables/useRsTableContextMenu'
import { useRsTableSummary } from '../composables/useRsTableSummary'`,
  `import {
  measureRsTablePrefixWidth,
  RS_TABLE_PREFIX_COL_WIDTH,
  useRsTableColumnVirtual,
} from '../composables/useRsTableColumnVirtual'
import { useRsTableColumnLayout } from '../composables/useRsTableColumnLayout'
import { useRsTableColumnResize } from '../composables/useRsTableColumnResize'
import { useRsTableContextMenu } from '../composables/useRsTableContextMenu'
import { useRsTableSummary } from '../composables/useRsTableSummary'`,
)

mustReplace(
  'drop unused utils imports if present',
  `  clampColumnWidth,
  collectTableTreeExpandableKeys,`,
  `  collectTableTreeExpandableKeys,`,
)

// may fail if clamp already removed - try optional
if (s.includes('fixedCellStyle,\n')) {
  mustReplace('fixedCellStyle import', `  fixedCellStyle,\n`, ``)
}
if (s.includes('resolveColumnStyle,\n')) {
  mustReplace('resolveColumnStyle import', `  resolveColumnStyle,\n`, ``)
}
if (s.includes('resolveFixedColumnStyles,\n')) {
  mustReplace('resolveFixedColumnStyles import', `  resolveFixedColumnStyles,\n`, ``)
}

mustReplace(
  'resize+layout block',
  `/** 前缀列固定宽度（与 CSS 一致），用于 resizable 模式精确计算表格总宽 */
const PREFIX_COL_WIDTH = RS_TABLE_PREFIX_COL_WIDTH

/** 拖拽会话中的列宽快照（仅在拖拽开始时写入一次，供 colgroup 初始渲染） */
const resizePaintWidths = ref<Record<string, number> | null>(null)
/** 是否处于列宽拖拽中（切换 fixed 布局，移动过程走 DOM 直写避免整表重渲染） */
const isColumnResizing = ref(false)
const tableRef = ref<HTMLTableElement | null>(null)

/** 拖拽中的实时列宽（非响应式，避免 mousemove 触发整表更新） */
let activeDragWidths: Record<string, number> | null = null

/** 样式计算用：拖拽初始帧用快照，否则用持久化列宽 */
const effectiveColumnWidths = computed(() => resizePaintWidths.value ?? resolvedColumnWidths.value)

const {
  dataColumnWidth,
  virtualColumnsEnabled,
  visibleDataColumns,
  columnPadLeft,
  columnPadRight,
} = useRsTableColumnVirtual<T>({
  displayColumns: () => displayColumns.value,
  virtualColumns: () => props.virtualColumns,
  virtualColumnsAutoThreshold: () => props.virtualColumnsAutoThreshold,
  virtualColumnOverscan: () => props.virtualColumnOverscan,
  isColumnResizing,
  scrollLeft,
  measuredViewportWidth,
  columnWidths: () => effectiveColumnWidths.value,
  showRowDragHandle,
  detailExpandable,
  showSelectColumn,
  showEditGutterColumn,
  showIndexColumn,
  showRowStatusColumn,
  resolvedGutterWidth,
  resolvedIndexWidth,
})

const useScrollContainer = computed(
  () => virtualScrollEnabled.value || props.infinite || virtualColumnsEnabled.value,
)

const scrollContainerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (useScrollContainer.value && !props.fill) {
    const resolvedHeight = resolveVirtualListHeight(props.height, 320)
    if (resolvedHeight) {
      style.height = resolvedHeight
      style.maxHeight = resolvedHeight
    }
  }
  if (showEditGutterColumn.value) {
    style['--rs-table-gutter-width'] = \`\${resolvedGutterWidth.value}px\`
  }
  if (showSelectColumn.value) {
    style['--rs-table-select-width'] = \`\${PREFIX_COL_WIDTH.select}px\`
  }
  if (showIndexColumn.value) {
    style['--rs-table-index-width'] = \`\${resolvedIndexWidth.value}px\`
  }
  return Object.keys(style).length ? style : undefined
})

/** resizable 且列宽稳定时，或拖拽会话中：表格内容最小宽度 = 各列宽度之和（不含拉满补宽） */
const resizableTableWidth = computed(() => {
  if (!props.resizable) return undefined
  if (!resizePaintWidths.value && props.columnLayout === 'auto' && !useStableColumnWidths.value) {
    return undefined
  }
  let sum = 0
  if (showRowDragHandle.value) sum += PREFIX_COL_WIDTH.drag
  if (detailExpandable.value) sum += PREFIX_COL_WIDTH.expand
  if (showSelectColumn.value) sum += PREFIX_COL_WIDTH.select
  if (showEditGutterColumn.value) sum += resolvedGutterWidth.value
  else if (showIndexColumn.value) sum += resolvedIndexWidth.value
  const widths = effectiveColumnWidths.value
  for (const col of displayColumns.value) {
    sum += widths[col.key] ?? parseColumnWidth(col.width ?? col.minWidth)
  }
  return \`\${sum}px\`
})

/**
 * 列总宽不足视口时，把剩余像素均分到数据列（前缀列不动）。
 * 避免 fixed + resizable 把 table 锁成「列宽之和」，右侧露出表头灰底。
 */
const emptyFillExtras: Record<string, number> = Object.freeze({})
const useFixedColumnLayout = computed(
  () => useStableColumnWidths.value || isColumnResizing.value,
)
const columnFillExtras = computed((): Record<string, number> => {
  if (isColumnResizing.value) return emptyFillExtras
  if (!useFixedColumnLayout.value) return emptyFillExtras
  if (virtualColumnsEnabled.value) return emptyFillExtras
  const viewportW = measuredViewportWidth.value
  if (viewportW <= 0) return emptyFillExtras
  const cols = displayColumns.value
  if (cols.length === 0) return emptyFillExtras

  let sum = measurePrefixColumnWidth()
  if (showRowStatusColumn.value) sum += PREFIX_COL_WIDTH.status
  const widths = effectiveColumnWidths.value
  for (const col of cols) {
    sum += widths[col.key] ?? parseColumnWidth(col.width ?? col.minWidth)
  }
  // 预留 1px，避免边框/亚像素导致偶发横向条
  const excess = Math.floor(viewportW - sum) - 1
  if (excess <= 0) return emptyFillExtras

  const extras: Record<string, number> = {}
  const base = Math.floor(excess / cols.length)
  let rem = excess - base * cols.length
  for (const col of cols) {
    extras[col.key] = base + (rem > 0 ? 1 : 0)
    if (rem > 0) rem -= 1
  }
  return extras
})

/** 渲染用列宽 = 持久化/拖拽列宽 + 拉满补宽 */
const renderColumnWidths = computed(() => {
  const extras = columnFillExtras.value
  const base = effectiveColumnWidths.value
  if (extras === emptyFillExtras) return base
  const next: Record<string, number> = { ...base }
  for (const col of displayColumns.value) {
    const extra = extras[col.key]
    if (!extra) continue
    const cur = next[col.key] ?? parseColumnWidth(col.width ?? col.minWidth)
    next[col.key] = cur + extra
  }
  return next
})

const tableInlineStyle = computed(() => {
  if (isColumnResizing.value) {
    return undefined
  }
  if (props.resizable) {
    if (props.columnLayout === 'auto' && !useStableColumnWidths.value) {
      return tableMinWidth.value
        ? { width: '100%', minWidth: tableMinWidth.value }
        : { width: '100%' }
    }
    const width = resizableTableWidth.value
    if (!width) return undefined
    // 列少时 width:100% 拉满容器；列多时靠 minWidth 撑开并横向滚动
    return { width: '100%', minWidth: tableMinWidth.value ?? width }
  }
  return tableMinWidth.value ? { minWidth: tableMinWidth.value } : undefined
})

/** 列最小/显式宽度之和（不含可任意压缩的流体列）。用于判断是否需要横向滚动。 */
function estimateRequiredTableWidth(): number {
  let sum = measurePrefixColumnWidth()
  if (showRowStatusColumn.value) sum += PREFIX_COL_WIDTH.status
  const widths = effectiveColumnWidths.value
  for (const col of displayColumns.value) {
    const stored = widths[col.key]
    if (typeof stored === 'number') {
      sum += stored
      continue
    }
    if (typeof col.width === 'number') {
      sum += col.width
      continue
    }
    if (col.minWidth !== undefined) {
      sum += typeof col.minWidth === 'number' ? col.minWidth : parseColumnWidth(col.minWidth, 0)
    }
  }
  return sum
}

/** 仅当列宽确需超过容器时开启横向滚动（避免纵向条引发的伪横向条）。 */
const overflowXEnabled = computed(() => {
  if (virtualColumnsEnabled.value) return true
  if (props.scrollX != null && props.scrollX !== '') return true
  const viewportW = measuredViewportWidth.value
  if (viewportW <= 0) return false
  if (useFixedColumnLayout.value) {
    const raw = resizableTableWidth.value
    const sum = raw ? Number.parseInt(raw, 10) : estimateRequiredTableWidth()
    return Number.isFinite(sum) && sum > viewportW
  }
  return estimateRequiredTableWidth() > viewportW
})

function measurePrefixColumnWidth(): number {
  let sum = 0
  if (showRowDragHandle.value) sum += PREFIX_COL_WIDTH.drag
  if (detailExpandable.value) sum += PREFIX_COL_WIDTH.expand
  if (showSelectColumn.value) sum += PREFIX_COL_WIDTH.select
  if (showEditGutterColumn.value) sum += resolvedGutterWidth.value
  else if (showIndexColumn.value) sum += resolvedIndexWidth.value
  return sum
}

function applyTableColumnWidths(table: HTMLTableElement, widths: Record<string, number>): void {
  let sum = measurePrefixColumnWidth()
  for (const column of displayColumns.value) {
    const col = table.querySelector<HTMLTableColElement>(\`colgroup col[data-col-key="\${column.key}"]\`)
    const width = widths[column.key] ?? parseColumnWidth(column.width ?? column.minWidth)
    if (col) col.style.width = \`\${width}px\`
    const th = table.querySelector<HTMLTableCellElement>(\`thead th[data-col-key="\${column.key}"]\`)
    if (th) th.style.width = \`\${width}px\`
    sum += width
  }
  table.style.width = \`\${sum}px\`
  const minWidth = tableMinWidth.value
  if (minWidth) table.style.minWidth = minWidth
}

function resolvedDataColumnWidth(key: string, fallback?: number | string): number {
  const stored = renderColumnWidths.value[key]
  if (typeof stored === 'number') return stored
  return parseColumnWidth(fallback)
}
const fixedColumnStyles = computed(() =>
  resolveFixedColumnStyles(displayColumns.value, renderColumnWidths.value, {
    selectable: showSelectColumn.value,
    showIndex: showIndexColumn.value,
    showEditGutter: showEditGutterColumn.value,
    gutterWidth: resolvedGutterWidth.value,
    indexWidth: resolvedIndexWidth.value,
    expandable: detailExpandable.value,
    rowDraggable: showRowDragHandle.value,
  }),
)
`,
  `/** 前缀列固定宽度（与 CSS 一致），用于 resizable 模式精确计算表格总宽 */
const PREFIX_COL_WIDTH = RS_TABLE_PREFIX_COL_WIDTH

const {
  tableRef,
  isColumnResizing,
  resizePaintWidths,
  onResizeStart,
  stopResize,
} = useRsTableColumnResize<T>({
  resizable: () => props.resizable,
  minColumnWidth: () => props.minColumnWidth,
  maxColumnWidth: () => props.maxColumnWidth,
  displayColumns: () => displayColumns.value,
  resolvedColumnWidths: {
    get: () => resolvedColumnWidths.value,
    set: (value) => {
      resolvedColumnWidths.value = value
    },
  },
  measurePrefixColumnWidth: () =>
    measureRsTablePrefixWidth({
      showRowDragHandle: showRowDragHandle.value,
      detailExpandable: detailExpandable.value,
      showSelectColumn: showSelectColumn.value,
      showEditGutterColumn: showEditGutterColumn.value,
      showIndexColumn: showIndexColumn.value,
      gutterWidth: resolvedGutterWidth.value,
      indexWidth: resolvedIndexWidth.value,
    }),
  tableMinWidth: () => tableMinWidth.value,
  onColumnResize: (key, width) => emit('columnResize', key, width),
})

/** 样式计算用：拖拽初始帧用快照，否则用持久化列宽 */
const effectiveColumnWidths = computed(() => resizePaintWidths.value ?? resolvedColumnWidths.value)

const {
  virtualColumnsEnabled,
  visibleDataColumns,
  columnPadLeft,
  columnPadRight,
} = useRsTableColumnVirtual<T>({
  displayColumns: () => displayColumns.value,
  virtualColumns: () => props.virtualColumns,
  virtualColumnsAutoThreshold: () => props.virtualColumnsAutoThreshold,
  virtualColumnOverscan: () => props.virtualColumnOverscan,
  isColumnResizing,
  scrollLeft,
  measuredViewportWidth,
  columnWidths: () => effectiveColumnWidths.value,
  showRowDragHandle,
  detailExpandable,
  showSelectColumn,
  showEditGutterColumn,
  showIndexColumn,
  showRowStatusColumn,
  resolvedGutterWidth,
  resolvedIndexWidth,
})

const {
  useFixedColumnLayout,
  renderColumnWidths,
  tableInlineStyle,
  overflowXEnabled,
  resolvedDataColumnWidth,
  columnStyleMap,
  columnHeaderStyleMap,
  columnTdClassMap,
  dragLeadStyle,
  expandLeadStyle,
  selectLeadStyle,
  indexLeadStyle,
  gutterLeadStyle,
  dragLeadHeaderStyle,
  expandLeadHeaderStyle,
  selectLeadHeaderStyle,
  indexLeadHeaderStyle,
  gutterLeadHeaderStyle,
} = useRsTableColumnLayout<T>({
  displayColumns: () => displayColumns.value,
  effectiveColumnWidths,
  measuredViewportWidth,
  tableMinWidth: () => tableMinWidth.value,
  resizable: () => props.resizable,
  columnLayout: () => props.columnLayout,
  useStableColumnWidths,
  isColumnResizing,
  virtualColumnsEnabled,
  scrollX: () => props.scrollX,
  showRowDragHandle,
  detailExpandable,
  showSelectColumn,
  showEditGutterColumn,
  showIndexColumn,
  showRowStatusColumn,
  resolvedGutterWidth,
  resolvedIndexWidth,
  dragColumnOffset,
  expandColumnOffset,
  selectColumnOffset,
  resizePaintWidths,
})

const useScrollContainer = computed(
  () => virtualScrollEnabled.value || props.infinite || virtualColumnsEnabled.value,
)

const scrollContainerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (useScrollContainer.value && !props.fill) {
    const resolvedHeight = resolveVirtualListHeight(props.height, 320)
    if (resolvedHeight) {
      style.height = resolvedHeight
      style.maxHeight = resolvedHeight
    }
  }
  if (showEditGutterColumn.value) {
    style['--rs-table-gutter-width'] = \`\${resolvedGutterWidth.value}px\`
  }
  if (showSelectColumn.value) {
    style['--rs-table-select-width'] = \`\${PREFIX_COL_WIDTH.select}px\`
  }
  if (showIndexColumn.value) {
    style['--rs-table-index-width'] = \`\${resolvedIndexWidth.value}px\`
  }
  return Object.keys(style).length ? style : undefined
})
`,
)

mustReplace(
  'style maps block',
  `let resizeState: {
  key: string
  startX: number
  startWidth: number
  currentWidth: number
  /** 拖拽开始时从 DOM 批量测量的各列宽度 */
  domSnapshot: Record<string, number>
  /** auto 模式：拖拽前已持久化的列宽 */
  persistedWidths: Record<string, number>
} | null = null
let resizeRafId = 0
let latestResizeClientX = 0
let resizeMoved = false

/** 列样式 Map：按 column.key 缓存，避免模板热路径每次创建新对象 */
const columnStyleMap = computed<Map<string, Record<string, string> | undefined>>(() => {
  const map = new Map<string, Record<string, string> | undefined>()
  for (const col of displayColumns.value) {
    const base = resolveColumnStyle(col, renderColumnWidths.value) ?? {}
    const fixed = fixedCellStyle(fixedColumnStyles.value.get(col.key))
    let merged: Record<string, string> | undefined
    if (fixed) merged = { ...base, ...fixed }
    else if (Object.keys(base).length) merged = base
    map.set(col.key, merged)
  }
  return map
})

/** 表头列样式：固定列需同时 sticky top + left/right */
const columnHeaderStyleMap = computed<Map<string, Record<string, string> | undefined>>(() => {
  const map = new Map<string, Record<string, string> | undefined>()
  for (const col of displayColumns.value) {
    const base = resolveColumnStyle(col, renderColumnWidths.value) ?? {}
    const fixed = fixedCellStyle(fixedColumnStyles.value.get(col.key), { header: true })
    let merged: Record<string, string> | undefined
    if (fixed) merged = { ...base, ...fixed }
    else if (Object.keys(base).length) merged = base
    map.set(col.key, merged)
  }
  return map
})

/** td 静态 class Map：列配置不变时复用，消除每行每列重复拼接 */
const columnTdClassMap = computed<Map<string, string[]>>(() => {
  const map = new Map<string, string[]>()
  for (const col of displayColumns.value) {
    const classes: string[] = [\`rs-table__cell--\${col.align ?? 'left'}\`]
    if (col.ellipsis) classes.push('rs-table__td--ellipsis')
    if (col.fixed) classes.push('rs-table__cell--fixed')
    map.set(col.key, classes)
  }
  return map
})

/** 4 个固定前缀列的 style（拖拽/展开/选择/序号），避免每行重复计算 */
const dragLeadStyle = computed(() => fixedCellStyle({ fixed: 'left', left: 0 }) ?? {})
const expandLeadStyle = computed(() => fixedCellStyle({ fixed: 'left', left: dragColumnOffset.value }) ?? {})
const selectLeadStyle = computed(() => fixedCellStyle({ fixed: 'left', left: expandColumnOffset.value }) ?? {})
const indexLeadStyle = computed(() => fixedCellStyle({ fixed: 'left', left: selectColumnOffset.value }) ?? {})
const gutterLeadStyle = computed(() => fixedCellStyle({ fixed: 'left', left: selectColumnOffset.value }) ?? {})
const dragLeadHeaderStyle = computed(() => fixedCellStyle({ fixed: 'left', left: 0 }, { header: true }) ?? {})
const expandLeadHeaderStyle = computed(() => fixedCellStyle({ fixed: 'left', left: dragColumnOffset.value }, { header: true }) ?? {})
const selectLeadHeaderStyle = computed(() => fixedCellStyle({ fixed: 'left', left: expandColumnOffset.value }, { header: true }) ?? {})
const indexLeadHeaderStyle = computed(() => fixedCellStyle({ fixed: 'left', left: selectColumnOffset.value }, { header: true }) ?? {})
const gutterLeadHeaderStyle = computed(() => fixedCellStyle({ fixed: 'left', left: selectColumnOffset.value }, { header: true }) ?? {})
`,
  '',
)

mustReplace(
  'resize handlers',
  `function beginResizeSession(): void {
  if (!resizeState || isColumnResizing.value) return
  isColumnResizing.value = true
  activeDragWidths = { ...resizeState.domSnapshot }
  resizePaintWidths.value = { ...activeDragWidths }
  void nextTick(() => {
    if (tableRef.value && activeDragWidths) applyTableColumnWidths(tableRef.value, activeDragWidths)
  })
}

function onResizeMove(event: MouseEvent): void {
  if (!resizeState) return
  latestResizeClientX = event.clientX
  if (!resizeMoved && Math.abs(latestResizeClientX - resizeState.startX) < 1) return
  if (!resizeMoved) {
    resizeMoved = true
    beginResizeSession()
  }
  if (resizeRafId !== 0) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = 0
    if (!resizeState || !activeDragWidths) return
    const nextWidth = clampColumnWidth(
      resizeState.startWidth + latestResizeClientX - resizeState.startX,
      props.minColumnWidth,
      props.maxColumnWidth,
    )
    resizeState.currentWidth = nextWidth
    activeDragWidths = { ...resizeState.domSnapshot, [resizeState.key]: nextWidth }
    if (tableRef.value) applyTableColumnWidths(tableRef.value, activeDragWidths)
  })
}

function stopResize(): void {
  if (resizeState && resizeMoved) {
    const finalWidth = clampColumnWidth(
      resizeState.startWidth + latestResizeClientX - resizeState.startX,
      props.minColumnWidth,
      props.maxColumnWidth,
    )
    if (finalWidth !== resizeState.startWidth) {
      const merged = { ...resizeState.domSnapshot, [resizeState.key]: finalWidth }
      resolvedColumnWidths.value = merged
      emit('columnResize', resizeState.key, finalWidth)
    }
  }
  if (tableRef.value) {
    tableRef.value.style.width = ''
    tableRef.value.style.minWidth = ''
    for (const th of tableRef.value.querySelectorAll<HTMLTableCellElement>('thead th[data-col-key]')) {
      th.style.width = ''
    }
  }
  isColumnResizing.value = false
  resizePaintWidths.value = null
  activeDragWidths = null
  resizeState = null
  resizeMoved = false
  if (resizeRafId !== 0) {
    cancelAnimationFrame(resizeRafId)
    resizeRafId = 0
  }
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', stopResize, { capture: true })
}

function onResizeStart(key: string, event: MouseEvent): void {
  if (!props.resizable) return

  const thEl = (event.currentTarget as HTMLElement).closest('th') as HTMLTableCellElement | null
  if (!thEl) return
  const tableEl = thEl.closest('table') as HTMLTableElement | null
  if (!tableEl) return

  const dataThs = Array.from(tableEl.querySelectorAll<HTMLTableCellElement>('thead th[data-col-key]'))
  const domSnapshot: Record<string, number> = {}
  for (const th of dataThs) {
    domSnapshot[th.dataset.colKey!] = th.offsetWidth
  }

  const startWidth = domSnapshot[key] ?? thEl.offsetWidth
  latestResizeClientX = event.clientX
  resizeMoved = false
  resizeState = {
    key,
    startX: event.clientX,
    startWidth,
    currentWidth: startWidth,
    domSnapshot,
    persistedWidths: { ...resolvedColumnWidths.value },
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', stopResize, { capture: true })
}

onUnmounted(() => {
  stopResize()
})
`,
  '',
)

fs.writeFileSync(path, s.replace(/\n/g, '\r\n'))
console.log('ok lines', s.split('\n').length)
