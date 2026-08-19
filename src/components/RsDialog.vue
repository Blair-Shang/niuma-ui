<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRef,
  useAttrs,
  useSlots,
  watch,
} from 'vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from './reka'
import { useRsI18n } from '../composables/useRsI18n'
import RsButton from './RsButton.vue'
import type { RsFeedbackTone } from './overlay-utils'
import {
  isRsDialogWidthPreset,
  resolveDialogOverlayStyle,
  resolveRsDialogCssWidth,
  resolveRsDialogWidthPx,
  runRsDialogBeforeClose,
  type RsDialogBeforeClose,
  type RsDialogCloseReason,
  type RsDialogLayout,
  type RsDialogWidth,
  type RsDialogWidthPreset,
} from './dialog-utils'
import { useRsDialogWindow } from './dialog-window'

defineOptions({ inheritAttrs: false })

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    /** 标题文案；也可用 `#title` / `#header` 插槽。缺省时用空格满足无障碍 Title */
    title?: string
    description?: string
    /**
     * 宽度：`sm` / `md` / `lg`，或 number(px) / `px` / `rem` / `%`。
     * window：打开时折成像素后居中（`%` 相对视口扣除 inset），之后可拖拽缩放。
     * form / confirm：自定义宽度按 CSS 写入。
     */
    width?: RsDialogWidth
    tone?: RsFeedbackTone
    /**
     * window：可拖拽/缩放工作窗。
     * form：居中轻量表单/说明窗（高度随内容，默认不可缩放）。
     * confirm：历史别名，等同 form；确认/提示请用 RsConfirmDialog。
     */
    layout?: RsDialogLayout
    draggable?: boolean
    resizable?: boolean
    fullscreenable?: boolean
    /** 是否模态（false 时不锁焦点/不挡背后交互，适合页签内浮层） */
    modal?: boolean
    showOverlay?: boolean
    /**
     * 遮罩不透明度 0–1；覆盖主题默认（最浅）。
     * 例：0.08 最浅、0.35 适中、0.55 较深。
     */
    overlayOpacity?: number
    /** 遮罩模糊；number 为 px。默认主题为 0（无模糊，背后内容清晰） */
    overlayBlur?: number | string
    showClose?: boolean
    /** 点击外部是否关闭；默认 false。与 modal 独立：非模态也可保持打开。 */
    closeOnOverlayClick?: boolean
    /** 按 Esc 是否关闭；默认 true（与 Reka 默认一致） */
    closeOnEsc?: boolean
    /**
     * DialogPortal 挂载目标
     * - string / HTMLElement：Teleport 到指定节点
     * - false：禁用 Teleport，就地渲染（不挂到 body / 全局挂载点）
     * - undefined：走 Reka 默认（通常为 body，或 ConfigProvider.teleportTo）
     *
     * 全屏时若未禁用 Teleport，会临时改挂到默认目标（通常为 body），
     * 避免业务容器内的层叠上下文（如 isolation:isolate）低于应用顶栏。
     */
    teleportTo?: string | HTMLElement | false
    /**
     * 延后挂载 #body 插槽，避免与打开动画/重组件 init 争抢主线程。
     * 默认：window 布局为 true，confirm 为 false。
     */
    deferBodyMount?: boolean
    /** 全屏/还原时是否播放 bounds 过渡（含编辑器时建议保持 false） */
    boundsTransition?: boolean
    /** 关闭前钩子；返回 false 可阻止关闭（支持 async） */
    beforeClose?: RsDialogBeforeClose
    /**
     * 显示内置底部按钮区。默认 false，避免影响仅用 `#footer` 或不需要按钮的旧用法。
     * 无 `#footer` 且为 true 时渲染取消/确定。
     * 危险确认/提示请用 RsConfirmDialog，不要用本 footer 冒充确认 UI。
     */
    showFooter?: boolean
    showCancel?: boolean
    showConfirm?: boolean
    cancelText?: string
    confirmText?: string
    confirmLoading?: boolean
    confirmVariant?: 'primary' | 'danger'
    /** 点击确定后是否自动关闭（仍会走 beforeClose） */
    autoCloseOnConfirm?: boolean
  }>(),
  {
    title: '',
    width: 'md',
    tone: 'default',
    layout: 'window',
    draggable: false,
    resizable: true,
    fullscreenable: true,
    modal: true,
    showOverlay: false,
    showClose: true,
    closeOnOverlayClick: false,
    closeOnEsc: true,
    boundsTransition: false,
    showFooter: false,
    showCancel: true,
    showConfirm: true,
    confirmLoading: false,
    confirmVariant: 'primary',
    autoCloseOnConfirm: false,
  },
)

