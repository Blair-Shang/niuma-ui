<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsPagination, slicePageData, type RsPaginationSize } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basicPage = ref(1)
const basicPageSize = ref(20)

const compactPage = ref(12)
const compactTotal = 500

const pageSizePage = ref(3)
const pageSizeValue = ref(10)

const hiddenSummaryPage = ref(2)

const disabledPage = ref(4)

const wideSiblingPage = ref(8)
const wideSiblingCount = 2

const sizeDemoPage = ref(2)
const sizeOptions: RsPaginationSize[] = ['sm', 'md', 'lg']

const jumpNoConfirmPage = ref(5)
const jumpWithConfirmPage = ref(5)

const fullBarPage = ref(2)
const fullBarPageSize = ref(20)

const roles = ['管理员', '访客', '编辑'] as const

const allUsers = Array.from({ length: 86 }, (_, index) => ({
  id: index + 1,
  name: `用户 ${String(index + 1).padStart(3, '0')}`,
  role: roles[index % roles.length],
}))

const tablePage = ref(1)
const tablePageSize = ref(10)
const tableRows = computed(() => slicePageData(allUsers, tablePage.value, tablePageSize.value))
</script>

<template>
  <DemoPage title="RsPagination" test-file="RsPagination.spec.ts">
    <DemoBlock title="基础分页">
      <p class="hint">
        默认展示汇总文案；<code>page</code> / <code>pageSize</code> 支持
        <code>v-model</code>。默认尺寸 <code>md</code>（对齐 Ant medium）。
      </p>
      <RsPagination
        v-model:page="basicPage"
        v-model:page-size="basicPageSize"
        :total="86"
      />
      <p class="meta">
        当前第 <code>{{ basicPage }}</code> 页 · 每页
        <code>{{ basicPageSize }}</code> 条
      </p>
    </DemoBlock>

    <DemoBlock title="尺寸（sm / md / lg）">
      <p class="hint">
        对齐 Ant Design Pagination 的 small / medium / large；页码、跳转输入、每页条数同档高度。
      </p>
      <div
        v-for="size in sizeOptions"
        :key="size"
        class="size-row"
      >
        <span class="size-label">{{ size }}</span>
        <RsPagination
          v-model:page="sizeDemoPage"
          :total="120"
          :page-size="10"
          :size="size"
          show-page-size
          show-quick-jumper
        />
      </div>
    </DemoBlock>

    <DemoBlock title="大量数据（省略号）">
      <p class="hint">
        总条数较多时自动折叠中间页码，显示 <code>...</code> 省略号；开启
        <code>show-quick-jumper</code> 可跳转到指定页（默认无「确定」，回车 / 失焦跳转）。
      </p>
      <RsPagination
        v-model:page="compactPage"
        :total="compactTotal"
        :page-size="20"
        show-quick-jumper
      />
      <p class="meta">
        共 <code>{{ compactTotal }}</code> 条 · 当前第 <code>{{ compactPage }}</code> 页
      </p>
    </DemoBlock>

    <DemoBlock title="快速跳转：无确定 / 有确定">
      <p class="hint">
        默认 <code>show-jump-confirm=false</code>（Ant 风格）；需要按钮时设
        <code>show-jump-confirm</code>。
      </p>
      <div class="stack">
        <div>
          <p class="sub">无确定（回车 / 失焦）</p>
          <RsPagination
            v-model:page="jumpNoConfirmPage"
            :total="200"
            :page-size="10"
            show-quick-jumper
          />
        </div>
        <div>
          <p class="sub">显示确定</p>
          <RsPagination
            v-model:page="jumpWithConfirmPage"
            :total="200"
            :page-size="10"
            show-quick-jumper
            show-jump-confirm
          />
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="每页条数切换">
      <p class="hint">
        <code>show-page-size</code> 使用 <code>RsSelect</code> 调整每页条数，页码会自动收敛到合法范围。
      </p>
      <RsPagination
        v-model:page="pageSizePage"
        v-model:page-size="pageSizeValue"
        :total="256"
        show-page-size
      />
      <p class="meta">
        第 <code>{{ pageSizePage }}</code> 页 · 每页 <code>{{ pageSizeValue }}</code> 条
      </p>
    </DemoBlock>

    <DemoBlock title="完整底栏（表格常见组合）">
      <p class="hint">
        汇总 + 页码 + 跳转 + 每页条数，中后台列表底栏典型配置。
      </p>
      <RsPagination
        v-model:page="fullBarPage"
        v-model:page-size="fullBarPageSize"
        :total="500"
        size="sm"
        show-page-size
        show-quick-jumper
        :page-size-options="[10, 20, 50, 100]"
      />
    </DemoBlock>

    <DemoBlock title="隐藏汇总">
      <RsPagination
        v-model:page="hiddenSummaryPage"
        :total="120"
        :show-summary="false"
      />
    </DemoBlock>

    <DemoBlock title="扩大邻页范围（siblingCount）">
      <p class="hint">
        <code>sibling-count</code> 控制当前页两侧展示的页码数量，默认为 <code>1</code>，此处为
        <code>2</code>。
      </p>
      <RsPagination
        v-model:page="wideSiblingPage"
        :total="320"
        :page-size="10"
        :sibling-count="wideSiblingCount"
      />
    </DemoBlock>

    <DemoBlock title="禁用状态">
      <RsPagination
        v-model:page="disabledPage"
        :total="200"
        show-page-size
        show-quick-jumper
        disabled
      />
    </DemoBlock>

    <DemoBlock title="列表联动（业务场景）">
      <p class="hint">
        配合 <code>slicePageData</code> 对本地数据进行分页切片，常见于表格底部分页栏。
      </p>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>角色</th>
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
}
.meta code {
  padding: 0.125rem 0.375rem;
  border-radius: var(--rs-radius-xs);
  background: var(--rs-surface-hover);
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  color: var(--rs-text);
}
.size-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.size-row:last-child {
  margin-bottom: 0;
}
.size-label {
  flex: 0 0 2rem;
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  color: var(--rs-muted);
  text-transform: uppercase;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sub {
  margin: 0 0 0.5rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.table-wrap {
  margin-bottom: 0.75rem;
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
  text-align: left;
  border-bottom: 1px solid var(--rs-border-subtle);
}
.table th {
  font-weight: 600;
  color: var(--rs-muted);
  background: var(--rs-surface);
}
.table tbody tr:last-child td {
  border-bottom: none;
}
</style>
