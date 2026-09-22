<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  RsButton,
  RsInput,
  RsTable,
  type RsContextMenuItem,
  type RsTableApi,
  type RsTableColumn,
  type RsTableRowDropPosition,
  type RsTableSortState,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

interface Row {
  id: string
  name: string
  status: string
  count: number
}

const { copy } = useSiteDemo({
  'en-US': {
    name: 'Name',
    status: 'Status',
    count: 'Count',
    running: 'Running',
    stopped: 'Stopped',
    pending: 'Pending',
    sync: 'Sync',
    quality: 'Quality',
    backup: 'Backup',
    sortIdle: 'Click a sort icon.',
    sortHit: (text: string) => `update:sort → ${text}`,
    selectedIdle: 'Check a row.',
    selectedHit: (keys: string) => `update:selectedRowKeys → ${keys || 'none'}`,
    filter: 'Filter',
    empty: 'No rows match.',
    loading: 'Loading keeps the grid and sets aria-busy.',
    slot: 'Custom',
    summary: 'Sum',
    group: 'Group',
    menu: 'Right-click a row.',
    menuHit: (key: string) => `contextMenuSelect → ${key}`,
    inspect: 'Inspect',
    methodIdle: 'getViewRows() / getSelectedRowKeys()',
    methodHit: (view: number, selected: string) => `view ${view} · selected ${selected || 'none'}`,
    read: 'Read API',
    dark: 'Dark island — table tokens follow data-rs-theme',
    keyboard: 'Click the grid, then use arrow keys. The grid is one tab stop.',
    radioIdle: 'Pick one row.',
    radioHit: (key: string) => `radio → ${key || 'none'}`,
    locked: 'Backup cannot be selected.',
    expandIdle: 'Open a detail row.',
    expandHit: (keys: string) => `update:expandedRowKeys → ${keys || 'none'}`,
    detail: 'Detail',
    note: 'Note',
    owner: 'Owner',
    window: 'Window',
    lane: 'Lane',
    ticket: 'Ticket',
    room: 'Room',
    noteText: 'Night-window run.',
    windowText: '02:00–04:00',
    laneText: 'batch',
    ticketText: 'N-10421',
    roomText: 'east-a',
    filterColIdle: 'Open a header filter.',
    filterColHit: (text: string) => `update:columnFilters → ${text || 'none'}`,
    multiIdle: 'Sort a second column. The number is the priority.',
    multiHit: (text: string) => `update:sorts → ${text || 'none'}`,
    orderIdle: 'Drag a column grip.',
    orderHit: (text: string) => `update:columnOrder → ${text}`,
    dropIdle: 'Drag a row grip. The table does not reorder data.',
    dropHit: (text: string) => `rowDrop → ${text}`,
    remoteIdle: 'Remote sort only emits. This demo reorders after the event.',
    remoteHit: (text: string) => `remote update:sort → ${text}`,
    resizeIdle: 'Drag a column edge.',
    resizeHit: (key: string, width: number) => `columnResize → ${key} ${width}px`,
    moreIdle: 'Scroll to the bottom.',
    moreHit: (count: number) => `loadMore → ${count} rows`,
    highlightIdle: 'Click a row.',
    highlightHit: (key: string) => `update:highlightedRowKey → ${key || 'none'}`,
    headerMark: 'Key',
  },
  'zh-CN': {
    name: '名称',
    status: '状态',
    count: '数量',
    running: '运行中',
    stopped: '已停止',
    pending: '待处理',
    sync: '数据同步',
    quality: '质量检查',
    backup: '备份作业',
    sortIdle: '点击排序图标。',
    sortHit: (text: string) => `update:sort → ${text}`,
    selectedIdle: '勾选一行。',
    selectedHit: (keys: string) => `update:selectedRowKeys → ${keys || '无'}`,
    filter: '筛选',
    empty: '没有匹配的行。',
    loading: '加载时表格还在，根上是 aria-busy。',
    slot: '自定义',
    summary: '合计',
    group: '分组',
    menu: '在一行上右键。',
    menuHit: (key: string) => `contextMenuSelect → ${key}`,
    inspect: '查看',
    methodIdle: 'getViewRows() / getSelectedRowKeys()',
    methodHit: (view: number, selected: string) => `视图 ${view} 行 · 已选 ${selected || '无'}`,
    read: '读取 API',
    dark: '深色岛 — 表格 token 跟 data-rs-theme',
    keyboard: '先点表格，再用方向键。整张表是一个 Tab 停靠点。',
    radioIdle: '只选一行。',
    radioHit: (key: string) => `单选 → ${key || '无'}`,
    locked: '备份作业不能选。',
    expandIdle: '展开一行明细。',
    expandHit: (keys: string) => `update:expandedRowKeys → ${keys || '无'}`,
    detail: '明细',
    note: '说明',
    owner: '负责人',
    window: '窗口',
    lane: '通道',
    ticket: '单号',
    room: '机房',
    noteText: '在夜间窗口中运行。',
    windowText: '02:00–04:00',
    laneText: '批处理',
    ticketText: 'N-10421',
    roomText: 'east-a',
    filterColIdle: '打开列头筛选。',
    filterColHit: (text: string) => `update:columnFilters → ${text || '无'}`,
    multiIdle: '再排一列。数字是优先级。',
    multiHit: (text: string) => `update:sorts → ${text || '无'}`,
    orderIdle: '拖表头手柄。',
    orderHit: (text: string) => `update:columnOrder → ${text}`,
    dropIdle: '拖行首手柄。表格不改 data。',
    dropHit: (text: string) => `rowDrop → ${text}`,
    remoteIdle: '远程排序只发事件。这个例子在事件之后自己重排。',
    remoteHit: (text: string) => `远程 update:sort → ${text}`,
    resizeIdle: '拖列边。',
    resizeHit: (key: string, width: number) => `columnResize → ${key} ${width}px`,
    moreIdle: '滚到接近底部。',
    moreHit: (count: number) => `loadMore → ${count} 行`,
    highlightIdle: '点击一行。',
    highlightHit: (key: string) => `update:highlightedRowKey → ${key || '无'}`,
    headerMark: '字段',
  },
})

