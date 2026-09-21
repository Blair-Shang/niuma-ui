<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsInputNumber, type RsInputNumberExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const port = ref<number | null>(5432)
const replicas = ref<number | null>(3)
const timeout = ref<number | null>(1.5)
const amount = ref<string | null>('100.00')
const locked = ref<number | null>(8080)
const eventValue = ref<number | null>(10)
const methodValue = ref<number | null>(5)
const lastAction = ref('')
const methodLog = ref('')
const numberRef = ref<RsInputNumberExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    port: 'Port',
    portHint: '1–65535. Typing 54. stays a draft until blur.',
    replicas: 'Replicas',
    timeout: 'Timeout (s)',
    amount: 'Amount',
    amountHint: 'stringMode keeps a decimal string',
    noControls: 'No stepper',
    withControls: 'Stepper (default)',
    disabled: 'Disabled',
    readonly: 'Read-only',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be changed.',
    readonlyHint: 'Visible but not editable. Still focusable.',
    darkSurface: 'Dark surface — input tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. pressEnter, step, focus, and blur log here. There is no change.',
    enterHit: 'pressEnter',
    stepHit: (offset: number) => `step offset ${offset}`,
    focusHit: 'focus',
    blurHit: 'blur',
    toFocus: 'focus()',
    toBlur: 'blur()',
    toCommit: 'commit()',
    toSet: 'setValue()',
    toStep: 'step(1)',
    methodIdle: 'Call focus / blur / commit / setValue / step.',
    methodSet: 'setValue → 20',
    methodStep: 'step(1)',
    methodCommit: 'commit()',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
  },
  'zh-CN': {
    port: '端口',
    portHint: '1–65535。输入 54. 会留在草稿，失焦才提交。',
    replicas: '副本数',
    timeout: '超时（秒）',
    amount: '金额',
    amountHint: 'stringMode 保留小数字符串',
    noControls: '无步进钮',
    withControls: '步进钮（默认）',
    disabled: '禁用',
    readonly: '只读',
    disabledHint: '不可用 — 附近写清原因。不能改值。',
    readonlyHint: '能看见但不能改。仍可聚焦。',
    darkSurface: '深色表面 — 输入框 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。pressEnter、step、focus、blur 会记在这里。没有 change。',
    enterHit: 'pressEnter',
    stepHit: (offset: number) => `step offset ${offset}`,
    focusHit: 'focus',
    blurHit: 'blur',
    toFocus: 'focus()',
    toBlur: 'blur()',
    toCommit: 'commit()',
    toSet: 'setValue()',
    toStep: 'step(1)',
    methodIdle: '调用 focus / blur / commit / setValue / step。',
    methodSet: 'setValue → 20',
    methodStep: 'step(1)',
    methodCommit: 'commit()',
    methodFocus: 'focus()',
    methodBlur: 'blur()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsInputNumber v-model="port" :min="1" :max="65535" label="Port" />`

const sizeCode = `<RsInputNumber size="ssm" />
<RsInputNumber size="sm" />
<RsInputNumber size="md" />
<RsInputNumber size="lg" />`

const controlsCode = `<RsInputNumber :controls="false" />
<RsInputNumber :step="0.1" :precision="1" />`

const stringCode = `<RsInputNumber v-model="amount" string-mode :precision="2" />`

const stateCode = `<RsInputNumber :model-value="8080" disabled />
<RsInputNumber :model-value="8080" readonly />`

const eventsCode = `<RsInputNumber
  v-model="value"
  @press-enter="onEnter"
  @step="onStep"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const bar = ref<RsInputNumberExpose | null>(null)
bar.value?.focus()
bar.value?.setValue(20)
bar.value?.step(1)
<RsInputNumber ref="bar" v-model="value" />`

function onEnter() {
  lastAction.value = copy.value.enterHit
}

function onStep(_value: number | string | null, info: { offset: number }) {
  lastAction.value = copy.value.stepHit(info.offset)
}

function onFocus() {
  lastAction.value = copy.value.focusHit
}

function onBlur() {
  lastAction.value = copy.value.blurHit
}

function runFocus() {
  numberRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runBlur() {
  numberRef.value?.blur()
  methodLog.value = copy.value.methodBlur
}

function runCommit() {
  numberRef.value?.commit()
  methodLog.value = copy.value.methodCommit
}

function runSetValue() {
  numberRef.value?.setValue(20)
  methodLog.value = copy.value.methodSet
}

function runStep() {
  numberRef.value?.step(1)
  methodLog.value = copy.value.methodStep
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="用 min / max 约束端口。输入中间态不会写成非法模型。不要给 RsInput 设 type=number 冒充步进。"
    description-en="Constrain a port with min / max. Interim typing is not written as an invalid model. Do not fake a stepper with RsInput type=number."
    :code="basicCode"
  >
    <div class="stack">
      <RsInputNumber
        v-model="port"
        :min="1"
        :max="65535"
        :label="copy.port"
        :hint="copy.portHint"
        required
      />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsInputNumber v-model="port" :min="1" :max="65535" :label="copy.port" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档高度与 Input 相同：ssm / sm / md / lg。未传跟随 ConfigProvider。"
    description-en="The four heights match Input: ssm / sm / md / lg. Omit to follow ConfigProvider."
    :code="sizeCode"
  >
    <div class="stack">
      <RsInputNumber v-model="replicas" size="ssm" :label="copy.replicas" />
      <RsInputNumber v-model="replicas" size="sm" :label="copy.replicas" />
      <RsInputNumber v-model="replicas" size="md" :label="copy.replicas" />
      <RsInputNumber v-model="replicas" size="lg" :label="copy.replicas" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-controls"
    title="步进"
    title-en="Controls"
    description="controls=false 只留输入框。步进钮不进 Tab 序，键盘用方向键。小数用 step + precision。"
    description-en="controls=false leaves the input only. Stepper buttons are not in the tab order; use arrow keys. Decimals use step + precision."
    :code="controlsCode"
  >
    <div class="stack">
      <RsInputNumber v-model="replicas" :controls="false" :label="copy.noControls" />
      <RsInputNumber
        v-model="timeout"
        :step="0.1"
        :precision="1"
        :min="0"
        :label="copy.withControls"
      />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-string-mode"
    title="字符串模式"
    title-en="String mode"
    description="stringMode 时 v-model 是 string | null。金额或超安全整数用它，不要用 JS number 硬算。"
    description-en="In stringMode, v-model is string | null. Use it for money or values past the safe integer — do not do the math in JS number."
    :code="stringCode"
  >
    <RsInputNumber
      v-model="amount"
      string-mode
      :precision="2"
      :step="0.01"
      :min="0"
      :label="copy.amount"
      :hint="copy.amountHint"
    />
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用与只读"
    title-en="Disabled and read-only"
    description="disabled 不能改。readonly 能聚焦但不能改。灰掉时附近写清原因。"
    description-en="disabled cannot change. readonly is focusable but not editable. Explain nearby why it is unavailable."
    :code="stateCode"
  >
    <div class="stack">
      <RsInputNumber v-model="locked" :label="copy.disabled" disabled :hint="copy.disabledHint" />
      <RsInputNumber v-model="locked" :label="copy.readonly" readonly :hint="copy.readonlyHint" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 pressEnter / step / focus / blur。没有独立 change，值走 v-model。IME 合成中不发 pressEnter、不步进。"
    description-en="The events you can feel are pressEnter, step, focus, and blur. There is no separate change — the value is v-model. IME composition skips pressEnter and stepping."
    :code="eventsCode"
  >
    <RsInputNumber
      v-model="eventValue"
      :min="0"
      :max="99"
      @press-enter="onEnter"
      @step="onStep"
      @focus="onFocus"
      @blur="onBlur"
    />
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus / blur / commit / setValue / step。模板 ref 请用 RsInputNumberExpose。"
    description-en="Hosts can call focus, blur, commit, setValue, and step. Type the template ref as RsInputNumberExpose."
    :code="methodsCode"
  >
    <div class="stack">
      <RsInputNumber ref="numberRef" v-model="methodValue" :min="0" :max="99" />
      <div class="row">
        <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
        <RsButton variant="default" @click="runBlur">{{ copy.toBlur }}</RsButton>
        <RsButton variant="default" @click="runCommit">{{ copy.toCommit }}</RsButton>
        <RsButton variant="default" @click="runSetValue">{{ copy.toSet }}</RsButton>
        <RsButton variant="default" @click="runStep">{{ copy.toStep }}</RsButton>
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
