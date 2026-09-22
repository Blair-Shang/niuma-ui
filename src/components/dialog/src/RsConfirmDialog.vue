<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch, type Component } from 'vue'
import RsButton from '../../button/src/RsButton.vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  acquireDialogScrollLock,
  claimDialogInert,
  dialogLayerTick,
  isRsDialogWidthPreset,
  dialogTargetOwnsTab,
  isTopDialogLayer,
  listDialogTabbables,
  pushDialogLayer,
  releaseDialogInert,
  removeDialogLayer,
  resolveDialogOverlayStyle,
  resolveDialogTabTarget,
  resolveRsDialogCssWidth,
  runRsConfirmBeforeClose,
  type RsConfirmBeforeClose,
  type RsConfirmCloseReason,
  type RsDialogWidth,
} from './dialog-utils'
import type { RsFeedbackTone } from '../../_shared/src/overlay-utils'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    /** 次要说明，显示在标题与正文之间 */
    subtitle?: string
    description?: string
    tone?: RsFeedbackTone
    /** 自定义图标组件；不传则使用默认 "!" */
    icon?: Component
    /** 宽度：预设或自定义；不传保持历史默认 max-width: 28rem */
    width?: RsDialogWidth
    confirmText?: string
    cancelText?: string
    confirmVariant?: 'primary' | 'danger'
    /** 是否显示取消按钮；false 时为单按钮提示 */
    showCancel?: boolean
    /** 确认中：禁用按钮并阻止 Esc 关闭 */
    confirmLoading?: boolean
    /**
     * 点击确认后是否自动关闭。默认 true。
     * 命令式异步 onConfirm 场景可设为 false，由调用方在结束后关闭。
     */
    autoCloseOnConfirm?: boolean
    /** 关闭前钩子；返回 false 可阻止关闭（支持 async） */
    beforeClose?: RsConfirmBeforeClose
    showOverlay?: boolean
    /** 遮罩不透明度 0–1；覆盖主题默认（最浅） */
    overlayOpacity?: number
    /** 遮罩模糊；number 为 px。默认主题为 0 */
    overlayBlur?: number | string
    /** 挂载目标；false 禁用 Teleport */
    teleportTo?: string | HTMLElement | false
    /** Esc 关闭。确认中无效。只作用于最上层。 */
    closeOnEsc?: boolean
    /** 模态时锁 body 滚动。默认 true。 */
    lockScroll?: boolean
    /** 覆盖 --rs-z-modal。遮罩用该值，面板 +1。 */
    zIndex?: number
    /** 没有可用标题关联时的可访问名称 */
    ariaLabel?: string
    id?: string
  }>(),
  {
    tone: 'danger',
    confirmVariant: 'danger',
    showCancel: true,
    confirmLoading: false,
    autoCloseOnConfirm: true,
    showOverlay: false,
    closeOnEsc: true,
    lockScroll: true,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useRsI18n()
const uid = useId()
const layerId = uid
const anchorRef = ref<HTMLElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const panelTheme = ref<string>()
const panelDir = ref<'ltr' | 'rtl'>()
const panelLang = ref<string>()

const domId = computed(() => props.id?.trim() || `rs-confirm-${uid}`)
const titleDomId = computed(() => `${domId.value}-title`)
const descriptionDomId = computed(() => `${domId.value}-description`)

let disposed = false
let closing = false
let closeGeneration = 0
/** requestClose 已决定原因。null 表示父级把 open 设成 false。 */
let closeFromInside: RsConfirmCloseReason | null = null
let keyBound = false
let releaseScroll: (() => void) | null = null
let returnTo: HTMLElement | null = null
let inertGeneration = 0

const contentClass = computed(() => {
  if (props.width && isRsDialogWidthPreset(props.width)) {
    return `rs-confirm-dialog__content--${props.width}`
  }
  return undefined
})

function zIndexStyle(offset: number): Record<string, string> | undefined {
  if (props.zIndex == null || !Number.isFinite(props.zIndex)) return undefined
  return { zIndex: String(Math.round(props.zIndex) + offset) }
}

const overlayStyle = computed(() => {
  const visual = props.showOverlay
    ? resolveDialogOverlayStyle({
        overlayOpacity: props.overlayOpacity,
        overlayBlur: props.overlayBlur,
      })
    : undefined
  const z = zIndexStyle(0)
  if (!visual) return z
  if (!z) return visual
  return { ...visual, ...z }
})

const contentStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.width != null && !isRsDialogWidthPreset(props.width)) {
    const css = resolveRsDialogCssWidth(props.width)
    if (css) style.maxWidth = css
  }
  const z = zIndexStyle(1)
  if (z) Object.assign(style, z)
  return Object.keys(style).length ? style : undefined
})

const descriptionText = computed(() => {
  if (props.description != null && props.description !== '') return props.description
  return undefined
})

const showDefaultDescription = computed(
  () => descriptionText.value == null && !props.subtitle,
)

const hasDescribedBy = computed(
  () => descriptionText.value != null || Boolean(props.subtitle) || showDefaultDescription.value,
)

