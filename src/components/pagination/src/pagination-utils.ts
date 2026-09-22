import type { RsComponentSize } from '../../../theme/types'

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

/**
 * 分页尺寸（对齐 Ant Design Pagination：small / medium / large）。
 * 不提供 ssm：页码按钮过小不利于点击。ConfigProvider 的 ssm 会落到 sm。
 */
export type RsPaginationSize = Extract<RsComponentSize, 'sm' | 'md' | 'lg'>
export type RsPaginationAlign = 'start' | 'center' | 'end'
export type RsPaginationItemType =
  | 'page'
  | 'prev'
  | 'next'
  | 'first'
  | 'last'
  | 'ellipsis'
  | 'simple'

export interface RsPaginationItemSlot {
  type: RsPaginationItemType
  page: number
  active: boolean
  disabled: boolean
}

export interface RsPaginationSummarySlot {
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface RsPaginationPagerItem extends RsPaginationItemSlot {
  key: string
}

export interface RsPaginationExpose {
  /** 跳到指定页。越界会夹紧。禁用或未变化时返回 false。 */
  goTo: (page: number) => boolean
  /** 上一页。已在首页或禁用时返回 undefined。 */
  prev: () => number | undefined
  /** 下一页。已在末页或禁用时返回 undefined。 */
  next: () => number | undefined
  /** 第一页。已在首页或禁用时返回 undefined。 */
  first: () => number | undefined
  /** 最后一页。已在末页或禁用时返回 undefined。 */
  last: () => number | undefined
  /** 焦点落到指定页码按钮；未传则落到当前页。 */
  focus: (page?: number) => void
}

export type RsPaginationInstance = RsPaginationExpose & { $el: HTMLElement }

export function getPageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize))
}

export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(1, page), Math.max(1, pageCount))
}

export function getPaginationRange(page: number, pageCount: number, siblingCount = 1): Array<number | 'ellipsis'> {
  const totalNumbers = siblingCount * 2 + 5
  if (pageCount <= totalNumbers) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const leftSibling = Math.max(page - siblingCount, 1)
  const rightSibling = Math.min(page + siblingCount, pageCount)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < pageCount - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...Array.from({ length: 3 + siblingCount * 2 }, (_, index) => index + 1), 'ellipsis', pageCount]
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const start = pageCount - (2 + siblingCount * 2)
    return [1, 'ellipsis', ...Array.from({ length: 3 + siblingCount * 2 }, (_, index) => start + index)]
  }
  return [1, 'ellipsis', ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, index) => leftSibling + index), 'ellipsis', pageCount]
}

export function slicePageData<T>(data: readonly T[], page: number, pageSize: number): T[] {
  const start = (clampPage(page, getPageCount(data.length, pageSize)) - 1) * pageSize
  return data.slice(start, start + pageSize)
}

export function createPageSizeSelectOptions(options: readonly number[] = DEFAULT_PAGE_SIZE_OPTIONS) {
  return options.map((value) => ({ label: String(value), value: String(value) }))
}

/** 未传或非法尺寸落到 md；ssm 与 sm 都按 sm。 */
export function resolvePaginationSize(size?: RsComponentSize | null): RsPaginationSize {
  if (size === 'lg') return 'lg'
  if (size === 'sm' || size === 'ssm') return 'sm'
  return 'md'
}

export function shouldHidePagination(hideOnSinglePage: boolean, pageCount: number): boolean {
  return hideOnSinglePage && pageCount <= 1
}

/**
 * 页码条键盘位移。左右在 RTL 下对调。
 * Home / End 返回端点；不处理的键返回 null。
 */
export function resolvePaginationKeyboardMove(key: string, rtl = false): number | 'start' | 'end' | null {
  if (key === 'Home') return 'start'
  if (key === 'End') return 'end'
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  if (key === 'ArrowRight') return rtl ? -1 : 1
  return null
}

export function paginationItemKey(type: RsPaginationItemType, page = 0): string {
  return type === 'page' ? `page-${page}` : type
}

export function buildPaginationPagerItems(options: {
  page: number
  pageCount: number
  range: ReadonlyArray<number | 'ellipsis'>
  simple: boolean
  showFirstLast: boolean
  disabled: boolean
}): RsPaginationPagerItem[] {
  const { page, pageCount, range, simple, showFirstLast, disabled } = options
  const items: RsPaginationPagerItem[] = []
  const atFirst = page <= 1
  const atLast = page >= pageCount

  if (showFirstLast) {
    items.push({
      key: 'first',
      type: 'first',
      page: 1,
      active: false,
      disabled: disabled || atFirst,
    })
  }

  items.push({
    key: 'prev',
    type: 'prev',
    page: Math.max(1, page - 1),
    active: false,
    disabled: disabled || atFirst,
  })

  if (simple) {
    items.push({
      key: 'simple',
      type: 'simple',
      page,
      active: false,
      disabled: false,
    })
  } else {
    let ellipsisIndex = 0
    for (const entry of range) {
      if (entry === 'ellipsis') {
        items.push({
          key: `ellipsis-${ellipsisIndex}`,
          type: 'ellipsis',
          page: 0,
          active: false,
          disabled: false,
        })
        ellipsisIndex += 1
        continue
      }
      items.push({
        key: paginationItemKey('page', entry),
        type: 'page',
        page: entry,
        active: entry === page,
        disabled,
      })
    }
  }

  items.push({
    key: 'next',
    type: 'next',
    page: Math.min(pageCount, page + 1),
    active: false,
    disabled: disabled || atLast,
  })

  if (showFirstLast) {
    items.push({
      key: 'last',
      type: 'last',
      page: pageCount,
      active: false,
      disabled: disabled || atLast,
    })
  }

  return items
}

export function resolveFocusablePagerKeys(items: readonly RsPaginationPagerItem[]): string[] {
  const keys: string[] = []
  for (const item of items) {
    if (item.type === 'ellipsis' || item.type === 'simple' || item.disabled) continue
    keys.push(item.key)
  }
  return keys
}

export function resolveAdjacentPagerKey(
  keys: readonly string[],
  current: string | undefined,
  move: number | 'start' | 'end',
): string | undefined {
  if (keys.length === 0) return undefined
  if (move === 'start') return keys[0]
  if (move === 'end') return keys.at(-1)
  const index = current ? keys.indexOf(current) : -1
  let from = index
  if (from < 0) from = move > 0 ? -1 : keys.length
  return keys[from + move]
}
