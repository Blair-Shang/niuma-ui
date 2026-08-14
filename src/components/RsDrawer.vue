<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from './reka'
import RsButton from './RsButton.vue'
import { useRsI18n } from '../composables/useRsI18n'
import {
  resolveDrawerOverlayStyle,
  resolveRsDrawerDimensionCss,
  resolveRsDrawerSizeCss,
  runRsDrawerBeforeClose,
  type RsDrawerBeforeClose,
  type RsDrawerCloseReason,
  type RsDrawerDimension,
  type RsDrawerSide,
  type RsDrawerSize,
} from './drawer-utils'

defineOptions({ inheritAttrs: false })

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
     * 点击抽屉外是否关闭（含无遮罩时的 interact-outside）。
     * 与 modal 独立：非模态也可保持打开。
     */
    closeOnOverlayClick?: boolean
    /** 按 Esc 是否关闭；默认 true */
    closeOnEsc?: boolean
    /**
     * DialogPortal 挂载目标
     * - string / HTMLElement：Teleport 到指定节点（容器需 position:relative）
     * - false：禁用 Teleport，就地渲染
     * - undefined：走 Reka 默认（通常为 body）
     */
    teleportTo?: string | HTMLElement | false
    /** 关闭前钩子；返回 false 可阻止关闭（支持 async） */
    beforeClose?: RsDrawerBeforeClose
  }>(),
  {
    title: '',
    side: 'right',
    size: 'md',
    showOverlay: true,
    showClose: true,
    closeOnOverlayClick: true,
    closeOnEsc: true,
  },
)

const emit = defineEmits<{
  openChange: [open: boolean]
  afterOpen: []
  afterClose: [reason: RsDrawerCloseReason]
}>()

const { t } = useRsI18n()

/** 挂到自定义容器或就地渲染时按 contained 模式定位，避免盖住布局顶栏 */
const contained = computed(() => props.teleportTo !== undefined)
/** 未显式传 modal 时：有遮罩=模态，无遮罩=可点背后 */
const isModal = computed(() => props.modal ?? props.showOverlay)

const overlayStyle = computed(() =>
  resolveDrawerOverlayStyle({
    overlayOpacity: props.overlayOpacity,
    overlayBlur: props.overlayBlur,
  }),
)

const isHorizontal = computed(() => props.side === 'left' || props.side === 'right')

const panelSizeCss = computed(() => {
  if (isHorizontal.value) {
    return (
      resolveRsDrawerDimensionCss(props.width) ??
      resolveRsDrawerSizeCss(props.size) ??
      undefined
    )
  }
  return (
    resolveRsDrawerDimensionCss(props.height) ??
    resolveRsDrawerSizeCss(props.size) ??
    undefined
  )
})

const contentStyle = computed(() => {
  const size = panelSizeCss.value
  if (!size || props.size === 'full') return undefined
  return { '--rs-drawer-panel-size': size } as Record<string, string>
})

const contentClass = computed(() => [
  `rs-drawer__content--${props.side}`,
  `rs-drawer__content--${props.size}`,
  {
    'rs-drawer__content--contained': contained.value,
    'rs-drawer__content--custom-size': Boolean(panelSizeCss.value) && props.size !== 'full',
  },
])

const closing = ref(false)
let pendingCloseReason: RsDrawerCloseReason = 'programmatic'
let afterOpenTimer = 0

/** 跟踪当前按下指针数，用于判断打开是否发生在手势中途 */
let pointersDown = 0
let pointerTrackingBound = false

function ensurePointerTracking(): void {
  if (pointerTrackingBound || typeof window === 'undefined') return
  pointerTrackingBound = true
  window.addEventListener(
    'pointerdown',
    () => {
      pointersDown += 1
    },
    true,
  )
  window.addEventListener(
    'pointerup',
    () => {
      pointersDown = Math.max(0, pointersDown - 1)
    },
    true,
  )
  window.addEventListener(
    'pointercancel',
    () => {
      pointersDown = Math.max(0, pointersDown - 1)
    },
    true,
  )
}

/**
 * 打开若发生在 pointer 按下期间（或同轮事件冒泡中），抑制 outside dismiss，
 * 直到指针抬起，并再刷一次 macrotask（吞掉打开点击残留的 outside）。
 * 不使用固定毫秒锁，避免拖慢正常点遮罩关闭。
 */
const suppressOutsideUntilGestureEnd = ref(false)
let gestureReleaseBound = false
let gestureMacrotaskTimer = 0

function releaseOutsideSuppress(): void {
  suppressOutsideUntilGestureEnd.value = false
  if (gestureMacrotaskTimer) {
    window.clearTimeout(gestureMacrotaskTimer)
    gestureMacrotaskTimer = 0
  }
  if (!gestureReleaseBound) return
  gestureReleaseBound = false
  window.removeEventListener('pointerup', onGesturePointerRelease, true)
  window.removeEventListener('pointercancel', onGesturePointerRelease, true)
}

