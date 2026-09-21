<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  formatDateParts,
  parseDateValue,
  RsButton,
  RsCalendarGrid,
  RsForm,
  type RsCalendarGridExpose,
  type RsParsedDate,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const selected = ref('2025-06-16')
const boundDate = ref('2025-06-16')
const weekDate = ref('2025-06-16')
const eventDate = ref('')
const methodDate = ref('2025-06-16')
const lastAction = ref('')
const methodLog = ref('')
const gridRef = ref<RsCalendarGridExpose | null>(null)

const view = reactive({ year: 2025, month: 6 })
const rangeView = reactive({ year: 2025, month: 6 })
const boundView = reactive({ year: 2025, month: 6 })
const weekView = reactive({ year: 2025, month: 6 })
const weekNumView = reactive({ year: 2025, month: 6 })
const sizeView = reactive({ year: 2025, month: 6 })
const slotView = reactive({ year: 2025, month: 6 })
const disabledView = reactive({ year: 2025, month: 6 })
const eventView = reactive({ year: 2025, month: 6 })
const methodView = reactive({ year: 2025, month: 6 })

const rangeStart = ref<RsParsedDate | null>({ year: 2025, month: 6, day: 10 })
const rangeEnd = ref<RsParsedDate | null>({ year: 2025, month: 6, day: 16 })

const marked = new Set(['2025-06-03', '2025-06-18', '2025-06-25'])

const { copy } = useSiteDemo({
  'en-US': {
    current: (value: string) => `Selected → ${value}`,
    idle: 'No event yet. select logs here.',
    selectHit: (value: string) => `select → ${value}`,
    rangeHint: 'The grid only paints the range. The parent decides the next click.',
    boundHint: 'Weekends are off. minDate / maxDate keep June 2025.',
    weekHint: 'weekStartsOn=0. en-US defaults to Sunday; zh-CN defaults to Monday.',
    weeksHint: 'ISO-8601 week numbers. Common on European rosters.',
    slotHint: 'Use #cell for marks. This is not a scheduler — keep the day number readable.',
    titleSlot: 'June roster',
    disabled: 'Locked month',
    disabledHint: 'disabled turns off days and the year / month buttons.',
    formDisabled: 'Inside a disabled form — the grid inherits Form.disabled',
    darkSurface: 'Dark surface — calendar tokens follow data-rs-theme, do not hard-code color',
    toFocus: 'focus()',
    toToday: 'goToToday()',
    methodIdle: 'Call focus / goToToday.',
    methodFocus: 'focus()',
    methodToday: 'goToToday()',
  },
  'zh-CN': {
    current: (value: string) => `当前 → ${value}`,
    idle: '还没有事件。select 会记在这里。',
    selectHit: (value: string) => `select → ${value}`,
    rangeHint: '格子只画范围。下一次点击由父组件解释。',
    boundHint: '周末不可选。minDate / maxDate 锁在 2025 年 6 月。',
    weekHint: 'weekStartsOn=0。en-US 默认周日，zh-CN 默认周一。',
    weeksHint: 'ISO-8601 周序号。欧洲排班常用。',
    slotHint: '用 #cell 画标记。这不是日程表 — 日子数字要能读。',
    titleSlot: '六月排班',
    disabled: '锁定月份',
    disabledHint: 'disabled 关掉日期和年 / 月按钮。',
    formDisabled: '在禁用的 Form 里 — 月历继承 Form.disabled',
    darkSurface: '深色表面 — 月历 token 跟 data-rs-theme，不要写死颜色',
    toFocus: 'focus()',
    toToday: 'goToToday()',
    methodIdle: '调用 focus / goToToday。',
    methodFocus: 'focus()',
    methodToday: 'goToToday()',
  },
})

const selectedDate = computed(() => parseDateValue(selected.value))
const boundParsed = computed(() => parseDateValue(boundDate.value))
const weekParsed = computed(() => parseDateValue(weekDate.value))
const eventParsed = computed(() => parseDateValue(eventDate.value))
const methodParsed = computed(() => parseDateValue(methodDate.value))
const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

function onRangeSelect(date: RsParsedDate): void {
  if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
    rangeStart.value = date
    rangeEnd.value = null
    return
  }
  const startNum = rangeStart.value.year * 10000 + rangeStart.value.month * 100 + rangeStart.value.day
  const nextNum = date.year * 10000 + date.month * 100 + date.day
  if (nextNum < startNum) {
    rangeEnd.value = rangeStart.value
    rangeStart.value = date
    return
  }
  rangeEnd.value = date
}

