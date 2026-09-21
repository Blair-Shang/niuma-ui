<script setup lang="ts">
import { RsIcon, rsBrandIconNames } from 'niuma-ui'
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
  <DocDemo
    id="demo-brand"
    title="内置品牌图标"
    description="工作台数据源 mark。填充色走 --rs-icon-{name}-accent，随主题明暗变化；也可传 color 覆盖。"
  >
    <div class="row">
      <span v-for="name in rsBrandIconNames" :key="name" class="item">
        <RsIcon :name="name" :size="24" />
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
