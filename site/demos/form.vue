<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RsButton, RsForm, RsFormItem, RsInput, type RsFormExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const model = reactive({ username: '', password: '' })
const layoutModel = reactive({ username: '' })
const disabledModel = reactive({ username: 'ops' })
const errorModel = reactive({ email: '' })
const eventModel = reactive({ username: '', password: '' })
const methodModel = reactive({ email: '', note: '' })

const lastAction = ref('')
const methodLog = ref('')
const modelLog = ref('')
const formRef = ref<RsFormExpose | null>(null)

const loginRules = {
  username: [{ required: true }],
  password: [{ required: true }],
}

const eventRules = {
  username: [{ required: true }],
  password: [{ required: true, min: 8 }],
}

const methodRules = {
  email: [{ required: true, type: 'email' as const }],
  note: [{ required: true }],
}

const { copy } = useSiteDemo({
  'en-US': {
    username: 'Account',
    usernamePh: 'Email or username',
    password: 'Password',
    passwordPh: 'At least 8 characters',
    signIn: 'Sign in',
    email: 'Email',
    emailPh: 'name@example.com',
    note: 'Note',
    notePh: 'Required note',
    disabledHint: 'Unavailable — explain why nearby. Every field inherits Form.disabled.',
    errorLead: 'Custom #error:',
    darkSurface: 'Dark surface — form tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. submit fires only after a passing check. validate always logs.',
    submitHit: 'submit',
    validateOk: 'validate → valid',
    validateBad: 'validate → invalid',
    methodIdle:
      'Call validate / validateField / getFieldsValue / setFieldsValue / getFieldValue / setFieldValue / resetFields / clearValidation / scrollToField. There is no validateFields.',
    runValidate: 'validate()',
    runField: 'validateField()',
    runGet: 'getFieldsValue()',
    runSet: 'setFieldsValue()',
    runGetOne: 'getFieldValue()',
    runSetOne: 'setFieldValue()',
    runReset: 'resetFields()',
    runClear: 'clearValidation()',
    runScroll: 'scrollToField()',
  },
  'zh-CN': {
    username: '账号',
    usernamePh: '邮箱或用户名',
    password: '密码',
    passwordPh: '至少 8 位',
    signIn: '登录',
    email: '邮箱',
    emailPh: 'name@example.com',
    note: '备注',
    notePh: '必填备注',
    disabledHint: '不可用 — 附近写清原因。每个字段继承 Form.disabled。',
    errorLead: '自定义 #error：',
    darkSurface: '深色表面 — 表单 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。submit 只在校验通过后发出。validate 无论成败都会记。',
    submitHit: 'submit',
    validateOk: 'validate → 通过',
    validateBad: 'validate → 失败',
    methodIdle:
      '调用 validate / validateField / getFieldsValue / setFieldsValue / getFieldValue / setFieldValue / resetFields / clearValidation / scrollToField。没有 validateFields。',
    runValidate: 'validate()',
    runField: 'validateField()',
    runGet: 'getFieldsValue()',
    runSet: 'setFieldsValue()',
    runGetOne: 'getFieldValue()',
    runSetOne: 'setFieldValue()',
    runReset: 'resetFields()',
    runClear: 'clearValidation()',
    runScroll: 'scrollToField()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const modelCode = `const model = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true }],
  password: [{ required: true }],
}

<RsForm :model="model" :rules="rules" max-width="sm" @submit="onSubmit" @validate="onValidate">
  <RsFormItem name="username" label="Account" required>
    <RsInput v-model="model.username" />
  </RsFormItem>
  <RsFormItem name="password" label="Password" required>
    <RsInput v-model="model.password" type="password" />
  </RsFormItem>
  <RsButton type="submit" variant="primary">Sign in</RsButton>
</RsForm>`

const layoutCode = `<RsForm :model="model" label-position="left" label-width="6rem" label-align="end" max-width="md">
  <RsFormItem name="username" label="Account" required>
    <RsInput v-model="model.username" />
  </RsFormItem>
</RsForm>`

const disabledCode = `<RsForm :model="model" disabled max-width="sm">
  <RsFormItem name="username" label="Account">
    <RsInput v-model="model.username" />
  </RsFormItem>
</RsForm>`

const errorCode = `<RsForm :model="model" :rules="{ email: [{ required: true, type: 'email' }] }" max-width="sm">
  <template #error="{ message }">Custom #error: {{ message }}</template>
  <RsFormItem name="email" label="Email" required>
    <RsInput v-model="model.email" />
  </RsFormItem>
  <RsButton type="submit" variant="primary">Sign in</RsButton>
</RsForm>`

const eventsCode = `<RsForm
  :model="model"
  :rules="rules"
  max-width="sm"
  @submit="onSubmit"
  @validate="onValidate"
>
  <RsFormItem name="username" label="Account" required>
    <RsInput v-model="model.username" />
  </RsFormItem>
  <RsButton type="submit" variant="primary">Sign in</RsButton>
</RsForm>
<!-- Failed submit emits validate only. Do not use @submit.prevent — that skips the form emit. -->`

const methodsCode = `const form = ref<RsFormExpose>()

await form.value?.validate()
await form.value?.validateField('email')
form.value?.getFieldsValue()
form.value?.setFieldsValue({ email: 'user@example.com' })
form.value?.getFieldValue('email')
form.value?.setFieldValue('note', 'host write')
form.value?.resetFields()
form.value?.clearValidation()
form.value?.scrollToField('email')
// form.value?.validateFields is undefined

<RsForm ref="form" :model="model" :rules="rules">
  <RsFormItem name="email" label="Email" required>
    <RsInput v-model="model.email" />
  </RsFormItem>
</RsForm>`

function formatResult(result: { valid: boolean; errors?: Record<string, string> }): string {
  const keys = Object.keys(result.errors ?? {})
  if (!keys.length) return String(result.valid)
  const state = result.valid ? 'valid' : 'invalid'
  return `${state} ${keys.join(',')}`
}

function onModelSubmit() {
  modelLog.value = `${copy.value.submitHit} ${model.username}`
}

function onSubmit() {
  lastAction.value = copy.value.submitHit
}

function onValidate(result: { valid: boolean; errors?: Record<string, string> }) {
  if (result.valid) {
    lastAction.value = copy.value.validateOk
    return
  }
  lastAction.value = `${copy.value.validateBad} ${formatResult(result)}`
}

async function runValidate() {
  const result = await formRef.value?.validate()
  if (!result) {
    methodLog.value = copy.value.runValidate
    return
  }
  methodLog.value = `${copy.value.runValidate} → ${formatResult(result)}`
}

async function runValidateField() {
  const result = await formRef.value?.validateField('email')
  if (!result) {
    methodLog.value = copy.value.runField
    return
  }
  const extra = result.message ? ` ${result.message}` : ''
  methodLog.value = `${copy.value.runField} → ${result.valid}${extra}`
}

function runGetFields() {
  methodLog.value = `${copy.value.runGet} → ${JSON.stringify(formRef.value?.getFieldsValue() ?? {})}`
}

function runSetFields() {
  formRef.value?.setFieldsValue({ email: 'user@example.com', note: 'host write' })
  methodLog.value = `${copy.value.runSet} → user@example.com`
}

function runGetOne() {
  methodLog.value = `${copy.value.runGetOne} → ${String(formRef.value?.getFieldValue('email') ?? '')}`
}

function runSetOne() {
  formRef.value?.setFieldValue('note', 'host write')
  methodLog.value = `${copy.value.runSetOne} → host write`
}

function runReset() {
  formRef.value?.resetFields()
  methodLog.value = copy.value.runReset
}

function runClear() {
  formRef.value?.clearValidation()
  methodLog.value = copy.value.runClear
}

function runScroll() {
  formRef.value?.scrollToField('email')
  methodLog.value = copy.value.runScroll
}
</script>

<template>
  <DocDemo
    id="demo-model"
    title="数据中枢"
    title-en="Model"
    description="声明 name 后 Form 读写 model。rules 按字段名合并。新表单不要在控件上再绑一份 v-model 当第二中枢。"
    description-en="After name is set, Form reads and writes model. rules merge by field name. A new form should not keep a second store on the control."
    :code="modelCode"
  >
    <RsForm
      :model="model"
      :rules="loginRules"
      max-width="sm"
      @submit="onModelSubmit"
    >
      <RsFormItem name="username" :label="copy.username" required>
        <RsInput v-model="model.username" :placeholder="copy.usernamePh" />
      </RsFormItem>
      <RsFormItem name="password" :label="copy.password" required>
        <RsInput v-model="model.password" type="password" :placeholder="copy.passwordPh" />
      </RsFormItem>
      <RsButton type="submit" variant="primary">{{ copy.signIn }}</RsButton>
    </RsForm>
    <p v-if="modelLog" class="event-log" data-live="1">{{ modelLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-layout"
    title="标签布局"
    title-en="Label layout"
    description="labelPosition 默认 top。left 时 labelWidth / labelAlign 才可见。maxWidth 走 --rs-form-max-*，不要写死 px。"
    description-en="labelPosition defaults to top. labelWidth and labelAlign show only when left. maxWidth uses --rs-form-max-*. Do not hard-code px."
    :code="layoutCode"
  >
    <RsForm
      :model="layoutModel"
      label-position="left"
      label-width="6rem"
      label-align="end"
      max-width="md"
    >
      <RsFormItem name="username" :label="copy.username" required>
        <RsInput v-model="layoutModel.username" :placeholder="copy.usernamePh" />
      </RsFormItem>
    </RsForm>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsForm :model="layoutModel" max-width="sm">
          <RsFormItem name="username" :label="copy.username">
            <RsInput v-model="layoutModel.username" :placeholder="copy.usernamePh" />
          </RsFormItem>
        </RsForm>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 传给全部字段。灰掉时附近写清原因。不要再叠 loading。"
    description-en="disabled reaches every field. Explain nearby why it is unavailable. Do not also add loading."
    :code="disabledCode"
  >
    <RsForm :model="disabledModel" disabled max-width="sm">
      <RsFormItem name="username" :label="copy.username" :hint="copy.disabledHint">
        <RsInput v-model="disabledModel.username" />
      </RsFormItem>
    </RsForm>
  </DocDemo>

  <DocDemo
    id="demo-error"
    title="错误插槽"
    title-en="Error slot"
    description="#error 优先于 errorRender。插槽经 Context 画在字段错误区，不在 form 根上。"
    description-en="The error slot wins over errorRender. It is painted in the field error area through Context — not on the form root."
    :code="errorCode"
  >
    <RsForm
      :model="errorModel"
      :rules="{ email: [{ required: true, type: 'email' }] }"
      max-width="sm"
    >
      <template #error="{ message }">
        {{ copy.errorLead }} {{ message }}
      </template>
      <RsFormItem name="email" :label="copy.email" required>
        <RsInput v-model="errorModel.email" :placeholder="copy.emailPh" />
      </RsFormItem>
      <RsButton type="submit" variant="primary">{{ copy.signIn }}</RsButton>
    </RsForm>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 submit 与 validate。默认 validateOnSubmit：失败只发 validate。不要写 @submit.prevent，那会绕过组件 submit。"
    description-en="The events you can feel are submit and validate. validateOnSubmit is on: a failed check emits validate only. Do not use @submit.prevent — that skips the component submit."
    :code="eventsCode"
  >
    <RsForm
      :model="eventModel"
      :rules="eventRules"
      max-width="sm"
      @submit="onSubmit"
      @validate="onValidate"
    >
      <RsFormItem name="username" :label="copy.username" required>
        <RsInput v-model="eventModel.username" :placeholder="copy.usernamePh" />
      </RsFormItem>
      <RsFormItem name="password" :label="copy.password" required>
        <RsInput v-model="eventModel.password" type="password" :placeholder="copy.passwordPh" />
      </RsFormItem>
      <RsButton type="submit" variant="primary">{{ copy.signIn }}</RsButton>
    </RsForm>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调全部 defineExpose。模板 ref 用 RsFormExpose。没有 validateFields，单字段走 validateField。"
    description-en="Hosts can call every defineExpose key. Type the template ref as RsFormExpose. There is no validateFields — a single field uses validateField."
    :code="methodsCode"
  >
    <RsForm ref="formRef" :model="methodModel" :rules="methodRules" max-width="sm">
      <RsFormItem name="email" :label="copy.email" required>
        <RsInput v-model="methodModel.email" :placeholder="copy.emailPh" />
      </RsFormItem>
      <RsFormItem name="note" :label="copy.note" required>
        <RsInput v-model="methodModel.note" :placeholder="copy.notePh" />
      </RsFormItem>
      <div class="row">
        <RsButton variant="default" @click="runValidate">{{ copy.runValidate }}</RsButton>
        <RsButton variant="default" @click="runValidateField">{{ copy.runField }}</RsButton>
        <RsButton variant="default" @click="runGetFields">{{ copy.runGet }}</RsButton>
        <RsButton variant="default" @click="runSetFields">{{ copy.runSet }}</RsButton>
        <RsButton variant="default" @click="runGetOne">{{ copy.runGetOne }}</RsButton>
        <RsButton variant="default" @click="runSetOne">{{ copy.runSetOne }}</RsButton>
        <RsButton variant="default" @click="runReset">{{ copy.runReset }}</RsButton>
        <RsButton variant="default" @click="runClear">{{ copy.runClear }}</RsButton>
        <RsButton variant="default" @click="runScroll">{{ copy.runScroll }}</RsButton>
      </div>
    </RsForm>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
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
