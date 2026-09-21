<script setup lang="ts">
import { ref } from 'vue'
import { RsTable, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

interface Row {
  id: string
  name: string
  qty: number
}

const rows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])

const columns: RsTableColumn<Row>[] = [
  { key: 'name', title: '名称', editable: true, width: 140 },
  {
    key: 'qty',
    title: '数量',
    align: 'right',
    editable: true,
    valueType: 'number',
    width: 100,
    parser: (input) => Number(input) || 0,
  },
]

function onCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  rows.value = rows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="单元格即时提交"
    description="表级 editable + 列 editable。默认双击进入编辑，失焦或回车触发 cell-edit-commit。行级确认见「行提交」。"
  >
    <RsTable
      :columns="columns"
      :data="rows"
      row-key="id"
      editable
      striped
      bordered
      @cell-edit-commit="onCommit"
    />
  </DocDemo>
</template>
