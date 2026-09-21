<script setup lang="ts">
import { ref } from 'vue'
import { RsDateTimePicker } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const value = ref('2025-06-16 14:30:00')
const range = ref({ start: '2025-06-01 09:00:00', end: '2025-06-30 18:00:00' })
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="日期时间"
    description="月历 + 时间列。v-model 为 YYYY-MM-DD HH:mm:ss。"
  >
    <div class="field">
      <RsDateTimePicker v-model="value" label="开始时间" />
    </div>
  </DocDemo>

  <DocDemo id="demo-range" title="时段范围" description="range 时左右各带时间选择。">
    <div class="field">
      <RsDateTimePicker v-model="range" label="活动时段" range />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 24rem;
}
</style>
