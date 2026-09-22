<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import RsButton from '../../button/src/RsButton.vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  acquireRsDrawerPointerTracking,
  acquireRsDrawerScrollLock,
  clampRsDrawerSize,
  isRsDrawerDismissExempt,
  isTopRsDrawer,
  listRsDrawerFocusables,
  pushRsDrawerLayer,
  resolveDrawerOverlayStyle,
  resolveRsDrawerDimensionCss,
  resolveRsDrawerSizeCss,
  resolveRsDrawerSizePx,
  rsDrawerMotionOutMs,
  rsDrawerPointersDown,
  RS_DRAWER_MAX_VIEWPORT_RATIO,
  RS_DRAWER_MIN_SIZE_PX,
  RS_DRAWER_MOTION_IN_MS,
  runRsDrawerBeforeClose,
  type RsDrawerBeforeClose,
  type RsDrawerCloseReason,
  type RsDrawerDimension,
  type RsDrawerExpose,
  type RsDrawerSide,
  type RsDrawerSize,
} from './drawer-utils'

defineOptions({ name: 'RsDrawer', inheritAttrs: false })

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    /** 标题文案；也可用 `#header` 插槽 */
    title?: string
    description?: string
    side?: RsDrawerSide
    /** 预设尺寸；与 width/height 同时存在时自定义优先 */
    size?: RsDrawerSize
    /** 左右抽屉自定义宽度（覆盖 size） */
    width?: RsDrawerDimension
    /** 上下抽屉自定义高度（覆盖 size） */
    height?: RsDrawerDimension
    /**
     * 内边缘拖拽改尺寸。full 始终不可拖。
     * 控制台 / 帮助栏等侧栏场景建议保持开启。
     */
    resizable?: boolean
    /** 可拖下限（px / CSS）；默认 256px */
    minSize?: RsDrawerDimension
    /** 可拖上限（px / CSS）；默认视口 90% */
    maxSize?: RsDrawerDimension
    /**
     * 是否模态：锁焦点并拦截背后交互。
     * 未显式传入时跟随 showOverlay（有遮罩=模态，无遮罩=非模态）。
     */
    modal?: boolean
    /** 是否渲染遮罩（与 modal / closeOnOverlayClick 解耦） */
    showOverlay?: boolean
    /**
     * 遮罩不透明度 0–1；覆盖主题默认。
     * 例：0.08 最浅、0.35 适中、0.55 较深。
     */
    overlayOpacity?: number
    /** 遮罩模糊；number 为 px */
    overlayBlur?: number | string
    showClose?: boolean
    /**
     * 点击抽屉外是否关闭（含无遮罩时的外部指针）。
     * 与 modal 独立：非模态也可保持打开。
     */
    closeOnOverlayClick?: boolean
    /** 按 Esc 是否关闭；默认 true。上层浮层已 preventDefault 时不抢。 */
    closeOnEsc?: boolean
    /**
     * 挂载目标
     * - string / HTMLElement：Teleport 到指定节点（容器需 position:relative）
     * - false：禁用 Teleport，就地渲染
     * - undefined：挂到 body
     */
    teleportTo?: string | HTMLElement | false
    /** 关闭前钩子；返回 false 可阻止关闭（支持 async） */
    beforeClose?: RsDrawerBeforeClose
    /**
     * 关闭动画结束后卸掉面板。默认 true，与原先关闭即卸载一致。
     * false 时保留子树，便于表单状态留在抽屉里。
     */
    destroyOnClose?: boolean
    /** 首次打开前就挂载子树。关闭后是否留下仍看 destroyOnClose。 */
    forceRender?: boolean
    /**
     * 是否锁 body 滚动。未传时：模态且挂到 body 才锁。
     * 挂进局部容器默认不锁整页。
     */
    lockScroll?: boolean
    /** 覆盖层叠。未传时与其它抽屉同用 --rs-z-modal，后打开的盖在上面。 */
    zIndex?: number
    /** 没有可见标题时的可访问名称 */
    ariaLabel?: string
    id?: string
  }>(),
  {
    title: '',
    side: 'right',
    size: 'md',
    showOverlay: true,
    showClose: true,
    closeOnOverlayClick: true,
    closeOnEsc: true,
    resizable: true,
    destroyOnClose: true,
    forceRender: false,
  },
)

const emit = defineEmits<{
  openChange: [open: boolean]
  afterOpen: []
  afterClose: [reason: RsDrawerCloseReason]
  /** 拖拽过程与结束都会抛出当前像素尺寸 */
  resize: [size: number]
  'update:width': [value: number]
  'update:height': [value: number]
}>()

