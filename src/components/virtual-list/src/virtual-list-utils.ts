export type RsVirtualListAlign = 'nearest' | 'center' | 'start' | 'end'

export type RsVirtualListOrientation = 'vertical' | 'horizontal'

/** 固定像素、按索引返回像素，或 `'auto'`（量内容）。 */
export type RsVirtualListItemSize = number | ((index: number) => number) | 'auto'

export type RsVirtualListItemKey<T> = (item: T, index: number) => string | number

export interface RsVirtualListExpose {
  scrollToIndex: (index: number, align?: RsVirtualListAlign) => void
  scrollToOffset: (offset: number) => void
  getScrollOffset: () => number
  getViewport: () => HTMLElement | undefined
  focus: () => void
}

export type RsVirtualListInstance = RsVirtualListExpose

/** Chrome / Firefox 可滚动高度上限之下，避免超长列表把滚动条撑爆。 */
export const RS_VIRTUAL_LIST_MAX_EXTENT = 8_000_000

export type RsRtlScrollType = 'default' | 'negative' | 'reverse'

export interface RsVirtualMetrics {
  /** 定高时为行高；函数 / auto 时为 null。 */
  fixed: number | null
  total: number
  extent: number
  sizeAt: (index: number) => number
  offsetAt: (index: number) => number
}

export function resolveItemSize(itemSize: RsVirtualListItemSize, index = 0): number {
  if (itemSize === 'auto') return 32
  const size = typeof itemSize === 'function' ? itemSize(index) : itemSize
  return Number.isFinite(size) && size > 0 ? size : 32
}

export function resolveVirtualListHeight(height?: number | string, fallback = 240): string | undefined {
  if (height === 0) return undefined
  if (height === undefined) return `${fallback}px`
  return typeof height === 'number' ? `${height}px` : height
}

/** height 为 0 / 百分比时由父级撑满，组件内用 ResizeObserver 测量可视高度 */
export function isVirtualListFillHeight(height?: number | string): boolean {
  if (height === 0) return true
  if (typeof height === 'string' && height.trim().endsWith('%')) return true
  return false
}

