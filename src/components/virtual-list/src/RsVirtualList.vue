<script setup lang="ts" generic="T">
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, useAttrs, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { resolveDirMode } from '../../../locale/apply'
import type { RsRadius } from '../../../theme/types'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import type { RsVirtualListAlign, RsVirtualListItemKey, RsVirtualListItemSize, RsVirtualListOrientation } from './virtual-list-utils'
import {
  buildVirtualMetrics,
  contentToScroll,
  detectRtlScrollType,
  isVirtualListFillHeight,
  parseVirtualListHeightPx,
  readHorizontalOffset,
  readVirtualItemBox,
  resolveAlignedOffset,
  resolveItemSize,
  resolveVirtualListHeight,
  resolveVirtualListKeyIndex,
  resolveVisibleRange,
  scrollToContent,
  windowOrigin,
  writeHorizontalOffset,
} from './virtual-list-utils'

defineOptions({ name: 'RsVirtualList' })

const props = withDefaults(
  defineProps<{
    items: T[]
    itemSize?: RsVirtualListItemSize
    /** `'auto'` 时，测量前用来估算总高度。 */
    estimateSize?: number
    height?: number | string
    overscan?: number
    /** keep-alive 外层可见性；变为 true 时重同步视口与 scroll 位置 */
    layoutActive?: boolean
    /** 外层圆角。直角列表传 `none`。默认 sm。 */
    radius?: RsRadius
    /** 滚动轴。默认纵向。 */
    orientation?: RsVirtualListOrientation
    /** 稳定键。默认用索引，滚动时复用同一批节点。 */
    itemKey?: RsVirtualListItemKey<T>
    /**
     * 方向键 / Home / End 移动当前项。默认关，避免抢走外层（如日志）的键盘。
     * 打开后根是 listbox，需要焦点。
     */
    keyboard?: boolean
    /** 外框。嵌进已有表面时关掉。 */
    bordered?: boolean
    ariaLabel?: string
    id?: string
  }>(),
  {
    itemSize: 32,
    estimateSize: 32,
    height: 240,
    overscan: 4,
    orientation: 'vertical',
    keyboard: false,
    bordered: true,
  },
)

const activeIndex = defineModel<number | null>('activeIndex', { default: null })

const emit = defineEmits<{
  /** 原生 scroll。载荷是 Event，便于读取 target.scrollTop。 */
  scroll: [event: Event]
  change: [index: number, item: T]
}>()

const attrs = useAttrs()
const { t } = useRsI18n()
const config = useRsConfigOptional()
const uid = useId()

const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const rootRef = ref<HTMLElement | null>(null)
const scrollOffset = ref(0)
const measured = ref(0)
const scrolling = ref(false)
const rtl = ref(false)
const measureVersion = ref(0)

const measuredSizes = new Map<number, number>()
const indexByEl = new WeakMap<Element, number>()
const observed = new Set<Element>()

let resizeObserver: ResizeObserver | null = null
let itemObserver: ResizeObserver | null = null
let disposed = false
let ignoreActiveScroll = false
let layoutGen = 0
let layoutFrame = 0
let activeFrame = 0
let scrollIdle = 0
let rtlScrollType = detectRtlScrollType()

const fillHeight = computed(() => isVirtualListFillHeight(props.height))
const horizontal = computed(() => props.orientation === 'horizontal')
const rootId = computed(() => props.id || `rs-virtual-list-${uid}`)
const listRole = computed(() => {
  if (attrs.role) return undefined
  return props.keyboard ? 'listbox' : undefined
})
const resolvedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (attrs['aria-label'] || attrs.ariaLabel) return undefined
  if (props.keyboard) return t('virtualList.label')
  return undefined
})
const emptyLabel = computed(() => t('virtualList.empty'))
const heightStyle = computed(() => {
  const resolved = resolveVirtualListHeight(props.height)
  return resolved ? { height: resolved } : undefined
})

const metrics = computed(() => {
  const version = measureVersion.value
  return buildVirtualMetrics(
    props.items.length,
    props.itemSize,
    version >= 0 ? measuredSizes : null,
    resolveItemSize(props.estimateSize),
  )
})