const { t } = useRsI18n()
const instance = getCurrentInstance()
const autoId = useId()
const layerId = autoId
const titleId = computed(() => `${props.id || autoId}-title`)
const descId = computed(() => `${props.id || autoId}-desc`)

/** 可选布尔未传时会被收成 false。看这次 vnode 上有没有该字段，才能区分「没传」。 */
function propWasPassed(name: 'modal' | 'lockScroll' | 'teleportTo'): boolean {
  const raw = instance?.vnode.props
  if (!raw) return false
  const kebab = name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  return Object.hasOwn(raw, name) || Object.hasOwn(raw, kebab)
}

/** 挂到自定义容器或就地渲染时按 contained 模式定位，避免盖住布局顶栏 */
const contained = computed(() => propWasPassed('teleportTo'))
/** 未显式传 modal 时：有遮罩=模态，无遮罩=可点背后 */
const isModal = computed(() => (propWasPassed('modal') ? Boolean(props.modal) : props.showOverlay))
const teleportDisabled = computed(() => propWasPassed('teleportTo') && props.teleportTo === false)
const teleportTarget = computed(() => {
  if (typeof props.teleportTo === 'string') return props.teleportTo
  if (typeof HTMLElement !== 'undefined' && props.teleportTo instanceof HTMLElement) {
    return props.teleportTo
  }
  return 'body'
})
const shouldLockScroll = computed(() => {
  if (propWasPassed('lockScroll')) return Boolean(props.lockScroll)
  return isModal.value && !contained.value
})

const overlayStyle = computed(() =>
  resolveDrawerOverlayStyle({
    overlayOpacity: props.overlayOpacity,
    overlayBlur: props.overlayBlur,
  }),
)

const zStyle = computed(() => {
  if (props.zIndex == null || !Number.isFinite(props.zIndex)) return undefined
  return { '--rs-drawer-z': String(Math.round(props.zIndex)) }
})

const isHorizontal = computed(() => props.side === 'left' || props.side === 'right')
const enableResizable = computed(() => props.resizable && props.size !== 'full')

/** 本次打开后拖拽得到的像素尺寸；关闭时清空，回到 size/width/height */
const liveSizePx = ref<number | undefined>(undefined)
const resizing = ref(false)
const anchorRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const panelTheme = ref<string>()
const panelDir = ref<string>()
const panelLang = ref<string>()
const present = ref(open.value || props.forceRender)
const motion = ref<'open' | 'closed'>(open.value ? 'open' : 'closed')
const dormant = ref(!open.value)
const animating = ref(false)
const boundMin = ref(RS_DRAWER_MIN_SIZE_PX)
const boundMax = ref(Math.round(960 * RS_DRAWER_MAX_VIEWPORT_RATIO))

/** 仅 width / height 或拖拽结果算自定义尺寸；sm / md / lg 预设不算。 */
const customDimensionCss = computed(() => {
  if (liveSizePx.value != null) return `${liveSizePx.value}px`
  return isHorizontal.value
    ? resolveRsDrawerDimensionCss(props.width)
    : resolveRsDrawerDimensionCss(props.height)
})

const panelSizeCss = computed(() => {
  if (props.size === 'full') return undefined
  return customDimensionCss.value ?? resolveRsDrawerSizeCss(props.size)
})

const contentStyle = computed(() => {
  const style: Record<string, string> = {}
  const size = panelSizeCss.value
  if (size && props.size !== 'full') style['--rs-drawer-panel-size'] = size
  if (liveSizePx.value != null && props.size !== 'full') {
    if (isHorizontal.value) style.width = `${liveSizePx.value}px`
    else style.height = `${liveSizePx.value}px`
  }
  return Object.keys(style).length ? style : undefined
})

const contentClass = computed(() => [
  `rs-drawer__content--${props.side}`,
  `rs-drawer__content--${props.size}`,
  {
    'rs-drawer__content--contained': contained.value,
    'rs-drawer__content--custom-size': props.size !== 'full' && customDimensionCss.value != null,
    'rs-drawer__content--resizable': enableResizable.value,
    'rs-drawer__content--resizing': resizing.value,
    'rs-drawer__content--animate': animating.value,
    'rs-drawer__content--dormant': dormant.value,
  },
])

const labelledBy = computed(() => titleId.value)
const describedBy = computed(() => (props.description ? descId.value : undefined))

const closing = ref(false)
let afterOpenTimer = 0
let exitTimer = 0
let animTimer = 0
let releasePointer: (() => void) | null = null
let releaseLayer: (() => void) | null = null
let releaseLock: (() => void) | null = null
let layerBound = false
let restoreEl: HTMLElement | null = null

