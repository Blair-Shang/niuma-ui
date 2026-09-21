<script setup lang="ts">
import type { FaqItem } from '../catalog/types'
import { useSiteI18n } from '../composables/use-site-i18n'

defineProps<{
  items: FaqItem[]
}>()

const { pair } = useSiteI18n()

function question(item: FaqItem) {
  return pair(item.q, item.qEn)
}

function answer(item: FaqItem) {
  return pair(item.a, item.aEn)
}
</script>

<template>
  <dl v-if="items.length" class="faq-list">
    <div v-for="item in items" :key="item.q" class="faq-list__item">
      <dt>{{ question(item) }}</dt>
      <dd>{{ answer(item) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.faq-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-lg);
}

.faq-list__item dt {
  margin: 0 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-sm);
  font-weight: 600;
  color: var(--rs-text);
}

.faq-list__item dd {
  margin: 0;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}
</style>
