<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsDropdown,
  type RsDropdownExpose,
  type RsDropdownItem,
  type RsDropdownItemGroup,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const scene = ref('chat')
const mode = ref('chat')
const lastAction = ref('')
const methodLog = ref('')
const eventValue = ref('chat')
const eventOpen = ref(false)
const methodRef = ref<RsDropdownExpose | null>(null)
const slotScene = ref('chat')

const { copy } = useSiteDemo({
  'en-US': {
    chat: 'Chat',
    code: 'Code',
    kb: 'Knowledge',
    write: 'Write',
    create: 'Create',
    search: 'Search',
    more: 'More',
    copyLink: 'Copy link',
    exportPdf: 'Export PDF',
    remove: 'Delete',
    account: 'Account',
    profile: 'Profile',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    docs: 'Docs',
    locked: 'Coming soon',
    mark: '●',
    idle: 'No event yet. select / change / openChange log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: 'Call open / close / focus / blur.',
    opened: 'open()',
    closed: 'close()',
    focused: 'focus()',
    blurred: 'blur()',
    darkSurface: 'Dark surface — menu tokens follow data-rs-theme, do not hard-code color',
  },
  'zh-CN': {
    chat: '对话',
    code: '编程',
    kb: '知识库',
    write: '写作',
    create: '创作',
    search: '检索',
    more: '更多操作',
    copyLink: '复制链接',
    exportPdf: '导出 PDF',
    remove: '删除',
    account: '账号',
    profile: '资料',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    docs: '文档',
    locked: '即将上线',
    mark: '●',
    idle: '还没有事件。select / change / openChange 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: '调用 open / close / focus / blur。',
    opened: 'open()',
    closed: 'close()',
    focused: 'focus()',
    blurred: 'blur()',
    darkSurface: '深色表面 — 菜单 token 跟 data-rs-theme，不要写死颜色',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicItems = computed<RsDropdownItem[]>(() => [
  { label: copy.value.chat, value: 'chat', icon: 'message-square' },
  { label: copy.value.code, value: 'code', icon: 'folder' },
  { label: copy.value.kb, value: 'kb', icon: 'search' },
])

const groupedItems = computed<RsDropdownItemGroup[]>(() => [
  {
    label: copy.value.create,
    options: [
      { label: copy.value.chat, value: 'chat', icon: 'message-square' },
      { label: copy.value.write, value: 'write', icon: 'pen-line' },
    ],
  },
  {
    label: copy.value.search,
    options: [{ label: copy.value.kb, value: 'kb', icon: 'search' }],
  },
])

const actionItems = computed<RsDropdownItem[]>(() => [
  { label: copy.value.copyLink, value: 'copy', icon: 'link' },
  { label: copy.value.exportPdf, value: 'export', icon: 'download' },
  { label: '', value: 'div', type: 'divider' },
  { label: copy.value.remove, value: 'delete', icon: 'trash-2', tone: 'danger' },
])

const commandItems = computed<RsDropdownItem[]>(() => [
  { label: copy.value.copyLink, value: 'copy', icon: 'link', shortcut: '⌘C' },
  { label: copy.value.exportPdf, value: 'export', icon: 'download', shortcut: '⌘E' },
  { label: copy.value.docs, value: 'docs', icon: 'book-open', href: '#/components/dropdown' },
  { label: '', value: 'div', type: 'divider' },
  { label: copy.value.remove, value: 'delete', icon: 'trash-2', tone: 'danger' },
])

const submenuItems = computed<RsDropdownItem[]>(() => [
  { label: copy.value.profile, value: 'profile', icon: 'user' },
  {
    label: copy.value.theme,
    value: 'theme',
    icon: 'sun',
    children: [
      { label: copy.value.light, value: 'light' },
      { label: copy.value.dark, value: 'dark' },
    ],
  },
  { label: copy.value.docs, value: 'docs', icon: 'book-open' },
])

const disabledItems = computed<RsDropdownItem[]>(() => [
  { label: copy.value.chat, value: 'chat', icon: 'message-square' },
  { label: copy.value.locked, value: 'soon', icon: 'lock', disabled: true },
])

const basicCode = `<RsDropdown v-model="scene" :items="items" />`

const groupCode = `<RsDropdown
  v-model="mode"
  :items="[
    { label: 'Create', options: [{ label: 'Chat', value: 'chat' }] },
    { label: 'Search', options: [{ label: 'Knowledge', value: 'kb' }] },
  ]"
/>`

const actionCode = `<RsDropdown
  :items="items"
  :show-selected="false"
  placeholder="More"
  content-width="fit"
  @select="onSelect"
/>`

const triggerCode = `<RsDropdown :items="items" :show-selected="false" content-width="fit">
  <template #trigger>
    <RsButton size="sm">More</RsButton>
  </template>
</RsDropdown>`

const hoverCode = `<RsDropdown v-model="scene" :items="items" trigger="hover" />`

const sizeCode = `<RsDropdown size="ssm" :items="items" />
<RsDropdown size="sm" :items="items" />
<RsDropdown size="md" :items="items" />
<RsDropdown size="lg" :items="items" />`

const commandCode = `<RsDropdown
  :items="[
    { label: 'Copy link', value: 'copy', shortcut: '⌘C' },
    { label: 'Delete', value: 'delete', tone: 'danger' },
  ]"
  :show-selected="false"
/>`

const submenuCode = `<RsDropdown
  :items="[
    { label: 'Profile', value: 'profile' },
    { label: 'Theme', value: 'theme', children: [{ label: 'Dark', value: 'dark' }] },
  ]"
  :show-selected="false"
/>`

const disabledCode = `<RsDropdown v-model="scene" :items="items" disabled />
<RsDropdown :items="[{ label: 'Soon', value: 'soon', disabled: true }]" />`

const slotsCode = `<RsDropdown v-model="scene" :items="items">
  <template #item="{ item, selected }">
    {{ selected ? '●' : '○' }} {{ item.label }}
  </template>
</RsDropdown>`

const eventsCode = `<RsDropdown
  v-model="value"
  v-model:open="open"
  :items="items"
  @select="onSelect"
  @change="onChange"
  @open-change="onOpenChange"
/>`

const methodsCode = `<RsDropdown ref="dropdownRef" :items="items" />
<RsButton @click="dropdownRef?.open()">open()</RsButton>`

function onActionSelect(value: string) {
  lastAction.value = copy.value.changeHit('select', value)
}

function onEventSelect(value: string) {
  lastAction.value = copy.value.changeHit('select', value)
}

function onEventChange(value: string) {
  lastAction.value = copy.value.changeHit('change', value)
}

function onEventOpen(next: boolean) {
  lastAction.value = copy.value.changeHit('openChange', String(next))
}

function callOpen() {
  methodRef.value?.open()
  methodLog.value = copy.value.opened
}

function callClose() {
  methodRef.value?.close()
  methodLog.value = copy.value.closed
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
    description="带图标的一级选项，单选互斥。触发器回显当前值。表单选值请用 Select。"
    description-en="A flat exclusive list with icons. The trigger echoes the current value. Use Select to write a form field."
    :code="basicCode"
  >
    <div class="field">
      <RsDropdown v-model="scene" :items="basicItems" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsDropdown v-model="scene" :items="basicItems" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-group"
    title="分组"
    title-en="Groups"
    description="items 传入 RsDropdownItemGroup[]。分组标题只展示，不参与选中。"
    description-en="Pass RsDropdownItemGroup[]. A group label is not selectable."
    :code="groupCode"
  >
    <div class="field">
      <RsDropdown v-model="mode" :items="groupedItems" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-action"
    title="操作菜单"
    title-en="Actions"
    description="showSelected=false：触发器固定显示 placeholder，选中只发 select。适合更多操作。"
    description-en="showSelected=false keeps the placeholder and only emits select. Use it for a More menu."
    :code="actionCode"
  >
    <RsDropdown
      :items="actionItems"
      :show-selected="false"
      :placeholder="copy.more"
      content-width="fit"
      @select="onActionSelect"
    />
    <p class="log">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-trigger"
    title="自定义触发器"
    title-en="Custom trigger"
    description="#trigger 自己画按钮。图标按钮必须带 aria-label。contentWidth=fit 避免被窄按钮压扁。"
    description-en="#trigger draws the button. An icon button needs aria-label. contentWidth=fit so a narrow button does not squeeze the panel."
    :code="triggerCode"
  >
    <RsDropdown :items="actionItems" :show-selected="false" content-width="fit">
      <template #trigger>
        <RsButton size="sm">{{ copy.more }}</RsButton>
      </template>
    </RsDropdown>
  </DocDemo>

  <DocDemo
    id="demo-hover"
    title="悬停打开"
    title-en="Hover"
    description="trigger=hover 移入打开、移出关闭。键盘仍可从触发器打开。任意区域右键请用 ContextMenu。"
    description-en="trigger=hover opens on enter and closes on leave. The keyboard still opens from the trigger. Use ContextMenu for a right-click on a region."
    :code="hoverCode"
  >
    <div class="field">
      <RsDropdown v-model="scene" :items="basicItems" trigger="hover" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档 size 同时改触发器与菜单行。未传跟 Form / ConfigProvider。"
    description-en="Four sizes change the trigger and the rows. Omit size to follow Form / ConfigProvider."
    :code="sizeCode"
  >
    <div class="row">
      <RsDropdown v-model="scene" :items="basicItems" size="ssm" />
      <RsDropdown v-model="scene" :items="basicItems" size="sm" />
      <RsDropdown v-model="scene" :items="basicItems" size="md" />
      <RsDropdown v-model="scene" :items="basicItems" size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-commands"
    title="分隔 / 危险 / 快捷键"
    title-en="Divider / danger / shortcut"
    description="type=divider 画线。tone=danger 用于删除。shortcut 只展示，不代绑全局热键。href 渲染为 a。"
    description-en="type=divider draws a rule. tone=danger is for delete. shortcut is display-only. href renders as an a."
    :code="commandCode"
  >
    <RsDropdown
      :items="commandItems"
      :show-selected="false"
      :placeholder="copy.more"
      content-width="fit"
    />
  </DocDemo>

  <DocDemo
    id="demo-submenu"
    title="子菜单"
    title-en="Submenu"
    description="children 向侧面弹出一层。悬停或方向键打开。不要用 Dropdown 做应用导航，那是 Menu。"
    description-en="children open a side flyout. Hover or arrow keys open it. Do not use Dropdown for app navigation — that is Menu."
    :code="submenuCode"
  >
    <RsDropdown
      :items="submenuItems"
      :show-selected="false"
      :placeholder="copy.account"
      content-width="fit"
    />
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 锁整控件。单项 disabled 仍可见，不可选。"
    description-en="disabled locks the control. A disabled item stays visible and is not selectable."
    :code="disabledCode"
  >
    <div class="row">
      <RsDropdown v-model="scene" :items="basicItems" disabled />
      <RsDropdown v-model="scene" :items="disabledItems" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#item 自定义一行。外层仍是 button，选中与键盘不丢。"
    description-en="#item customizes the row. The outer node stays a button, so selection and the keyboard still work."
    :code="slotsCode"
  >
    <div class="field">
      <RsDropdown v-model="slotScene" :items="basicItems">
        <template #item="{ item, selected }">
          <span>{{ selected ? copy.mark : '○' }} {{ item.label }}</span>
        </template>
      </RsDropdown>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="select 每次选中都发。change 仅在 showSelected 且值变时发。openChange 记开关。"
    description-en="select fires on every choice. change fires when showSelected is on and the value changes. openChange records open/close."
    :code="eventsCode"
  >
    <div class="field">
      <RsDropdown
        v-model="eventValue"
        v-model:open="eventOpen"
        :items="basicItems"
        @select="onEventSelect"
        @change="onEventChange"
        @open-change="onEventOpen"
      />
    </div>
    <p class="log">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 调 open / close / focus / blur。类型用 RsDropdownExpose。"
    description-en="Call open / close / focus / blur on the template ref. Type it as RsDropdownExpose."
    :code="methodsCode"
  >
    <div class="field">
      <RsDropdown ref="methodRef" v-model="scene" :items="basicItems" />
    </div>
    <div class="toolbar">
      <RsButton size="sm" @click="callOpen">{{ copy.opened }}</RsButton>
      <RsButton size="sm" variant="secondary" @click="callClose">{{ copy.closed }}</RsButton>
      <RsButton size="sm" variant="secondary" @click="callFocus">{{ copy.focused }}</RsButton>
      <RsButton size="sm" variant="secondary" @click="callBlur">{{ copy.blurred }}</RsButton>
    </div>
    <p class="log">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 16rem;
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
  margin-block-start: var(--rs-space-sm);
}

.log {
  margin: var(--rs-space-sm) 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}

.canvas {
  margin: var(--rs-space-md) 0 0;
}

.canvas__caption {
  margin: 0 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}

.stage {
  padding: var(--rs-space-md);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  border: 1px solid var(--rs-border);
}
</style>
