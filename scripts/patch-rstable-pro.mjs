/**
 * 将 scroll / column-virtual / summary / context-menu 接到 RsTable.vue
 */
import fs from 'node:fs'

const path = new URL('../src/components/RsTable.vue', import.meta.url)
let s = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

function mustReplace(label, from, to) {
  const needle = from.replace(/\r\n/g, '\n')
  if (!s.includes(needle)) {
    throw new Error(`patch miss: ${label}`)
  }
  s = s.replace(needle, to.replace(/\r\n/g, '\n'))
}

// --- imports ---
mustReplace(
  'import virtual',
  `import {
  flattenVisibleCountRough,
  useRsTableVirtual,
} from '../composables/useRsTableVirtual'
import RsTableSummaryRow from './table/RsTableSummaryRow.vue'
import {
  buildTableSummaryCells,
  hasTableSummaryConfig,
  warnSummaryCompatibility,
  type RsTableSummaryData,
  type RsTableSummaryMode,
} from './table/table-summary-utils'
import {
  createBuiltinTableFeatures,
  resolveBuiltinTableFeatures,
  setupTableFeatures,
} from './table/table-features'`,
  `import {
  flattenVisibleCountRough,
  useRsTableVirtual,
} from '../composables/useRsTableVirtual'
import { useRsTableScrollLayout } from '../composables/useRsTableScrollLayout'
import { RS_TABLE_PREFIX_COL_WIDTH, useRsTableColumnVirtual } from '../composables/useRsTableColumnVirtual'
import { useRsTableContextMenu } from '../composables/useRsTableContextMenu'
import { useRsTableSummary } from '../composables/useRsTableSummary'
import RsTableSummaryRow from './table/RsTableSummaryRow.vue'
import {
  type RsTableSummaryData,
  type RsTableSummaryMode,
} from './table/table-summary-utils'
import {
  createBuiltinTableFeatures,
  resolveBuiltinTableFeatures,
  setupTableFeatures,
} from './table/table-features'`,
)

mustReplace(
  'ctx menu imports',
  `import {
  buildDefaultTableContextMenuItems,
  resolveTableCellCopyText,
  resolveTableRowCopyText,
  TABLE_CTX_COPY_CELL,
  TABLE_CTX_COPY_ROW,
} from './table/table-context-menu'
import { copyTextToClipboard } from '../utils/rs-clipboard'
`,
  '',
)

mustReplace(
  'sliceVirtualColumns import',
  `  selectRowKeysByClick,
  sliceVirtualColumns,
  sliceVirtualHeightModel,
  resolveColumnPixelWidth,
`,
  `  selectRowKeysByClick,
  sliceVirtualHeightModel,
`,
)

