<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  RsButton,
  RsTabs,
  reorderTabItems,
  type RsTabItem,
  type RsTabsCloseAction,
  type RsTabsExpose,
  type RsTabsJustify,
  type RsTabsPosition,
  type RsTabsSize,
  type RsTabsVariant,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const basic = ref('overview')
const variant = ref('line')
const sizeTab = ref('overview')
const size = ref<RsTabsSize>('md')
const disabledTab = ref('general')
const positionTab = ref('overview')
const position = ref<RsTabsPosition>('left')
const overflowScroll = ref('tab-1')
const overflowDrop = ref('tab-1')
const editTab = ref('doc-1')
const editItems = ref<RsTabItem[]>([
  { value: 'home', label: 'Home', fixed: true },
  { value: 'doc-1', label: 'README.md' },
  { value: 'doc-2', label: 'api.ts' },
])
const addTab = ref('page-1')
let addSeed = 1
const addItems = ref<RsTabItem[]>([{ value: 'page-1', label: 'Tab 1' }])
const workTab = ref('one')
const showGrip = ref(false)
const workItems = ref<RsTabItem[]>([
  { value: 'one', label: 'Query 1' },
  { value: 'two', label: 'Query 2' },
  { value: 'three', label: 'Query 3' },
])
const eventTab = ref('overview')
const eventItems = ref<RsTabItem[]>([])
const layoutTab = ref('login')
const justify = ref<RsTabsJustify>('stretch')
const lazyTab = ref('light')
const methodTab = ref('overview')
const methodRef = ref<RsTabsExpose | null>(null)
const lastAction = ref('')
const methodLog = ref('')
const variantKind = ref<RsTabsVariant>('line')

