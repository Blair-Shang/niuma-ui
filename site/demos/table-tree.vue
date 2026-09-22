<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RsInput, RsTable, type RsTableColumn, type RsTableTreeConfig } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

interface OrgRow {
  id: string
  name: string
  headcount: number
  children?: OrgRow[]
}

const { copy } = useSiteDemo({
  'en-US': {
    name: 'Name',
    headcount: 'Headcount',
    org: 'Engineering',
    fe: 'Frontend',
    be: 'Backend',
    idle: 'expandedRowKeys',
    hit: (keys: string) => `update:expandedRowKeys → ${keys || 'none'}`,
    filter: 'Filter',
    filterIdle: 'A match keeps its ancestors.',
    lazyIdle: 'Expand Engineering. Children load once.',
    lazyHit: 'loadData → frontend, backend',
    checkIdle: 'Checking a parent checks its children.',
    checkHit: (keys: string) => `update:selectedRowKeys → ${keys || 'none'}`,
  },
  'zh-CN': {
    name: '名称',
    headcount: '人数',
    org: '研发中心',
    fe: '前端组',
    be: '后端组',
    idle: 'expandedRowKeys',
    hit: (keys: string) => `update:expandedRowKeys → ${keys || '无'}`,
    filter: '筛选',
    filterIdle: '匹配的节点会留下祖先。',
    lazyIdle: '展开研发中心。子节点只加载一次。',
    lazyHit: 'loadData → 前端组、后端组',
    checkIdle: '勾选父节点会带上子节点。',
    checkHit: (keys: string) => `update:selectedRowKeys → ${keys || '无'}`,
  },
})

const columns = computed<RsTableColumn<OrgRow>[]>(() => [
  { key: 'name', title: copy.value.name, minWidth: 180 },
  { key: 'headcount', title: copy.value.headcount, align: 'right', width: 100 },
])

const data = computed<OrgRow[]>(() => [
  {
    id: 'org',
    name: copy.value.org,
    headcount: 6,
    children: [
      { id: 'fe', name: copy.value.fe, headcount: 3 },
      { id: 'be', name: copy.value.be, headcount: 3 },
    ],
  },
])

const expanded = ref<string[]>(['org'])
const log = ref('')
const tree = computed<RsTableTreeConfig<OrgRow>>(() => ({
  childrenField: 'children',
  expandColumnKey: 'name',
  indent: 18,
}))

function onExpanded(keys: string[]): void {
  expanded.value = keys
  log.value = copy.value.hit(keys.join(', '))
}

const filterText = ref('')
const lazyRows = ref<OrgRow[]>([])
const lazyLog = ref('')
const checked = ref<string[]>([])
const checkLog = ref('')
let loadTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false

onUnmounted(() => {
  disposed = true
  if (loadTimer) clearTimeout(loadTimer)
})

const cascadeTree = computed<RsTableTreeConfig<OrgRow>>(() => ({
  childrenField: 'children',
  expandColumnKey: 'name',
  indent: 18,
  checkStrictly: false,
}))

const lazyTree = computed<RsTableTreeConfig<OrgRow>>(() => ({
  childrenField: 'children',
  expandColumnKey: 'name',
  indent: 18,
  lazy: true,
  loadData: (row) =>
    new Promise((resolve) => {
      loadTimer = setTimeout(() => {
        if (disposed) {
          resolve()
          return
        }
        lazyLog.value = copy.value.lazyHit
        resolve([
          { id: `${row.id}-fe`, name: copy.value.fe, headcount: 3 },
          { id: `${row.id}-be`, name: copy.value.be, headcount: 3 },
        ])
      }, 280)
    }),
}))

function resetLazy(): void {
  lazyRows.value = [{ id: 'org', name: copy.value.org, headcount: 0 }]
}

resetLazy()

function onChecked(keys: string[]): void {
  checked.value = keys
  checkLog.value = copy.value.checkHit(keys.join(', '))
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="树表"
    title-en="Tree table"
    description="tree-config 做层级缩进。它不是 #expand 明细行，也和 group-by 互斥。纯导航树用 RsTree。"
    description-en="tree-config indents a hierarchy. It is not the #expand detail row, and it does not combine with group-by. Use RsTree when there are no columns."
    code="<RsTable :tree-config=&quot;tree&quot; v-model:expanded-row-keys=&quot;expanded&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="data"
      row-key="id"
      :tree-config="tree"
      :expanded-row-keys="expanded"
      bordered
      size="sm"
      @update:expanded-row-keys="onExpanded"
    />
    <p class="meta">{{ log || copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-filter"
    title="过滤"
    title-en="Filter"
    description="filter-text 同样作用于树。匹配的节点留下，祖先也留下，方便看到它挂在哪。"
    description-en="filter-text works on the tree too. A match stays, and so do its ancestors, so you can see where it hangs."
    code="<RsInput v-model=&quot;filterText&quot; /><RsTable :tree-config=&quot;tree&quot; :filter-text=&quot;filterText&quot; />"
  >
    <RsInput v-model="filterText" class="filter" :placeholder="copy.filter" />
    <RsTable
      :columns="columns"
      :data="data"
      row-key="id"
      :tree-config="tree"
      :filter-text="filterText"
      :default-expanded-row-keys="['org']"
      bordered
      size="sm"
    />
    <p class="meta">{{ copy.filterIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-lazy"
    title="懒加载"
    title-en="Lazy load"
    description="lazy 让还没有子节点的行也显示展开箭头。第一次展开调用 load-data。返回数组后表格写入 children。卸载后不再改数据。"
    description-en="lazy shows an expander when a row has no children yet. The first expand calls load-data. An array is written onto children. After unmount the demo does not change the data."
    code="<RsTable :tree-config=&quot;{ lazy: true, loadData }&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="lazyRows"
      row-key="id"
      :tree-config="lazyTree"
      bordered
      size="sm"
    />
    <p class="meta">{{ lazyLog || copy.lazyIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-check"
    title="父子一起勾"
    title-en="Check with children"
    description="树表勾选仍是 selectable。check-strictly 设为 false 时，勾父节点会带上已加载的子节点。默认 true 是各勾各的。"
    description-en="Tree selection is still selectable. check-strictly false checks loaded children with the parent. The default true checks each row on its own."
    code="<RsTable selectable :tree-config=&quot;{ checkStrictly: false }&quot; v-model:selected-row-keys=&quot;checked&quot; />"
  >
    <RsTable
      :columns="columns"
      :data="data"
      row-key="id"
      :tree-config="cascadeTree"
      selectable
      bordered
      size="sm"
      :default-expanded-row-keys="['org']"
      :selected-row-keys="checked"
      @update:selected-row-keys="onChecked"
    />
    <p class="meta">{{ checkLog || copy.checkIdle }}</p>
  </DocDemo>
</template>

<style scoped>
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
.filter {
  margin-bottom: var(--rs-space-sm);
}
</style>
