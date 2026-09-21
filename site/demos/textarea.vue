<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsTextarea, type RsTextareaExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const note = ref('')
const tall = ref('Line one\nLine two')
const counted = ref('abc')
const locked = ref('Read-only note')
const eventNote = ref('')
const methodNoteValue = ref('')

const lastAction = ref('')
const methodLog = ref('')
const areaRef = ref<RsTextareaExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    note: 'Notes',
    noteHint: 'Shown under the workbench description',
    notePh: 'Add a comment',
    grow: 'Growing box',
    fixed: 'Fixed rows',
    counted: 'Summary',
    customCount: 'chars',
    disabled: 'Disabled',
    readonly: 'Read-only',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be focused.',
    readonlyHint: 'Visible but not editable. Still focusable.',
    darkSurface: 'Dark surface — textarea tokens follow Input / data-rs-theme, do not hard-code color',
    idle: 'No event yet. pressEnter, clear, validate, focus, and blur log here. Enter still inserts a newline.',
    enterHit: 'pressEnter',
    clearHit: 'clear',
    focusHit: 'focus',
    blurHit: 'blur',
    validateOk: 'validate → valid',
    validateBad: 'validate → invalid',
    runValidate: 'validate()',
    fill: 'setValue()',
    mark: 'setError()',
    reset: 'clearValidation()',
    focusBtn: 'focus()',
    blurBtn: 'blur()',
    methodIdle: 'Call validate / setValue / setError / clearValidation / focus / blur.',
    methodFill: 'setValue → Host wrote this note',
    methodError: 'setError → Host rejected this field',
    methodClear: 'clearValidation',
    methodOk: 'validate → true',
    methodBad: 'validate → false',
    methodFocus: 'focus',
    methodBlur: 'blur',
    hostError: 'Host rejected this field',
    hostFill: 'Host wrote this note',
    errorLead: 'Custom #error:',
  },
  'zh-CN': {
    note: '备注',
    noteHint: '展示在工作台说明下方',
    notePh: '补充说明',
    grow: '随内容增高',
    fixed: '固定行数',
    counted: '简介',
    customCount: '字',
    disabled: '禁用',
    readonly: '只读',
    disabledHint: '不可用 — 附近写清原因。不能聚焦。',
    readonlyHint: '能看见但不能改。仍可聚焦。',
    darkSurface: '深色表面 — 文本域 token 跟 Input / data-rs-theme，不要写死颜色',
    idle: '还没有事件。pressEnter、clear、validate、focus、blur 会记在这里。Enter 仍会换行。',
    enterHit: 'pressEnter',
    clearHit: 'clear',
    focusHit: 'focus',
    blurHit: 'blur',
    validateOk: 'validate → 通过',
    validateBad: 'validate → 失败',
    runValidate: 'validate()',
    fill: 'setValue()',
    mark: 'setError()',
    reset: 'clearValidation()',
    focusBtn: 'focus()',
    blurBtn: 'blur()',
    methodIdle: '调用 validate / setValue / setError / clearValidation / focus / blur。',
    methodFill: 'setValue → 宿主写入了这段备注',
    methodError: 'setError → 宿主拒绝了这个字段',
    methodClear: 'clearValidation',
    methodOk: 'validate → true',
    methodBad: 'validate → false',
    methodFocus: 'focus',
    methodBlur: 'blur',
    hostError: '宿主拒绝了这个字段',
    hostFill: '宿主写入了这段备注',
    errorLead: '自定义 #error：',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsTextarea v-model="note" label="Notes" placeholder="Add a comment" required hint="Shown under the workbench description" />

<div data-rs-theme="dark">
  <RsTextarea v-model="note" label="Notes" />
</div>`

const autosizeCode = `<RsTextarea v-model="note" :autosize="{ minRows: 3, maxRows: 8 }" />
<RsTextarea v-model="note" :rows="4" resize="vertical" />`

const countCode = `<RsTextarea v-model="note" show-count clearable />
<RsTextarea v-model="note" :maxlength="200" show-count>
  <template #count="{ count, maxlength }">
    {{ count }} / {{ maxlength }} chars
  </template>
</RsTextarea>`

const stateCode = `<RsTextarea v-model="note" label="Disabled" disabled />
<RsTextarea v-model="note" label="Read-only" readonly />`

const eventsCode = `<RsTextarea
  v-model="note"
  required
  clearable
  @press-enter="onEnter"
  @clear="onClear"
  @validate="onValidate"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const area = ref<RsTextareaExpose>()

await area.value?.validate()
area.value?.setValue('Host wrote this note')
area.value?.setError('Host rejected this field')
area.value?.clearValidation()
area.value?.focus()
area.value?.blur()

<RsTextarea ref="area" required>
  <template #error="{ message }">Custom #error: {{ message }}</template>
</RsTextarea>`

function onEnter() {
  lastAction.value = copy.value.enterHit
}

function onClear() {
  lastAction.value = copy.value.clearHit
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
  const ok = await areaRef.value?.validate()
  methodLog.value = ok ? copy.value.methodOk : copy.value.methodBad
}

function runSetValue() {
  areaRef.value?.setValue(copy.value.hostFill)
  methodLog.value = copy.value.methodFill
}

function runSetError() {
  areaRef.value?.setError(copy.value.hostError)
  methodLog.value = copy.value.methodError
}

function runClearValidation() {
  areaRef.value?.clearValidation()
  methodLog.value = copy.value.methodClear
}

function runFocus() {
  areaRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runBlur() {
  areaRef.value?.blur()
  methodLog.value = copy.value.methodBlur
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="字段"
    title-en="Field"
    description="表单字段优先用内置 label / hint / required，不必再包 RsLabel。单行请用 Input。"
    description-en="Prefer the built-in label / hint / required on a form field — do not also wrap RsLabel. Single-line text belongs on Input."
    :code="basicCode"
  >
    <div class="stack">
      <RsTextarea
        v-model="note"
        :label="copy.note"
        :placeholder="copy.notePh"
        required
        :hint="copy.noteHint"
      />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsTextarea v-model="note" :label="copy.note" :placeholder="copy.notePh" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-autosize"
    title="高度"
    title-en="Height"
    description="autosize 随内容增高并锁死拖拽。固定高度用 rows + resize。不要用业务 CSS 改高度。"
    description-en="autosize grows with content and locks drag-resize. A fixed box uses rows + resize. Do not restyle height in product CSS."
    :code="autosizeCode"
  >
    <div class="stack">
      <RsTextarea v-model="tall" :label="copy.grow" :autosize="{ minRows: 3, maxRows: 8 }" />
      <RsTextarea v-model="tall" :label="copy.fixed" :rows="4" resize="vertical" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-count"
    title="字数与清除"
    title-en="Count and clear"
    description="showCount 无 maxlength 也可。#count 覆盖默认统计。clearable 有值才出现，清除后会 focus。"
    description-en="showCount works without maxlength. #count replaces the default tally. clearable appears when there is a value and focuses after clear."
    :code="countCode"
  >
    <div class="stack">
      <RsTextarea v-model="counted" :label="copy.counted" show-count clearable />
      <RsTextarea v-model="counted" :label="copy.counted" :maxlength="200" show-count>
        <template #count="{ count, maxlength }">
          {{ count }} / {{ maxlength }} {{ copy.customCount }}
        </template>
      </RsTextarea>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-state"
    title="禁用与只读"
    title-en="Disabled and readonly"
    description="disabled 不能聚焦。readonly 能聚焦但不能改。灰掉时附近写清原因。"
    description-en="disabled cannot be focused. readonly is focusable but not editable. Explain nearby why it is unavailable."
    :code="stateCode"
  >
    <div class="stack">
      <RsTextarea v-model="locked" :label="copy.disabled" disabled :hint="copy.disabledHint" />
      <RsTextarea v-model="locked" :label="copy.readonly" readonly :hint="copy.readonlyHint" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 pressEnter / clear / validate / focus / blur。Enter 仍换行。没有独立 change，值走 v-model。"
    description-en="The events you can feel are pressEnter, clear, validate, focus, and blur. Enter still inserts a newline. There is no separate change — the value is v-model."
    :code="eventsCode"
  >
    <div class="stack">
      <RsTextarea
        v-model="eventNote"
        required
        clearable
        @press-enter="onEnter"
        @clear="onClear"
        @validate="onValidate"
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
    description="宿主可调 validate / setValue / setError / clearValidation / focus / blur。#error 覆盖默认文案。模板 ref 请用 RsTextareaExpose。"
    description-en="Hosts can call validate, setValue, setError, clearValidation, focus, and blur. #error replaces the default message. Type the template ref as RsTextareaExpose."
    :code="methodsCode"
  >
    <div class="stack">
      <RsTextarea ref="areaRef" v-model="methodNoteValue" required :placeholder="copy.notePh">
        <template #error="{ message }">
          {{ copy.errorLead }} {{ message }}
        </template>
      </RsTextarea>
      <div class="row">
        <RsButton variant="default" @click="runValidate">{{ copy.runValidate }}</RsButton>
        <RsButton variant="default" @click="runSetValue">{{ copy.fill }}</RsButton>
        <RsButton variant="default" @click="runSetError">{{ copy.mark }}</RsButton>
        <RsButton variant="default" @click="runClearValidation">{{ copy.reset }}</RsButton>
        <RsButton variant="default" @click="runFocus">{{ copy.focusBtn }}</RsButton>
        <RsButton variant="default" @click="runBlur">{{ copy.blurBtn }}</RsButton>
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
  max-width: 28rem;
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
