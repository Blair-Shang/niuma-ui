<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsForm,
  RsTimePicker,
  type RsTimePickerExpose,
  type RsTimePickerModelValue,
  type RsTimeRangeValue,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const single = ref('14:30')
const range = ref<RsTimeRangeValue>({ start: '09:00', end: '18:00' })
const seconds = ref('14:30:00')
const hour12 = ref('14:30')
const bound = ref('10:00')
const sizeTime = ref('14:30')
const eventTime = ref('')
const methodTime = ref('')
const lastAction = ref('')
const methodLog = ref('')
const pickerRef = ref<RsTimePickerExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    meeting: 'Meeting',
    hours: 'Business hours',
    alarm: 'Alarm',
    us: 'US wall clock',
    usHint: 'hourCycle=12. v-model stays 14:30. The trigger follows the locale AM/PM.',
    boundHint: 'minTime=09:00 maxTime=18:00. Lunch 12:00–13:00 is off.',
    morning: 'Morning',
    noon: 'Noon',
    disabled: 'Locked time',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be changed.',
    readonly: 'Read-only — the panel stays closed.',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    darkSurface: 'Dark surface — time picker tokens follow data-rs-theme, do not hard-code color',
    idle: 'No event yet. change / openChange / clear / focus / blur log here.',
    changeHit: (value: string) => `change → ${value}`,
    openHit: (open: boolean) => `openChange → ${open}`,
    clearHit: 'clear',
    focusHit: 'focus',
    blurHit: 'blur',
    toFocus: 'focus()',
    toSet: 'setValue()',
    toClear: 'clearValidation()',
    methodIdle: 'Call focus / setValue / clearValidation.',
    methodFocus: 'focus()',
    methodSet: 'setValue → 09:00',
    methodClear: 'clearValidation()',
  },
  'zh-CN': {
    meeting: '会议时间',
    hours: '营业时段',
    alarm: '提醒',
    us: '12 小时制',
    usHint: 'hourCycle=12。v-model 仍是 14:30。触发器跟 locale 的上午/下午。',
    boundHint: 'minTime=09:00 maxTime=18:00。午休 12:00–13:00 不可选。',
    morning: '上午',
    noon: '正午',
    disabled: '锁定时间',
    disabledHint: '不可用 — 附近写清原因。不能改值。',
    readonly: '只读 — 面板保持关闭。',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    darkSurface: '深色表面 — 时间选择 token 跟 data-rs-theme，不要写死颜色',
    idle: '还没有事件。change / openChange / clear / focus / blur 会记在这里。',
    changeHit: (value: string) => `change → ${value}`,
    openHit: (open: boolean) => `openChange → ${open}`,
    clearHit: 'clear',
    focusHit: 'focus',
    blurHit: 'blur',
    toFocus: 'focus()',
    toSet: 'setValue()',
    toClear: 'clearValidation()',
    methodIdle: '调用 focus / setValue / clearValidation。',
    methodFocus: 'focus()',
    methodSet: 'setValue → 09:00',
    methodClear: 'clearValidation()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const shortcuts = computed(() => [
  { label: copy.value.morning, value: () => '09:00' },
  { label: copy.value.noon, value: () => '12:00' },
])

const basicCode = `<RsTimePicker v-model="time" label="Meeting" clearable />`

const rangeCode = `<RsTimePicker v-model="range" range label="Business hours" />`

const secondsCode = `<RsTimePicker v-model="time" with-seconds />`

const hour12Code = `<RsTimePicker v-model="time" :hour-cycle="12" />`

const boundCode = `<RsTimePicker
  v-model="time"
  min-time="09:00"
  max-time="18:00"
  :minute-step="15"
  :disabled-time="(unit, value) => unit === 'hour' && value === 12"
/>`

const shortcutsCode = `<RsTimePicker
  v-model="time"
  :shortcuts="[{ label: 'Morning', value: () => '09:00' }]"
/>`

const sizeCode = `<RsTimePicker size="ssm" />
<RsTimePicker size="sm" />
<RsTimePicker size="md" />
<RsTimePicker size="lg" />`

const disabledCode = `<RsTimePicker disabled :model-value="time" />
<RsTimePicker readonly :model-value="time" />`

const eventsCode = `<RsTimePicker
  v-model="time"
  clearable
  @change="onChange"
  @open-change="onOpen"
  @clear="onClear"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const el = ref<RsTimePickerExpose | null>(null)
el.value?.focus()
el.value?.setValue('09:00')
<RsTimePicker ref="el" v-model="time" />`

function formatEventValue(value: RsTimePickerModelValue): string {
  if (value == null || value === '') return '(empty)'
  if (typeof value === 'string') return value
  return `${value.start ?? ''} ~ ${value.end ?? ''}`
}

function onChange(value: RsTimePickerModelValue) {
  lastAction.value = copy.value.changeHit(formatEventValue(value))
}

