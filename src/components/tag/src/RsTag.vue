<script setup lang="ts">
import { computed } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import RsButton from '../../button/src/RsButton.vue'
import type { RsTagVariant } from './tag-utils'

defineOptions({ name: 'RsTag' })

export type { RsTagVariant }

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
const closeIconSize = RS_COMPONENT_SIZE_ICON_PX.ssm

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
    <RsButton
      v-if="closable"
      class="rs-tag__close"
      variant="text"
      :bordered="false"
      size="ssm"
      radius="full"
      icon="x"
      :icon-size="closeIconSize"
      icon-only
      :disabled="disabled"
      :aria-label="t('tag.close')"
      @click="onClose"
    />
  </span>
</template>

<style scoped>
.rs-tag {
  --rs-tag-pad-y-sm: 0.0625rem;
  --rs-tag-pad-y-md: 0.125rem;
  --rs-tag-disabled-opacity: 0.55;
  --rs-tag-close-opacity: 0.75;
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
  padding-block: 0;
  padding-inline: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-tag--sm {
  padding-block: var(--rs-tag-pad-y-sm);
  padding-inline: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-tag--md {
  padding-block: var(--rs-tag-pad-y-md);
  padding-inline: var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tag--lg {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  font-size: var(--rs-font-size-sm);
}

.rs-tag--round {
  border-radius: var(--rs-radius-full);
}

.rs-tag--disabled {
  opacity: var(--rs-tag-disabled-opacity);
  cursor: not-allowed;
}

.rs-tag__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-tag__close {
  min-width: 0;
  min-height: 0;
  width: 1em;
  height: 1em;
  padding: 0;
  color: inherit;
  opacity: var(--rs-tag-close-opacity);
}

.rs-tag__close:hover:not(:disabled) {
  opacity: 1;
  color: inherit;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.rs-tag--default {
  background: var(--rs-surface-hover);
  color: var(--rs-text-primary);
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

@media (forced-colors: active) {
  .rs-tag {
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }
}
</style>
