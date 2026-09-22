<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRef,
  useAttrs,
  useId,
  useSlots,
  watch,
} from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import RsButton from '../../button/src/RsButton.vue'
import type { RsFeedbackTone } from '../../_shared/src/overlay-utils'
import {
  acquireDialogScrollLock,
  claimDialogInert,
  dialogLayerTick,
  dialogTargetOwnsTab,
  isTopDialogLayer,
  pushDialogLayer,
  resolveDialogTabTarget,
  releaseDialogInert,
  removeDialogLayer,
  resolveDialogOverlayStyle,
  runRsDialogBeforeClose,
  isRsDialogWidthPreset,
  resolveRsDialogCssWidth,
  resolveRsDialogWidthPx,
  type RsDialogBeforeClose,
  type RsDialogCloseReason,
  type RsDialogLayout,
  type RsDialogWidth,
  type RsDialogWidthPreset,
} from './dialog-utils'
import { dialogViewportSize } from './dialog-viewport'
import { useRsDialogWindow } from './dialog-window'

defineOptions({ name: 'RsDialog', inheritAttrs: false })

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    /** 标题文案；也可用 `#title` / `#header` 插槽。空白时用 dialog.label 作可访问名称 */
    title?: string
    description?: string
    /**
     * 宽度：`sm` / `md` / `lg`，或 number(px) / `px` / `rem` / `%`。
     * window：打开时折成像素后居中（`%` 相对视口扣除 inset），之后可拖拽缩放。
     * form / confirm：自定义宽度按 CSS 写入。
     */
    width?: RsDialogWidth
    /**
     * 高度：与 width 相同单位。仅 window 在打开时折成像素作为初始高度
     *（`%` 相对视口扣除 inset）；form / confirm 忽略。
     */
    height?: RsDialogWidth
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
    /** 是否模态。true 时锁焦点、锁滚动、挡住背后点击。false 时背后仍可操作。 */
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
    /** 按 Esc 是否关闭；默认 true */
    closeOnEsc?: boolean
    /**
     * 挂载目标
     * - string / HTMLElement：Teleport 到指定节点
     * - false：禁用 Teleport，就地渲染
     * - undefined：挂到 body
     *
     * 全屏时若未禁用 Teleport，会临时改挂到 body，
     * 避免业务容器内的层叠上下文低于应用顶栏。
     */
    teleportTo?: string | HTMLElement | false
    /**
     * 延后挂载 #body / 默认插槽，避免与打开动画/重组件 init 争抢主线程。
     * 默认：window 布局为 true，form / confirm 为 false。
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
    /** 模态时锁 body 滚动。非模态永远不锁。 */
    lockScroll?: boolean
    /** 覆盖 --rs-z-modal。遮罩用该值，面板 +1。 */
    zIndex?: number
    id?: string
    /** 覆盖可访问名称。有可见标题时仍优先 aria-labelledby。 */
    ariaLabel?: string
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
    lockScroll: true,
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
const uid = useId()
const layerId = uid

const anchorRef = ref<HTMLElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const panelTheme = ref<string>()
const panelDir = ref<'ltr' | 'rtl'>()
const panelLang = ref<string>()

const isCompactLayout = computed(() => props.layout === 'form' || props.layout === 'confirm')
const isWindowLayout = computed(() => !isCompactLayout.value)
const enableDraggable = computed(() => props.draggable && isWindowLayout.value)
const enableResizable = computed(() => props.resizable && isWindowLayout.value)
const passedProps = getCurrentInstance()?.vnode.props
function propWasPassed(name: string): boolean {
  if (!passedProps) return false
  const kebab = name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  return Object.hasOwn(passedProps, name) || Object.hasOwn(passedProps, kebab)
}
// 布尔 prop 缺省会被收成 false，不能用 ?? 判断「没传」。window 默认延后挂载，form 默认立即挂载。
const deferBodyMount = computed(() =>
  propWasPassed('deferBodyMount') ? Boolean(props.deferBodyMount) : isWindowLayout.value,
)

