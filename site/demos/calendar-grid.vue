<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDateParts, parseDateValue, RsCalendarGrid } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const selected = ref('2025-06-16')
const view = ref({ year: 2025, month: 6 })
const selectedDate = computed(() => parseDateValue(selected.value))
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="月历格子"
    description="底层月历。用 v-model:view-year / view-month 控展示月，@select 回 RsParsedDate。"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="view.year"
        v-model:view-month="view.month"
        :selected="selectedDate"
        @select="(date) => (selected = formatDateParts(date))"
      />
    </div>
    <p class="meta">当前：{{ selected }}</p>
  </DocDemo>
</template>

<style scoped>
.panel {
  width: fit-content;
  padding: 0.5rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
}
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
</style>
