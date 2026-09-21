<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import {
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbSize,
  isRsScrollbarBarVisible,
  isRsScrollbarOverflow,
  isScrollingWithinScrollbarBounds,
  resolveScrollbarSize,
  showsRsScrollbarAxis,
  toCssInt,
  type RsScrollbarAxis,
  type RsScrollbarOrientation,
  type RsScrollbarSizes,
  type RsScrollbarType,
} from './scrollbar-utils'

defineOptions({ name: 'RsScrollbar' })

export type { RsScrollbarOrientation, RsScrollbarType }

const props = withDefaults(
  defineProps<{
    type?: RsScrollbarType
    scrollHideDelay?: number
    orientation?: RsScrollbarOrientation
    height?: string | number
    maxHeight?: string | number
    minHeight?: string | number
  }>(),
  {
    type: 'hover',
    scrollHideDelay: 600,
    orientation: 'both',
    height: '14rem',
  },
)

const { t } = useRsI18n()
const config = useRsConfigOptional()
const viewportLabel = computed(() => t('scrollbar.viewport'))
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const viewportRef = useTemplateRef<HTMLElement>('viewportRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
const barYRef = useTemplateRef<HTMLElement>('barYRef')
const barXRef = useTemplateRef<HTMLElement>('barXRef')

const hovering = ref(false)
const interacting = ref(false)
const scrollingY = ref(false)
const scrollingX = ref(false)
const overflowY = ref(false)
const overflowX = ref(false)

const showVertical = computed(() => showsRsScrollbarAxis(props.orientation, 'y'))
const showHorizontal = computed(() => showsRsScrollbarAxis(props.orientation, 'x'))

const barYVisible = computed(() =>
  isRsScrollbarBarVisible({
    type: props.type,
    overflowing: overflowY.value,
    hovering: hovering.value,
    scrolling: scrollingY.value,
    interacting: interacting.value,
  }),
)
const barXVisible = computed(() =>
  isRsScrollbarBarVisible({
    type: props.type,
    overflowing: overflowX.value,
    hovering: hovering.value,
    scrolling: scrollingX.value,
    interacting: interacting.value,
  }),
)
const showCorner = computed(
  () => showVertical.value && showHorizontal.value && barYVisible.value && barXVisible.value,
)

const textDir = computed(() =>
  resolveDirMode(config?.dir.value ?? 'auto', config?.locale.value ?? 'zh-CN'),
)

const rootStyle = computed(() => {
  const style: Record<string, string> = {}
  const height = resolveScrollbarSize(props.height)
  const maxHeight = resolveScrollbarSize(props.maxHeight)
  const minHeight = resolveScrollbarSize(props.minHeight)
  if (height) style.height = height
  if (maxHeight) style.maxHeight = maxHeight
  if (minHeight) style.minHeight = minHeight
  style['--rs-scrollbar-corner'] = showCorner.value ? 'var(--rs-scrollbar-size)' : '0px'
  return style
})

const viewportStyle = computed(() => ({
  overflowX: (showHorizontal.value ? 'scroll' : 'hidden') as 'scroll' | 'hidden',
  overflowY: (showVertical.value ? 'scroll' : 'hidden') as 'scroll' | 'hidden',
}))

const contentStyle = computed(() => ({
  minWidth: showHorizontal.value ? 'fit-content' : undefined,
}))

let hideYTimer: ReturnType<typeof setTimeout> | undefined
let hideXTimer: ReturnType<typeof setTimeout> | undefined
let hoverTimer: ReturnType<typeof setTimeout> | undefined
let scrollRaf = 0
let pendingScrollFlags = false
let observer: ResizeObserver | undefined
let dragging: RsScrollbarAxis | null = null
let pointerOffset = 0
let prevUserSelect = ''
let userSelectLocked = false

const canUseRaf = typeof requestAnimationFrame === 'function'

function clearTimer(timer: ReturnType<typeof setTimeout> | undefined) {
  if (timer !== undefined) clearTimeout(timer)
}

function scheduleFrame(fn: FrameRequestCallback): number {
  if (canUseRaf) return requestAnimationFrame(fn)
  return setTimeout(() => fn(0), 16) as unknown as number
}

function cancelFrame(id: number) {
  if (canUseRaf && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id)
    return
  }
  clearTimeout(id)
}

