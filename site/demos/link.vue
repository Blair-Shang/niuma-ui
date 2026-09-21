<script setup lang="ts">
import { RsLink } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法">
    <div class="row">
      <RsLink href="#/components/button">查看 Button</RsLink>
      <RsLink href="https://vuejs.org" target="_blank">Vue 官网</RsLink>
      <RsLink href="#/guide/introduce" disabled>禁用</RsLink>
    </div>
  </DocDemo>
  <DocDemo id="demo-underline" title="下划线">
    <div class="row">
      <RsLink href="#/guide/introduce" underline="hover">悬停显示</RsLink>
      <RsLink href="#/guide/introduce" underline="always">始终显示</RsLink>
      <RsLink href="#/guide/introduce" underline="none">无下划线</RsLink>
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
