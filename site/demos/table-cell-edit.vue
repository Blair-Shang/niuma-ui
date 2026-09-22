<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsTable, type RsTableApi, type RsTableColumn } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

interface Row {
  id: string
  name: string
  qty: number
}

const { copy } = useSiteDemo({
  'en-US': {
    name: 'Name',
    qty: 'Quantity',
    idle: 'Double-click a cell. Enter or blur commits.',
    hit: (key: string, value: string) => `cellEditCommit → ${key} = ${value}`,
    clickIdle: 'A single click opens the editor.',
    clickHit: (value: string) => `cellEditCommit → name = ${value}`,
    invalidIdle: 'A name shorter than 2 characters is rejected.',
    invalidHit: (message: string) => `cellEditInvalid → ${message}`,
    tooShort: 'Too short',
    kind: 'Kind',
    table: 'Table',
    view: 'View',
    selectIdle: 'Pick a kind. It commits when the list closes.',
    slotIdle: 'Double-click Name. This editor is the #edit-name slot.',
    cancelIdle: 'Press Esc to cancel. The button calls cancelCellEdit().',
    cancelHit: (key: string) => `cellEditCancel → ${key}`,
    cancelApi: 'cancelCellEdit()',
    enabled: 'Enabled',
    boolIdle: 'Click the checkbox. It commits immediately.',
    boolHit: (value: string) => `cellEditCommit → on = ${value}`,
    day: 'Day',
    dateIdle: 'Click the date. Enter commits. A date column opens on click.',
    note: 'Note',
    noteText: 'Night window.',
    noteAlt: 'Read-only replica.',
    noteIdle: 'Double-click the note. Blur commits the textarea.',
    batchIdle: 'Two rows start selected. Edit one name to fill both.',
    batchHit: (count: number) => `cellEditBatchCommit → ${count} rows`,
    readonlyIdle: 'Status has no editable. Double-click it to view, not edit.',
    viewHit: (key: string) => `cellView → ${key}`,
  },
  'zh-CN': {
    name: '名称',
    qty: '数量',
    idle: '双击单元格。回车或失焦提交。',
    hit: (key: string, value: string) => `cellEditCommit → ${key} = ${value}`,
    clickIdle: '单击就进入编辑。',
    clickHit: (value: string) => `cellEditCommit → name = ${value}`,
    invalidIdle: '名称短于 2 个字符会被拒绝。',
    invalidHit: (message: string) => `cellEditInvalid → ${message}`,
    tooShort: '太短',
    kind: '类型',
    table: '表',
    view: '视图',
    selectIdle: '选一个类型。列表关闭时提交。',
    slotIdle: '双击名称。这个编辑器是 #edit-name。',
    cancelIdle: '按 Esc 取消。按钮调用 cancelCellEdit()。',
    cancelHit: (key: string) => `cellEditCancel → ${key}`,
    cancelApi: 'cancelCellEdit()',
    enabled: '启用',
    boolIdle: '点勾选框。它马上提交。',
    boolHit: (value: string) => `cellEditCommit → on = ${value}`,
    day: '日期',
    dateIdle: '点日期。回车提交。日期列单击就打开。',
    note: '备注',
    noteText: '夜间窗口。',
    noteAlt: '只读副本。',
    noteIdle: '双击备注。失焦提交多行文本。',
    batchIdle: '一开始选中两行。改其中一个名称，两行一起写。',
    batchHit: (count: number) => `cellEditBatchCommit → ${count} 行`,
    readonlyIdle: '状态没写 editable。双击它是查看，不会进入编辑。',
    viewHit: (key: string) => `cellView → ${key}`,
  },
})

const rows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])

const columns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, editable: true, width: 140 },
  {
    key: 'qty',
    title: copy.value.qty,
    align: 'right',
    editable: true,
    valueType: 'number',
    width: 120,
    parser: (input) => Number(input) || 0,
  },
])

interface KindRow {
  id: string
  name: string
  kind: string
}

const log = ref('')
const invalidRows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])
const clickRows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])
const clickLog = ref('')
const invalidLog = ref('')
const kindRows = ref<KindRow[]>([
  { id: '1', name: 'users', kind: 'table' },
  { id: '2', name: 'orders', kind: 'view' },
])
const kindLog = ref('')
const slotRows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])
const slotLog = ref('')

const clickColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, editable: true, editTrigger: 'click', width: 160 },
  { key: 'qty', title: copy.value.qty, align: 'right', width: 100 },
])

const invalidColumns = computed<RsTableColumn<Row>[]>(() => [
  {
    key: 'name',
    title: copy.value.name,
    editable: true,
    width: 160,
    validator: (value) => (String(value).trim().length < 2 ? copy.value.tooShort : null),
  },
  { key: 'qty', title: copy.value.qty, align: 'right', width: 100 },
])