const viewportPx = computed(() => {
  if (!horizontal.value) {
    const parsed = parseVirtualListHeightPx(props.height)
    if (parsed != null) return parsed
  }
  if (measured.value > 0) return measured.value
  const el = rootRef.value
  if (el) {
    const live = horizontal.value ? el.clientWidth : el.clientHeight
    if (live > 0) return live
  }
  return 240
})

const contentOffset = computed(() =>
  scrollToContent(scrollOffset.value, metrics.value.total, viewportPx.value, metrics.value.extent),
)

const range = computed(() =>
  resolveVisibleRange(props.items.length, contentOffset.value, viewportPx.value, props.overscan, metrics.value),
)

const origin = computed(() => windowOrigin(scrollOffset.value, contentOffset.value, range.value.offset))
const shiftX = computed(() => {
  if (!horizontal.value) return 0
  return rtl.value ? -origin.value : origin.value
})
const shiftY = computed(() => (horizontal.value ? 0 : origin.value))

const rootStyle = computed(() => ({
  ...heightStyle.value,
  '--rs-virtual-list-radius': rsRadiusCss(resolvedRadius.value),
  '--rs-virtual-list-x': `${shiftX.value}px`,
  '--rs-virtual-list-y': `${shiftY.value}px`,
}))

const spacerStyle = computed(() => {
  const extent = `${metrics.value.extent}px`
  return horizontal.value ? { width: extent, height: '100%' } : { height: extent }
})

const visibleItems = computed(() => {
  const { start, end } = range.value
  return props.items.slice(start, end).map((item, index) => {
    const itemIndex = start + index
    return {
      item,
      index: itemIndex,
      key: props.itemKey ? props.itemKey(item, itemIndex) : itemIndex,
    }
  })
})

const activeDescendant = computed(() => {
  if (!props.keyboard || activeIndex.value == null || activeIndex.value < 0) return undefined
  return `${rootId.value}-opt-${activeIndex.value}`
})

function itemStyle(index: number): Record<string, string> | undefined {
  if (props.itemSize === 'auto') {
    const known = measuredSizes.get(index)
    if (known == null) return undefined
    const size = `${known}px`
    return horizontal.value ? { width: size } : { height: size }
  }
  const size = `${metrics.value.sizeAt(index)}px`
  return horizontal.value ? { width: size } : { height: size }
}

function optionId(index: number): string | undefined {
  if (!props.keyboard || attrs.role) return undefined
  return `${rootId.value}-opt-${index}`
}

function isRtlHost(): boolean {
  if (config) return resolveDirMode(config.dir.value, config.locale.value) === 'rtl'
  const parent = rootRef.value?.parentElement
  if (parent && typeof getComputedStyle === 'function') {
    return getComputedStyle(parent).direction === 'rtl'
  }
  return false
}

function syncDir(): void {
  rtl.value = isRtlHost()
}

function axisSize(el: HTMLElement): number {
  return horizontal.value ? el.clientWidth : el.clientHeight
}

function readRawScroll(el: HTMLElement): number {
  if (!horizontal.value) return el.scrollTop
  const max = Math.max(0, el.scrollWidth - el.clientWidth)
  return readHorizontalOffset(el.scrollLeft, max, rtl.value, rtlScrollType)
}

function writeRawScroll(el: HTMLElement, offset: number): void {
  if (!horizontal.value) {
    el.scrollTop = offset
    return
  }
  const max = Math.max(0, el.scrollWidth - el.clientWidth)
  el.scrollLeft = writeHorizontalOffset(offset, max, rtl.value, rtlScrollType)
}

function syncMeasured(): void {
  const el = rootRef.value
  if (!el) return
  const next = horizontal.value ? el.clientWidth : el.clientHeight
  if (next > 0 && next !== measured.value) measured.value = next
}

function syncLayoutFromDom(): void {
  syncDir()
  syncMeasured()
  const el = rootRef.value
  if (el) scrollOffset.value = readRawScroll(el)
}

function frame(callback: () => void): number {
  if (typeof requestAnimationFrame !== 'function') {
    callback()
    return 0
  }
  return requestAnimationFrame(callback)
}