const emit = defineEmits<{
  openChange: [open: boolean]
  afterOpen: []
  afterClose: [reason: RsDialogCloseReason]
  confirm: []
  cancel: []
}>()

const attrs = useAttrs()
const slots = useSlots()
const { t } = useRsI18n()

const isCompactLayout = computed(() => props.layout === 'form' || props.layout === 'confirm')
const isWindowLayout = computed(() => !isCompactLayout.value)
const enableDraggable = computed(() => props.draggable && isWindowLayout.value)
const enableResizable = computed(() => props.resizable && isWindowLayout.value)
const deferBodyMount = computed(() => props.deferBodyMount ?? isWindowLayout.value)
const overlayStyle = computed(() =>
  resolveDialogOverlayStyle({
    overlayOpacity: props.overlayOpacity,
    overlayBlur: props.overlayBlur,
  }),
)

const widthPreset = computed<RsDialogWidthPreset>(() =>
  isRsDialogWidthPreset(props.width) ? props.width : 'md',
)

const initialWidthPx = computed(() => resolveRsDialogWidthPx(props.width))

const customCssWidth = computed(() => resolveRsDialogCssWidth(props.width))

const bodyReady = ref(false)
const closing = ref(false)
let pendingCloseReason: RsDialogCloseReason = 'programmatic'
let bodyMountFrameOuter = 0
let bodyMountFrameInner = 0
let afterOpenTimer = 0

function resetBodyMount(): void {
  if (bodyMountFrameOuter) {
    cancelAnimationFrame(bodyMountFrameOuter)
    bodyMountFrameOuter = 0
  }
  if (bodyMountFrameInner) {
    cancelAnimationFrame(bodyMountFrameInner)
    bodyMountFrameInner = 0
  }
  bodyReady.value = false
}

function scheduleBodyMount(): void {
  resetBodyMount()
  bodyMountFrameOuter = requestAnimationFrame(() => {
    bodyMountFrameOuter = 0
    bodyMountFrameInner = requestAnimationFrame(() => {
      bodyMountFrameInner = 0
      if (open.value) bodyReady.value = true
    })
  })
}

watch(
  [open, deferBodyMount],
  ([isOpen, defer]) => {
    if (!isOpen || !defer) {
      resetBodyMount()
      if (isOpen) bodyReady.value = true
      return
    }
    scheduleBodyMount()
  },
  { immediate: true },
)

function clearAfterOpenTimer(): void {
  if (!afterOpenTimer) return
  window.clearTimeout(afterOpenTimer)
  afterOpenTimer = 0
}

function queueAfterOpen(): void {
  clearAfterOpenTimer()
  // 略晚于打开动画，便于业务在可见后聚焦
  afterOpenTimer = window.setTimeout(() => {
    afterOpenTimer = 0
    if (open.value) emit('afterOpen')
  }, 230)
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    emit('openChange', true)
    queueAfterOpen()
    return
  }
  if (!isOpen && wasOpen) {
    emit('openChange', false)
    // 父级直接改 v-model 关闭时补发 afterClose（requestClose 路径已发过）
    if (!closing.value) emit('afterClose', 'programmatic')
  }
})

onMounted(() => {
  if (import.meta.env.DEV && props.layout === 'confirm') {
    console.warn(
      '[RsDialog] layout:"confirm" 已弃用。确认/提示请使用 RsConfirmDialog / rsConfirm；RsDialog 仅用于工作窗与表单。',
    )
  }
})

onBeforeUnmount(() => {
  resetBodyMount()
  clearAfterOpenTimer()
})

const showBodyContent = computed(() => !deferBodyMount.value || bodyReady.value)

const showBuiltinFooter = computed(
  () => props.showFooter && !slots.footer && (props.showCancel || props.showConfirm),
)

const resolvedTitle = computed(() => {
  const text = props.title?.trim()
  return text || ' '
})

const contentClass = computed(() => {
  const presetClass = isRsDialogWidthPreset(props.width)
    ? `rs-dialog__content--${props.width}`
    : 'rs-dialog__content--custom-width'
  return [
    isCompactLayout.value ? 'rs-dialog__content--form' : 'rs-dialog__content--window',
    props.layout === 'confirm' ? 'rs-dialog__content--confirm' : undefined,
    presetClass,
    `rs-dialog__content--tone-${props.tone}`,
    {
      'rs-dialog__content--fullscreen': isFullscreen.value,
      'rs-dialog__content--draggable': enableDraggable.value,
      'rs-dialog__content--bounds-transition': boundsTransitionEnabled.value,
    },
  ]
})

