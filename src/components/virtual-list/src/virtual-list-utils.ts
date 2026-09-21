export type RsVirtualListItemSize = number | ((index: number) => number)

export function resolveItemSize(itemSize: RsVirtualListItemSize, index = 0): number {
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
