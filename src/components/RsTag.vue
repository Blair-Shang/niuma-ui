<script setup lang="ts">
import { computed } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize, RsRadius } from '../theme/types'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'
import { useResolvedRsComponentSize } from './resolve-size'
import RsIcon from './RsIcon.vue'

export type RsTagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const props = withDefaults(
  defineProps<{
    variant?: RsTagVariant
    closable?: boolean
    disabled?: boolean
    /** 胶囊圆角快捷开关；等价于 radius="full" */
    round?: boolean
    size?: RsComponentSize
    radius?: RsRadius
  }>(),
  {
    variant: 'default',
    closable: false,
    disabled: false,
    round: false,
  },
)

const emit = defineEmits<{
  close: [event: MouseEvent]
}>()

const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(
  () => (props.round ? 'full' : props.radius),
  'sm',
)

const rootClass = computed(() => [
  'rs-tag',
  `rs-tag--${props.variant}`,
  `rs-tag--${resolvedSize.value}`,
  {
    'rs-tag--closable': props.closable,
    'rs-tag--disabled': props.disabled,
    'rs-tag--round': props.round || resolvedRadius.value === 'full',
  },
])

const rootStyle = computed(() => ({
  '--rs-tag-radius': rsRadiusCss(resolvedRadius.value),
}))

function onClose(event: MouseEvent): void {
  if (props.disabled) return
  event.stopPropagation()
  emit('close', event)
}
</script>

<template>
  <span :class="rootClass" :style="rootStyle">
    <span class="rs-tag__content">
      <slot />
    </span>
    <button
      v-if="closable"
      type="button"
      class="rs-tag__close"
      :disabled="disabled"
      :aria-label="t('tag.close')"
      @click="onClose"
    >
      <RsIcon name="x" :size="12" />
    </button>
  </span>
</template>

<style scoped>
.rs-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  max-width: 100%;
  border-radius: var(--rs-tag-radius, var(--rs-radius-sm));
  font-weight: var(--rs-tag-font-weight, 400);
  line-height: var(--rs-line-height-tight);
  box-sizing: border-box;
  vertical-align: middle;
}

.rs-tag--ssm {
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-tag--sm {
  padding: 0.0625rem var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-tag--md {
  padding: 0.125rem var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tag--lg {
  padding: var(--rs-space-xs) var(--rs-space-sm);
  font-size: var(--rs-font-size-sm);
}

.rs-tag--round {
  border-radius: var(--rs-radius-full);
}

.rs-tag--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rs-tag__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--rs-radius-full);
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.75;
  outline: none;
}

.rs-tag__close:hover:not(:disabled) {
  opacity: 1;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.rs-tag__close:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tag__close:disabled {
  cursor: not-allowed;
}

.rs-tag--default {
  background: var(--rs-surface-hover);
  color: var(--rs-text);
  border: 1px solid var(--rs-border);
}

.rs-tag--primary {
  background: var(--rs-primary-container);
  color: var(--rs-on-primary-container);
  border: 1px solid color-mix(in srgb, var(--rs-primary) var(--rs-tag-border-alpha, 40%), transparent);
}

.rs-tag--success {
  background: var(--rs-success-container);
  color: var(--rs-on-success-container);
  border: 1px solid color-mix(in srgb, var(--rs-success) var(--rs-tag-border-alpha, 40%), transparent);
}

.rs-tag--warning {
  background: var(--rs-warning-container);
  color: var(--rs-on-warning-container);
  border: 1px solid color-mix(in srgb, var(--rs-warning) var(--rs-tag-border-alpha, 40%), transparent);
}

.rs-tag--danger {
  background: var(--rs-danger-container);
  color: var(--rs-on-danger-container);
  border: 1px solid color-mix(in srgb, var(--rs-danger) var(--rs-tag-border-alpha, 40%), transparent);
}

.rs-tag--info {
  background: var(--rs-info-container);
  color: var(--rs-on-info-container);
  border: 1px solid color-mix(in srgb, var(--rs-info) var(--rs-tag-border-alpha, 40%), transparent);
}
</style>
