<script setup lang="ts">
import { RsContainer } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="限制阅读宽度并水平居中。max-width 分 sm / md / lg / xl / full；fluid 占满父级。"
  >
    <div class="viewport">
      <RsContainer max-width="lg" padding="md">
        <div class="box">主内容区 · lg 居中</div>
      </RsContainer>
    </div>
  </DocDemo>

  <DocDemo id="demo-grid" title="栅格" description="grid + columns + gap 组成 12 列布局。子项用 grid-column 控制跨度。">
    <RsContainer grid :columns="12" gap="sm">
      <div class="card col-12">页头（12）</div>
      <div class="card col-8">主栏（8）</div>
      <div class="card col-4">侧栏（4）</div>
    </RsContainer>
  </DocDemo>
</template>

<style scoped>
.viewport {
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
}
.box,
.card {
  padding: 0.75rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-elevated);
  font-size: var(--rs-font-size-sm);
}
.card {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.col-12 {
  grid-column: span 12;
}
.col-8 {
  grid-column: span 8;
}
.col-4 {
  grid-column: span 4;
}
@media (width < 40rem) {
  .col-8,
  .col-4 {
    grid-column: span 12;
  }
}
</style>