// --- scroll block: from scrollTop through resetScrollPosition, keep drag offsets after ---
mustReplace(
  'scroll layout block',
  `const scrollTop = ref(0)
const scrollLeft = ref(0)
const loadMoreLocked = ref(false)

let viewportResizeObserver: ResizeObserver | null = null

/** keep-alive 恢复用：不受 DOM 清零 / 恢复期伪 scroll 事件干扰 */
let preservedScrollTop = 0
let preservedScrollLeft = 0
/** 正在把保存的滚动写回 DOM；期间忽略 scroll 事件，避免被清零覆盖 */
let restoringScroll = false
let restoreGeneration = 0

function syncMeasuredViewportSize(): void {
  const el = scrollContainerRef.value
  if (!el) return
  const nextH = el.clientHeight
  if (nextH > 0 && nextH !== measuredViewportHeight.value) {
    measuredViewportHeight.value = nextH
  }
  const nextW = el.clientWidth
  if (nextW > 0 && nextW !== measuredViewportWidth.value) {
    measuredViewportWidth.value = nextW
  }
}

/**
 * 失活前快照滚动。
 * DOM 脱离文档后 scrollTop 常为 0——切勿用 0 覆盖 onScroll 已写入的位置。
 */
function captureScrollFromDom(): void {
  const el = scrollContainerRef.value
  if (el) {
    if (el.scrollTop > 0) scrollTop.value = el.scrollTop
    if (el.scrollLeft > 0) scrollLeft.value = el.scrollLeft
  }
  if (scrollTop.value > 0) preservedScrollTop = scrollTop.value
  if (scrollLeft.value > 0) preservedScrollLeft = scrollLeft.value
}

/** 将内部保存的滚动写回 DOM，并同步 reactive（驱动虚拟切片）。 */
function restoreScrollToDom(): void {
  const el = scrollContainerRef.value
  if (!el) return
  syncMeasuredViewportSize()
  const top = preservedScrollTop
  const left = preservedScrollLeft
  if (scrollTop.value !== top) scrollTop.value = top
  if (scrollLeft.value !== left) scrollLeft.value = left
  if (el.scrollTop !== top) el.scrollTop = top
  if (el.scrollLeft !== left) el.scrollLeft = left
}

/**
 * 布局稳定后多次写回滚动：keep-alive 切回首帧 clientHeight 常为 0，
 * 需等 nextTick / rAF / 视口测稳后再设 scrollTop，否则会被浏览器钳成 0。
 */
function scheduleVirtualLayoutSync(): void {
  restoreGeneration += 1
  const gen = restoreGeneration
  restoringScroll = true
  const apply = (): void => {
    if (gen !== restoreGeneration) return
    restoreScrollToDom()
  }
  apply()
  void nextTick(() => {
    apply()
    requestAnimationFrame(() => {
      apply()
      requestAnimationFrame(() => {
        apply()
        if (gen === restoreGeneration) restoringScroll = false
      })
    })
  })
}

function resetScrollPosition(): void {
  preservedScrollTop = 0
  preservedScrollLeft = 0
  scrollTop.value = 0
  scrollLeft.value = 0
  const el = scrollContainerRef.value
  if (el) {
    el.scrollTop = 0
    el.scrollLeft = 0
  }
  scheduleVirtualLayoutSync()
}

const dragColumnOffset`,
  `const loadMoreLocked = ref(false)

const {
  scrollTop,
  scrollLeft,
  scrollContainerRef,
  measuredViewportHeight,
  measuredViewportWidth,
  viewportHeight,
  syncMeasuredViewportSize,
  captureScrollFromDom,
  scheduleVirtualLayoutSync,
  resetScrollPosition,
  onScrollFrame,
  bindScrollElement,
} = useRsTableScrollLayout({
  height: () => props.height,
  layoutActive: () => props.layoutActive,
  viewKey: () => props.viewKey,
})

const dragColumnOffset`,
)

mustReplace(
  'old viewport refs',
  `const fixedRowHeight = computed(() => resolveTableRowHeight(resolvedSize.value, props.rowHeight))
const scrollContainerRef = ref<HTMLElement | null>(null)
const measuredViewportHeight = ref(0)
const measuredViewportWidth = ref(0)
const viewportHeight = computed(() => {
  if (typeof props.height === 'number' && props.height > 0) return props.height
  if (typeof props.height === 'string') {
    const parsed = Number.parseInt(props.height, 10)
    if (Number.isFinite(parsed) && parsed > 0 && !props.height.includes('%')) return parsed
  }
  if (measuredViewportHeight.value > 0) return measuredViewportHeight.value
  const el = scrollContainerRef.value
  if (el && el.clientHeight > 0) return el.clientHeight
  return 320
})
const tableMinWidth = computed(() => resolveScrollWidth(props.scrollX))
`,
  `const fixedRowHeight = computed(() => resolveTableRowHeight(resolvedSize.value, props.rowHeight))
const tableMinWidth = computed(() => resolveScrollWidth(props.scrollX))
`,
)

