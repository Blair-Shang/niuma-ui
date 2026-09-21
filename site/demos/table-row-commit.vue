<script setup lang="ts">
import { ref } from 'vue'
import { RsTable, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

interface Row {
  id: string
  name: string
  count: number
}

const rows = ref<Row[]>([
  { id: '1', name: 'users', count: 1280 },
  { id: '2', name: 'orders', count: 5420 },
])

const columns: RsTableColumn<Row>[] = [
  { key: 'name', title: '集合', editable: true, width: 140 },
  { key: 'count', title: '文档数', align: 'right', editable: true, width: 100 },
]

function onCommit(
  row: Row,
  _index: number,
  changes: Array<{ colKey: string; value: unknown }>,
): void {
  const patch = Object.fromEntries(changes.map((item) => [item.colKey, item.value]))
  rows.value = rows.value.map((item) => (item.id === row.id ? { ...item, ...patch } : item))
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="整行确认"
    description="row-commit 先把改动暂存在行草稿。左侧 edit-gutter 出现勾/叉，确认后再写回。适合结果集改完再落库。"
  >
    <RsTable
      :columns="columns"
      :data="rows"
      row-key="id"
      editable
      row-commit
      striped
      bordered
      @row-edit-commit="onCommit"
    />
  </DocDemo>
</template>
