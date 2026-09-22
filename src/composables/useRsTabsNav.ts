import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'
import {
  isVerticalTabsPosition,
  resolveVisibleTabValues,
  type RsTabItem,
  type RsTabsOverflow,
  type RsTabsPosition,
} from '../components/tabs/src/tabs-utils'

interface UseRsTabsNavOptions {
  items: ComputedRef<RsTabItem[]>
  activeValue: Ref<string>
  overflow: ComputedRef<RsTabsOverflow | false>
  canAdd: ComputedRef<boolean>
  navRef: Ref<HTMLElement | null>
  measureRef: Ref<HTMLElement | null>
  overflowRef: Ref<HTMLElement | null>
  /** 右侧 #extra 区域，计入下拉溢出预留宽度 */
  extraRef?: Ref<HTMLElement | null>
  addButtonWidth: number
  position?: ComputedRef<RsTabsPosition>
}

export function useRsTabsNav(options: UseRsTabsNavOptions) {
  const navViewportRef = ref<HTMLElement | null>(null)
  const triggerWidths = ref<Map<string, number>>(new Map())
  const visibleValues = ref<Set<string>>(new Set())
  const canScrollPrev = ref(false)
  const canScrollNext = ref(false)

  let resizeObserver: ResizeObserver | null = null
  let disposed = false
  let layoutRaf = 0
  let boundViewport: HTMLElement | null = null

  const axis = computed<'x' | 'y'>(() =>
    isVerticalTabsPosition(options.position?.value ?? 'top') ? 'y' : 'x',
  )
  const useDropdownOverflow = computed(() => options.overflow.value === 'dropdown')
  const useScrollOverflow = computed(() => options.overflow.value === 'scroll')

  const visibleTabItems = computed(() =>
    options.items.value.filter((item) => visibleValues.value.has(item.value)),
  )

  const hiddenItems = computed(() =>
    options.items.value.filter((item) => !visibleValues.value.has(item.value)),
  )

  const overflowMenuItems = computed(() =>
    hiddenItems.value.map((item) => ({ value: item.value, label: item.label })),
  )

  const activeInHidden = computed(() =>
    hiddenItems.value.some((item) => item.value === options.activeValue.value),
  )

  const showOverflowMenu = computed(
    () => useDropdownOverflow.value && hiddenItems.value.length > 0,
  )

  function measureAlongAxis(node: HTMLElement): number {
    return axis.value === 'y' ? node.offsetHeight : node.offsetWidth
  }

  function measureTriggerWidths(): Map<string, number> {
    const measureRoot = options.measureRef.value
    if (measureRoot) {
      const next = new Map<string, number>()
      for (const node of measureRoot.querySelectorAll<HTMLElement>('[data-tab-value]')) {
        const value = node.dataset.tabValue
        if (value) next.set(value, measureAlongAxis(node))
      }
      if (next.size > 0) return next
    }

    const viewport = navViewportRef.value
    const next = new Map<string, number>()
    if (!viewport) return next
    for (const trigger of viewport.querySelectorAll<HTMLElement>('.rs-tabs__trigger[data-tab-value]')) {
      const value = trigger.dataset.tabValue
      if (value) next.set(value, measureAlongAxis(trigger))
    }
    return next
  }

  function reservedSize(): number {
    let size = 0
    if (useDropdownOverflow.value && options.items.value.length > 1) {
      const overflowNode = options.overflowRef.value
      const overflowFallback = axis.value === 'y' ? 36 : 76
      size += overflowNode ? measureAlongAxis(overflowNode) : overflowFallback
    }
    if (options.canAdd.value) size += options.addButtonWidth
    const extra = options.extraRef?.value
    if (extra) size += measureAlongAxis(extra)
    return size
  }

  function recomputeVisibleTabs() {
    if (!useDropdownOverflow.value) {
      visibleValues.value = new Set(options.items.value.map((item) => item.value))
      return
    }

    const nav = options.navRef.value
    if (!nav) return

    triggerWidths.value = measureTriggerWidths()
    const available = axis.value === 'y' ? nav.clientHeight : nav.clientWidth
    visibleValues.value = resolveVisibleTabValues(
      options.items.value,
      triggerWidths.value,
      available,
      options.activeValue.value,
      reservedSize(),
      { keepActiveVisible: false },
    )
  }

  function updateScrollButtons() {
    const viewport = navViewportRef.value
    if (!viewport || !useScrollOverflow.value) {
      canScrollPrev.value = false
      canScrollNext.value = false
      return
    }
    if (axis.value === 'y') {
      canScrollPrev.value = viewport.scrollTop > 1
      canScrollNext.value =
        viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1
      return
    }
    canScrollPrev.value = viewport.scrollLeft > 1
    canScrollNext.value =
      viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1
  }

  function scrollNav(direction: -1 | 1) {
    const viewport = navViewportRef.value
    if (!viewport) return
    const delta = direction * 180
    if (axis.value === 'y') {
      viewport.scrollBy({ top: delta, behavior: 'smooth' })
      return
    }
    viewport.scrollBy({ left: delta, behavior: 'smooth' })
  }

  function onNavScroll() {
    updateScrollButtons()
  }

  function scrollElementIntoView(el: HTMLElement, viewport: HTMLElement) {
    if (axis.value === 'y') {
      const top = el.offsetTop
      const bottom = top + el.offsetHeight
      if (top < viewport.scrollTop) viewport.scrollTop = top
      else if (bottom > viewport.scrollTop + viewport.clientHeight) {
        viewport.scrollTop = bottom - viewport.clientHeight
      }
      return
    }
    const left = el.offsetLeft
    const right = left + el.offsetWidth
    if (left < viewport.scrollLeft) viewport.scrollLeft = left
    else if (right > viewport.scrollLeft + viewport.clientWidth) {
      viewport.scrollLeft = right - viewport.clientWidth
    }
  }

  async function scrollActiveTabIntoView() {
    if (!useScrollOverflow.value) return
    await nextTick()
    if (disposed) return
    const viewport = navViewportRef.value
    if (!viewport) return
    const active = viewport.querySelector<HTMLElement>(`.rs-tabs__trigger[data-state='active']`)
    if (active) scrollElementIntoView(active, viewport)
    updateScrollButtons()
  }

  function onNavWheel(event: WheelEvent) {
    if (disposed || !useScrollOverflow.value || axis.value === 'y') return
    const viewport = navViewportRef.value
    if (!viewport) return
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    if (viewport.scrollWidth <= viewport.clientWidth) return
    event.preventDefault()
    viewport.scrollLeft += event.deltaY
    onNavScroll()
  }

  function unbindWheel() {
    if (!boundViewport) return
    boundViewport.removeEventListener('wheel', onNavWheel)
    boundViewport = null
  }

  function bindWheel() {
    const viewport = navViewportRef.value
    unbindWheel()
    if (!viewport || !useScrollOverflow.value || axis.value === 'y') return
    viewport.addEventListener('wheel', onNavWheel, { passive: false })
    boundViewport = viewport
  }

  function scheduleLayout() {
    if (disposed) return
    if (layoutRaf) cancelAnimationFrame(layoutRaf)
    layoutRaf = requestAnimationFrame(() => {
      layoutRaf = 0
      if (disposed) return
      recomputeVisibleTabs()
      updateScrollButtons()
      bindWheel()
    })
  }

  onMounted(() => {
    scheduleLayout()
    const nav = options.navRef.value
    if (!nav || typeof ResizeObserver === 'undefined') return
    resizeObserver = new ResizeObserver(() => scheduleLayout())
    resizeObserver.observe(nav)
  })

  onUnmounted(() => {
    disposed = true
    if (layoutRaf) cancelAnimationFrame(layoutRaf)
    layoutRaf = 0
    unbindWheel()
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  watch(
    () =>
      [
        options.items.value.map((item) => item.value).join('\0'),
        options.items.value
          .map((item) => `${item.label}\0${item.icon ?? ''}\0${item.badge ?? ''}`)
          .join('\n'),
        options.overflow.value,
        options.canAdd.value,
        axis.value,
      ].join('\n'),
    () => scheduleLayout(),
  )

  watch(options.activeValue, () => {
    scheduleLayout()
    void scrollActiveTabIntoView()
  })

  watch(navViewportRef, () => bindWheel())

  return {
    navViewportRef,
    useDropdownOverflow,
    useScrollOverflow,
    visibleTabItems,
    hiddenItems,
    overflowMenuItems,
    activeInHidden,
    showOverflowMenu,
    canScrollPrev,
    canScrollNext,
    scrollNav,
    onNavScroll,
    scheduleLayout,
    axis,
  }
}
