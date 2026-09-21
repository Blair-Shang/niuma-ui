<script setup lang="ts">
import { RsSplitPane, type RsSplitPaneItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const panes: RsSplitPaneItem[] = [
  { key: 'left', size: 36 },
  { key: 'right', size: 64 },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="横向分割"
    description="panes 的 key 对应同名插槽。拖动中缝改占比；with-handle 显示抓手，双击复位。"
  >
    <div class="frame">
      <RsSplitPane :panes="panes" with-handle>
        <template #left>
          <div class="pane">资源树</div>
        </template>
        <template #right>
          <div class="pane pane--main">编辑区</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>
</template>

<style scoped>
.frame {
  height: 12rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
}
.pane {
  height: 100%;
  padding: 0.75rem;
  font-size: var(--rs-font-size-sm);
  background: var(--rs-surface);
}
.pane--main {
  background: var(--rs-surface-elevated);
}
</style>
