/**
 * RsTable 列宽拖拽：mousemove 走 DOM 直写，避免整表 Vue 重渲。
 *
 * 性能关键：
 * - 会话开始时缓存 col/th 元素与基准总宽，RAF 内不再 querySelector 全表
 * - 拖拽中只更新变化列宽度 + table 总宽（O(1)），不重写其它列
 * - activeDragWidths 为非响应式 plain object，禁止写入 reactive
 */

import { nextTick, onUnmounted, ref, type ComputedRef, type Ref } from 'vue'
import { clampColumnWidth, parseColumnWidth, type RsTableColumn, type RsTableRowData } from '../components/table-utils'

function read<T>(source: ComputedRef<T> | (() => T) | Ref<T>): T {
  if (typeof source === 'function') return (source as () => T)()
  return (source as Ref<T> | ComputedRef<T>).value
}

export interface UseRsTableColumnResizeOptions<T extends RsTableRowData> {
  resizable: ComputedRef<boolean> | (() => boolean)
  minColumnWidth: ComputedRef<number | undefined> | (() => number | undefined)
  maxColumnWidth: ComputedRef<number | undefined> | (() => number | undefined)
  displayColumns: ComputedRef<RsTableColumn<T>[]> | (() => RsTableColumn<T>[])
  resolvedColumnWidths: {
    get: () => Record<string, number>
    set: (value: Record<string, number>) => void
  }
  /** 前缀列总宽（px），用于 DOM 直写时的 table 总宽 */
  measurePrefixColumnWidth: () => number
  tableMinWidth: ComputedRef<string | undefined> | (() => string | undefined)
  onColumnResize: (key: string, width: number) => void
}

interface ResizeSession {
  key: string
  startX: number
  startWidth: number
  currentWidth: number
  domSnapshot: Record<string, number>
  /** 会话基准总宽（前缀 + 各列快照），便于 O(1) 更新 table.width */
  baseTableWidth: number
  colEls: Map<string, HTMLTableColElement>
  thEls: Map<string, HTMLTableCellElement>
}

/**
 * 列宽拖拽会话。
 */
