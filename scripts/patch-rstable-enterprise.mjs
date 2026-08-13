import fs from 'node:fs'

const path = new URL('../src/components/RsTable.vue', import.meta.url)
let s = fs.readFileSync(path, 'utf8')

function mustInclude(label, ok) {
  if (!ok) throw new Error(label)
}

// ── 1) imports ──────────────────────────────────────────────
const importNeedle = "import { useTableRowHighlight } from '../composables/useTableRowHighlight'"
if (!s.includes('useRsTableEngine')) {
  mustInclude('import needle', s.includes(importNeedle))
  s = s.replace(
    importNeedle,
    `${importNeedle}
import { useRsTableColumns } from '../composables/useRsTableColumns'
import { useRsTableEngine } from '../composables/useRsTableEngine'
import {
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
  )
}

// ── 2) summary props ────────────────────────────────────────
if (!s.includes('summaryMode?:')) {
  const viewKeyIdx = s.indexOf('视图切换标识：变化时重置滚动位置')
  mustInclude('viewKey comment', viewKeyIdx >= 0)
  const insertAt = s.lastIndexOf('/**', viewKeyIdx)
  mustInclude('prop comment start', insertAt >= 0)
  s =
    s.slice(0, insertAt) +
    `/**
     * 汇总模式：client 对当前 viewRows 聚合；server 仅展示 summaryData。
     */
    summaryMode?: RsTableSummaryMode
    /** 服务端汇总数据（列 key → 值）；summaryMode=server 时使用 */
    summaryData?: RsTableSummaryData | null
    /**
     * 是否启用列汇总行（也可仅靠 #summary 插槽）。
     * 为 true 或列上配置了 summary / 传入 summaryData 时渲染内置汇总行。
     */
    showSummary?: boolean
    ` +
    s.slice(insertAt)
}

if (!s.includes("summaryMode: 'client'")) {
  const ctxIdx = s.indexOf('contextMenu: true,')
  mustInclude('contextMenu default', ctxIdx >= 0)
  const insertPos = ctxIdx + 'contextMenu: true,'.length
  s =
    s.slice(0, insertPos) +
    `\n    summaryMode: 'client',\n    showSummary: false,` +
    s.slice(insertPos)
}

// ── 3) Replace state+columns+tree+sort block ONLY up to viewportResizeObserver ──
const startMarker = 'const internalSort = ref<RsTableSortState | null>(props.defaultSort ?? null)'
const endMarker = 'let viewportResizeObserver: ResizeObserver | null = null'
const start = s.indexOf(startMarker)
const end = s.indexOf(endMarker)
mustInclude('start marker', start >= 0)
mustInclude('end marker before viewport', end >= 0)
mustInclude('order', start < end)

const wiring = `// ── Engine / Columns（企业级抽离）────────────────────────────────
const treeModeEarly = computed(() => Boolean(props.treeConfig))
const treeExpandColumnKeyEarly = computed(() => {
  if (!props.treeConfig) return null
  return props.treeConfig.expandColumnKey ?? props.columns[0]?.key ?? null
})
const treeFixExpandColumnEarly = computed(() => props.treeConfig?.fixExpandColumn !== false)

const {
  columnOrderState,
  columnFiltersState,
  displayColumns,
  internalColumnWidths,
  resolvedColumnWidths,
  useStableColumnWidths,
  updateColumnFilter,
  columnFilterValue,
  internalColumnOrder,
  isColumnOrderControlled,
} = useRsTableColumns<T>({
  columns: () => props.columns,
  columnOrder: () => props.columnOrder,
  defaultColumnOrder: props.defaultColumnOrder,
  columnFilters: () => props.columnFilters,
  defaultColumnFilters: props.defaultColumnFilters ?? {},
  initialColumnWidths: () => props.initialColumnWidths,
  resizable: () => props.resizable,
  columnLayout: () => props.columnLayout,
  treeMode: treeModeEarly,
  treeFixExpandColumn: treeFixExpandColumnEarly,
  treeExpandColumnKey: treeExpandColumnKeyEarly,
  emit: emit as any,
})

const resolvedSize = computed(() => resolveTableSize(props.compact, props.size))

const {
  sortState,
  sortsState,
  selectedRowKeys,
  selectedKeySet,
  expandedRowKeys,
  expandedKeySet,
  treeMode,
  detailExpandable,
  treeChildrenField,
  treeIsLeafField,
  treeLazy,
  treeCheckStrictly,
  treeIndentPx,
  treeExpandColumnKey,
  treeFixExpandColumn,
  treeLoadingKeys,
  treeLoadingKeySet,
  tableTreeNodeIndex,
  tableEntries,
  dataRows,
  selectableRowKeys,
  rowKeyByIndex,
  selectedRows,
  selectAllState,
  viewRows,
  internalSelectedRowKeys,
  internalExpandedRowKeys,
  isExpandedControlled,
  isSelectionControlled,
} = useRsTableEngine<T>({
  data: () => props.data,
  displayColumns: () => displayColumns.value,
  rowKey: () => props.rowKey,
  sort: () => props.sort,
  defaultSort: props.defaultSort ?? null,
  sorts: () => props.sorts,
  defaultSorts: props.defaultSorts,
  multiSort: () => props.multiSort,
  remoteSort: () => props.remoteSort,
  filterText: () => props.filterText,
  filterKeys: () => props.filterKeys,
  columnFilters: () => columnFiltersState.value,
  groupBy: () => props.groupBy,
  groupLabel: () => props.groupLabel,
  treeConfig: () => props.treeConfig,
  expandable: () => props.expandable,
  rowExpandable: () => props.rowExpandable,
  selectedRowKeys: () => props.selectedRowKeys,
  defaultSelectedRowKeys: props.defaultSelectedRowKeys,
  expandedRowKeys: () => props.expandedRowKeys,
  defaultExpandedRowKeys: props.defaultExpandedRowKeys,
  rowSelectable: () => props.rowSelectable,
  size: resolvedSize,
  emit: emit as any,
})

const tableEntriesForThreshold = computed(() => {
  if (!props.treeConfig) return props.data.length
  return flattenVisibleCountRough(props.data, expandedKeySet.value, {
    childrenField: treeChildrenField.value,
    isLeafField: treeIsLeafField.value,
    lazy: treeLazy.value,
    rowKey: props.rowKey,
  })
})

const dragColumnKey = ref<string | null>(null)
const dropColumnKey = ref<string | null>(null)
const rowDragState = createTableRowDragState()
const { dragRowKeys, dropRowTargetKey, dropRowPosition } = rowDragState
const showRowDragHandle = computed(
  () => props.rowDraggable && props.rowDragTrigger === 'handle',
)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const loadMoreLocked = ref(false)

`

s = s.slice(0, start) + wiring + s.slice(end)

// ── 4) After scroll/viewport setup, inject virtual composable and remove old virtual/tableEntries ──
// Find: const tableMinWidth = computed(() => resolveScrollWidth(props.scrollX))
// After viewKey watch, old code has PREFIX then column virtual then tableEntries.
// Replace from "const virtualScrollEnabled" OR "const tableEntriesForThreshold" if still present,
// through selectAllState, with virtual composable + summary + features.

// Remove leftover flattenVisibleCountRough if present
s = s.replace(
  /function flattenVisibleCountRough[\s\S]*?return count\n\}\n\n/,
  '',
)

// Remove old virtualScrollEnabled / tableEntriesForThreshold if still present before PREFIX
s = s.replace(
  /const virtualScrollEnabled = computed\(\(\) => \{[\s\S]*?return Boolean\(props\.fill && threshold > 0 && rowCount >= threshold\)\n\}\)\n\n\/\*\*[\s\S]*?const tableEntriesForThreshold = computed\(\(\) => \{[\s\S]*?\}\)\n\n/,
  '',
)

// Insert virtual+summary after tableMinWidth
const minWidthNeedle = 'const tableMinWidth = computed(() => resolveScrollWidth(props.scrollX))'
const minWidthIdx = s.indexOf(minWidthNeedle)
mustInclude('tableMinWidth', minWidthIdx >= 0)
const minWidthEnd = minWidthIdx + minWidthNeedle.length

const virtualBlock = `

const {
  virtualScrollEnabled,
  virtualHeightModel,
  virtualSlice,
  visibleEntries,
} = useRsTableVirtual<T>({
  dataLength: () => props.data.length,
  treeMode,
  tableEntriesForThreshold,
  virtual: () => props.virtual,
  virtualAutoThreshold: () => props.virtualAutoThreshold ?? 0,
  fill: () => props.fill,
  infinite: () => Boolean(props.infinite),
  virtualOnInfinite: () => props.virtualOnInfinite !== false,
  overscan: () => props.overscan,
  expandRowHeight: () => props.expandRowHeight,
  scrollTop,
  viewportHeight,
  fixedRowHeight,
  tableEntries: () => tableEntries.value,
})

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

const summaryFeatureEnabled = computed(() => builtinFeatureIds.value.includes('summary'))

const summaryCells = computed(() => {
  if (!summaryFeatureEnabled.value) return []
  return buildTableSummaryCells({
    columns: displayColumns.value,
    rows: viewRows.value,
    mode: props.summaryMode,
    summaryData: props.summaryData,
  })
})

const showBuiltinSummaryRow = computed(
  () => summaryFeatureEnabled.value && !slots.summary,
)

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
`

if (!s.includes('useRsTableVirtual<T>')) {
  s = s.slice(0, minWidthEnd) + virtualBlock + s.slice(minWidthEnd)
}

// Ensure drag/expand/select offsets exist (may have been in removed section)
if (!s.includes('const dragColumnOffset = computed')) {
  const insertAfterLoadMore = s.indexOf('const loadMoreLocked = ref(false)')
  mustInclude('loadMoreLocked', insertAfterLoadMore >= 0)
  const lineEnd = s.indexOf('\n', insertAfterLoadMore)
  s =
    s.slice(0, lineEnd + 1) +
    `
const dragColumnOffset = computed(() => (showRowDragHandle.value ? 40 : 0))
const expandColumnOffset = computed(() => dragColumnOffset.value + (detailExpandable.value ? 40 : 0))
const showSelectColumn = computed(
  () => props.selectable && props.selectionType !== 'row',
)
const isRowSelection = computed(() => props.selectable && props.selectionType === 'row')
const selectColumnOffset = computed(
  () => expandColumnOffset.value + (showSelectColumn.value ? 40 : 0),
)
const selectionAnchorKey = ref<string | null>(null)

const fixedRowHeight = computed(() => resolveTableRowHeight(resolvedSize.value, props.rowHeight))
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
` +
    s.slice(lineEnd + 1)
}

// Remove duplicate tableEntries / virtualHeightModel / virtualSlice / rowDerived / selectedRows / selectAllState
const te = s.indexOf('const tableEntries = computed(() => {')
// first occurrence should be inside engine - but engine returns tableEntries, so there should be NO const tableEntries = computed in file
// If found, it's leftover - remove through selectAllState
if (te >= 0) {
  const selAll = s.indexOf(
    'const selectAllState = computed(() => resolveSelectAllState(selectedRowKeys.value, selectableRowKeys.value))',
    te,
  )
  mustInclude('leftover selectAllState', selAll >= 0)
  const selAllEnd =
    selAll +
    'const selectAllState = computed(() => resolveSelectAllState(selectedRowKeys.value, selectableRowKeys.value))'
      .length
  // Also remove virtualHeightModel/virtualSlice/DEV watches/visibleEntries/hasData/emptyContent before bodyColspan if in this range
  let cutEnd = selAllEnd
  const hasData = s.indexOf('const hasData = computed', selAllEnd)
  const bodyColspan = s.indexOf('const bodyColspan = computed', selAllEnd)
  if (hasData >= 0 && bodyColspan >= 0 && hasData < bodyColspan) {
    // keep hasData onward
    cutEnd = hasData
  } else if (bodyColspan >= 0) {
    cutEnd = bodyColspan
  }
  s = s.slice(0, te) + s.slice(cutEnd)
}

// Remove leftover virtualHeightModel/virtualSlice if still present as standalone (before bodyColspan)
const vhm = s.indexOf('const virtualHeightModel = computed(() =>')
if (vhm >= 0 && !s.slice(vhm, vhm + 80).includes('useRsTableVirtual')) {
  const bodyColspan = s.indexOf('const bodyColspan = computed', vhm)
  const hasData = s.indexOf('const hasData = computed', vhm)
  const cutEnd = hasData >= 0 && hasData < bodyColspan ? hasData : bodyColspan
  mustInclude('cut virtual leftover', cutEnd >= 0)
  s = s.slice(0, vhm) + s.slice(cutEnd)
}

if (!s.includes('const hasData = computed')) {
  s = s.replace(
    'const bodyColspan = computed(() => {',
    `const hasData = computed(() => dataRows.value.length > 0)

const emptyContentStyle = computed(() => {
  const w = measuredViewportWidth.value
  if (w <= 0) return undefined
  return { width: \`\${w}px\` }
})

const bodyColspan = computed(() => {`,
  )
}

// Ensure visibleEntries alias exists (from virtual composable)
mustInclude('visibleEntries from virtual', s.includes('visibleEntries'))

// ── 5) tfoot ────────────────────────────────────────────────
const oldTfoot = `<tfoot v-if="$slots.summary" class="rs-table__foot">
        <tr>
          <td class="rs-table__summary" :colspan="bodyColspan">
            <slot name="summary" />
          </td>
        </tr>
      </tfoot>`
const newTfoot = `<tfoot v-if="$slots.summary || showBuiltinSummaryRow" class="rs-table__foot">
        <tr v-if="$slots.summary">
          <td class="rs-table__summary" :colspan="bodyColspan">
            <slot name="summary" />
          </td>
        </tr>
        <RsTableSummaryRow
          v-else
          :columns="visibleDataColumns"
          :cells="summaryCells"
          :prefix-colspan="summaryPrefixColspan"
          :pad-left="columnPadLeft"
          :pad-right="columnPadRight"
        />
      </tfoot>`

if (s.includes('showBuiltinSummaryRow') && s.includes('RsTableSummaryRow')) {
  // maybe already patched
} else if (s.includes('$slots.summary')) {
  // normalize CRLF
  const normalized = s.replace(/\r\n/g, '\n')
  if (normalized.includes(oldTfoot)) {
    s = normalized.replace(oldTfoot, newTfoot)
  } else {
    s = s.replace(
      /<tfoot v-if="\$slots\.summary" class="rs-table__foot">[\s\S]*?<\/tfoot>/,
      newTfoot,
    )
  }
}

fs.writeFileSync(path, s)
console.log('OK bytes', s.length)
console.log('engine', s.includes('useRsTableEngine'))
console.log('virtual', s.includes('useRsTableVirtual'))
console.log('summaryMode prop', s.includes('summaryMode?:'))
console.log('summary row component', s.includes('RsTableSummaryRow'))
console.log('tableEntries const count', (s.match(/const tableEntries = computed/g) || []).length)
console.log('scrollTop count', (s.match(/const scrollTop = ref/g) || []).length)
console.log('resolvedSize count', (s.match(/const resolvedSize = computed/g) || []).length)