const kindColumns = computed<RsTableColumn<KindRow>[]>(() => [
  { key: 'name', title: copy.value.name, width: 140 },
  {
    key: 'kind',
    title: copy.value.kind,
    editable: true,
    valueType: 'select',
    width: 160,
    editorOptions: {
      options: [
        { label: copy.value.table, value: 'table' },
        { label: copy.value.view, value: 'view' },
      ],
    },
    formatter: (value) => (value === 'view' ? copy.value.view : copy.value.table),
  },
])

function onCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  rows.value = rows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  log.value = copy.value.hit(column.key, String(value))
}

function onClickCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  clickRows.value = clickRows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  clickLog.value = copy.value.clickHit(String(value))
}

function onInvalidCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  invalidRows.value = invalidRows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  invalidLog.value = copy.value.hit(column.key, String(value))
}

function onInvalid(
  _row: Row,
  _column: RsTableColumn<Row>,
  _index: number,
  message: string,
): void {
  invalidLog.value = copy.value.invalidHit(message)
}

function onKindCommit(row: KindRow, _column: RsTableColumn<KindRow>, _index: number, value: unknown): void {
  kindRows.value = kindRows.value.map((item) =>
    item.id === row.id ? { ...item, kind: String(value) } : item,
  )
  kindLog.value = copy.value.hit('kind', String(value))
}

function onSlotCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  slotRows.value = slotRows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  slotLog.value = copy.value.hit(column.key, String(value))
}

interface FlagRow {
  id: string
  name: string
  on: boolean
}

interface DateRow {
  id: string
  name: string
  day: string
}

interface NoteRow {
  id: string
  name: string
  note: string
}

const cancelRows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])
const cancelLog = ref('')
const cancelApi = ref<RsTableApi<Row> | null>(null)
const flagRows = ref<FlagRow[]>([
  { id: '1', name: 'users', on: true },
  { id: '2', name: 'orders', on: false },
])
const flagLog = ref('')
const dateRows = ref<DateRow[]>([
  { id: '1', name: 'users', day: '2026-09-22' },
  { id: '2', name: 'orders', day: '2026-10-01' },
])
const dateLog = ref('')
const noteRows = ref<NoteRow[]>([
  { id: '1', name: 'users', note: copy.value.noteText },
  { id: '2', name: 'orders', note: copy.value.noteAlt },
])
const noteLog = ref('')
const batchRows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
  { id: '3', name: 'audit', qty: 12 },
])
const batchSelected = ref<string[]>(['1', '2'])
const batchLog = ref('')
const viewRows = ref<Row[]>([
  { id: '1', name: 'users', qty: 128 },
  { id: '2', name: 'orders', qty: 540 },
])
const viewLog = ref('')

const cancelColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, editable: true, width: 160 },
  { key: 'qty', title: copy.value.qty, align: 'right', width: 100 },
])

const flagColumns = computed<RsTableColumn<FlagRow>[]>(() => [
  { key: 'name', title: copy.value.name, width: 140 },
  { key: 'on', title: copy.value.enabled, editable: true, valueType: 'boolean', width: 100 },
])

const dateColumns = computed<RsTableColumn<DateRow>[]>(() => [
  { key: 'name', title: copy.value.name, width: 140 },
  { key: 'day', title: copy.value.day, editable: true, valueType: 'date', width: 160 },
])

const noteColumns = computed<RsTableColumn<NoteRow>[]>(() => [
  { key: 'name', title: copy.value.name, width: 120 },
  { key: 'note', title: copy.value.note, editable: true, valueType: 'textarea', width: 220 },
])

const batchColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, editable: true, width: 160 },
  { key: 'qty', title: copy.value.qty, align: 'right', width: 100 },
])

const viewColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, editable: true, width: 160 },
  { key: 'qty', title: copy.value.qty, align: 'right', width: 100 },
])

function onCancel(_row: Row, column: RsTableColumn<Row>): void {
  cancelLog.value = copy.value.cancelHit(column.key)
}

function onCancelCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  cancelRows.value = cancelRows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  cancelLog.value = copy.value.hit(column.key, String(value))
}

function cancelFromApi(): void {
  cancelApi.value?.cancelCellEdit()
  cancelLog.value = copy.value.cancelApi
}

function onFlagCommit(row: FlagRow, _column: RsTableColumn<FlagRow>, _index: number, value: unknown): void {
  flagRows.value = flagRows.value.map((item) =>
    item.id === row.id ? { ...item, on: Boolean(value) } : item,
  )
  flagLog.value = copy.value.boolHit(String(value))
}

function onDateCommit(row: DateRow, _column: RsTableColumn<DateRow>, _index: number, value: unknown): void {
  dateRows.value = dateRows.value.map((item) =>
    item.id === row.id ? { ...item, day: String(value) } : item,
  )
  dateLog.value = copy.value.hit('day', String(value))
}

