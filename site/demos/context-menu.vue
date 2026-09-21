<script setup lang="ts">
import { ref } from 'vue'
import { RsContextMenu, type RsContextMenuItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const last = ref('尚未选择')
const items: RsContextMenuItem[] = [
  { key: 'open', label: '打开', icon: 'folder-open' },
  { key: 'rename', label: '重命名', icon: 'pen-line' },
  { key: 'sep', label: '', separator: true },
  { key: 'delete', label: '删除', icon: 'trash-2', danger: true },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="右键菜单"
    description="在触发区域右键打开。@select 回传 key。危险项标 danger。"
  >
    <RsContextMenu :items="items" @select="last = $event">
      <button type="button" class="trigger">在此区域右键</button>
    </RsContextMenu>
    <p class="meta">最近：{{ last }}</p>
  </DocDemo>
</template>

<style scoped>
.trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 7rem;
  border: 1px dashed var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-muted);
  font: inherit;
  cursor: context-menu;
}
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
</style>
