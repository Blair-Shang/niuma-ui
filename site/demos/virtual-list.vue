<script setup lang="ts">
import { RsVirtualList } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const items = Array.from({ length: 80 }, (_, i) => `日志行 ${String(i + 1).padStart(2, '0')}`)
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="固定行高"
    description="height + item-size 只渲染可视区。万级列表把 items 换成真实数据即可。"
  >
    <RsVirtualList :items="items" :height="200" :item-size="32">
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>
</template>

<style scoped>
.row {
  padding: 0 0.75rem;
  line-height: 32px;
  font-size: var(--rs-font-size-sm);
  border-bottom: 1px solid var(--rs-border-subtle);
}
</style>