const labelledBy = computed(() => (props.ariaLabel?.trim() ? undefined : titleDomId.value))
const accessibleName = computed(() => props.ariaLabel?.trim() || undefined)

// Teleport 只在打开时挂载。挂载时解析不到 to 会被记成 null，之后打开不会再查。
const teleportDisabled = computed(() => props.teleportTo === false)
const teleportTarget = computed(() => {
  const target = props.teleportTo
  if (target === false || target == null) return 'body'
  return target
})

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
  const should = open.value && props.lockScroll
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
  const top = open.value && isTopDialogLayer(layerId)
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
  const first = listDialogTabbables(root)[0]
  if (first) {
    first.focus()
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

async function requestClose(reason: RsConfirmCloseReason): Promise<boolean> {
  if (disposed || !open.value || closing) return false
  const generation = ++closeGeneration
  closing = true
  try {
    const allowed = await runRsConfirmBeforeClose(props.beforeClose, reason)
    if (!allowed || disposed || generation !== closeGeneration || !open.value) return false
    closeFromInside = reason
    open.value = false
    return true
  } catch {
    return false
  } finally {
    if (generation === closeGeneration) closing = false
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
  if (event.key !== 'Tab' || dialogTargetOwnsTab(event.target)) return
  const root = contentRef.value
  if (!root) return
  const target = resolveDialogTabTarget(root, document.activeElement, event.shiftKey)
  if (target === 'stay') return
  event.preventDefault()
  target.focus()
}

async function onConfirmClick(): Promise<void> {
  emit('confirm')
  if (props.autoCloseOnConfirm !== false) {
    await requestClose('confirm')
  }
}

function finishClose(wasOpen: boolean): void {
  removeDialogLayer(layerId)
  unbindKey()
  syncScrollLock()
  inertGeneration += 1
  releaseDialogInert(layerId)
  if (!wasOpen) return
  const reason = closeFromInside
  closeFromInside = null
  restoreTrigger()
  if (reason !== 'confirm') emit('cancel')
}

async function vetoParentClose(): Promise<void> {
  const generation = ++closeGeneration
  closing = true
  try {
    const allowed = await runRsConfirmBeforeClose(props.beforeClose, 'programmatic')
    if (disposed || generation !== closeGeneration) return
    if (!allowed) {
      open.value = true
      return
    }
    closeFromInside = 'programmatic'
    finishClose(true)
  } catch {
    if (!disposed && generation === closeGeneration) open.value = true
  } finally {
    if (generation === closeGeneration) closing = false
  }
}

async function onCancelClick(): Promise<void> {
  await requestClose('cancel')
}

watch(
  open,
  (isOpen, wasOpen) => {
    if (isOpen) {
      if (wasOpen !== true) {
        rememberTrigger()
        syncChrome()
        pushDialogLayer(layerId)
        queueFocus()
      }
      bindKey()
      syncScrollLock()
      void syncInert()
      return
    }
    if (wasOpen === true && closeFromInside == null) {
      void vetoParentClose()
      return
    }
    finishClose(wasOpen === true)
  },
  { immediate: true },
)

watch(
  () => [props.lockScroll, dialogLayerTick.value] as const,
  () => {
    if (!open.value || disposed) return
    syncScrollLock()
    void syncInert()
  },
)

onBeforeUnmount(() => {
  disposed = true
  inertGeneration += 1
  closeGeneration += 1
  removeDialogLayer(layerId)
  unbindKey()
  releaseScroll?.()
  releaseScroll = null
  releaseDialogInert(layerId)
})

defineExpose({
  close: (reason: RsConfirmCloseReason = 'programmatic') => requestClose(reason),
  focus,
})
</script>

<template>
  <span ref="anchorRef" hidden class="rs-confirm-dialog__anchor" aria-hidden="true" />
  <Teleport v-if="open" defer :to="teleportTarget" :disabled="teleportDisabled">
    <div
      ref="shellRef"
      class="rs-confirm-dialog"
      :data-rs-theme="panelTheme"
      :dir="panelDir"
      :lang="panelLang"
    >
      <div
        class="rs-confirm-dialog__backdrop"
        :class="{ 'rs-confirm-dialog__overlay': showOverlay }"
        :style="overlayStyle"
        aria-hidden="true"
      />
      <dialog
        :id="domId"
        ref="contentRef"
        open
        class="rs-confirm-dialog__content"
        :class="contentClass"
        :style="contentStyle"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="labelledBy"
        :aria-label="accessibleName"
        :aria-describedby="hasDescribedBy ? descriptionDomId : undefined"
        tabindex="-1"
      >
        <div class="rs-confirm-dialog__icon" :class="`rs-confirm-dialog__icon--${tone}`" aria-hidden="true">
          <slot name="icon">
            <component :is="icon" v-if="icon" class="rs-confirm-dialog__icon-glyph" />
            <template v-else>!</template>
          </slot>
        </div>
        <div class="rs-confirm-dialog__main">
          <h2 :id="titleDomId" class="rs-confirm-dialog__title">
            {{ title ?? t('confirm.title') }}
          </h2>
          <p v-if="subtitle && descriptionText != null" class="rs-confirm-dialog__subtitle">
            {{ subtitle }}
          </p>
          <p
            v-if="descriptionText != null"
            :id="descriptionDomId"
            class="rs-confirm-dialog__description"
          >
            {{ descriptionText }}
          </p>
          <p
            v-else-if="subtitle"
            :id="descriptionDomId"
            class="rs-confirm-dialog__subtitle"
          >
            {{ subtitle }}
          </p>
          <p
            v-else-if="showDefaultDescription"
            :id="descriptionDomId"
            class="rs-confirm-dialog__description"
          >
            {{ t('confirm.description') }}
          </p>
          <div v-if="$slots.extra" class="rs-confirm-dialog__extra">
            <slot name="extra" />
          </div>
          <footer class="rs-confirm-dialog__footer">
            <RsButton
              v-if="showCancel"
              variant="default"
              :disabled="confirmLoading"
              @click="onCancelClick"
            >
              {{ cancelText ?? t('common.cancel') }}
            </RsButton>
            <RsButton
              :variant="confirmVariant"
              :loading="confirmLoading"
              :disabled="confirmLoading"
              @click="onConfirmClick"
            >
              {{ confirmText ?? t('common.confirm') }}
            </RsButton>
          </footer>
        </div>
      </dialog>
    </div>
  </Teleport>
</template>

<style scoped>
.rs-confirm-dialog {
  display: contents;
}
.rs-confirm-dialog__anchor {
  display: none;
}
.rs-confirm-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--rs-z-modal);
  background: transparent;
}
.rs-confirm-dialog__overlay {
  background: var(--rs-dialog-overlay-bg);
  backdrop-filter: blur(var(--rs-dialog-overlay-blur)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--rs-dialog-overlay-blur)) saturate(120%);
}
.rs-confirm-dialog__content {
  position: fixed;
  left: 50%;
  top: calc(
    var(--rs-dialog-inset-top, 1rem) +
      (100vh - var(--rs-dialog-inset-top, 1rem) - var(--rs-dialog-inset-bottom, 1rem)) / 2
  );
  z-index: calc(var(--rs-z-modal) + 1);
  display: flex;
  gap: var(--rs-space-lg);
  width: calc(100vw - 2 * var(--rs-dialog-inset-x, 1rem));
  max-width: 28rem;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  margin: 0;
  padding: var(--rs-space-xl);
  border: 1px solid var(--rs-dialog-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-dialog-body-bg);
  color: var(--rs-dialog-title-fg);
  box-shadow: var(--rs-dialog-shadow);
  outline: none;
}
.rs-confirm-dialog__content:focus-visible {
  box-shadow:
    var(--rs-dialog-shadow),
    0 0 0 var(--rs-focus-ring-width) var(--rs-focus-ring);
}
.rs-confirm-dialog__content--sm {
  max-width: 24rem;
}
.rs-confirm-dialog__content--md {
  max-width: 32rem;
}
.rs-confirm-dialog__content--lg {
  max-width: 42rem;
}
[data-rs-theme='light'] .rs-confirm-dialog__content {
  background: color-mix(in srgb, var(--rs-dialog-bg) 94%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
.rs-confirm-dialog__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: var(--rs-radius);
  font-weight: var(--rs-font-weight-bold);
}
.rs-confirm-dialog__icon-glyph {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
}
.rs-confirm-dialog__icon--danger {
  background: var(--rs-danger-container);
  color: var(--rs-on-danger-container);
}
.rs-confirm-dialog__icon--warning {
  background: var(--rs-warning-container);
  color: var(--rs-on-warning-container);
}
.rs-confirm-dialog__icon--success {
  background: var(--rs-success-container);
  color: var(--rs-on-success-container);
}
.rs-confirm-dialog__icon--info,
.rs-confirm-dialog__icon--default {
  background: var(--rs-info-container);
  color: var(--rs-on-info-container);
}
.rs-confirm-dialog__main {
  min-width: 0;
  flex: 1;
}
.rs-confirm-dialog__title {
  margin: 0;
  font-size: var(--rs-font-size-base);
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: -0.01em;
  color: var(--rs-dialog-title-fg);
}
.rs-confirm-dialog__subtitle {
  margin: var(--rs-space-xs) 0 0;
  color: var(--rs-dialog-description-fg);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  opacity: 0.85;
}
.rs-confirm-dialog__description {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-dialog-description-fg);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.rs-confirm-dialog__extra {
  margin-top: var(--rs-space-md);
  min-width: 0;
}
.rs-confirm-dialog__footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  min-height: var(--rs-dialog-footer-min-height);
  margin-top: var(--rs-space-xl);
  padding-top: var(--rs-dialog-footer-padding-y);
  border-block-start: 1px solid color-mix(in srgb, var(--rs-dialog-separator) 72%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  [data-rs-theme='light'] .rs-confirm-dialog__content {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--rs-dialog-bg);
  }
  .rs-confirm-dialog__overlay {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>
