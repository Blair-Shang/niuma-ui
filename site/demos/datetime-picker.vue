<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsDateTimePicker,
  RsForm,
  type RsDatePickerModelValue,
  type RsDateRangeValue,
  type RsDateTimePickerExpose,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const single = ref('2025-06-16 14:30')
const range = ref<RsDateRangeValue>({
  start: '2025-06-01 09:00',
  end: '2025-06-30 18:00',
})
const seconds = ref('2025-06-16 14:30:00')
const displayWhen = ref('2025-06-16 14:30')
const boundWhen = ref('2025-06-16 10:00')
const sizeWhen = ref('2025-06-16 14:30')
const eventWhen = ref('')
const methodWhen = ref('')
const lastAction = ref('')
const methodLog = ref('')
const pickerRef = ref<RsDateTimePickerExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    start: 'Starts at',
    window: 'Event window',
    alarm: 'Alarm',
    invoice: 'Invoice time',
    now: 'Now',
    last7: 'Last 7 days',
    boundHint: 'Weekends are off. minDate / maxDate keep June 2025.',
    secondsHint: 'withSeconds writes YYYY-MM-DD HH:mm:ss. Default is HH:mm.',
    formatHint: 'format is the trigger. valueFormat is v-model. DateTimePicker has no withTime prop — it is always on.',
    vsHint: 'Date only belongs on DatePicker. Time only belongs on TimePicker.',
    disabled: 'Locked date-time',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be changed.',
    readonly: 'Read-only — the panel stays closed.',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    darkSurface: 'Dark surface — date-time tokens follow data-rs-theme, do not hard-code color',
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
    methodSet: 'setValue → 2025-07-01 09:00',
    methodClear: 'clearValidation()',
  },
  'zh-CN': {
    start: '开始时间',
    window: '活动时段',
    alarm: '提醒',
    invoice: '账单时间',
    now: '此刻',
    last7: '近 7 天',
    boundHint: '周末不可选。minDate / maxDate 锁在 2025 年 6 月。',
    secondsHint: 'withSeconds 写入 YYYY-MM-DD HH:mm:ss。默认是 HH:mm。',
    formatHint: 'format 是触发器。valueFormat 是 v-model。DateTimePicker 没有 withTime — 永远带时间。',
    vsHint: '只要日期用 DatePicker。只要时刻用 TimePicker。',
    disabled: '锁定日期时间',
    disabledHint: '不可用 — 附近写清原因。不能改值。',
    readonly: '只读 — 面板保持关闭。',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    darkSurface: '深色表面 — 日期时间 token 跟 data-rs-theme，不要写死颜色',
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
    methodSet: 'setValue → 2025-07-01 09:00',
    methodClear: 'clearValidation()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const shortcuts = computed(() => [
  { label: copy.value.now, value: () => '2025-06-16 14:30' },
  {
    label: copy.value.last7,
    value: () => ({ start: '2025-06-10 00:00', end: '2025-06-16 23:59' }),
  },
])

const basicCode = `<RsDateTimePicker v-model="when" label="Starts at" clearable />`

const rangeCode = `<RsDateTimePicker v-model="range" range label="Event window" />`

const secondsCode = `<RsDateTimePicker v-model="when" with-seconds />`

const formatCode = `<RsDateTimePicker
  v-model="when"
  format="MM/DD/YYYY HH:mm"
  value-format="iso"
/>`

const shortcutsCode = `<RsDateTimePicker
  v-model="when"
  :shortcuts="[{ label: 'Now', value: () => '2025-06-16 14:30' }]"
/>`

const boundCode = `<RsDateTimePicker
  v-model="when"
  min-date="2025-06-01"
  max-date="2025-06-30"
  :disabled-date="(d) => [0, 6].includes(new Date(d.year, d.month - 1, d.day).getDay())"
/>`

const sizeCode = `<RsDateTimePicker size="ssm" />
<RsDateTimePicker size="sm" />
<RsDateTimePicker size="md" />
<RsDateTimePicker size="lg" />`

const disabledCode = `<RsDateTimePicker disabled :model-value="when" />
<RsDateTimePicker readonly :model-value="when" />`

const eventsCode = `<RsDateTimePicker
  v-model="when"
  clearable
  @change="onChange"
  @open-change="onOpen"
  @clear="onClear"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const el = ref<RsDateTimePickerExpose | null>(null)
el.value?.focus()
el.value?.setValue('2025-07-01 09:00')
<RsDateTimePicker ref="el" v-model="when" />`

function formatEventValue(value: RsDatePickerModelValue): string {
  if (value == null || value === '') return '(empty)'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(' ~ ')
  return `${value.start ?? ''} ~ ${value.end ?? ''}`
}

