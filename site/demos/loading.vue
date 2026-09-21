<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsLoading } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const loading = ref(true)
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="变体"
    description="variant 支持 spinner / dots / skeleton。loading=false 时不渲染 DOM。"
  >
    <div class="row">
      <RsLoading variant="spinner" />
      <RsLoading variant="dots" />
      <RsLoading show-label label="正在同步…" />
    </div>
  </DocDemo>

  <DocDemo id="demo-toggle" title="开关" description="与异步状态绑定。区域占位用 skeleton。">
    <div class="row">
      <RsButton size="sm" variant="default" @click="loading = !loading">
        {{ loading ? '隐藏' : '显示' }}
      </RsButton>
      <RsLoading :loading="loading" show-label />
    </div>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}
</style>