// --- summary + features block ---
mustReplace(
  'summary block',
  `/**
 * 按 props 解析内置 feature id（selection/sort/virtual/summary 等）。
 * 当前多为占位注册；真实行为仍在 Engine / 本组件既有路径。
 */
const builtinFeatureIds = computed(() =>
  resolveBuiltinTableFeatures({
    selectable: props.selectable,
    filterable: props.columns.some((c) => c.filterable),
    virtual: props.virtual === false ? false : props.virtual ?? 'auto',
    editable: props.editable,
    tree: Boolean(props.treeConfig),
    contextMenu: props.contextMenu !== false,
    summary:
      props.showSummary ||
      hasTableSummaryConfig({
        columns: props.columns,
        mode: props.summaryMode,
        summaryData: props.summaryData,
      }),
  }),
)

/** 是否启用汇总能力（showSummary / 列 summary / server summaryData） */
const summaryFeatureEnabled = computed(() => builtinFeatureIds.value.includes('summary'))

/**
 * footer 汇总单元格：基于 Engine.viewRows + displayColumns。
 * client 本地聚合；server 展示 summaryData。
 */
const summaryCells = computed(() => {
  if (!summaryFeatureEnabled.value) return []
  return buildTableSummaryCells({
    columns: displayColumns.value,
    rows: viewRows.value,
    mode: props.summaryMode,
    summaryData: props.summaryData,
  })
})

/** 有 #summary 插槽时不渲染内置汇总行，交由业务完全接管 */
const showBuiltinSummaryRow = computed(
  () => summaryFeatureEnabled.value && !slots.summary,
)

/** 与表体前缀列对齐的 colspan（拖拽/展开/选择/序号/状态） */
const summaryPrefixColspan = computed(() => {
  let n = 0
  if (showRowDragHandle.value) n += 1
  if (detailExpandable.value) n += 1
  if (showSelectColumn.value) n += 1
  if (showEditGutterColumn.value || showIndexColumn.value) n += 1
  if (showRowStatusColumn.value) n += 1
  return n
})

if (import.meta.env.DEV) {
  watch(
    () => [summaryFeatureEnabled.value, treeMode.value, detailExpandable.value] as const,
    ([summaryEnabled, tree, detail]) => {
      warnSummaryCompatibility({
        summaryEnabled,
        tree,
        detailExpandable: detail,
      })
    },
    { immediate: true },
  )
}

/** 特性插件生命周期：ids 变化时 teardown 再 setup；卸载时统一 dispose */
let disposeTableFeatures: (() => void) | null = null
watch(
  builtinFeatureIds,
  (ids) => {
    disposeTableFeatures?.()
    disposeTableFeatures = setupTableFeatures(createBuiltinTableFeatures(ids), {
      getViewRows: () => viewRows.value,
      getSelectedRows: () => selectedRows.value,
    })
  },
  { immediate: true },
)
onUnmounted(() => {
  disposeTableFeatures?.()
  disposeTableFeatures = null
})


onMounted(() => {
  scheduleVirtualLayoutSync()
  const el = scrollContainerRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  viewportResizeObserver = new ResizeObserver(() => {
    const prevH = measuredViewportHeight.value
    syncMeasuredViewportSize()
    // keep-alive 切回：视口从 0→实高时再写一次，否则虚拟切片按错误高度算完后滚动会被钳掉
    if (
      prevH === 0 &&
      measuredViewportHeight.value > 0 &&
      (preservedScrollTop > 0 || preservedScrollLeft > 0)
    ) {
      restoringScroll = true
      restoreScrollToDom()
      requestAnimationFrame(() => {
        restoringScroll = false
      })
    }
  })
  viewportResizeObserver.observe(el)
})

onActivated(() => {
  scheduleVirtualLayoutSync()
})

onDeactivated(() => {
  captureScrollFromDom()
})

/** 失活同步快照：须在 DOM scrollTop 被清零前（或依赖 onScroll 已写入的值）。 */
watch(
  () => props.layoutActive,
  (active, prev) => {
    if (active === false && prev !== false) {
      captureScrollFromDom()
    }
  },
  { flush: 'sync' },
)

/** 激活后再测视口并写回滚动（需等布局稳定）。 */
watch(
  () => props.layoutActive,
  (active) => {
    if (active) scheduleVirtualLayoutSync()
  },
  { flush: 'post' },
)

watch(
  () => props.viewKey,
  (_next, prev) => {
    if (prev === undefined) return
    resetScrollPosition()
  },
)

/** 前缀列固定宽度（与 CSS 一致），用于 resizable 模式精确计算表格总宽 */
const PREFIX_COL_WIDTH = {
  drag: 40,
  expand: 40,
  select: 40,
  status: 52,
} as const
`,
  `const {
  summaryFeatureEnabled,
  summaryCells,
  showBuiltinSummaryRow,
  summaryPrefixColspan,
} = useRsTableSummary<T>({
  showSummary: () => props.showSummary,
  summaryMode: () => props.summaryMode,
  summaryData: () => props.summaryData,
  columns: () => props.columns,
  displayColumns: () => displayColumns.value,
  viewRows: () => viewRows.value,
  hasSummarySlot: () => Boolean(slots.summary),
  treeMode,
  detailExpandable,
  showRowDragHandle,
  showSelectColumn,
  showEditGutterOrIndex: () => showEditGutterColumn.value || showIndexColumn.value,
  showRowStatusColumn,
})

/** 按 props 解析内置 feature id；行为真源见各 useRsTable* composable */
const builtinFeatureIds = computed(() =>
  resolveBuiltinTableFeatures({
    selectable: props.selectable,
    filterable: props.columns.some((c) => c.filterable),
    virtual: props.virtual === false ? false : props.virtual ?? 'auto',
    editable: props.editable,
    tree: Boolean(props.treeConfig),
    contextMenu: props.contextMenu !== false,
    summary: summaryFeatureEnabled.value,
  }),
)

/** 特性插件生命周期：ids 变化时 teardown 再 setup；卸载时统一 dispose */
let disposeTableFeatures: (() => void) | null = null
watch(
  builtinFeatureIds,
  (ids) => {
    disposeTableFeatures?.()
    disposeTableFeatures = setupTableFeatures(createBuiltinTableFeatures(ids), {
      getViewRows: () => viewRows.value,
      getSelectedRows: () => selectedRows.value,
    })
  },
  { immediate: true },
)
onUnmounted(() => {
  disposeTableFeatures?.()
  disposeTableFeatures = null
})

onMounted(() => {
  scheduleVirtualLayoutSync()
  bindScrollElement(scrollContainerRef.value)
})

onActivated(() => {
  scheduleVirtualLayoutSync()
})

onDeactivated(() => {
  captureScrollFromDom()
})

/** 前缀列固定宽度（与 CSS 一致），用于 resizable 模式精确计算表格总宽 */
const PREFIX_COL_WIDTH = RS_TABLE_PREFIX_COL_WIDTH
`,
)

