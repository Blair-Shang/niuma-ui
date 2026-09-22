<script setup lang="ts">
import { computed, inject } from 'vue'
import { RS_DESCRIPTIONS_KEY, clampRsDescriptionsSpan } from './descriptions-utils'

defineOptions({ name: 'RsDescriptionsItem' })

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

const spanStyle = computed(() => ({
  gridColumn: `span ${clampRsDescriptionsSpan(props.span, ctx?.columns ?? 3)}`,
}))

const showColon = computed(() => Boolean(ctx?.colon))
const colonMark = computed(() => ctx?.colonMark ?? '')
</script>

<template>
  <div class="rs-descriptions__item" :style="spanStyle">
    <dt class="rs-descriptions__label">
      <slot name="label">{{ label }}</slot>
      <span v-if="showColon" class="rs-descriptions__colon" aria-hidden="true">{{ colonMark }}</span>
    </dt>
    <dd class="rs-descriptions__value">
      <slot />
    </dd>
  </div>
</template>