/** 打开若发生在 pointer 按下期间，抑制外部关闭，直到指针抬起再过一个宏任务。 */
const suppressOutsideUntilGestureEnd = ref(false)
let gestureReleaseBound = false

function releaseOutsideSuppress(): void {
  suppressOutsideUntilGestureEnd.value = false
  if (!gestureReleaseBound || typeof window === 'undefined') {
    gestureReleaseBound = false
    return
  }
  gestureReleaseBound = false
  window.removeEventListener('pointerup', onGesturePointerRelease, true)
  window.removeEventListener('pointercancel', onGesturePointerRelease, true)
}

function onGesturePointerRelease(): void {
  if (rsDrawerPointersDown() > 0) return
  if (gestureReleaseBound && typeof window !== 'undefined') {
    gestureReleaseBound = false
    window.removeEventListener('pointerup', onGesturePointerRelease, true)
    window.removeEventListener('pointercancel', onGesturePointerRelease, true)
  }
  queueMicrotask(() => {
    suppressOutsideUntilGestureEnd.value = false
  })
}

function armOutsideSuppressForOpenGesture(): void {
  if (typeof window === 'undefined') return
  releaseOutsideSuppress()
  suppressOutsideUntilGestureEnd.value = true
  if (rsDrawerPointersDown() > 0) {
    gestureReleaseBound = true
    window.addEventListener('pointerup', onGesturePointerRelease, true)
    window.addEventListener('pointercancel', onGesturePointerRelease, true)
    return
  }
  queueMicrotask(() => {
    suppressOutsideUntilGestureEnd.value = false
  })
}

function clearAfterOpenTimer(): void {
  if (!afterOpenTimer || typeof window === 'undefined') {
    afterOpenTimer = 0
    return
  }
  window.clearTimeout(afterOpenTimer)
  afterOpenTimer = 0
}

function clearExitTimer(): void {
  if (!exitTimer || typeof window === 'undefined') {
    exitTimer = 0
    return
  }
  window.clearTimeout(exitTimer)
  exitTimer = 0
}

function clearAnimTimer(): void {
  if (!animTimer || typeof window === 'undefined') {
    animTimer = 0
    return
  }
  window.clearTimeout(animTimer)
  animTimer = 0
}

function queueAfterOpen(): void {
  clearAfterOpenTimer()
  if (typeof window === 'undefined') return
  afterOpenTimer = window.setTimeout(() => {
    afterOpenTimer = 0
    if (open.value) emit('afterOpen')
  }, RS_DRAWER_MOTION_IN_MS + 40)
}

function markAnimating(): void {
  clearAnimTimer()
  if (rsDrawerMotionOutMs() === 0) {
    animating.value = false
    return
  }
  animating.value = true
  if (typeof window === 'undefined') return
  const ms = motion.value === 'closed' ? rsDrawerMotionOutMs() : RS_DRAWER_MOTION_IN_MS
  animTimer = window.setTimeout(() => {
    animTimer = 0
    animating.value = false
  }, ms + 40)
}

function finishExit(): void {
  clearExitTimer()
  animating.value = false
  if (open.value) return
  liveSizePx.value = undefined
  if (props.destroyOnClose && !props.forceRender) {
    present.value = false
    return
  }
  dormant.value = true
}

function scheduleExit(): void {
  clearExitTimer()
  if (typeof window === 'undefined') return
  const ms = rsDrawerMotionOutMs()
  if (ms === 0) {
    finishExit()
    return
  }
  // 正常由 animationend 卸掉。定时器只作动画没播完时的兜底，避免和滑出抢同一帧。
  exitTimer = window.setTimeout(() => {
    exitTimer = 0
    finishExit()
  }, ms)
}

