<script setup lang="ts">
import { computed } from 'vue'
import {
  resolveRsLoadingSkeletonCount,
  type RsLoadingSize,
  type RsLoadingTone,
  type RsLoadingVariant,
} from './loading-utils'

defineOptions({ name: 'RsLoadingStatus' })

const props = withDefaults(
  defineProps<{
    id?: string
    variant: RsLoadingVariant
    size: RsLoadingSize
    tone: RsLoadingTone
    label: string
    ariaLabel: string
    showText: boolean
    block: boolean
    overlay: boolean
    fullscreen: boolean
    skeletonCount: number
  }>(),
  {
    block: false,
    overlay: false,
    fullscreen: false,
    showText: false,
  },
)

const lines = computed(() =>
  Array.from({ length: resolveRsLoadingSkeletonCount(props.skeletonCount) }, (_, index) => index),
)

const rootClass = computed(() => [
  'rs-loading',
  `rs-loading--${props.size}`,
  `rs-loading--tone-${props.tone}`,
  {
    'rs-loading--block': props.block,
    'rs-loading--overlay': props.overlay,
    'rs-loading--fullscreen': props.fullscreen,
  },
])
</script>

<template>
  <div
    :id="id"
    :class="rootClass"
    role="status"
    aria-busy="true"
    :aria-label="ariaLabel"
  >
    <div
      class="rs-loading__mark"
      :class="{ 'rs-loading__mark--fill': variant === 'skeleton' && !$slots.indicator }"
      aria-hidden="true"
    >
      <slot name="indicator">
        <span
          v-if="variant === 'spinner'"
          class="rs-loading__spinner"
          :class="[`rs-loading__spinner--${size}`, `rs-loading__spinner--${tone}`]"
        />
        <span v-else-if="variant === 'dots'" class="rs-loading__dots" :class="`rs-loading__dots--${size}`">
          <span v-for="dot in 3" :key="dot" class="rs-loading__dot" />
        </span>
        <div v-else class="rs-loading__skeleton" :class="`rs-loading__skeleton--${size}`">
          <span v-for="line in lines" :key="line" class="rs-loading__skeleton-line" />
        </div>
      </slot>
    </div>
    <div v-if="showText" class="rs-loading__label">
      <slot name="label">{{ label }}</slot>
    </div>
  </div>
</template>

<style scoped>
.rs-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-loading-gap, var(--rs-space-sm));
  color: var(--rs-loading-label, var(--rs-text-secondary));
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.rs-loading--tone-default,
.rs-loading--tone-neutral {
  --rs-loading-accent: var(--rs-text-secondary);
}

.rs-loading--tone-primary {
  --rs-loading-accent: var(--rs-primary);
}

.rs-loading--tone-success {
  --rs-loading-accent: var(--rs-success);
}

.rs-loading--tone-warning {
  --rs-loading-accent: var(--rs-warning);
}

.rs-loading--tone-danger {
  --rs-loading-accent: var(--rs-danger);
}

.rs-loading--tone-info {
  --rs-loading-accent: var(--rs-info);
}

.rs-loading--block {
  display: flex;
  justify-content: center;
  inline-size: 100%;
  padding: var(--rs-loading-pad, var(--rs-space-xl));
}

.rs-loading--overlay {
  position: absolute;
  inset: 0;
  z-index: var(--rs-loading-z, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rs-loading-overlay, color-mix(in srgb, var(--rs-surface) 72%, transparent));
}

.rs-loading--fullscreen {
  position: fixed;
  inset: 0;
  z-index: var(--rs-z-modal);
  pointer-events: auto;
}

.rs-loading__mark {
  display: inline-flex;
  min-inline-size: 0;
}

.rs-loading__mark--fill {
  inline-size: 100%;
}

.rs-loading--overlay .rs-loading__mark--fill {
  inline-size: min(100%, 20rem);
}

