<script setup lang="ts">
import { ref } from 'vue'
import { RsTreeSelect, type RsTreeNode } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const value = ref('')
const nodes: RsTreeNode[] = [
  {
    key: 'db',
    label: '数据库',
    children: [
      { key: 'pg', label: 'PostgreSQL' },
      { key: 'mysql', label: 'MySQL' },
    ],
  },
  { key: 'cache', label: '缓存' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="树选择"
    description="面板内搜索树节点。数据用 tree-data（RsTreeNode[]），不是 options。"
  >
    <div class="field">
      <RsTreeSelect v-model="value" allow-clear searchable :tree-data="nodes" placeholder="选择节点" />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 20rem;
}
</style>