// --- column virtual block ---
mustReplace(
  'column virtual',
  `const dataColumnWidth = (column: RsTableColumn<T>): number =>
  resolveColumnPixelWidth(column, effectiveColumnWidths.value)

/** 左/右冻结列始终实体渲染；中间列参与横向虚拟化 */
const leftFixedDataColumns = computed(() => displayColumns.value.filter((c) => c.fixed === 'left'))
const rightFixedDataColumns = computed(() => displayColumns.value.filter((c) => c.fixed === 'right'))
const fluidDataColumns = computed(() => displayColumns.value.filter((c) => !c.fixed))

const virtualColumnsEnabled = computed(() => {
  if (props.virtualColumns === false) return false
  if (isColumnResizing.value) return false
  if (props.virtualColumns === true) return fluidDataColumns.value.length > 0
  // 'auto'：按列数阈值
  const threshold = props.virtualColumnsAutoThreshold ?? 0
  return threshold > 0 && fluidDataColumns.value.length >= threshold
})

const fluidLeadingOffset = computed(() => {
  let sum = 0
  if (showRowDragHandle.value) sum += PREFIX_COL_WIDTH.drag
  if (detailExpandable.value) sum += PREFIX_COL_WIDTH.expand
  if (showSelectColumn.value) sum += PREFIX_COL_WIDTH.select
  if (showEditGutterColumn.value) sum += resolvedGutterWidth.value
  else if (showIndexColumn.value) sum += resolvedIndexWidth.value
  if (showRowStatusColumn.value) sum += PREFIX_COL_WIDTH.status
  for (const col of leftFixedDataColumns.value) sum += dataColumnWidth(col)
  return sum
})

const columnVirtualSlice = computed(() => {
  const fluidCount = fluidDataColumns.value.length
  if (!virtualColumnsEnabled.value) {
    return {
      columns: displayColumns.value,
      paddingLeft: 0,
      paddingRight: 0,
      startIndex: 0,
      endIndex: fluidCount,
      fluidCount,
    }
  }
  const viewport = Math.max(measuredViewportWidth.value || 320, 120)
  const midScroll = Math.max(0, scrollLeft.value - fluidLeadingOffset.value)
  const midViewport = Math.max(120, viewport - Math.min(viewport - 40, fluidLeadingOffset.value))
  const sliced = sliceVirtualColumns(fluidDataColumns.value, {
    scrollLeft: midScroll,
    viewportWidth: midViewport,
    getWidth: dataColumnWidth,
    overscan: props.virtualColumnOverscan ?? 2,
  })
  return {
    columns: [
      ...leftFixedDataColumns.value,
      ...sliced.columns,
      ...rightFixedDataColumns.value,
    ],
    paddingLeft: sliced.paddingLeft,
    paddingRight: sliced.paddingRight,
    startIndex: sliced.startIndex,
    endIndex: sliced.endIndex,
    fluidCount,
  }
})

const visibleDataColumns = computed(() => columnVirtualSlice.value.columns)
const columnPadLeft = computed(() => columnVirtualSlice.value.paddingLeft)
const columnPadRight = computed(() => columnVirtualSlice.value.paddingRight)
`,
  `const {
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
`,
)

