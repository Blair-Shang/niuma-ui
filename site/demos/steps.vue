<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsSteps,
  type RsStepItem,
  type RsStepsExpose,
  type RsStepsSize,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const step = ref('profile')
const vertical = ref('mapping')
const sizeStep = ref('account')
const size = ref<RsStepsSize>('md')
const labelStep = ref('design')
const statusStep = ref('review')
const clickStep = ref('billing')
const dotStep = ref('one')
const iconStep = ref('team')
const slotStep = ref('write')
const eventStep = ref('account')
const methodStep = ref('info')
const methodRef = ref<RsStepsExpose | null>(null)
const lastAction = ref('')
const methodLog = ref('')
const sizes: RsStepsSize[] = ['ssm', 'sm', 'md', 'lg']

const { copy } = useSiteDemo({
  'en-US': {
    account: 'Account',
    profile: 'Profile',
    done: 'Done',
    profileDesc: 'Avatar and bio',
    upload: 'Upload',
    mapping: 'Map columns',
    imported: 'Import',
    design: 'Design',
    build: 'Build',
    verify: 'Verify',
    submit: 'Submit',
    review: 'Review',
    publish: 'Publish',
    reviewDesc: 'Documents were incomplete',
    plan: 'Plan',
    billing: 'Billing',
    confirm: 'Confirm',
    locked: 'Invite later',
    one: 'Prepare',
    two: 'Run',
    three: 'Done',
    user: 'Owner',
    team: 'Team',
    ship: 'Ship',
    write: 'Write',
    test: 'Test',
    release: 'Release',
    info: 'Basics',
    config: 'Config',
    darkSurface: 'Dark surface — indicators follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. click / change log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: 'Call next() / prev() / goTo() / focus().',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    next: 'next()',
    prev: 'prev()',
    goTo: 'goTo(config)',
    focus: 'focus()',
  },
  'zh-CN': {
    account: '账号',
    profile: '资料',
    done: '完成',
    profileDesc: '头像与简介',
    upload: '上传',
    mapping: '映射',
    imported: '导入',
    design: '设计',
    build: '开发',
    verify: '验收',
    submit: '提交',
    review: '审核',
    publish: '发布',
    reviewDesc: '资料不完整',
    plan: '方案',
    billing: '账单',
    confirm: '确认',
    locked: '稍后邀请',
    one: '准备',
    two: '执行',
    three: '完成',
    user: '负责人',
    team: '团队',
    ship: '发布',
    write: '编写',
    test: '测试',
    release: '上线',
    info: '基本信息',
    config: '运行配置',
    darkSurface: '深色表面 — 指示器跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。click / change 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: '调用 next() / prev() / goTo() / focus()。',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    next: 'next()',
    prev: 'prev()',
    goTo: 'goTo(config)',
    focus: 'focus()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicItems = computed<RsStepItem[]>(() => [
  { value: 'account', title: copy.value.account },
  { value: 'profile', title: copy.value.profile, description: copy.value.profileDesc },
  { value: 'done', title: copy.value.done },
])

const verticalItems = computed<RsStepItem[]>(() => [
  { value: 'upload', title: copy.value.upload },
  { value: 'mapping', title: copy.value.mapping },
  { value: 'import', title: copy.value.imported },
])

const labelItems = computed<RsStepItem[]>(() => [
  { value: 'design', title: copy.value.design },
  { value: 'build', title: copy.value.build },
  { value: 'verify', title: copy.value.verify },
])

const statusItems = computed<RsStepItem[]>(() => [
  { value: 'submit', title: copy.value.submit, status: 'finish' },
  { value: 'review', title: copy.value.review, status: 'error', description: copy.value.reviewDesc },
  { value: 'publish', title: copy.value.publish, status: 'wait' },
])

const clickItems = computed<RsStepItem[]>(() => [
  { value: 'plan', title: copy.value.plan },
  { value: 'billing', title: copy.value.billing },
  { value: 'confirm', title: copy.value.confirm, disabled: true },
])

const dotItems = computed<RsStepItem[]>(() => [
  { value: 'one', title: copy.value.one },
  { value: 'two', title: copy.value.two },
  { value: 'three', title: copy.value.three },
])

const iconItems = computed<RsStepItem[]>(() => [
  { value: 'user', title: copy.value.user, icon: 'user' },
  { value: 'team', title: copy.value.team, icon: 'users' },
  { value: 'ship', title: copy.value.ship, icon: 'rocket' },
])

const slotItems = computed<RsStepItem[]>(() => [
  { value: 'write', title: copy.value.write },
  { value: 'test', title: copy.value.test },
  { value: 'release', title: copy.value.release },
])

const eventItems = computed<RsStepItem[]>(() => [
  { value: 'account', title: copy.value.account },
  { value: 'profile', title: copy.value.profile },
  { value: 'done', title: copy.value.done },
])

const methodItems = computed<RsStepItem[]>(() => [
  { value: 'info', title: copy.value.info },
  { value: 'config', title: copy.value.config },
  { value: 'review', title: copy.value.review },
])

const basicCode = `<RsSteps
  v-model="step"
  :items="[
    { value: 'account', title: 'Account' },
    { value: 'profile', title: 'Profile', description: 'Avatar and bio' },
    { value: 'done', title: 'Done' },
  ]"
/>`

const verticalCode = `<RsSteps
  v-model="step"
  orientation="vertical"
  :items="items"
/>`

const sizeCode = `<RsSteps v-model="step" size="sm" :items="items" />`

const labelCode = `<RsSteps
  v-model="step"
  label-placement="bottom"
  :items="items"
/>`

const statusCode = `<RsSteps
  v-model="step"
  :percent="40"
  status="error"
  :items="[
    { value: 'submit', title: 'Submit', status: 'finish' },
    { value: 'review', title: 'Review', status: 'error' },
    { value: 'publish', title: 'Publish' },
  ]"
/>`

const clickableCode = `<RsSteps
  v-model="step"
  clickable
  :items="[
    { value: 'plan', title: 'Plan' },
    { value: 'billing', title: 'Billing' },
    { value: 'confirm', title: 'Confirm', disabled: true },
  ]"
/>`

const dotCode = `<RsSteps v-model="step" type="dot" :items="items" />`

const iconsCode = `<RsSteps
  v-model="step"
  :items="[
    { value: 'user', title: 'Owner', icon: 'user' },
    { value: 'team', title: 'Team', icon: 'users' },
    { value: 'ship', title: 'Ship', icon: 'rocket' },
  ]"
/>`

const slotsCode = `<RsSteps v-model="step" :items="items">
  <template #icon="{ index, status }">
    {{ status === 'finish' ? '✓' : index + 1 }}
  </template>
  <template #title="{ item, active }">
    {{ active ? '●' : '○' }} {{ item.title }}
  </template>
</RsSteps>`

const eventsCode = `<RsSteps
  v-model="step"
  clickable
  :items="items"
  @change="onChange"
  @click="onClick"
/>`

const methodsCode = `<RsSteps ref="stepsRef" v-model="step" :items="items" />

stepsRef.next()
stepsRef.prev()
stepsRef.goTo('config')
stepsRef.focus()`

function onChange(value: string) {
  lastAction.value = copy.value.changeHit('change', value)
}

function onClick(item: RsStepItem) {
  lastAction.value = copy.value.changeHit('click', item.value)
}

function runNext() {
  const value = methodRef.value?.next()
  methodLog.value = copy.value.methodHit('next', value ?? 'undefined')
}

function runPrev() {
  const value = methodRef.value?.prev()
  methodLog.value = copy.value.methodHit('prev', value ?? 'undefined')
}

function runGoTo() {
  const ok = methodRef.value?.goTo('config')
  methodLog.value = copy.value.methodHit('goTo', String(ok))
}

function runFocus() {
  methodRef.value?.focus()
  methodLog.value = copy.value.methodHit('focus', methodStep.value)
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="v-model 绑定当前步骤 value。之前为 finish（勾），当前 process，之后 wait。不要用下标当 id。"
    description-en="v-model binds the current step value. Earlier steps are finish (check), the current is process, later steps wait. Do not use an index as the id."
    :code="basicCode"
  >
    <RsSteps v-model="step" :items="basicItems" />
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsSteps v-model="step" :items="basicItems" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-vertical"
    title="纵向"
    title-en="Vertical"
    description="orientation=&quot;vertical&quot; 把连线接到指示器下方，适合向导侧栏。"
    description-en="orientation=&quot;vertical&quot; drops the connector under the indicator. Use it for a wizard side rail."
    :code="verticalCode"
  >
    <div class="vertical-wrap">
      <RsSteps v-model="vertical" :items="verticalItems" orientation="vertical" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档跟 RsComponentSize。未传跟 Form / ConfigProvider.control-size。"
    description-en="Four steps follow RsComponentSize. Omit to follow Form / ConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="toolbar">
      <RsButton
        v-for="item in sizes"
        :key="item"
        size="sm"
        :variant="size === item ? 'primary' : 'default'"
        @click="size = item"
      >
        {{ item }}
      </RsButton>
    </div>
    <RsSteps v-model="sizeStep" :items="basicItems" :size="size" />
  </DocDemo>

  <DocDemo
    id="demo-label"
    title="标题在下方"
    title-en="Label below"
    description="labelPlacement=&quot;bottom&quot; 把标题放到指示器下方。竖排时仍在旁。"
    description-en="labelPlacement=&quot;bottom&quot; puts the title under the indicator. Vertical orientation still places it beside."
    :code="labelCode"
  >
    <RsSteps v-model="labelStep" :items="labelItems" label-placement="bottom" />
  </DocDemo>

  <DocDemo
    id="demo-status"
    title="状态与进度"
    title-en="Status and percent"
    description="单项 status 覆盖自动推导。组件 status 只作用于当前步。percent 画当前步圆环。"
    description-en="A per-item status overrides the derived state. The status prop only affects the current step. percent draws a ring on that step."
    :code="statusCode"
  >
    <RsSteps v-model="statusStep" :items="statusItems" :percent="40" />
  </DocDemo>

  <DocDemo
    id="demo-clickable"
    title="可点击"
    title-en="Clickable"
    description="clickable 后未禁用项可点。方向键只移焦点。disabled 仍发 click，但不改当前步。"
    description-en="clickable lets enabled steps be selected. Arrows only move focus. A disabled step still emits click but does not change the current step."
    :code="clickableCode"
  >
    <RsSteps v-model="clickStep" :items="clickItems" clickable />
  </DocDemo>

  <DocDemo
    id="demo-dot"
    title="点状"
    title-en="Dot"
    description="type=&quot;dot&quot; 只显示圆点，适合轻量进度。"
    description-en="type=&quot;dot&quot; shows discs only. Use it for a light progress trail."
    :code="dotCode"
  >
    <RsSteps v-model="dotStep" :items="dotItems" type="dot" label-placement="bottom" />
  </DocDemo>

  <DocDemo
    id="demo-icons"
    title="图标"
    title-en="Icons"
    description="item.icon 是 Lucide kebab-case，覆盖默认数字 / 勾 / 叉。"
    description-en="item.icon is a Lucide kebab-case name. It replaces the default number / check / cross."
    :code="iconsCode"
  >
    <RsSteps v-model="iconStep" :items="iconItems" />
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#icon / #title / #description 自定义一步。#item 换整行。外层仍是 button 或 div。"
    description-en="#icon / #title / #description customize one step. #item replaces the whole row. The outer node stays a button or a div."
    :code="slotsCode"
  >
    <RsSteps v-model="slotStep" :items="slotItems">
      <template #icon="{ index, status }">
        {{ status === 'finish' ? '✓' : index + 1 }}
      </template>
      <template #title="{ item, active }">
        {{ active ? '●' : '○' }} {{ item.title }}
      </template>
    </RsSteps>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="click 在点到任一步时发出。change 与 v-model 只在当前步真正变化时发出。"
    description-en="click fires for any step. change and v-model fire only when the current step actually changes."
    :code="eventsCode"
  >
    <RsSteps
      v-model="eventStep"
      :items="eventItems"
      clickable
      @change="onChange"
      @click="onClick"
    />
    <p class="log">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="向导按钮调 next() / prev() / goTo()。focus() 落到当前步。不可点条也能调。"
    description-en="Wizard buttons call next() / prev() / goTo(). focus() lands on the current step. These work when the bar is not clickable."
    :code="methodsCode"
  >
    <RsSteps ref="methodRef" v-model="methodStep" :items="methodItems" />
    <div class="toolbar">
      <RsButton size="sm" variant="default" @click="runPrev">{{ copy.prev }}</RsButton>
      <RsButton size="sm" @click="runNext">{{ copy.next }}</RsButton>
      <RsButton size="sm" variant="default" @click="runGoTo">{{ copy.goTo }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="runFocus">{{ copy.focus }}</RsButton>
    </div>
    <p class="log">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.canvas {
  margin: var(--rs-space-md) 0 0;
  padding: 0;
}

.canvas__caption {
  margin: 0 0 var(--rs-space-xs);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
}

.stage {
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
}

.vertical-wrap {
  max-width: 16rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-block-end: var(--rs-space-md);
}

.log {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
}
</style>
