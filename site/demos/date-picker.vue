<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsDatePicker,
  RsForm,
  type RsDatePickerExpose,
  type RsDatePickerModelValue,
  type RsDateRangeValue,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const single = ref('2025-06-16')
const range = ref<RsDateRangeValue>({ start: '2025-06-01', end: '2025-06-30' })
const datetime = ref('2025-06-16 14:30:00')
const displayDate = ref('2025-06-16')
const weekDate = ref('2025-06-16')
const boundDate = ref('2025-06-16')
const sizeDate = ref('2025-06-16')
const eventDate = ref('')
const methodDate = ref('')
const lastAction = ref('')
const methodLog = ref('')
const pickerRef = ref<RsDatePickerExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    publish: 'Publish date',
    range: 'Report range',
    scheduled: 'Scheduled at',
    display: 'Invoice date',
    week: 'Week starts Sunday',
    weekHint: 'weekStartsOn=0. en-US defaults to Sunday; zh-CN defaults to Monday.',
    last7: 'Last 7 days',
    thisMonth: 'This month',
    boundHint: 'Weekends are off. minDate / maxDate keep June 2025.',
    disabled: 'Locked date',
    disabledHint: 'Unavailable — explain why nearby. The field cannot be changed.',
    readonly: 'Read-only — the panel stays closed.',
    formDisabled: 'Inside a disabled form — the field inherits Form.disabled',
    darkSurface: 'Dark surface — date picker tokens follow data-rs-theme, do not hard-code color',
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
    methodSet: 'setValue → 2025-07-01',
    methodClear: 'clearValidation()',
  },
  'zh-CN': {
    publish: '发布日期',
    range: '统计区间',
    scheduled: '计划时间',
    display: '账单日期',
    week: '周日为一周起始',
    weekHint: 'weekStartsOn=0。en-US 默认周日，zh-CN 默认周一。',
    last7: '近 7 天',
    thisMonth: '本月',
    boundHint: '周末不可选。minDate / maxDate 锁在 2025 年 6 月。',
    disabled: '锁定日期',
    disabledHint: '不可用 — 附近写清原因。不能改值。',
    readonly: '只读 — 面板保持关闭。',
    formDisabled: '在禁用的 Form 里 — 字段继承 Form.disabled',
    darkSurface: '深色表面 — 日期选择 token 跟 data-rs-theme，不要写死颜色',
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
    methodSet: 'setValue → 2025-07-01',
    methodClear: 'clearValidation()',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const shortcuts = computed(() => [
  {
    label: copy.value.last7,
    value: () => ({ start: '2025-06-10', end: '2025-06-16' }),
  },
  {
    label: copy.value.thisMonth,
    value: () => ({ start: '2025-06-01', end: '2025-06-30' }),
  },
])

const basicCode = `<RsDatePicker v-model="date" label="Publish date" clearable />`

const rangeCode = `<RsDatePicker
  v-model="range"
  range
  label="Report range"
/>`

const datetimeCode = `<RsDatePicker
  v-model="when"
  with-time
  label="Scheduled at"
/>

<RsDateTimePicker v-model="when" />`

const formatCode = `<RsDatePicker
  v-model="date"
  format="MM/DD/YYYY"
  value-format="iso"
/>`

const weekCode = `<RsDatePicker v-model="date" :week-starts-on="0" />`

const shortcutsCode = `<RsDatePicker
  v-model="range"
  range
  :shortcuts="[
    { label: 'Last 7 days', value: () => ({ start, end }) },
  ]"
/>`

const boundCode = `<RsDatePicker
  v-model="date"
  min-date="2025-06-01"
  max-date="2025-06-30"
  :disabled-date="(d) => [0, 6].includes(new Date(d.year, d.month - 1, d.day).getDay())"
/>`

const sizeCode = `<RsDatePicker size="ssm" />
<RsDatePicker size="sm" />
<RsDatePicker size="md" />
<RsDatePicker size="lg" />`

const disabledCode = `<RsDatePicker disabled :model-value="date" />
<RsDatePicker readonly :model-value="date" />`

const eventsCode = `<RsDatePicker
  v-model="date"
  clearable
  @change="onChange"
  @open-change="onOpen"
  @clear="onClear"
  @focus="onFocus"
  @blur="onBlur"
/>`

const methodsCode = `const el = ref<RsDatePickerExpose | null>(null)
el.value?.focus()
el.value?.setValue('2025-07-01')
<RsDatePicker ref="el" v-model="date" />`

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
  pickerRef.value?.setValue('2025-07-01')
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
    title="单选日期"
    title-en="Single date"
    description="选中后点确定写入 v-model（YYYY-MM-DD）。label / hint / required 与输入框一致。"
    description-en="Confirm writes v-model as YYYY-MM-DD. label / hint / required match other fields."
    :code="basicCode"
  >
    <div class="field">
      <RsDatePicker v-model="single" :label="copy.publish" clearable />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-range"
    title="日期范围"
    title-en="Range"
    description="range 模式下触发器仍是一个输入框，面板内左右双月历选起止。"
    description-en="One trigger. The panel shows two months for start and end."
    :code="rangeCode"
  >
    <div class="field field--wide">
      <RsDatePicker v-model="range" :label="copy.range" range />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-datetime"
    title="日期时间"
    title-en="Date and time"
    description="withTime 在日历下嵌时间。只要时间用 TimePicker；包装组件是 DateTimePicker。"
    description-en="withTime nests a time field under the calendar. Time only belongs on TimePicker. DateTimePicker is the wrapper."
    :code="datetimeCode"
  >
    <div class="field">
      <RsDatePicker v-model="datetime" :label="copy.scheduled" with-time clearable />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-format"
    title="展示与绑定"
    title-en="Display vs value"
    description="format 只改触发器文案。valueFormat 改 v-model（string / timestamp / iso / dayjs 模板）。"
    description-en="format is the trigger text. valueFormat is v-model: string, timestamp, iso, or a dayjs template."
    :code="formatCode"
  >
    <div class="field">
      <RsDatePicker v-model="displayDate" :label="copy.display" format="MM/DD/YYYY" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-week"
    title="一周起始"
    title-en="First day of week"
    description="未传 weekStartsOn 时跟 locale。国际站点请显式传入，不要假设周一。"
    description-en="Omit weekStartsOn to follow the locale. International hosts should set it — do not assume Monday."
    :code="weekCode"
  >
    <div class="field">
      <RsDatePicker v-model="weekDate" :label="copy.week" :week-starts-on="0" />
    </div>
    <p class="hint">{{ copy.weekHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-shortcuts"
    title="快捷项"
    title-en="Shortcuts"
    description="有 shortcuts 时替代「今天 / 此刻」链接。value() 返回墙钟字符串或范围。"
    description-en="shortcuts replace the Today / Now link. value() returns a wall-clock string or a range."
    :code="shortcutsCode"
  >
    <div class="field field--wide">
      <RsDatePicker v-model="range" :label="copy.range" range :shortcuts="shortcuts" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-bound"
    title="边界与禁用日"
    title-en="Bounds"
    description="minDate / maxDate 裁剪可选区间。disabledDate 按天关闭（假期、周末）。"
    description-en="minDate / maxDate clip the range. disabledDate turns off individual days (holidays, weekends)."
    :code="boundCode"
  >
    <div class="field">
      <RsDatePicker
        v-model="boundDate"
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
    description="四档高度跟 Input / Select 同一套 --rs-control-height-*。"
    description-en="Four heights. Same --rs-control-height-* as Input and Select."
    :code="sizeCode"
  >
    <div class="stack">
      <RsDatePicker v-model="sizeDate" size="ssm" />
      <RsDatePicker v-model="sizeDate" size="sm" />
      <RsDatePicker v-model="sizeDate" size="md" />
      <RsDatePicker v-model="sizeDate" size="lg" />
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
      <RsDatePicker :model-value="single" disabled :label="copy.disabled" />
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsDatePicker :model-value="single" readonly :label="copy.readonly" />
      <RsForm disabled>
        <RsDatePicker :model-value="single" :label="copy.formDisabled" />
      </RsForm>
      <div class="canvas">
        <p class="canvas__caption">{{ copy.darkSurface }}</p>
        <div class="stage" data-rs-theme="dark">
          <RsDatePicker :model-value="single" :label="copy.publish" />
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
      <RsDatePicker
        v-model="eventDate"
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
    description="宿主可调 focus() / blur() / setValue() / validate()。模板 ref 用 RsDatePickerExpose。"
    description-en="Hosts can call focus(), blur(), setValue(), and validate(). Type the template ref as RsDatePickerExpose."
    :code="methodsCode"
  >
    <div class="row">
      <div class="field">
        <RsDatePicker ref="pickerRef" v-model="methodDate" />
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
