<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsSelect, type RsSelectExpose, type RsSelectOption } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const model = ref('gpt-4o')
const searchModel = ref('')
const roles = ref<string[]>(['member'])
const sizeModel = ref('sm')
const variantModel = ref('outlined')
const statusModel = ref('')
const groupModel = ref('go')
const createModel = ref('')
const locked = ref('gpt-4o')
const eventModel = ref('')
const methodModel = ref('')
const lastAction = ref('')
const methodLog = ref('')
const selectRef = ref<RsSelectExpose | null>(null)

const options: RsSelectOption[] = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Claude', value: 'claude' },
]

const roleOptions: RsSelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' },
  { label: 'Guest', value: 'guest' },
]

const groupOptions = [
  {
    label: 'Backend',
    options: [
      { label: 'Go', value: 'go' },
      { label: 'Rust', value: 'rust' },
    ],
  },
  {
    label: 'Frontend',
    options: [
      { label: 'Vue', value: 'vue' },
      { label: 'React', value: 'react' },
    ],
  },
]

const { copy } = useSiteDemo({
  'en-US': {
    pickModel: 'Model',
    pickRole: 'Roles',
    searchHint: 'Search lives in the panel. The trigger does not take typing.',
    multipleHint: 'maxTagCount=1 folds extra tags. responsive fits the trigger width.',
    outlined: 'Outlined',
    filled: 'Filled',
    borderless: 'Borderless',
    error: 'Error',
    warning: 'Warning',
    createHint: 'Type a type that is not in the list, then Enter.',
    disabled: 'Disabled',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be changed.',
    darkSurface: 'Dark surface — select tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. select, deselect, clear, and dropdownVisibleChange log here.',
    selectHit: (value: string) => `select → ${value}`,
    deselectHit: (value: string) => `deselect → ${value}`,
    clearHit: 'clear',
    openHit: (open: boolean) => `dropdownVisibleChange → ${open}`,
    toFocus: 'focus()',
    toSet: 'setValue()',
    toClear: 'clearValidation()',
    methodIdle: 'Call focus / setValue / clearValidation.',
    methodFocus: 'focus()',
    methodSet: 'setValue → claude',
    methodClear: 'clearValidation()',
  },
  'zh-CN': {
    pickModel: '模型',
    pickRole: '角色',
    searchHint: '搜索在面板内。触发器不接收打字。',
    multipleHint: 'maxTagCount=1 折叠多余标签。responsive 按触发器宽度收。',
    outlined: '描边',
    filled: '填充',
    borderless: '无边框',
    error: '错误',
    warning: '警告',
    createHint: '输入列表里没有的类型，再按 Enter。',
    disabled: '禁用',
    disabledHint: '不可用 — 附近写清原因。不能改值。',
    darkSurface: '深色表面 — 选择器 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。select、deselect、clear、dropdownVisibleChange 会记在这里。',
    selectHit: (value: string) => `select → ${value}`,
    deselectHit: (value: string) => `deselect → ${value}`,
    clearHit: 'clear',
    openHit: (open: boolean) => `dropdownVisibleChange → ${open}`,
    toFocus: 'focus()',
    toSet: 'setValue()',
    toClear: 'clearValidation()',
    methodIdle: '调用 focus / setValue / clearValidation。',
    methodFocus: 'focus()',
    methodSet: 'setValue → claude',
    methodClear: 'clearValidation()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsSelect v-model="model" :options="options" />`

const searchCode = `<RsSelect v-model="model" :options="options" searchable clearable />`

const multipleCode = `<RsSelect v-model="roles" :options="roleOptions" multiple clearable :max-tag-count="1" />`

const sizeCode = `<RsSelect size="ssm" />
<RsSelect size="sm" />
<RsSelect size="md" />
<RsSelect size="lg" />`

const variantCode = `<RsSelect variant="outlined" />
<RsSelect variant="filled" />
<RsSelect variant="borderless" />`

const statusCode = `<RsSelect status="error" />
<RsSelect status="warning" />`

const groupCode = `<RsSelect :options="[{ label: 'Backend', options: [...] }]" />`

const createCode = `<RsSelect v-model="value" :options="options" creatable />`

const disabledCode = `<RsSelect disabled :model-value="model" :options="options" />`

const eventsCode = `<RsSelect
  v-model="value"
  clearable
  @select="onSelect"
  @deselect="onDeselect"
  @clear="onClear"
  @dropdown-visible-change="onOpen"
/>`

const methodsCode = `const el = ref<RsSelectExpose | null>(null)
el.value?.focus()
el.value?.setValue('claude')
<RsSelect ref="el" v-model="value" :options="options" />`

function onSelect(value: string | number) {
  lastAction.value = copy.value.selectHit(String(value))
}

function onDeselect(value: string | number) {
  lastAction.value = copy.value.deselectHit(String(value))
}

function onClear() {
  lastAction.value = copy.value.clearHit
}

function onOpen(open: boolean) {
  lastAction.value = copy.value.openHit(open)
}

function runFocus() {
  selectRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runSet() {
  selectRef.value?.setValue('claude')
  methodLog.value = copy.value.methodSet
}

function runClear() {
  selectRef.value?.clearValidation()
  methodLog.value = copy.value.methodClear
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="从列表中选一项。选项很多、需要搜索或远程时用 Select，而不是 Radio。"
    description-en="Pick one from a list. Use Select when the list is long, searchable, or remote — not Radio."
    :code="basicCode"
  >
    <div class="field">
      <RsSelect v-model="model" :options="options" :placeholder="copy.pickModel" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsSelect v-model="model" :options="options" />
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
      <RsSelect
        v-model="searchModel"
        :options="options"
        searchable
        clearable
        :placeholder="copy.pickModel"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-multiple"
    title="多选"
    title-en="Multiple"
    description="v-model 是数组。maxTagCount 折叠多余标签。"
    description-en="v-model is an array. maxTagCount folds extra tags."
    :code="multipleCode"
  >
    <p class="hint">{{ copy.multipleHint }}</p>
    <div class="field">
      <RsSelect
        v-model="roles"
        :options="roleOptions"
        multiple
        clearable
        :max-tag-count="1"
        :placeholder="copy.pickRole"
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
      <RsSelect v-model="sizeModel" :options="options" size="ssm" />
      <RsSelect v-model="sizeModel" :options="options" size="sm" />
      <RsSelect v-model="sizeModel" :options="options" size="md" />
      <RsSelect v-model="sizeModel" :options="options" size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-variant"
    title="形态"
    title-en="Variant"
    description="outlined / filled / borderless。只改触发器，不改面板。"
    description-en="outlined / filled / borderless. Trigger only — the panel stays the same."
    :code="variantCode"
  >
    <div class="stack">
      <RsSelect v-model="variantModel" :options="options" variant="outlined" :placeholder="copy.outlined" />
      <RsSelect v-model="variantModel" :options="options" variant="filled" :placeholder="copy.filled" />
      <RsSelect v-model="variantModel" :options="options" variant="borderless" :placeholder="copy.borderless" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-status"
    title="状态"
    title-en="Status"
    description="error 画在触发器上，与 Input 一致。warning 是警告框。"
    description-en="error paints the trigger, same as Input. warning is a warning border."
    :code="statusCode"
  >
    <div class="stack">
      <RsSelect v-model="statusModel" :options="options" status="error" :placeholder="copy.error" />
      <RsSelect v-model="statusModel" :options="options" status="warning" :placeholder="copy.warning" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-group"
    title="分组"
    title-en="Groups"
    description="分组写在 options 里。没有 SelectGroup 组件。"
    description-en="Put groups in options. There is no SelectGroup component."
    :code="groupCode"
  >
    <div class="field">
      <RsSelect v-model="groupModel" :options="groupOptions" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-create"
    title="创建选项"
    title-en="Creatable"
    description="列表没有的值可以提交。Enter 或点「使用 …」。"
    description-en="A value not in the list can be committed. Press Enter or the “Use …” row."
    :code="createCode"
  >
    <p class="hint">{{ copy.createHint }}</p>
    <div class="field">
      <RsSelect v-model="createModel" :options="options" creatable clearable />
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
    <div class="field">
      <RsSelect :model-value="locked" :options="options" disabled />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="select / deselect / clear / dropdownVisibleChange。没有 click。"
    description-en="select / deselect / clear / dropdownVisibleChange. There is no click."
    :code="eventsCode"
  >
    <div class="field">
      <RsSelect
        v-model="eventModel"
        :options="options"
        clearable
        @select="onSelect"
        @deselect="onDeselect"
        @clear="onClear"
        @dropdown-visible-change="onOpen"
      />
    </div>
    <p class="log">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主调用 focus / setValue / clearValidation。validate 留给 Form。"
    description-en="The host calls focus / setValue / clearValidation. validate belongs with Form."
    :code="methodsCode"
  >
    <div class="field">
      <RsSelect ref="selectRef" v-model="methodModel" :options="options" clearable />
    </div>
    <div class="row">
      <RsButton size="sm" @click="runFocus">{{ copy.toFocus }}</RsButton>
      <RsButton size="sm" @click="runSet">{{ copy.toSet }}</RsButton>
      <RsButton size="sm" @click="runClear">{{ copy.toClear }}</RsButton>
    </div>
    <p class="log">{{ methodNote }}</p>
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
  margin-top: 0.75rem;
}
.hint,
.log,
.canvas__caption {
  margin: 0 0 0.5rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
.log {
  margin-top: 0.75rem;
}
.canvas {
  margin: 1rem 0 0;
  padding: 0;
  border: none;
}
.stage {
  padding: 1rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  border: 1px solid var(--rs-border);
}
</style>
