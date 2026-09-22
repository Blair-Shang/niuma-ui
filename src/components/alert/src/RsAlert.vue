<script setup lang="ts">
import { computed, ref, useId, useSlots } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  hasAlertDescription,
  hasAlertTitle,
  resolveAlertIcon,
  resolveAlertRole,
  resolveAlertSize,
  resolveAlertTone,
  resolveAlertVariant,
  shouldShowAlertIcon,
  type RsAlertExpose,
  type RsAlertTone,
  type RsAlertVariant,
} from './alert-utils'

defineOptions({ name: 'RsAlert' })

export type { RsAlertExpose, RsAlertTone, RsAlertVariant }

const props = withDefaults(
  defineProps<{
    /** 色相。与 type 同时传时以 tone 为准。 */
    tone?: RsAlertTone
    /** type 的兼容别名，语义与 tone 相同。 */
    type?: RsAlertTone
    variant?: RsAlertVariant
    title?: string
    description?: string
    closable?: boolean
    bordered?: boolean
    showIcon?: boolean
    banner?: boolean
    closeText?: string
    size?: RsComponentSize
    radius?: RsRadius
    id?: string
    ariaLabel?: string
  }>(),
  {
    closable: false,
    bordered: true,
    showIcon: true,
    banner: false,
  },
)

const emit = defineEmits<{
  close: [event: MouseEvent]
}>()

const { t } = useRsI18n()
const slots = useSlots()
const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)

const inheritedSize = useResolvedRsComponentSize(() => props.size)
const resolvedSize = computed(() => resolveAlertSize(inheritedSize.value))
const resolvedRadius = useResolvedRsRadius(() => (props.banner ? 'none' : props.radius), 'md')
const resolvedTone = computed(() => resolveAlertTone(props.tone, props.type))
const resolvedVariant = computed(() => resolveAlertVariant(props.variant))
const iconName = computed(() => resolveAlertIcon(resolvedTone.value))
const liveRole = computed(() => resolveAlertRole(resolvedTone.value))
const showIcon = computed(() => shouldShowAlertIcon(props.showIcon, Boolean(slots.icon)))
const showTitle = computed(() => hasAlertTitle(props.title, Boolean(slots.title)))
const showDescription = computed(() => hasAlertDescription(props.description, Boolean(slots.default)))
const iconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value === 'sm' ? 'sm' : resolvedSize.value])
const closeIconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value === 'lg' ? 'md' : 'ssm'])
const titleDomId = computed(() => (showTitle.value ? `${props.id || uid}-title` : undefined))
const descDomId = computed(() => (showDescription.value ? `${props.id || uid}-desc` : undefined))
const closeLabel = computed(() => props.closeText || t('alert.close'))

const rootClass = computed(() => [
  'rs-alert',
  `rs-alert--${resolvedTone.value}`,
  `rs-alert--${resolvedVariant.value}`,
  `rs-alert--${resolvedSize.value}`,
  {
    'rs-alert--bordered': props.bordered,
    'rs-alert--closable': props.closable,
    'rs-alert--banner': props.banner,
    'rs-alert--no-icon': !showIcon.value,
  },
])

const rootStyle = computed(() => ({
  '--rs-alert-radius': props.banner ? '0' : rsRadiusCss(resolvedRadius.value),
}))

function onClose(event: MouseEvent): void {
  emit('close', event)
}

function focus(): void {
  if (closeRef.value) {
    closeRef.value.focus()
    return
  }
  rootRef.value?.focus()
}

defineExpose<RsAlertExpose>({ focus })
</script>

<template>
  <div
    :id="id"
    ref="rootRef"
    :class="rootClass"
    :style="rootStyle"
    :role="liveRole"
    :aria-label="ariaLabel"
    :aria-labelledby="titleDomId"
    :aria-describedby="descDomId"
    :tabindex="closable ? undefined : -1"
  >
    <span v-if="showIcon" class="rs-alert__icon" aria-hidden="true">
      <slot name="icon">
        <RsIcon :name="iconName" :size="iconSize" />
      </slot>
    </span>
    <div class="rs-alert__body">
      <div v-if="showTitle" :id="titleDomId" class="rs-alert__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="showDescription" :id="descDomId" class="rs-alert__content">
        <slot>{{ description }}</slot>
      </div>
    </div>
    <div v-if="$slots.action" class="rs-alert__action">
      <slot name="action" />
    </div>
    <button
      v-if="closable"
      ref="closeRef"
      type="button"
      class="rs-alert__close"
      :class="{ 'rs-alert__close--text': Boolean(closeText || $slots.close) }"
      :aria-label="closeLabel"
      @click="onClose"
    >
      <slot name="close">
        <span v-if="closeText">{{ closeText }}</span>
        <RsIcon v-else name="x" :size="closeIconSize" />
      </slot>
    </button>
  </div>