// --- context menu block ---
mustReplace(
  'context menu',
  `/** 当前右键行（null = 表体空白区域或尚未命中行） */
const ctxRow = ref<T | null>(null)
const ctxRowIndex = ref<number | null>(null)
/** 右键命中的数据列 key；行空白区右键时为 null */
const ctxColKey = ref<string | null>(null)
const ctxMenuItems = ref<RsContextMenuItem[]>([])

/**
 * 重建右键菜单项：默认「复制单元格/行」+ 业务 contextMenuItems。
 *
 * 有数据时即使尚未命中具体行/列，也预置复制项，避免 ContextMenuTrigger
 * 在捕获阶段之后、items 仍为空时拒开菜单。
 */
function refreshCtxMenuItems(): void {
  if (!contextMenuEnabled.value) {
    ctxMenuItems.value = []
    return
  }

  const hasDataRows = dataRows.value.length > 0
  const items = buildDefaultTableContextMenuItems({
    copyCellLabel: t('table.copyCell'),
    copyRowLabel: t('table.copyRow'),
    hasRow: ctxRow.value != null || hasDataRows,
    hasCell: ctxColKey.value != null || hasDataRows,
  })

  const custom = props.contextMenuItems?.(ctxRow.value as T | null, selectedRows.value) ?? []
  if (custom.length > 0) {
    if (items.length > 0) {
      items.push({ key: '__ctx-sep', label: '', separator: true })
    }
    items.push(...custom)
  }

  ctxMenuItems.value = items
}

watch(
  () => [contextMenuEnabled.value, dataRows.value.length] as const,
  () => {
    refreshCtxMenuItems()
  },
  { immediate: true },
)

async function copyCtxCell(): Promise<void> {
  if (!ctxRow.value || ctxRowIndex.value == null || !ctxColKey.value) return
  const column = displayColumns.value.find((item) => item.key === ctxColKey.value)
  if (!column) return
  const key = resolveRowKey(ctxRow.value, ctxRowIndex.value, props.rowKey)
  const text = resolveTableCellCopyText(
    ctxRow.value,
    column,
    ctxRowIndex.value,
    tableEdit.getDraft(key, column.key),
  )
  await copyTextToClipboard(text)
}

async function copyCtxRow(): Promise<void> {
  if (!ctxRow.value || ctxRowIndex.value == null) return
  const key = resolveRowKey(ctxRow.value, ctxRowIndex.value, props.rowKey)
  const text = resolveTableRowCopyText(
    ctxRow.value,
    ctxRowIndex.value,
    displayColumns.value,
    tableEdit.getDraft,
    key,
  )
  await copyTextToClipboard(text)
}

async function onCtxMenuSelect(key: string): Promise<void> {
  if (key === TABLE_CTX_COPY_CELL) {
    await copyCtxCell()
    emit('contextMenuSelect', key, ctxRow.value as T | null, selectedRows.value)
    return
  }
  if (key === TABLE_CTX_COPY_ROW) {
    await copyCtxRow()
    emit('contextMenuSelect', key, ctxRow.value as T | null, selectedRows.value)
    return
  }
  emit('contextMenuSelect', key, ctxRow.value as T | null, selectedRows.value)
}

/**
 * 右键行前准备：可选地选中该行，并写入 ctxRow / ctxRowIndex。
 * selectOnContextmenu 默认跟随 selectable。
 */
function prepareRowContextmenu(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): void {
  const shouldSelect = props.selectOnContextmenu ?? props.selectable
  if (shouldSelect && canSelectRow(entry) && !isRowSelected(entry)) {
    selectedRowKeys.value = selectRowKeys(selectedRowKeys.value, rowKeyFor(entry), props.selectionType)
  }
  if (contextMenuEnabled.value) {
    ctxRow.value = entry.row
    ctxRowIndex.value = entry.rowIndex
  }
}

/**
 * 捕获阶段：根据 data-row-key / data-col-key 预填右键上下文并刷新菜单项。
 * 必须早于 ContextMenuTrigger 冒泡打开，否则 items 仍为空会被拒开。
 */
function onContextmenuCapture(event: MouseEvent): void {
  if (!contextMenuEnabled.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  const tr = target.closest('tr.rs-table__row') as HTMLElement | null
  if (!tr) return
  const rowKeyAttr = tr.getAttribute('data-row-key')
  if (!rowKeyAttr) return
  const entry = dataRows.value.find(
    (item) => (item.treeKey ?? rowKeyByIndex.value.get(item.rowIndex) ?? '') === rowKeyAttr,
  )
  if (!entry) return
  prepareRowContextmenu(entry)
  const td = target.closest('td.rs-table__td--data') as HTMLElement | null
  const colKey = td?.getAttribute('data-col-key')
  ctxColKey.value = colKey || null
  refreshCtxMenuItems()
}

function onTableContextmenu(event: MouseEvent): void {
  if (!contextMenuEnabled.value) return
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
  emit('rowContextmenu', entry.row, entry.rowIndex, event)
}

function onCellContextmenu(entry: RsTableRowEntry<T>, colKey: string, event: MouseEvent): void {
  if (entry.type !== 'row') return
  prepareRowContextmenu(entry)
  ctxColKey.value = colKey
  refreshCtxMenuItems()
  emit('rowContextmenu', entry.row, entry.rowIndex, event)
}

/** 从缓存 Map 中 O(1) 取行 key，消除重复 resolveRowKey 调用 */
function rowKeyFor(entry: Extract<RsTableRowEntry<T>, { type: 'row' }>): string {
  return (
    rowKeyByIndex.value.get(entry.rowIndex) ??
    entry.treeKey ??
    resolveRowKey(entry.row, entry.rowIndex, props.rowKey)
  )
}
`,
  `const {
  ctxMenuItems,
  onCtxMenuSelect,
  onContextmenuCapture,
  onTableContextmenu,
  onRowContextmenu,
  onCellContextmenu,
  rowKeyFor,
} = useRsTableContextMenu<T>({
  enabled: contextMenuEnabled,
  dataRows: () => dataRows.value,
  displayColumns: () => displayColumns.value,
  selectedRows: () => selectedRows.value,
  rowKey: () => props.rowKey,
  rowKeyByIndex: () => rowKeyByIndex.value,
  copyCellLabel: () => t('table.copyCell'),
  copyRowLabel: () => t('table.copyRow'),
  contextMenuItems: (row, selected) => props.contextMenuItems?.(row, selected) ?? [],
  shouldSelectOnContextmenu: () => props.selectOnContextmenu ?? props.selectable,
  canSelectRow,
  isRowSelected,
  selectionType: () => props.selectionType,
  getSelectedRowKeys: () => selectedRowKeys.value,
  setSelectedRowKeys: (keys) => {
    selectedRowKeys.value = keys
  },
  selectRowKeys,
  getDraft: tableEdit.getDraft,
  onSelect: (key, row, selected) => emit('contextMenuSelect', key, row, selected),
  onRowContextmenu: (row, rowIndex, event) => emit('rowContextmenu', row, rowIndex, event),
})
`,
)