function disableWeekend(date: RsParsedDate): boolean {
  return [0, 6].includes(new Date(date.year, date.month - 1, date.day).getDay())
}

function onSelectLog(date: RsParsedDate): void {
  eventDate.value = formatDateParts(date)
  lastAction.value = copy.value.selectHit(eventDate.value)
}

function runFocus(): void {
  gridRef.value?.focus()
  methodLog.value = copy.value.methodFocus
}

function runToday(): void {
  gridRef.value?.goToToday()
  methodLog.value = copy.value.methodToday
}

const basicCode = `<RsCalendarGrid
  v-model:view-year="view.year"
  v-model:view-month="view.month"
  :selected="parseDateValue(date)"
  @select="(d) => (date = formatDateParts(d))"
/>`

const rangeCode = `<RsCalendarGrid
  v-model:view-year="view.year"
  v-model:view-month="view.month"
  :range-start="start"
  :range-end="end"
  @select="onRangeSelect"
/>`

const boundCode = `<RsCalendarGrid
  min-date="2025-06-01"
  max-date="2025-06-30"
  :disabled-date="(d) => [0, 6].includes(new Date(d.year, d.month - 1, d.day).getDay())"
/>`

const weekCode = `<RsCalendarGrid :week-starts-on="0" />`

const weeksCode = `<RsCalendarGrid show-week-numbers :week-starts-on="1" />`

const sizeCode = `<RsCalendarGrid size="ssm" />
<RsCalendarGrid size="sm" />
<RsCalendarGrid size="md" />
<RsCalendarGrid size="lg" />`

const slotsCode = `<RsCalendarGrid>
  <template #title="{ label }">{{ label }}</template>
  <template #cell="{ date, iso }">
    {{ date.day }}
    <i v-if="marks.has(iso)" />
  </template>
</RsCalendarGrid>`

const disabledCode = `<RsCalendarGrid disabled />
<RsForm disabled>
  <RsCalendarGrid />
</RsForm>`

const eventsCode = `<RsCalendarGrid @select="(d) => log(formatDateParts(d))" />`

