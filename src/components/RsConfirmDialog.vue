<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from './reka'
import RsButton from './RsButton.vue'
import { useRsI18n } from '../composables/useRsI18n'
import {
  isRsDialogWidthPreset,
  resolveDialogOverlayStyle,
  resolveRsDialogCssWidth,
  runRsConfirmBeforeClose,
  type RsConfirmBeforeClose,
  type RsConfirmCloseReason,
  type RsDialogWidth,
} from './dialog-utils'
import type { RsFeedbackTone } from './overlay-utils'

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
    /** AlertDialogPortal 挂载目标；false 禁用 Teleport */
    teleportTo?: string | HTMLElement | false
  }>(),
  {
    tone: 'danger',
    confirmVariant: 'danger',
    showCancel: true,
    confirmLoading: false,
    autoCloseOnConfirm: true,
    showOverlay: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useRsI18n()

const contentClass = computed(() => {
  if (props.width && isRsDialogWidthPreset(props.width)) {
    return `rs-confirm-dialog__content--${props.width}`
  }
  return undefined
})

const overlayStyle = computed(() =>
  resolveDialogOverlayStyle({
    overlayOpacity: props.overlayOpacity,
    overlayBlur: props.overlayBlur,
  }),
)

const contentStyle = computed(() => {
  if (props.width == null || isRsDialogWidthPreset(props.width)) return undefined
  const css = resolveRsDialogCssWidth(props.width)
  if (!css) return undefined
  return { maxWidth: css }
})

const descriptionText = computed(() => {
  if (props.description != null && props.description !== '') return props.description
  return undefined
})

const showDefaultDescription = computed(
  () => descriptionText.value == null && !props.subtitle,
)

let closing = false
let pendingCloseReason: RsConfirmCloseReason = 'programmatic'

async function requestClose(reason: RsConfirmCloseReason): Promise<boolean> {
  if (!open.value || closing) return false
  closing = true
  try {
    const allowed = await runRsConfirmBeforeClose(props.beforeClose, reason)
    if (!allowed) return false
    open.value = false
    return true
  } finally {
    closing = false
  }
}

async function onConfirmClick(): Promise<void> {
  emit('confirm')
  if (props.autoCloseOnConfirm !== false) {
    await requestClose('confirm')
  }
}

async function onCancelClick(): Promise<void> {
  const closed = await requestClose('cancel')
  if (closed) emit('cancel')
}

function onEscapeKeyDown(event: Event): void {
  if (props.confirmLoading) {
    event.preventDefault()
    return
  }
  pendingCloseReason = 'escape'
}

async function onUpdateOpen(next: boolean): Promise<void> {
  if (next) {
    open.value = true
    return
  }
  // requestClose 已处理 beforeClose；此处承接 Esc 等 Root 发起的关闭
  if (closing) {
    open.value = false
    return
  }
  const reason = pendingCloseReason
  pendingCloseReason = 'programmatic'
  const allowed = await runRsConfirmBeforeClose(props.beforeClose, reason)
  if (!allowed) {
    open.value = true
    return
  }
  open.value = false
  if (reason === 'escape' || reason === 'programmatic') {
    emit('cancel')
  }
}

defineExpose({
  /** 请求关闭（走 beforeClose） */
  close: (reason: RsConfirmCloseReason = 'programmatic') => requestClose(reason),
})
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="onUpdateOpen">
    <AlertDialogPortal
      :disabled="teleportTo === false"
      :to="teleportTo === false ? undefined : teleportTo"
    >
      <AlertDialogOverlay v-if="showOverlay" class="rs-confirm-dialog__overlay" :style="overlayStyle" />
      <AlertDialogContent
        class="rs-confirm-dialog__content"
        :class="contentClass"
        :style="contentStyle"
        :disable-outside-pointer-events="true"
        @escape-key-down="onEscapeKeyDown"
      >
        <div class="rs-confirm-dialog__icon" :class="`rs-confirm-dialog__icon--${tone}`">
          <slot name="icon">
            <component :is="icon" v-if="icon" class="rs-confirm-dialog__icon-glyph" />
            <template v-else>!</template>
          </slot>
        </div>
        <div class="rs-confirm-dialog__main">
          <AlertDialogTitle class="rs-confirm-dialog__title">
            {{ title ?? t('confirm.title') }}
          </AlertDialogTitle>
          <p
            v-if="subtitle && descriptionText != null"
            class="rs-confirm-dialog__subtitle"
          >
            {{ subtitle }}
          </p>
          <AlertDialogDescription
            v-if="descriptionText != null"
            class="rs-confirm-dialog__description"
          >
            {{ descriptionText }}
          </AlertDialogDescription>
          <AlertDialogDescription
            v-else-if="subtitle"
            class="rs-confirm-dialog__subtitle"
          >
            {{ subtitle }}
          </AlertDialogDescription>
          <AlertDialogDescription
            v-else-if="showDefaultDescription"
            class="rs-confirm-dialog__description"
          >
            {{ t('confirm.description') }}
          </AlertDialogDescription>
          <div v-if="$slots.extra" class="rs-confirm-dialog__extra">
            <slot name="extra" />
          </div>
          <footer class="rs-confirm-dialog__footer">
            <!-- 不用 AlertDialogCancel/Action：关闭统一走 beforeClose / autoCloseOnConfirm -->
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
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style>
.rs-confirm-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--rs-z-modal);
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
  padding: var(--rs-space-xl);
  border: 1px solid var(--rs-dialog-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-dialog-body-bg);
  color: var(--rs-dialog-title-fg);
  box-shadow: var(--rs-dialog-shadow);
  outline: none;
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
  font-weight: 700;
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
  font-weight: 600;
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
  word-break: break-word;
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
  border-top: 1px solid color-mix(in srgb, var(--rs-dialog-separator) 72%, transparent);
}
</style>
