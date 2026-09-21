<script setup lang="ts">
import { ref } from 'vue'
import { RsTable, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

interface Row {
  id: string
  name: string
  status: string
}

const columns: RsTableColumn<Row>[] = [
  { key: 'name', title: '名称', width: 140 },
  { key: 'status', title: '状态', width: 100 },
]

const rows: Row[] = [
  { id: '1', name: '任务编排', status: '运行中' },
  { id: '2', name: '数据同步', status: '已停止' },
  { id: '3', name: '质量检查', status: '待处理' },
  { id: '4', name: '备份作业', status: '运行中' },
]

const selected = ref<string[]>([])
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="点击行多选"
    description="selectable + selection-type=&quot;row&quot; 不渲染勾选列。单击替换；Ctrl/⌘ 追加；Shift 范围选。"
  >
    <RsTable
      :columns="columns"
      :data="rows"
      row-key="id"
      striped
      bordered
      highlight-row
      selectable
      selection-type="row"
      :selected-row-keys="selected"
      @update:selected-row-keys="selected = $event"
    />
    <p class="meta">已选：{{ selected.join(', ') || '无' }}</p>
  </DocDemo>
</template>

<style scoped>
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
</style>