// --- onScroll + onUnmounted cleanup ---
mustReplace(
  'onScroll',
  `/** RAF handle，用于节流滚动更新；组件卸载时取消，防止内存泄漏 */
let scrollRafId = 0

function onScroll(event: Event): void {
  hideCellTooltip()
  // 保留编辑草稿：虚拟滚动卸载行后滚回仍可恢复编辑态
  const element = event.target as HTMLElement
  // 无限加载判断不节流，保证触底灵敏
  if (props.infinite && !props.loading && !props.loadingMore && props.hasMore && !loadMoreLocked.value) {
    if (isNearScrollBottom(element.scrollTop, element.scrollHeight, element.clientHeight, props.infiniteDistance)) {
      loadMoreLocked.value = true
      emit('loadMore')
    }
  }
  // 始终记录滚动（含非虚拟），供 keep-alive / layoutActive 切回后恢复
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    // 恢复窗口内浏览器常先抛出 scrollTop=0 的伪事件，忽略以免冲掉已保存位置
    if (restoringScroll) {
      scrollRafId = 0
      return
    }
    scrollTop.value = element.scrollTop
    scrollLeft.value = element.scrollLeft
    preservedScrollTop = element.scrollTop
    preservedScrollLeft = element.scrollLeft
    scrollRafId = 0
  })
}
`,
  `function onScroll(event: Event): void {
  hideCellTooltip()
  const element = event.target as HTMLElement
  // 无限加载判断不节流，保证触底灵敏
  if (props.infinite && !props.loading && !props.loadingMore && props.hasMore && !loadMoreLocked.value) {
    if (isNearScrollBottom(element.scrollTop, element.scrollHeight, element.clientHeight, props.infiniteDistance)) {
      loadMoreLocked.value = true
      emit('loadMore')
    }
  }
  onScrollFrame(element)
}
`,
)

mustReplace(
  'onUnmounted cleanup',
  `onUnmounted(() => {
  stopResize()
  viewportResizeObserver?.disconnect()
  viewportResizeObserver = null
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = 0
  }
})
`,
  `onUnmounted(() => {
  stopResize()
})
`,
)

fs.writeFileSync(path, s.replace(/\n/g, '\r\n'))
console.log('patched RsTable.vue, lines:', s.split('\n').length)
