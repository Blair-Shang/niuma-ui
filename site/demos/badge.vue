<script setup lang="ts">
import { RsBadge } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-type" title="语义色" description="徽标比标签更紧凑，不可关闭。任务状态用浅底深字，避免大面积高饱和色。">
    <div class="row">
      <RsBadge>默认</RsBadge>
      <RsBadge variant="primary">进行中</RsBadge>
      <RsBadge variant="success">已完成</RsBadge>
      <RsBadge variant="warning">需关注</RsBadge>
      <RsBadge variant="danger">已失败</RsBadge>
      <RsBadge variant="info">待处理</RsBadge>
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