const baseRows = computed<Row[]>(() => [
  { id: '1', name: copy.value.sync, status: copy.value.running, count: 12 },
  { id: '2', name: copy.value.quality, status: copy.value.stopped, count: 7 },
  { id: '3', name: copy.value.backup, status: copy.value.pending, count: 23 },
])

const columns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, sortable: true },
  { key: 'status', title: copy.value.status, sortable: true },
  { key: 'count', title: copy.value.count, align: 'right', sortable: true },
])

const sortLog = ref('')
const selected = ref<string[]>([])
const methodSelected = ref<string[]>([])
const selectLog = ref('')
const filterText = ref('')
const menuLog = ref('')
const methodLog = ref('')
const apiRef = ref<RsTableApi<Row> | null>(null)

const summaryColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name },
  { key: 'count', title: copy.value.count, align: 'right', summary: { type: 'sum' } },
])

const virtualRows = computed<Row[]>(() =>
  Array.from({ length: 80 }, (_, index) => ({
    id: String(index + 1),
    name: `${copy.value.sync} ${index + 1}`,
    status: index % 2 === 0 ? copy.value.running : copy.value.stopped,
    count: index + 1,
  })),
)

function onSort(value: { key: string; order: 'asc' | 'desc' } | null): void {
  sortLog.value = copy.value.sortHit(value ? `${value.key} ${value.order}` : 'none')
}

function onSelected(keys: string[]): void {
  selected.value = keys
  selectLog.value = copy.value.selectedHit(keys.join(', '))
}

function menuItems(): RsContextMenuItem[] {
  return [{ key: 'inspect', label: copy.value.inspect }]
}

function onMenu(key: string): void {
  menuLog.value = copy.value.menuHit(key)
}

function readApi(): void {
  const view = apiRef.value?.getViewRows().length ?? 0
  const keys = apiRef.value?.getSelectedRowKeys().join(', ') ?? ''
  methodLog.value = copy.value.methodHit(view, keys)
}

const radioSelected = ref<string[]>([])
const radioLog = ref('')
const expandKeys = ref<string[]>([])
const expandLog = ref('')
const columnFilters = ref<Record<string, string>>({})
const filterColLog = ref('')
const multiSorts = ref<RsTableSortState[]>([])
const multiLog = ref('')
const columnOrder = ref<string[]>(['name', 'status', 'count'])
const orderLog = ref('')
const dragRows = ref<Row[]>([])
const dropLog = ref('')
const remoteSort = ref<RsTableSortState | null>(null)
const remoteRows = ref<Row[]>([])
const remoteLog = ref('')
const resizeLog = ref('')
const loaded = ref(20)
const moreLog = ref('')
const highlighted = ref<string>()
const highlightLog = ref('')

