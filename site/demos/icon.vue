<script setup lang="ts">
import { RsIcon } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const names = ['plus', 'search', 'settings', 'folder', 'user', 'refresh-cw']
</script>

<template>
  <DocDemo id="demo-basic" title="按名称渲染" description="使用 Lucide kebab-case 名称。控件内尺寸跟随档位，独立展示时可传 size。">
    <div class="row">
      <span v-for="name in names" :key="name" class="item">
        <RsIcon :name="name" :size="20" />
        <code>{{ name }}</code>
      </span>
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  color: var(--rs-text);
  font-size: var(--rs-font-size-xs);
}
</style>