function sizesFor(axis: RsScrollbarAxis): RsScrollbarSizes | null {
  const viewport = viewportRef.value
  const bar = axis === 'y' ? barYRef.value : barXRef.value
  if (!viewport || !bar) return null
  const style = typeof getComputedStyle === 'function' ? getComputedStyle(bar) : undefined
  if (axis === 'y') {
    return {
      content: viewport.scrollHeight,
      viewport: viewport.offsetHeight,
      scrollbar: {
        size: bar.clientHeight,
        paddingStart: toCssInt(style?.paddingTop),
        paddingEnd: toCssInt(style?.paddingBottom),
      },
    }
  }
  return {
    content: viewport.scrollWidth,
    viewport: viewport.offsetWidth,
    scrollbar: {
      size: bar.clientWidth,
      paddingStart: toCssInt(style?.paddingInlineStart) || toCssInt(style?.paddingLeft),
      paddingEnd: toCssInt(style?.paddingInlineEnd) || toCssInt(style?.paddingRight),
    },
  }
}

function writeThumb(axis: RsScrollbarAxis) {
  const viewport = viewportRef.value
  const bar = axis === 'y' ? barYRef.value : barXRef.value
  const sizes = sizesFor(axis)
  if (!viewport || !bar || !sizes) return
  const dir = axis === 'x' ? textDir.value : 'ltr'
  const scrollPos = axis === 'y' ? viewport.scrollTop : viewport.scrollLeft
  bar.style.setProperty('--rs-scrollbar-thumb-size', `${getThumbSize(sizes)}px`)
  bar.style.setProperty(
    '--rs-scrollbar-thumb-offset',
    `${getThumbOffsetFromScroll(scrollPos, sizes, dir)}px`,
  )
}

function syncOverflow() {
  const viewport = viewportRef.value
  if (!viewport) return
  overflowY.value = isRsScrollbarOverflow(viewport.offsetHeight, viewport.scrollHeight)
  overflowX.value = isRsScrollbarOverflow(viewport.offsetWidth, viewport.scrollWidth)
  writeThumb('y')
  writeThumb('x')
}

function scheduleHide(axis: RsScrollbarAxis) {
  const delay = Math.max(0, props.scrollHideDelay)
  if (axis === 'y') {
    clearTimer(hideYTimer)
    hideYTimer = setTimeout(() => {
      scrollingY.value = false
    }, delay)
    return
  }
  clearTimer(hideXTimer)
  hideXTimer = setTimeout(() => {
    scrollingX.value = false
  }, delay)
}

function flushSyncFrame() {
  scrollRaf = 0
  const fromScroll = pendingScrollFlags
  pendingScrollFlags = false
  if (fromScroll) {
    if (showVertical.value) {
      scrollingY.value = true
      clearTimer(hideYTimer)
      scheduleHide('y')
    }
    if (showHorizontal.value) {
      scrollingX.value = true
      clearTimer(hideXTimer)
      scheduleHide('x')
    }
  }
  syncOverflow()
}

function scheduleSync(fromScroll = false) {
  if (fromScroll) pendingScrollFlags = true
  if (scrollRaf) return
  scrollRaf = scheduleFrame(flushSyncFrame)
}

function onViewportScroll() {
  if (!viewportRef.value) return
  scheduleSync(true)
}

function onRootEnter() {
  clearTimer(hoverTimer)
  hovering.value = true
}

function onRootLeave() {
  clearTimer(hoverTimer)
  hoverTimer = setTimeout(() => {
    hovering.value = false
  }, Math.max(0, props.scrollHideDelay))
}

function lockUserSelect() {
  if (typeof document === 'undefined' || userSelectLocked) return
  prevUserSelect = document.body.style.webkitUserSelect
  document.body.style.webkitUserSelect = 'none'
  userSelectLocked = true
}

function unlockUserSelect() {
  if (typeof document === 'undefined' || !userSelectLocked) return
  document.body.style.webkitUserSelect = prevUserSelect
  prevUserSelect = ''
  userSelectLocked = false
}

function captureBarPointer(bar: HTMLElement, pointerId: number) {
  if (typeof bar.setPointerCapture !== 'function') return
  try {
    bar.setPointerCapture(pointerId)
  } catch {
    /* detached node or unsupported id */
  }
}

function onBarPointerDown(event: PointerEvent, axis: RsScrollbarAxis) {
  if (event.button !== 0) return
  const bar = event.currentTarget as HTMLElement
  const viewport = viewportRef.value
  if (!viewport) return
  captureBarPointer(bar, event.pointerId)
  interacting.value = true
  dragging = axis
  const rect = bar.getBoundingClientRect()
  const pointerPos = axis === 'y' ? event.clientY - rect.top : event.clientX - rect.left
  const thumb = (event.target as HTMLElement).closest('.rs-scrollbar__thumb')
  if (thumb) {
    const thumbRect = thumb.getBoundingClientRect()
    pointerOffset = axis === 'y' ? event.clientY - thumbRect.top : event.clientX - thumbRect.left
  } else {
    pointerOffset = 0
  }
  lockUserSelect()
  viewport.style.scrollBehavior = 'auto'
  applyPointerScroll(axis, pointerPos)
}