function onGesturePointerRelease(): void {
  if (pointersDown > 0) return
  // 指针已抬起：再等一个 macrotask，避开同次点击残留的 outside
  if (gestureMacrotaskTimer) window.clearTimeout(gestureMacrotaskTimer)
  gestureMacrotaskTimer = window.setTimeout(() => {
    gestureMacrotaskTimer = 0
    releaseOutsideSuppress()
  }, 0)
}

function armOutsideSuppressForOpenGesture(): void {
  ensurePointerTracking()
  releaseOutsideSuppress()
  suppressOutsideUntilGestureEnd.value = true
  if (pointersDown > 0) {
    gestureReleaseBound = true
    window.addEventListener('pointerup', onGesturePointerRelease, true)
    window.addEventListener('pointercancel', onGesturePointerRelease, true)
    return
  }
  // 指针已抬起（常见于 click 打开）：仅吞掉本轮之后的同步/微任务 outside
  gestureMacrotaskTimer = window.setTimeout(() => {
    gestureMacrotaskTimer = 0
    releaseOutsideSuppress()
  }, 0)
}

function clearAfterOpenTimer(): void {
  if (!afterOpenTimer) return
  window.clearTimeout(afterOpenTimer)
  afterOpenTimer = 0
}

function queueAfterOpen(): void {
  clearAfterOpenTimer()
  // 略晚于滑入动画，便于业务在可见后聚焦
  afterOpenTimer = window.setTimeout(() => {
    afterOpenTimer = 0
    if (open.value) emit('afterOpen')
  }, 280)
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    armOutsideSuppressForOpenGesture()
    emit('openChange', true)
    queueAfterOpen()
    return
  }
  if (!isOpen && wasOpen) {
    releaseOutsideSuppress()
    clearAfterOpenTimer()
    emit('openChange', false)
    if (!closing.value) emit('afterClose', 'programmatic')
  }
})

onBeforeUnmount(() => {
  releaseOutsideSuppress()
  clearAfterOpenTimer()
})