const methodsCode = `const el = ref<RsCalendarGridExpose | null>(null)
el.value?.focus()
el.value?.goToToday()
<RsCalendarGrid ref="el" v-model:view-year="y" v-model:view-month="m" />`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="月历格子"
    title-en="Month grid"
    description="用 v-model:view-year / view-month 控展示月。@select 回 RsParsedDate。标题两侧双箭头切年、单箭头切月。"
    description-en="Drive the visible month with v-model:view-year / view-month. @select returns RsParsedDate. Double arrows change the year; single arrows change the month."
    :code="basicCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="view.year"
        v-model:view-month="view.month"
        :selected="selectedDate"
        @select="(date) => (selected = formatDateParts(date))"
      />
    </div>
    <p class="meta">{{ copy.current(selected) }}</p>
  </DocDemo>

  <DocDemo
    id="demo-range"
    title="范围高亮"
    title-en="Range"
    description="传入 range-start / range-end 画范围。点击逻辑由父组件处理，格子不写 v-model。"
    description-en="Pass range-start / range-end to paint a range. The parent owns clicks — the grid has no selected v-model."
    :code="rangeCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="rangeView.year"
        v-model:view-month="rangeView.month"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        @select="onRangeSelect"
      />
    </div>
    <p class="hint">{{ copy.rangeHint }}</p>
    <p class="meta">
      {{ rangeStart ? formatDateParts(rangeStart) : '—' }}
      ~
      {{ rangeEnd ? formatDateParts(rangeEnd) : '—' }}
    </p>
  </DocDemo>

  <DocDemo
    id="demo-bound"
    title="边界与禁用日"
    title-en="Bounds"
    description="minDate / maxDate 裁剪可选区间。disabledDate 按天关闭（假期、周末）。"
    description-en="minDate / maxDate clip the range. disabledDate turns off individual days (holidays, weekends)."
    :code="boundCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="boundView.year"
        v-model:view-month="boundView.month"
        :selected="boundParsed"
        min-date="2025-06-01"
        max-date="2025-06-30"
        :disabled-date="disableWeekend"
        @select="(date) => (boundDate = formatDateParts(date))"
      />
    </div>
    <p class="hint">{{ copy.boundHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-week"
    title="一周起始"
    title-en="First day of week"
    description="未传 weekStartsOn 时跟 locale。国际站点请显式传入，不要假设周一。"
    description-en="Omit weekStartsOn to follow the locale. International hosts should set it — do not assume Monday."
    :code="weekCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="weekView.year"
        v-model:view-month="weekView.month"
        :selected="weekParsed"
        :week-starts-on="0"
        @select="(date) => (weekDate = formatDateParts(date))"
      />
    </div>
    <p class="hint">{{ copy.weekHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-weeks"
    title="ISO 周序号"
    title-en="Week numbers"
    description="showWeekNumbers 在行首画 ISO-8601 周序号。建议 weekStartsOn=1。"
    description-en="showWeekNumbers draws ISO-8601 week numbers. Prefer weekStartsOn=1."
    :code="weeksCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="weekNumView.year"
        v-model:view-month="weekNumView.month"
        show-week-numbers
        :week-starts-on="1"
      />
    </div>
    <p class="hint">{{ copy.weeksHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档高度跟 Input / DatePicker 同一套 --rs-control-height-*。"
    description-en="Four heights. Same --rs-control-height-* as Input and DatePicker."
    :code="sizeCode"
  >
    <div class="sizes">
      <div v-for="size in (['ssm', 'sm', 'md', 'lg'] as const)" :key="size" class="panel">
        <RsCalendarGrid
          v-model:view-year="sizeView.year"
          v-model:view-month="sizeView.month"
          :size="size"
        />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#title 覆盖月份标题。#cell 画标记。不要用格子当完整日程表。"
    description-en="#title replaces the month label. #cell draws marks. Do not turn the grid into a full scheduler."
    :code="slotsCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="slotView.year"
        v-model:view-month="slotView.month"
      >
        <template #title>
          {{ copy.titleSlot }}
        </template>
        <template #cell="{ date, iso }">
          <span class="cell">
            {{ date.day }}
            <i v-if="marked.has(iso)" class="dot" />
          </span>
        </template>
      </RsCalendarGrid>
    </div>
    <p class="hint">{{ copy.slotHint }}</p>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 不能点选、不能翻页。组禁用继承 Form.disabled。"
    description-en="disabled cannot select or navigate. A group inherits Form.disabled."
    :code="disabledCode"
  >
    <div class="stack">
      <div class="panel">
        <RsCalendarGrid
          v-model:view-year="disabledView.year"
          v-model:view-month="disabledView.month"
          :selected="selectedDate"
          disabled
        />
      </div>
      <p class="hint">{{ copy.disabledHint }}</p>
      <RsForm disabled>
        <div class="panel">
          <RsCalendarGrid
            v-model:view-year="disabledView.year"
            v-model:view-month="disabledView.month"
            :selected="selectedDate"
          />
        </div>
      </RsForm>
      <p class="hint">{{ copy.formDisabled }}</p>
      <div class="canvas">
        <p class="canvas__caption">{{ copy.darkSurface }}</p>
        <div class="stage" data-rs-theme="dark">
          <RsCalendarGrid
            v-model:view-year="view.year"
            v-model:view-month="view.month"
            :selected="selectedDate"
          />
        </div>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 select。翻页走 update:viewYear / update:viewMonth。没有 change / click。"
    description-en="The event you can feel is select. Navigation uses update:viewYear / update:viewMonth. There is no change or click."
    :code="eventsCode"
  >
    <div class="panel">
      <RsCalendarGrid
        v-model:view-year="eventView.year"
        v-model:view-month="eventView.month"
        :selected="eventParsed"
        @select="onSelectLog"
      />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 focus() / goToToday()。模板 ref 用 RsCalendarGridExpose。goToToday 不发 select。"
    description-en="Hosts can call focus() and goToToday(). Type the template ref as RsCalendarGridExpose. goToToday does not emit select."
    :code="methodsCode"
  >
    <div class="row">
      <div class="panel">
        <RsCalendarGrid
          ref="gridRef"
          v-model:view-year="methodView.year"
          v-model:view-month="methodView.month"
          :selected="methodParsed"
          @select="(date) => (methodDate = formatDateParts(date))"
        />
      </div>
      <RsButton variant="default" @click="runFocus">{{ copy.toFocus }}</RsButton>
      <RsButton variant="default" @click="runToday">{{ copy.toToday }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.panel {
  width: fit-content;
  padding: var(--rs-space-sm);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

.sizes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-md);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--rs-space-sm);
}

.meta,
.hint,
.event-log,
.canvas__caption {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.event-log[data-live] {
  color: var(--rs-text);
}

.canvas {
  margin: var(--rs-space-md) 0 0;
}

.stage {
  width: fit-content;
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text);
}

.cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dot {
  position: absolute;
  inset-block-end: 0.1rem;
  inset-inline-start: 50%;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: var(--rs-radius-full);
  background: var(--rs-primary);
  transform: translateX(-50%);
}
</style>
