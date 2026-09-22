<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsTable, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

interface Row {
  id: string
  name: string
  status: string
}

const { copy } = useSiteDemo({
  'en-US': {
    name: 'Name',
    status: 'Status',
    running: 'Running',
    stopped: 'Stopped',
    pending: 'Pending',
    sync: 'Sync',
    quality: 'Quality',
    backup: 'Backup',
    idle: 'Click a row. Ctrl or Command adds. Shift selects a range.',
    hit: (keys: string) => `update:selectedRowKeys → ${keys || 'none'}`,
    locked: 'Backup cannot be selected. The others still use click, Ctrl, and Shift.',
  },
  'zh-CN': {
    name: '名称',
    status: '状态',
    running: '运行中',
    stopped: '已停止',
    pending: '待处理',
    sync: '数据同步',
    quality: '质量检查',
    backup: '备份作业',
    idle: '单击替换。Ctrl 或 ⌘ 追加。Shift 范围选。',
    hit: (keys: string) => `update:selectedRowKeys → ${keys || '无'}`,
    locked: '备份作业不能选。其余行仍是单击、Ctrl 和 Shift。',
  },
})

const columns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, width: 160 },
  { key: 'status', title: copy.value.status, width: 120 },
])

const rows = computed<Row[]>(() => [
  { id: '1', name: copy.value.sync, status: copy.value.running },
  { id: '2', name: copy.value.quality, status: copy.value.stopped },
  { id: '3', name: copy.value.backup, status: copy.value.pending },
  { id: '4', name: copy.value.sync, status: copy.value.running },
])

const selected = ref<string[]>([])
const log = ref('')

function onSelected(keys: string[]): void {
  selected.value = keys
  log.value = copy.value.hit(keys.join(', '))
}

function canSelect(row: Row): boolean {
  return row.id !== '3'
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="点击行多选"
    title-en="Select by clicking the row"
    description="selection-type=&quot;row&quot; 不渲染勾选列。单击替换，Ctrl/⌘ 追加，Shift 范围选。"
    description-en="selection-type=&quot;row&quot; does not render a checkbox column. Click replaces, Ctrl or Command adds, Shift selects a range."
    code="<RsTable selectable selection-type=&quot;row&quot; :selected-row-keys=&quot;selected&quot; @update:selected-row-keys=&quot;onSelected&quot; />"
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
      @update:selected-row-keys="onSelected"
    />
    <p class="meta">{{ log || copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-locked"
    title="有的行不能点选"
    title-en="Some rows cannot be selected"
    description="row-selectable 返回 false 时，单击、Ctrl 和 Shift 都跳过这一行。勾选列的做法在表格页。"
    description-en="When row-selectable returns false, click, Ctrl, and Shift all skip that row. A checkbox column is on the table page."
    code="<RsTable selectable selection-type=&quot;row&quot; :row-selectable=&quot;(row) => row.id !== '3'&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="rows"
      row-key="id"
      bordered
      selectable
      selection-type="row"
      :row-selectable="canSelect"
    />
    <p class="meta">{{ copy.locked }}</p>
  </DocDemo>
</template>

<style scoped>
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
</style>
