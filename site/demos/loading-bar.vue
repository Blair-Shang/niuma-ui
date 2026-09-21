<script setup lang="ts">
import { RsButton, useRsLoadingBar } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const bar = useRsLoadingBar()
</script>

<template>
  <DocDemo
    id="demo-api"
    title="命令式进度"
    description="站点根已挂 RsLoadingBar。本页只调 useRsLoadingBar() 的 start / finish / error，条出现在视口顶部。"
  >
    <div class="row">
      <RsButton size="sm" @click="bar.start()">开始</RsButton>
      <RsButton size="sm" variant="default" @click="bar.finish()">完成</RsButton>
      <RsButton size="sm" variant="danger" @click="bar.error()">失败</RsButton>
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
