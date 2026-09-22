<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsContextMenu, type RsContextMenuExpose, type RsContextMenuItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const last = ref('')
const eventLog = ref('')
const methodLog = ref('')
const open = ref(false)
const hidden = ref(true)
const view = ref('list')
const methodRef = ref<RsContextMenuExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    area: 'Right-click this area',
    open: 'Open',
    rename: 'Rename',
    remove: 'Delete',
    copyLink: 'Copy link',
    hint: 'Share the path',
    docs: 'Docs',
    share: 'Share',
    mail: 'Email',
    link: 'Copy link',
    move: 'Move to',
    workspace: 'Workspace',
    archive: 'Archive',
    hidden: 'Show hidden files',
    list: 'List',
    grid: 'Grid',
    view: 'View',
    locked: 'No permission',
    disabledArea: 'Disabled — the browser menu is not captured',
    emptyArea: 'Empty items — the menu does not open',
    rtlArea: 'Right-click. The submenu opens to the left.',
    keyboardArea: 'Right-click, then use the keyboard',
    idle: 'No event yet. select / openChange log here.',
    methodIdle: 'Call open() / close().',
    opened: 'open()',
    closed: 'close()',
    hit: (name: string, detail: string) => `${name} → ${detail}`,
    darkSurface: 'Dark surface — menu tokens follow data-rs-theme',
    recent: 'Latest',
  },
  'zh-CN': {
    area: '在此区域右键',
    open: '打开',
    rename: '重命名',
    remove: '删除',
    copyLink: '复制链接',
    hint: '分享路径',
    docs: '文档',
    share: '分享',
    mail: '邮件',
    link: '复制链接',
    move: '移动到',
    workspace: '工作区',
    archive: '归档',
    hidden: '显示隐藏文件',
    list: '列表',
    grid: '网格',
    view: '视图',
    locked: '无权限',
    disabledArea: '已禁用 — 不拦截浏览器菜单',
    emptyArea: '没有可点项 — 菜单不会打开',
    rtlArea: '右键。子菜单向左展开。',
    keyboardArea: '右键后用键盘操作',
    idle: '还没有事件。select / openChange 会记在这里。',
    methodIdle: '调用 open() / close()。',
    opened: 'open()',
    closed: 'close()',
    hit: (name: string, detail: string) => `${name} → ${detail}`,
    darkSurface: '深色表面 — 菜单 token 跟 data-rs-theme',
    recent: '最近',
  },
})

const basicItems = computed<RsContextMenuItem[]>(() => [
  { key: 'open', label: copy.value.open, icon: 'folder-open' },
  { key: 'rename', label: copy.value.rename, icon: 'pen-line' },
  { key: 'sep', label: '', separator: true },
  { key: 'delete', label: copy.value.remove, icon: 'trash-2', danger: true },
])

const commandItems = computed<RsContextMenuItem[]>(() => [
  { key: 'file', label: copy.value.view, separator: true },
  { key: 'copy', label: copy.value.copyLink, icon: 'link', shortcut: '⌘C', hint: copy.value.hint },
  { key: 'docs', label: copy.value.docs, icon: 'book-open', href: '#/components/context-menu' },
  { key: 'sep', label: '', separator: true },
  { key: 'delete', label: copy.value.remove, icon: 'trash-2', danger: true, shortcut: '⌫' },
])

const submenuItems = computed<RsContextMenuItem[]>(() => [
  { key: 'open', label: copy.value.open, icon: 'folder-open' },
  {
    key: 'share',
    label: copy.value.share,
    icon: 'share-2',
    children: [
      { key: 'mail', label: copy.value.mail, icon: 'mail' },
      { key: 'link', label: copy.value.link, icon: 'link' },
    ],
  },
  {
    key: 'move',
    label: copy.value.move,
    icon: 'folder',
    children: [
      {
        key: 'workspace',
        label: copy.value.workspace,
        children: [{ key: 'archive', label: copy.value.archive }],
      },
    ],
  },
])

const checkItems = computed<RsContextMenuItem[]>(() => [
  { key: 'hidden', label: copy.value.hidden, type: 'checkbox', checked: hidden.value },
  { key: 'view', label: copy.value.view, separator: true },
  { key: 'list', label: copy.value.list, type: 'radio', group: 'view', checked: view.value === 'list' },
  { key: 'grid', label: copy.value.grid, type: 'radio', group: 'view', checked: view.value === 'grid' },
])

const disabledItems = computed<RsContextMenuItem[]>(() => [
  { key: 'open', label: copy.value.open, icon: 'folder-open' },
  { key: 'locked', label: copy.value.locked, icon: 'lock', disabled: true },
])

const slotItems = computed<RsContextMenuItem[]>(() => [
  { key: 'open', label: copy.value.open, icon: 'folder-open' },
  { key: 'rename', label: copy.value.rename, icon: 'pen-line' },
])

