<script setup lang="ts">
import { ref } from 'vue'
import { RsDatePicker, type RsDateRangeValue } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const single = ref('2025-06-16')
const range = ref<RsDateRangeValue>({ start: '2025-06-01', end: '2025-06-30' })
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="单选日期"
    description="选中后点确定写入 v-model（YYYY-MM-DD）。label / hint / required 与输入框一致。"
  >
    <div class="field">
      <RsDatePicker v-model="single" label="发布日期" />
    </div>
  </DocDemo>

  <DocDemo id="demo-range" title="日期范围" description="range 模式下触发器仍是一个输入框，面板内左右双月历选起止。">
    <div class="field">
      <RsDatePicker v-model="range" label="统计区间" range />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 22rem;
}
</style>
