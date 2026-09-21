<script setup lang="ts">
import { RsTag } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-type" title="语义色">
    <div class="row">
      <RsTag>默认</RsTag>
      <RsTag variant="primary">生产</RsTag>
      <RsTag variant="success">健康</RsTag>
      <RsTag variant="warning">延迟</RsTag>
      <RsTag variant="danger">故障</RsTag>
      <RsTag variant="info">灰度</RsTag>
    </div>
  </DocDemo>
  <DocDemo id="demo-close" title="可关闭与胶囊">
    <div class="row">
      <RsTag closable>可关闭</RsTag>
      <RsTag round variant="primary">胶囊</RsTag>
      <RsTag disabled>禁用</RsTag>
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