const contentStyle = computed(() => {
  const base = isWindowLayout.value ? dialogStyle.value : undefined
  // window 宽度只走 bounds 像素，避免 `90%` 覆盖 CSS 后与 left/top 脱节
  if (isWindowLayout.value) return base
  const cssW = customCssWidth.value
  if (!cssW) return base
  return {
    ...(base ?? {}),
    maxWidth: cssW,
  }
})

async function requestClose(reason: RsDialogCloseReason): Promise<boolean> {
  if (!open.value || closing.value) return false
  closing.value = true
  pendingCloseReason = reason
  try {
    const allowed = await runRsDialogBeforeClose(props.beforeClose, reason)
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
  if (!props.closeOnEsc || props.confirmLoading) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'escape'
}

/** 是否因外部交互关闭：与 modal 无关；非模态仍允许背后操作，仅控制是否 dismiss。 */
function onPointerDownOutside(event: Event): void {
  if (!props.closeOnOverlayClick || props.confirmLoading) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'overlay'
}

function onInteractOutside(event: Event): void {
  if (!props.closeOnOverlayClick || props.confirmLoading) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'overlay'
}

async function onHeaderCloseClick(): Promise<void> {
  await requestClose('close')
}

async function onBuiltinCancel(): Promise<void> {
  emit('cancel')
  await requestClose('cancel')
}

async function onBuiltinConfirm(): Promise<void> {
  emit('confirm')
  if (props.autoCloseOnConfirm) {
    await requestClose('confirm')
  }
}

const {
  isFullscreen,
  boundsTransitionEnabled,
  dialogStyle,
  resizeHandles,
  setPanelEl,
  toggleFullscreen,
  onHeaderPointerDown,
  onResizePointerDown,
} = useRsDialogWindow({
  open,
  widthPreset,
  initialWidth: initialWidthPx,
  draggable: enableDraggable,
  resizable: enableResizable,
  compact: isCompactLayout,
  boundsTransition: toRef(props, 'boundsTransition'),
})

/**
 * 全屏时跳出业务挂载点，挂到默认 portal（通常 body），
 * 还原后仍回到 props.teleportTo，以保留页签内浮层的生命周期绑定。
 */
const resolvedTeleportTo = computed(() => {
  if (isFullscreen.value && props.teleportTo !== false) {
    return undefined
  }
  return props.teleportTo
})

const contentRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null)

watch(
  contentRef,
  (inst) => {
    if (!inst) {
      setPanelEl(null)
      return
    }
    const el = inst instanceof HTMLElement ? inst : (inst.$el ?? null)
    setPanelEl(el instanceof HTMLElement ? el : null)
  },
  { flush: 'post' },
)

defineExpose({
  /** 请求关闭（走 beforeClose） */
  close: (reason: RsDialogCloseReason = 'programmatic') => requestClose(reason),
  /** 打开对话框 */
  openDialog: () => {
    open.value = true
  },
})
</script>