function syncChrome(): void {
  const el = anchorRef.value
  if (!el) {
    panelTheme.value = undefined
    panelDir.value = undefined
    panelLang.value = undefined
    return
  }
  const themed = el.closest('[data-rs-theme]')
  const directed = el.closest('[dir]')
  const langed = el.closest('[lang]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
  panelDir.value = directed?.getAttribute('dir') || undefined
  panelLang.value = langed?.getAttribute('lang') || undefined
}

function resolveContentEl(): HTMLElement | null {
  const el = contentRef.value
  return el instanceof HTMLElement ? el : null
}

function focusPanel(force: boolean): void {
  const content = resolveContentEl()
  if (!content || typeof document === 'undefined') return
  if (!force && !isModal.value) return
  const active = document.activeElement
  if (
    active instanceof HTMLElement &&
    active !== document.body &&
    active !== document.documentElement &&
    !content.contains(active)
  ) {
    restoreEl = active
  }
  if (!force && active instanceof HTMLElement && content.contains(active)) return
  content.focus({ preventScroll: true })
}

function restoreFocus(): void {
  const el = restoreEl
  restoreEl = null
  if (!el?.isConnected) return
  const content = resolveContentEl()
  if (content && (el === content || content.contains(el))) return
  el.focus({ preventScroll: true })
}

function bindLayer(): void {
  if (layerBound || typeof window === 'undefined') return
  layerBound = true
  releaseLayer = pushRsDrawerLayer(layerId)
  if (shouldLockScroll.value) releaseLock = acquireRsDrawerScrollLock()
  window.addEventListener('pointerdown', onWindowPointerDown)
  window.addEventListener('keydown', onWindowKeydown)
  refreshBounds()
}

function unbindLayer(): void {
  if (!layerBound) return
  layerBound = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointerdown', onWindowPointerDown)
    window.removeEventListener('keydown', onWindowKeydown)
  }
  releaseLayer?.()
  releaseLayer = null
  releaseLock?.()
  releaseLock = null
}

function shouldBlockOutsideDismiss(): boolean {
  return !props.closeOnOverlayClick || suppressOutsideUntilGestureEnd.value || resizing.value
}

function onWindowPointerDown(event: PointerEvent): void {
  if (!open.value || !isTopRsDrawer(layerId)) return
  if (shouldBlockOutsideDismiss()) return
  if (isRsDrawerDismissExempt(event.target, resolveContentEl())) return
  void requestClose('overlay')
}

function onWindowKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (!open.value || !isTopRsDrawer(layerId)) return
  if (!props.closeOnEsc) {
    event.preventDefault()
    return
  }
  event.preventDefault()
  void requestClose('escape')
}

function onContentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !isModal.value || !open.value || !isTopRsDrawer(layerId)) return
  const content = resolveContentEl()
  if (!content) return
  const items = listRsDrawerFocusables(content)
  if (!items.length) {
    event.preventDefault()
    content.focus({ preventScroll: true })
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === content)) {
    event.preventDefault()
    last?.focus()
    return
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    clearExitTimer()
    syncChrome()
    present.value = true
    dormant.value = false
    motion.value = 'open'
    markAnimating()
    armOutsideSuppressForOpenGesture()
    bindLayer()
    emit('openChange', true)
    queueAfterOpen()
    void nextTick(() => focusPanel(false))
    return
  }
  if (!isOpen && wasOpen) {
    motion.value = 'closed'
    markAnimating()
    stopResize()
    releaseOutsideSuppress()
    clearAfterOpenTimer()
    unbindLayer()
    restoreFocus()
    scheduleExit()
    emit('openChange', false)
    if (!closing.value) emit('afterClose', 'programmatic')
  }
})

onMounted(() => {
  releasePointer = acquireRsDrawerPointerTracking()
  syncChrome()
  if (!open.value) return
  armOutsideSuppressForOpenGesture()
  bindLayer()
  void nextTick(() => focusPanel(false))
})

onBeforeUnmount(() => {
  stopResize()
  releaseOutsideSuppress()
  clearAfterOpenTimer()
  clearExitTimer()
  clearAnimTimer()
  if (open.value) restoreFocus()
  unbindLayer()
  releasePointer?.()
  releasePointer = null
})

async function requestClose(reason: RsDrawerCloseReason): Promise<boolean> {
  if (!open.value || closing.value) return false
  closing.value = true
  try {
    const allowed = await runRsDrawerBeforeClose(props.beforeClose, reason)
    if (!allowed) return false
    open.value = false
    await nextTick()
    emit('afterClose', reason)
    return true
  } finally {
    closing.value = false
  }
}

async function onHeaderCloseClick(): Promise<void> {
  await requestClose('close')
}

function rootFontPx(): number {
  if (typeof document === 'undefined') return 16
  const raw = getComputedStyle(document.documentElement).fontSize
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : 16
}

function viewportPx(): number {
  if (typeof window === 'undefined') return 0
  return isHorizontal.value ? window.innerWidth : window.innerHeight
}

function sizeBounds(): { min: number; max: number } {
  const vp = viewportPx()
  const root = rootFontPx()
  const min = resolveRsDrawerSizePx(props.minSize, RS_DRAWER_MIN_SIZE_PX, root, vp)
  const max = resolveRsDrawerSizePx(
    props.maxSize,
    Math.round(vp * RS_DRAWER_MAX_VIEWPORT_RATIO),
    root,
    vp,
  )
  return { min, max }
}