const filterColumns = computed<RsTableColumn<Row>[]>(() =>
  columns.value.map((column) => ({ ...column, filterable: true, width: 140 })),
)

const wideColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, fixed: 'left', width: 128 },
  { key: 'status', title: copy.value.status, width: 84 },
  { key: 'note', title: copy.value.note, width: 156 },
  { key: 'window', title: copy.value.window, width: 120 },
  { key: 'lane', title: copy.value.lane, width: 84 },
  { key: 'ticket', title: copy.value.ticket, width: 96 },
  { key: 'room', title: copy.value.room, width: 88 },
  { key: 'count', title: copy.value.count, align: 'right', width: 72 },
  { key: 'owner', title: copy.value.owner, fixed: 'right', width: 88 },
])

const wideRows = computed(() =>
  baseRows.value.map((row) => ({
    ...row,
    note: copy.value.noteText,
    window: copy.value.windowText,
    lane: copy.value.laneText,
    ticket: copy.value.ticketText,
    room: copy.value.roomText,
    owner: 'ops',
  })),
)

const narrowColumns = computed<RsTableColumn<Row>[]>(() => [
  { key: 'name', title: copy.value.name, width: 72, ellipsis: true },
  { key: 'count', title: copy.value.count, align: 'right', width: 72 },
])

const pageRows = computed(() => virtualRows.value.slice(0, loaded.value))

watch(
  baseRows,
  (rows) => {
    const byId = new Map(rows.map((row) => [row.id, row]))
    if (dragRows.value.length === 0) dragRows.value = rows.map((row) => ({ ...row }))
    else dragRows.value = dragRows.value.map((row) => ({ ...row, ...byId.get(row.id) }))
    if (!remoteSort.value) remoteRows.value = rows.map((row) => ({ ...row }))
  },
  { immediate: true },
)

function onRadio(keys: string[]): void {
  radioSelected.value = keys
  radioLog.value = copy.value.radioHit(keys[0] ?? '')
}

function canSelect(row: Row): boolean {
  return row.id !== '3'
}

function onExpanded(keys: string[]): void {
  expandKeys.value = keys
  expandLog.value = copy.value.expandHit(keys.join(', '))
}

function onColumnFilters(value: Record<string, string>): void {
  columnFilters.value = value
  const text = Object.entries(value)
    .filter(([, query]) => query.trim())
    .map(([key, query]) => `${key}=${query}`)
    .join(', ')
  filterColLog.value = copy.value.filterColHit(text)
}

function onMultiSort(value: RsTableSortState[]): void {
  multiSorts.value = value
  multiLog.value = copy.value.multiHit(value.map((item) => `${item.key} ${item.order}`).join(' → '))
}

function onColumnOrder(value: string[]): void {
  columnOrder.value = value
  orderLog.value = copy.value.orderHit(value.join(' → '))
}

function onRowDrop(dragKeys: string[], dropKey: string, position: RsTableRowDropPosition): void {
  dropLog.value = copy.value.dropHit(`${dragKeys.join(',')} ${position} ${dropKey}`)
  if (position === 'into') return
  const dragKey = dragKeys[0]
  if (!dragKey) return
  const next = [...dragRows.value]
  const dragIndex = next.findIndex((row) => row.id === dragKey)
  const dropIndex = next.findIndex((row) => row.id === dropKey)
  if (dragIndex < 0 || dropIndex < 0) return
  const [moved] = next.splice(dragIndex, 1)
  if (!moved) return
  let target = dropIndex
  if (dragIndex < dropIndex) target -= 1
  if (position === 'after') target += 1
  next.splice(target, 0, moved)
  dragRows.value = next
}

function onRemoteSort(sort: RsTableSortState | null): void {
  remoteSort.value = sort
  remoteLog.value = copy.value.remoteHit(sort ? `${sort.key} ${sort.order}` : 'none')
  const rows = baseRows.value.map((row) => ({ ...row }))
  if (!sort) {
    remoteRows.value = rows
    return
  }
  const direction = sort.order === 'asc' ? 1 : -1
  remoteRows.value = rows.sort((left, right) => {
    const a = left[sort.key as keyof Row]
    const b = right[sort.key as keyof Row]
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction
    return String(a).localeCompare(String(b)) * direction
  })
}

