<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, useSlots, watch } from 'vue'
import type { RsComponentSize, RsRadius } from '../../../theme/types'
import { RS_COMPONENT_SIZE_ICON_PX } from '../../../theme/types'
import {
  placeRsButtonTip,
  resolveRsButtonTone,
  resolveRsButtonVariant,
  type RsButtonTone,
  type RsButtonVariant,
} from './button-utils'

defineOptions({ name: 'RsButton' })
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import RsIcon from '../../icon/src/RsIcon.vue'

export type { RsButtonTone, RsButtonVariant } from './button-utils'

const props = withDefaults(
  defineProps<{
    variant?: RsButtonVariant
    /**
     * 语义色，与 variant 正交（Ant color / Element type）。
     * 例：variant="default" tone="warning" → 描边 + 浅底警告色。
     * 未传时：primary/link 为 primary，danger 变体为 danger，其余 neutral。
     */
    tone?: RsButtonTone
    size?: RsComponentSize
    /** 圆角档位；默认 full（胶囊）。直角 UI 传 `none`。 */
    radius?: RsRadius
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    /** 是否绘制外边框。未传为 false，与 2.0.3 之前一致。 */
    bordered?: boolean
    /** 前缀图标（Lucide kebab-case 名称） */
    icon?: string
    iconSize?: number
    /** 仅显示图标，文字通过 tooltip / slot 悬浮展示 */
    iconOnly?: boolean
    /**
     * 悬浮提示。Teleport 到 `document.body`，避免被 overflow 裁切。
     * 仅图标时作可视提示；可访问名称走 `aria-label`，避免读两遍。
     */
    tooltip?: string
    /** icon-only 时无障碍标签（与 tooltip 二选一，避免与外部 RsTooltip 重复） */
    ariaLabel?: string
    /** 默认收起文字，悬浮时展开（需配合 slot 文案） */
    revealLabel?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
    loading: false,
    iconOnly: false,
    revealLabel: false,
    bordered: false,
  },
)

const slots = useSlots()
const btnRef = ref<HTMLButtonElement | null>(null)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'full')
const resolvedIconSize = computed(
  () => props.iconSize ?? RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value],
)
const rootStyle = computed(() => ({
  '--rs-btn-radius': rsRadiusCss(resolvedRadius.value),
}))

const hasLabel = computed(() => Boolean(slots.default))

const resolvedVariant = computed(() => resolveRsButtonVariant(props.variant ?? 'primary'))

const resolvedBordered = computed(() => props.bordered)

/** 形态 × 色相：所有变体都带 tone class，由 CSS 决定如何上色。 */
const resolvedTone = computed(() => resolveRsButtonTone(props.variant ?? 'primary', props.tone))

const rootClass = computed(() => ({
  [`rs-btn--${resolvedVariant.value}`]: true,
  [`rs-btn--${resolvedSize.value}`]: true,
  [`rs-btn--tone-${resolvedTone.value}`]: Boolean(resolvedTone.value),
  'rs-btn--icon-only': props.iconOnly,
  'rs-btn--borderless': !resolvedBordered.value,
  'rs-btn--reveal-label': props.revealLabel && props.icon && hasLabel.value,
  'rs-btn--loading': props.loading,
}))

/** 仅在有 tooltip 文案或 icon-only 默认插槽文案时展示内置悬浮层 */
const showFloatingText = computed(
  () => Boolean(props.tooltip) || (props.iconOnly && hasLabel.value),
)

const ariaLabel = computed(() => {
  if (!props.iconOnly) return undefined
  return props.ariaLabel || props.tooltip || undefined
})

/** 避免路过按钮时闪一下 */
const TOOLTIP_DELAY_MS = 300

const tipId = useId()
const tipRef = ref<HTMLElement | null>(null)
const tipOpen = ref(false)
const tipStyle = ref<Record<string, string>>({})

let openTimer: ReturnType<typeof setTimeout> | null = null
let posRaf = 0

/** 有可见文案时 tip 是补充说明；仅图标时名称已在 aria-label，不再 describedby（避免读两遍） */
const tipDescribedBy = computed(() =>
  tipOpen.value && showFloatingText.value && !props.iconOnly ? tipId : undefined,
)

function clearOpenTimer(): void {
  if (openTimer == null) return
  clearTimeout(openTimer)
  openTimer = null
}