</template>

<style scoped>
.rs-alert {
  --rs-alert-icon-offset: 0.125rem;
  --rs-alert-content-alpha: 78%;
  --rs-alert-close-opacity: 0.7;
  --rs-alert-tone: var(--rs-border);
  --rs-alert-tone-container: var(--rs-surface-hover);
  --rs-alert-on-container: var(--rs-text-primary);
  display: flex;
  align-items: flex-start;
  gap: var(--rs-alert-gap, var(--rs-space-sm));
  padding: var(--rs-alert-padding-y, var(--rs-space-md))
    var(--rs-alert-padding-x, var(--rs-space-lg));
  border-radius: var(--rs-alert-radius, var(--rs-radius));
  box-sizing: border-box;
  color: var(--rs-alert-on-container);
  outline: none;
}

.rs-alert--bordered {
  border: 1px solid transparent;
}

.rs-alert--sm {
  --rs-alert-padding-y: var(--rs-space-sm);
  --rs-alert-padding-x: var(--rs-space-md);
}

.rs-alert--lg {
  --rs-alert-padding-y: var(--rs-space-lg);
  --rs-alert-padding-x: var(--rs-space-lg);
}

.rs-alert--banner {
  width: 100%;
  border-radius: 0;
}

.rs-alert--soft {
  background: var(--rs-alert-tone-container);
  border-color: color-mix(
    in srgb,
    var(--rs-alert-tone) var(--rs-alert-border-alpha, 35%),
    transparent
  );
}

.rs-alert--outline {
  background: transparent;
  border-color: color-mix(in srgb, var(--rs-alert-tone) 55%, transparent);
}

.rs-alert--solid {
  background: var(--rs-alert-tone);
  color: var(--rs-text-inverse);
  border-color: var(--rs-alert-tone);
}

.rs-alert--default {
  --rs-alert-tone: var(--rs-border);
  --rs-alert-tone-container: var(--rs-surface-hover);
  --rs-alert-on-container: var(--rs-text-primary);
}

.rs-alert--info {
  --rs-alert-tone: var(--rs-info);
  --rs-alert-tone-container: var(--rs-info-container);
  --rs-alert-on-container: var(--rs-on-info-container);
}

.rs-alert--success {
  --rs-alert-tone: var(--rs-success);
  --rs-alert-tone-container: var(--rs-success-container);
  --rs-alert-on-container: var(--rs-on-success-container);
}

.rs-alert--warning {
  --rs-alert-tone: var(--rs-warning);
  --rs-alert-tone-container: var(--rs-warning-container);
  --rs-alert-on-container: var(--rs-on-warning-container);
}

.rs-alert--danger {
  --rs-alert-tone: var(--rs-danger);
  --rs-alert-tone-container: var(--rs-danger-container);
  --rs-alert-on-container: var(--rs-on-danger-container);
}

.rs-alert__icon {
  display: inline-flex;
  flex-shrink: 0;
  margin-block-start: var(--rs-alert-icon-offset);
}

.rs-alert__body {
  flex: 1 1 auto;
  min-width: 0;
}

.rs-alert__title {
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
  color: inherit;
}

.rs-alert--lg .rs-alert__title {
  font-size: var(--rs-font-size-base);
}

.rs-alert__content {
  margin-block-start: var(--rs-space-xs);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-alert-content-fg, var(--rs-text-secondary));
}

.rs-alert--default .rs-alert__content {
  color: var(--rs-alert-content-fg, var(--rs-text-secondary));
}

.rs-alert--info .rs-alert__content,
.rs-alert--success .rs-alert__content,
.rs-alert--warning .rs-alert__content,
.rs-alert--danger .rs-alert__content {
  color: color-mix(
    in srgb,
    var(--rs-alert-on-container) var(--rs-alert-content-alpha, 78%),
    transparent
  );
}

.rs-alert--solid .rs-alert__content {
  color: color-mix(in srgb, var(--rs-text-inverse) var(--rs-alert-content-alpha, 78%), transparent);
}

.rs-alert__action {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--rs-space-xs);
  margin-inline-start: auto;
}

.rs-alert__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: var(--rs-alert-icon-offset);
  border: 0;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: var(--rs-alert-close-opacity);
  outline: none;
  font: inherit;
  line-height: 1;
}

.rs-alert__close--text {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
}

.rs-alert__close:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.rs-alert__close:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .rs-alert__close {
    transition: none;
  }
}

@media (forced-colors: active) {
  .rs-alert {
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }

  .rs-alert__close:focus-visible {
    outline: 2px solid Highlight;
    box-shadow: none;
  }
}
</style>