function onResize(key: string, width: number): void {
  resizeLog.value = copy.value.resizeHit(key, width)
}

function onLoadMore(): void {
  loaded.value = Math.min(loaded.value + 20, virtualRows.value.length)
  moreLog.value = copy.value.moreHit(loaded.value)
}

function onHighlight(key: string | undefined): void {
  highlighted.value = key
  highlightLog.value = copy.value.highlightHit(key ?? '')
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="列与行"
    title-en="Columns and rows"
    description="columns 定义列，data 给行，row-key 给稳定标识。排序、勾选、编辑和树表在后面的例子里。"
    description-en="columns defines the columns, data is the rows, and row-key is the stable id. Sort, selection, edit, and tree tables are separate examples."
    code="<RsTable :columns=&quot;columns&quot; :data=&quot;rows&quot; row-key=&quot;id&quot; />"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered />
  </DocDemo>

  <DocDemo
    id="demo-sort"
    title="排序"
    title-en="Sort"
    description="点排序图标在升序、降序、取消之间切换，并发 update:sort。字符串比较跟当前 locale。"
    description-en="The sort icon cycles ascending, descending, and off, and emits update:sort. String compare follows the active locale."
    code="<RsTable :columns=&quot;columns&quot; :data=&quot;rows&quot; row-key=&quot;id&quot; @update:sort=&quot;onSort&quot; />"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered @update:sort="onSort" />
    <p class="meta">{{ sortLog || copy.sortIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-select"
    title="勾选"
    title-en="Checkbox selection"
    description="selectable 增加勾选列。受控时绑定 selected-row-keys。不占勾选列的点选见行多选页。"
    description-en="selectable adds a checkbox column. Bind selected-row-keys when the selection is controlled. Row click without a checkbox is on the row-select page."
    code="<RsTable selectable :selected-row-keys=&quot;selected&quot; @update:selected-row-keys=&quot;onSelected&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      selectable
      :selected-row-keys="selected"
      @update:selected-row-keys="onSelected"
    />
    <p class="meta">{{ selectLog || copy.selectedIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-filter"
    title="筛选"
    title-en="Filter"
    description="filter-text 在当前列里做不区分大小写的包含匹配（toLocaleLowerCase）。远程筛选不要传它，由宿主缩 data。"
    description-en="filter-text matches the current columns with toLocaleLowerCase. For a remote filter, omit it and shrink data yourself."
    code="<RsInput v-model=&quot;filterText&quot; /><RsTable :filter-text=&quot;filterText&quot; />"
  >
    <RsInput v-model="filterText" :placeholder="copy.filter" />
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered :filter-text="filterText" />
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸与条纹"
    title-en="Size and stripes"
    description="size 是 sm / md / lg，默认 md。striped 只画斑马纹，不改变选中色。"
    description-en="size is sm, md, or lg, default md. striped paints zebra rows and does not change the selected color."
    code="<RsTable size=&quot;sm&quot; striped bordered />"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" size="sm" striped bordered />
  </DocDemo>

  <DocDemo
    id="demo-empty"
    title="空态与加载"
    title-en="Empty and loading"
    description="没有行时显示 table.empty，可用 #empty 换掉。loading 保持表格并标 aria-busy。"
    description-en="An empty list shows table.empty. Replace it with #empty. loading keeps the grid and sets aria-busy."
    code="<RsTable :data=&quot;[]&quot;><template #empty>No rows match.</template></RsTable>"
  >
    <RsTable :columns="columns" :data="[]" row-key="id" bordered>
      <template #empty>{{ copy.empty }}</template>
    </RsTable>
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered loading />
    <p class="meta">{{ copy.loading }}</p>
  </DocDemo>

  <DocDemo
    id="demo-virtual"
    title="虚拟滚动"
    title-en="Virtual scroll"
    description="行数上去之后给 height，并打开 virtual。默认在 fill 且行数超过 virtual-auto-threshold 时也会自动虚拟化。"
    description-en="Set height and virtual once the list is long. With fill, the table also virtualizes after virtual-auto-threshold."
    code="<RsTable virtual :height=&quot;240&quot; :data=&quot;many&quot; />"
  >
    <RsTable :columns="columns" :data="virtualRows" row-key="id" bordered virtual :height="240" />
  </DocDemo>

  <DocDemo
    id="demo-slot"
    title="单元格插槽"
    title-en="Cell slot"
    description="插槽名是列 key。参数是 row、column、index。"
    description-en="The slot name is the column key. Props are row, column, and index."
    code="<RsTable><template #status=&quot;{ row }&quot;>{{ row.status }}</template></RsTable>"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered>
      <template #status="{ row }">
        <span class="pill">{{ row.status }}</span>
      </template>
    </RsTable>
  </DocDemo>

  <DocDemo
    id="demo-summary"
    title="合计"
    title-en="Summary"
    description="列上的 summary.type 为 sum / avg / count / min / max。范围是当前筛选后的行。"
    description-en="summary.type is sum, avg, count, min, or max. The range is the filtered view."
    code="<RsTable show-summary :columns=&quot;[{ key: 'count', summary: { type: 'sum' } }]&quot; />"
  >
    <RsTable :columns="summaryColumns" :data="baseRows" row-key="id" bordered show-summary />
  </DocDemo>

  <DocDemo
    id="demo-group"
    title="分组"
    title-en="Group"
    description="group-by 按字段把行收成组。它和树表、明细展开互斥。"
    description-en="group-by buckets rows by a field. It does not combine with a tree or with detail expansion."
    code="<RsTable group-by=&quot;status&quot; />"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered group-by="status" />
  </DocDemo>

  <DocDemo
    id="demo-menu"
    title="右键"
    title-en="Context menu"
    description="右键用本库菜单，不引用 reka-ui。context-menu-items 返回项，context-menu-select 报告 key。"
    description-en="The menu is this library’s. It does not import reka-ui. context-menu-items returns the items; context-menu-select reports the key."
    code="<RsTable :context-menu-items=&quot;menuItems&quot; @context-menu-select=&quot;onMenu&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      :context-menu-items="menuItems"
      @context-menu-select="onMenu"
    />
    <p class="meta">{{ menuLog || copy.menu }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="实例 API"
    title-en="Instance API"
    description="ref 上是 RsTableApi：查行、读选中、订阅分析、撤销编辑。下面只点 getViewRows 和 getSelectedRowKeys。"
    description-en="The ref is RsTableApi: row lookup, selection, analytics, and edit undo. This button calls getViewRows and getSelectedRowKeys."
    code="<RsTable ref=&quot;apiRef&quot; selectable /><RsButton @click=&quot;apiRef.getViewRows()&quot;>Read API</RsButton>"
  >
    <RsTable
      ref="apiRef"
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      selectable
      :selected-row-keys="methodSelected"
      @update:selected-row-keys="methodSelected = $event"
    />
    <RsButton size="sm" @click="readApi">{{ copy.read }}</RsButton>
    <p class="meta">{{ methodLog || copy.methodIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-radio"
    title="单选"
    title-en="Radio"
    description="只要一行时用 selection-type=&quot;radio&quot;。选中键仍然是数组，里面最多一个。"
    description-en="Use selection-type=&quot;radio&quot; when only one row may be chosen. The selected keys stay an array, with at most one entry."
    code="<RsTable selectable selection-type=&quot;radio&quot; v-model:selected-row-keys=&quot;keys&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      selectable
      selection-type="radio"
      :selected-row-keys="radioSelected"
      @update:selected-row-keys="onRadio"
    />
    <p class="meta">{{ radioLog || copy.radioIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-locked"
    title="有的行不能选"
    title-en="Some rows cannot be selected"
    description="row-selectable 返回 false 的行不进选中集。这里备份作业被锁住。"
    description-en="A row stays out of the selection when row-selectable returns false. Backup is locked here."
    code="<RsTable selectable :row-selectable=&quot;(row) => row.id !== '3'&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      selectable
      :row-selectable="canSelect"
    />
    <p class="meta">{{ copy.locked }}</p>
  </DocDemo>

  <DocDemo
    id="demo-expand"
    title="明细行"
    title-en="Detail row"
    description="expandable 在行下再开一块内容，用 #expand。它不是树。树和分组不要同时开。"
    description-en="expandable opens a block under the row through #expand. That is not a tree. Do not combine it with a tree or with grouping."
    code="<RsTable expandable v-model:expanded-row-keys=&quot;keys&quot;><template #expand=&quot;{ row }&quot;>{{ row.name }}</template></RsTable>"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      expandable
      :expanded-row-keys="expandKeys"
      @update:expanded-row-keys="onExpanded"
    >
      <template #expand="{ row }">
        <p class="detail">{{ copy.detail }} · {{ row.name }} · {{ row.count }}</p>
      </template>
    </RsTable>
    <p class="meta">{{ expandLog || copy.expandIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-fixed"
    title="固定列"
    title-en="Fixed columns"
    description="宽表把名称钉在左侧、负责人钉在右侧，中间用 scroll-x 滚。fixed 是 left 或 right。"
    description-en="Pin the name on the left and the owner on the right, and scroll the middle with scroll-x. fixed is left or right."
    code="<RsTable :scroll-x=&quot;916&quot; :columns=&quot;[{ key: 'name', fixed: 'left', width: 128 }, { key: 'owner', fixed: 'right', width: 88 }]&quot; />"
  >
    <RsTable :columns="wideColumns" :data="wideRows" row-key="id" bordered :scroll-x="916" />
  </DocDemo>

  <DocDemo
    id="demo-column-filter"
    title="列头筛选"
    title-en="Header filter"
    description="列上 filterable 才会出现筛选。确定后写入 column-filters。整表一个关键字用上面的 filter-text。"
    description-en="A header filter appears only when the column is filterable. Apply writes column-filters. Use filter-text for one keyword across the table."
    code="<RsTable :columns=&quot;[{ key: 'name', filterable: true }]&quot; v-model:column-filters=&quot;filters&quot; />"
  >
    <RsTable
      :columns="filterColumns"
      :data="baseRows"
      row-key="id"
      bordered
      :column-filters="columnFilters"
      @update:column-filters="onColumnFilters"
    />
    <p class="meta">{{ filterColLog || copy.filterColIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-multi-sort"
    title="多列排序"
    title-en="Multi-sort"
    description="multi-sort 按点击顺序叠排序。表头数字是优先级，最多 max-sort 列，默认 3。"
    description-en="multi-sort stacks columns in click order. The header number is the priority, up to max-sort, default 3."
    code="<RsTable multi-sort v-model:sorts=&quot;sorts&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      multi-sort
      :sorts="multiSorts"
      @update:sorts="onMultiSort"
    />
    <p class="meta">{{ multiLog || copy.multiIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-remote-sort"
    title="远程排序"
    title-en="Remote sort"
    description="remote-sort 只改排序状态，不在本地重排。宿主拿到 update:sort 后再换 data。"
    description-en="remote-sort updates the sort state and does not reorder locally. The host replaces data after update:sort."
    code="<RsTable remote-sort :sort=&quot;sort&quot; @update:sort=&quot;onRemoteSort&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="remoteRows"
      row-key="id"
      bordered
      remote-sort
      :sort="remoteSort"
      @update:sort="onRemoteSort"
    />
    <p class="meta">{{ remoteLog || copy.remoteIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-column-order"
    title="拖列"
    title-en="Reorder columns"
    description="column-draggable 在表头加手柄。松手发 update:column-order。组件按这个数组排，不改 columns 本身。"
    description-en="column-draggable adds a header grip. Drop emits update:column-order. The table follows that array and does not rewrite columns."
    code="<RsTable column-draggable v-model:column-order=&quot;order&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      column-draggable
      :column-order="columnOrder"
      @update:column-order="onColumnOrder"
    />
    <p class="meta">{{ orderLog || copy.orderIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-row-drag"
    title="拖行"
    title-en="Reorder rows"
    description="row-draggable 只报告落点。row-drop 的 position 是 before 或 after。这个例子在回调里重排 data。"
    description-en="row-draggable only reports the drop. position is before or after. This example reorders data in the callback."
    code="<RsTable row-draggable @row-drop=&quot;onRowDrop&quot; />"
  >
    <RsTable :columns="columns" :data="dragRows" row-key="id" bordered row-draggable @row-drop="onRowDrop" />
    <p class="meta">{{ dropLog || copy.dropIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-resize"
    title="列宽"
    title-en="Resize columns"
    description="resizable 在列边上拖。松手发 column-resize，宽度是像素。拖的过程中表格自己画，不必每帧写 data。"
    description-en="resizable drags the column edge. column-resize fires on release, with the width in pixels. The table paints during the drag; do not write data every frame."
    code="<RsTable resizable @column-resize=&quot;onResize&quot; />"
  >
    <RsTable
      :columns="filterColumns"
      :data="baseRows"
      row-key="id"
      bordered
      resizable
      @column-resize="onResize"
    />
    <p class="meta">{{ resizeLog || copy.resizeIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-infinite"
    title="滚到底再要一页"
    title-en="Load the next page"
    description="infinite 在接近底部时发 load-more。has-more 为 false 就停。加载中把 loading-more 设上，避免连发。"
    description-en="infinite emits load-more near the bottom. It stops when has-more is false. Set loading-more while the page is in flight so it does not fire twice."
    code="<RsTable infinite :has-more=&quot;hasMore&quot; :height=&quot;220&quot; @load-more=&quot;onLoadMore&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="pageRows"
      row-key="id"
      bordered
      infinite
      virtual
      :height="220"
      :has-more="loaded < virtualRows.length"
      @load-more="onLoadMore"
    />
    <p class="meta">{{ moreLog || copy.moreIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-index"
    title="行号与省略"
    title-en="Index and ellipsis"
    description="show-index 加行号列。ellipsis 在列宽不够时截断，悬停用表格自己的提示，不要再套一层 Tooltip。"
    description-en="show-index adds a row-number column. ellipsis truncates when the column is narrow and uses the table tip. Do not wrap another Tooltip."
    code="<RsTable show-index :columns=&quot;[{ key: 'name', width: 72, ellipsis: true }]&quot; />"
  >
    <RsTable :columns="narrowColumns" :data="baseRows" row-key="id" bordered show-index />
  </DocDemo>

  <DocDemo
    id="demo-header"
    title="自定义列头"
    title-en="Custom header"
    description="列头插槽名是 header- 加列 key。参数只有 column。"
    description-en="The header slot is header- plus the column key. The only prop is column."
    code="<RsTable><template #header-name=&quot;{ column }&quot;>{{ column.title }}</template></RsTable>"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered>
      <template #header-name="{ column }">
        {{ column.title }} · {{ copy.headerMark }}
      </template>
    </RsTable>
  </DocDemo>

  <DocDemo
    id="demo-highlight"
    title="高亮当前行"
    title-en="Highlight the current row"
    description="highlight-row 在点击时记住一行，并发 update:highlighted-row-key。它不等于选中。"
    description-en="highlight-row remembers the clicked row and emits update:highlighted-row-key. That is not the selection."
    code="<RsTable highlight-row v-model:highlighted-row-key=&quot;key&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="baseRows"
      row-key="id"
      bordered
      highlight-row
      :highlighted-row-key="highlighted"
      @update:highlighted-row-key="onHighlight"
    />
    <p class="meta">{{ highlightLog || copy.highlightIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题与方向"
    title-en="Theme and direction"
    description="颜色走 --rs-table-*，它们引用 --rs-surface 和 --rs-text-primary。书写方向用逻辑属性；展开箭头在 rtl 下转向。"
    description-en="Color comes from --rs-table-*, which reference --rs-surface and --rs-text-primary. Spacing is logical. The expander flips in RTL."
    code="<div data-rs-theme=&quot;dark&quot;><RsTable bordered /></div>"
  >
    <div class="island" data-rs-theme="dark">
      <p class="meta">{{ copy.dark }}</p>
      <RsTable :columns="columns" :data="baseRows" row-key="id" bordered striped />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-keyboard"
    title="键盘"
    title-en="Keyboard"
    description="表格是 role=grid，一个 Tab 停靠点。方向键在单元格之间移动。输入法组合期间不抢键。"
    description-en="The table is role=grid and one tab stop. Arrow keys move between cells. IME composition is ignored."
    code="<RsTable :aria-label=&quot;'Tasks'&quot; />"
  >
    <RsTable :columns="columns" :data="baseRows" row-key="id" bordered :aria-label="copy.name" />
    <p class="meta">{{ copy.keyboard }}</p>
  </DocDemo>
</template>

<style scoped>
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
.pill {
  color: var(--rs-text-primary);
}
.detail {
  margin: 0;
  color: var(--rs-text-secondary);
}
.island {
  padding: var(--rs-space-md);
  border-radius: var(--rs-radius-md);
  background: var(--rs-bg);
}
</style>
