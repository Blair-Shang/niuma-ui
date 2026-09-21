<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCheckbox, type RsCheckboxExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const read = ref(true)
const write = ref(false)
const childA = ref(true)
const childB = ref(false)
const eventOn = ref(false)
const methodOn = ref(false)
const lastAction = ref('')
const methodLog = ref('')
const boxRef = ref<RsCheckboxExpose | null>(null)

const all = computed({
  get: () => childA.value && childB.value,
  set: (value: boolean) => {
    childA.value = value
    childB.value = value
  },
})
const half = computed(() => childA.value !== childB.value)

const { copy } = useSiteDemo({
  'en-US': {
    read: 'Read',
    write: 'Write',
    disabledOn: 'Granted (disabled)',
    consent: 'I agree to the terms',
    all: 'Select all',
    childA: 'Child A',
    childB: 'Child B',
    darkSurface: 'Dark surface — checkbox tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change logs here. There is no click.',
    changeHit: (on: boolean) => `change → ${on}`,
    toFocus: 'focus()',
    methodIdle: 'Call focus(). There is no toggle() on the ref.',
    methodFocus: 'focus()',
  },
  'zh-CN': {
    read: '读取',
    write: '写入',
    disabledOn: '已授权（禁用）',
    consent: '我已阅读并同意条款',
    all: '全选',
    childA: '子项 A',
    childB: '子项 B',
    darkSurface: '深色表面 — 复选框 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change 会记在这里。没有 click。',
    changeHit: (on: boolean) => `change → ${on}`,
    toFocus: 'focus()',
    methodIdle: '调用 focus()。ref 上没有 toggle()。',
    methodFocus: 'focus()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsCheckbox v-model="read">Read</RsCheckbox>
<RsCheckbox v-model="write">Write</RsCheckbox>`

const sizeCode = `<RsCheckbox size="ssm" />
<RsCheckbox size="sm" />
<RsCheckbox size="md" />
<RsCheckbox size="lg" />`

const disabledCode = `<RsCheckbox disabled :model-value="true">Granted</RsCheckbox>
<RsCheckbox v-model="ok" required>I agree to the terms</RsCheckbox>`

const halfCode = `<RsCheckbox v-model="all" :indeterminate="half">Select all</RsCheckbox>`

const eventsCode = `<RsCheckbox v-model="on" @change="onChange" />`

const methodsCode = `const box = ref<RsCheckboxExpose | null>(null)
box.value?.focus()
<RsCheckbox ref="box" v-model="on" />`

function onChange(value: boolean) {
  lastAction.value = copy.value.changeHit(value)
}

function runFocus() {
  boxRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="每一项自己的 boolean。没有 CheckboxGroup，也不要绑 string[]。标签用默认插槽。"
    description-en="Each item has its own boolean. There is no CheckboxGroup, and v-model is not a string[]. Put the label in the default slot."
    :code="basicCode"
  >
    <div class="stack">
      <RsCheckbox v-model="read">{{ copy.read }}</RsCheckbox>
      <RsCheckbox v-model="write">{{ copy.write }}</RsCheckbox>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsCheckbox v-model="read">{{ copy.read }}</RsCheckbox>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档与其它表单控件相同：ssm / sm / md / lg。未传跟随 ConfigProvider。"
    description-en="The four sizes match other form controls: ssm / sm / md / lg. Omit to follow ConfigProvider."
    :code="sizeCode"
  >
    <div class="row">
      <RsCheckbox v-model="read" size="ssm">ssm</RsCheckbox>
      <RsCheckbox v-model="read" size="sm">sm</RsCheckbox>
      <RsCheckbox v-model="read" size="md">md</RsCheckbox>
      <RsCheckbox v-model="read" size="lg">lg</RsCheckbox>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 不能改，也会继承 Form.disabled。协议勾选可加 required。"
    description-en="disabled cannot change, and it also inherits Form.disabled. A consent box may set required."
    :code="disabledCode"
  >
    <div class="stack">
      <RsCheckbox disabled :model-value="true">{{ copy.disabledOn }}</RsCheckbox>
      <RsCheckbox v-model="write" required>{{ copy.consent }}</RsCheckbox>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-half"
    title="半选"
    title-en="Indeterminate"
    description="indeterminate 只表示部分选中。点击全选仍按 v-model 取反，要用子项推导 half，组件不会自己清 mixed。"
    description-en="indeterminate means some children are on. Clicking select-all still flips v-model. Derive half from the children — the control will not clear mixed by itself."
    :code="halfCode"
  >
    <div class="stack">
      <RsCheckbox v-model="all" :indeterminate="half">{{ copy.all }}</RsCheckbox>
      <RsCheckbox v-model="childA">{{ copy.childA }}</RsCheckbox>
      <RsCheckbox v-model="childB">{{ copy.childB }}</RsCheckbox>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change 与 v-model。没有组件 click。表格里请在外层拦 click。"
    description-en="The events you can feel are change and v-model. There is no component click. Catch click on the host in a table cell."
    :code="eventsCode"
  >
    <RsCheckbox v-model="eventOn" @change="onChange">{{ copy.read }}</RsCheckbox>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus()。没有 toggle()。模板 ref 请用 RsCheckboxExpose。"
    description-en="Hosts can call focus(). There is no toggle(). Type the template ref as RsCheckboxExpose."
    :code="methodsCode"
  >
    <div class="stack">
      <RsCheckbox ref="boxRef" v-model="methodOn">{{ copy.read }}</RsCheckbox>
      <div class="row">
        <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
      </div>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
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
