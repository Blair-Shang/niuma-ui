/**
 * RsTable 列布局：拉满补宽、渲染列宽、fixed/overflow/前缀 lead 样式。
 *
 * 性能约定：
 * - `emptyFillExtras` 使用冻结空对象恒等，避免无补宽时 renderColumnWidths 复制整表
 * - 列 style Map 一次遍历构建，模板热路径按 key O(1) 取用
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { measureRsTablePrefixWidth, RS_TABLE_PREFIX_COL_WIDTH } from './useRsTableColumnVirtual'
import {
  fixedCellStyle,
  parseColumnWidth,
  resolveColumnStyle,
  resolveFixedColumnStyles,
  type RsTableColumn,
  type RsTableRowData,
} from '../components/table-utils'

/** ComputedRef / Ref / getter 均可 */
type Source<T> = ComputedRef<T> | Ref<T> | (() => T)

function read<T>(source: Source<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

/** 无补宽时的共享空对象（恒等比较，避免无意义拷贝） */
const EMPTY_FILL_EXTRAS: Record<string, number> = Object.freeze({})

export interface UseRsTableColumnLayoutOptions<T extends RsTableRowData> {
  displayColumns: Source<RsTableColumn<T>[]>
  effectiveColumnWidths: Source<Record<string, number>>
  measuredViewportWidth: Source<number>
  tableMinWidth: Source<string | undefined>
  resizable: Source<boolean>
  columnLayout: Source<'auto' | 'fixed'>
  useStableColumnWidths: Source<boolean>
  isColumnResizing: Source<boolean>
  virtualColumnsEnabled: Source<boolean>
  scrollX: Source<number | string | undefined>
  showRowDragHandle: Source<boolean>
  detailExpandable: Source<boolean>
  showSelectColumn: Source<boolean>
  showEditGutterColumn: Source<boolean>
  showIndexColumn: Source<boolean>
  showRowStatusColumn: Source<boolean>
  resolvedGutterWidth: Source<number>
  resolvedIndexWidth: Source<number>
  dragColumnOffset: Source<number>
  expandColumnOffset: Source<number>
  selectColumnOffset: Source<number>
  /** 拖拽会话快照列宽；非空表示正在/刚进入 resize paint */
  resizePaintWidths: Source<Record<string, number> | null>
}

/**
 * 列布局与样式缓存。
 */
export function useRsTableColumnLayout<T extends RsTableRowData>(
  options: UseRsTableColumnLayoutOptions<T>,
) {
  const PREFIX = RS_TABLE_PREFIX_COL_WIDTH

  /** 前缀列总宽（不含 status；status 在部分合计里另加） */
  function measurePrefixColumnWidth(): number {
    return measureRsTablePrefixWidth({
      showRowDragHandle: read(options.showRowDragHandle),
      detailExpandable: read(options.detailExpandable),
      showSelectColumn: read(options.showSelectColumn),
      showEditGutterColumn: read(options.showEditGutterColumn),
      showIndexColumn: read(options.showIndexColumn),
      gutterWidth: read(options.resolvedGutterWidth),
      indexWidth: read(options.resolvedIndexWidth),
    })
  }

  /** resizable 且列宽稳定时，或拖拽会话中：表格内容最小宽度 = 各列宽度之和 */
  const resizableTableWidth = computed(() => {
    if (!read(options.resizable)) return undefined
    if (
      !read(options.resizePaintWidths) &&
      read(options.columnLayout) === 'auto' &&
      !read(options.useStableColumnWidths)
    ) {
      return undefined
    }
    let sum = measurePrefixColumnWidth()
    const widths = read(options.effectiveColumnWidths)
    for (const col of read(options.displayColumns)) {
      sum += widths[col.key] ?? parseColumnWidth(col.width ?? col.minWidth)
    }
    return `${sum}px`
  })

  const useFixedColumnLayout = computed(
    () => read(options.useStableColumnWidths) || read(options.isColumnResizing),
  )

  /**
   * 列总宽不足视口时，把剩余像素均分到数据列（前缀列不动）。
   * 列虚拟开启时不做拉满，避免与横向切片打架。
   */
  const columnFillExtras = computed((): Record<string, number> => {
    if (read(options.isColumnResizing)) return EMPTY_FILL_EXTRAS
    if (!useFixedColumnLayout.value) return EMPTY_FILL_EXTRAS
    if (read(options.virtualColumnsEnabled)) return EMPTY_FILL_EXTRAS
    const viewportW = read(options.measuredViewportWidth)
    if (viewportW <= 0) return EMPTY_FILL_EXTRAS
    const cols = read(options.displayColumns)
    if (cols.length === 0) return EMPTY_FILL_EXTRAS

    let sum = measurePrefixColumnWidth()
    if (read(options.showRowStatusColumn)) sum += PREFIX.status
    const widths = read(options.effectiveColumnWidths)
    for (const col of cols) {
      sum += widths[col.key] ?? parseColumnWidth(col.width ?? col.minWidth)
    }
    const excess = Math.floor(viewportW - sum) - 1
    if (excess <= 0) return EMPTY_FILL_EXTRAS

    const extras: Record<string, number> = {}
    const base = Math.floor(excess / cols.length)
    let rem = excess - base * cols.length
    for (const col of cols) {
      extras[col.key] = base + (rem > 0 ? 1 : 0)
      if (rem > 0) rem -= 1
    }
    return extras
  })

  /** 渲染用列宽 = 持久化/拖拽列宽 + 拉满补宽；无补宽时直接返回 base 引用 */
  const renderColumnWidths = computed(() => {
    const extras = columnFillExtras.value
    const base = read(options.effectiveColumnWidths)
    if (extras === EMPTY_FILL_EXTRAS) return base
    const next: Record<string, number> = { ...base }
    for (const col of read(options.displayColumns)) {
      const extra = extras[col.key]
      if (!extra) continue
      const cur = next[col.key] ?? parseColumnWidth(col.width ?? col.minWidth)
      next[col.key] = cur + extra
    }
    return next
  })

  const tableInlineStyle = computed(() => {
    if (read(options.isColumnResizing)) return undefined
    if (read(options.resizable)) {
      if (read(options.columnLayout) === 'auto' && !read(options.useStableColumnWidths)) {
        const minW = read(options.tableMinWidth)
        return minW ? { width: '100%', minWidth: minW } : { width: '100%' }
      }
      const width = resizableTableWidth.value
      if (!width) return undefined
      return { width: '100%', minWidth: read(options.tableMinWidth) ?? width }
    }
    const minW = read(options.tableMinWidth)
    return minW ? { minWidth: minW } : undefined
  })

  function estimateRequiredTableWidth(): number {
    let sum = measurePrefixColumnWidth()
    if (read(options.showRowStatusColumn)) sum += PREFIX.status
    const widths = read(options.effectiveColumnWidths)
    for (const col of read(options.displayColumns)) {
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

  /** 仅当列宽确需超过容器时开启横向滚动 */
  const overflowXEnabled = computed(() => {
    if (read(options.virtualColumnsEnabled)) return true
    const scrollX = read(options.scrollX)
    if (scrollX != null && scrollX !== '') return true
    const viewportW = read(options.measuredViewportWidth)
    if (viewportW <= 0) return false
    if (useFixedColumnLayout.value) {
      const raw = resizableTableWidth.value
      const sum = raw ? Number.parseInt(raw, 10) : estimateRequiredTableWidth()
      return Number.isFinite(sum) && sum > viewportW
    }
    return estimateRequiredTableWidth() > viewportW
  })

  function resolvedDataColumnWidth(key: string, fallback?: number | string): number {
    const stored = renderColumnWidths.value[key]
    if (typeof stored === 'number') return stored
    return parseColumnWidth(fallback)
  }

  const fixedColumnStyles = computed(() =>
    resolveFixedColumnStyles(read(options.displayColumns), renderColumnWidths.value, {
      selectable: read(options.showSelectColumn),
      showIndex: read(options.showIndexColumn),
      showEditGutter: read(options.showEditGutterColumn),
      gutterWidth: read(options.resolvedGutterWidth),
      indexWidth: read(options.resolvedIndexWidth),
      expandable: read(options.detailExpandable),
      rowDraggable: read(options.showRowDragHandle),
    }),
  )

  /**
   * 一次遍历同时构建 body/header 列样式 Map，避免两遍 resolveColumnStyle。
   */
  const columnStyleMaps = computed(() => {
    const body = new Map<string, Record<string, string> | undefined>()
    const header = new Map<string, Record<string, string> | undefined>()
    const widths = renderColumnWidths.value
    const fixed = fixedColumnStyles.value
    for (const col of read(options.displayColumns)) {
      const base = resolveColumnStyle(col, widths) ?? {}
      const bodyFixed = fixedCellStyle(fixed.get(col.key))
      const headerFixed = fixedCellStyle(fixed.get(col.key), { header: true })
      let bodyMerged: Record<string, string> | undefined
      let headerMerged: Record<string, string> | undefined
      if (bodyFixed) bodyMerged = { ...base, ...bodyFixed }
      else if (Object.keys(base).length) bodyMerged = base
      if (headerFixed) headerMerged = { ...base, ...headerFixed }
      else if (Object.keys(base).length) headerMerged = base
      body.set(col.key, bodyMerged)
      header.set(col.key, headerMerged)
    }
    return { body, header }
  })

  const columnStyleMap = computed(() => columnStyleMaps.value.body)
  const columnHeaderStyleMap = computed(() => columnStyleMaps.value.header)

  /** td 静态 class Map：列配置不变时复用 */
  const columnTdClassMap = computed<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>()
    for (const col of read(options.displayColumns)) {
      const classes: string[] = [`rs-table__cell--${col.align ?? 'left'}`]
      if (col.ellipsis) classes.push('rs-table__td--ellipsis')
      if (col.fixed) classes.push('rs-table__cell--fixed')
      map.set(col.key, classes)
    }
    return map
  })

  const dragLeadStyle = computed(() => fixedCellStyle({ fixed: 'left', left: 0 }) ?? {})
  const expandLeadStyle = computed(
    () => fixedCellStyle({ fixed: 'left', left: read(options.dragColumnOffset) }) ?? {},
  )
  const selectLeadStyle = computed(
    () => fixedCellStyle({ fixed: 'left', left: read(options.expandColumnOffset) }) ?? {},
  )
  const indexLeadStyle = computed(
    () => fixedCellStyle({ fixed: 'left', left: read(options.selectColumnOffset) }) ?? {},
  )
  const gutterLeadStyle = computed(
    () => fixedCellStyle({ fixed: 'left', left: read(options.selectColumnOffset) }) ?? {},
  )
  const dragLeadHeaderStyle = computed(
    () => fixedCellStyle({ fixed: 'left', left: 0 }, { header: true }) ?? {},
  )
  const expandLeadHeaderStyle = computed(
    () =>
      fixedCellStyle({ fixed: 'left', left: read(options.dragColumnOffset) }, { header: true }) ?? {},
  )
  const selectLeadHeaderStyle = computed(
    () =>
      fixedCellStyle({ fixed: 'left', left: read(options.expandColumnOffset) }, { header: true }) ??
      {},
  )
  const indexLeadHeaderStyle = computed(
    () =>
      fixedCellStyle({ fixed: 'left', left: read(options.selectColumnOffset) }, { header: true }) ??
      {},
  )
  const gutterLeadHeaderStyle = computed(
    () =>
      fixedCellStyle({ fixed: 'left', left: read(options.selectColumnOffset) }, { header: true }) ??
      {},
  )

  return {
    EMPTY_FILL_EXTRAS,
    measurePrefixColumnWidth,
    resizableTableWidth,
    useFixedColumnLayout,
    columnFillExtras,
    renderColumnWidths,
    tableInlineStyle,
    overflowXEnabled,
    resolvedDataColumnWidth,
    fixedColumnStyles,
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
  }
}

export type RsTableColumnLayoutApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableColumnLayout<T>
>