const { copy } = useSiteDemo({
  'en-US': {
    overview: 'Overview',
    analytics: 'Analytics',
    settings: 'Settings',
    general: 'General',
    security: 'Security',
    billing: 'Billing',
    login: 'Sign in',
    register: 'Create account',
    light: 'Light',
    heavy: 'Heavy panel',
    extraRefresh: 'Refresh',
    bodyOverview: 'The cluster is healthy. 12,480 requests today.',
    bodyAnalytics: '1,024 weekly active users.',
    bodySettings: 'Model and access settings.',
    bodyDisabled: 'disabled still renders, but click / arrows skip it.',
    bodyPosition: 'tabPosition=left | right | bottom. Vertical overflow scrolls on Y.',
    bodyOverflow: 'Resize the pane. scroll keeps every tab; dropdown folds the rest into More.',
    bodyEdit: 'closable + fixed. Close emits; the host removes the item. Home stays.',
    bodyAdd: 'Click + to append a tab and select it. + hides when maxCount is reached.',
    bodyWork: 'Double-click to rename. Drag a tab to reorder (cursor is move). The six-dot grip stays hidden unless showDragHandle is true.',
    hideGrip: 'Hide grip',
    showGrip: 'Show grip',
    untitled: (n: number) => `Untitled ${n}`,
    tabN: (n: number) => `Tab ${n}`,
    bodyLayout: 'borderless + justify=stretch. #extra sits on the trailing edge.',
    bodyLazy: 'lazy mounts a panel on first visit. destroyInactive=false keeps it after that.',
    bodySlot: '#tab can prefix a mark. The outer node is still role=tab.',
    darkSurface: 'Dark surface — ink and text follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change / close / add / rename / reorder / contextMenu log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toOverview: 'selectTab(overview)',
    toAnalytics: 'focus(analytics)',
    methodIdle: 'Call selectTab(value) or focus(value). beforeLeave still runs.',
    methodHit: (name: string) => name,
    locked: 'Locked',
  },
  'zh-CN': {
    overview: '概览',
    analytics: '分析',
    settings: '设置',
    general: '常规',
    security: '安全',
    billing: '账单',
    login: '登录',
    register: '注册',
    light: '轻量',
    heavy: '重型面板',
    extraRefresh: '刷新',
    bodyOverview: '应用运行正常，今日请求 12,480 次。',
    bodyAnalytics: '近 7 日活跃用户 1,024。',
    bodySettings: '模型参数与访问权限。',
    bodyDisabled: 'disabled 仍渲染，点击和方向键都会跳过。',
    bodyPosition: 'tabPosition=left | right | bottom。竖排溢出沿 Y 滚动。',
    bodyOverflow: '收窄容器。scroll 保留全部标签；dropdown 把其余收进「更多」。',
    bodyEdit: 'closable + fixed。关闭只发事件，由宿主删项。Home 常驻。',
    bodyAdd: '点 + 追加一页并选中。到 maxCount 后 + 消失。',
    bodyWork: '双击重命名。整项可拖（光标是 move）。默认不画六点 grip，showDragHandle 才显示。',
    hideGrip: '隐藏 grip',
    showGrip: '显示 grip',
    untitled: (n: number) => `未命名 ${n}`,
    tabN: (n: number) => `标签 ${n}`,
    bodyLayout: 'borderless + justify=stretch。#extra 在末尾。',
    bodyLazy: 'lazy 第一次点开才挂载。destroyInactive=false 之后会留下。',
    bodySlot: '#tab 可以加标记。外层仍是 role=tab。',
    darkSurface: '深色表面 — 墨点和文字跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change / close / add / rename / reorder / contextMenu 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toOverview: 'selectTab(overview)',
    toAnalytics: 'focus(analytics)',
    methodIdle: '调用 selectTab(value) 或 focus(value)。beforeLeave 仍会跑。',
    methodHit: (name: string) => name,
    locked: '已锁定',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicItems = computed<RsTabItem[]>(() => [
  { value: 'overview', label: copy.value.overview },
  { value: 'analytics', label: copy.value.analytics, badge: 3 },
  { value: 'settings', label: copy.value.settings, icon: 'settings' },
])

const disabledItems = computed<RsTabItem[]>(() => [
  { value: 'general', label: copy.value.general },
  { value: 'security', label: copy.value.security, disabled: true },
  { value: 'billing', label: copy.value.billing },
])

const overflowItems = computed<RsTabItem[]>(() =>
  Array.from({ length: 10 }, (_, index) => ({
    value: `tab-${index + 1}`,
    label: `${copy.value.overview} ${index + 1}`,
  })),
)

const layoutItems = computed<RsTabItem[]>(() => [
  { value: 'login', label: copy.value.login },
  { value: 'register', label: copy.value.register },
])

const lazyItems = computed<RsTabItem[]>(() => [
  { value: 'light', label: copy.value.light },
  { value: 'heavy', label: copy.value.heavy },
])

const basicCode = `<RsTabs v-model="tab" :items="items">
  <template #overview>…</template>
</RsTabs>`

const variantCode = `<RsTabs v-model="tab" variant="segmented" :items="items" />
<RsTabs v-model="tab" variant="card" :items="items" />`

const sizeCode = `<RsTabs size="sm" />
<RsTabs size="md" />
<RsTabs size="lg" />`

const disabledCode = `<RsTabs
  v-model="tab"
  :items="[{ value: 'security', label: 'Security', disabled: true }]"
/>`

const positionCode = `<RsTabs tab-position="left" :items="items" />`

const overflowCode = `<RsTabs overflow="scroll" :items="many" />
<RsTabs overflow="dropdown" :items="many" />`

const addCode = `<RsTabs
  v-model="tab"
  addable
  :max-count="6"
  :items="items"
  @add="onAdd"
/>`

const editCode = `<RsTabs
  v-model="tab"
  closable
  :items="items"
  @close="onClose"
/>`

const workCode = `<RsTabs
  v-model="tab"
  draggable
  :show-drag-handle="false"
  :items="items"
  @reorder="onReorder"
/>`

const layoutCode = `<RsTabs
  v-model="tab"
  borderless
  justify="stretch"
  content-gap="md"
>
  <template #extra>
    <RsButton size="sm">Refresh</RsButton>
  </template>
</RsTabs>`

const lazyCode = `<RsTabs v-model="tab" lazy :destroy-inactive="false" :items="items" />`

const slotsCode = `<RsTabs :items="items">
  <template #tab="{ item, active }">
    <span>{{ active ? '•' : '' }} {{ item.label }}</span>
  </template>
</RsTabs>`

const eventsCode = `<RsTabs
  v-model="tab"
  closable
  addable
  @change="onChange"
  @close="onClose"
  @add="onAdd"
/>`

const methodsCode = `const el = ref<RsTabsExpose | null>(null)
el.value?.selectTab('overview')
el.value?.focus('analytics')
<RsTabs ref="el" v-model="tab" :items="items" />`

function log(name: string, detail: string) {
  lastAction.value = copy.value.changeHit(name, detail)
}

watch(
  basicItems,
  (items) => {
    if (!eventItems.value.length) {
      eventItems.value = items.map((item) => ({ ...item }))
      return
    }
    eventItems.value = eventItems.value.map((item) => {
      const src = items.find((entry) => entry.value === item.value)
      return src ? { ...item, label: src.label, icon: src.icon, badge: src.badge } : item
    })
  },
  { immediate: true },
)

watch(
  () => copy.value.tabN(1),
  (label) => {
    const first = addItems.value[0]
    if (addItems.value.length === 1 && first?.value === 'page-1') {
      addItems.value = [{ ...first, label }]
    }
  },
  { immediate: true },
)

function onClose(value: string) {
  editItems.value = editItems.value.filter((item) => item.value !== value)
  log('close', value)
}

function onAddPage() {
  addSeed += 1
  const value = `page-${addSeed}`
  addItems.value = [...addItems.value, { value, label: copy.value.tabN(addSeed) }]
  addTab.value = value
  log('add', value)
}

function onCloseAdd(value: string) {
  addItems.value = addItems.value.filter((item) => item.value !== value)
  if (addTab.value === value) addTab.value = addItems.value[0]?.value ?? ''
  log('close', value)
}

function onEventAdd() {
  addSeed += 1
  const value = `event-${addSeed}`
  eventItems.value = [...eventItems.value, { value, label: copy.value.untitled(addSeed) }]
  eventTab.value = value
  log('add', value)
}

function onEventClose(value: string) {
  eventItems.value = eventItems.value.filter((item) => item.value !== value)
  log('close', value)
}

function onWorkAdd() {
  addSeed += 1
  const value = `query-${addSeed}`
  workItems.value = [...workItems.value, { value, label: copy.value.untitled(addSeed) }]
  workTab.value = value
  log('add', value)
}

function onRename(value: string, label: string) {
  workItems.value = workItems.value.map((item) =>
    item.value === value ? { ...item, label } : item,
  )
  log('rename', `${value}:${label}`)
}

function onReorder(dragValue: string, dropValue: string) {
  workItems.value = reorderTabItems(workItems.value, dragValue, dropValue)
  log('reorder', `${dragValue}→${dropValue}`)
}

function onCloseBatch(values: string[], action: RsTabsCloseAction) {
  workItems.value = workItems.value.filter((item) => !values.includes(item.value))
  log('closeBatch', `${action}:${values.join(',')}`)
}

function onContext(action: RsTabsCloseAction, value: string) {
  log('contextMenu', `${action}:${value}`)
}

async function runSelect() {
  const ok = await methodRef.value?.selectTab('overview')
  methodLog.value = copy.value.methodHit(`selectTab → ${ok}`)
}

function runFocus() {
  methodRef.value?.focus('analytics')
  methodLog.value = copy.value.methodHit('focus(analytics)')
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基础标签页"
    title-en="Basic"
    description="默认 variant=&quot;line&quot;。面板内容用与 value 同名的插槽传入。"
    description-en="Default variant is line. Panel content uses a slot named after the value."
    :code="basicCode"
  >
    <RsTabs v-model="basic" :items="basicItems">
      <template #overview>{{ copy.bodyOverview }}</template>
      <template #analytics>{{ copy.bodyAnalytics }}</template>
      <template #settings>{{ copy.bodySettings }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-variant"
    title="形态"
    title-en="Variant"
    description="line 下划线 · segmented 胶囊 · card 卡片。variant 管外形，不要 :deep 改结构。"
    description-en="line, segmented, or card. variant is shape — do not :deep the structure."
    :code="variantCode"
  >
    <div class="row">
      <RsButton
        v-for="kind in (['line', 'segmented', 'card'] as const)"
        :key="kind"
        size="sm"
        :variant="variantKind === kind ? 'primary' : 'default'"
        @click="variantKind = kind"
      >
        {{ kind }}
      </RsButton>
    </div>
    <RsTabs v-model="variant" :variant="variantKind" :items="basicItems" class="block">
      <template #overview>{{ copy.bodyOverview }}</template>
      <template #analytics>{{ copy.bodyAnalytics }}</template>
      <template #settings>{{ copy.bodySettings }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="三档高度跟 --rs-control-height-*。未传 size 跟 ConfigProvider.controlSize。"
    description-en="Three heights. Same --rs-control-height-*. Omitted size follows ConfigProvider.controlSize."
    :code="sizeCode"
  >
    <div class="row">
      <RsButton
        v-for="kind in (['sm', 'md', 'lg'] as const)"
        :key="kind"
        size="sm"
        :variant="size === kind ? 'primary' : 'default'"
        @click="size = kind"
      >
        {{ kind }}
      </RsButton>
    </div>
    <RsTabs v-model="sizeTab" :size="size" :items="basicItems" class="block">
      <template #overview>{{ copy.bodyOverview }}</template>
      <template #analytics>{{ copy.bodyAnalytics }}</template>
      <template #settings>{{ copy.bodySettings }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="单项 disabled。方向键与点击都会跳过。深色岛跟 data-rs-theme。"
    description-en="Per-item disabled. Clicks and arrows skip it. The dark island follows data-rs-theme."
    :code="disabledCode"
  >
    <RsTabs v-model="disabledTab" :items="disabledItems">
      <template #general>{{ copy.bodyDisabled }}</template>
      <template #security>{{ copy.locked }}</template>
      <template #billing>{{ copy.bodySettings }}</template>
    </RsTabs>
    <div class="canvas">
      <p class="canvas__caption">{{ copy.darkSurface }}</p>
      <div class="stage" data-rs-theme="dark">
        <RsTabs v-model="disabledTab" :items="disabledItems">
          <template #general>{{ copy.bodyDisabled }}</template>
          <template #security>{{ copy.locked }}</template>
          <template #billing>{{ copy.bodySettings }}</template>
        </RsTabs>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-position"
    title="位置"
    title-en="Position"
    description="tabPosition 把栏放到上 / 下 / 左 / 右。竖排键盘只用上下键。"
    description-en="tabPosition puts the bar top / bottom / left / right. Vertical lists use ArrowUp / ArrowDown."
    :code="positionCode"
  >
    <div class="row">
      <RsButton
        v-for="kind in (['top', 'bottom', 'left', 'right'] as const)"
        :key="kind"
        size="sm"
        :variant="position === kind ? 'primary' : 'default'"
        @click="position = kind"
      >
        {{ kind }}
      </RsButton>
    </div>
    <RsTabs
      v-model="positionTab"
      :tab-position="position"
      :items="basicItems"
      class="block block--tall"
    >
      <template #overview>{{ copy.bodyPosition }}</template>
      <template #analytics>{{ copy.bodyAnalytics }}</template>
      <template #settings>{{ copy.bodySettings }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-overflow"
    title="溢出"
    title-en="Overflow"
    description="scroll 出现箭头；dropdown 把放不下的收进 More。竖排时沿主轴测量。"
    description-en="scroll shows arrows. dropdown folds overflow into More. Vertical tabs measure along Y."
    :code="overflowCode"
  >
    <p class="hint">{{ copy.bodyOverflow }}</p>
    <div class="narrow">
      <RsTabs v-model="overflowScroll" overflow="scroll" :items="overflowItems">
        <template v-for="item in overflowItems" :key="item.value" #[item.value]>
          {{ item.label }}
        </template>
      </RsTabs>
    </div>
    <div class="narrow">
      <RsTabs v-model="overflowDrop" overflow="dropdown" :items="overflowItems">
        <template v-for="item in overflowItems" :key="`d-${item.value}`" #[item.value]>
          {{ item.label }}
        </template>
      </RsTabs>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-add"
    title="新增标签"
    title-en="Add"
    description="addable 在栏尾放 +。点了只发 add，由宿主 push 并改 v-model。到 maxCount 后 + 消失。"
    description-en="addable puts + at the end of the bar. A click only emits add; the host pushes an item and updates v-model. + hides at maxCount."
    :code="addCode"
  >
    <p class="hint">{{ copy.bodyAdd }}</p>
    <RsTabs
      v-model="addTab"
      addable
      closable
      :max-count="6"
      :items="addItems"
      @add="onAddPage"
      @close="onCloseAdd"
    >
      <template v-for="item in addItems" :key="item.value" #[item.value]>
        {{ item.label }}
      </template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-editable"
    title="可编辑"
    title-en="Editable"
    description="关闭只发事件。fixed 项不可关、不可被批量关掉。"
    description-en="Close only emits. A fixed item cannot be closed or batch-closed."
    :code="editCode"
  >
    <p class="hint">{{ copy.bodyEdit }}</p>
    <RsTabs
      v-model="editTab"
      closable
      :items="editItems"
      @close="onClose"
    >
      <template v-for="item in editItems" :key="item.value" #[item.value]>
        {{ item.label }}
      </template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-workbench"
    title="工作台页签"
    title-en="Workbench"
    description="重命名、拖拽排序、右键关闭菜单。对齐浏览器 / VS Code 多页签。"
    description-en="Rename, drag to reorder, and a close context menu. Same idea as browser / VS Code tabs."
    :code="workCode"
  >
    <p class="hint">{{ copy.bodyWork }}</p>
    <div class="row">
      <RsButton size="sm" variant="default" @click="showGrip = !showGrip">
        {{ showGrip ? copy.hideGrip : copy.showGrip }}
      </RsButton>
    </div>
    <RsTabs
      v-model="workTab"
      closable
      addable
      renamable
      draggable
      :show-drag-handle="showGrip"
      context-menu
      :items="workItems"
      @add="onWorkAdd"
      @rename="onRename"
      @reorder="onReorder"
      @close-batch="onCloseBatch"
      @close="(value) => onCloseBatch([value], 'close')"
      @context-menu="onContext"
    >
      <template v-for="item in workItems" :key="item.value" #[item.value]>
        {{ item.label }}
      </template>
    </RsTabs>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-layout"
    title="无框与对齐"
    title-en="Layout"
    description="borderless 去掉外框。justify=stretch 等分。#extra 放刷新等操作。"
    description-en="borderless drops the chrome. justify=stretch shares width. #extra holds trailing actions."
    :code="layoutCode"
  >
    <p class="hint">{{ copy.bodyLayout }}</p>
    <div class="row">
      <RsButton
        v-for="kind in (['start', 'center', 'evenly', 'stretch'] as const)"
        :key="kind"
        size="sm"
        :variant="justify === kind ? 'primary' : 'default'"
        @click="justify = kind"
      >
        {{ kind }}
      </RsButton>
    </div>
    <RsTabs
      v-model="layoutTab"
      borderless
      content-gap="md"
      :justify="justify"
      :items="layoutItems"
      class="block"
    >
      <template #extra>
        <RsButton size="sm" variant="ghost">{{ copy.extraRefresh }}</RsButton>
      </template>
      <template #login>{{ copy.login }}</template>
      <template #register>{{ copy.register }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-lazy"
    title="懒挂载"
    title-en="Lazy"
    description="默认离开即卸载（与原先 Reka 一致）。要保状态：lazy 且 destroyInactive=false。"
    description-en="Inactive panels unmount by default (same as Reka). Keep state with lazy and destroyInactive=false."
    :code="lazyCode"
  >
    <p class="hint">{{ copy.bodyLazy }}</p>
    <RsTabs v-model="lazyTab" lazy :destroy-inactive="false" :items="lazyItems">
      <template #light>{{ copy.light }} · {{ Date.now() }}</template>
      <template #heavy>{{ copy.heavy }} · {{ Date.now() }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#tab 自定义标签内容。外层仍是 button[role=tab]。"
    description-en="#tab customizes the label. The outer node stays a button[role=tab]."
    :code="slotsCode"
  >
    <p class="hint">{{ copy.bodySlot }}</p>
    <RsTabs v-model="basic" :items="basicItems">
      <template #tab="{ item, active }">
        <span class="mark" :data-on="active ? '1' : undefined">{{ active ? '●' : '○' }}</span>
        <span>{{ item.label }}</span>
      </template>
      <template #overview>{{ copy.bodyOverview }}</template>
      <template #analytics>{{ copy.bodyAnalytics }}</template>
      <template #settings>{{ copy.bodySettings }}</template>
    </RsTabs>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change / close / closeBatch / add / rename / reorder / contextMenu。"
    description-en="The events you can feel are change, close, closeBatch, add, rename, reorder, and contextMenu."
    :code="eventsCode"
  >
    <RsTabs
      v-model="eventTab"
      closable
      addable
      :items="eventItems"
      @change="(value) => log('change', value)"
      @close="onEventClose"
      @add="onEventAdd"
    >
      <template v-for="item in eventItems" :key="item.value" #[item.value]>
        {{ item.label }}
      </template>
    </RsTabs>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 selectTab() / focus()。模板 ref 用 RsTabsExpose。selectTab 会走 beforeLeave。"
    description-en="Hosts can call selectTab() and focus(). Type the template ref as RsTabsExpose. selectTab still runs beforeLeave."
    :code="methodsCode"
  >
    <div class="row">
      <RsButton variant="default" @click="runSelect">{{ copy.toOverview }}</RsButton>
      <RsButton variant="default" @click="runFocus">{{ copy.toAnalytics }}</RsButton>
    </div>
    <RsTabs ref="methodRef" v-model="methodTab" :items="basicItems" class="block">
      <template #overview>{{ copy.bodyOverview }}</template>
      <template #analytics>{{ copy.bodyAnalytics }}</template>
      <template #settings>{{ copy.bodySettings }}</template>
    </RsTabs>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-md);
}

.block {
  margin-top: var(--rs-space-sm);
}

.block--tall {
  min-height: 12rem;
}

.narrow {
  max-width: 22rem;
  margin-bottom: var(--rs-space-md);
}

.canvas {
  margin: var(--rs-space-md) 0 0;
}

.canvas__caption {
  margin: 0 0 var(--rs-space-xs);
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.stage {
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text);
}

.hint {
  margin: 0 0 var(--rs-space-sm);
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.event-log {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.event-log[data-live] {
  color: var(--rs-text);
}

.mark {
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
}

.mark[data-on] {
  color: var(--rs-primary);
}
</style>
