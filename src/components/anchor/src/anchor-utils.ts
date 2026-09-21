export interface RsAnchorItem {
  href: string
  title: string
  children?: RsAnchorItem[]
}

export interface RsAnchorFlatItem {
  href: string
  title: string
  depth: number
}

/** `#overview` / `path#overview` → `overview` */
export function hrefToAnchorId(href: string): string {
  const raw = href.trim()
  const hash = raw.includes('#') ? raw.slice(raw.indexOf('#') + 1) : raw
  return hash.replace(/^#/, '')
}

export function flattenAnchorItems(items: RsAnchorItem[], depth = 0): RsAnchorFlatItem[] {
  const out: RsAnchorFlatItem[] = []
  for (const item of items) {
    out.push({ href: item.href, title: item.title, depth })
    if (item.children?.length) {
      out.push(...flattenAnchorItems(item.children, depth + 1))
    }
  }
  return out
}

/**
 * 滚动监听：取最后一个 top <= offset 的标题。
 * entries 须按文档顺序（与 DOM 一致），top 为相对滚动容器顶部的距离。
 */
export function pickActiveAnchorHref(
  entries: ReadonlyArray<{ href: string; top: number }>,
  offset: number,
): string {
  if (entries.length === 0) return ''
  let active = entries[0]?.href ?? ''
  for (const entry of entries) {
    if (entry.top <= offset) active = entry.href
  }
  return active
}

export function resolveAnchorContainer(
  getContainer?: () => HTMLElement | Window | null | undefined,
): HTMLElement | Window {
  const resolved = getContainer?.()
  if (resolved) return resolved
  if (typeof window !== 'undefined') return window
  throw new Error('RsAnchor: no scroll container')
}

export function readContainerScrollTop(container: HTMLElement | Window): number {
  if (container instanceof Window) return container.scrollY
  return container.scrollTop
}

export function targetTopInContainer(target: HTMLElement, container: HTMLElement | Window): number {
  const targetRect = target.getBoundingClientRect()
  if (container instanceof Window) return targetRect.top
  return targetRect.top - container.getBoundingClientRect().top
}

export function scrollContainerTo(container: HTMLElement | Window, top: number): void {
  if (container instanceof Window) {
    container.scrollTo({ top, behavior: 'smooth' })
    return
  }
  container.scrollTo({ top, behavior: 'smooth' })
}

export function computeScrollTopForTarget(
  target: HTMLElement,
  container: HTMLElement | Window,
  targetOffset: number,
): number {
  const current = readContainerScrollTop(container)
  const relativeTop = targetTopInContainer(target, container)
  return Math.max(0, current + relativeTop - targetOffset)
}
