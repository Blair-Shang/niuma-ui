<script setup lang="ts">
import { RsScrollbar } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const logs = Array.from({ length: 24 }, (_, i) => `部署日志 #${i + 1} · 节点 ${((i % 4) + 1).toString().padStart(2, '0')}`)
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="纵向滚动"
    description="统一滚动条视觉。用 height 限制可视高度，适合日志、消息列表。"
  >
    <RsScrollbar height="12rem">
      <ul class="list">
        <li v-for="line in logs" :key="line">{{ line }}</li>
      </ul>
    </RsScrollbar>
  </DocDemo>
</template>

<style scoped>
.list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.list li {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--rs-border-subtle);
  font-size: var(--rs-font-size-sm);
}
</style>
