<script setup lang="ts">
import { RsDivider } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-h" title="水平分割">
    <p>上方内容</p>
    <RsDivider />
    <p>下方内容</p>
    <RsDivider>或</RsDivider>
    <p>更多选项</p>
  </DocDemo>
  <DocDemo id="demo-v" title="垂直分割">
    <div class="row">
      <span>编辑</span>
      <RsDivider orientation="vertical" />
      <span>复制</span>
      <RsDivider orientation="vertical" dashed />
      <span>删除</span>
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
