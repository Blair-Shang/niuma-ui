<script setup lang="ts">
import { RsAvatar } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="图片与文字回退" description="无 src 或加载失败时根据 name 生成缩写。">
    <div class="row">
      <RsAvatar name="张三" />
      <RsAvatar name="Jane Doe" />
      <RsAvatar name="弱水工作室" />
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  gap: 0.75rem;
}
</style>