function refreshBounds(): void {
  const next = sizeBounds()
  boundMin.value = next.min
  boundMax.value = next.max
}

function applyLiveSize(px: number): number {
  const { min, max } = sizeBounds()
  const next = clampRsDrawerSize(px, min, max)
  const el = resolveContentEl()
  if (el) {
    el.style.setProperty('--rs-drawer-panel-size', `${next}px`)
    if (isHorizontal.value) el.style.width = `${next}px`
    else el.style.height = `${next}px`
  }
  return next
}

let resizePointerId: number | null = null
let resizeStartClient = 0
let resizeStartSize = 0

function stopResize(): void {
  if (resizePointerId != null && typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onResizePointerMove)
    window.removeEventListener('pointerup', onResizePointerUp)
    window.removeEventListener('pointercancel', onResizePointerUp)
    resizePointerId = null
  }
  resizing.value = false
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
  }
}

function currentPanelPx(): number {
  const el = resolveContentEl()
  if (!el) return RS_DRAWER_MIN_SIZE_PX
  const rect = el.getBoundingClientRect()
  return isHorizontal.value ? rect.width : rect.height
}

function onResizePointerDown(event: PointerEvent): void {
  if (!enableResizable.value || event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  resizeStartClient = isHorizontal.value ? event.clientX : event.clientY
  resizeStartSize = currentPanelPx()
  resizePointerId = event.pointerId
  resizing.value = true
  refreshBounds()
  if (typeof document !== 'undefined') {
    document.body.style.cursor = isHorizontal.value ? 'ew-resize' : 'ns-resize'
    document.body.style.userSelect = 'none'
  }
  window.addEventListener('pointermove', onResizePointerMove)
  window.addEventListener('pointerup', onResizePointerUp)
  window.addEventListener('pointercancel', onResizePointerUp)
}

function deltaForPointer(event: PointerEvent): number {
  const client = isHorizontal.value ? event.clientX : event.clientY
  const raw = client - resizeStartClient
  if (props.side === 'right' || props.side === 'bottom') return -raw
  return raw
}

function onResizePointerMove(event: PointerEvent): void {
  if (resizePointerId == null || event.pointerId !== resizePointerId) return
  const next = applyLiveSize(resizeStartSize + deltaForPointer(event))
  emit('resize', next)
}

function commitResize(next: number): void {
  liveSizePx.value = next
  emit('resize', next)
  if (isHorizontal.value) emit('update:width', next)
  else emit('update:height', next)
}

function onResizePointerUp(event: PointerEvent): void {
  if (resizePointerId == null || event.pointerId !== resizePointerId) return
  const next = applyLiveSize(resizeStartSize + deltaForPointer(event))
  stopResize()
  commitResize(next)
}

function onResizeKeydown(event: KeyboardEvent): void {
  if (!enableResizable.value) return
  refreshBounds()
  if (event.key === 'Home') {
    event.preventDefault()
    commitResize(applyLiveSize(sizeBounds().min))
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    commitResize(applyLiveSize(sizeBounds().max))
    return
  }
  const step = event.shiftKey ? 48 : 16
  let delta = 0
  if (props.side === 'right') {
    if (event.key === 'ArrowLeft') delta = step
    else if (event.key === 'ArrowRight') delta = -step
  } else if (props.side === 'left') {
    if (event.key === 'ArrowRight') delta = step
    else if (event.key === 'ArrowLeft') delta = -step
  } else if (props.side === 'top') {
    if (event.key === 'ArrowDown') delta = step
    else if (event.key === 'ArrowUp') delta = -step
  } else if (props.side === 'bottom') {
    if (event.key === 'ArrowUp') delta = step
    else if (event.key === 'ArrowDown') delta = -step
  }
  if (!delta) return
  event.preventDefault()
  commitResize(applyLiveSize(currentPanelPx() + delta))
}

function onContentAnimationEnd(event: AnimationEvent): void {
  if (event.target !== resolveContentEl()) return
  animating.value = false
  if (!open.value && motion.value === 'closed') finishExit()
}

const exposed: RsDrawerExpose = {
  close: (reason: RsDrawerCloseReason = 'programmatic') => requestClose(reason),
  openDrawer: () => {
    open.value = true
  },
  focus: () => focusPanel(true),
}

defineExpose(exposed)
</script>

<template>
  <span ref="anchorRef" class="rs-drawer__anchor" hidden aria-hidden="true" />
  <Teleport :disabled="teleportDisabled" :to="teleportTarget">
    <div
      v-if="showOverlay && present"
      class="rs-drawer__overlay rs-motion-reduce"
      :class="{
        'rs-drawer__overlay--contained': contained,
        'rs-drawer__overlay--dormant': dormant,
      }"
      :style="[overlayStyle, zStyle]"
      :data-state="motion"
      :data-rs-theme="panelTheme"
      :dir="panelDir"
      :lang="panelLang"
      aria-hidden="true"
    />
    <div
      v-if="present"
      :id="id"
      ref="contentRef"
      v-bind="$attrs"
      class="rs-drawer rs-drawer__content rs-motion-reduce"
      :class="contentClass"
      :style="[contentStyle, zStyle]"
      role="dialog"
      :aria-modal="isModal && motion === 'open' ? 'true' : 'false'"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      :aria-hidden="motion === 'open' ? undefined : 'true'"
      :inert="motion === 'open' ? undefined : true"
      :data-state="motion"
      :data-rs-theme="panelTheme"
      :dir="panelDir"
      :lang="panelLang"
      tabindex="-1"
      @keydown="onContentKeydown"
      @animationend="onContentAnimationEnd"
    >
      <header
        v-if="title || description || showClose || $slots.header || $slots.extra"
        class="rs-drawer__header"
      >
        <slot name="header">
          <div class="rs-drawer__heading">
            <h2 v-if="title" :id="titleId" class="rs-drawer__title">{{ title }}</h2>
            <p v-if="description" :id="descId" class="rs-drawer__description">{{ description }}</p>
          </div>
        </slot>
        <div v-if="$slots.extra || showClose" class="rs-drawer__tools">
          <div v-if="$slots.extra" class="rs-drawer__extra">
            <slot name="extra" />
          </div>
          <RsButton
            v-if="showClose"
            class="rs-drawer__close"
            variant="ghost"
            size="sm"
            icon="x"
            :tooltip="t('drawer.close')"
            @click="onHeaderCloseClick"
          />
        </div>
      </header>
      <h2
        v-if="$slots.header || !title"
        :id="titleId"
        class="rs-drawer__title rs-drawer__title--sr-only"
      >
        {{ title || ariaLabel || t('drawer.label') }}
      </h2>
      <p
        v-if="description && $slots.header"
        :id="descId"
        class="rs-drawer__description rs-drawer__description--sr-only"
      >
        {{ description }}
      </p>
      <div class="rs-drawer__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="rs-drawer__footer">
        <slot name="footer" />
      </footer>
      <div
        v-if="enableResizable"
        class="rs-drawer__resize"
        role="separator"
        tabindex="0"
        :aria-label="t('drawer.resize')"
        :aria-orientation="isHorizontal ? 'vertical' : 'horizontal'"
        :aria-valuemin="boundMin"
        :aria-valuemax="boundMax"
        :aria-valuenow="liveSizePx != null ? Math.round(liveSizePx) : undefined"
        :aria-controls="id || undefined"
        @pointerdown="onResizePointerDown"
        @keydown="onResizeKeydown"
      />
    </div>
  </Teleport>
