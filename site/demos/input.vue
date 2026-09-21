<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsIcon, RsInput, type RsInputExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const name = ref('')
const amount = ref('')
const host = ref('')
const password = ref('')
const search = ref('hub')
const locked = ref('prod-01')
const eventEmail = ref('bad-email')
const methodEmail = ref('')

const lastAction = ref('')
const methodLog = ref('')
const inputRef = ref<RsInputExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    project: 'Project name',
    projectHint: 'Used as the workbench title',
    projectPh: 'Enter a name',
    search: 'Search',
    searchPh: 'Search instances…',
    amountPh: '0.00',
    hostPh: 'api',
    pickHost: 'Choose host',
    password: 'Password',
    passwordPh: 'At least 8 characters',
    bio: 'Summary',
    scheme: 'https://',
    tld: '.com',
    disabled: 'Disabled',
    readonly: 'Read-only',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be focused.',
    readonlyHint: 'Visible but not editable. Still focusable.',
    darkSurface: 'Dark surface — input tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. pressEnter, clear, addonAfterClick, validate, focus, and blur log here.',
    enterHit: 'pressEnter',
    clearHit: 'clear',
    addonHit: 'addonAfterClick',
    focusHit: 'focus',
    blurHit: 'blur',
    validateOk: 'validate → valid',
    validateBad: 'validate → invalid',
    runValidate: 'validate()',
    fill: 'setValue()',
    mark: 'setError()',
    reset: 'clearValidation()',
    methodIdle: 'Call validate / setValue / setError / clearValidation. There is no focus().',
    methodFill: 'setValue → user@example.com',
    methodError: 'setError → Host rejected this field',
    methodClear: 'clearValidation',
    methodOk: 'validate → true',
    methodBad: 'validate → false',
    hostError: 'Host rejected this field',
    errorLead: 'Custom #error:',
  },
  'zh-CN': {
    project: '项目名称',
    projectHint: '将用于工作台标题',
    projectPh: '请输入名称',
    search: '搜索',
    searchPh: '搜索实例…',
    amountPh: '0.00',
    hostPh: 'api',
    pickHost: '选择主机',
    password: '密码',
    passwordPh: '至少 8 位',
    bio: '简介',
    scheme: 'https://',
    tld: '.com',
    disabled: '禁用',
    readonly: '只读',
    disabledHint: '不可用 — 附近写清原因。不能聚焦。',
    readonlyHint: '能看见但不能改。仍可聚焦。',
    darkSurface: '深色表面 — 输入框 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。pressEnter、clear、addonAfterClick、validate、focus、blur 会记在这里。',
    enterHit: 'pressEnter',
    clearHit: 'clear',
    addonHit: 'addonAfterClick',
    focusHit: 'focus',
    blurHit: 'blur',
    validateOk: 'validate → 通过',
    validateBad: 'validate → 失败',
    runValidate: 'validate()',
    fill: 'setValue()',
    mark: 'setError()',
    reset: 'clearValidation()',
    methodIdle: '调用 validate / setValue / setError / clearValidation。没有 focus()。',
    methodFill: 'setValue → user@example.com',
    methodError: 'setError → 宿主拒绝了这个字段',
    methodClear: 'clearValidation',
    methodOk: 'validate → true',
    methodBad: 'validate → false',
    hostError: '宿主拒绝了这个字段',
    errorLead: '自定义 #error：',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsInput v-model="name" label="Project name" placeholder="Enter a name" required hint="Used as the workbench title" />
<RsInput v-model="search" type="search" clearable placeholder="Search instances…" />

<div data-rs-theme="dark">
  <RsInput v-model="name" label="Project name" />
</div>`

const addonCode = `<RsInput v-model="amount" prefix="¥" suffix="CNY" />

<RsInput placeholder="api">
  <template #addonBefore>https://</template>
  <template #addonAfter>.com</template>
</RsInput>

<RsInput
  v-model="host"
  addon-after-icon="ellipsis"
  addon-after-icon-label="Choose host"
  @addon-after-click="onPick"
>
  <template #prefix>
    <RsIcon name="search" :size="16" />
  </template>
  <template #suffix>
    <RsIcon name="globe" :size="16" />
  </template>
</RsInput>`

const passwordCode = `<RsInput v-model="password" type="password" label="Password" />
<RsInput v-model="name" :maxlength="40" show-count label="Summary" />`

const stateCode = `<RsInput v-model="id" label="Disabled" disabled hint="Unavailable — explain why nearby." />
<RsInput v-model="id" label="Read-only" readonly hint="Visible but not editable." />`

const eventsCode = `<RsInput
  v-model="email"
  rule="email"
  required
  clearable
  addon-after-icon="ellipsis"
  @press-enter="onEnter"
  @clear="onClear"
  @validate="onValidate"
  @addon-after-click="onPick"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const input = ref<RsInputExpose>()

await input.value?.validate()
input.value?.setValue('user@example.com')
input.value?.setError('Host rejected this field')
input.value?.clearValidation()
// input.value?.focus is undefined

<RsInput ref="input" rule="email" required>
  <template #error="{ message }">Custom #error: {{ message }}</template>
</RsInput>`

function onEnter() {
  lastAction.value = copy.value.enterHit
}

function onClear() {
  lastAction.value = copy.value.clearHit
}

function onPick() {
  lastAction.value = copy.value.addonHit
}

function onFocus() {
  lastAction.value = copy.value.focusHit
}

function onBlur() {
  lastAction.value = copy.value.blurHit
}

function onValidate(payload: { valid: boolean }) {
  lastAction.value = payload.valid ? copy.value.validateOk : copy.value.validateBad
}

async function runValidate() {
  const ok = await inputRef.value?.validate()
  methodLog.value = ok ? copy.value.methodOk : copy.value.methodBad
}

function runSetValue() {
  inputRef.value?.setValue('user@example.com')
  methodLog.value = copy.value.methodFill
}

function runSetError() {
  inputRef.value?.setError(copy.value.hostError)
  methodLog.value = copy.value.methodError
}

function runClearValidation() {
  inputRef.value?.clearValidation()
  methodLog.value = copy.value.methodClear
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="字段"
    title-en="Field"
    description="表单字段优先用内置 label / hint / required，不必再包 RsLabel。search + clearable 只留组件清除钮。"
    description-en="Prefer the built-in label / hint / required on a form field — do not also wrap RsLabel. search + clearable keeps a single library clear button."
    :code="basicCode"
  >
    <div class="stack">
      <RsInput
        v-model="name"
        :label="copy.project"
        :placeholder="copy.projectPh"
        required
        :hint="copy.projectHint"
      />
      <RsInput
        v-model="search"
        type="search"
        clearable
        :label="copy.search"
        :placeholder="copy.searchPh"
      />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsInput v-model="name" :label="copy.project" :placeholder="copy.projectPh" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-addon"
    title="框内与连体"
    title-en="Affix and addon"
    description="文本 prefix / suffix 在框内。协议和单位用 #addonBefore / #addonAfter。图标走 #prefix / #suffix。选择器按钮用 addonAfterIcon，不要给装饰图标绑 click。"
    description-en="Text prefix / suffix sit inside the box. Protocols and units use #addonBefore / #addonAfter. Icons use #prefix / #suffix. A picker button is addonAfterIcon — do not bind click on a decorative icon."
    :code="addonCode"
  >
    <div class="stack">
      <RsInput v-model="amount" prefix="¥" suffix="CNY" :placeholder="copy.amountPh" />
      <RsInput :placeholder="copy.hostPh">
        <template #addonBefore>{{ copy.scheme }}</template>
        <template #addonAfter>{{ copy.tld }}</template>
      </RsInput>
      <RsInput
        v-model="host"
        addon-after-icon="ellipsis"
        :addon-after-icon-label="copy.pickHost"
        @addon-after-click="onPick"
      >
        <template #prefix>
          <RsIcon name="search" :size="16" />
        </template>
        <template #suffix>
          <RsIcon name="globe" :size="16" />
        </template>
      </RsInput>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-password"
    title="密码与字数"
    title-en="Password and count"
    description="password 默认有显隐。showCount 必须配合 maxlength。数字步进请用 InputNumber。"
    description-en="password shows a reveal by default. showCount requires maxlength. Stepped numbers belong on InputNumber."
    :code="passwordCode"
  >
    <div class="stack">
      <RsInput v-model="password" type="password" :label="copy.password" :placeholder="copy.passwordPh" />
      <RsInput v-model="name" :label="copy.bio" :maxlength="40" show-count />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-state"
    title="禁用与只读"
    title-en="Disabled and readonly"
    description="disabled 不能聚焦。readonly 能聚焦但不能改。灰掉时附近写清原因。不要再叠 loading。"
    description-en="disabled cannot be focused. readonly is focusable but not editable. Explain nearby why it is unavailable. Do not also add loading."
    :code="stateCode"
  >
    <div class="stack">
      <RsInput v-model="locked" :label="copy.disabled" disabled :hint="copy.disabledHint" />
      <RsInput v-model="locked" :label="copy.readonly" readonly :hint="copy.readonlyHint" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 pressEnter / clear / addonAfterClick / validate / focus / blur。没有独立 change，值走 v-model。IME 合成中不发 pressEnter。"
    description-en="The events you can feel are pressEnter, clear, addonAfterClick, validate, focus, and blur. There is no separate change — the value is v-model. pressEnter is skipped while IME is composing."
    :code="eventsCode"
  >
    <div class="stack">
      <RsInput
        v-model="eventEmail"
        rule="email"
        required
        clearable
        addon-after-icon="ellipsis"
        :addon-after-icon-label="copy.pickHost"
        @press-enter="onEnter"
        @clear="onClear"
        @validate="onValidate"
        @addon-after-click="onPick"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 validate / setValue / setError / clearValidation。#error 覆盖默认文案。没有 focus()。模板 ref 请用 RsInputExpose。"
    description-en="Hosts can call validate, setValue, setError, and clearValidation. #error replaces the default message. There is no focus(). Type the template ref as RsInputExpose."
    :code="methodsCode"
  >
    <div class="stack">
      <RsInput ref="inputRef" v-model="methodEmail" rule="email" required :placeholder="copy.hostPh">
        <template #error="{ message }">
          {{ copy.errorLead }} {{ message }}
        </template>
      </RsInput>
      <div class="row">
        <RsButton variant="default" @click="runValidate">{{ copy.runValidate }}</RsButton>
        <RsButton variant="default" @click="runSetValue">{{ copy.fill }}</RsButton>
        <RsButton variant="default" @click="runSetError">{{ copy.mark }}</RsButton>
        <RsButton variant="default" @click="runClearValidation">{{ copy.reset }}</RsButton>
      </div>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 22rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: 0.75rem;
  background: var(--rs-surface);
  color: var(--rs-text);
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text);
}
</style>