const domId = computed(() => props.id?.trim() || `rs-dialog-${uid}`)
const titleDomId = computed(() => `${domId.value}-title`)
const descriptionDomId = computed(() => `${domId.value}-description`)
const hasVisibleTitle = computed(() => Boolean(props.title?.trim()) || Boolean(slots.title))
const hasDescription = computed(() => Boolean(props.description?.trim()) || Boolean(slots.description))
const labelledBy = computed(() => {
  if (props.ariaLabel?.trim() || slots.header || !hasVisibleTitle.value) return undefined
  return titleDomId.value
})
const accessibleName = computed(() => {
  if (labelledBy.value) return undefined
  return props.ariaLabel?.trim() || t('dialog.label')
})
const describedBy = computed(() =>
  hasDescription.value && !slots.header ? descriptionDomId.value : undefined,
)

const overlayStyle = computed(() => {
  const visual = resolveDialogOverlayStyle({
    overlayOpacity: props.overlayOpacity,
    overlayBlur: props.overlayBlur,
  })
  const z = zIndexStyle(0)
  if (!visual) return z
  if (!z) return visual
  return { ...visual, ...z }
})

const widthPreset = computed<RsDialogWidthPreset>(() =>
  isRsDialogWidthPreset(props.width) ? props.width : 'md',
)

const initialWidthPx = computed(() => resolveRsDialogWidthPx(props.width))
const initialHeightPx = computed(() =>
  props.height == null || props.height === ''
    ? undefined
    : resolveRsDialogWidthPx(props.height, dialogViewportSize().height),
)

const customCssWidth = computed(() => resolveRsDialogCssWidth(props.width))

const bodyReady = ref(false)
const closing = ref(false)
let disposed = false
let closeGeneration = 0
let bodyMountFrameOuter = 0
let bodyMountFrameInner = 0
let afterOpenTimer = 0
let keyBound = false
let outsideBound = false
let releaseScroll: (() => void) | null = null
let returnTo: HTMLElement | null = null
let inertGeneration = 0

function resetBodyMount(): void {
  if (typeof cancelAnimationFrame === 'function') {
    if (bodyMountFrameOuter) cancelAnimationFrame(bodyMountFrameOuter)
    if (bodyMountFrameInner) cancelAnimationFrame(bodyMountFrameInner)
  }
  bodyMountFrameOuter = 0
  bodyMountFrameInner = 0
  bodyReady.value = false
}

function scheduleBodyMount(): void {
  resetBodyMount()
  if (typeof requestAnimationFrame !== 'function') {
    if (open.value) bodyReady.value = true
    return
  }
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
  if (!afterOpenTimer || typeof window === 'undefined') return
  window.clearTimeout(afterOpenTimer)
  afterOpenTimer = 0
}

function queueAfterOpen(): void {
  clearAfterOpenTimer()
  if (typeof window === 'undefined') return
  afterOpenTimer = window.setTimeout(() => {
    afterOpenTimer = 0
    if (open.value && !disposed) emit('afterOpen')
  }, 230)
}

function zIndexStyle(offset: number): Record<string, string> | undefined {
  if (props.zIndex == null || !Number.isFinite(props.zIndex)) return undefined
  return { zIndex: String(Math.round(props.zIndex) + offset) }
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
  const dir = directed?.getAttribute('dir')
  panelDir.value = dir === 'ltr' || dir === 'rtl' ? dir : undefined
  panelLang.value = langed?.getAttribute('lang') || undefined
}

function syncScrollLock(): void {
  const should = open.value && props.modal && props.lockScroll
  if (should && !releaseScroll) {
    releaseScroll = acquireDialogScrollLock()
    return
  }
  if (!should && releaseScroll) {
    releaseScroll()
    releaseScroll = null
  }
}

async function syncInert(): Promise<void> {
  const generation = ++inertGeneration
  await nextTick()
  if (disposed || generation !== inertGeneration) return
  const top = open.value && props.modal && isTopDialogLayer(layerId)
  if (!top || !shellRef.value) {
    releaseDialogInert(layerId)
    return
  }
  claimDialogInert(layerId, shellRef.value)
}

function bindKey(): void {
  if (keyBound || typeof document === 'undefined') return
  document.addEventListener('keydown', onDocumentKeydown, true)
  keyBound = true
}