function scheduleLayoutSync(): void {
  if (disposed) return
  const gen = ++layoutGen
  syncLayoutFromDom()
  void nextTick(() => {
    if (disposed || gen !== layoutGen) return
    syncLayoutFromDom()
    if (layoutFrame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(layoutFrame)
    layoutFrame = frame(() => {
      layoutFrame = 0
      if (!disposed && gen === layoutGen) syncLayoutFromDom()
    })
  })
}

function markScrolling(): void {
  if (disposed) return
  if (!scrolling.value) scrolling.value = true
  if (scrollIdle) clearTimeout(scrollIdle)
  scrollIdle = setTimeout(() => {
    scrollIdle = 0
    if (!disposed) scrolling.value = false
  }, 120) as unknown as number
}

function onScroll(event: Event): void {
  emit('scroll', event)
  const el = event.currentTarget
  if (!(el instanceof HTMLElement) || disposed) return
  const next = readRawScroll(el)
  if (next !== scrollOffset.value) scrollOffset.value = next
  markScrolling()
}

function scrollToIndex(index: number, align: RsVirtualListAlign = 'center'): void {
  const el = rootRef.value
  if (!el || index < 0 || index >= props.items.length) return
  const view = axisSize(el) > 0 ? axisSize(el) : viewportPx.value
  const content = scrollToContent(readRawScroll(el), metrics.value.total, view, metrics.value.extent)
  const nextContent = resolveAlignedOffset({
    index,
    align,
    count: props.items.length,
    viewport: view,
    contentOffset: content,
    total: metrics.value.total,
    offsetAt: metrics.value.offsetAt,
    sizeAt: metrics.value.sizeAt,
  })
  if (nextContent == null) return
  const nextScroll = contentToScroll(nextContent, metrics.value.total, view, metrics.value.extent)
  writeRawScroll(el, nextScroll)
  scrollOffset.value = readRawScroll(el)
}

function scrollToOffset(offset: number): void {
  const el = rootRef.value
  if (!el || !Number.isFinite(offset)) return
  const view = axisSize(el) > 0 ? axisSize(el) : viewportPx.value
  const nextScroll = contentToScroll(Math.max(0, offset), metrics.value.total, view, metrics.value.extent)
  writeRawScroll(el, nextScroll)
  scrollOffset.value = readRawScroll(el)
}

function getScrollOffset(): number {
  const el = rootRef.value
  const raw = el ? readRawScroll(el) : scrollOffset.value
  const view = el && axisSize(el) > 0 ? axisSize(el) : viewportPx.value
  return scrollToContent(raw, metrics.value.total, view, metrics.value.extent)
}

function getViewport(): HTMLElement | undefined {
  return rootRef.value ?? undefined
}

function focus(): void {
  rootRef.value?.focus()
}

function selectIndex(index: number, item: T): void {
  if (index < 0 || index >= props.items.length) return
  activeIndex.value = index
  emit('change', index, item)
}

function onItemClick(index: number, item: T): void {
  selectIndex(index, item)
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function pageSize(): number {
  const sample = metrics.value.fixed ?? metrics.value.sizeAt(0)
  if (sample <= 0) return 1
  return Math.max(1, Math.floor(viewportPx.value / sample))
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.keyboard || isTypingTarget(event.target)) return
  const next = resolveVirtualListKeyIndex({
    key: event.key,
    index: activeIndex.value,
    count: props.items.length,
    orientation: props.orientation,
    rtl: rtl.value,
    pageSize: pageSize(),
  })
  if (next == null) return
  event.preventDefault()
  if (next === activeIndex.value) return
  const item = props.items[next]
  if (item === undefined) return
  ignoreActiveScroll = true
  selectIndex(next, item)
  scrollToIndex(next, 'nearest')
}

function ensureItemObserver(): void {
  if (itemObserver || props.itemSize !== 'auto' || typeof ResizeObserver === 'undefined') return
  itemObserver = new ResizeObserver((entries) => {
    if (disposed || props.itemSize !== 'auto') return
    let changed = false
    for (const entry of entries) {
      const index = indexByEl.get(entry.target)
      if (index == null) continue
      if (applyMeasure(index, readVirtualItemBox(entry, props.orientation))) changed = true
    }
    if (changed) measureVersion.value += 1
  })
}

function applyMeasure(index: number, next: number): boolean {
  if (next <= 0) return false
  const estimate = resolveItemSize(props.estimateSize)
  const prev = measuredSizes.get(index)
  const before = prev ?? estimate
  if (prev != null && Math.abs(prev - next) < 0.5) return false
  measuredSizes.set(index, next)
  if (prev == null && Math.abs(next - estimate) < 0.5) return false
  const delta = next - before
  const el = rootRef.value
  if (el && delta !== 0 && metrics.value.extent === metrics.value.total && index < range.value.start) {
    writeRawScroll(el, readRawScroll(el) + delta)
    scrollOffset.value = readRawScroll(el)
  }
  return true
}

function bindItem(el: Element | null, index: number): void {
  if (props.itemSize !== 'auto' || !(el instanceof Element)) return
  indexByEl.set(el, index)
  if (observed.has(el)) return
  ensureItemObserver()
  observed.add(el)
  itemObserver?.observe(el)
}

function sweepObserved(): void {
  for (const el of observed) {
    if (!el.isConnected) {
      itemObserver?.unobserve(el)
      observed.delete(el)
    }
  }
}

function disconnectItemObserver(): void {
  itemObserver?.disconnect()
  itemObserver = null
  observed.clear()
}

function releaseItemObserver(): void {
  disconnectItemObserver()
  measuredSizes.clear()
}

onMounted(() => {
  rtlScrollType = detectRtlScrollType()
  scheduleLayoutSync()
  const el = rootRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => {
    if (!disposed) syncMeasured()
  })
  resizeObserver.observe(el)
  if (props.itemSize === 'auto') ensureItemObserver()
})

