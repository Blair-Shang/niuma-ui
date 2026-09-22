<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsTable, type RsTableApi, type RsTableColumn } from 'niuma-ui'
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
    lockedHit: (keys: string) => `update:selectedRowKeys → ${keys || 'none'}`,
    all: 'Select all',
    clear: 'Clear',
    read: 'getSelectedRowKeys()',
    hostIdle: 'The buttons write the keys. Clicking a row still updates them.',
    hostHit: (keys: string) => `update:selectedRowKeys → ${keys || 'none'}`,
    readHit: (keys: string) => `getSelectedRowKeys → ${keys || 'none'}`,
    defaultIdle: 'Starts with Sync and Quality. The table keeps the keys after that.',
    defaultHit: (keys: string) => `selectionChange → ${keys || 'none'}`,
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
    lockedHit: (keys: string) => `update:selectedRowKeys → ${keys || '无'}`,
    all: '全选',
    clear: '清空',
    read: 'getSelectedRowKeys()',
    hostIdle: '按钮写入选中键。点行也会更新它们。',
    hostHit: (keys: string) => `update:selectedRowKeys → ${keys || '无'}`,
    readHit: (keys: string) => `getSelectedRowKeys → ${keys || '无'}`,
    defaultIdle: '一开始选中数据同步和质量检查。之后由表格自己记。',
    defaultHit: (keys: string) => `selectionChange → ${keys || '无'}`,
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
const lockedSelected = ref<string[]>([])
const lockedLog = ref('')
const hostSelected = ref<string[]>([])
const hostLog = ref('')
const hostApi = ref<RsTableApi<Row> | null>(null)
const defaultLog = ref('')

function onSelected(keys: string[]): void {
  selected.value = keys
  log.value = copy.value.hit(keys.join(', '))
}

function onLocked(keys: string[]): void {
  lockedSelected.value = keys
  lockedLog.value = copy.value.lockedHit(keys.join(', '))
}

function onHost(keys: string[]): void {
  hostSelected.value = keys
  hostLog.value = copy.value.hostHit(keys.join(', '))
}

function selectAll(): void {
  hostSelected.value = rows.value.map((row) => row.id)
  hostLog.value = copy.value.hostHit(hostSelected.value.join(', '))
}

function clearKeys(): void {
  hostSelected.value = []
  hostLog.value = copy.value.hostHit('')
}

function readKeys(): void {
  const keys = hostApi.value?.getSelectedRowKeys().join(', ') ?? ''
  hostLog.value = copy.value.readHit(keys)
}

function onDefault(keys: string[]): void {
  defaultLog.value = copy.value.defaultHit(keys.join(', '))
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
      :selected-row-keys="lockedSelected"
      @update:selected-row-keys="onLocked"
    />
    <p class="meta">{{ lockedLog || copy.locked }}</p>
  </DocDemo>

  <DocDemo
    id="demo-host"
    title="宿主写入选中"
    title-en="The host writes the keys"
    description="selected-row-keys 受控。全选和清空由外面赋值。getSelectedRowKeys() 读当前键。"
    description-en="selected-row-keys is controlled. Select all and clear assign the array from outside. getSelectedRowKeys() reads the current keys."
    code="<RsTable ref=&quot;api&quot; selectable selection-type=&quot;row&quot; :selected-row-keys=&quot;keys&quot; /><RsButton @click=&quot;api.getSelectedRowKeys()&quot;>Read</RsButton>"
  >
    <RsTable
      ref="hostApi"
      :columns="columns"
      :data="rows"
      row-key="id"
      bordered
      selectable
      selection-type="row"
      :selected-row-keys="hostSelected"
      @update:selected-row-keys="onHost"
    />
    <div class="actions">
      <RsButton size="sm" @click="selectAll">{{ copy.all }}</RsButton>
      <RsButton size="sm" @click="clearKeys">{{ copy.clear }}</RsButton>
      <RsButton size="sm" @click="readKeys">{{ copy.read }}</RsButton>
    </div>
    <p class="meta">{{ hostLog || copy.hostIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-default"
    title="初始选中"
    title-en="Initial selection"
    description="default-selected-row-keys 只给第一次。不绑 selected-row-keys 时，之后的单击、Ctrl 和 Shift 由表格自己记，并发 selection-change。"
    description-en="default-selected-row-keys seeds the first selection. Without selected-row-keys, later clicks, Ctrl, and Shift stay inside the table and emit selection-change."
    code="<RsTable selectable selection-type=&quot;row&quot; :default-selected-row-keys=&quot;['1', '2']&quot; @selection-change=&quot;onChange&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="rows"
      row-key="id"
      bordered
      selectable
      selection-type="row"
      :default-selected-row-keys="['1', '2']"
      @selection-change="onDefault"
    />
    <p class="meta">{{ defaultLog || copy.defaultIdle }}</p>
  </DocDemo>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-top: var(--rs-space-sm);
}
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
</style>
