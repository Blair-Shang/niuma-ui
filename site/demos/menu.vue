<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsMenu, type RsMenuExpose, type RsMenuItem, type RsMenuItemGroup } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const basicActive = ref('projects')
const nestedActive = ref('projects')
const nestedOpen = ref<string[]>([])
const highlightParent = ref(false)
const groupActive = ref('billing')
const groupOpen = ref<string[]>([])
const horizActive = ref('share-email')
const horizOpen = ref<string[]>([])
const collapsed = ref(true)
const collapsedActive = ref('settings')
const collapsedOpen = ref<string[]>([])
const accordionActive = ref('a-1')
const accordionOpen = ref<string[]>(['a'])
const hrefActive = ref('docs')
const sizeActive = ref('inbox')
const slotActive = ref('inbox')
const eventActive = ref('projects')
const eventOpen = ref<string[]>([])
const lastAction = ref('')
const methodLog = ref('')
const methodRef = ref<RsMenuExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    dashboard: 'Dashboard',
    workspace: 'Workspace',
    projects: 'Projects',
    docs: 'Docs',
    settings: 'Settings',
    archive: 'Archived',
    share: 'Share',
    email: 'Email',
    slack: 'Slack',
    home: 'Home',
    apps: 'Apps',
    chat: 'Chat',
    billing: 'Billing',
    security: 'Security',
    inbox: 'Inbox',
    team: 'Team',
    darkSurface: 'Dark surface — rows follow data-rs-theme, do not hard-code color',
    parentOn: 'Parent highlight on',
    parentOff: 'Parent highlight off',
    expand: 'Expand',
    collapse: 'Collapse',
    idle: 'No event yet. select / click / openChange log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: 'Call focus() or blur().',
    focused: 'focus()',
    blurred: 'blur()',
  },
  'zh-CN': {
    dashboard: '仪表盘',
    workspace: '工作区',
    projects: '项目',
    docs: '文档',
    settings: '设置',
    archive: '已归档',
    share: '分享',
    email: '邮件',
    slack: 'Slack',
    home: '首页',
    apps: '应用',
    chat: '对话',
    billing: '账单',
    security: '安全',
    inbox: '收件箱',
    team: '团队',
    darkSurface: '深色表面 — 条目跟 data-rs-theme，不要写死颜色',
    parentOn: '已开父级高亮',
    parentOff: '开启父级高亮',
    expand: '展开',
    collapse: '收起',
    idle: '还没有事件。select / click / openChange 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: '调用 focus() 或 blur()。',
    focused: 'focus()',
    blurred: 'blur()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicItems = computed<RsMenuItem[]>(() => [
  { key: 'dashboard', label: copy.value.dashboard, icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: copy.value.workspace,
    icon: 'folder',
    children: [
      { key: 'projects', label: copy.value.projects },
      { key: 'docs', label: copy.value.docs },
    ],
  },
  { key: 'settings', label: copy.value.settings, icon: 'settings' },
])

const nestedItems = computed<RsMenuItem[]>(() => [
  { key: 'dashboard', label: copy.value.dashboard, icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: copy.value.workspace,
    icon: 'folder',
    children: [
      { key: 'projects', label: copy.value.projects },
      { key: 'docs', label: copy.value.docs },
      { key: 'archive', label: copy.value.archive, disabled: true },
    ],
  },
  { key: 'settings', label: copy.value.settings, icon: 'settings' },
])

const groupItems = computed<RsMenuItemGroup[]>(() => [
  {
    label: copy.value.workspace,
    children: [
      { key: 'apps', label: copy.value.apps, icon: 'layout-dashboard' },
      { key: 'chat', label: copy.value.chat, icon: 'message-square' },
    ],
  },
  {
    label: copy.value.settings,
    children: [
      { key: 'billing', label: copy.value.billing, icon: 'credit-card' },
      { key: 'security', label: copy.value.security, icon: 'shield-check' },
    ],
  },
])

const horizItems = computed<RsMenuItem[]>(() => [
  { key: 'home', label: copy.value.home, icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: copy.value.workspace,
    icon: 'folder',
    children: [
      { key: 'projects', label: copy.value.projects },
      {
        key: 'share',
        label: copy.value.share,
        children: [
          { key: 'share-slack', label: copy.value.slack },
          { key: 'share-email', label: copy.value.email },
        ],
      },
    ],
  },
  { key: 'settings', label: copy.value.settings, icon: 'settings' },
])

const collapsedItems = computed<RsMenuItem[]>(() => [
  { key: 'dashboard', label: copy.value.dashboard, icon: 'layout-dashboard' },
  {
    key: 'workspace',
    label: copy.value.workspace,
    icon: 'folder',
    children: [
      { key: 'projects', label: copy.value.projects, icon: 'box' },
      { key: 'docs', label: copy.value.docs, icon: 'file-text' },
    ],
  },
  { key: 'settings', label: copy.value.settings, icon: 'settings' },
])

