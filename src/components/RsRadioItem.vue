<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import type { RsComponentSize } from '../theme/types'
import { RadioGroupIndicator, RadioGroupItem } from './reka'
import { RS_RADIO_GROUP_KEY, type RsRadioValue } from './radio-utils'
import { useResolvedRsComponentSize } from './resolve-size'

const props = withDefaults(
  defineProps<{
    value: RsRadioValue
    disabled?: boolean
    size?: RsComponentSize
    id?: string
  }>(),
  {
    disabled: false,
  },
)

const group = inject(RS_RADIO_GROUP_KEY, null)
const resolvedSize = useResolvedRsComponentSize(() => props.size ?? group?.size.value)
const autoId = useId()
const inputId = computed(() => props.id || autoId)

const rootClass = computed(() => [
  'rs-radio',
  `rs-radio--${resolvedSize.value}`,
  { 'rs-radio--disabled': props.disabled },
])
</script>

<template>
  <div :class="rootClass">
    <RadioGroupItem
      :id="inputId"
      class="rs-radio__item"
      :value="value as string | number"
      :disabled="disabled"
    >
      <RadioGroupIndicator class="rs-radio__indicator" />
    </RadioGroupItem>
    <label v-if="$slots.default" class="rs-radio__label" :for="inputId">
      <slot />
    </label>
  </div>
</template>

<style>
.rs-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  cursor: pointer;
  user-select: none;
  line-height: 1;
}

.rs-radio--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.rs-radio__item {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-full);
  background: var(--rs-surface);
  outline: none;
  cursor: pointer;
  transition:
    border-color var(--rs-transition-fast),
    background-color var(--rs-transition-fast);
}

.rs-radio--disabled .rs-radio__item {
  cursor: not-allowed;
}

.rs-radio:hover:not(.rs-radio--disabled) .rs-radio__item:not([data-state='checked']) {
  border-color: var(--rs-primary);
}

.rs-radio__item:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-radio--ssm .rs-radio__item {
  width: 0.75rem;
  height: 0.75rem;
}

.rs-radio--sm .rs-radio__item {
  width: 0.875rem;
  height: 0.875rem;
}

.rs-radio--md .rs-radio__item {
  width: 1rem;
  height: 1rem;
}

.rs-radio--lg .rs-radio__item {
  width: 1.125rem;
  height: 1.125rem;
}

.rs-radio__item[data-state='checked'] {
  border-color: var(--rs-primary);
}

.rs-radio__indicator {
  display: block;
  border-radius: var(--rs-radius-full);
  background: var(--rs-primary);
}

.rs-radio--ssm .rs-radio__indicator {
  width: 0.375rem;
  height: 0.375rem;
}

.rs-radio--sm .rs-radio__indicator {
  width: 0.4375rem;
  height: 0.4375rem;
}

.rs-radio--md .rs-radio__indicator {
  width: 0.5rem;
  height: 0.5rem;
}

.rs-radio--lg .rs-radio__indicator {
  width: 0.5625rem;
  height: 0.5625rem;
}

.rs-radio__label {
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  cursor: pointer;
}

.rs-radio--disabled .rs-radio__label {
  cursor: not-allowed;
}

.rs-radio--ssm .rs-radio__label,
.rs-radio--sm .rs-radio__label {
  font-size: var(--rs-font-size-xs);
}
</style>