onActivated(() => {
  scheduleLayoutSync()
})

watch(
  () => props.layoutActive,
  (active) => {
    if (active) scheduleLayoutSync()
  },
  { flush: 'post' },
)

watch(
  () => props.items.length,
  (count) => {
    for (const key of measuredSizes.keys()) {
      if (key >= count) measuredSizes.delete(key)
    }
  },
)

watch(
  () => props.itemSize === 'auto',
  (auto) => {
    if (!auto) {
      releaseItemObserver()
      measureVersion.value += 1
      return
    }
    ensureItemObserver()
  },
)

watch(
  () => [range.value.start, range.value.end] as const,
  () => {
    if (props.itemSize !== 'auto') return
    void nextTick(() => {
      if (!disposed) sweepObserved()
    })
  },
)

watch(
  () => [activeIndex.value, props.items.length] as const,
  async ([index, length]) => {
    if (ignoreActiveScroll) {
      ignoreActiveScroll = false
      return
    }
    if (disposed || index == null || index < 0 || length === 0) return
    await nextTick()
    if (disposed || ignoreActiveScroll) {
      ignoreActiveScroll = false
      return
    }
    if (activeFrame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(activeFrame)
    activeFrame = frame(() => {
      activeFrame = 0
      if (!disposed) scrollToIndex(index)
    })
  },
  { immediate: true },
)

onUnmounted(() => {
  disposed = true
  layoutGen += 1
  if (typeof cancelAnimationFrame === 'function') {
    if (layoutFrame) cancelAnimationFrame(layoutFrame)
    if (activeFrame) cancelAnimationFrame(activeFrame)
  }
  layoutFrame = 0
  activeFrame = 0
  if (scrollIdle) clearTimeout(scrollIdle)
  scrollIdle = 0
  resizeObserver?.disconnect()
  resizeObserver = null
  disconnectItemObserver()
})

defineExpose({ scrollToIndex, scrollToOffset, getScrollOffset, getViewport, focus })
</script>

<template>
  <div
    :id="rootId"
    ref="rootRef"
    class="rs-virtual-list"
    :class="{
      'rs-virtual-list--fill': fillHeight,
      'rs-virtual-list--horizontal': horizontal,
      'rs-virtual-list--borderless': !bordered,
      'rs-virtual-list--keyboard': keyboard,
      'rs-virtual-list--auto': itemSize === 'auto',
      'rs-virtual-list--scrolling': scrolling,
    }"
    :style="rootStyle"
    :role="listRole || undefined"
    :aria-label="resolvedAriaLabel || undefined"
    :aria-activedescendant="activeDescendant"
    :tabindex="keyboard ? 0 : undefined"
    @scroll="onScroll"
    @keydown="onKeydown"
  >
    <div v-if="items.length === 0" class="rs-virtual-list__empty" role="status">
      <slot name="empty">{{ emptyLabel }}</slot>
    </div>
    <div v-else class="rs-virtual-list__spacer" :style="spacerStyle">
      <div class="rs-virtual-list__items">
        <div
          v-for="entry in visibleItems"
          :key="entry.key"
          :ref="(el) => bindItem(el as Element | null, entry.index)"
          class="rs-virtual-list__item"
          :class="{ 'rs-virtual-list__item--active': activeIndex === entry.index }"
          :id="optionId(entry.index)"
          :role="listRole === 'listbox' ? 'option' : undefined"
          :aria-selected="listRole === 'listbox' ? (activeIndex === entry.index ? 'true' : 'false') : undefined"
          :aria-current="listRole === 'listbox' ? undefined : activeIndex === entry.index ? 'true' : undefined"
          :style="itemStyle(entry.index)"
          @click="onItemClick(entry.index, entry.item)"
        >
          <slot :item="entry.item" :index="entry.index">
            {{ entry.item }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rs-virtual-list {
  overflow: auto;
  box-sizing: border-box;
  border: 1px solid var(--rs-virtual-list-border, var(--rs-border-subtle));
  border-radius: var(--rs-virtual-list-radius, var(--rs-radius-sm));
  background: var(--rs-virtual-list-bg, var(--rs-surface));
  color: var(--rs-virtual-list-fg, var(--rs-text-primary));
  text-align: start;
}
.rs-virtual-list--horizontal {
  overflow-x: auto;
  overflow-y: hidden;
}
.rs-virtual-list--borderless {
  border-color: transparent;
  background: transparent;
}
.rs-virtual-list--fill {
  flex: 1;
  align-self: stretch;
  width: 100%;
  min-height: 0;
  height: 0;
}
.rs-virtual-list--keyboard:focus-visible {
  outline: var(--rs-focus-ring-width, 2px) solid var(--rs-focus-border);
  outline-offset: calc(var(--rs-focus-ring-width, 2px) * -1);
}
.rs-virtual-list__spacer {
  position: relative;
}
.rs-virtual-list__items {
  position: absolute;
  inset-inline: 0;
  top: 0;
  transform: translate3d(var(--rs-virtual-list-x, 0px), var(--rs-virtual-list-y, 0px), 0);
}
.rs-virtual-list--scrolling .rs-virtual-list__items {
  will-change: transform;
}
.rs-virtual-list--horizontal .rs-virtual-list__items {
  inset-inline: auto;
  inset-inline-start: 0;
  display: flex;
  flex-direction: row;
  width: max-content;
  height: 100%;
}
.rs-virtual-list__item {
  position: relative;
  box-sizing: border-box;
}
.rs-virtual-list--horizontal .rs-virtual-list__item {
  flex: none;
  height: 100%;
}
.rs-virtual-list__item--active {
  background: var(
    --rs-virtual-list-active-bg,
    color-mix(in srgb, var(--rs-primary) 14%, var(--rs-surface))
  );
}
.rs-virtual-list__item--active::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block: 0;
  width: var(--rs-virtual-list-accent-width, 0.125rem);
  background: var(--rs-virtual-list-accent, var(--rs-primary));
  pointer-events: none;
}
.rs-virtual-list__empty {
  padding: var(--rs-space-lg);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  text-align: start;
}
@media (prefers-reduced-motion: reduce) {
  .rs-virtual-list--scrolling .rs-virtual-list__items {
    will-change: auto;
  }
}
</style>