function updateTipPosition(): void {
  const el = btnRef.value
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  const tip = tipRef.value?.getBoundingClientRect()
  const box = placeRsButtonTip(
    { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    { width: tip?.width ?? 96, height: tip?.height ?? 28 },
    { width: window.innerWidth, height: window.innerHeight },
  )
  tipStyle.value = {
    top: `${box.top}px`,
    left: `${box.left}px`,
  }
}

function scheduleTipPosition(): void {
  if (typeof window === 'undefined' || posRaf) return
  posRaf = window.requestAnimationFrame(() => {
    posRaf = 0
    if (tipOpen.value) updateTipPosition()
  })
}

function onDocKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || !tipOpen.value) return
  e.preventDefault()
  e.stopPropagation()
  closeTip()
}

function bindTipFollow(on: boolean): void {
  if (typeof window === 'undefined') return
  if (on) {
    window.addEventListener('scroll', scheduleTipPosition, true)
    window.addEventListener('resize', scheduleTipPosition)
    window.addEventListener('keydown', onDocKeydown, true)
  } else {
    window.removeEventListener('scroll', scheduleTipPosition, true)
    window.removeEventListener('resize', scheduleTipPosition)
    window.removeEventListener('keydown', onDocKeydown, true)
    if (posRaf) {
      window.cancelAnimationFrame(posRaf)
      posRaf = 0
    }
  }
}

function openTipNow(): void {
  if (!showFloatingText.value || props.disabled || props.loading) return
  if (!tipOpen.value) {
    tipOpen.value = true
    bindTipFollow(true)
  }
  void nextTick(() => updateTipPosition())
}

