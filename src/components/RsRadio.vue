<script setup lang="ts">
import { computed, provide } from 'vue'
import type { RsComponentSize } from '../theme/types'
import { RadioGroupRoot } from './reka'
import { RS_RADIO_GROUP_KEY, type RsRadioValue } from './radio-utils'
import { useResolvedRsComponentSize } from './resolve-size'

const model = defineModel<RsRadioValue | undefined>({ default: undefined })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    size?: RsComponentSize
    name?: string
    orientation?: 'horizontal' | 'vertical'
  }>(),
  {
    disabled: false,
    orientation: 'horizontal',
  },
)

const emit = defineEmits<{
  change: [value: RsRadioValue]
}>()

const resolvedSize = useResolvedRsComponentSize(() => props.size)

provide(RS_RADIO_GROUP_KEY, {
  size: resolvedSize,
})

const rootClass = computed(() => [
  'rs-radio-group',
  `rs-radio-group--${props.orientation}`,
  `rs-radio-group--${resolvedSize.value}`,
  { 'rs-radio-group--disabled': props.disabled },
])

function onUpdate(value: RsRadioValue): void {
  model.value = value
  emit('change', value)
}
</script>

<template>
  <RadioGroupRoot
    :class="rootClass"
    :model-value="model as string | number | undefined"
    :disabled="disabled"
    :name="name"
    :orientation="orientation"
    @update:model-value="onUpdate($event as RsRadioValue)"
  >
    <slot />
  </RadioGroupRoot>
</template>

<style>
.rs-radio-group {
  display: inline-flex;
  gap: var(--rs-space-md);
  color: var(--rs-text);
}

.rs-radio-group--vertical {
  flex-direction: column;
  align-items: flex-start;
}

.rs-radio-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.rs-radio-group--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
