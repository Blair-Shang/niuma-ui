<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsSidebar,
  RsSidebarGroup,
  RsSidebarItem,
  type RsSidebarExpose,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const collapsed = ref(false)
const placeCollapsed = ref(false)
const slotCollapsed = ref(false)
const eventCollapsed = ref(false)
const methodCollapsed = ref(false)
const active = ref('dashboard')
const lastAction = ref('')
const methodLog = ref('')
const methodRef = ref<RsSidebarExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    brand: 'Ruoshui',
    console: 'Console',
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    projects: 'Projects',
    settings: 'Settings',
    inbox: 'Inbox',
    docs: 'Docs',
    coming: 'Coming soon',
    darkSurface: 'Dark surface — rail and items follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change / click log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: 'Call expand() / collapse() / toggle() / focus().',
    methodHit: (name: string) => `${name}()`,
    user: 'Demo user',
  },
  'zh-CN': {
    brand: '弱水',
    console: '控制台',
    workspace: '工作区',
    dashboard: '仪表盘',
    projects: '项目',
    settings: '设置',
    inbox: '收件箱',
    docs: '文档',
    coming: '即将上线',
    darkSurface: '深色表面 — 侧栏和条目跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change / click 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: '调用 expand() / collapse() / toggle() / focus()。',
    methodHit: (name: string) => `${name}()`,
    user: '演示用户',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsSidebar title="Ruoshui" subtitle="Console">
  <RsSidebarGroup title="Workspace">
    <RsSidebarItem label="Dashboard" icon="layout-dashboard" active />
    <RsSidebarItem label="Projects" icon="folder" />
  </RsSidebarGroup>
</RsSidebar>`

const widthCode = `<RsSidebar title="sm" width="sm">…</RsSidebar>
<RsSidebar title="md" width="md">…</RsSidebar>
<RsSidebar title="lg" width="lg">…</RsSidebar>`

const collapsibleCode = `<RsSidebar
  v-model:collapsed="collapsed"
  title="Ruoshui"
  subtitle="Console"
  collapsible
  hotkey="b"
>
  <RsSidebarGroup title="Workspace">
    <RsSidebarItem label="Dashboard" icon="layout-dashboard" />
  </RsSidebarGroup>
</RsSidebar>`

const placementCode = `<RsSidebar title="Left" placement="left" collapsible v-model:collapsed="collapsed">
  …
</RsSidebar>
<RsSidebar title="Right" placement="right" collapsible v-model:collapsed="collapsed">
  …
</RsSidebar>`

const horizontalCode = `<RsSidebar orientation="horizontal" title="Ruoshui" collapsible>
  <RsSidebarGroup title="Workspace">
    <RsSidebarItem label="Dashboard" icon="layout-dashboard" active />
    <RsSidebarItem label="Projects" icon="folder" />
  </RsSidebarGroup>
</RsSidebar>`

const hrefCode = `<RsSidebarItem label="Docs" icon="book-open" href="#/guide/introduce" />
<RsSidebarItem
  label="External"
  icon="external-link"
  href="https://example.com"
  target="_blank"
/>
<RsSidebarItem label="Apps" icon="layout-grid" to="#/components/menu" />`

const slotsCode = `<RsSidebar v-model:collapsed="collapsed" collapsible>
  <template #header>
    <strong>RS</strong>
  </template>
  <RsSidebarGroup title="Workspace">
    <RsSidebarItem label="Inbox" icon="inbox" badge="4" />
  </RsSidebarGroup>
  <template #footer="{ collapsed }">
    {{ collapsed ? 'U' : 'Demo user' }}
  </template>
</RsSidebar>`

const eventsCode = `<RsSidebar
  v-model:collapsed="collapsed"
  collapsible
  @change="onChange"
>
  <RsSidebarItem label="Dashboard" @click="onItemClick" />
</RsSidebar>`

const methodsCode = `<RsSidebar ref="sidebar" v-model:collapsed="collapsed" collapsible>
  …
</RsSidebar>
<RsButton @click="sidebar.expand()">expand()</RsButton>
<RsButton @click="sidebar.collapse()">collapse()</RsButton>
<RsButton @click="sidebar.toggle()">toggle()</RsButton>
<RsButton @click="sidebar.focus()">focus()</RsButton>`

function onChange(next: boolean) {
  lastAction.value = copy.value.changeHit('change', String(next))
}

function onItemClick(event: MouseEvent, name: string) {
  event.preventDefault()
  active.value = name
  lastAction.value = copy.value.changeHit('click', name)
}

function callMethod(name: 'expand' | 'collapse' | 'toggle' | 'focus') {
  methodRef.value?.[name]()
  methodLog.value = copy.value.methodHit(name)
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="标题 + 分组 + 条目。Group / Item 从 Sidebar 继承折叠态，不必再传 collapsed。壳层用 Sidebar，条目树用 Menu。"
    description-en="Title, groups, and items. Group / Item inherit collapsed from Sidebar — do not pass it down. Use Sidebar for chrome and Menu for the item tree."
    :code="basicCode"
  >
    <div class="frame">
      <RsSidebar :title="copy.brand" :subtitle="copy.console">
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem :label="copy.dashboard" icon="layout-dashboard" active />
          <RsSidebarItem :label="copy.projects" icon="folder" />
          <RsSidebarItem :label="copy.settings" icon="settings" />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsSidebar :title="copy.brand" :subtitle="copy.console">
          <RsSidebarGroup :title="copy.workspace">
            <RsSidebarItem :label="copy.dashboard" icon="layout-dashboard" active />
            <RsSidebarItem :label="copy.projects" icon="folder" />
          </RsSidebarGroup>
        </RsSidebar>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-width"
    title="宽度"
    title-en="Width"
    description="sm / md / lg 三档展开宽。折叠宽走 --rs-sidebar-width-collapsed。不要在产品 CSS 里写死 rem。"
    description-en="sm / md / lg set the expanded width. Collapsed width uses --rs-sidebar-width-collapsed. Do not hard-code rem in product CSS."
    :code="widthCode"
  >
    <div class="width-row">
      <RsSidebar v-for="size in ['sm', 'md', 'lg']" :key="size" :title="size" :width="size">
        <RsSidebarGroup :title="size">
          <RsSidebarItem :label="copy.dashboard" icon="layout-dashboard" />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-collapsible"
    title="可折叠"
    title-en="Collapsible"
    description="collapsible 显示折叠钮。hotkey=&quot;b&quot; 是 Ctrl/Cmd+B，输入框内不触发。也可用外部按钮改 v-model:collapsed。"
    description-en="collapsible shows the chevron. hotkey=&quot;b&quot; is Ctrl/Cmd+B and is ignored while typing. An external button can still write v-model:collapsed."
    :code="collapsibleCode"
  >
    <div class="frame frame--layout">
      <RsSidebar
        v-model:collapsed="collapsed"
        :title="copy.brand"
        :subtitle="copy.console"
        collapsible
        hotkey="b"
      >
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem
            :label="copy.dashboard"
            icon="layout-dashboard"
            :active="active === 'dashboard'"
            @click="active = 'dashboard'"
          />
          <RsSidebarItem
            :label="copy.projects"
            icon="folder"
            :active="active === 'projects'"
            @click="active = 'projects'"
          />
          <RsSidebarItem :label="copy.inbox" icon="inbox" badge="4" />
        </RsSidebarGroup>
      </RsSidebar>
      <div class="main">
        <RsButton size="sm" @click="collapsed = !collapsed">
          collapsed = {{ collapsed }}
        </RsButton>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-placement"
    title="左右"
    title-en="Placement"
    description="placement 是物理 left / right，只改折叠箭头。侧栏不会自己贴边，由外层布局决定位置。"
    description-en="placement is physical left / right and only flips the chevron. The rail does not pin itself; the parent layout places it."
    :code="placementCode"
  >
    <div class="place-row">
      <RsSidebar
        v-model:collapsed="placeCollapsed"
        :title="copy.brand"
        placement="left"
        collapsible
      >
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem :label="copy.dashboard" icon="layout-dashboard" active />
        </RsSidebarGroup>
      </RsSidebar>
      <RsSidebar
        v-model:collapsed="placeCollapsed"
        :title="copy.brand"
        placement="right"
        collapsible
      >
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem :label="copy.settings" icon="settings" active />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-horizontal"
    title="横向"
    title-en="Horizontal"
    description="orientation=&quot;horizontal&quot; 把侧栏收成顶栏。width 被忽略，占满一行。"
    description-en="orientation=&quot;horizontal&quot; turns the rail into a top bar. width is ignored and the bar fills the row."
    :code="horizontalCode"
  >
    <div class="frame frame--wide">
      <RsSidebar orientation="horizontal" :title="copy.brand" collapsible>
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem :label="copy.dashboard" icon="layout-dashboard" active />
          <RsSidebarItem :label="copy.projects" icon="folder" />
          <RsSidebarItem :label="copy.settings" icon="settings" />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-href"
    title="链接"
    title-en="Links"
    description="有 href / to 时渲染 a。target=&quot;_blank&quot; 会补 noopener noreferrer。禁用链接仍发 click，但不跳转。"
    description-en="href / to render an anchor. target=&quot;_blank&quot; adds noopener noreferrer. A disabled link still emits click but does not navigate."
    :code="hrefCode"
  >
    <div class="frame">
      <RsSidebar :title="copy.brand">
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem
            :label="copy.docs"
            icon="book-open"
            href="#/guide/introduce"
          />
          <RsSidebarItem
            :label="copy.projects"
            icon="folder"
            to="#/components/menu"
          />
          <RsSidebarItem
            :label="copy.coming"
            icon="sparkles"
            href="#/components/sidebar"
            disabled
          />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#header 替换顶栏（含折叠钮）。#footer 收用户信息。Item #badge 自定义角标。"
    description-en="#header replaces the header, including the collapse button. #footer holds account info. Item #badge customizes the badge."
    :code="slotsCode"
  >
    <div class="frame frame--tall">
      <RsSidebar v-model:collapsed="slotCollapsed" collapsible>
        <template #header>
          <div class="custom-header">
            <span class="custom-header__logo">RS</span>
            <strong v-if="!slotCollapsed">{{ copy.brand }}</strong>
          </div>
          <RsButton size="sm" variant="ghost" @click="slotCollapsed = !slotCollapsed">
            {{ slotCollapsed ? '>' : '<' }}
          </RsButton>
        </template>
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem :label="copy.inbox" icon="inbox" badge="4" />
          <RsSidebarItem :label="copy.settings" icon="settings" />
        </RsSidebarGroup>
        <template #footer="{ collapsed: isCollapsed }">
          <span v-if="isCollapsed" class="footer-dot" :title="copy.user">U</span>
          <span v-else class="footer-user">{{ copy.user }}</span>
        </template>
      </RsSidebar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change 与 Item click。折叠钮、hotkey、expose 都会发 change。"
    description-en="The events you can feel are change and Item click. The chevron, hotkey, and expose all emit change."
    :code="eventsCode"
  >
    <div class="frame">
      <RsSidebar
        v-model:collapsed="eventCollapsed"
        :title="copy.brand"
        collapsible
        @change="onChange"
      >
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem
            :label="copy.dashboard"
            icon="layout-dashboard"
            :active="active === 'dashboard'"
            @click="onItemClick($event, 'dashboard')"
          />
          <RsSidebarItem
            :label="copy.projects"
            icon="folder"
            href="#/components/sidebar"
            @click="onItemClick($event, 'projects')"
          />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 类型是 RsSidebarExpose。expand / collapse / toggle / focus。没有 setValue()。"
    description-en="Type the template ref as RsSidebarExpose. expand / collapse / toggle / focus. There is no setValue()."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" @click="callMethod('expand')">expand()</RsButton>
      <RsButton size="sm" @click="callMethod('collapse')">collapse()</RsButton>
      <RsButton size="sm" @click="callMethod('toggle')">toggle()</RsButton>
      <RsButton size="sm" @click="callMethod('focus')">focus()</RsButton>
    </div>
    <div class="frame">
      <RsSidebar
        ref="methodRef"
        v-model:collapsed="methodCollapsed"
        :title="copy.brand"
        collapsible
      >
        <RsSidebarGroup :title="copy.workspace">
          <RsSidebarItem :label="copy.dashboard" icon="layout-dashboard" active />
        </RsSidebarGroup>
      </RsSidebar>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.frame {
  display: inline-flex;
  max-width: 100%;
  min-height: 14rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-bg);
  overflow: hidden;
}

.frame--layout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  width: 100%;
}

.frame--wide {
  display: block;
  width: 100%;
  min-height: 0;
}

.frame--tall :deep(.rs-sidebar) {
  min-height: 14rem;
}

.width-row,
.place-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-md);
  align-items: flex-start;
}

.main,
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--rs-space-sm);
  padding: var(--rs-space-lg);
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

.custom-header {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  min-width: 0;
}

.custom-header__logo,
.footer-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-primary-container);
  color: var(--rs-on-primary-container);
  font-size: var(--rs-font-size-xs);
  font-weight: 700;
}

.footer-dot {
  border-radius: var(--rs-radius-full);
}

.footer-user {
  font-size: var(--rs-font-size-sm);
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