function onOpen(next: boolean) {
  lastAction.value = copy.value.openHit(next)
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

function disableNoon(unit: 'hour' | 'minute' | 'second', value: number) {
  return unit === 'hour' && value === 12
}

function runFocus() {
  pickerRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runSet() {
  pickerRef.value?.setValue('09:00')
  methodLog.value = copy.value.methodSet
}

function runClear() {
  pickerRef.value?.clearValidation()
  methodLog.value = copy.value.methodClear
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="选择时间"
    title-en="Time"
    description="时分滚动列。默认写入 HH:mm。label / hint / required 与输入框一致。"
    description-en="Hour and minute columns. v-model is HH:mm. label / hint / required match other fields."
    :code="basicCode"
  >
    <div class="field">
      <RsTimePicker v-model="single" :label="copy.meeting" clearable />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-range"
    title="时间范围"
    title-en="Range"
    description="range 模式下一个触发器，面板里左右各嵌一个时间。"
    description-en="One trigger. The panel nests a start and an end time."
    :code="rangeCode"
  >
    <div class="field field--wide">
      <RsTimePicker v-model="range" :label="copy.hours" range />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-seconds"
    title="带秒"
    title-en="Seconds"
    description="withSeconds 写入 HH:mm:ss。只要日期用 DatePicker。"
    description-en="withSeconds writes HH:mm:ss. A date belongs on DatePicker."
    :code="secondsCode"
  >
    <div class="field">
      <RsTimePicker v-model="seconds" :label="copy.alarm" with-seconds />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-hour12"
    title="12 小时制"
    title-en="12-hour"
    description="hourCycle=12 只改触发器和列。v-model 仍是 24 小时墙钟，方便服务端。"
    description-en="hourCycle=12 changes the trigger and columns. v-model stays a 24-hour wall clock for the server."
    :code="hour12Code"
  >
    <div class="field">
      <RsTimePicker v-model="hour12" :label="copy.us" :hour-cycle="12" />
    </div>
    <p class="hint">{{ copy.usHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-bound"
    title="边界与步进"
    title-en="Bounds"
    description="minTime / maxTime 裁剪。minuteStep 常用 5 / 15。disabledTime 关某一档。"
    description-en="minTime / maxTime clip the range. minuteStep is often 5 or 15. disabledTime turns off a value."
    :code="boundCode"
  >
    <div class="field">
      <RsTimePicker
        v-model="bound"
        min-time="09:00"
        max-time="18:00"
        :minute-step="15"
        :disabled-time="disableNoon"
      />
    </div>
    <p class="hint">{{ copy.boundHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-shortcuts"
    title="快捷项"
    title-en="Shortcuts"
    description="有 shortcuts 时替代「此刻 / 朝九晚六」。国际站点不要依赖默认的 09–18。"
    description-en="shortcuts replace Now / 09:00–18:00. International hosts should not rely on that default window."
    :code="shortcutsCode"
  >
    <div class="field">
      <RsTimePicker v-model="single" :shortcuts="shortcuts" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档高度跟 Input / Select 同一套 --rs-control-height-*。"
    description-en="Four heights. Same --rs-control-height-* as Input and Select."
    :code="sizeCode"
  >
    <div class="stack">
      <RsTimePicker v-model="sizeTime" size="ssm" />
      <RsTimePicker v-model="sizeTime" size="sm" />
      <RsTimePicker v-model="sizeTime" size="md" />
      <RsTimePicker v-model="sizeTime" size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用与只读"
    title-en="Disabled"
    description="disabled 不能打开。readonly 能看值、不能打开。组禁用继承 Form.disabled。"
    description-en="disabled cannot open. readonly shows the value and keeps the panel closed. A group inherits Form.disabled."
    :code="disabledCode"
  >
    <div class="stack">
      <RsTimePicker :model-value="single" disabled :label="copy.disabled" />
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsTimePicker :model-value="single" readonly :label="copy.readonly" />
      <RsForm disabled>
        <RsTimePicker :model-value="single" :label="copy.formDisabled" />
      </RsForm>
      <div class="canvas">
        <p class="canvas__caption">{{ copy.darkSurface }}</p>
        <div class="stage" data-rs-theme="dark">
          <RsTimePicker :model-value="single" :label="copy.meeting" />
        </div>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change / openChange / clear / focus / blur。没有 click。"
    description-en="The events you can feel are change, openChange, clear, focus, and blur. There is no click."
    :code="eventsCode"
  >
    <div class="field">
      <RsTimePicker
        v-model="eventTime"
        clearable
        @change="onChange"
        @open-change="onOpen"
        @clear="onClear"
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
    description="宿主可调 focus() / blur() / setValue() / validate()。模板 ref 用 RsTimePickerExpose。"
    description-en="Hosts can call focus(), blur(), setValue(), and validate(). Type the template ref as RsTimePickerExpose."
    :code="methodsCode"
  >
    <div class="row">
      <div class="field">
        <RsTimePicker ref="pickerRef" v-model="methodTime" />
      </div>
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
      <RsButton variant="default" @click="runSet">{{ copy.toSet }}</RsButton>
      <RsButton variant="default" @click="runClear">{{ copy.toClear }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 22rem;
}

.field--wide {
  max-width: 28rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
  max-width: 22rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--rs-space-sm);
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
  margin: var(--rs-space-xs) 0 0;
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
</style>
