<script setup lang="ts">
import { computed, inject } from 'vue'
import { RS_DESCRIPTIONS_KEY } from './descriptions-utils'

const props = withDefaults(
  defineProps<{
    label?: string
    span?: number
  }>(),
  {
    span: 1,
  },
)

const ctx = inject(RS_DESCRIPTIONS_KEY, null)

const columns = computed(() => ctx?.columns ?? 3)
const spanStyle = computed(() => ({
  gridColumn: `span ${Math.min(props.span, columns.value)}`,
}))
</script>

<template>
  <div class="rs-descriptions__item" :style="spanStyle">
    <div class="rs-descriptions__label">
      <slot name="label">{{ label }}</slot>
    </div>
    <div class="rs-descriptions__value">
      <slot />
    </div>
  </div>
</template>
