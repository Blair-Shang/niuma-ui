<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsInput,
  RsTable,
  type RsTableColumn,
  type RsTableTreeConfig,
} from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

interface OrgRow {
  id: string
  name: string
  type: 'org' | 'dept' | 'team' | 'member'
  headcount: number
  status: 'active' | 'idle'
  children?: OrgRow[]
  isLeaf?: boolean
}

const typeLabel: Record<OrgRow['type'], string> = {
  org: '组织',
  dept: '部门',
  team: '小组',
  member: '成员',
}

const columns: RsTableColumn<OrgRow>[] = [
  { key: 'name', title: '名称', sortable: true, minWidth: 220 },
  {
    key: 'type',
    title: '类型',
    width: 90,
    align: 'center',
    formatter: (v) => typeLabel[v as OrgRow['type']] ?? String(v ?? ''),
  },
  { key: 'headcount', title: '人数', align: 'right', sortable: true, width: 90 },
  {
    key: 'status',
    title: '状态',
    width: 90,
    align: 'center',
    formatter: (v) => (v === 'active' ? '启用' : '闲置'),
  },
]

function member(id: string, name: string, headcount = 1): OrgRow {
  return { id, name, type: 'member', headcount, status: 'active', isLeaf: true }
}

const basicTree: OrgRow[] = [
  {
    id: 'org-1',
    name: '星云科技',
    type: 'org',
    headcount: 128,
    status: 'active',
    children: [
      {
        id: 'dept-rd',
        name: '研发中心',
        type: 'dept',
        headcount: 72,
        status: 'active',
        children: [
          {
            id: 'team-fe',
            name: '前端组',
            type: 'team',
            headcount: 18,
            status: 'active',
            children: [
              member('m-1', 'Alice'),
              member('m-2', 'Bob'),
              member('m-3', 'Carol', 0),
            ],
          },
          {
            id: 'team-be',
            name: '后端组',
            type: 'team',
            headcount: 24,
            status: 'active',
            children: [member('m-4', 'Dave'), member('m-5', 'Eve')],
          },
        ],
      },
      {
        id: 'dept-ops',
        name: '运营中心',
        type: 'dept',
        headcount: 36,
        status: 'idle',
        children: [
          {
            id: 'team-growth',
            name: '增长组',
            type: 'team',
            headcount: 12,
            status: 'active',
            children: [member('m-6', 'Frank')],
          },
        ],
      },
    ],
  },
  {
    id: 'org-2',
    name: '独立顾问',
    type: 'org',
    headcount: 1,
    status: 'idle',
    isLeaf: true,
  },
]

const basicExpanded = ref<string[]>(['org-1'])

const treeConfigBasic: RsTableTreeConfig<OrgRow> = {
  childrenField: 'children',
  expandColumnKey: 'name',
  indent: 18,
  // 默认 fixExpandColumn: true → 展开列自动 fixed:left
}

const treeConfigExpandAll: RsTableTreeConfig<OrgRow> = {
  ...treeConfigBasic,
  defaultExpandAll: true,
}

const cascadeCheck = ref(false)
const treeConfigSelect = computed<RsTableTreeConfig<OrgRow>>(() => ({
  ...treeConfigBasic,
  checkStrictly: !cascadeCheck.value,
}))

const filterText = ref('')
const filterExpanded = ref<string[]>(['org-1', 'dept-rd', 'team-fe'])

const sortExpanded = ref<string[]>(['org-1', 'dept-rd'])

/** 懒加载演示：初始无 children，展开时注入 */
const lazyRoots = ref<OrgRow[]>([
  { id: 'lazy-root', name: '远程目录（点击展开加载）', type: 'org', headcount: 0, status: 'active' },
  { id: 'lazy-leaf', name: '本地文件', type: 'member', headcount: 1, status: 'active', isLeaf: true },
])
const lazyExpanded = ref<string[]>([])
const lazyLog = ref<string[]>([])

const treeConfigLazy: RsTableTreeConfig<OrgRow> = {
  childrenField: 'children',
  expandColumnKey: 'name',
  indent: 18,
  lazy: true,
  async loadData(row, key) {
    lazyLog.value = [`加载 ${key}…`, ...lazyLog.value].slice(0, 8)
    await new Promise((r) => setTimeout(r, 600))
    if (key === 'lazy-root') {
      row.children = [
        {
          id: 'lazy-folder',
          name: '已加载文件夹',
          type: 'dept',
          headcount: 3,
          status: 'active',
          children: [
            member('lazy-a', 'Remote-A'),
            member('lazy-b', 'Remote-B'),
          ],
        },
      ]
    }
    lazyLog.value = [`完成 ${key}`, ...lazyLog.value].slice(0, 8)
  },
}