<template>
  <DialogRoot :open="open" :modal="modal" @update:open="onUpdateOpen">
    <DialogPortal
      :disabled="resolvedTeleportTo === false"
      :to="resolvedTeleportTo === false ? undefined : resolvedTeleportTo"
    >
      <DialogOverlay v-if="showOverlay" class="rs-dialog__overlay rs-motion-reduce" :style="overlayStyle" />
      <DialogContent
        ref="contentRef"
        v-bind="attrs"
        class="rs-dialog__content rs-motion-reduce"
        :class="contentClass"
        :style="contentStyle"
        @pointer-down-outside="onPointerDownOutside"
        @interact-outside="onInteractOutside"
        @escape-key-down="onEscapeKeyDown"
      >
        <template v-if="enableResizable && !isFullscreen">
          <div
            v-for="handle in resizeHandles"
            :key="handle"
            :class="['rs-dialog__resize-handle', `rs-dialog__resize-handle--${handle}`]"
            :aria-hidden="true"
            @pointerdown.stop="onResizePointerDown(handle, $event)"
          />
        </template>
        <header class="rs-dialog__header" @pointerdown="onHeaderPointerDown">
          <slot name="header">
            <div class="rs-dialog__heading">
              <DialogTitle class="rs-dialog__title">
                <slot name="title">{{ resolvedTitle }}</slot>
              </DialogTitle>
              <DialogDescription
                class="rs-dialog__description"
                :class="{ 'rs-dialog__description--sr-only': !description && !$slots.description }"
              >
                <slot name="description">{{ description || resolvedTitle }}</slot>
              </DialogDescription>
            </div>
          </slot>
          <div class="rs-dialog__actions">
            <RsButton
              v-if="fullscreenable && isWindowLayout"
              variant="ghost"
              size="sm"
              icon-only
              :icon="isFullscreen ? 'minimize-2' : 'maximize-2'"
              :tooltip="isFullscreen ? t('dialog.restore') : t('dialog.fullscreen')"
              @click="toggleFullscreen"
            />
            <RsButton
              v-if="showClose"
              variant="ghost"
              size="sm"
              icon-only
              icon="x"
              :disabled="confirmLoading"
              :tooltip="t('dialog.close')"
              @click="onHeaderCloseClick"
            />
          </div>
        </header>
        <div class="rs-dialog__body" :aria-busy="deferBodyMount && !bodyReady ? 'true' : undefined">
          <slot v-if="showBodyContent" name="body" />
          <div v-else class="rs-dialog__body-placeholder">
            <slot name="body-placeholder" />
          </div>
        </div>
        <footer v-if="$slots.footer || showBuiltinFooter" class="rs-dialog__footer">
          <slot
            name="footer"
            :confirm-loading="confirmLoading"
            :on-confirm="onBuiltinConfirm"
            :on-cancel="onBuiltinCancel"
          >
            <template v-if="showBuiltinFooter">
              <RsButton
                v-if="showCancel"
                variant="default"
                size="sm"
                :disabled="confirmLoading"
                @click="onBuiltinCancel"
              >
                {{ cancelText ?? t('common.cancel') }}
              </RsButton>
              <RsButton
                v-if="showConfirm"
                :variant="confirmVariant"
                size="sm"
                :loading="confirmLoading"
                @click="onBuiltinConfirm"
              >
                {{ confirmText ?? t('common.confirm') }}
              </RsButton>
            </template>
          </slot>
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.rs-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--rs-z-modal);
  background: var(--rs-dialog-overlay-bg);
  backdrop-filter: blur(var(--rs-dialog-overlay-blur)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--rs-dialog-overlay-blur)) saturate(120%);
}
.rs-dialog__overlay[data-state='open'] {
  animation: rs-dialog-overlay-in 220ms ease;
}
.rs-dialog__overlay[data-state='closed'] {
  animation: rs-dialog-overlay-out 160ms ease;
}
.rs-dialog__content {
  position: fixed;
  left: 50%;
  top: calc(
    var(--rs-dialog-inset-top, 1rem) +
      (100vh - var(--rs-dialog-inset-top, 1rem) - var(--rs-dialog-inset-bottom, 1rem)) / 2
  );
  z-index: calc(var(--rs-z-modal) + 1);
  display: flex;
  max-height: min(
    calc(100vh - var(--rs-dialog-inset-top, 1rem) - var(--rs-dialog-inset-bottom, 1rem) - 2rem),
    40rem
  );
  width: calc(100vw - 2 * var(--rs-dialog-inset-x, 1rem));
  max-width: calc(100vw - 2 * var(--rs-dialog-inset-x, 1rem));
  flex-direction: column;
  transform: translate(-50%, -50%);
  overflow: hidden;
  border-radius: var(--rs-radius-lg);
  border: 1px solid var(--rs-dialog-border);
  background: var(--rs-dialog-bg);
  box-shadow: var(--rs-dialog-shadow);
  outline: none;
  color: var(--rs-dialog-title-fg);
}