function unbindKey(): void {
  if (!keyBound || typeof document === 'undefined') return
  document.removeEventListener('keydown', onDocumentKeydown, true)
  keyBound = false
}

function bindOutside(): void {
  if (outsideBound || typeof document === 'undefined') return
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  outsideBound = true
}

function unbindOutside(): void {
  if (!outsideBound || typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  outsideBound = false
}

function syncOutside(): void {
  if (open.value && props.closeOnOverlayClick) bindOutside()
  else unbindOutside()
}

function rememberTrigger(): void {
  if (typeof document === 'undefined') return
  const active = document.activeElement
  if (
    active instanceof HTMLElement &&
    active !== document.body &&
    active !== document.documentElement
  ) {
    returnTo = active
    return
  }
  returnTo = null
}

function restoreTrigger(): void {
  const el = returnTo
  returnTo = null
  if (!el?.isConnected) return
  if (contentRef.value?.contains(el)) return
  el.focus()
}

function focusDialog(force: boolean): void {
  const root = contentRef.value
  if (!root || disposed) return
  const active = document.activeElement
  if (!force && active instanceof HTMLElement && root.contains(active) && active !== root) return
  const preferred = root.querySelector<HTMLElement>('[autofocus]')
  if (preferred && !preferred.hasAttribute('disabled')) {
    preferred.focus()
    return
  }
  root.focus()
}

function queueFocus(): void {
  void nextTick(() => {
    if (!open.value || disposed) return
    focusDialog(false)
  })
}

function focus(): void {
  focusDialog(true)
}

watch(bodyReady, (ready) => {
  if (!ready || !open.value || disposed) return
  const root = contentRef.value
  const active = typeof document === 'undefined' ? null : document.activeElement
  if (!root || active === root || !(active instanceof Node) || !root.contains(active)) queueFocus()
})

watch(
  open,
  (isOpen, wasOpen) => {
    if (isOpen) {
      if (wasOpen !== true) {
        rememberTrigger()
        syncChrome()
        pushDialogLayer(layerId)
        queueAfterOpen()
        queueFocus()
        if (wasOpen === false) emit('openChange', true)
      }
      bindKey()
      syncScrollLock()
      syncOutside()
      void syncInert()
      return
    }
    clearAfterOpenTimer()
    removeDialogLayer(layerId)
    unbindKey()
    unbindOutside()
    syncScrollLock()
    inertGeneration += 1
    releaseDialogInert(layerId)
    if (wasOpen === true) {
      restoreTrigger()
      emit('openChange', false)
      if (!closing.value) emit('afterClose', 'programmatic')
    }
  },
  { immediate: true },
)

watch(
  () =>
    [props.modal, props.lockScroll, props.closeOnOverlayClick, dialogLayerTick.value] as const,
  () => {
    if (!open.value || disposed) return
    syncScrollLock()
    syncOutside()
    void syncInert()
  },
)

onMounted(() => {
  if (import.meta.env.DEV && props.layout === 'confirm') {
    console.warn(
      '[RsDialog] layout:"confirm" 已弃用。确认/提示请使用 RsConfirmDialog / rsConfirm；RsDialog 仅用于工作窗与表单。',
    )
  }
  if (open.value) syncChrome()
})

onBeforeUnmount(() => {
  disposed = true
  inertGeneration += 1
  resetBodyMount()
  clearAfterOpenTimer()
  removeDialogLayer(layerId)
  unbindKey()
  unbindOutside()
  releaseScroll?.()
  releaseScroll = null
  releaseDialogInert(layerId)
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
  const z = zIndexStyle(1)
  if (isWindowLayout.value) {
    if (!z) return dialogStyle.value
    return { ...dialogStyle.value, ...z }
  }
  const cssW = customCssWidth.value
  if (!cssW && !z) return undefined
  const style: Record<string, string> = {}
  if (cssW) style.maxWidth = cssW
  if (z) Object.assign(style, z)
  return style
})

async function requestClose(reason: RsDialogCloseReason): Promise<boolean> {
  if (disposed || !open.value || closing.value) return false
  const generation = ++closeGeneration
  closing.value = true
  try {
    const allowed = await runRsDialogBeforeClose(props.beforeClose, reason)
    if (!allowed || disposed || generation !== closeGeneration) return false
    open.value = false
    await nextTick()
    if (!disposed) emit('afterClose', reason)
    return true
  } catch {
    return false
  } finally {
    if (generation === closeGeneration) closing.value = false
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (!open.value || !isTopDialogLayer(layerId)) return
  if (event.key === 'Escape') {
    if (event.isComposing) return
    if (!props.closeOnEsc || props.confirmLoading) {
      event.preventDefault()
      return
    }
    event.preventDefault()
    void requestClose('escape')
    return
  }
  if (event.key !== 'Tab' || !props.modal || dialogTargetOwnsTab(event.target)) return
  const root = contentRef.value
  if (!root) return
  const target = resolveDialogTabTarget(root, document.activeElement, event.shiftKey)
  if (target === 'stay') return
  event.preventDefault()
  target.focus()
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!open.value || !props.closeOnOverlayClick || props.confirmLoading) return
  if (!isTopDialogLayer(layerId)) return
  const root = contentRef.value
  const target = event.target
  if (!(target instanceof Node) || root?.contains(target)) return
  event.preventDefault()
  event.stopPropagation()
  void requestClose('overlay')
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
  if (props.autoCloseOnConfirm) await requestClose('confirm')
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
  initialHeight: initialHeightPx,
  draggable: enableDraggable,
  resizable: enableResizable,
  compact: isCompactLayout,
  boundsTransition: toRef(props, 'boundsTransition'),
})

