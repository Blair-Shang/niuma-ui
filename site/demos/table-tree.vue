<script setup lang="ts">
import { ref } from 'vue'
import { RsTable, type RsTableColumn, type RsTableTreeConfig } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

interface OrgRow {
  id: string
  name: string
  headcount: number
  children?: OrgRow[]
}

const columns: RsTableColumn<OrgRow>[] = [
  { key: 'name', title: '名称', minWidth: 180 },
  { key: 'headcount', title: '人数', align: 'right', width: 80 },
]

const data: OrgRow[] = [
  {
    id: 'org',
    name: '研发中心',
    headcount: 6,
    children: [
      { id: 'fe', name: '前端组', headcount: 3 },
      { id: 'be', name: '后端组', headcount: 3 },
    ],
  },
]

const expanded = ref<string[]>(['org'])
const tree: RsTableTreeConfig<OrgRow> = {
  childrenField: 'children',
  expandColumnKey: 'name',
  indent: 18,
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="树表"
    description="tree-config 做层级缩进展开，不是 #expand 明细行。与 expandable / groupBy 互斥。"
  >
    <RsTable
      :columns="columns"
      :data="data"
      row-key="id"
      :tree-config="tree"
      v-model:expanded-row-keys="expanded"
      bordered
      size="sm"
    />
  </DocDemo>
</template>