export function useRsTableColumnResize<T extends RsTableRowData>(
  options: UseRsTableColumnResizeOptions<T>,
) {
  const tableRef = ref<HTMLTableElement | null>(null)
  const isColumnResizing = ref(false)
  /** 拖拽会话中的列宽快照（仅首帧写入一次，供 colgroup 初始渲染） */
  const resizePaintWidths = ref<Record<string, number> | null>(null)

  let session: ResizeSession | null = null
  /** 非响应式：mousemove 高频更新不得触发 Vue */
  let activeDragWidths: Record<string, number> | null = null
  let resizeRafId = 0
  let latestResizeClientX = 0
  let resizeMoved = false

  function cacheColumnElements(table: HTMLTableElement): {
    colEls: Map<string, HTMLTableColElement>
    thEls: Map<string, HTMLTableCellElement>
  } {
    const colEls = new Map<string, HTMLTableColElement>()
    const thEls = new Map<string, HTMLTableCellElement>()
    for (const col of table.querySelectorAll<HTMLTableColElement>('colgroup col[data-col-key]')) {
      const key = col.dataset.colKey
      if (key) colEls.set(key, col)
    }
    for (const th of table.querySelectorAll<HTMLTableCellElement>('thead th[data-col-key]')) {
      const key = th.dataset.colKey
      if (key) thEls.set(key, th)
    }
    return { colEls, thEls }
  }

  /** 会话开始：一次性写满所有列宽到 DOM */
  function paintAllColumnWidths(table: HTMLTableElement, widths: Record<string, number>, cache: {
    colEls: Map<string, HTMLTableColElement>
    thEls: Map<string, HTMLTableCellElement>
  }): number {
    let sum = options.measurePrefixColumnWidth()
    for (const column of read(options.displayColumns)) {
      const width = widths[column.key] ?? parseColumnWidth(column.width ?? column.minWidth)
      const col = cache.colEls.get(column.key)
      if (col) col.style.width = `${width}px`
      const th = cache.thEls.get(column.key)
      if (th) th.style.width = `${width}px`
      sum += width
    }
    table.style.width = `${sum}px`
    const minWidth = read(options.tableMinWidth)
    if (minWidth) table.style.minWidth = minWidth
    return sum
  }

  /** 确保 colgroup 元素已缓存；fixed 布局首帧可能尚未挂上，失败则返回 false */
  function ensureSessionDomCache(): boolean {
    if (!session || !tableRef.value || !activeDragWidths) return false
    if (session.colEls.size > 0) return true
    const cache = cacheColumnElements(tableRef.value)
    if (cache.colEls.size === 0) return false
    session.colEls = cache.colEls
    session.thEls = cache.thEls
    session.baseTableWidth = paintAllColumnWidths(tableRef.value, activeDragWidths, cache)
    return true
  }

  /** RAF 热路径：只改变化列 + 总宽；缓存未就绪时先全量写一次 */
  function paintChangedColumnWidth(width: number): void {
    if (!session || !tableRef.value) return
    if (!ensureSessionDomCache()) return
    const { key, colEls, thEls, baseTableWidth, startWidth } = session
    const col = colEls.get(key)
    if (col) col.style.width = `${width}px`
    const th = thEls.get(key)
    if (th) th.style.width = `${width}px`
    tableRef.value.style.width = `${baseTableWidth - startWidth + width}px`
  }

  function beginResizeSession(): void {
    if (!session || isColumnResizing.value || !tableRef.value) return
    isColumnResizing.value = true
    activeDragWidths = { ...session.domSnapshot }
    resizePaintWidths.value = { ...activeDragWidths }
    // colgroup 依赖 fixed 布局重渲；先同步尝试，再 nextTick 兜底（避免 RAF 抢跑打空）
    if (!ensureSessionDomCache()) {
      void nextTick(() => {
        ensureSessionDomCache()
      })
    }
  }

  function onResizeMove(event: MouseEvent): void {
    if (!session) return
    latestResizeClientX = event.clientX
    if (!resizeMoved && Math.abs(latestResizeClientX - session.startX) < 1) return
    if (!resizeMoved) {
      resizeMoved = true
      beginResizeSession()
    }
    if (resizeRafId !== 0) return
    resizeRafId = requestAnimationFrame(() => {
      resizeRafId = 0
      if (!session || !activeDragWidths) return
      const nextWidth = clampColumnWidth(
        session.startWidth + latestResizeClientX - session.startX,
        read(options.minColumnWidth),
        read(options.maxColumnWidth),
      )
      if (nextWidth === session.currentWidth) return
      session.currentWidth = nextWidth
      activeDragWidths[session.key] = nextWidth
      paintChangedColumnWidth(nextWidth)
    })
  }

  function stopResize(): void {
    if (session && resizeMoved) {
      const finalWidth = clampColumnWidth(
        session.startWidth + latestResizeClientX - session.startX,
        read(options.minColumnWidth),
        read(options.maxColumnWidth),
      )
      if (finalWidth !== session.startWidth) {
        const merged = { ...session.domSnapshot, [session.key]: finalWidth }
        options.resolvedColumnWidths.set(merged)
        options.onColumnResize(session.key, finalWidth)
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
    session = null
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
    if (!read(options.resizable)) return

    const thEl = (event.currentTarget as HTMLElement).closest('th') as HTMLTableCellElement | null
    if (!thEl) return
    const tableEl = thEl.closest('table') as HTMLTableElement | null
    if (!tableEl) return

    const dataThs = Array.from(
      tableEl.querySelectorAll<HTMLTableCellElement>('thead th[data-col-key]'),
    )
    const domSnapshot: Record<string, number> = {}
    for (const th of dataThs) {
      domSnapshot[th.dataset.colKey!] = th.offsetWidth
    }

    const startWidth = domSnapshot[key] ?? thEl.offsetWidth
    latestResizeClientX = event.clientX
    resizeMoved = false
    session = {
      key,
      startX: event.clientX,
      startWidth,
      currentWidth: startWidth,
      domSnapshot,
      baseTableWidth: 0,
      colEls: new Map(),
      thEls: new Map(),
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onResizeMove)
    document.addEventListener('mouseup', stopResize, { capture: true })
  }

  onUnmounted(() => {
    stopResize()
  })

  return {
    tableRef,
    isColumnResizing,
    resizePaintWidths,
    onResizeStart,
    stopResize,
  }
}

export type RsTableColumnResizeApi = ReturnType<typeof useRsTableColumnResize>
