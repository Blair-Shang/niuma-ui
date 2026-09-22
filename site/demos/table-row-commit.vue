<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsTable, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

interface Row {
  id: string
  name: string
  count: number
}

const { copy } = useSiteDemo({
  'en-US': {
    name: 'Collection',
    count: 'Documents',
    idle: 'Edit a cell, then confirm or revert on the gutter.',
    hit: (id: string) => `rowEditCommit → ${id}`,
    back: (id: string) => `rowEditRollback → ${id}`,
  },
  'zh-CN': {
    name: '集合',
    count: '文档数',
    idle: '改一个单元格，再在行首确认或撤销。',
    hit: (id: string) => `rowEditCommit → ${id}`,
    back: (id: string) => `rowEditRollback → ${id}`,
  },
})

const rows = ref<Row[]>([
  { id: 'users', name: 'users', count: 1280 },
  { id: 'orders', name: 'orders', count: 5420 },
])

const columns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, editable: true, width: 160 },
  { key: 'count', title: copy.value.count, align: 'right', editable: true, width: 120 },
])

const log = ref('')

function onCommit(
  row: Row,
  _index: number,
  changes: Array<{ colKey: string; value: unknown }>,
): void {
  const patch = Object.fromEntries(changes.map((item) => [item.colKey, item.value]))
  rows.value = rows.value.map((item) => (item.id === row.id ? { ...item, ...patch } : item))
  log.value = copy.value.hit(row.id)
}

function onRollback(row: Row): void {
  log.value = copy.value.back(row.id)
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="整行确认"
    title-en="Commit a row"
    description="row-commit 把改动留在行草稿里。行首确认发 row-edit-commit，撤销发 row-edit-rollback。没确认之前 data 不变。"
    description-en="row-commit keeps edits in a row draft. Confirm emits row-edit-commit. Revert emits row-edit-rollback. data stays unchanged until confirm."
    code="<RsTable editable row-commit @row-edit-commit=&quot;onCommit&quot; />"
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
      @row-edit-rollback="onRollback"
    />
    <p class="meta">{{ log || copy.idle }}</p>
  </DocDemo>
</template>

<style scoped>
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
</style>
