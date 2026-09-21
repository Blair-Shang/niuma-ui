<script setup lang="ts">
import { ref } from 'vue'
import { RsTimePicker, type RsTimeRangeValue } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const single = ref('14:30')
const range = ref<RsTimeRangeValue>({ start: '09:00', end: '18:00' })
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="选择时间"
    description="时分滚动列。默认写入 HH:mm；需要秒时加 with-seconds。"
  >
    <div class="field">
      <RsTimePicker v-model="single" label="会议时间" />
    </div>
  </DocDemo>

  <DocDemo id="demo-range" title="时间范围" description="range 模式下一个输入框选择起止时间。">
    <div class="field">
      <RsTimePicker v-model="range" label="营业时段" range />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 22rem;
}
</style>
