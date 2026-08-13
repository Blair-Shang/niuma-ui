/**
 * RsTable 滚动宿主生命周期 + 无限加载触底。
 */

import { onActivated, onDeactivated, onMounted, ref, watch, type Ref } from 'vue'
import { isNearScrollBottom } from '../components/table-utils'

export interface UseRsTableScrollHostOptions {
  scrollContainerRef: Ref<HTMLElement | null | undefined>
  scheduleVirtualLayoutSync: () => void
  bindScrollElement: (el: HTMLElement | null | undefined) => void
  captureScrollFromDom: () => void
  onScrollFrame: (element: HTMLElement) => void
  hideCellTooltip: () => void
  infinite: () => boolean
  loading: () => boolean
  loadingMore: () => boolean
  hasMore: () => boolean
  infiniteDistance: () => number
  onLoadMore: () => void
}

/**
 * 绑定滚动生命周期与无限加载。
 */
export function useRsTableScrollHost(options: UseRsTableScrollHostOptions) {
  const loadMoreLocked = ref(false)

  onMounted(() => {
    options.scheduleVirtualLayoutSync()
    options.bindScrollElement(options.scrollContainerRef.value)
  })

  onActivated(() => {
    options.scheduleVirtualLayoutSync()
  })

  onDeactivated(() => {
    options.captureScrollFromDom()
  })

  function onScroll(event: Event): void {
    options.hideCellTooltip()
    const element = event.target as HTMLElement
    if (
      options.infinite() &&
      !options.loading() &&
      !options.loadingMore() &&
      options.hasMore() &&
      !loadMoreLocked.value
    ) {
      if (
        isNearScrollBottom(
          element.scrollTop,
          element.scrollHeight,
          element.clientHeight,
          options.infiniteDistance(),
        )
      ) {
        loadMoreLocked.value = true
        options.onLoadMore()
      }
    }
    options.onScrollFrame(element)
  }

  watch(
    () => [options.loadingMore(), options.hasMore()] as const,
    ([loadingMore, hasMore]) => {
      if (!loadingMore || !hasMore) loadMoreLocked.value = false
    },
  )

  return { onScroll, loadMoreLocked }
}