/**
 * 全屏时跳出业务挂载点，挂到 body，
 * 还原后仍回到 props.teleportTo，以保留页签内浮层的生命周期绑定。
 */
const resolvedTeleportTo = computed(() => {
  if (isFullscreen.value && props.teleportTo !== false) return undefined
  return props.teleportTo
})

const teleportDisabled = computed(() => resolvedTeleportTo.value === false)
const teleportTarget = computed(() => {
  const target = resolvedTeleportTo.value
  if (target === false || target == null) return 'body'
  return target
})

watch(resolvedTeleportTo, () => {
  if (!open.value || disposed) return
  void syncInert()
})

watch(
  contentRef,
  (el) => {
    setPanelEl(el)
  },
  { flush: 'post' },
)

defineExpose({
  close: (reason: RsDialogCloseReason = 'programmatic') => requestClose(reason),
  openDialog: () => {
    open.value = true
  },
  focus,
})
</script>

<template>
  <span ref="anchorRef" hidden class="rs-dialog__anchor" aria-hidden="true" />
  <Teleport defer :to="teleportTarget" :disabled="teleportDisabled">
    <div
      v-if="open"
      ref="shellRef"
      class="rs-dialog"
      :data-rs-theme="panelTheme"
      :dir="panelDir"
      :lang="panelLang"
    >
      <div
        v-if="modal"
        class="rs-dialog__backdrop rs-motion-reduce"
        :class="{ 'rs-dialog__overlay': showOverlay }"
        :style="showOverlay ? overlayStyle : zIndexStyle(0)"
        aria-hidden="true"
      />
      <dialog
        :id="domId"
        ref="contentRef"
        v-bind="attrs"
        open
        class="rs-dialog__content rs-motion-reduce"
        :class="contentClass"
        :style="contentStyle"
        :aria-modal="modal ? 'true' : 'false'"
        :aria-labelledby="labelledBy"
        :aria-label="accessibleName"
        :aria-describedby="describedBy"
        tabindex="-1"
        data-state="open"
      >
        <template v-if="enableResizable && !isFullscreen">
          <div
            v-for="handle in resizeHandles"
            :key="handle"
            :class="['rs-dialog__resize-handle', `rs-dialog__resize-handle--${handle}`]"
            aria-hidden="true"
            @pointerdown.stop="onResizePointerDown(handle, $event)"
          />
        </template>
        <header class="rs-dialog__header" @pointerdown="onHeaderPointerDown">
          <slot name="header">
            <div class="rs-dialog__heading">
              <h2 :id="titleDomId" class="rs-dialog__title">
                <slot name="title">{{ resolvedTitle }}</slot>
              </h2>
              <p
                v-if="hasDescription"
                :id="descriptionDomId"
                class="rs-dialog__description"
              >
                <slot name="description">{{ description }}</slot>
              </p>
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
          <slot v-if="showBodyContent" name="body">
            <slot />
          </slot>
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
      </dialog>
    </div>
  </Teleport>