</template>

<style>
.rs-drawer__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--rs-drawer-z, var(--rs-z-modal));
  background: var(--rs-drawer-overlay-bg, var(--rs-dialog-overlay-bg, rgb(0 0 0 / 0.24)));
  backdrop-filter: blur(var(--rs-drawer-overlay-blur, var(--rs-dialog-overlay-blur, 0px))) saturate(120%);
  -webkit-backdrop-filter: blur(var(--rs-drawer-overlay-blur, var(--rs-dialog-overlay-blur, 0px)))
    saturate(120%);
}
.rs-drawer__overlay[data-state='open'] {
  animation: rs-drawer-overlay-in var(--rs-drawer-motion-duration-in, 240ms) ease;
}
.rs-drawer__overlay[data-state='closed'] {
  /* forwards：结束后停在透明，避免卸掉前 Opacity 弹回 1 */
  animation: rs-drawer-overlay-out var(--rs-drawer-motion-duration-out, 180ms) ease forwards;
}
.rs-drawer__overlay--contained {
  position: absolute;
}
.rs-drawer__overlay--dormant {
  visibility: hidden;
  pointer-events: none;
}
.rs-drawer__content {
  position: fixed;
  z-index: calc(var(--rs-drawer-z, var(--rs-z-modal)) + 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--rs-drawer-border, var(--rs-border));
  background: var(--rs-drawer-body-bg, var(--rs-surface-elevated));
  --rs-fieldset-legend-bg: var(--rs-drawer-body-bg, var(--rs-surface-elevated));
  color: var(--rs-text);
  box-shadow: var(--rs-shadow-lg);
  outline: none;
}
.rs-drawer__content--animate {
  will-change: transform;
}
.rs-drawer__content:focus {
  outline: none;
}
.rs-drawer__content:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: -2px;
}
.rs-drawer__content--dormant {
  visibility: hidden;
  pointer-events: none;
}
.rs-drawer__resize {
  position: absolute;
  z-index: 3;
  padding: 0;
  border: 0;
  background: transparent;
  touch-action: none;
}
.rs-drawer__resize:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: -2px;
}
.rs-drawer__content--right > .rs-drawer__resize,
.rs-drawer__content--left > .rs-drawer__resize {
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: ew-resize;
}
.rs-drawer__content--right > .rs-drawer__resize {
  left: 0;
}
.rs-drawer__content--left > .rs-drawer__resize {
  right: 0;
}
.rs-drawer__content--top > .rs-drawer__resize,
.rs-drawer__content--bottom > .rs-drawer__resize {
  inset-inline: 0;
  height: 10px;
  cursor: ns-resize;
}
.rs-drawer__content--top > .rs-drawer__resize {
  bottom: 0;
}
.rs-drawer__content--bottom > .rs-drawer__resize {
  top: 0;
}
.rs-drawer__content--right > .rs-drawer__resize:hover,
.rs-drawer__content--right > .rs-drawer__resize:focus-visible,
.rs-drawer__content--resizing.rs-drawer__content--right > .rs-drawer__resize {
  background: linear-gradient(to right, var(--rs-primary) 0, var(--rs-primary) 2px, transparent 2px);
}
.rs-drawer__content--left > .rs-drawer__resize:hover,
.rs-drawer__content--left > .rs-drawer__resize:focus-visible,
.rs-drawer__content--resizing.rs-drawer__content--left > .rs-drawer__resize {
  background: linear-gradient(to left, var(--rs-primary) 0, var(--rs-primary) 2px, transparent 2px);
}
.rs-drawer__content--top > .rs-drawer__resize:hover,
.rs-drawer__content--top > .rs-drawer__resize:focus-visible,
.rs-drawer__content--resizing.rs-drawer__content--top > .rs-drawer__resize {
  background: linear-gradient(to top, var(--rs-primary) 0, var(--rs-primary) 2px, transparent 2px);
}
.rs-drawer__content--bottom > .rs-drawer__resize:hover,
.rs-drawer__content--bottom > .rs-drawer__resize:focus-visible,
.rs-drawer__content--resizing.rs-drawer__content--bottom > .rs-drawer__resize {
  background: linear-gradient(to bottom, var(--rs-primary) 0, var(--rs-primary) 2px, transparent 2px);
}
.rs-drawer__content--resizing iframe {
  pointer-events: none;
}
.rs-drawer__content--contained {
  position: absolute;
}
.rs-drawer__content--right,
.rs-drawer__content--left {
  top: 0;
  bottom: 0;
  height: 100%;
  max-height: none;
  width: min(100vw, var(--rs-drawer-panel-size, 28rem));
  transform: none;
}
.rs-drawer__content--contained:is(.rs-drawer__content--right, .rs-drawer__content--left) {
  width: min(100%, var(--rs-drawer-panel-size, 28rem));
}
.rs-drawer__content--right {
  left: auto;
  right: 0;
  border-right: 0;
  border-radius: var(--rs-radius) 0 0 var(--rs-radius);
  padding-right: env(safe-area-inset-right, 0px);
}
.rs-drawer__content--left {
  left: 0;
  right: auto;
  border-left: 0;
  border-radius: 0 var(--rs-radius) var(--rs-radius) 0;
  padding-left: env(safe-area-inset-left, 0px);
}
.rs-drawer__content--top,
.rs-drawer__content--bottom {
  inset-inline: 0;
  height: min(100vh, var(--rs-drawer-panel-size, 22rem));
}
.rs-drawer__content--contained:is(.rs-drawer__content--top, .rs-drawer__content--bottom) {
  height: min(100%, var(--rs-drawer-panel-size, 22rem));
}
.rs-drawer__content--top {
  top: 0;
  border-top: 0;
  border-radius: 0 0 var(--rs-radius) var(--rs-radius);
  padding-top: env(safe-area-inset-top, 0px);
}
.rs-drawer__content--bottom {
  bottom: 0;
  border-bottom: 0;
  border-radius: var(--rs-radius) var(--rs-radius) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.rs-drawer__content--sm:is(.rs-drawer__content--left, .rs-drawer__content--right) {
  --rs-drawer-panel-size: 20rem;
}
.rs-drawer__content--lg:is(.rs-drawer__content--left, .rs-drawer__content--right) {
  --rs-drawer-panel-size: 36rem;
}
.rs-drawer__content--full:is(.rs-drawer__content--left, .rs-drawer__content--right) {
  width: 100vw;
}
.rs-drawer__content--contained.rs-drawer__content--full:is(
  .rs-drawer__content--left,
  .rs-drawer__content--right
) {
  width: 100%;
}
.rs-drawer__content--sm:is(.rs-drawer__content--top, .rs-drawer__content--bottom) {
  --rs-drawer-panel-size: 16rem;
}
.rs-drawer__content--md:is(.rs-drawer__content--top, .rs-drawer__content--bottom) {
  --rs-drawer-panel-size: 22rem;
}
.rs-drawer__content--lg:is(.rs-drawer__content--top, .rs-drawer__content--bottom) {
  --rs-drawer-panel-size: 32rem;
}
.rs-drawer__content--full:is(.rs-drawer__content--top, .rs-drawer__content--bottom) {
  height: 100vh;
}
.rs-drawer__content--contained.rs-drawer__content--full:is(
  .rs-drawer__content--top,
  .rs-drawer__content--bottom
) {
  height: 100%;
}

.rs-drawer__content--right[data-state='open'] {
  animation: rs-drawer-slide-right-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--right[data-state='closed'] {
  animation: rs-drawer-slide-right-out var(--rs-drawer-motion-duration-out, 180ms) ease forwards;
}
.rs-drawer__content--left[data-state='open'] {
  animation: rs-drawer-slide-left-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--left[data-state='closed'] {
  animation: rs-drawer-slide-left-out var(--rs-drawer-motion-duration-out, 180ms) ease forwards;
}
.rs-drawer__content--top[data-state='open'] {
  animation: rs-drawer-slide-top-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--top[data-state='closed'] {
  animation: rs-drawer-slide-top-out var(--rs-drawer-motion-duration-out, 180ms) ease forwards;
}
.rs-drawer__content--bottom[data-state='open'] {
  animation: rs-drawer-slide-bottom-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--bottom[data-state='closed'] {
  animation: rs-drawer-slide-bottom-out var(--rs-drawer-motion-duration-out, 180ms) ease forwards;
}

@keyframes rs-drawer-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes rs-drawer-overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes rs-drawer-slide-right-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes rs-drawer-slide-right-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes rs-drawer-slide-left-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes rs-drawer-slide-left-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}
@keyframes rs-drawer-slide-top-in {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes rs-drawer-slide-top-out {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-100%);
  }
}
@keyframes rs-drawer-slide-bottom-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes rs-drawer-slide-bottom-out {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.rs-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-md);
  flex-shrink: 0;
  box-sizing: border-box;
  height: var(--rs-drawer-header-height);
  min-height: var(--rs-drawer-header-min-height);
  padding-block: var(--rs-drawer-header-padding-y);
  padding-inline: var(--rs-drawer-header-padding-x);
  background: var(--rs-drawer-header-bg);
  border-bottom: 1px solid var(--rs-drawer-separator, var(--rs-border-subtle));
}
.rs-drawer__header > :first-child {
  min-width: 0;
  flex: 1;
}
.rs-drawer__heading {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rs-drawer__tools {
  display: flex;
  align-items: center;
  gap: var(--rs-space-xs);
  flex-shrink: 0;
  margin-inline-start: auto;
}
.rs-drawer__extra {
  display: flex;
  align-items: center;
  gap: var(--rs-space-xs);
  flex-shrink: 0;
}
.rs-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--rs-space-md);
  flex-shrink: 0;
  box-sizing: border-box;
  height: var(--rs-drawer-footer-height);
  min-height: var(--rs-drawer-footer-min-height);
  padding-block: var(--rs-drawer-footer-padding-y);
  padding-inline: var(--rs-drawer-footer-padding-x);
  background: var(--rs-drawer-footer-bg);
  border-top: 1px solid
    var(--rs-drawer-footer-border, var(--rs-drawer-separator, var(--rs-border-subtle)));
}
.rs-drawer__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-block: var(--rs-drawer-body-padding-y);
  padding-inline: var(--rs-drawer-body-padding-x);
  background: var(--rs-drawer-body-bg);
}
.rs-drawer__title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  font-size: var(--rs-font-size-base);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight, 1.3);
  color: var(--rs-drawer-title-fg, var(--rs-text));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rs-drawer__description {
  margin-block: var(--rs-space-xs) 0;
  margin-inline: 0;
  color: var(--rs-drawer-description-fg, var(--rs-muted));
  font-size: var(--rs-font-size-sm);
}
.rs-drawer__description--sr-only,
.rs-drawer__title--sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