.rs-loading__label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
  color: var(--rs-loading-label, var(--rs-text-secondary));
}

.rs-loading__spinner {
  display: inline-block;
  border-radius: var(--rs-radius-full);
  border: var(--rs-loading-stroke, 2px) solid var(--rs-loading-track, color-mix(in srgb, var(--rs-text-tertiary) 35%, transparent));
  border-top-color: var(--rs-loading-accent, var(--rs-primary));
  animation: rs-loading-spin var(--rs-loading-spin-duration, 0.7s) linear infinite;
}

.rs-loading__spinner--sm {
  inline-size: var(--rs-loading-spinner-sm, 0.875rem);
  block-size: var(--rs-loading-spinner-sm, 0.875rem);
}

.rs-loading__spinner--md {
  inline-size: var(--rs-loading-spinner-md, 1.125rem);
  block-size: var(--rs-loading-spinner-md, 1.125rem);
}

.rs-loading__spinner--lg {
  inline-size: var(--rs-loading-spinner-lg, 1.5rem);
  block-size: var(--rs-loading-spinner-lg, 1.5rem);
}

.rs-loading__dots {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
}

.rs-loading__dot {
  inline-size: var(--rs-loading-dot-md, 0.375rem);
  block-size: var(--rs-loading-dot-md, 0.375rem);
  border-radius: var(--rs-radius-full);
  background: var(--rs-loading-accent, var(--rs-primary));
  animation: rs-loading-bounce var(--rs-loading-bounce-duration, 1s) ease-in-out infinite;
}

.rs-loading__dots--sm .rs-loading__dot {
  inline-size: var(--rs-loading-dot-sm, 0.25rem);
  block-size: var(--rs-loading-dot-sm, 0.25rem);
}

.rs-loading__dots--lg .rs-loading__dot {
  inline-size: var(--rs-loading-dot-lg, 0.5rem);
  block-size: var(--rs-loading-dot-lg, 0.5rem);
}

.rs-loading__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.rs-loading__dot:nth-child(3) {
  animation-delay: 0.3s;
}

.rs-loading__skeleton {
  display: flex;
  inline-size: 100%;
  flex-direction: column;
  gap: var(--rs-space-sm);
}

.rs-loading__skeleton-line {
  position: relative;
  display: block;
  overflow: hidden;
  block-size: var(--rs-loading-skeleton-h-md, 0.75rem);
  border-radius: var(--rs-radius-xs);
  background: var(--rs-loading-skeleton, var(--rs-surface-hover));
}

.rs-loading__skeleton--sm .rs-loading__skeleton-line {
  block-size: var(--rs-loading-skeleton-h-sm, 0.5rem);
}

.rs-loading__skeleton--lg .rs-loading__skeleton-line {
  block-size: var(--rs-loading-skeleton-h-lg, 1rem);
}

.rs-loading__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    var(--rs-loading-skeleton-shine, color-mix(in srgb, var(--rs-border) 55%, transparent)),
    transparent
  );
  animation: rs-loading-shimmer var(--rs-loading-shimmer-duration, 1.2s) ease-in-out infinite;
}

.rs-loading__skeleton-line:last-child {
  inline-size: 70%;
}

@keyframes rs-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes rs-loading-bounce {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-0.125rem);
  }
}

@keyframes rs-loading-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes rs-loading-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-loading__spinner,
  .rs-loading__dot {
    animation-name: rs-loading-pulse;
    animation-duration: 1.6s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-delay: 0s;
  }

  .rs-loading__skeleton-line::after {
    animation: none;
    transform: none;
    opacity: 0.4;
  }
}

@media (forced-colors: active) {
  .rs-loading--overlay,
  .rs-loading--fullscreen {
    background: Canvas;
  }

  .rs-loading__spinner {
    border-color: GrayText;
    border-top-color: Highlight;
  }

  .rs-loading__dot,
  .rs-loading__skeleton-line {
    background: CanvasText;
  }
}
</style>