</template>

<style scoped>
.rs-dialog {
  display: contents;
}
.rs-dialog__anchor {
  display: none;
}
.rs-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--rs-z-modal);
  background: transparent;
}
.rs-dialog__overlay {
  background: var(--rs-dialog-overlay-bg);
  backdrop-filter: blur(var(--rs-dialog-overlay-blur)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--rs-dialog-overlay-blur)) saturate(120%);
  animation: rs-dialog-overlay-in 220ms ease;
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
  margin: 0;
  padding: 0;
  border-radius: var(--rs-radius-lg);
  border: 1px solid var(--rs-dialog-border);
  background: var(--rs-dialog-bg);
  --rs-fieldset-legend-bg: var(--rs-dialog-bg);
  box-shadow: var(--rs-dialog-shadow);
  outline: none;
  color: var(--rs-dialog-title-fg);
}
.rs-dialog__content:focus-visible {
  box-shadow:
    var(--rs-dialog-shadow),
    0 0 0 var(--rs-focus-ring-width) var(--rs-focus-ring);
}

[data-rs-theme='light'] .rs-dialog__content--form,
[data-rs-theme='light'] .rs-dialog__content--confirm {
  background: color-mix(in srgb, var(--rs-dialog-bg) 94%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
[data-rs-theme='light'] .rs-dialog__content--window {
  background: var(--rs-dialog-bg);
}
.rs-dialog__content--form[data-state='open'],
.rs-dialog__content--confirm[data-state='open'] {
  animation: rs-dialog-pop-in 240ms cubic-bezier(0.32, 0.72, 0, 1);
}
.rs-dialog__content--window[data-state='open'] {
  animation: rs-dialog-fade-in 220ms ease;
}
.rs-dialog__content--tone-info {
  border-color: color-mix(in srgb, var(--rs-info) 46%, var(--rs-dialog-border));
}
.rs-dialog__content--tone-success {
  border-color: color-mix(in srgb, var(--rs-success) 46%, var(--rs-dialog-border));
}
.rs-dialog__content--tone-warning {
  border-color: color-mix(in srgb, var(--rs-warning) 52%, var(--rs-dialog-border));
}
.rs-dialog__content--tone-danger {
  border-color: color-mix(in srgb, var(--rs-danger) 52%, var(--rs-dialog-border));
}
@keyframes rs-dialog-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
@keyframes rs-dialog-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
  padding-block: var(--rs-dialog-header-padding-y);
  padding-inline: var(--rs-dialog-header-padding-x);
  background: var(--rs-dialog-header-bg);
  border-block-end: 1px solid var(--rs-dialog-separator);
}
.rs-dialog__heading {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--rs-space-xs);
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
  text-align: start;
}
.rs-dialog__description {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-dialog-description-fg);
  line-height: var(--rs-line-height-normal);
  text-align: start;
}
.rs-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  padding-block: var(--rs-dialog-body-padding-y);
  padding-inline: var(--rs-dialog-body-padding-x);
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
  padding-block: var(--rs-dialog-footer-padding-y);
  padding-inline: var(--rs-dialog-footer-padding-x);
  background: var(--rs-dialog-footer-bg);
  border-block-start: 1px solid var(--rs-dialog-footer-border);
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
  inset-inline: 0.5rem;
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
@media (prefers-reduced-motion: reduce) {
  [data-rs-theme='light'] .rs-dialog__content--form,
  [data-rs-theme='light'] .rs-dialog__content--confirm,
  .rs-dialog__overlay {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--rs-dialog-bg);
  }
  .rs-dialog__overlay {
    background: var(--rs-dialog-overlay-bg);
  }
}
</style>
