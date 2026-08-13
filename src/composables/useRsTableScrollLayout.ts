/**
 * RsTable 滚动与视口布局：测量、节流同步、keep-alive / layoutActive 恢复。
 *
 * 职责边界：
 * - 做：scrollTop/Left、视口宽高、写回 DOM、ResizeObserver、RAF 节流滚动
 * - 不做：虚拟切片本身、无限加载业务判定（由调用方在 onScroll 钩子中处理）
 */

import {
  computed,
  nextTick,
  onUnmounted,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'

/** 统一读取 ComputedRef / getter */
function read<T>(source: ComputedRef<T> | (() => T)): T {
  return typeof source === 'function' ? (source as () => T)() : source.value
}

export interface UseRsTableScrollLayoutOptions {
  /** 显式高度（number / px 字符串优先于测量值） */
  height: ComputedRef<number | string | undefined> | (() => number | string | undefined)
  /** 外层 keep-alive 可见性；false→快照，true→恢复 */
  layoutActive: ComputedRef<boolean | undefined> | (() => boolean | undefined)
  /** 视图切换标识；变化时重置滚动（跳过首次） */
  viewKey: ComputedRef<string | number | undefined> | (() => string | number | undefined)
  /** 无测量值时的回退视口高度 */
  fallbackViewportHeight?: number
}

/**
 * 表格滚动容器与视口状态。
 *
 * @returns 滚动状态、视口尺寸、恢复/重置 API、bindScrollElement / onScrollFrame
 */
export function useRsTableScrollLayout(options: UseRsTableScrollLayoutOptions) {
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const scrollContainerRef = ref<HTMLElement | null>(null)
  const measuredViewportHeight = ref(0)
  const measuredViewportWidth = ref(0)

  let viewportResizeObserver: ResizeObserver | null = null
  let preservedScrollTop = 0
  let preservedScrollLeft = 0
  let restoringScroll = false
  let restoreGeneration = 0
  let scrollRafId = 0

  const fallback = options.fallbackViewportHeight ?? 320

  /** 虚拟切片用视口高度：显式 height > 测量值 > DOM > fallback */
  const viewportHeight = computed(() => {
    const h = read(options.height)
    if (typeof h === 'number' && h > 0) return h
    if (typeof h === 'string') {
      const parsed = Number.parseInt(h, 10)
      if (Number.isFinite(parsed) && parsed > 0 && !h.includes('%')) return parsed
    }
    if (measuredViewportHeight.value > 0) return measuredViewportHeight.value
    const el = scrollContainerRef.value
    if (el && el.clientHeight > 0) return el.clientHeight
    return fallback
  })

  function syncMeasuredViewportSize(): void {
    const el = scrollContainerRef.value
    if (!el) return
    const nextH = el.clientHeight
    if (nextH > 0 && nextH !== measuredViewportHeight.value) {
      measuredViewportHeight.value = nextH
    }
    const nextW = el.clientWidth
    if (nextW > 0 && nextW !== measuredViewportWidth.value) {
      measuredViewportWidth.value = nextW
    }
  }

  /**
   * 失活前快照滚动。
   * DOM 脱离文档后 scrollTop 常为 0——切勿用 0 覆盖 onScroll 已写入的位置。
   */
  function captureScrollFromDom(): void {
    const el = scrollContainerRef.value
    if (el) {
      if (el.scrollTop > 0) scrollTop.value = el.scrollTop
      if (el.scrollLeft > 0) scrollLeft.value = el.scrollLeft
    }
    if (scrollTop.value > 0) preservedScrollTop = scrollTop.value
    if (scrollLeft.value > 0) preservedScrollLeft = scrollLeft.value
  }

  /** 将内部保存的滚动写回 DOM，并同步 reactive（驱动虚拟切片）。 */
  function restoreScrollToDom(): void {
    const el = scrollContainerRef.value
    if (!el) return
    syncMeasuredViewportSize()
    const top = preservedScrollTop
    const left = preservedScrollLeft
    if (scrollTop.value !== top) scrollTop.value = top
    if (scrollLeft.value !== left) scrollLeft.value = left
    if (el.scrollTop !== top) el.scrollTop = top
    if (el.scrollLeft !== left) el.scrollLeft = left
  }

  /**
   * 布局稳定后多次写回滚动：keep-alive 切回首帧 clientHeight 常为 0，
   * 需等 nextTick / rAF / 视口测稳后再设 scrollTop，否则会被浏览器钳成 0。
   */
  function scheduleVirtualLayoutSync(): void {
    restoreGeneration += 1
    const gen = restoreGeneration
    restoringScroll = true
    const apply = (): void => {
      if (gen !== restoreGeneration) return
      restoreScrollToDom()
    }
    apply()
    void nextTick(() => {
      apply()
      requestAnimationFrame(() => {
        apply()
        requestAnimationFrame(() => {
          apply()
          if (gen === restoreGeneration) restoringScroll = false
        })
      })
    })
  }

  function resetScrollPosition(): void {
    preservedScrollTop = 0
    preservedScrollLeft = 0
    scrollTop.value = 0
    scrollLeft.value = 0
    const el = scrollContainerRef.value
    if (el) {
      el.scrollTop = 0
      el.scrollLeft = 0
    }
    scheduleVirtualLayoutSync()
  }

  function isRestoringScroll(): boolean {
    return restoringScroll
  }

  /**
   * RAF 节流写入滚动位置；恢复窗口内忽略伪 scrollTop=0。
   * @returns true 表示本帧已调度或处于恢复中（调用方仍可先做无限加载判断）
   */
  function onScrollFrame(element: HTMLElement): void {
    if (scrollRafId) return
    scrollRafId = requestAnimationFrame(() => {
      if (restoringScroll) {
        scrollRafId = 0
        return
      }
      scrollTop.value = element.scrollTop
      scrollLeft.value = element.scrollLeft
      preservedScrollTop = element.scrollTop
      preservedScrollLeft = element.scrollLeft
      scrollRafId = 0
    })
  }

  /**
   * 绑定滚动容器 ResizeObserver：视口从 0→实高时补一次恢复写回。
   */
  function bindScrollElement(el: HTMLElement | null | undefined): void {
    viewportResizeObserver?.disconnect()
    viewportResizeObserver = null
    if (!el || typeof ResizeObserver === 'undefined') return
    viewportResizeObserver = new ResizeObserver(() => {
      const prevH = measuredViewportHeight.value
      syncMeasuredViewportSize()
      if (
        prevH === 0 &&
        measuredViewportHeight.value > 0 &&
        (preservedScrollTop > 0 || preservedScrollLeft > 0)
      ) {
        restoringScroll = true
        restoreScrollToDom()
        requestAnimationFrame(() => {
          restoringScroll = false
        })
      }
    })
    viewportResizeObserver.observe(el)
  }

  function disposeScrollLayout(): void {
    viewportResizeObserver?.disconnect()
    viewportResizeObserver = null
    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId)
      scrollRafId = 0
    }
  }

  watch(
    () => read(options.layoutActive),
    (active, prev) => {
      if (active === false && prev !== false) {
        captureScrollFromDom()
      }
    },
    { flush: 'sync' },
  )

  watch(
    () => read(options.layoutActive),
    (active) => {
      if (active) scheduleVirtualLayoutSync()
    },
    { flush: 'post' },
  )

  watch(
    () => read(options.viewKey),
    (_next, prev) => {
      if (prev === undefined) return
      resetScrollPosition()
    },
  )

  onUnmounted(() => {
    disposeScrollLayout()
  })

  return {
    scrollTop,
    scrollLeft,
    scrollContainerRef,
    measuredViewportHeight,
    measuredViewportWidth,
    viewportHeight,
    syncMeasuredViewportSize,
    captureScrollFromDom,
    restoreScrollToDom,
    scheduleVirtualLayoutSync,
    resetScrollPosition,
    isRestoringScroll,
    onScrollFrame,
    bindScrollElement,
    disposeScrollLayout,
  }
}

/** useRsTableScrollLayout 返回值类型 */
export type RsTableScrollLayoutApi = ReturnType<typeof useRsTableScrollLayout>