function onChange(value: RsDatePickerModelValue) {
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

function disableWeekend(date: { year: number; month: number; day: number }) {
  return [0, 6].includes(new Date(date.year, date.month - 1, date.day).getDay())
}

function runFocus() {
  pickerRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runSet() {
  pickerRef.value?.setValue('2025-07-01 09:00')
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
    title="日期时间"
    title-en="Date and time"
    description="月历下嵌时间列。默认写入 YYYY-MM-DD HH:mm。没有 withTime — 包装组件永远带时间。"
    description-en="A calendar with a nested time field. Default v-model is YYYY-MM-DD HH:mm. There is no withTime — this wrapper always includes time."
    :code="basicCode"
  >
    <div class="field">
      <RsDateTimePicker v-model="single" :label="copy.start" clearable />
    </div>
    <p class="hint">{{ copy.vsHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-range"
    title="时段范围"
    title-en="Range"
    description="range 下一个触发器，面板左右各带月历和时间。"
    description-en="One trigger. The panel shows a start and an end, each with a calendar and time."
    :code="rangeCode"
  >
    <div class="field field--wide">
      <RsDateTimePicker v-model="range" :label="copy.window" range />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-seconds"
    title="带秒"
    title-en="Seconds"
    description="withSeconds 写入 YYYY-MM-DD HH:mm:ss。DatePicker 开 withTime 且未传 withSeconds 时默认带秒；本包装默认不带。"
    description-en="withSeconds writes YYYY-MM-DD HH:mm:ss. DatePicker withTime defaults to seconds when withSeconds is omitted. This wrapper defaults to minutes."
    :code="secondsCode"
  >
    <div class="field">
      <RsDateTimePicker v-model="seconds" :label="copy.alarm" with-seconds />
    </div>
    <p class="hint">{{ copy.secondsHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-format"
    title="展示与绑定"
    title-en="Display vs value"
    description="format 只改触发器。valueFormat 改 v-model（string / timestamp / iso / dayjs 模板）。"
    description-en="format is the trigger text. valueFormat is v-model: string, timestamp, iso, or a dayjs template."
    :code="formatCode"
  >
    <div class="field">
      <RsDateTimePicker
        v-model="displayWhen"
        :label="copy.invoice"
        format="MM/DD/YYYY HH:mm"
      />
    </div>
    <p class="hint">{{ copy.formatHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-shortcuts"
    title="快捷项"
    title-en="Shortcuts"
    description="有 shortcuts 时替代「此刻」。value() 返回墙钟日期时间或范围。"
    description-en="shortcuts replace Now. value() returns a wall-clock date-time or a range."
    :code="shortcutsCode"
  >
    <div class="field">
      <RsDateTimePicker v-model="single" :shortcuts="shortcuts" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-bound"
    title="边界与禁用日"
    title-en="Bounds"
    description="minDate / maxDate 裁剪日期。disabledDate 按天关闭。时刻边界走嵌套 TimePicker。"
    description-en="minDate / maxDate clip the days. disabledDate turns off a day. Time bounds belong on the nested TimePicker."
    :code="boundCode"
  >
    <div class="field">
      <RsDateTimePicker
        v-model="boundWhen"
        min-date="2025-06-01"
        max-date="2025-06-30"
        :disabled-date="disableWeekend"
      />
    </div>
    <p class="hint">{{ copy.boundHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档高度跟 Input / DatePicker 同一套 --rs-control-height-*。"
    description-en="Four heights. Same --rs-control-height-* as Input and DatePicker."
    :code="sizeCode"
  >
    <div class="stack">
      <RsDateTimePicker v-model="sizeWhen" size="ssm" />
      <RsDateTimePicker v-model="sizeWhen" size="sm" />
      <RsDateTimePicker v-model="sizeWhen" size="md" />
      <RsDateTimePicker v-model="sizeWhen" size="lg" />
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
      <RsDateTimePicker :model-value="single" disabled :label="copy.disabled" />
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsDateTimePicker :model-value="single" readonly :label="copy.readonly" />
      <RsForm disabled>
        <RsDateTimePicker :model-value="single" :label="copy.formDisabled" />
      </RsForm>
      <div class="canvas">
        <p class="canvas__caption">{{ copy.darkSurface }}</p>
        <div class="stage" data-rs-theme="dark">
          <RsDateTimePicker :model-value="single" :label="copy.start" />
        </div>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 change / openChange / clear / focus / blur。没有 click。事件从 DatePicker 转发。"
    description-en="The events you can feel are change, openChange, clear, focus, and blur. There is no click. Events are forwarded from DatePicker."
    :code="eventsCode"
  >
    <div class="field">
      <RsDateTimePicker
        v-model="eventWhen"
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
    description="宿主可调 focus() / blur() / setValue() / validate()。模板 ref 用 RsDateTimePickerExpose。"
    description-en="Hosts can call focus(), blur(), setValue(), and validate(). Type the template ref as RsDateTimePickerExpose."
    :code="methodsCode"
  >
    <div class="row">
      <div class="field">
        <RsDateTimePicker ref="pickerRef" v-model="methodWhen" />
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