/* 亮色 form：轻微 vibrancy；window 用实底避免 CEF 下 blur 合成开销 */
[data-rs-theme='light'] .rs-dialog__content--form,
[data-rs-theme='light'] .rs-dialog__content--confirm {
  background: color-mix(in srgb, var(--rs-dialog-bg) 94%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
[data-rs-theme='light'] .rs-dialog__content--window {
  background: var(--rs-dialog-bg);
}
/* form 布局：缩放 + 淡入（居中，含 translate）；苹果 sheet 缓动曲线 */
.rs-dialog__content--form[data-state='open'],
.rs-dialog__content--confirm[data-state='open'] {
  animation: rs-dialog-pop-in 240ms cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-dialog__content--form[data-state='closed'],
.rs-dialog__content--confirm[data-state='closed'] {
  animation: rs-dialog-pop-out 180ms ease;
}
/* window 布局：位置由拖拽内联样式控制，仅淡入避免与 transform 冲突 */
.rs-dialog__content--window[data-state='open'] {
  animation: rs-dialog-fade-in 220ms ease;
}
.rs-dialog__content--window[data-state='closed'] {
  animation: rs-dialog-fade-out 150ms ease;
}
@keyframes rs-dialog-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes rs-dialog-overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes rs-dialog-pop-in {
  from {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes rs-dialog-pop-out {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -47%) scale(0.97);
  }
}
@keyframes rs-dialog-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes rs-dialog-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.rs-dialog__content--window {
  left: 50%;
  top: 50%;
  max-width: none;
  max-height: none;
  transform: none;
}
.rs-dialog__content--window.rs-dialog__content--bounds-transition {
  transition:
    left 220ms cubic-bezier(0.32, 0.72, 0, 1),
    top 220ms cubic-bezier(0.32, 0.72, 0, 1),
    width 220ms cubic-bezier(0.32, 0.72, 0, 1),
    height 220ms cubic-bezier(0.32, 0.72, 0, 1),
    border-radius 220ms cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-dialog__content--sm {
  max-width: 24rem;
}
.rs-dialog__content--md {
  max-width: 32rem;
}
.rs-dialog__content--lg {
  max-width: 42rem;
}
.rs-dialog__content--window.rs-dialog__content--sm,
.rs-dialog__content--window.rs-dialog__content--md,
.rs-dialog__content--window.rs-dialog__content--lg,
.rs-dialog__content--window.rs-dialog__content--custom-width {
  max-width: none;
}
.rs-dialog__content--fullscreen {
  border-radius: var(--rs-radius);
}
.rs-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-md);
  flex-shrink: 0;
  box-sizing: border-box;
  height: var(--rs-dialog-header-height);
  min-height: var(--rs-dialog-header-min-height);
  padding: var(--rs-dialog-header-padding-y) var(--rs-dialog-header-padding-x);
  background: var(--rs-dialog-header-bg);
  border-bottom: 1px solid var(--rs-dialog-separator);
}
.rs-dialog__heading {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}
.rs-dialog__content--window.rs-dialog__content--draggable .rs-dialog__header {
  cursor: move;
  user-select: none;
}
.rs-dialog__title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  font-size: var(--rs-font-size-base);
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: -0.015em;
  line-height: var(--rs-line-height-tight, 1.3);
  color: var(--rs-dialog-title-fg);
}
.rs-dialog__description {
  margin: var(--rs-space-xs) 0 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-dialog-description-fg);
  line-height: var(--rs-line-height-normal);
}
.rs-dialog__description--sr-only {
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
.rs-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  padding: var(--rs-dialog-body-padding-y) var(--rs-dialog-body-padding-x);
  background: var(--rs-dialog-body-bg);
}
.rs-dialog__content--window .rs-dialog__body {
  display: flex;
  flex-direction: column;
}
.rs-dialog__body-placeholder {
  flex: 1;
  min-height: 0;
}
.rs-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  flex-shrink: 0;
  box-sizing: border-box;
  height: var(--rs-dialog-footer-height);
  min-height: var(--rs-dialog-footer-min-height);
  padding: var(--rs-dialog-footer-padding-y) var(--rs-dialog-footer-padding-x);
  background: var(--rs-dialog-footer-bg);
  border-top: 1px solid var(--rs-dialog-footer-border);
}
.rs-dialog__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  flex-shrink: 0;
}
.rs-dialog__resize-handle {
  position: absolute;
  z-index: 2;
}
.rs-dialog__resize-handle--n,
.rs-dialog__resize-handle--s {
  left: 0.5rem;
  right: 0.5rem;
  height: 0.5rem;
  cursor: ns-resize;
}
.rs-dialog__resize-handle--n {
  top: -0.25rem;
}
.rs-dialog__resize-handle--s {
  bottom: -0.25rem;
}
.rs-dialog__resize-handle--e,
.rs-dialog__resize-handle--w {
  top: 0.5rem;
  bottom: 0.5rem;
  width: 0.5rem;
  cursor: ew-resize;
}
.rs-dialog__resize-handle--e {
  right: -0.25rem;
}
.rs-dialog__resize-handle--w {
  left: -0.25rem;
}
.rs-dialog__resize-handle--ne,
.rs-dialog__resize-handle--nw,
.rs-dialog__resize-handle--se,
.rs-dialog__resize-handle--sw {
  width: 0.75rem;
  height: 0.75rem;
}
.rs-dialog__resize-handle--ne {
  top: -0.25rem;
  right: -0.25rem;
  cursor: nesw-resize;
}
.rs-dialog__resize-handle--nw {
  top: -0.25rem;
  left: -0.25rem;
  cursor: nwse-resize;
}
.rs-dialog__resize-handle--se {
  right: -0.25rem;
  bottom: -0.25rem;
  cursor: nwse-resize;
}
.rs-dialog__resize-handle--sw {
  left: -0.25rem;
  bottom: -0.25rem;
  cursor: nesw-resize;
}
</style>
