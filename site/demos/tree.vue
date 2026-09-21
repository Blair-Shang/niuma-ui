<script setup lang="ts">
import { ref } from 'vue'
import { RsTree, type RsTreeNode } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const value = ref('flows')
const nodes: RsTreeNode[] = [
  {
    key: 'workspace',
    label: '工作区',
    icon: 'folder',
    children: [
      { key: 'flows', label: '流程', icon: 'workflow' },
      { key: 'datasets', label: '数据集', icon: 'database' },
    ],
  },
  { key: 'settings', label: '设置', icon: 'settings' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="目录树"
    description="数据用 :nodes。v-model 是选中 key。下拉选节点请用 TreeSelect。"
  >
    <div class="frame">
      <RsTree v-model="value" :nodes="nodes" default-expand-all show-line />
    </div>
  </DocDemo>
</template>

<style scoped>
.frame {
  max-width: 18rem;
}
</style>