/** 解析虚拟列表数值视口高度；百分比 / 填满模式返回 null，交由测量值处理 */
export function parseVirtualListHeightPx(height?: number | string): number | null {
  if (typeof height === 'number' && height > 0) return height
  if (typeof height === 'string') {
    if (height.includes('%')) return null
    const parsed = Number.parseInt(height, 10)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

export function normalizeOverscan(value: number | undefined, fallback = 4): number {
  if (value == null || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.floor(value))
}

export function capExtent(total: number, max = RS_VIRTUAL_LIST_MAX_EXTENT): number {
  if (!Number.isFinite(total) || total <= 0) return 0
  return Math.min(total, max)
}

export function axisMax(total: number, viewport: number): number {
  return Math.max(0, total - Math.max(0, viewport))
}

/** 内容偏移 → 滚动条偏移。未触顶时二者相同。 */
export function contentToScroll(content: number, total: number, viewport: number, extent: number): number {
  const contentMax = axisMax(total, viewport)
  const scrollMax = axisMax(extent, viewport)
  if (contentMax === 0 || scrollMax === 0) return 0
  const ratio = Math.min(1, Math.max(0, content / contentMax))
  return ratio * scrollMax
}

/** 滚动条偏移 → 内容偏移。未触顶时二者相同。 */
export function scrollToContent(scroll: number, total: number, viewport: number, extent: number): number {
  const contentMax = axisMax(total, viewport)
  const scrollMax = axisMax(extent, viewport)
  if (contentMax === 0 || scrollMax === 0) return 0
  const ratio = Math.min(1, Math.max(0, scroll / scrollMax))
  return ratio * contentMax
}

/** 窗口在滚动内容里的平移。scale 为 1 时等于条目偏移。 */
export function windowOrigin(scroll: number, contentOffset: number, itemOffset: number): number {
  return scroll + itemOffset - contentOffset
}

export function buildVirtualMetrics(
  count: number,
  itemSize: RsVirtualListItemSize,
  measured?: ReadonlyMap<number, number> | null,
  estimate = 32,
): RsVirtualMetrics {
  const countSafe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
  const estimatePx = resolveItemSize(estimate)

  if (itemSize !== 'auto' && typeof itemSize !== 'function') {
    const size = resolveItemSize(itemSize)
    const total = countSafe * size
    return {
      fixed: size,
      total,
      extent: capExtent(total),
      sizeAt: () => size,
      offsetAt: (index: number) => {
        if (countSafe <= 0) return 0
        if (index >= countSafe) return total
        return Math.max(0, index) * size
      },
    }
  }

  const sizes = new Array<number>(countSafe)
  const offsets = new Array<number>(countSafe)
  let total = 0
  for (let index = 0; index < countSafe; index += 1) {
    let size = estimatePx
    if (itemSize === 'auto') {
      const known = measured?.get(index)
      if (known != null && known > 0) size = known
    } else {
      size = resolveItemSize(itemSize, index)
    }
    sizes[index] = size
    offsets[index] = total
    total += size
  }

  return {
    fixed: null,
    total,
    extent: capExtent(total),
    sizeAt: (index: number) => {
      if (index < 0 || index >= countSafe) return estimatePx
      return sizes[index] ?? estimatePx
    },
    offsetAt: (index: number) => {
      if (countSafe <= 0 || index <= 0) return 0
      if (index >= countSafe) return total
      return offsets[index] ?? total
    },
  }
}

export function findIndexAtOffset(count: number, offset: number, metrics: RsVirtualMetrics): number {
  if (count <= 0) return 0
  const target = Math.max(0, offset)
  if (metrics.fixed) {
    return Math.min(count - 1, Math.floor(target / metrics.fixed))
  }
  let lo = 0
  let hi = count - 1
  let answer = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (metrics.offsetAt(mid) <= target) {
      answer = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return answer
}

export function resolveVisibleRange(
  count: number,
  contentOffset: number,
  viewport: number,
  overscan: number | undefined,
  metrics: RsVirtualMetrics,
): { start: number; end: number; offset: number } {
  if (count <= 0) return { start: 0, end: 0, offset: 0 }
  const over = normalizeOverscan(overscan)
  const scroll = Math.max(0, contentOffset)
  if (metrics.fixed) {
    const start = Math.max(0, Math.floor(scroll / metrics.fixed) - over)
    const visible = Math.ceil(Math.max(0, viewport) / metrics.fixed) + over * 2
    const end = Math.min(count, start + visible)
    return { start, end, offset: metrics.offsetAt(start) }
  }
  const startIndex = findIndexAtOffset(count, scroll, metrics)
  const endIndex = findIndexAtOffset(count, scroll + Math.max(0, viewport), metrics)
  const start = Math.max(0, startIndex - over)
  const end = Math.min(count, endIndex + 1 + over)
  return { start, end, offset: metrics.offsetAt(start) }
}

export function resolveAlignedOffset(options: {
  index: number
  align: RsVirtualListAlign
  count: number
  viewport: number
  contentOffset: number
  total: number
  offsetAt: (index: number) => number
  sizeAt: (index: number) => number
}): number | null {
  const { index, align, count, viewport, contentOffset, total, offsetAt, sizeAt } = options
  if (index < 0 || index >= count) return null
  const itemTop = offsetAt(index)
  const itemSize = sizeAt(index)
  const itemBottom = itemTop + itemSize
  const viewTop = contentOffset
  const viewBottom = viewTop + viewport
  const maxScroll = axisMax(total, viewport)

  if (align === 'nearest' && itemTop >= viewTop && itemBottom <= viewBottom) return null

  let next = itemTop - (viewport - itemSize) / 2
  if (align === 'start') next = itemTop
  if (align === 'end') next = itemBottom - viewport
  if (align === 'nearest') {
    if (itemTop < viewTop) next = itemTop
    else if (itemBottom > viewBottom) next = itemBottom - viewport
    else return null
  }
  return Math.min(maxScroll, Math.max(0, next))
}

export function readHorizontalOffset(
  scrollLeft: number,
  max: number,
  rtl: boolean,
  type: RsRtlScrollType,
): number {
  if (!rtl || type === 'default') return Math.max(0, scrollLeft)
  if (type === 'negative') return Math.abs(scrollLeft)
  return Math.max(0, max - scrollLeft)
}

export function writeHorizontalOffset(
  offset: number,
  max: number,
  rtl: boolean,
  type: RsRtlScrollType,
): number {
  const next = Math.min(Math.max(0, max), Math.max(0, offset))
  if (!rtl || type === 'default') return next
  if (type === 'negative') return -next
  return Math.max(0, max - next)
}

let cachedRtlScrollType: RsRtlScrollType | null = null

/** 探测当前引擎的 RTL scrollLeft。探测节点用完即删。无 document 时按 default。 */
export function detectRtlScrollType(): RsRtlScrollType {
  if (cachedRtlScrollType) return cachedRtlScrollType
  if (typeof document === 'undefined' || !document.body) return 'default'
  const dummy = document.createElement('div')
  const inner = document.createElement('div')
  dummy.dir = 'rtl'
  dummy.style.cssText = 'width:4px;height:1px;position:absolute;top:-9999px;overflow:scroll;visibility:hidden'
  inner.style.cssText = 'width:8px;height:1px'
  dummy.appendChild(inner)
  document.body.appendChild(dummy)
  try {
    const initial = dummy.scrollLeft
    dummy.scrollLeft = -1
    const after = dummy.scrollLeft
    if (after < 0) cachedRtlScrollType = 'negative'
    else if (initial > 0) cachedRtlScrollType = 'reverse'
    else cachedRtlScrollType = 'default'
  } finally {
    dummy.remove()
  }
  return cachedRtlScrollType
}

export function resetRtlScrollTypeCache(): void {
  cachedRtlScrollType = null
}

export function resolveVirtualListKeyIndex(options: {
  key: string
  index: number | null
  count: number
  orientation: RsVirtualListOrientation
  rtl: boolean
  pageSize: number
}): number | null {
  const { count } = options
  if (count <= 0) return null
  let motion: number | 'home' | 'end' | 'page-up' | 'page-down' | null = null
  const key = options.key
  if (options.orientation === 'vertical') {
    if (key === 'ArrowDown') motion = 1
    else if (key === 'ArrowUp') motion = -1
    else if (key === 'PageDown') motion = 'page-down'
    else if (key === 'PageUp') motion = 'page-up'
    else if (key === 'Home') motion = 'home'
    else if (key === 'End') motion = 'end'
  } else {
    const forward = options.rtl ? 'ArrowLeft' : 'ArrowRight'
    const backward = options.rtl ? 'ArrowRight' : 'ArrowLeft'
    if (key === forward) motion = 1
    else if (key === backward) motion = -1
    else if (key === 'Home') motion = 'home'
    else if (key === 'End') motion = 'end'
  }
  if (motion == null) return null
  const current = options.index
  const page = Math.max(1, Math.floor(options.pageSize) || 1)
  if (motion === 'home') return 0
  if (motion === 'end') return count - 1
  if (motion === 'page-down') {
    const base = current == null || current < 0 ? -1 : current
    return Math.min(count - 1, base + page)
  }
  if (motion === 'page-up') {
    const base = current == null || current < 0 ? 0 : current
    return Math.max(0, base - page)
  }
  if (current == null || current < 0) return motion > 0 ? 0 : count - 1
  return Math.min(count - 1, Math.max(0, current + motion))
}

export function readVirtualItemBox(entry: ResizeObserverEntry, orientation: RsVirtualListOrientation): number {
  const box = entry.borderBoxSize?.[0]
  if (box) {
    const value = orientation === 'horizontal' ? box.inlineSize : box.blockSize
    if (value > 0) return value
  }
  const rect = orientation === 'horizontal' ? entry.contentRect.width : entry.contentRect.height
  return Math.max(0, rect)
}
