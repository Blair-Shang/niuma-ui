export { default as RsPagination } from './src/RsPagination.vue'
export type {
  RsPaginationAlign,
  RsPaginationExpose,
  RsPaginationInstance,
  RsPaginationItemSlot,
  RsPaginationItemType,
  RsPaginationSize,
  RsPaginationSummarySlot,
} from './src/pagination-utils'
export {
  buildPaginationPagerItems,
  clampPage,
  createPageSizeSelectOptions,
  DEFAULT_PAGE_SIZE_OPTIONS,
  getPageCount,
  getPaginationRange,
  paginationItemKey,
  resolveAdjacentPagerKey,
  resolveFocusablePagerKeys,
  resolvePaginationKeyboardMove,
  resolvePaginationSize,
  shouldHidePagination,
  slicePageData,
} from './src/pagination-utils'