function applyPointerScroll(axis: RsScrollbarAxis, pointerPos: number) {
  const viewport = viewportRef.value
  const sizes = sizesFor(axis)
  if (!viewport || !sizes) return
  const dir = axis === 'x' ? textDir.value : 'ltr'
  const next = getScrollPositionFromPointer(pointerPos, pointerOffset, sizes, dir)
  if (axis === 'y') viewport.scrollTop = next
  else viewport.scrollLeft = next
}

function onBarPointerMove(event: PointerEvent, axis: RsScrollbarAxis) {
  if (dragging !== axis) return
  const bar = event.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const pointerPos = axis === 'y' ? event.clientY - rect.top : event.clientX - rect.left
  applyPointerScroll(axis, pointerPos)
}

function endDrag() {
  unlockUserSelect()
  const viewport = viewportRef.value
  if (viewport) viewport.style.scrollBehavior = ''
  dragging = null
  pointerOffset = 0
  interacting.value = false
}

function onBarWheel(event: WheelEvent, axis: RsScrollbarAxis) {
  const viewport = viewportRef.value
  if (!viewport) return
  const max =
    axis === 'y'
      ? viewport.scrollHeight - viewport.clientHeight
      : viewport.scrollWidth - viewport.clientWidth
  if (axis === 'y') viewport.scrollTop += event.deltaY
  else viewport.scrollLeft += event.deltaY
  const pos = axis === 'y' ? viewport.scrollTop : viewport.scrollLeft
  if (isScrollingWithinScrollbarBounds(pos, max)) event.preventDefault()
}

function scrollTop() {
  const el = viewportRef.value
  if (!el) return
  if (typeof el.scrollTo === 'function') el.scrollTo({ top: 0 })
  else el.scrollTop = 0
}

function scrollTopLeft() {
  const el = viewportRef.value
  if (!el) return
  if (typeof el.scrollTo === 'function') el.scrollTo({ top: 0, left: 0 })
  else {
    el.scrollTop = 0
    el.scrollLeft = 0
  }
}

function getViewport() {
  return viewportRef.value ?? undefined
}

function bindObservers() {
  if (typeof ResizeObserver !== 'function') {
    syncOverflow()
    return
  }
  observer = new ResizeObserver(() => syncOverflow())
  if (viewportRef.value) observer.observe(viewportRef.value)
  if (contentRef.value) observer.observe(contentRef.value)
}

const onBarYWheel = (event: WheelEvent) => onBarWheel(event, 'y')
const onBarXWheel = (event: WheelEvent) => onBarWheel(event, 'x')
let boundY: HTMLElement | undefined
let boundX: HTMLElement | undefined

function bindBarWheels() {
  unbindBarWheels()
  boundY = barYRef.value ?? undefined
  boundX = barXRef.value ?? undefined
  boundY?.addEventListener('wheel', onBarYWheel, { passive: false })
  boundX?.addEventListener('wheel', onBarXWheel, { passive: false })
}

function unbindBarWheels() {
  boundY?.removeEventListener('wheel', onBarYWheel)
  boundX?.removeEventListener('wheel', onBarXWheel)
  boundY = undefined
  boundX = undefined
}

onMounted(() => {
  bindObservers()
  syncOverflow()
  viewportRef.value?.addEventListener('scroll', onViewportScroll, { passive: true })
  bindBarWheels()
})

onUpdated(() => {
  scheduleSync(false)
})

onBeforeUnmount(() => {
  viewportRef.value?.removeEventListener('scroll', onViewportScroll)
  unbindBarWheels()
  observer?.disconnect()
  observer = undefined
  if (scrollRaf) cancelFrame(scrollRaf)
  scrollRaf = 0
  pendingScrollFlags = false
  clearTimer(hideYTimer)
  clearTimer(hideXTimer)
  clearTimer(hoverTimer)
  endDrag()
})

watch(
  () => [props.orientation, props.type, props.height, props.maxHeight, props.minHeight],
  async () => {
    unbindBarWheels()
    await nextTick()
    bindBarWheels()
    syncOverflow()
  },
)

defineExpose({
  scrollTop,
  scrollTopLeft,
  getViewport,
})
</script>

