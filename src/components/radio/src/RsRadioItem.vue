<script setup lang="ts">
import { computed, inject, useId, useSlots } from 'vue'
import type { RsComponentSize } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import {
  RS_RADIO_GROUP_KEY,
  rsRadioInputValue,
  type RsRadioValue,
} from './radio-utils'

defineOptions({ name: 'RsRadioItem' })

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

const slots = useSlots()
const group = inject(RS_RADIO_GROUP_KEY, null)
const resolvedSize = useResolvedRsComponentSize(() => props.size ?? group?.size.value)
const hasText = computed(() => Boolean(slots.default))
const autoId = useId()
const inputId = computed(() => props.id || autoId)
const resolvedDisabled = computed(() => props.disabled || Boolean(group?.disabled.value))
const checked = computed(() => Boolean(group?.isChecked(props.value)))
const inputName = computed(() => group?.name.value || autoId)
const itemState = computed(() => (checked.value ? 'checked' : 'unchecked'))

const rootClass = computed(() => [
  'rs-radio',
  `rs-radio--${resolvedSize.value}`,
  {
    'rs-radio--checked': checked.value,
    'rs-radio--disabled': resolvedDisabled.value,
  },
])

function onChange(event: Event): void {
  if (resolvedDisabled.value) return
  const el = event.target as HTMLInputElement
  if (!el.checked) return
  group?.select(props.value)
}
</script>

<template>
  <label :class="rootClass" :for="inputId">
    <input
      :id="inputId"
      class="rs-radio__input"
      type="radio"
      :name="inputName"
      :value="rsRadioInputValue(value)"
      :checked="checked"
      :disabled="resolvedDisabled"
      :aria-label="hasText ? undefined : rsRadioInputValue(value)"
      @change="onChange"
      @click.stop
    />
    <span class="rs-radio__item" :data-state="itemState" aria-hidden="true">
      <span class="rs-radio__indicator" />
    </span>
    <span v-if="$slots.default" class="rs-radio__label">
      <slot />
    </span>
  </label>
</template>

<style scoped>
.rs-radio {
  --rs-radio-size: 1rem;
  --rs-radio-dot: calc(var(--rs-radio-size) * 0.5);
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--rs-space-xs);
  min-height: var(--rs-control-height-md);
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  line-height: 1;
}

.rs-radio--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.rs-radio__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rs-radio__item {
  position: relative;
  display: block;
  flex-shrink: 0;
  box-sizing: border-box;
  width: var(--rs-radio-size, 1rem);
  height: var(--rs-radio-size, 1rem);
  overflow: hidden;
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

.rs-radio__input:focus-visible + .rs-radio__item {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-radio--ssm {
  --rs-radio-size: 0.75rem;
  min-height: var(--rs-control-height-ssm);
}

.rs-radio--sm {
  --rs-radio-size: 0.875rem;
  min-height: var(--rs-control-height-sm);
}

.rs-radio--md {
  --rs-radio-size: 1rem;
  min-height: var(--rs-control-height-md);
}

.rs-radio--lg {
  --rs-radio-size: 1.125rem;
  min-height: var(--rs-control-height-lg);
}

.rs-radio__item[data-state='checked'] {
  border-color: var(--rs-primary);
}

.rs-radio__indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--rs-radio-dot, 0.5rem);
  height: var(--rs-radio-dot, 0.5rem);
  border-radius: var(--rs-radius-full);
  background: var(--rs-primary);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity var(--rs-transition-fast);
}

.rs-radio__item[data-state='checked'] .rs-radio__indicator {
  opacity: 1;
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

@media (prefers-reduced-motion: reduce) {
  .rs-radio__item,
  .rs-radio__indicator {
    transition: none;
  }
}
</style>