const note = computed(() => last.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

function onSelect(key: string) {
  last.value = copy.value.hit('select', key)
  if (key === 'hidden') hidden.value = !hidden.value
  if (key === 'list' || key === 'grid') view.value = key
}

function onOpenChange(next: boolean) {
  eventLog.value = copy.value.hit('openChange', String(next))
}

function callOpen() {
  methodRef.value?.open()
  methodLog.value = copy.value.opened
}

function callClose() {
  methodRef.value?.close()
  methodLog.value = copy.value.closed
}

const basicCode = `<RsContextMenu :items="items" @select="onSelect">
  <div>Right-click this area</div>
</RsContextMenu>`

const commandCode = `<RsContextMenu
  :items="[
    { key: 'file', label: 'File', separator: true },
    { key: 'copy', label: 'Copy link', shortcut: '⌘C', hint: 'Share the path' },
    { key: 'docs', label: 'Docs', href: '#/components/context-menu' },
    { key: 'delete', label: 'Delete', danger: true },
  ]"
/>`

const submenuCode = `<RsContextMenu
  :items="[
    { key: 'share', label: 'Share', children: [{ key: 'mail', label: 'Email' }] },
    { key: 'move', label: 'Move to', children: [
      { key: 'workspace', label: 'Workspace', children: [{ key: 'archive', label: 'Archive' }] },
    ] },
  ]"
/>`

const checkCode = `<RsContextMenu
  :items="[
    { key: 'hidden', label: 'Show hidden', type: 'checkbox', checked: hidden },
    { key: 'list', label: 'List', type: 'radio', group: 'view', checked: view === 'list' },
  ]"
  @select="onSelect"
/>`

const disabledCode = `<RsContextMenu :items="items" disabled>
  <div>Disabled</div>
</RsContextMenu>
<RsContextMenu :items="[{ key: 'locked', label: 'No permission', disabled: true }]" />`

const keyboardCode = `<!-- ArrowUp/Down, Home/End, typeahead, Enter, Esc -->
<!-- Left/Right open a submenu (flipped in RTL). Shift+F10 opens. -->`

const slotsCode = `<RsContextMenu :items="items">
  <template #item="{ item, highlighted }">
    {{ highlighted ? '●' : '○' }} {{ item.label }}
  </template>
</RsContextMenu>`

const eventsCode = `<RsContextMenu
  v-model:open="open"
  :items="items"
  @select="onSelect"
  @open-change="onOpenChange"
/>`

const methodsCode = `<RsContextMenu ref="menuRef" :items="items" />
<RsButton @click="menuRef?.open()">open()</RsButton>`

const sizeCode = `<RsContextMenu size="sm" :items="items" />
<RsContextMenu size="md" :items="items" />
<RsContextMenu size="lg" :items="items" />`

const rtlCode = `<div dir="rtl">
  <RsContextMenu :items="items" />
</div>`

const emptyCode = `<RsContextMenu :items="[]">
  <div>Nothing to show</div>
</RsContextMenu>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="在触发区右键打开。@select 回传 key。面板挂到 body，并抄触发处的主题。"
    description-en="Right-click the trigger. @select returns the key. The panel mounts on body and copies the theme from the trigger."
    :code="basicCode"
  >
    <RsContextMenu :items="basicItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.area }}</button>
    </RsContextMenu>
    <p class="log">{{ copy.recent }}：{{ note }}</p>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsContextMenu :items="basicItems" @select="onSelect">
          <button type="button" class="trigger">{{ copy.area }}</button>
        </RsContextMenu>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-commands"
    title="分隔 / 危险 / 快捷键"
    title-en="Divider / danger / shortcut"
    description="separator 画线；带 label 时是分组标题。danger 用于删除。shortcut 只展示。href 渲染为链接。"
    description-en="separator draws a rule. A label on it is a group heading. danger is for delete. shortcut is display-only. href renders a link."
    :code="commandCode"
  >
    <RsContextMenu :items="commandItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.area }}</button>
    </RsContextMenu>
  </DocDemo>

  <DocDemo
    id="demo-submenu"
    title="子菜单"
    title-en="Submenu"
    description="children 向侧面展开，可以多层。悬停或方向键打开。父级不发 select。"
    description-en="children open to the side, including nested levels. Hover or the arrow keys open them. A parent does not emit select."
    :code="submenuCode"
  >
    <RsContextMenu :items="submenuItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.area }}</button>
    </RsContextMenu>
  </DocDemo>

  <DocDemo
    id="demo-check"
    title="勾选与单选"
    title-en="Checkbox / radio"
    description="type=checkbox / radio 用 menuitemcheckbox / menuitemradio。勾选态由你持有。这类项默认不关闭菜单。"
    description-en="type=checkbox / radio uses menuitemcheckbox / menuitemradio. You own checked. These items stay open."
    :code="checkCode"
  >
    <RsContextMenu :items="checkItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.area }}</button>
    </RsContextMenu>
    <p class="log">{{ copy.hidden }}：{{ hidden }} · {{ copy.view }}：{{ view }}</p>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 整组件不拦截右键。单项 disabled 仍可见，方向键会跳过。"
    description-en="disabled on the component does not capture the right-click. A disabled item stays visible and is skipped by the arrow keys."
    :code="disabledCode"
  >
    <div class="row">
      <RsContextMenu :items="basicItems" disabled>
        <button type="button" class="trigger">{{ copy.disabledArea }}</button>
      </RsContextMenu>
      <RsContextMenu :items="disabledItems" @select="onSelect">
        <button type="button" class="trigger">{{ copy.area }}</button>
      </RsContextMenu>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-keyboard"
    title="键盘"
    title-en="Keyboard"
    description="上下键、Home / End、首字母、Enter 选中。左右键开关子菜单，RTL 对调。Esc 先关子菜单。Shift+F10 可打开。Tab 关闭且不锁焦点。"
    description-en="Arrows, Home / End, typeahead, and Enter choose. Left / Right toggle a submenu and flip in RTL. Esc closes a submenu first. Shift+F10 opens it. Tab closes and does not trap focus."
    :code="keyboardCode"
  >
    <RsContextMenu :items="submenuItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.keyboardArea }}</button>
    </RsContextMenu>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#item 替换文字列。外层仍是 button，图标、快捷键和键盘不丢。"
    description-en="#item replaces the text column. The outer node stays a button, so the icon, shortcut, and keyboard still work."
    :code="slotsCode"
  >
    <RsContextMenu :items="slotItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.area }}</button>
      <template #item="{ item, highlighted }">
        <span class="rs-context-menu__label">{{ highlighted ? '●' : '○' }} {{ item.label }}</span>
      </template>
    </RsContextMenu>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="受控与事件"
    title-en="Controlled"
    description="v-model:open 可从外面关掉。select 在选中叶子时发。openChange 记开关，首次挂载不发。"
    description-en="v-model:open can close it from outside. select fires for a leaf. openChange records open and close. The initial mount does not fire."
    :code="eventsCode"
  >
    <RsContextMenu
      v-model:open="open"
      :items="basicItems"
      @select="onSelect"
      @open-change="onOpenChange"
    >
      <button type="button" class="trigger">{{ copy.area }}</button>
    </RsContextMenu>
    <div class="toolbar">
      <RsButton size="sm" variant="secondary" @click="open = false">{{ copy.closed }}</RsButton>
    </div>
    <p class="log">{{ eventLog || note }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 调 open / close。不传坐标时贴着触发器打开。类型用 RsContextMenuExpose。"
    description-en="Call open / close on the template ref. Without a point, it opens at the trigger. Type it as RsContextMenuExpose."
    :code="methodsCode"
  >
    <RsContextMenu ref="methodRef" :items="basicItems" @select="onSelect">
      <button type="button" class="trigger">{{ copy.area }}</button>
    </RsContextMenu>
    <div class="toolbar">
      <RsButton size="sm" @click="callOpen">{{ copy.opened }}</RsButton>
      <RsButton size="sm" variant="secondary" @click="callClose">{{ copy.closed }}</RsButton>
    </div>
    <p class="log">{{ methodNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="size 只改菜单行高。不传保持右键菜单自己的紧凑密度。"
    description-en="size changes the row height. Omit it to keep the context menu's own compact density."
    :code="sizeCode"
  >
    <div class="row">
      <RsContextMenu :items="basicItems" size="sm" @select="onSelect">
        <button type="button" class="trigger">sm</button>
      </RsContextMenu>
      <RsContextMenu :items="basicItems" size="md" @select="onSelect">
        <button type="button" class="trigger">md</button>
      </RsContextMenu>
      <RsContextMenu :items="basicItems" size="lg" @select="onSelect">
        <button type="button" class="trigger">lg</button>
      </RsContextMenu>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-rtl"
    title="从右到左"
    title-en="RTL"
    description="触发区在 dir=rtl 里时，面板抄写这个 dir。子菜单向左展开，箭头镜像。"
    description-en="When the trigger sits in dir=rtl, the panel copies that dir. Submenus open to the left and the arrow flips."
    :code="rtlCode"
  >
    <div dir="rtl">
      <RsContextMenu :items="submenuItems" @select="onSelect">
        <button type="button" class="trigger">{{ copy.rtlArea }}</button>
      </RsContextMenu>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-empty"
    title="空菜单"
    title-en="Empty"
    description="只有分隔线、或 items 为空时不打开，避免空白气泡。右键会被吃掉，不弹出浏览器菜单。"
    description-en="Separators only, or an empty list, does not open — there is no empty bubble. The right-click is consumed, so the browser menu does not appear either."
    :code="emptyCode"
  >
    <RsContextMenu :items="[]">
      <button type="button" class="trigger">{{ copy.emptyArea }}</button>
    </RsContextMenu>
  </DocDemo>
</template>

<style scoped>
.trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 5.5rem;
  border: 1px dashed var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-secondary);
  font: inherit;
  cursor: context-menu;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-md);
}

.row > * {
  flex: 1 1 14rem;
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