/** 深树 + 虚拟滚动压测：若干根，每根多层 */
function buildDeepTree(roots = 8, depth = 4, branching = 3): OrgRow[] {
  let seq = 0
  const walk = (depth: number, prefix: string): OrgRow[] => {
    if (depth <= 0) {
      return Array.from({ length: branching }, () => {
        seq += 1
        return member(`leaf-${seq}`, `${prefix}-L${seq}`)
      })
    }
    return Array.from({ length: branching }, (_, i) => {
      seq += 1
      const id = `n-${seq}`
      const name = `${prefix}-${i + 1}`
      return {
        id,
        name,
        type: depth > 2 ? 'org' : depth > 1 ? 'dept' : 'team',
        headcount: branching ** depth,
        status: 'active' as const,
        children: walk(depth - 1, name),
      }
    })
  }
  return Array.from({ length: roots }, (_, i) => {
    seq += 1
    const id = `root-${i + 1}`
    return {
      id,
      name: `集群-${i + 1}`,
      type: 'org' as const,
      headcount: 0,
      status: 'active' as const,
      children: walk(depth - 1, `R${i + 1}`),
    }
  })
}

const virtualTree = ref(buildDeepTree(6, 4, 3))
const virtualExpanded = ref<string[]>(virtualTree.value.map((r) => r.id))
const virtualVisibleHint = computed(
  () =>
    `根节点 ${virtualTree.value.length}；默认展开第一层。展开更多层后可见行会暴涨，fill + 自动虚拟应生效。`,
)

const selectExpanded = ref<string[]>(['org-1', 'dept-rd'])
const selectedKeys = ref<string[]>([])

const expandAllTree = ref(structuredClone(basicTree))

function reloadExpandAllDemo(): void {
  expandAllTree.value = structuredClone(basicTree)
}

function collapseBasic(): void {
  basicExpanded.value = []
}

function expandOrgOnly(): void {
  basicExpanded.value = ['org-1']
}
</script>