function onActivate(event: Event): void {
  if (!props.loading) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

function scheduleOpenTip(): void {
  if (!showFloatingText.value || props.disabled || props.loading) return
  clearOpenTimer()
  openTimer = setTimeout(() => {
    openTimer = null
    openTipNow()
  }, TOOLTIP_DELAY_MS)
}

function closeTip(): void {
  clearOpenTimer()
  if (!tipOpen.value) return
  tipOpen.value = false
  bindTipFollow(false)
}

function onFocus(e: FocusEvent): void {
  const el = e.currentTarget
  if (!(el instanceof HTMLElement)) return
  if (el.matches(':focus-visible')) scheduleOpenTip()
}

watch(
  () => props.disabled || props.loading,
  (off) => {
    if (off) closeTip()
  },
)

watch(
  () => props.loading,
  async (loading) => {
    const el = btnRef.value
    if (!el) return
    if (loading) {
      await nextTick()
      if (!btnRef.value) return
      const w = btnRef.value.offsetWidth
      if (w > 0) btnRef.value.style.minWidth = `${w}px`
    } else {
      el.style.minWidth = ''
    }
  },
)

onUnmounted(() => {
  closeTip()
})
</script>

<template>
  <button
    ref="btnRef"
    :type="type"
    :disabled="disabled"
    class="rs-btn"
    :class="rootClass"
    :style="rootStyle"
    :aria-busy="loading || undefined"
    :aria-disabled="disabled || loading || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="tipDescribedBy"
    @click.capture="onActivate"
    @mouseenter="scheduleOpenTip"
    @mouseleave="closeTip"
    @focus="onFocus"
    @blur="closeTip"
  >
    <span v-if="loading" class="rs-btn__spinner" aria-hidden="true">
      <span class="rs-btn__spinner-ring" />
    </span>
    <RsIcon
      v-if="icon && !loading"
      class="rs-btn__icon"
      :name="icon"
      :size="resolvedIconSize"
    />
    <span
      v-if="hasLabel && !iconOnly"
      class="rs-btn__label"
      :class="{ 'rs-btn__label--reveal': revealLabel && icon }"
    >
      <slot />
    </span>
    <Teleport v-if="showFloatingText" to="body">
      <span
        v-if="tipOpen"
        ref="tipRef"
        :id="tipId"
        class="rs-btn__tooltip"
        :style="tipStyle"
        role="tooltip"
      >
        <template v-if="tooltip">{{ tooltip }}</template>
        <slot v-else-if="iconOnly" />
      </span>
    </Teleport>
  </button>
</template>

<style scoped>
.rs-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--rs-space-sm);
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-lg);
  border-radius: var(--rs-btn-radius, var(--rs-radius-full));
  border: 1px solid transparent;
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--rs-transition-fast),
    border-color var(--rs-transition-fast),
    color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    padding var(--rs-transition-normal),
    gap var(--rs-transition-normal);
}
.rs-btn--ssm {
  min-height: var(--rs-control-height-ssm);
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  gap: var(--rs-space-xs);
}
.rs-btn--sm {
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
  gap: var(--rs-space-xs);
}
.rs-btn--lg {
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-xl);
  font-size: var(--rs-font-size-base);
}
.rs-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.rs-btn--loading {
  pointer-events: none;
  cursor: wait;
  transition: none;
}
/* loading 时不使用 disabled，避免部分浏览器暂停子元素 CSS 动画 */
.rs-btn--loading:disabled {
  opacity: 1;
  cursor: wait;
}
.rs-btn--loading.rs-btn--default {
  color: var(--rs-text);
  border-color: var(--rs-border);
  background: var(--rs-surface);
}
.rs-btn--loading.rs-btn--default:not(.rs-btn--tone-neutral) {
  color: var(--rs-btn-tone-on-container);
  border-color: color-mix(in srgb, var(--rs-btn-tone) 42%, var(--rs-border));
  background: var(--rs-btn-tone-container);
}
.rs-btn--loading.rs-btn--ghost,
.rs-btn--loading.rs-btn--text {
  color: var(--rs-btn-tone, var(--rs-text));
  background: var(--rs-surface-hover);
}
.rs-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
.rs-btn--icon-only {
  padding: 0;
  min-width: var(--rs-control-height-md);
}
.rs-btn--icon-only.rs-btn--ssm {
  min-width: var(--rs-control-height-ssm);
}
.rs-btn--icon-only.rs-btn--sm {
  min-width: var(--rs-control-height-sm);
}
.rs-btn--icon-only.rs-btn--lg {
  min-width: var(--rs-control-height-lg);
}
.rs-btn--primary {
  background: var(--rs-primary);
  color: var(--rs-primary-foreground);
  box-shadow: var(--rs-shadow-sm);
}
.rs-btn--primary:hover:not(:disabled) {
  background: var(--rs-primary-hover);
  box-shadow: var(--rs-shadow);
}
.rs-btn--primary:active:not(:disabled) {
  box-shadow: none;
}
.rs-btn--default {
  border: 1px solid var(--rs-btn-outline-border, var(--rs-border));
  background: var(--rs-btn-secondary-bg, var(--rs-surface-hover));
  color: var(--rs-text);
  box-shadow: none;
}
.rs-btn--default:hover:not(:disabled) {
  color: var(--rs-primary);
  border-color: var(--rs-primary);
  background: var(--rs-btn-secondary-bg-hover, var(--rs-primary-container));
}
.rs-btn--default:active:not(:disabled) {
  color: var(--rs-primary-hover);
  border-color: var(--rs-primary-hover);
  background: var(--rs-btn-secondary-bg-active, var(--rs-primary-container));
}
.rs-btn--ghost {
  background: transparent;
  border: 1px solid var(--rs-btn-outline-border, var(--rs-border));
  color: var(--rs-btn-tone, var(--rs-text));
}
.rs-btn--ghost:hover:not(:disabled) {
  background: var(--rs-surface-hover);
  border-color: var(--rs-btn-outline-border, var(--rs-border));
  color: var(--rs-btn-tone-hover, var(--rs-btn-tone, var(--rs-text)));
}
.rs-btn--ghost:active:not(:disabled) {
  background: color-mix(in srgb, var(--rs-btn-tone, var(--rs-text)) 12%, var(--rs-surface-hover));
}
.rs-btn--danger {
  background: var(--rs-danger-container);
  border-color: color-mix(in srgb, var(--rs-danger) 30%, transparent);
  color: var(--rs-on-danger-container);
}
.rs-btn--danger:hover:not(:disabled) {
  border-color: var(--rs-danger);
  background: color-mix(in srgb, var(--rs-danger) 20%, var(--rs-danger-container));
}

/* 行内链接：可下划线；色调由 tone 控制（默认 primary） */
.rs-btn--link {
  min-height: auto;
  padding: 0;
  border-color: transparent;
  border-radius: 0;
  background: transparent;
  color: var(--rs-btn-tone, var(--rs-primary));
  box-shadow: none;
  font-weight: var(--rs-font-weight-medium);
}
.rs-btn--link:hover:not(:disabled) {
  color: var(--rs-btn-tone-hover, var(--rs-primary-hover));
  text-decoration: underline;
}

