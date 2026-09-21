export interface RsAnchorItem {
  href: string
  title: string
  disabled?: boolean
  children?: RsAnchorItem[]
}

export interface RsAnchorFlatItem {
  href: string
  title: string
  depth: number
  disabled?: boolean
}

export type RsAnchorDirection = 'vertical' | 'horizontal'

export type RsAnchorScrollBehavior = 'smooth' | 'auto'

export interface RsAnchorExpose {
  /** 滚到对应章节并激活。禁用项或找不到目标时不滚动。 */
  scrollTo: (href: string) => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsAnchorInstance = RsAnchorExpose & { $el: HTMLElement }

/** `#overview` / `path#overview` / `#%E6%A6%82%E8%BF%B0` → `overview` / `概述` */
export function hrefToAnchorId(href: string): string {
  const raw = href.trim()
  const hash = raw.includes('#') ? raw.slice(raw.indexOf('#') + 1) : raw
  const id = hash.replace(/^#/, '')
  if (!id) return ''
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

export function flattenAnchorItems(items: RsAnchorItem[], depth = 0): RsAnchorFlatItem[] {
  const out: RsAnchorFlatItem[] = []
  for (const item of items) {
    out.push({
      href: item.href,
      title: item.title,
      depth,
      disabled: item.disabled,
    })
    if (item.children?.length) {
      out.push(...flattenAnchorItems(item.children, depth + 1))
    }
  }
  return out
}

/**
 * 滚动监听：取最后一个 top <= offset 的标题。
 * entries 须按文档顺序（与 DOM 一致），top 为相对滚动容器顶部的距离。
 * atEnd：容器已贴底时最后一节往往到不了判定线，仍应高亮最后一项。
 */
export function pickActiveAnchorHref(
  entries: ReadonlyArray<{ href: string; top: number }>,
  offset: number,
  options?: { atEnd?: boolean },
): string {
  if (entries.length === 0) return ''
  if (options?.atEnd) return entries[entries.length - 1]?.href ?? ''
  let active = entries[0]?.href ?? ''
  for (const entry of entries) {
    if (entry.top <= offset) active = entry.href
  }
  return active
}

/** 用 scrollY / nodeType 判断，避免跨 iframe 的 `instanceof Window`。 */
export function isAnchorWindow(container: unknown): container is Window {
  return Boolean(
    container &&
      typeof container === 'object' &&
      'scrollY' in container &&
      !('nodeType' in container),
  )
}

export function resolveAnchorContainer(
  getContainer?: () => HTMLElement | Window | null | undefined,
): HTMLElement | Window | null {
  try {
    const resolved = getContainer?.()
    if (resolved) return resolved
  } catch {
    /* 宿主 getter 抛错时退回 window / null */
  }
  if (typeof window !== 'undefined') return window
  return null
}

export function readContainerScrollTop(container: HTMLElement | Window): number {
  if (isAnchorWindow(container)) return container.scrollY
  return container.scrollTop
}

export function readContainerScrollExtent(container: HTMLElement | Window): {
  top: number
  max: number
} {
  if (isAnchorWindow(container)) {
    const root =
      typeof document === 'undefined'
        ? null
        : document.scrollingElement || document.documentElement
    const top = container.scrollY
    const max = root ? Math.max(0, root.scrollHeight - container.innerHeight) : 0
    return { top, max }
  }
  return {
    top: container.scrollTop,
    max: Math.max(0, container.scrollHeight - container.clientHeight),
  }
}

/** 贴底判定。slack 吃掉亚像素，避免最后一项永远亮不起来。 */
export function isAnchorScrolledToEnd(container: HTMLElement | Window, slack = 4): boolean {
  const { top, max } = readContainerScrollExtent(container)
  return max > 0 && top >= max - slack
}

export function targetTopInContainer(target: HTMLElement, container: HTMLElement | Window): number {
  const targetRect = target.getBoundingClientRect()
  if (isAnchorWindow(container)) return targetRect.top
  return targetRect.top - container.getBoundingClientRect().top
}

export function prefersAnchorReducedMotion(): boolean {
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function resolveAnchorScrollBehavior(
  behavior?: RsAnchorScrollBehavior,
): ScrollBehavior {
  if (behavior) return behavior
  return prefersAnchorReducedMotion() ? 'auto' : 'smooth'
}

export function scrollContainerTo(
  container: HTMLElement | Window,
  top: number,
  behavior?: RsAnchorScrollBehavior,
): void {
  const resolved = resolveAnchorScrollBehavior(behavior)
  container.scrollTo({ top, behavior: resolved })
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

export function collectAnchorTops(
  items: ReadonlyArray<{ href: string }>,
  container: HTMLElement | Window,
  findTarget: (href: string) => HTMLElement | null,
): Array<{ href: string; top: number }> {
  const windowLike = isAnchorWindow(container)
  const containerTop = windowLike ? 0 : container.getBoundingClientRect().top
  const out: Array<{ href: string; top: number }> = []
  for (const item of items) {
    const el = findTarget(item.href)
    if (!el) continue
    const top = windowLike
      ? el.getBoundingClientRect().top
      : el.getBoundingClientRect().top - containerTop
    out.push({ href: item.href, top })
  }
  return out
}

export function writeAnchorHash(href: string, replace: boolean): void {
  if (typeof history === 'undefined' || typeof window === 'undefined') return
  const id = hrefToAnchorId(href)
  if (!id) return
  const url = new URL(window.location.href)
  const next = `${url.pathname}${url.search}#${id}`
  if (replace) {
    history.replaceState(history.state, '', next)
    return
  }
  history.pushState(history.state, '', next)
}