async function requestClose(reason: RsDrawerCloseReason): Promise<boolean> {
  if (!open.value || closing.value) return false
  closing.value = true
  pendingCloseReason = reason
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

/** DialogRoot 受控更新：打开直通；关闭统一走 beforeClose */
async function onUpdateOpen(next: boolean): Promise<void> {
  if (next) {
    open.value = true
    return
  }
  await requestClose(pendingCloseReason)
  pendingCloseReason = 'programmatic'
}

function onEscapeKeyDown(event: Event): void {
  if (!props.closeOnEsc) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'escape'
}

function shouldBlockOutsideDismiss(): boolean {
  return (
    !props.closeOnOverlayClick ||
    suppressOutsideUntilGestureEnd.value
  )
}

function onPointerDownOutside(event: Event): void {
  if (shouldBlockOutsideDismiss()) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'overlay'
}

function onInteractOutside(event: Event): void {
  if (shouldBlockOutsideDismiss()) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'overlay'
}

function onFocusOutside(event: Event): void {
  // 抽屉仅响应 pointer / Esc 关闭，聚焦到背后（尤其非模态）不得 dismiss
  event.preventDefault()
}

async function onHeaderCloseClick(): Promise<void> {
  await requestClose('close')
}

defineExpose({
  /** 请求关闭（走 beforeClose） */
  close: (reason: RsDrawerCloseReason = 'programmatic') => requestClose(reason),
  /** 打开抽屉 */
  openDrawer: () => {
    open.value = true
  },
})
</script>

<template>
  <DialogRoot :open="open" :modal="isModal" @update:open="onUpdateOpen">
    <DialogPortal
      :disabled="teleportTo === false"
      :to="teleportTo === false ? undefined : teleportTo"
    >
      <DialogOverlay
        v-if="showOverlay"
        class="rs-drawer__overlay rs-motion-reduce"
        :class="{ 'rs-drawer__overlay--contained': contained }"
        :style="overlayStyle"
      />
      <DialogContent
        class="rs-drawer__content rs-motion-reduce"
        :class="contentClass"
        :style="contentStyle"
        @pointer-down-outside="onPointerDownOutside"
        @interact-outside="onInteractOutside"
        @focus-outside="onFocusOutside"
        @escape-key-down="onEscapeKeyDown"
      >
        <header v-if="title || description || showClose || $slots.header" class="rs-drawer__header">
          <slot name="header">
            <div class="rs-drawer__heading">
              <DialogTitle v-if="title" class="rs-drawer__title">{{ title }}</DialogTitle>
              <DialogDescription v-if="description" class="rs-drawer__description">
                {{ description }}
              </DialogDescription>
            </div>
          </slot>
          <RsButton
            v-if="showClose"
            variant="ghost"
            size="sm"
            icon="x"
            :tooltip="t('dialog.close')"
            @click="onHeaderCloseClick"
          />
        </header>
        <!--
          自定义 #header 或不传 title 时，默认插槽内的 DialogTitle 不会挂载。
          补一层仅供读屏的 Title，满足 Reka DialogContent 无障碍要求。
        -->
        <DialogTitle
          v-if="$slots.header || !title"
          class="rs-drawer__title rs-drawer__title--sr-only"
        >
          {{ title || ' ' }}
        </DialogTitle>
        <!-- 无可见 description 时仍提供 DialogDescription，避免 Reka a11y 警告 -->
        <DialogDescription
          v-if="!description || $slots.header"
          class="rs-drawer__description rs-drawer__description--sr-only"
        >
          {{ description || title || ' ' }}
        </DialogDescription>
        <div class="rs-drawer__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="rs-drawer__footer">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.rs-drawer__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--rs-z-modal);
  background: var(--rs-drawer-overlay-bg, var(--rs-dialog-overlay-bg, rgb(0 0 0 / 0.24)));
  backdrop-filter: blur(var(--rs-drawer-overlay-blur, var(--rs-dialog-overlay-blur, 0px))) saturate(120%);
  -webkit-backdrop-filter: blur(var(--rs-drawer-overlay-blur, var(--rs-dialog-overlay-blur, 0px)))
    saturate(120%);
}
.rs-drawer__overlay[data-state='open'] {
  animation: rs-drawer-overlay-in var(--rs-drawer-motion-duration-in, 240ms) ease;
}
.rs-drawer__overlay[data-state='closed'] {
  animation: rs-drawer-overlay-out var(--rs-drawer-motion-duration-out, 180ms) ease;
}
.rs-drawer__overlay--contained {
  position: absolute;
}
.rs-drawer__content {
  position: fixed;
  z-index: calc(var(--rs-z-modal) + 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--rs-drawer-border, var(--rs-border));
  background: var(--rs-drawer-body-bg, var(--rs-surface-elevated));
  color: var(--rs-text);
  box-shadow: var(--rs-shadow-lg);
  outline: none;
  will-change: transform;
}
.rs-drawer__content--contained {
  position: absolute;
}
.rs-drawer__content--right,
.rs-drawer__content--left {
  top: 0;
  bottom: 0;
  width: min(100vw, var(--rs-drawer-panel-size, 28rem));
}
.rs-drawer__content--contained:is(.rs-drawer__content--right, .rs-drawer__content--left) {
  width: min(100%, var(--rs-drawer-panel-size, 28rem));
}
.rs-drawer__content--right {
  right: 0;
  border-right: 0;
  border-radius: var(--rs-radius) 0 0 var(--rs-radius);
}
.rs-drawer__content--left {
  left: 0;
  border-left: 0;
  border-radius: 0 var(--rs-radius) var(--rs-radius) 0;
}
.rs-drawer__content--top,
.rs-drawer__content--bottom {
  left: 0;
  right: 0;
  height: min(100vh, var(--rs-drawer-panel-size, 22rem));
}
.rs-drawer__content--contained:is(.rs-drawer__content--top, .rs-drawer__content--bottom) {
  height: min(100%, var(--rs-drawer-panel-size, 22rem));
}
.rs-drawer__content--top {
  top: 0;
  border-top: 0;
  border-radius: 0 0 var(--rs-radius) var(--rs-radius);
}
.rs-drawer__content--bottom {
  bottom: 0;
  border-bottom: 0;
  border-radius: var(--rs-radius) var(--rs-radius) 0 0;
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

/* 滑入 / 滑出（与 Reka data-state 对齐；缓动接近主流 sheet） */
.rs-drawer__content--right[data-state='open'] {
  animation: rs-drawer-slide-right-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--right[data-state='closed'] {
  animation: rs-drawer-slide-right-out var(--rs-drawer-motion-duration-out, 180ms) ease;
}
.rs-drawer__content--left[data-state='open'] {
  animation: rs-drawer-slide-left-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--left[data-state='closed'] {
  animation: rs-drawer-slide-left-out var(--rs-drawer-motion-duration-out, 180ms) ease;
}
.rs-drawer__content--top[data-state='open'] {
  animation: rs-drawer-slide-top-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--top[data-state='closed'] {
  animation: rs-drawer-slide-top-out var(--rs-drawer-motion-duration-out, 180ms) ease;
}
.rs-drawer__content--bottom[data-state='open'] {
  animation: rs-drawer-slide-bottom-in var(--rs-drawer-motion-duration-in, 240ms)
    cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-drawer__content--bottom[data-state='closed'] {
  animation: rs-drawer-slide-bottom-out var(--rs-drawer-motion-duration-out, 180ms) ease;
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
  padding: var(--rs-drawer-header-padding-y) var(--rs-drawer-header-padding-x);
  background: var(--rs-drawer-header-bg);
  border-bottom: 1px solid var(--rs-drawer-separator, var(--rs-border-subtle));
}
.rs-drawer__heading {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  padding: var(--rs-drawer-footer-padding-y) var(--rs-drawer-footer-padding-x);
  background: var(--rs-drawer-footer-bg);
  border-top: 1px solid
    var(--rs-drawer-footer-border, var(--rs-drawer-separator, var(--rs-border-subtle)));
}
.rs-drawer__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--rs-drawer-body-padding-y) var(--rs-drawer-body-padding-x);
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
  margin: var(--rs-space-xs) 0 0;
  color: var(--rs-drawer-description-fg, var(--rs-muted));
  font-size: var(--rs-font-size-sm);
}
.rs-drawer__description--sr-only {
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
