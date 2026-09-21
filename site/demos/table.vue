<script setup lang="ts">
import { RsTable, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

interface Row {
  id: string
  name: string
  status: string
  count: number
}

const columns: RsTableColumn<Row>[] = [
  { key: 'name', title: '名称' },
  { key: 'status', title: '状态' },
  { key: 'count', title: '数量', align: 'right' },
]

const rows: Row[] = [
  { id: '1', name: '任务编排', status: '运行中', count: 12 },
  { id: '2', name: '数据同步', status: '已停止', count: 7 },
  { id: '3', name: '质量检查', status: '待处理', count: 23 },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="列定义 + 行数据即可渲染。排序、选择、虚拟滚动与树表见相关页面。"
  >
    <RsTable :columns="columns" :data="rows" row-key="id" />
  </DocDemo>
</template>