/**
 * text：工具栏 / 表格操作 quaternary
 * 无底无边，靠 tone 着色；hover 使用同色浅底
 */
.rs-btn--text {
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  font-weight: var(--rs-font-weight-regular);
  color: var(--rs-btn-tone, var(--rs-text));
}
.rs-btn--text.rs-btn--ssm {
  min-height: var(--rs-control-height-ssm);
}
.rs-btn--text.rs-btn--md {
  min-height: var(--rs-control-height-md);
}
.rs-btn--text.rs-btn--lg {
  min-height: var(--rs-control-height-lg);
}
.rs-btn--text:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rs-btn-tone, var(--rs-text)) 8%, transparent);
  border-color: transparent;
  color: var(--rs-btn-tone-hover, var(--rs-btn-tone, var(--rs-text)));
}
.rs-btn--text:active:not(:disabled) {
  background: color-mix(in srgb, var(--rs-btn-tone, var(--rs-text)) 12%, transparent);
}

/* tone：色相 token，供所有变体消费（形态 × 色相） */
.rs-btn--tone-neutral {
  --rs-btn-tone: var(--rs-text);
  --rs-btn-tone-hover: var(--rs-text);
  --rs-btn-tone-fg: var(--rs-text);
  --rs-btn-tone-container: var(--rs-btn-secondary-bg, var(--rs-surface-hover));
  --rs-btn-tone-on-container: var(--rs-text);
}
.rs-btn--tone-primary {
  --rs-btn-tone: var(--rs-primary);
  --rs-btn-tone-hover: var(--rs-primary-hover);
  --rs-btn-tone-fg: var(--rs-primary-foreground);
  --rs-btn-tone-container: var(--rs-primary-container);
  --rs-btn-tone-on-container: var(--rs-on-primary-container);
}
.rs-btn--tone-danger {
  --rs-btn-tone: var(--rs-danger);
  --rs-btn-tone-hover: var(--rs-danger);
  --rs-btn-tone-fg: var(--rs-text-inverse);
  --rs-btn-tone-container: var(--rs-danger-container);
  --rs-btn-tone-on-container: var(--rs-on-danger-container);
}
.rs-btn--tone-success {
  --rs-btn-tone: var(--rs-success, #18a058);
  --rs-btn-tone-hover: var(--rs-success, #18a058);
  --rs-btn-tone-fg: var(--rs-text-inverse);
  --rs-btn-tone-container: var(--rs-success-container, color-mix(in srgb, var(--rs-success, #18a058) 14%, var(--rs-surface)));
  --rs-btn-tone-on-container: var(--rs-on-success-container, var(--rs-success, #18a058));
}
.rs-btn--tone-warning {
  --rs-btn-tone: var(--rs-warning, #f0a020);
  --rs-btn-tone-hover: var(--rs-warning, #f0a020);
  --rs-btn-tone-fg: var(--rs-text-inverse);
  --rs-btn-tone-container: var(--rs-warning-container, color-mix(in srgb, var(--rs-warning, #f0a020) 14%, var(--rs-surface)));
  --rs-btn-tone-on-container: var(--rs-on-warning-container, var(--rs-warning, #f0a020));
}
.rs-btn--tone-info {
  --rs-btn-tone: var(--rs-info, #2080f0);
  --rs-btn-tone-hover: var(--rs-info, #2080f0);
  --rs-btn-tone-fg: var(--rs-text-inverse);
  --rs-btn-tone-container: var(--rs-info-container, color-mix(in srgb, var(--rs-info, #2080f0) 14%, var(--rs-surface)));
  --rs-btn-tone-on-container: var(--rs-on-info-container, var(--rs-info, #2080f0));
}

/* default + 语义色：轮廓 + 浅底（Ant outlined / Element plain） */
.rs-btn--default:not(.rs-btn--tone-neutral) {
  color: var(--rs-btn-tone-on-container);
  border-color: color-mix(in srgb, var(--rs-btn-tone) 42%, var(--rs-border));
  background: var(--rs-btn-tone-container);
}
.rs-btn--default:not(.rs-btn--tone-neutral):hover:not(:disabled) {
  color: var(--rs-btn-tone);
  border-color: var(--rs-btn-tone);
  background: color-mix(in srgb, var(--rs-btn-tone) 14%, var(--rs-btn-tone-container));
}
.rs-btn--default:not(.rs-btn--tone-neutral):active:not(:disabled) {
  color: var(--rs-btn-tone-hover);
  border-color: var(--rs-btn-tone-hover);
  background: color-mix(in srgb, var(--rs-btn-tone) 20%, var(--rs-btn-tone-container));
}

/* primary + 非主色：实心语义色 */
.rs-btn--primary:not(.rs-btn--tone-primary) {
  background: var(--rs-btn-tone);
  color: var(--rs-btn-tone-fg);
  border-color: transparent;
}
.rs-btn--primary:not(.rs-btn--tone-primary):hover:not(:disabled) {
  background: var(--rs-btn-tone-hover);
}

/* ghost + 语义色：描边跟色相 */
.rs-btn--ghost:not(.rs-btn--tone-neutral) {
  border-color: color-mix(in srgb, var(--rs-btn-tone) 45%, var(--rs-border));
}
.rs-btn--ghost:not(.rs-btn--tone-neutral):hover:not(:disabled) {
  border-color: var(--rs-btn-tone);
  background: color-mix(in srgb, var(--rs-btn-tone) 14%, var(--rs-surface));
  color: var(--rs-btn-tone);
}

/* 未传 bordered 时压过上面各变体后写的 border-color */
.rs-btn.rs-btn--borderless,
.rs-btn.rs-btn--borderless:hover:not(:disabled),
.rs-btn.rs-btn--borderless:active:not(:disabled),
.rs-btn.rs-btn--borderless.rs-btn--loading {
  border-color: transparent;
}

.rs-btn__spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  pointer-events: none;
}
.rs-btn__spinner-ring {
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid color-mix(in srgb, var(--rs-primary) 28%, transparent);
  border-top-color: var(--rs-primary);
  border-radius: var(--rs-radius-full);
  transform-origin: center center;
  animation: rs-spin 0.75s linear infinite;
}
.rs-btn--default .rs-btn__spinner-ring,
.rs-btn--ghost .rs-btn__spinner-ring {
  border-color: color-mix(in srgb, var(--rs-btn-tone, var(--rs-primary)) 28%, transparent);
  border-top-color: var(--rs-btn-tone, var(--rs-primary));
}
.rs-btn--text .rs-btn__spinner-ring,
.rs-btn--link .rs-btn__spinner-ring {
  border-color: color-mix(in srgb, var(--rs-btn-tone, var(--rs-primary)) 28%, transparent);
  border-top-color: var(--rs-btn-tone, var(--rs-primary));
}
.rs-btn--primary .rs-btn__spinner-ring {
  border-color: color-mix(in srgb, currentcolor 35%, transparent);
  border-top-color: currentcolor;
}
.rs-btn--danger .rs-btn__spinner-ring {
  border-color: color-mix(in srgb, var(--rs-danger) 28%, transparent);
  border-top-color: var(--rs-danger);
}
.rs-btn__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: inherit;
}
/* 插槽内自定义图标+文案时也能水平对齐 */
.rs-btn__label {
  display: inline-flex;
  align-items: center;
  gap: inherit;
  min-width: 0;
  line-height: 1;
  white-space: nowrap;
}
.rs-btn__label--reveal {
  display: inline-block;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  vertical-align: bottom;
  transition:
    max-width 0.2s ease,
    opacity 0.15s ease;
}
.rs-btn--reveal-label:hover:not(:disabled) .rs-btn__label--reveal,
.rs-btn--reveal-label:focus-visible .rs-btn__label--reveal {
  max-width: 12rem;
  opacity: 1;
}
.rs-btn__tooltip {
  position: fixed;
  /* Portal 挂 body，必须高于 Dialog/Drawer（100/101），与 RsTooltip 同一档 */
  z-index: calc(var(--rs-z-modal) + 2);
  padding: 0.25rem 0.5rem;
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface-elevated);
  color: var(--rs-text);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  line-height: 1.25rem;
  white-space: nowrap;
  box-shadow: var(--rs-shadow-sm);
  pointer-events: none;
}
@keyframes rs-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-btn,
  .rs-btn__label--reveal {
    transition: none;
  }

  .rs-btn__spinner-ring {
    animation: none;
    border-top-color: transparent;
  }
}
</style>