function onNoteCommit(row: NoteRow, _column: RsTableColumn<NoteRow>, _index: number, value: unknown): void {
  noteRows.value = noteRows.value.map((item) =>
    item.id === row.id ? { ...item, note: String(value) } : item,
  )
  noteLog.value = copy.value.hit('note', String(value))
}

function onBatchCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  batchRows.value = batchRows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  batchLog.value = copy.value.hit(column.key, String(value))
}

function onBatch(
  _column: RsTableColumn<Row>,
  changes: Array<{ row: Row; index: number; value: unknown; previous: unknown }>,
): void {
  batchLog.value = copy.value.batchHit(changes.length)
}

function onCellView(_row: Row, column: RsTableColumn<Row>): void {
  viewLog.value = copy.value.viewHit(column.key)
}

function onViewCommit(row: Row, column: RsTableColumn<Row>, _index: number, value: unknown): void {
  viewRows.value = viewRows.value.map((item) =>
    item.id === row.id ? { ...item, [column.key]: value } : item,
  )
  viewLog.value = copy.value.hit(column.key, String(value))
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="单元格即时提交"
    title-en="Commit a cell"
    description="表级 editable 加上列 editable。默认双击进入，失焦或回车发出 cell-edit-commit。整行确认见行提交。"
    description-en="Turn on editable on the table and on the column. Double-click opens the editor. Blur or Enter emits cell-edit-commit. A whole-row confirm is the row-commit page."
    code="<RsTable editable :columns=&quot;columns&quot; :data=&quot;rows&quot; row-key=&quot;id&quot; @cell-edit-commit=&quot;onCommit&quot; />"
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
    <p class="meta">{{ log || copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-click"
    title="单击进入"
    title-en="Edit on click"
    description="列上 edit-trigger=&quot;click&quot; 时单击就打开。没写的列仍跟表级，表级默认是双击。"
    description-en="edit-trigger=&quot;click&quot; on a column opens on a single click. Columns that omit it follow the table, which defaults to double-click."
    code="<RsTable editable :columns=&quot;[{ key: 'name', editable: true, editTrigger: 'click' }]&quot; />"
  >
    <RsTable
      :columns="clickColumns"
      :data="clickRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onClickCommit"
    />
    <p class="meta">{{ clickLog || copy.clickIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-cancel"
    title="取消"
    title-en="Cancel"
    description="Esc 发 cell-edit-cancel，不写 data。cancelCellEdit() 关掉当前格，同样不写回。"
    description-en="Esc emits cell-edit-cancel and does not write data. cancelCellEdit() closes the open cell and also does not write it back."
    code="<RsTable ref=&quot;api&quot; editable @cell-edit-cancel=&quot;onCancel&quot; /><RsButton @click=&quot;api.cancelCellEdit()&quot;>Cancel</RsButton>"
  >
    <RsTable
      ref="cancelApi"
      :columns="cancelColumns"
      :data="cancelRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onCancelCommit"
      @cell-edit-cancel="onCancel"
    />
    <div class="actions">
      <RsButton size="sm" @click="cancelFromApi">{{ copy.cancelApi }}</RsButton>
    </div>
    <p class="meta">{{ cancelLog || copy.cancelIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-boolean"
    title="勾选切换"
    title-en="Boolean"
    description="value-type=&quot;boolean&quot; 直接是勾选框，不打开输入框。点一下就发 cell-edit-commit，值是 true 或 false。"
    description-en="value-type=&quot;boolean&quot; is a checkbox, not a text editor. One click emits cell-edit-commit with true or false."
    code="<RsTable editable :columns=&quot;[{ key: 'on', editable: true, valueType: 'boolean' }]&quot; />"
  >
    <RsTable
      :columns="flagColumns"
      :data="flagRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onFlagCommit"
    />
    <p class="meta">{{ flagLog || copy.boolIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-date"
    title="日期"
    title-en="Date"
    description="value-type=&quot;date&quot; 单击打开日期面板，不必再双击。回车提交。datetime 同样是单击打开，只是多了时间。"
    description-en="value-type=&quot;date&quot; opens the calendar on a single click. Enter commits. datetime opens the same way and adds a time."
    code="<RsTable editable :columns=&quot;[{ key: 'day', editable: true, valueType: 'date' }]&quot; />"
  >
    <RsTable
      :columns="dateColumns"
      :data="dateRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onDateCommit"
    />
    <p class="meta">{{ dateLog || copy.dateIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-textarea"
    title="多行文本"
    title-en="Textarea"
    description="value-type=&quot;textarea&quot; 用多行输入。默认仍是双击进入，失焦提交。"
    description-en="value-type=&quot;textarea&quot; uses a multiline input. It still opens on double-click and commits on blur."
    code="<RsTable editable :columns=&quot;[{ key: 'note', editable: true, valueType: 'textarea' }]&quot; />"
  >
    <RsTable
      :columns="noteColumns"
      :data="noteRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onNoteCommit"
    />
    <p class="meta">{{ noteLog || copy.noteIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-invalid"
    title="校验失败"
    title-en="Validation"
    description="validator 返回字符串就拒绝提交，并发 cell-edit-invalid。返回 null 才写回。"
    description-en="A string from validator rejects the commit and emits cell-edit-invalid. null is what allows the write."
    code="<RsTable editable :columns=&quot;[{ key: 'name', editable: true, validator }]&quot; @cell-edit-invalid=&quot;onInvalid&quot; />"
  >
    <RsTable
      :columns="invalidColumns"
      :data="invalidRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onInvalidCommit"
      @cell-edit-invalid="onInvalid"
    />
    <p class="meta">{{ invalidLog || copy.invalidIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-select"
    title="下拉选项"
    title-en="Select"
    description="value-type=&quot;select&quot; 用本库选择器。选项放在 editor-options.options。关闭列表时提交。"
    description-en="value-type=&quot;select&quot; uses this library’s select. Put choices in editor-options.options. It commits when the list closes."
    code="<RsTable editable :columns=&quot;[{ key: 'kind', editable: true, valueType: 'select', editorOptions: { options } }]&quot; />"
  >
    <RsTable
      :columns="kindColumns"
      :data="kindRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onKindCommit"
    />
    <p class="meta">{{ kindLog || copy.selectIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-batch"
    title="选中行一起填"
    title-en="Fill selected rows"
    description="edit-batch 默认开着。勾选至少两行后，改其中一行的可编辑列，选中的行写成同一个值，并发 cell-edit-batch-commit。只选一行时仍是单格提交。行提交不会走这条。"
    description-en="edit-batch is on by default. With at least two rows selected, editing one editable cell writes that value to the selected rows and emits cell-edit-batch-commit. One selected row stays a single-cell commit. Row commit does not use this path."
    code="<RsTable editable selectable edit-batch :selected-row-keys=&quot;keys&quot; @cell-edit-batch-commit=&quot;onBatch&quot; />"
  >
    <RsTable
      :columns="batchColumns"
      :data="batchRows"
      row-key="id"
      editable
      selectable
      edit-batch
      bordered
      :selected-row-keys="batchSelected"
      @update:selected-row-keys="batchSelected = $event"
      @cell-edit-commit="onBatchCommit"
      @cell-edit-batch-commit="onBatch"
    />
    <p class="meta">{{ batchLog || copy.batchIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-readonly"
    title="只读列"
    title-en="Read-only column"
    description="表级 editable 不会打开每一列。没写 editable 的列双击发 cell-view，不进入编辑。"
    description-en="editable on the table does not open every column. A double-click on a column without editable emits cell-view and does not start an edit."
    code="<RsTable editable :columns=&quot;[{ key: 'name', editable: true }, { key: 'qty' }]&quot; @cell-view=&quot;onView&quot; />"
  >
    <RsTable
      :columns="viewColumns"
      :data="viewRows"
      row-key="id"
      editable
      bordered
      @cell-view="onCellView"
      @cell-edit-commit="onViewCommit"
    />
    <p class="meta">{{ viewLog || copy.readonlyIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-editor"
    title="自己的编辑器"
    title-en="Custom editor"
    description="插槽名是 edit- 加列 key。update 改草稿，commit 提交，cancel 放弃。格子自己有主色轮廓，插槽里的输入框不要再画边框。左边的序号是 edit-gutter，默认开着，数字是行下标加 1，不是 show-index，也没有 v-model。"
    description-en="The slot is edit- plus the column key. update changes the draft, commit saves it, and cancel drops it. The cell already draws the primary outline, so the slotted input should not add another border. The number on the left is edit-gutter, on by default. It is the row index plus 1, not show-index, and it has no v-model."
    code="<RsTable editable><template #edit-name=&quot;{ draft, update, commit }&quot;><input :value=&quot;draft&quot; @input=&quot;update($event.target.value)&quot; @keydown.enter=&quot;commit&quot; /></template></RsTable>"
  >
    <RsTable
      :columns="columns"
      :data="slotRows"
      row-key="id"
      editable
      bordered
      @cell-edit-commit="onSlotCommit"
    >
      <template #edit-name="{ draft, update, commit, cancel }">
        <input
          class="editor"
          :value="draft"
          @input="update(($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="commit"
          @keydown.esc.prevent="cancel"
        />
      </template>
    </RsTable>
    <p class="meta">{{ slotLog || copy.slotIdle }}</p>
  </DocDemo>
</template>

<style scoped>
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-top: var(--rs-space-sm);
}
.editor {
  width: 100%;
  box-sizing: border-box;
}
</style>