const accordionItems = computed<RsMenuItem[]>(() => [
  {
    key: 'a',
    label: copy.value.workspace,
    icon: 'folder',
    children: [
      { key: 'a-1', label: copy.value.projects },
      { key: 'a-2', label: copy.value.docs },
    ],
  },
  {
    key: 'b',
    label: copy.value.team,
    icon: 'users',
    children: [
      { key: 'b-1', label: copy.value.apps },
      { key: 'b-2', label: copy.value.chat },
    ],
  },
])

const hrefItems = computed<RsMenuItem[]>(() => [
  { key: 'home', label: copy.value.home, href: '#/', icon: 'house' },
  { key: 'docs', label: copy.value.docs, href: '#/guide/introduce', icon: 'book-open' },
  { key: 'ext', label: 'GitHub', href: 'https://github.com', target: '_blank', icon: 'external-link' },
])

const sizeItems = computed<RsMenuItem[]>(() => [
  { key: 'inbox', label: copy.value.inbox, icon: 'inbox', extra: '12' },
  { key: 'docs', label: copy.value.docs, icon: 'file-text' },
  { key: 'd1', label: '', type: 'divider' },
  { key: 'settings', label: copy.value.settings, icon: 'settings' },
])

const basicCode = `<RsMenu v-model="active" :items="items" />`

const nestedCode = `<RsMenu
  v-model="active"
  v-model:open-keys="openKeys"
  :items="items"
  highlight-parent
/>`

const groupCode = `<RsMenu
  v-model="active"
  :items="[
    { label: 'Workspace', children: [{ key: 'apps', label: 'Apps' }] },
    { label: 'Account', children: [{ key: 'billing', label: 'Billing' }] },
  ]"
/>`

const horizontalCode = `<RsMenu
  v-model="active"
  v-model:open-keys="openKeys"
  mode="horizontal"
  trigger-sub-menu-action="hover"
  :items="items"
/>`

const collapsedCode = `<RsMenu
  v-model="active"
  :items="items"
  collapsed
/>`

const accordionCode = `<RsMenu
  v-model="active"
  v-model:open-keys="openKeys"
  accordion
  :items="items"
/>`

const hrefCode = `<RsMenu
  v-model="active"
  :items="[
    { key: 'docs', label: 'Docs', href: '#/guide' },
    { key: 'ext', label: 'GitHub', href: 'https://github.com', target: '_blank' },
  ]"
  @click="(item, event) => event.preventDefault()"
/>`

const sizeCode = `<RsMenu size="sm" :items="items" />
<RsMenu size="lg" :items="items" />`

const slotsCode = `<RsMenu :items="items">
  <template #item="{ item, active }">
    {{ active ? '●' : '○' }} {{ item.label }}
  </template>
</RsMenu>`

const eventsCode = `<RsMenu
  v-model="active"
  v-model:open-keys="openKeys"
  :items="items"
  @select="onSelect"
  @click="onClick"
  @open-change="onOpenChange"
/>`

const methodsCode = `<RsMenu ref="menuRef" :items="items" />
<RsButton @click="menuRef?.focus()">focus()</RsButton>`

function onEventSelect(key: string) {
  lastAction.value = copy.value.changeHit('select', key)
}

function onEventClick(item: RsMenuItem) {
  lastAction.value = copy.value.changeHit('click', item.label)
}

function onEventOpen(keys: string[]) {
  lastAction.value = copy.value.changeHit('openChange', keys.join(', ') || '—')
}

function onHrefClick(_item: RsMenuItem, event: MouseEvent) {
  event.preventDefault()
}

function callFocus() {
  methodRef.value?.focus()
  methodLog.value = copy.value.focused
}