<template>
  <div
    ref="rootRef"
    class="rs-scrollbar"
    :data-type="type"
    :data-orientation="orientation"
    :style="rootStyle"
    @pointerenter="onRootEnter"
    @pointerleave="onRootLeave"
  >
    <section
      ref="viewportRef"
      class="rs-scrollbar__viewport"
      :aria-label="viewportLabel"
      :style="viewportStyle"
    >
      <div ref="contentRef" class="rs-scrollbar__content" :style="contentStyle">
        <slot />
      </div>
    </section>

    <div
      v-if="showVertical"
      ref="barYRef"
      class="rs-scrollbar__bar rs-scrollbar__bar--vertical"
      data-orientation="vertical"
      aria-hidden="true"
      :data-state="barYVisible ? 'visible' : 'hidden'"
      @pointerdown="onBarPointerDown($event, 'y')"
      @pointermove="onBarPointerMove($event, 'y')"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
    >
      <div class="rs-scrollbar__thumb" />
    </div>

    <div
      v-if="showHorizontal"
      ref="barXRef"
      class="rs-scrollbar__bar rs-scrollbar__bar--horizontal"
      data-orientation="horizontal"
      aria-hidden="true"
      :data-state="barXVisible ? 'visible' : 'hidden'"
      @pointerdown="onBarPointerDown($event, 'x')"
      @pointermove="onBarPointerMove($event, 'x')"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
    >
      <div class="rs-scrollbar__thumb" />
    </div>

    <div
      v-if="showVertical && showHorizontal"
      class="rs-scrollbar__corner"
      aria-hidden="true"
      :data-state="showCorner ? 'visible' : 'hidden'"
    />
  </div>
</template>

<style scoped>
.rs-scrollbar {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
}

.rs-scrollbar__viewport {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.rs-scrollbar__viewport::-webkit-scrollbar {
  display: none;
}

.rs-scrollbar__content {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rs-scrollbar__bar {
  --rs-scrollbar-thumb-size: 18px;
  --rs-scrollbar-thumb-offset: 0px;
  position: absolute;
  user-select: none;
  touch-action: none;
  display: flex;
  padding: var(--rs-scrollbar-padding);
  background: transparent;
  transition:
    background var(--rs-transition-fast),
    opacity var(--rs-transition-fast);
}

.rs-scrollbar__bar[data-state='hidden'] {
  opacity: 0;
  pointer-events: none;
}

.rs-scrollbar__bar--vertical {
  inset-block-start: 0;
  inset-inline-end: 0;
  inset-block-end: var(--rs-scrollbar-corner, 0px);
  width: var(--rs-scrollbar-size);
}

.rs-scrollbar__bar--horizontal {
  inset-inline-start: 0;
  inset-block-end: 0;
  inset-inline-end: var(--rs-scrollbar-corner, 0px);
  flex-direction: column;
  height: var(--rs-scrollbar-size);
}

.rs-scrollbar__bar:hover {
  background: color-mix(in srgb, var(--rs-border-subtle) 80%, transparent);
}

.rs-scrollbar__thumb {
  flex: 0 0 auto;
  border-radius: var(--rs-radius-full);
  background: color-mix(in srgb, var(--rs-muted) 60%, transparent);
  position: relative;
  transition: background var(--rs-transition-fast);
}

.rs-scrollbar__bar--vertical .rs-scrollbar__thumb {
  width: 100%;
  height: var(--rs-scrollbar-thumb-size);
  transform: translate3d(0, var(--rs-scrollbar-thumb-offset), 0);
}

.rs-scrollbar__bar--horizontal .rs-scrollbar__thumb {
  height: 100%;
  width: var(--rs-scrollbar-thumb-size);
  transform: translate3d(var(--rs-scrollbar-thumb-offset), 0, 0);
}

.rs-scrollbar__thumb::before {
  content: '';
  position: absolute;
  inset: -0.375rem;
}

.rs-scrollbar__thumb:hover {
  background: color-mix(in srgb, var(--rs-primary) 40%, var(--rs-muted));
}

.rs-scrollbar__corner {
  position: absolute;
  inset-inline-end: 0;
  inset-block-end: 0;
  width: var(--rs-scrollbar-size);
  height: var(--rs-scrollbar-size);
  background: var(--rs-surface);
}

.rs-scrollbar__corner[data-state='hidden'] {
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .rs-scrollbar__bar,
  .rs-scrollbar__thumb {
    transition: none;
  }
}

@media (forced-colors: active) {
  .rs-scrollbar {
    border: 1px solid CanvasText;
    background: Canvas;
    forced-color-adjust: none;
  }

  .rs-scrollbar__thumb {
    background: GrayText;
  }

  .rs-scrollbar__thumb:hover {
    background: Highlight;
  }
}
</style>
