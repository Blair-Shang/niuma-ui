<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsBreadcrumb, type RsBreadcrumbItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const lastAction = ref('')

const { copy } = useSiteDemo({
  'en-US': {
    workbench: 'Workbench',
    database: 'Database',
    orders: 'orders',
    docs: 'Docs',
    components: 'Components',
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    apps: 'Apps',
    detail: 'Novel writer',
    org: 'Org',
    team: 'Team',
    project: 'Project',
    sprint: 'Sprint',
    task: 'Task #1284',
    locked: 'Archived',
    darkSurface: 'Dark surface — crumbs follow data-rs-theme, do not hard-code color',
    idle: 'No click yet. click logs the item label.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
  },
  'zh-CN': {
    workbench: '工作台',
    database: '数据库',
    orders: 'orders',
    docs: '文档',
    components: '组件',
    breadcrumb: '面包屑',
    home: '首页',
    apps: '应用广场',
    detail: '小说续写',
    org: '组织',
    team: '团队',
    project: '项目',
    sprint: '迭代',
    task: '任务 #1284',
    locked: '已归档',
    darkSurface: '深色表面 — 面包屑跟 data-rs-theme，不要写死颜色',
    idle: '还没有点击。click 会记下该项的 label。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)

const here = '#/components/breadcrumb'

const basicItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.workbench, href: '#/' },
  { label: copy.value.database, href: '#/components/tree' },
  { label: copy.value.orders },
])

const sepItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.docs, href: '#/guide/introduce' },
  { label: copy.value.components, href: here },
  { label: copy.value.breadcrumb },
])

const iconItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.home, href: '#/', icon: 'house' },
  { label: copy.value.apps, href: '#/components/menu', icon: 'layout-grid' },
  { label: copy.value.detail, icon: 'book-open' },
])

const collapseItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.org, href: here },
  { label: copy.value.team, href: here },
  { label: copy.value.project, href: here },
  { label: copy.value.sprint, href: here },
  { label: copy.value.task },
])

const disabledItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.home, href: '#/' },
  { label: copy.value.locked, href: here, disabled: true },
  { label: copy.value.detail },
])

const slotItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.docs, href: '#/guide/introduce' },
  { label: copy.value.components, href: here },
  { label: copy.value.breadcrumb },
])

const eventItems = computed<RsBreadcrumbItem[]>(() => [
  { label: copy.value.home, href: '#/' },
  { label: copy.value.apps, href: here },
  { label: copy.value.detail },
])

const basicCode = `<RsBreadcrumb
  :items="[
    { label: 'Workbench', href: '#/' },
    { label: 'Database', href: '#/components/tree' },
    { label: 'orders' },
  ]"
/>`

const separatorCode = `<RsBreadcrumb separator="/" :items="items" />
<RsBreadcrumb separator-icon="chevron-right" :items="items" />`

const iconsCode = `<RsBreadcrumb
  :items="[
    { label: 'Home', href: '#/', icon: 'house' },
    { label: 'Apps', href: '#/apps', icon: 'layout-grid' },
    { label: 'Novel writer', icon: 'book-open' },
  ]"
/>`

const collapseCode = `<RsBreadcrumb
  :max-items="3"
  :items-before-collapse="1"
  :items-after-collapse="1"
  :items="deepPath"
/>`

const disabledCode = `<RsBreadcrumb
  :items="[
    { label: 'Home', href: '#/' },
    { label: 'Archived', href: '#/archived', disabled: true },
    { label: 'Novel writer' },
  ]"
/>`

const slotsCode = `<RsBreadcrumb :items="items">
  <template #item="{ item, isCurrent }">
    {{ isCurrent ? '●' : '○' }} {{ item.label }}
  </template>
  <template #separator>·</template>
</RsBreadcrumb>`

const eventsCode = `<RsBreadcrumb :items="items" @click="onClick" />

function onClick(item, event) {
  event.preventDefault()
  last = item.label
}`

function onClick(item: RsBreadcrumbItem, event: MouseEvent) {
  event.preventDefault()
  lastAction.value = copy.value.changeHit('click', item.label)
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="传入路径 items。最后一项是当前页，不要给它 href。跨页层级用 Breadcrumb，本页跳章节用 Anchor。"
    description-en="Pass path items. The last item is the current page — leave href off. Use Breadcrumb across pages; use Anchor to jump sections on this page."
    :code="basicCode"
  >
    <RsBreadcrumb :items="basicItems" />
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsBreadcrumb :items="basicItems" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-separator"
    title="分隔符"
    title-en="Separator"
    description="separator 是文字。未传时用 separatorIcon（默认 chevron-right）。RTL 下图标会水平翻转。"
    description-en="separator is text. When omitted, separatorIcon is used (chevron-right). The icon flips in RTL."
    :code="separatorCode"
  >
    <div class="stack">
      <RsBreadcrumb separator="/" :items="sepItems" />
      <RsBreadcrumb separator=">" :items="sepItems" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-icons"
    title="图标"
    title-en="Icons"
    description="item.icon 是 Lucide kebab-case，写在文案前。外链加 target=&quot;_blank&quot;，组件会补 noopener noreferrer。"
    description-en="item.icon is a Lucide kebab-case name, rendered before the label. External links take target=&quot;_blank&quot;; the component adds noopener noreferrer."
    :code="iconsCode"
  >
    <RsBreadcrumb :items="iconItems" />
  </DocDemo>

  <DocDemo
    id="demo-collapse"
    title="折叠"
    title-en="Collapse"
    description="路径长于 maxItems 时中间收成省略号。点省略号展开。不要靠 ResizeObserver 测宽。"
    description-en="When the path is longer than maxItems, the middle collapses to an ellipsis. A click expands it. There is no ResizeObserver width check."
    :code="collapseCode"
  >
    <RsBreadcrumb
      :max-items="3"
      :items-before-collapse="1"
      :items-after-collapse="1"
      :items="collapseItems"
    />
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 项渲染为 span，仍发 click，但不跳转。当前页本来就不可点。"
    description-en="A disabled item renders as a span. It still emits click but does not navigate. The current page is already not clickable."
    :code="disabledCode"
  >
    <RsBreadcrumb :items="disabledItems" />
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#item 自定义一项内容，外层仍是 a 或 span。#separator 换分隔符。不要把 RouterLink 再套进默认的 a 里。"
    description-en="#item customizes crumb content; the outer node stays a or span. #separator replaces the divider. Do not nest RouterLink inside the default a."
    :code="slotsCode"
  >
    <RsBreadcrumb :items="slotItems">
      <template #item="{ item, isCurrent }">
        {{ isCurrent ? '●' : '○' }} {{ item.label }}
      </template>
      <template #separator>·</template>
    </RsBreadcrumb>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 click。Hash 路由或 Vue Router 请 preventDefault 后再跳。没有 defineExpose。"
    description-en="The event you can feel is click. On a hash router or Vue Router, preventDefault then navigate. There is no defineExpose."
    :code="eventsCode"
  >
    <RsBreadcrumb :items="eventItems" @click="onClick" />
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
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
</style>
