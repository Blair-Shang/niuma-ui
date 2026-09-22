<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsPagination,
  slicePageData,
  type RsPaginationExpose,
  type RsPaginationSize,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const page = ref(1)
const pageSize = ref(20)
const sizePage = ref(2)
const size = ref<RsPaginationSize>('md')
const sizes: RsPaginationSize[] = ['sm', 'md', 'lg']
const ellipsisPage = ref(12)
const jumpPage = ref(5)
const jumpConfirmPage = ref(5)
const sizeChangerPage = ref(3)
const sizeChangerSize = ref(10)
const edgePage = ref(8)
const simplePage = ref(4)
const hideTotal = ref(8)
const alignPage = ref(2)
const disabledPage = ref(4)
const slotPage = ref(2)
const eventPage = ref(2)
const eventSize = ref(10)
const methodPage = ref(3)
const methodRef = ref<RsPaginationExpose | null>(null)
const lastAction = ref('')
const methodLog = ref('')
const tablePage = ref(1)
const tablePageSize = ref(10)

const { copy } = useSiteDemo({
  'en-US': {
    darkSurface: 'Dark surface — pager tokens follow data-rs-theme, do not hard-code color',
    sizeHint: 'sm / md / lg. Omit size to follow ConfigProvider. ssm becomes sm.',
    ellipsisHint: 'siblingCount=1 folds the middle. Open the jumper to reach a far page.',
    jumperHint: 'Default: Enter or blur. show-jump-confirm adds Go.',
    noConfirm: 'No Go button',
    withConfirm: 'With Go',
    pageSizeHint: 'show-page-size writes pageSize. The current page clamps if needed.',
    edgesHint: 'show-first-last adds First / Last. Off by default so bars stay compact.',
    simpleHint: 'simple keeps previous + current/total + next.',
    hideHint: 'hide-on-single-page removes the nav when total fits one page.',
    moreRows: 'Add rows',
    fewerRows: 'Fit one page',
    alignHint: 'align uses logical start / end, so RTL flips the bar.',
    disabledHint: 'disabled locks pages, jumper, and page size.',
    slotHint: '#item prefixes a mark. #summary replaces the total label. Buttons stay native.',
    idle: 'No event yet. change / pageSizeChange log here.',
    changeHit: (page: number, size: number) => `change → ${page}, ${size}`,
    sizeHit: (size: number, page: number) => `pageSizeChange → ${size}, ${page}`,
    methodIdle: 'Call goTo / next / prev / first / last / focus.',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    toNext: 'next()',
    toPrev: 'prev()',
    toGo: 'goTo(6)',
    toFocus: 'focus()',
    name: 'Name',
    role: 'Role',
    admin: 'Admin',
    guest: 'Guest',
    editor: 'Editor',
    tableHint: 'slicePageData pages a local list. Do not also virtualize the same rows.',
  },
  'zh-CN': {
    darkSurface: '深色表面 — 页码 token 跟 data-rs-theme，不要写死颜色',
    sizeHint: 'sm / md / lg。未传跟 ConfigProvider。ssm 落到 sm。',
    ellipsisHint: 'siblingCount=1 会折叠中间页。开跳转可到远处。',
    jumperHint: '默认回车或失焦即跳。show-jump-confirm 加上确定。',
    noConfirm: '无确定',
    withConfirm: '有确定',
    pageSizeHint: 'show-page-size 写 pageSize。当前页必要时会夹紧。',
    edgesHint: 'show-first-last 加上首页 / 末页。默认关，底栏保持紧凑。',
    simpleHint: 'simple 只保留上一页 + 当前/总页 + 下一页。',
    hideHint: '只有一页时 hide-on-single-page 不渲染 nav。',
    moreRows: '增加条数',
    fewerRows: '收成一页',
    alignHint: 'align 走逻辑 start / end，RTL 会翻。',
    disabledHint: 'disabled 锁住页码、跳转和每页条数。',
    slotHint: '#item 可以加标记。#summary 换总条数。外层仍是原生 button。',
    idle: '还没有事件。change / pageSizeChange 会记在这里。',
    changeHit: (page: number, size: number) => `change → ${page}, ${size}`,
    sizeHit: (size: number, page: number) => `pageSizeChange → ${size}, ${page}`,
    methodIdle: '调用 goTo / next / prev / first / last / focus。',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    toNext: 'next()',
    toPrev: 'prev()',
    toGo: 'goTo(6)',
    toFocus: 'focus()',
    name: '名称',
    role: '角色',
    admin: '管理员',
    guest: '访客',
    editor: '编辑',
    tableHint: 'slicePageData 对本地列表切片。不要再对同一批行做虚拟滚动。',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const roles = computed(() => [copy.value.admin, copy.value.guest, copy.value.editor] as const)
const allUsers = computed(() =>
  Array.from({ length: 86 }, (_, index) => ({
    id: index + 1,
    name: `${copy.value.name} ${String(index + 1).padStart(3, '0')}`,
    role: roles.value[index % roles.value.length],
  })),
)
const tableRows = computed(() => slicePageData(allUsers.value, tablePage.value, tablePageSize.value))

const basicCode = `<RsPagination v-model:page="page" v-model:page-size="pageSize" :total="86" />`

const sizeCode = `<RsPagination v-model:page="page" :total="120" size="sm" />
<RsPagination v-model:page="page" :total="120" size="md" />
<RsPagination v-model:page="page" :total="120" size="lg" />`

const ellipsisCode = `<RsPagination
  v-model:page="page"
  :total="500"
  :page-size="20"
  show-quick-jumper
/>`

const jumperCode = `<RsPagination v-model:page="page" :total="200" show-quick-jumper />
<RsPagination v-model:page="page" :total="200" show-quick-jumper show-jump-confirm />`

const pageSizeCode = `<RsPagination
  v-model:page="page"
  v-model:page-size="pageSize"
  :total="256"
  show-page-size
/>`

const edgesCode = `<RsPagination v-model:page="page" :total="320" show-first-last />`

const simpleCode = `<RsPagination v-model:page="page" :total="200" simple />`

const hideCode = `<RsPagination v-model:page="page" :total="8" hide-on-single-page />`

const alignCode = `<RsPagination v-model:page="page" :total="80" align="end" />`

const disabledCode = `<RsPagination v-model:page="page" :total="200" disabled show-page-size show-quick-jumper />`

const slotsCode = `<RsPagination v-model:page="page" :total="80">
  <template #summary="{ total }">{{ total }} rows</template>
  <template #item="{ type, page, active }">
    <template v-if="type === 'page'">{{ active ? '●' : '○' }} {{ page }}</template>
    <template v-else>{{ type }}</template>
  </template>
</RsPagination>`

const eventsCode = `<RsPagination
  v-model:page="page"
  v-model:page-size="pageSize"
  :total="80"
  show-page-size
  @change="onChange"
  @page-size-change="onPageSize"
/>`

const methodsCode = `const el = ref<RsPaginationExpose | null>(null)
el.value?.next()
el.value?.goTo(6)
el.value?.focus()
<RsPagination ref="el" v-model:page="page" :total="80" />`

const tableCode = `const rows = computed(() => slicePageData(users, page, pageSize))
<RsPagination
  v-model:page="page"
  v-model:page-size="pageSize"
  :total="users.length"
  show-page-size
/>`

function onChange(nextPage: number, nextSize: number) {
  lastAction.value = copy.value.changeHit(nextPage, nextSize)
}

function onPageSize(nextSize: number, nextPage: number) {
  lastAction.value = copy.value.sizeHit(nextSize, nextPage)
}

function runNext() {
  const value = methodRef.value?.next()
  methodLog.value = copy.value.methodHit('next', value == null ? 'undefined' : String(value))
}

function runPrev() {
  const value = methodRef.value?.prev()
  methodLog.value = copy.value.methodHit('prev', value == null ? 'undefined' : String(value))
}

function runGoTo() {
  const ok = methodRef.value?.goTo(6)
  methodLog.value = copy.value.methodHit('goTo', String(ok))
}

function runFocus() {
  methodRef.value?.focus()
  methodLog.value = copy.value.methodHit('focus', String(methodPage.value))
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="v-model:page 与 v-model:page-size。默认展示汇总。不要用下标当页码。"
    description-en="v-model:page and v-model:page-size. The summary is on by default. Do not use a 0-based index as the page."
    :code="basicCode"
  >
    <RsPagination v-model:page="page" v-model:page-size="pageSize" :total="86" />
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsPagination v-model:page="page" v-model:page-size="pageSize" :total="86" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    :description="copy.sizeHint"
    :description-en="copy.sizeHint"
    :code="sizeCode"
  >
    <div class="toolbar">
      <RsButton
        v-for="item in sizes"
        :key="item"
        size="sm"
        :variant="size === item ? 'primary' : 'default'"
        @click="size = item"
      >
        {{ item }}
      </RsButton>
    </div>
    <RsPagination
      v-model:page="sizePage"
      :total="120"
      :page-size="10"
      :size="size"
      show-page-size
      show-quick-jumper
    />
  </DocDemo>

  <DocDemo
    id="demo-ellipsis"
    title="省略号"
    title-en="Ellipsis"
    :description="copy.ellipsisHint"
    :description-en="copy.ellipsisHint"
    :code="ellipsisCode"
  >
    <RsPagination
      v-model:page="ellipsisPage"
      :total="500"
      :page-size="20"
      show-quick-jumper
    />
  </DocDemo>

  <DocDemo
    id="demo-jumper"
    title="快速跳转"
    title-en="Quick jumper"
    :description="copy.jumperHint"
    :description-en="copy.jumperHint"
    :code="jumperCode"
  >
    <div class="stack">
      <div>
        <p class="sub">{{ copy.noConfirm }}</p>
        <RsPagination v-model:page="jumpPage" :total="200" :page-size="10" show-quick-jumper />
      </div>
      <div>
        <p class="sub">{{ copy.withConfirm }}</p>
        <RsPagination
          v-model:page="jumpConfirmPage"
          :total="200"
          :page-size="10"
          show-quick-jumper
          show-jump-confirm
        />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-page-size"
    title="每页条数"
    title-en="Page size"
    :description="copy.pageSizeHint"
    :description-en="copy.pageSizeHint"
    :code="pageSizeCode"
  >
    <RsPagination
      v-model:page="sizeChangerPage"
      v-model:page-size="sizeChangerSize"
      :total="256"
      show-page-size
    />
  </DocDemo>

  <DocDemo
    id="demo-edges"
    title="首页末页"
    title-en="First and last"
    :description="copy.edgesHint"
    :description-en="copy.edgesHint"
    :code="edgesCode"
  >
    <RsPagination v-model:page="edgePage" :total="320" :page-size="10" show-first-last />
  </DocDemo>

  <DocDemo
    id="demo-simple"
    title="简洁"
    title-en="Simple"
    :description="copy.simpleHint"
    :description-en="copy.simpleHint"
    :code="simpleCode"
  >
    <RsPagination v-model:page="simplePage" :total="200" :page-size="10" simple />
  </DocDemo>

  <DocDemo
    id="demo-hide"
    title="单页隐藏"
    title-en="Hide on single page"
    :description="copy.hideHint"
    :description-en="copy.hideHint"
    :code="hideCode"
  >
    <div class="toolbar">
      <RsButton size="sm" @click="hideTotal = 86">{{ copy.moreRows }}</RsButton>
      <RsButton size="sm" @click="hideTotal = 8">{{ copy.fewerRows }}</RsButton>
    </div>
    <RsPagination v-model:page="page" :total="hideTotal" :page-size="20" hide-on-single-page />
  </DocDemo>

  <DocDemo
    id="demo-align"
    title="对齐"
    title-en="Align"
    :description="copy.alignHint"
    :description-en="copy.alignHint"
    :code="alignCode"
  >
    <RsPagination v-model:page="alignPage" :total="80" :page-size="10" align="end" />
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    :description="copy.disabledHint"
    :description-en="copy.disabledHint"
    :code="disabledCode"
  >
    <RsPagination
      v-model:page="disabledPage"
      :total="200"
      show-page-size
      show-quick-jumper
      disabled
    />
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    :description="copy.slotHint"
    :description-en="copy.slotHint"
    :code="slotsCode"
  >
    <RsPagination v-model:page="slotPage" :total="80" :page-size="10">
      <template #summary="{ total }">{{ total }}</template>
      <template #item="{ type, page: itemPage, active }">
        <template v-if="type === 'page'">{{ active ? '●' : '○' }} {{ itemPage }}</template>
        <template v-else>{{ type }}</template>
      </template>
    </RsPagination>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change 与 pageSizeChange。点页码或改每页条数都会记在下面。"
    description-en="The events you can feel are change and pageSizeChange. A page click or a page-size change logs below."
    :code="eventsCode"
  >
    <RsPagination
      v-model:page="eventPage"
      v-model:page-size="eventSize"
      :total="80"
      show-page-size
      @change="onChange"
      @page-size-change="onPageSize"
    />
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主 ref 调 goTo / next / prev / first / last / focus。没有 setValue()。"
    description-en="The host ref calls goTo / next / prev / first / last / focus. There is no setValue()."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" @click="runPrev">{{ copy.toPrev }}</RsButton>
      <RsButton size="sm" @click="runNext">{{ copy.toNext }}</RsButton>
      <RsButton size="sm" @click="runGoTo">{{ copy.toGo }}</RsButton>
      <RsButton size="sm" @click="runFocus">{{ copy.toFocus }}</RsButton>
    </div>
    <RsPagination ref="methodRef" v-model:page="methodPage" :total="80" :page-size="10" />
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-table"
    title="列表联动"
    title-en="List"
    :description="copy.tableHint"
    :description-en="copy.tableHint"
    :code="tableCode"
  >
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ copy.name }}</th>
            <th>{{ copy.role }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.role }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <RsPagination
      v-model:page="tablePage"
      v-model:page-size="tablePageSize"
      :total="allUsers.length"
      size="sm"
      show-page-size
      show-quick-jumper
      :page-size-options="[5, 10, 20]"
    />
  </DocDemo>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
  margin-bottom: var(--rs-space-sm);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.sub {
  margin: 0 0 var(--rs-space-xs);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}

.table-wrap {
  margin-bottom: var(--rs-space-sm);
  overflow-x: auto;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--rs-font-size-sm);
}

.table th,
.table td {
  padding: 0.5rem 0.75rem;
  text-align: start;
  border-bottom: 1px solid var(--rs-border-subtle);
}

.table th {
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-text-secondary);
  background: var(--rs-surface);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
</style>