<template>
  <DemoPage
    title="RsTable · 树列表"
    description="treeConfig：层级缩进展开（非 #expand 明细行）。与 expandable / groupBy 互斥。"
    test-file="RsTable.spec.ts / table-utils.spec.ts"
  >
    <DemoBlock title="基础树表 + 受控展开">
      <p class="hint">
        <code>tree-config</code> + <code>v-model:expanded-row-keys</code>。
        展开按钮位于 <code>expandColumnKey</code>（本例为名称列），叶子用空白占位对齐。
      </p>
      <div class="row">
        <RsButton size="sm" variant="default" @click="expandOrgOnly">仅展开 org-1</RsButton>
        <RsButton size="sm" variant="default" @click="collapseBasic">全部收起</RsButton>
      </div>
      <RsTable
        v-model:expanded-row-keys="basicExpanded"
        :columns="columns"
        :data="basicTree"
        row-key="id"
        size="sm"
        :tree-config="treeConfigBasic"
        bordered
        column-bordered
      />
      <p class="meta">展开 keys：<code>{{ basicExpanded.join(', ') || '无' }}</code></p>
    </DemoBlock>

    <DemoBlock title="defaultExpandAll（仅首次种下）">
      <p class="hint">
        非受控且未提供 <code>defaultExpandedRowKeys</code> 时，首批非空数据会全开一次；
        之后刷新 <code>data</code> 不会再强制全开（与 Ant defaultExpandAllRows 对齐）。
      </p>
      <div class="row">
        <RsButton size="sm" variant="default" @click="reloadExpandAllDemo">刷新 data 引用</RsButton>
      </div>
      <RsTable
        :columns="columns"
        :data="expandAllTree"
        row-key="id"
        size="sm"
        :tree-config="treeConfigExpandAll"
        bordered
      />
    </DemoBlock>

    <DemoBlock title="过滤（保留祖先路径）">
      <p class="hint">
        <code>filter-text</code> 对树生效时会保留匹配节点及其祖先，子树被裁剪。
        试搜 <code>Alice</code> / <code>增长</code>。
      </p>
      <div class="toolbar">
        <RsInput v-model="filterText" clearable placeholder="过滤名称 / 类型文案…" size="sm" />
      </div>
      <RsTable
        v-model:expanded-row-keys="filterExpanded"
        :columns="columns"
        :data="basicTree"
        row-key="id"
        size="sm"
        :filter-text="filterText"
        :tree-config="treeConfigBasic"
        bordered
      />
    </DemoBlock>

    <DemoBlock title="同级排序">
      <p class="hint">
        树表排序只打乱<strong>同级</strong>顺序，不会把子节点提到根层。点击「名称 / 人数」列头验证。
      </p>
      <RsTable
        v-model:expanded-row-keys="sortExpanded"
        :columns="columns"
        :data="basicTree"
        row-key="id"
        size="sm"
        :tree-config="treeConfigBasic"
        bordered
      />
    </DemoBlock>

    <DemoBlock title="行选择 + 树（严格 / 级联）">
      <p class="hint">
        默认 <code>checkStrictly: true</code>（只勾当前行）。设
        <code>checkStrictly: false</code> 时父子联动，父级可半选。
      </p>
      <div class="row">
        <RsButton
          size="sm"
          :variant="cascadeCheck ? 'primary' : 'default'"
          @click="cascadeCheck = true"
        >
          级联勾选
        </RsButton>
        <RsButton
          size="sm"
          :variant="!cascadeCheck ? 'primary' : 'default'"
          @click="cascadeCheck = false"
        >
          严格勾选
        </RsButton>
      </div>
      <RsTable
        v-model:expanded-row-keys="selectExpanded"
        v-model:selected-row-keys="selectedKeys"
        :columns="columns"
        :data="basicTree"
        row-key="id"
        size="sm"
        selectable
        :tree-config="treeConfigSelect"
        bordered
      />
      <p class="meta">选中：<code>{{ selectedKeys.join(', ') || '无' }}</code></p>
    </DemoBlock>

    <DemoBlock title="懒加载 lazy + loadData">
      <p class="hint">
        <code>lazy: true</code> 时无 children 的非叶子仍显示箭头；首次展开调用
        <code>loadData</code>，需把子节点写回行对象。
      </p>
      <RsTable
        v-model:expanded-row-keys="lazyExpanded"
        :columns="columns"
        :data="lazyRoots"
        row-key="id"
        size="sm"
        :tree-config="treeConfigLazy"
        bordered
      />
      <div class="log">
        <div v-if="!lazyLog.length" class="log__empty">展开「远程目录」观察加载日志</div>
        <div v-for="(line, i) in lazyLog" :key="i">{{ line }}</div>
      </div>
    </DemoBlock>

    <DemoBlock title="深树 + fill 自动虚拟">
      <p class="hint">
        {{ virtualVisibleHint }}
        非树表阈值看 <code>data.length</code>；树表按<strong>当前可见展平行数</strong>判断，避免「根少子孙多」不启用虚拟。
      </p>
      <div class="row">
        <RsButton
          size="sm"
          variant="default"
          @click="virtualExpanded = virtualTree.map((r) => r.id)"
        >
          仅展开根
        </RsButton>
        <RsButton
          size="sm"
          variant="default"
          @click="virtualExpanded = []"
        >
          全部收起
        </RsButton>
      </div>
      <div class="virtual-host">
        <RsTable
          v-model:expanded-row-keys="virtualExpanded"
          :columns="columns"
          :data="virtualTree"
          row-key="id"
          size="sm"
          fill
          height="100%"
          :tree-config="treeConfigBasic"
          bordered
          column-bordered
        />
      </div>
      <p class="meta">展开 keys 数：<code>{{ virtualExpanded.length }}</code></p>
    </DemoBlock>

    <DemoBlock title="与 expandable 互斥（回归）">
      <p class="hint">
        同时传 <code>tree-config</code> 与 <code>expandable</code> 时优先树表，不渲染明细展开列；
        DEV 控制台会有 warn。下列仅开树表，确认无左侧 › 列。
      </p>
      <RsTable
        :columns="columns"
        :data="basicTree.slice(0, 1)"
        row-key="id"
        size="sm"
        expandable
        :tree-config="{ ...treeConfigBasic, defaultExpandAll: true }"
        bordered
      />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: var(--rs-line-height-normal);
}
.hint code {
  font-size: 0.85em;
  color: var(--rs-text);
}
.meta {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  word-break: break-all;
}
.meta code {
  padding: 0.125rem 0.375rem;
  border-radius: var(--rs-radius-xs);
  background: var(--rs-surface-hover);
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  color: var(--rs-text);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.toolbar {
  margin-bottom: 0.75rem;
  max-width: 20rem;
}
.virtual-host {
  height: 320px;
  min-height: 0;
}
.log {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-hover);
  font-size: var(--rs-font-size-xs);
  font-family: ui-monospace, monospace;
  color: var(--rs-muted);
  max-height: 8rem;
  overflow: auto;
}
.log__empty {
  opacity: 0.7;
}
</style>
