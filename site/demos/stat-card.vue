<script setup lang="ts">
import { RsStatCard } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="指标卡片" description="label + value。accent 映射顶部色条语义。">
    <div class="grid">
      <RsStatCard label="今日调用" :value="12480" accent="primary" />
      <RsStatCard label="运行中" :value="12" accent="success" description="较昨日 +2" />
      <RsStatCard label="失败任务" :value="2" accent="danger" />
    </div>
  </DocDemo>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (width < 40rem) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
