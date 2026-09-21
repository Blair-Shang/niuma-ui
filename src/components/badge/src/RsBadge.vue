<script setup lang="ts">
import { computed, useSlots } from 'vue'
import {
  formatRsBadgeCount,
  resolveRsBadgeVariant,
  type RsBadgeVariant,
} from './badge-utils'

defineOptions({ name: 'RsBadge' })

export type { RsBadgeVariant }

const props = withDefaults(
  defineProps<{
    variant?: RsBadgeVariant
    /** 角标数字。与默认插槽同时出现时，插槽是宿主，数字挂在角上。 */
    count?: number
    /** 超过后显示 `{max}+`。 */
    max?: number
    /** 小圆点，不计数字。与 count 同时出现时只显示点。 */
    dot?: boolean
    /** count 为 0 时仍显示。 */
    showZero?: boolean
  }>(),
  {
    variant: 'default',
    count: undefined,
    max: 99,
    dot: false,
    showZero: false,
  },
)

const slots = useSlots()
const resolvedVariant = computed(() => resolveRsBadgeVariant(props.variant))
const variantClass = computed(() => `rs-badge--${resolvedVariant.value}`)
const isMarkMode = computed(() => props.dot || props.count !== undefined)
const countText = computed(() => formatRsBadgeCount(props.count, props.max, props.showZero))
const showMark = computed(() => props.dot || countText.value != null)
const hasHost = computed(() => Boolean(slots.default))
const overlay = computed(() => isMarkMode.value && hasHost.value)
const markLabel = computed(() => (props.dot ? undefined : (countText.value ?? undefined)))
</script>

<template>
  <span v-if="overlay" class="rs-badge-wrap">
    <slot />
    <span
      v-if="showMark"
      class="rs-badge rs-badge--mark"
      :class="[variantClass, { 'rs-badge--dot': dot }]"
      :aria-hidden="dot ? 'true' : undefined"
      :aria-label="markLabel"
    >{{ dot ? '' : countText }}</span>
  </span>
  <span
    v-else-if="showMark"
    class="rs-badge rs-badge--mark"
    :class="[variantClass, { 'rs-badge--dot': dot }]"
    :aria-hidden="dot ? 'true' : undefined"
    :aria-label="markLabel"
  >{{ dot ? '' : countText }}</span>
  <span v-else-if="!isMarkMode" class="rs-badge" :class="variantClass">
    <slot />
  </span>
</template>

<style scoped>
.rs-badge {
  --rs-badge-padding-y: 0.125rem;
  --rs-badge-padding-x: 0.625rem;
  --rs-badge-dot-size: var(--rs-space-sm);
  --rs-badge-count-min: 1.125rem;
  --rs-badge-ring: var(--rs-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: var(--rs-badge-padding-y) var(--rs-badge-padding-x);
  border-radius: var(--rs-radius-full);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  line-height: var(--rs-line-height-tight);
  letter-spacing: 0.02em;
  white-space: nowrap;
  vertical-align: middle;
}
.rs-badge-wrap {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.rs-badge-wrap .rs-badge--mark {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  z-index: 1;
  transform: translate(50%, -50%);
  box-shadow: 0 0 0 2px var(--rs-badge-ring);
}
:dir(rtl) .rs-badge-wrap .rs-badge--mark {
  transform: translate(-50%, -50%);
}
.rs-badge--mark:not(.rs-badge--dot) {
  min-width: var(--rs-badge-count-min);
  min-height: var(--rs-badge-count-min);
  padding: 0 0.375rem;
  letter-spacing: 0;
  line-height: 1;
}
.rs-badge--dot {
  width: var(--rs-badge-dot-size);
  height: var(--rs-badge-dot-size);
  min-width: var(--rs-badge-dot-size);
  padding: 0;
  border-radius: var(--rs-radius-full);
}
.rs-badge--default {
  background: var(--rs-surface-hover);
  color: var(--rs-text);
  border: 1px solid var(--rs-border);
}
.rs-badge--primary {
  background: var(--rs-primary-container);
  color: var(--rs-on-primary-container);
  border: 1px solid color-mix(in srgb, var(--rs-primary) 40%, transparent);
}
.rs-badge--success {
  background: var(--rs-success-container);
  color: var(--rs-on-success-container);
  border: 1px solid color-mix(in srgb, var(--rs-success) 40%, transparent);
}
.rs-badge--warning {
  background: var(--rs-warning-container);
  color: var(--rs-on-warning-container);
  border: 1px solid color-mix(in srgb, var(--rs-warning) 40%, transparent);
}
.rs-badge--danger {
  background: var(--rs-danger-container);
  color: var(--rs-on-danger-container);
  border: 1px solid color-mix(in srgb, var(--rs-danger) 40%, transparent);
}
.rs-badge--info {
  background: var(--rs-info-container);
  color: var(--rs-on-info-container);
  border: 1px solid color-mix(in srgb, var(--rs-info) 40%, transparent);
}
.rs-badge--dot.rs-badge--default,
.rs-badge--dot.rs-badge--primary,
.rs-badge--dot.rs-badge--success,
.rs-badge--dot.rs-badge--warning,
.rs-badge--dot.rs-badge--danger,
.rs-badge--dot.rs-badge--info {
  color: transparent;
}
@media (forced-colors: active) {
  .rs-badge {
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }
}
</style>