function callBlur() {
  methodRef.value?.blur()
  methodLog.value = copy.value.blurred
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="v-model 绑定叶子 key。带子级时点击父项展开。侧栏壳用 Sidebar。"
    description-en="v-model binds the leaf key. A parent click expands children. Use Sidebar for the chrome."
    :code="basicCode"
  >
    <div class="frame">
      <RsMenu v-model="basicActive" :items="basicItems" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsMenu v-model="basicActive" :items="basicItems" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-nested"
    title="嵌套"
    title-en="Nested"
    description="选中深层叶子会自动把祖先写入 openKeys。默认只高亮叶子；highlightParent 让祖先只改字体色。"
    description-en="Selecting a deep leaf merges ancestors into openKeys. Only the leaf highlights by default; highlightParent uses text color on ancestors."
    :code="nestedCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="secondary" @click="highlightParent = !highlightParent">
        {{ highlightParent ? copy.parentOn : copy.parentOff }}
      </RsButton>
    </div>
    <div class="frame">
      <RsMenu
        v-model="nestedActive"
        v-model:open-keys="nestedOpen"
        :items="nestedItems"
        :highlight-parent="highlightParent"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-group"
    title="分组"
    title-en="Groups"
    description="分组标题只展示，不参与选中。水平模式会藏掉分组标题。"
    description-en="A group label is not selectable. Horizontal mode hides group labels."
    :code="groupCode"
  >
    <div class="frame">
      <RsMenu v-model="groupActive" v-model:open-keys="groupOpen" :items="groupItems" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-horizontal"
    title="横向"
    title-en="Horizontal"
    description="mode=horizontal 做顶栏。triggerSubMenuAction=hover 可悬停展开；默认仍是 click。"
    description-en="mode=horizontal is a top bar. triggerSubMenuAction=hover opens on hover; the default is still click."
    :code="horizontalCode"
  >
    <div class="frame frame--wide">
      <RsMenu
        v-model="horizActive"
        v-model:open-keys="horizOpen"
        :items="horizItems"
        mode="horizontal"
        trigger-sub-menu-action="hover"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-collapsed"
    title="折叠"
    title-en="Collapsed"
    description="垂直折叠后只显示图标。有子级的项悬停会在右侧弹出浮层。水平模式忽略 collapsed。"
    description-en="Vertical collapse keeps icons only. A parent hover opens a flyout on the right. Horizontal mode ignores collapsed."
    :code="collapsedCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="secondary" @click="collapsed = !collapsed">
        {{ collapsed ? copy.expand : copy.collapse }}
      </RsButton>
    </div>
    <div class="frame" :class="{ 'frame--collapsed': collapsed }">
      <RsMenu
        v-model="collapsedActive"
        v-model:open-keys="collapsedOpen"
        :items="collapsedItems"
        :collapsed="collapsed"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-accordion"
    title="手风琴"
    title-en="Accordion"
    description="accordion 让同层只展开一个子菜单，打开时关掉兄弟及其后代。"
    description-en="accordion keeps one submenu open at the same level. Opening one closes siblings and their descendants."
    :code="accordionCode"
  >
    <div class="frame">
      <RsMenu
        v-model="accordionActive"
        v-model:open-keys="accordionOpen"
        :items="accordionItems"
        accordion
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-href"
    title="链接"
    title-en="Links"
    description="叶子可写 href / to，渲染为 a。外链 target=_blank 会补 noopener noreferrer。Hash 路由或 Vue Router 请 preventDefault。"
    description-en="A leaf may set href / to and renders as an a. target=_blank adds noopener noreferrer. On a hash router or Vue Router, preventDefault."
    :code="hrefCode"
  >
    <div class="frame">
      <RsMenu v-model="hrefActive" :items="hrefItems" @click="onHrefClick" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="size 改行高与字号。extra 在右侧。type=divider 画分隔线。"
    description-en="size changes row height and font size. extra sits on the trailing edge. type=divider draws a rule."
    :code="sizeCode"
  >
    <div class="row">
      <div class="frame">
        <RsMenu v-model="sizeActive" size="sm" :items="sizeItems" />
      </div>
      <div class="frame">
        <RsMenu v-model="sizeActive" size="lg" :items="sizeItems" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#item 自定义一行，外层仍是 button 或 a。#icon / #extra 只换两端。"
    description-en="#item customizes the row; the outer node stays a button or an a. #icon / #extra replace the ends only."
    :code="slotsCode"
  >
    <div class="frame">
      <RsMenu v-model="slotActive" :items="sizeItems">
        <template #item="{ item, active }">
          {{ active ? '●' : '○' }} {{ item.label }}
        </template>
      </RsMenu>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 select / click / openChange。自动并入祖先不发 openChange。"
    description-en="The events you can feel are select / click / openChange. Auto-merging ancestors does not fire openChange."
    :code="eventsCode"
  >
    <div class="frame">
      <RsMenu
        v-model="eventActive"
        v-model:open-keys="eventOpen"
        :items="nestedItems"
        @select="onEventSelect"
        @click="onEventClick"
        @open-change="onEventOpen"
      />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus() / blur()。模板 ref 用 RsMenuExpose。"
    description-en="The host can call focus() / blur(). Type the template ref as RsMenuExpose."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" @click="callFocus">focus()</RsButton>
      <RsButton size="sm" variant="secondary" @click="callBlur">blur()</RsButton>
    </div>
    <div class="frame">
      <RsMenu ref="methodRef" v-model="basicActive" :items="basicItems" />
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.frame {
  max-width: 14rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  padding: var(--rs-space-xs);
}
.frame--wide {
  max-width: none;
}
.frame--collapsed {
  max-width: 3.25rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-md);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-sm);
}
.canvas {
  margin: var(--rs-space-md) 0 0;
  padding: 0;
  border: none;
}
.canvas__caption {
  margin: 0 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
.stage {
  max-width: 14rem;
  padding: var(--rs-space-xs);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  border: 1px solid var(--rs-border-subtle);
}
.event-log {
  margin: var(--rs-space-sm) 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
.event-log[data-live] {
  color: var(--rs-text-primary);
}
</style>
