<script setup lang="ts">
import { computed } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsFeedbackTone } from './overlay-utils'
import RsIcon from './RsIcon.vue'

const props = withDefaults(
  defineProps<{
    type?: RsFeedbackTone
    title?: string
    closable?: boolean
    bordered?: boolean
  }>(),
  {
    type: 'info',
    closable: false,
    bordered: true,
  },
)

const emit = defineEmits<{
  close: [event: MouseEvent]
}>()

const { t } = useRsI18n()

const iconName = computed(() => {
  switch (props.type) {
    case 'success':
      return 'circle-check'
    case 'warning':
      return 'triangle-alert'
    case 'danger':
      return 'circle-alert'
    case 'default':
      return 'info'
    default:
      return 'info'
  }
})

const rootClass = computed(() => [
  'rs-alert',
  `rs-alert--${props.type}`,
  {
    'rs-alert--bordered': props.bordered,
    'rs-alert--closable': props.closable,
  },
])

function onClose(event: MouseEvent): void {
  emit('close', event)
}
</script>

<template>
  <div :class="rootClass" role="alert">
    <span class="rs-alert__icon" aria-hidden="true">
      <slot name="icon">
        <RsIcon :name="iconName" :size="16" />
      </slot>
    </span>
    <div class="rs-alert__body">
      <div v-if="title || $slots.title" class="rs-alert__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.default" class="rs-alert__content">
        <slot />
      </div>
    </div>
    <button
      v-if="closable"
      type="button"
      class="rs-alert__close"
      :aria-label="t('alert.close')"
      @click="onClose"
    >
      <RsIcon name="x" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.rs-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--rs-alert-gap, var(--rs-space-sm));
  padding: var(--rs-alert-padding-y, var(--rs-space-md))
    var(--rs-alert-padding-x, var(--rs-space-lg));
  border-radius: var(--rs-alert-radius, var(--rs-radius));
  box-sizing: border-box;
}

.rs-alert--bordered {
  border: 1px solid transparent;
}

.rs-alert__icon {
  display: inline-flex;
  flex-shrink: 0;
  margin-top: 0.125rem;
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

.rs-alert__content {
  margin-top: var(--rs-space-xs);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-alert-content-fg, var(--rs-muted));
}

.rs-alert__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0.125rem;
  border: 0;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  outline: none;
}

.rs-alert__close:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.rs-alert__close:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-alert--default {
  background: var(--rs-surface-hover);
  color: var(--rs-text);
  border-color: var(--rs-border);
}

.rs-alert--default .rs-alert__content {
  color: var(--rs-alert-content-fg, var(--rs-muted));
}

.rs-alert--info {
  background: var(--rs-info-container);
  color: var(--rs-on-info-container);
  border-color: color-mix(
    in srgb,
    var(--rs-info) var(--rs-alert-border-alpha, 35%),
    transparent
  );
}

.rs-alert--info .rs-alert__content {
  color: color-mix(in srgb, var(--rs-on-info-container) 78%, transparent);
}

.rs-alert--success {
  background: var(--rs-success-container);
  color: var(--rs-on-success-container);
  border-color: color-mix(
    in srgb,
    var(--rs-success) var(--rs-alert-border-alpha, 35%),
    transparent
  );
}

.rs-alert--success .rs-alert__content {
  color: color-mix(in srgb, var(--rs-on-success-container) 78%, transparent);
}

.rs-alert--warning {
  background: var(--rs-warning-container);
  color: var(--rs-on-warning-container);
  border-color: color-mix(
    in srgb,
    var(--rs-warning) var(--rs-alert-border-alpha, 35%),
    transparent
  );
}

.rs-alert--warning .rs-alert__content {
  color: color-mix(in srgb, var(--rs-on-warning-container) 78%, transparent);
}

.rs-alert--danger {
  background: var(--rs-danger-container);
  color: var(--rs-on-danger-container);
  border-color: color-mix(
    in srgb,
    var(--rs-danger) var(--rs-alert-border-alpha, 35%),
    transparent
  );
}

.rs-alert--danger .rs-alert__content {
  color: color-mix(in srgb, var(--rs-on-danger-container) 78%, transparent);
}
</style>
