<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsForm,
  RsTreeSelect,
  type RsTreeNode,
  type RsTreeSelectExpose,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const value = ref('')
const searchValue = ref('')
const roles = ref<string[]>([])
const checks = ref<string[]>([])
const sizeValue = ref('pg')
const eventValue = ref('')
const methodValue = ref('')
const lastAction = ref('')
const methodLog = ref('')
const treeSelectRef = ref<RsTreeSelectExpose | null>(null)

const nodes: RsTreeNode[] = [
  {
    key: 'db',
    label: 'Database',
    children: [
      { key: 'pg', label: 'PostgreSQL' },
      { key: 'mysql', label: 'MySQL' },
    ],
  },
  {
    key: 'cache',
    label: 'Cache',
    children: [{ key: 'redis', label: 'Redis' }],
  },
]

const { copy } = useSiteDemo({
  'en-US': {
    pickNode: 'Choose a node',
    pickNodes: 'Choose nodes',
    searchHint: 'Search lives in the panel. The trigger does not take typing.',
    multipleHint: 'v-model is an array. maxTagCount=1 folds extra labels.',
    checkHint: 'checkable writes checkedKeys. showCheckedStrategy only changes the trigger label.',
    disabled: 'Disabled',
    formDisabled: 'Inside a disabled form — the tree select inherits Form.disabled',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be changed.',
    darkSurface: 'Dark surface — tree-select tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change, select, search, clear, and dropdownVisibleChange log here.',
    changeHit: (value: string) => `change → ${value || '(empty)'}`,
    selectHit: (key: string) => `select → ${key}`,
    searchHit: (query: string) => `search → ${query}`,
    clearHit: 'clear',
    openHit: (open: boolean) => `dropdownVisibleChange → ${open}`,
    toFocus: 'focus()',
    methodIdle: 'Call focus(). Open the panel with v-model:open. There is no toggle().',
    methodFocus: 'focus()',
  },
  'zh-CN': {
    pickNode: '选择节点',
    pickNodes: '选择节点',
    searchHint: '搜索在面板内。触发器不接收打字。',
    multipleHint: 'v-model 是数组。maxTagCount=1 折叠多余 label。',
    checkHint: 'checkable 写 checkedKeys。showCheckedStrategy 只改触发器文案。',
    disabled: '已禁用',
    formDisabled: '在禁用的 Form 里 — 树选择继承 Form.disabled',
    disabledHint: '不可用 — 附近写清原因。不能改值。',
    darkSurface: '深色表面 — 树选择 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change、select、search、clear、dropdownVisibleChange 会记在这里。',
    changeHit: (value: string) => `change → ${value || '（空）'}`,
    selectHit: (key: string) => `select → ${key}`,
    searchHit: (query: string) => `search → ${query}`,
    clearHit: 'clear',
    openHit: (open: boolean) => `dropdownVisibleChange → ${open}`,
    toFocus: 'focus()',
    methodIdle: '调用 focus()。面板用 v-model:open。没有 toggle()。',
    methodFocus: 'focus()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsTreeSelect v-model="value" allow-clear :tree-data="nodes" placeholder="Choose a node" />`

const searchCode = `<RsTreeSelect v-model="value" searchable allow-clear :tree-data="nodes" />`

const multipleCode = `<RsTreeSelect v-model="keys" multiple allow-clear :max-tag-count="1" :tree-data="nodes" />`

const checkableCode = `<RsTreeSelect
  v-model="keys"
  checkable
  allow-clear
  show-checked-strategy="SHOW_CHILD"
  :tree-data="nodes"
/>`

const sizeCode = `<RsTreeSelect size="ssm" />
<RsTreeSelect size="sm" />
<RsTreeSelect size="md" />
<RsTreeSelect size="lg" />`

const disabledCode = `<RsTreeSelect disabled :tree-data="nodes" />

<RsForm disabled>
  <RsTreeSelect :tree-data="nodes" />
</RsForm>`

const eventsCode = `<RsTreeSelect
  v-model="value"
  searchable
  allow-clear
  :tree-data="nodes"
  @change="onChange"
  @select="onSelect"
  @search="onSearch"
  @clear="onClear"
  @dropdown-visible-change="onOpen"
/>`

const methodsCode = `const el = ref<RsTreeSelectExpose | null>(null)
el.value?.focus()
// el.value?.toggle is undefined

<RsTreeSelect ref="el" v-model="value" :tree-data="nodes" />`

function formatValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(', ') : value
}

function onChange(next: string | string[]) {
  lastAction.value = copy.value.changeHit(formatValue(next))
}

function onSelect(key: string) {
  lastAction.value = copy.value.selectHit(key)
}

function onSearch(query: string) {
  lastAction.value = copy.value.searchHit(query)
}

function onClear() {
  lastAction.value = copy.value.clearHit
}

function onOpen(open: boolean) {
  lastAction.value = copy.value.openHit(open)
}

function runFocus() {
  treeSelectRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="从树里选一个节点。数据用 tree-data，不是 options。固定路径用 Cascader。"
    description-en="Pick one node from a tree. Data is tree-data, not options. A fixed path belongs on Cascader."
    :code="basicCode"
  >
    <div class="field">
      <RsTreeSelect
        v-model="value"
        allow-clear
        :tree-data="nodes"
        :placeholder="copy.pickNode"
      />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsTreeSelect v-model="value" allow-clear :tree-data="nodes" :placeholder="copy.pickNode" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-search"
    title="搜索"
    title-en="Search"
    description="搜索框在面板内。触发器不接收打字。要自由输入请用 AutoComplete。"
    description-en="The search box lives in the panel. The trigger does not take typing. Use AutoComplete for a free value."
    :code="searchCode"
  >
    <p class="hint">{{ copy.searchHint }}</p>
    <div class="field">
      <RsTreeSelect
        v-model="searchValue"
        searchable
        allow-clear
        :tree-data="nodes"
        :placeholder="copy.pickNode"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-multiple"
    title="多选"
    title-en="Multiple"
    description="v-model 是数组。maxTagCount 折叠多余 label。这是高亮多选，不是勾选。"
    description-en="v-model is an array. maxTagCount folds extra labels. This is highlight multi-select, not checks."
    :code="multipleCode"
  >
    <p class="hint">{{ copy.multipleHint }}</p>
    <div class="field">
      <RsTreeSelect
        v-model="roles"
        multiple
        allow-clear
        :max-tag-count="1"
        :tree-data="nodes"
        :placeholder="copy.pickNodes"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-checkable"
    title="勾选"
    title-en="Checkable"
    description="复选框写入 checkedKeys。SHOW_CHILD 只折叠触发器文案，不改 v-model。"
    description-en="Checkboxes write checkedKeys. SHOW_CHILD only folds the trigger label — not v-model."
    :code="checkableCode"
  >
    <p class="hint">{{ copy.checkHint }}</p>
    <div class="field">
      <RsTreeSelect
        v-model="checks"
        checkable
        allow-clear
        show-checked-strategy="SHOW_CHILD"
        :tree-data="nodes"
        :placeholder="copy.pickNodes"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档与其它表单控件相同：ssm / sm / md / lg。未传跟随 ConfigProvider。"
    description-en="The four sizes match other form controls: ssm / sm / md / lg. Omit to follow ConfigProvider."
    :code="sizeCode"
  >
    <div class="stack">
      <RsTreeSelect v-model="sizeValue" :tree-data="nodes" size="ssm" />
      <RsTreeSelect v-model="sizeValue" :tree-data="nodes" size="sm" />
      <RsTreeSelect v-model="sizeValue" :tree-data="nodes" size="md" />
      <RsTreeSelect v-model="sizeValue" :tree-data="nodes" size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="禁用时不能打开。也会继承 Form.disabled。"
    description-en="Disabled cannot open. Also inherits Form.disabled."
    :code="disabledCode"
  >
    <p class="hint">{{ copy.disabledHint }}</p>
    <div class="stack">
      <RsTreeSelect disabled :model-value="sizeValue" :tree-data="nodes" :aria-label="copy.disabled" />
      <RsForm disabled>
        <RsTreeSelect :tree-data="nodes" :placeholder="copy.formDisabled" />
      </RsForm>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="change / select / search / clear / dropdownVisibleChange。没有 click。"
    description-en="change / select / search / clear / dropdownVisibleChange. There is no click."
    :code="eventsCode"
  >
    <div class="field">
      <RsTreeSelect
        v-model="eventValue"
        searchable
        allow-clear
        :tree-data="nodes"
        :placeholder="copy.pickNode"
        @change="onChange"
        @select="onSelect"
        @search="onSearch"
        @clear="onClear"
        @dropdown-visible-change="onOpen"
      />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus() / blur()。没有 toggle()。模板 ref 用 RsTreeSelectExpose。"
    description-en="Hosts can call focus() / blur(). There is no toggle(). Type the template ref as RsTreeSelectExpose."
    :code="methodsCode"
  >
    <div class="field">
      <RsTreeSelect ref="treeSelectRef" v-model="methodValue" allow-clear :tree-data="nodes" />
    </div>
    <div class="row">
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.field,
.stack {
  max-width: 20rem;
}

.stack,
.row {
  display: flex;
  gap: 0.75rem;
}

.stack {
  flex-direction: column;
}

.row {
  flex-wrap: wrap;
  margin-block-start: 0.75rem;
}

.hint,
.event-log,
.canvas__caption {
  margin: 0 0 0.5rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}

.event-log {
  margin-block-start: 0.75rem;
}

.event-log[data-live] {
  color: var(--rs-text);
}

.canvas {
  margin: 1rem 0 0;
  padding: 0;
  border: none;
}

.stage {
  padding: 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  color: var(--rs-text);
  color-scheme: inherit;
}
</style>
