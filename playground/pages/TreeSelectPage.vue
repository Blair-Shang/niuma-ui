<script setup lang="ts">
import { ref } from 'vue'
import { RsTreeSelect, type RsTreeNode } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

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
  <DemoPage title="RsTreeSelect" test-file="RsTreeSelect.spec.ts">
    <DemoBlock title="树选择（面板内搜索）">
      <RsTreeSelect v-model="value" allow-clear searchable :tree-data="nodes" placeholder="选择节点" />
      <p>当前：{{ value || '—' }}</p>
    </DemoBlock>
  </DemoPage>
</template>
