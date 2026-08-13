/**
 * RsTable 横向列虚拟：冻结列始终渲染，中间 fluid 列按 scrollLeft 切片。
 *
 * 列宽拖拽 DOM 直写仍在 RsTable；本 composable 只消费已算好的列宽 getter。
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import {
  resolveColumnPixelWidth,
  sliceVirtualColumns,
  type RsTableColumn,
  type RsTableRowData,
} from '../components/table-utils'

/** ComputedRef / Ref / getter 均可（抽离后 RsTable 常直接传入 ref） */
type Source<T> = ComputedRef<T> | Ref<T> | (() => T)

/** 统一读取 ComputedRef / Ref / getter */
function read<T>(source: Source<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

/** 前缀列固定宽度（与 CSS / resizable 合计一致） */
export const RS_TABLE_PREFIX_COL_WIDTH = {
  drag: 40,
  expand: 40,
  select: 40,
  status: 52,
} as const

/**
 * 计算前缀列总宽（拖拽/展开/选择/序号或 gutter）。
 * 供列布局合计与列宽拖拽 DOM 直写共用，避免两处公式漂移。
 */
export function measureRsTablePrefixWidth(flags: {
  showRowDragHandle?: boolean
  detailExpandable?: boolean
  showSelectColumn?: boolean
  showEditGutterColumn?: boolean
  showIndexColumn?: boolean
  gutterWidth?: number
  indexWidth?: number
}): number {
  let sum = 0
  if (flags.showRowDragHandle) sum += RS_TABLE_PREFIX_COL_WIDTH.drag
  if (flags.detailExpandable) sum += RS_TABLE_PREFIX_COL_WIDTH.expand
  if (flags.showSelectColumn) sum += RS_TABLE_PREFIX_COL_WIDTH.select
  if (flags.showEditGutterColumn) sum += flags.gutterWidth ?? 0
  else if (flags.showIndexColumn) sum += flags.indexWidth ?? 0
  return sum
}

export interface UseRsTableColumnVirtualOptions<T extends RsTableRowData> {
  displayColumns: Source<RsTableColumn<T>[]>
  /** virtualColumns prop：true / false / 'auto' */
  virtualColumns: Source<boolean | 'auto' | undefined>
  virtualColumnsAutoThreshold: Source<number | undefined>
  virtualColumnOverscan: Source<number | undefined>
  /** 列宽拖拽中强制关闭列虚拟，避免切片与 DOM 直写打架 */
  isColumnResizing: Source<boolean>
  scrollLeft: Source<number>
  measuredViewportWidth: Source<number>
  columnWidths: Source<Record<string, number>>
  showRowDragHandle: Source<boolean>
  detailExpandable: Source<boolean>
  showSelectColumn: Source<boolean>
  showEditGutterColumn: Source<boolean>
  showIndexColumn: Source<boolean>
  showRowStatusColumn: Source<boolean>
  resolvedGutterWidth: Source<number>
  resolvedIndexWidth: Source<number>
}

/**
 * 横向列虚拟切片状态。
 *
 * @returns left/right/fluid 列分组、virtualColumnsEnabled、visibleDataColumns、左右 pad
 */
export function useRsTableColumnVirtual<T extends RsTableRowData>(
  options: UseRsTableColumnVirtualOptions<T>,
) {
  const leftFixedDataColumns = computed(() =>
    read(options.displayColumns).filter((c) => c.fixed === 'left'),
  )
  const rightFixedDataColumns = computed(() =>
    read(options.displayColumns).filter((c) => c.fixed === 'right'),
  )
  const fluidDataColumns = computed(() =>
    read(options.displayColumns).filter((c) => !c.fixed),
  )

  const dataColumnWidth = (column: RsTableColumn<T>): number =>
    resolveColumnPixelWidth(column, read(options.columnWidths))

  /**
   * 启用规则：
   * - false → 关
   * - 列宽拖拽中 → 关
   * - true → fluid 列非空即开
   * - auto → fluid 列数 >= threshold
   */
  const virtualColumnsEnabled = computed(() => {
    if (read(options.virtualColumns) === false) return false
    if (read(options.isColumnResizing)) return false
    if (read(options.virtualColumns) === true) return fluidDataColumns.value.length > 0
    const threshold = read(options.virtualColumnsAutoThreshold) ?? 0
    return threshold > 0 && fluidDataColumns.value.length >= threshold
  })

  /** 左侧前缀 + 左冻结列总宽，用于把 scrollLeft 映射到 fluid 区 */
  const fluidLeadingOffset = computed(() => {
    let sum = 0
    if (read(options.showRowDragHandle)) sum += RS_TABLE_PREFIX_COL_WIDTH.drag
    if (read(options.detailExpandable)) sum += RS_TABLE_PREFIX_COL_WIDTH.expand
    if (read(options.showSelectColumn)) sum += RS_TABLE_PREFIX_COL_WIDTH.select
    if (read(options.showEditGutterColumn)) sum += read(options.resolvedGutterWidth)
    else if (read(options.showIndexColumn)) sum += read(options.resolvedIndexWidth)
    if (read(options.showRowStatusColumn)) sum += RS_TABLE_PREFIX_COL_WIDTH.status
    for (const col of leftFixedDataColumns.value) sum += dataColumnWidth(col)
    return sum
  })

  const columnVirtualSlice = computed(() => {
    const fluidCount = fluidDataColumns.value.length
    if (!virtualColumnsEnabled.value) {
      return {
        columns: read(options.displayColumns),
        paddingLeft: 0,
        paddingRight: 0,
        startIndex: 0,
        endIndex: fluidCount,
        fluidCount,
      }
    }
    const viewport = Math.max(read(options.measuredViewportWidth) || 320, 120)
    const midScroll = Math.max(0, read(options.scrollLeft) - fluidLeadingOffset.value)
    const midViewport = Math.max(120, viewport - Math.min(viewport - 40, fluidLeadingOffset.value))
    const sliced = sliceVirtualColumns(fluidDataColumns.value, {
      scrollLeft: midScroll,
      viewportWidth: midViewport,
      getWidth: dataColumnWidth,
      overscan: read(options.virtualColumnOverscan) ?? 2,
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

  return {
    leftFixedDataColumns,
    rightFixedDataColumns,
    fluidDataColumns,
    dataColumnWidth,
    virtualColumnsEnabled,
    fluidLeadingOffset,
    columnVirtualSlice,
    visibleDataColumns,
    columnPadLeft,
    columnPadRight,
  }
}

/** useRsTableColumnVirtual 返回值类型 */
export type RsTableColumnVirtualApi<T extends RsTableRowData> = ReturnType<
  typeof useRsTableColumnVirtual<T>
>
