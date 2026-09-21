<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsForm, RsSwitch, type RsSwitchExpose, type RsSwitchValue } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const on = ref(true)
const flag = ref('Y')
const eventOn = ref(false)
const methodOn = ref(false)
const lastAction = ref('')
const methodLog = ref('')
const switchRef = ref<RsSwitchExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    notify: 'Enable notifications',
    disabled: 'Disabled',
    disabledHint: 'Unavailable — explain why nearby.',
    formDisabled: 'Inside a disabled form — every switch inherits Form.disabled',
    current: (value: string) => `Current ${value}`,
    darkSurface: 'Dark surface — switch tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change logs here. There is no click.',
    changeHit: (value: RsSwitchValue) => `change → ${value}`,
    toFocus: 'focus()',
    methodIdle: 'Call focus(). There is no toggle() on the ref.',
    methodFocus: 'focus()',
  },
  'zh-CN': {
    notify: '启用通知',
    disabled: '已禁用',
    disabledHint: '不可用 — 附近写清原因。',
    formDisabled: '在禁用的 Form 里 — 每个开关继承 Form.disabled',
    current: (value: string) => `当前值 ${value}`,
    darkSurface: '深色表面 — 开关 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change 会记在这里。没有 click。',
    changeHit: (value: RsSwitchValue) => `change → ${value}`,
    toFocus: 'focus()',
    methodIdle: '调用 focus()。ref 上没有 toggle()。',
    methodFocus: 'focus()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsSwitch v-model="on">Enable notifications</RsSwitch>
<RsSwitch disabled>Disabled</RsSwitch>

<div data-rs-theme="dark">
  <RsSwitch v-model="on">Enable notifications</RsSwitch>
</div>`

const valueCode = `<RsSwitch v-model="flag" checked-value="Y" unchecked-value="N">
  Current {{ flag }}
</RsSwitch>`

const sizeCode = `<RsSwitch size="ssm" />
<RsSwitch size="sm" />
<RsSwitch size="md" />
<RsSwitch size="lg" />`

const disabledCode = `<RsSwitch disabled :model-value="true">Disabled</RsSwitch>

<RsForm disabled>
  <RsSwitch :model-value="true">Inside a disabled form</RsSwitch>
</RsForm>`

const eventsCode = `<RsSwitch v-model="on" @change="onChange" />`

const methodsCode = `const sw = ref<RsSwitchExpose>()
sw.value?.focus()
// sw.value?.toggle is undefined

<RsSwitch ref="sw" v-model="on" />`

function onChange(value: RsSwitchValue) {
  lastAction.value = copy.value.changeHit(value)
}

function runFocus() {
  switchRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="默认 boolean。立即生效的设置用开关，需要提交再生效用 Checkbox。"
    description-en="Default v-model is boolean. An instant setting belongs on Switch. A choice that waits for submit belongs on Checkbox."
    :code="basicCode"
  >
    <div class="row">
      <RsSwitch v-model="on">{{ copy.notify }}</RsSwitch>
      <RsSwitch disabled>{{ copy.disabled }}</RsSwitch>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsSwitch v-model="on">{{ copy.notify }}</RsSwitch>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-value"
    title="自定义取值"
    title-en="Custom value"
    description="checkedValue / uncheckedValue 映射业务码。比较用 Object.is，0 / 1 不会和 boolean 混掉。"
    description-en="checkedValue / uncheckedValue map a business code. Comparison uses Object.is, so 0 / 1 do not mix with boolean."
    :code="valueCode"
  >
    <RsSwitch v-model="flag" checked-value="Y" unchecked-value="N">
      {{ copy.current(flag) }}
    </RsSwitch>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档跟控件高度。未传跟随 Form / ConfigProvider。不要在产品 CSS 里再写一套宽高。"
    description-en="Four steps follow control height. Omit to follow Form / ConfigProvider. Do not invent a second scale in product CSS."
    :code="sizeCode"
  >
    <div class="row">
      <RsSwitch size="ssm" :model-value="true" />
      <RsSwitch size="sm" :model-value="true" />
      <RsSwitch size="md" :model-value="true" />
      <RsSwitch size="lg" :model-value="true" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 不能切换。也会继承 Form.disabled。灰掉时附近写清原因。"
    description-en="disabled cannot toggle. It also inherits Form.disabled. Explain nearby why it is unavailable."
    :code="disabledCode"
  >
    <div class="stack">
      <RsSwitch disabled :model-value="true" :aria-label="copy.disabled">{{ copy.disabledHint }}</RsSwitch>
      <RsForm disabled>
        <RsSwitch :model-value="true">{{ copy.formDisabled }}</RsSwitch>
      </RsForm>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change 与 v-model。没有 click。禁用时不发 change。"
    description-en="The events you can feel are change and v-model. There is no click. change is skipped while disabled."
    :code="eventsCode"
  >
    <RsSwitch v-model="eventOn" @change="onChange">{{ copy.notify }}</RsSwitch>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus()。没有 toggle()。模板 ref 用 RsSwitchExpose。"
    description-en="Hosts can call focus(). There is no toggle(). Type the template ref as RsSwitchExpose."
    :code="methodsCode"
  >
    <div class="row">
      <RsSwitch ref="switchRef" v-model="methodOn">{{ copy.notify }}</RsSwitch>
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
    </div>
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

.stack {
  display: flex;
  flex-direction: column;
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
