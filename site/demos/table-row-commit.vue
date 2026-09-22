<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsTable, type RsTableApi, type RsTableColumn } from 'niuma-ui'
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
    savedIdle: 'The line below is what is stored. It moves only after confirm.',
    savedHit: (text: string) => `rowEditCommit → ${text}`,
    savedLine: (text: string) => `stored ${text}`,
    invalidIdle: 'A name shorter than 2 characters blocks the row confirm.',
    invalidHit: (message: string) => `cellEditInvalid → ${message}`,
    tooShort: 'Too short',
    methodIdle: 'Edit a cell, then commit or revert users from the button.',
    methodCommit: 'commitRowEdits(\'users\')',
    methodRollback: 'rollbackRowEdits(\'users\')',
  },
  'zh-CN': {
    name: '集合',
    count: '文档数',
    idle: '改一个单元格，再在行首确认或撤销。',
    hit: (id: string) => `rowEditCommit → ${id}`,
    back: (id: string) => `rowEditRollback → ${id}`,
    savedIdle: '下面这行是已经存下的值。只有确认之后才变。',
    savedHit: (text: string) => `rowEditCommit → ${text}`,
    savedLine: (text: string) => `已保存 ${text}`,
    invalidIdle: '名称短于 2 个字符时，行确认不会发出。',
    invalidHit: (message: string) => `cellEditInvalid → ${message}`,
    tooShort: '太短',
    methodIdle: '先改一格，再用按钮提交或撤销 users。',
    methodCommit: 'commitRowEdits(\'users\')',
    methodRollback: 'rollbackRowEdits(\'users\')',
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

interface Change {
  colKey: string
  value: unknown
  previous: unknown
}

const savedRows = ref<Row[]>([
  { id: 'users', name: 'users', count: 1280 },
  { id: 'orders', name: 'orders', count: 5420 },
])
const savedLog = ref('')
const invalidRows = ref<Row[]>([
  { id: 'users', name: 'users', count: 1280 },
  { id: 'orders', name: 'orders', count: 5420 },
])
const invalidLog = ref('')
const methodRows = ref<Row[]>([
  { id: 'users', name: 'users', count: 1280 },
  { id: 'orders', name: 'orders', count: 5420 },
])
const methodLog = ref('')
const methodApi = ref<RsTableApi<Row> | null>(null)

const invalidColumns = computed<RsTableColumn<Row>[]>(() => [
  {
    key: 'name',
    title: copy.value.name,
    editable: true,
    width: 160,
    validator: (value) => (String(value).trim().length < 2 ? copy.value.tooShort : null),
  },
  { key: 'count', title: copy.value.count, align: 'right', editable: true, width: 120 },
])

const savedText = computed(() =>
  savedRows.value.map((row) => `${row.name} ${row.count}`).join(' · '),
)

function applyChanges(source: Row[], row: Row, changes: Change[]): Row[] {
  const patch = Object.fromEntries(changes.map((item) => [item.colKey, item.value]))
  return source.map((item) => (item.id === row.id ? { ...item, ...patch } : item))
}

function formatChanges(changes: Change[]): string {
  return changes
    .map((item) => `${item.colKey} ${String(item.previous)} → ${String(item.value)}`)
    .join(', ')
}

function onSavedCommit(row: Row, _index: number, changes: Change[]): void {
  savedRows.value = applyChanges(savedRows.value, row, changes)
  savedLog.value = copy.value.savedHit(formatChanges(changes))
}

function onInvalid(
  _row: Row,
  _column: RsTableColumn<Row>,
  _index: number,
  message: string,
): void {
  invalidLog.value = copy.value.invalidHit(message)
}

function onInvalidCommit(row: Row, _index: number, changes: Change[]): void {
  invalidRows.value = applyChanges(invalidRows.value, row, changes)
  invalidLog.value = copy.value.savedHit(formatChanges(changes))
}

function onMethodCommit(row: Row, _index: number, changes: Change[]): void {
  methodRows.value = applyChanges(methodRows.value, row, changes)
  methodLog.value = copy.value.savedHit(formatChanges(changes))
}

function onMethodRollback(row: Row): void {
  methodLog.value = copy.value.back(row.id)
}

function commitUsers(): void {
  methodLog.value = copy.value.methodCommit
  methodApi.value?.commitRowEdits('users')
}

function rollbackUsers(): void {
  methodLog.value = copy.value.methodRollback
  methodApi.value?.rollbackRowEdits('users')
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

  <DocDemo
    id="demo-saved"
    title="确认才写入"
    title-en="Write on confirm"
    description="格子失焦只进这一行的草稿，data 不变。行首确认才发 row-edit-commit，changes 里是列、旧值和新值。"
    description-en="Blur only stages that row. data stays put. Confirm emits row-edit-commit, and changes lists the column, the previous value, and the next value."
    code="<RsTable editable row-commit @row-edit-commit=&quot;onCommit&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="savedRows"
      row-key="id"
      editable
      row-commit
      bordered
      @row-edit-commit="onSavedCommit"
    />
    <p class="meta">{{ copy.savedLine(savedText) }}</p>
    <p class="meta">{{ savedLog || copy.savedIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-invalid"
    title="校验拦住确认"
    title-en="Validation blocks confirm"
    description="名称短于 2 个字符时，失焦发 cell-edit-invalid，草稿不成立。这时行首确认不会发 row-edit-commit。"
    description-en="A name shorter than 2 characters emits cell-edit-invalid on blur and does not stage. Confirm then does not emit row-edit-commit."
    code="<RsTable editable row-commit :columns=&quot;[{ key: 'name', editable: true, validator }]&quot; @cell-edit-invalid=&quot;onInvalid&quot; />"
  >
    <RsTable
      :columns="invalidColumns"
      :data="invalidRows"
      row-key="id"
      editable
      row-commit
      bordered
      @cell-edit-invalid="onInvalid"
      @row-edit-commit="onInvalidCommit"
    />
    <p class="meta">{{ invalidLog || copy.invalidIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="代码里提交"
    title-en="Commit from code"
    description="commitRowEdits(rowKey) 等同于点这一行的确认。rollbackRowEdits(rowKey) 丢掉草稿。没有草稿时确认不会发事件。"
    description-en="commitRowEdits(rowKey) is the same as the row confirm. rollbackRowEdits(rowKey) drops the draft. Confirm emits nothing when the row has no draft."
    code="<RsButton @click=&quot;api.commitRowEdits('users')&quot;>Commit</RsButton>"
  >
    <RsTable
      ref="methodApi"
      :columns="columns"
      :data="methodRows"
      row-key="id"
      editable
      row-commit
      bordered
      @row-edit-commit="onMethodCommit"
      @row-edit-rollback="onMethodRollback"
    />
    <div class="actions">
      <RsButton size="sm" @click="commitUsers">{{ copy.methodCommit }}</RsButton>
      <RsButton size="sm" @click="rollbackUsers">{{ copy.methodRollback }}</RsButton>
    </div>
    <p class="meta">{{ methodLog || copy.methodIdle }}</p>
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
