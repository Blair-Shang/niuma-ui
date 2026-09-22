<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsIcon, RsStatCard } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const loading = ref(false)
const eventLog = ref('')
const methodLog = ref('')
const cardRef = ref<Record<string, unknown> | null>(null)

const compactFormat = { notation: 'compact' as const }
const usdFormat = { style: 'currency' as const, currency: 'USD' }

const { copy } = useSiteDemo({
  'en-US': {
    calls: 'Calls today',
    running: 'Running',
    failed: 'Failed jobs',
    window: 'Last 24 hours',
    delta: 'vs yesterday +2',
    dark: 'Dark surface — tokens follow data-rs-theme',
    load: 'Show skeleton',
    loaded: 'Show figure',
    loadingCaption: 'The caption stays. The component does not start a timer.',
    raw: 'Raw number',
    grouped: 'Locale grouping',
    compact: 'Compact notation',
    revenue: 'Revenue',
    formatNote: 'Switch the site locale. 12480 stays 12480 until format is on. Compact becomes 12K or 1.2万.',
    errors: 'Error rate',
    latency: 'p95 latency',
    queue: 'Queue',
    flat: 'unchanged',
    upGood: '+8.2%',
    upBad: '+0.03 pp',
    unit: 'Requests',
    duration: 'Duration',
    compactSize: 'Compact',
    defaultSize: 'Default',
    relaxed: 'Relaxed',
    custom: 'Custom figure',
    storage: 'Storage',
    used: '34 GB of 50 GB',
    open: 'Open jobs',
    idle: 'RsStatCard emits nothing. The button next to it does.',
    clicked: 'click → Refresh',
    refresh: 'Refresh',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no open() on the stat card ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    calls: '今日调用',
    running: '运行中',
    failed: '失败任务',
    window: '过去 24 小时',
    delta: '较昨日 +2',
    dark: '深色表面 — 颜色跟 data-rs-theme',
    load: '显示骨架',
    loaded: '显示数值',
    loadingCaption: '说明还在。组件内部不排定时器。',
    raw: '原文数字',
    grouped: '按语言分组',
    compact: '紧凑记法',
    revenue: '营收',
    formatNote: '切换站点语言。未开 format 时 12480 仍是 12480。紧凑记法会变成 12K 或 1.2万。',
    errors: '错误率',
    latency: 'p95 延迟',
    queue: '队列',
    flat: '持平',
    upGood: '+8.2%',
    upBad: '+0.03 个百分点',
    unit: '请求',
    duration: '耗时',
    compactSize: '紧凑',
    defaultSize: '默认',
    relaxed: '宽松',
    custom: '自定义数值',
    storage: '存储',
    used: '已用 34 GB / 50 GB',
    open: '查看任务',
    idle: 'RsStatCard 不发事件。旁边的按钮才会。',
    clicked: 'click → Refresh',
    refresh: '刷新',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。指标卡 ref 上没有 open()。',
    methodNone: 'expose 键：none',
  },
})

const eventNote = computed(() => eventLog.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<div class="grid">
  <RsStatCard label="Calls today" :value="12480" />
  <RsStatCard label="Running" :value="12" accent="success" description="vs yesterday +2" />
  <RsStatCard label="Failed jobs" :value="2" accent="danger" />
</div>`

const loadingCode = `<RsStatCard
  label="Calls today"
  :value="12480"
  description="The caption stays."
  :loading="loading"
/>
<RsButton @click="loading = !loading">Show skeleton</RsButton>`

const formatCode = `<RsStatCard label="Raw number" :value="12480" />
<RsStatCard label="Locale grouping" :value="12480" format />
<RsStatCard label="Compact notation" :value="12480" :format="{ notation: 'compact' }" />
<RsStatCard
  label="Revenue"
  :value="1234.5"
  :format="{ style: 'currency', currency: 'USD' }"
/>`

const trendCode = `<RsStatCard
  label="Calls today"
  :value="12480"
  format
  trend="up"
  trend-tone="success"
  delta="+8.2%"
/>
<RsStatCard
  label="Error rate"
  value="0.12%"
  accent="danger"
  trend="up"
  trend-tone="danger"
  delta="+0.03 pp"
  description="Last 24 hours"
/>
<RsStatCard label="Queue" :value="8" accent="info" trend="flat" delta="unchanged" />`

const affixCode = `<RsStatCard label="Requests" :value="860" suffix="req/s" />
<RsStatCard label="Duration" :value="42" suffix="ms" accent="info" />`

const sizeCode = `<RsStatCard size="sm" label="Compact" :value="12" />
<RsStatCard size="md" label="Default" :value="12" />
<RsStatCard size="lg" label="Relaxed" :value="12" />`

const slotsCode = `<RsStatCard label="Storage" description="34 GB of 50 GB">
  <template #icon>
    <RsIcon name="database" :size="18" />
  </template>
  <template #value>68</template>
  <template #suffix>%</template>
  <RsButton size="sm" variant="default">Open jobs</RsButton>
</RsStatCard>`

const eventsCode = `<RsStatCard label="Calls today" :value="12480" />
<RsButton variant="default" @click="log = 'click → Refresh'">Refresh</RsButton>`

const methodsCode = `const card = ref()
// RsStatCard has no defineExpose — card.value.open is undefined
<RsStatCard ref="card" label="Calls today" :value="12480" />`

function toggleLoading() {
  loading.value = !loading.value
}

function onRefresh() {
  eventLog.value = copy.value.clicked
}

function inspectCardRef() {
  const inst = cardRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="名称、数值、可选说明。顶角色条用 accent，默认 primary。根是原生 section。数字默认不分组，和以前一样。"
    description-en="Name, figure, and an optional caption. accent paints the top bar and defaults to primary. The root is a native section. Numbers stay ungrouped, as before."
    :code="basicCode"
  >
    <div class="grid">
      <RsStatCard :label="copy.calls" :value="12480" />
      <RsStatCard :label="copy.running" :value="12" accent="success" :description="copy.delta" />
      <RsStatCard :label="copy.failed" :value="2" accent="danger" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.dark }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <div class="grid">
          <RsStatCard :label="copy.calls" :value="12480" />
          <RsStatCard :label="copy.failed" :value="2" accent="danger" :description="copy.window" />
        </div>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-loading"
    title="加载"
    title-en="Loading"
    description="loading 用骨架换掉数值，并加上 aria-busy。说明和默认插槽还在。开关在按钮上，卡片自己不排定时器。"
    description-en="loading swaps the figure for a skeleton and sets aria-busy. The caption and default slot stay. The toggle is a button — the card does not start a timer."
    :code="loadingCode"
  >
    <div class="row">
      <RsButton variant="default" @click="toggleLoading">
        {{ loading ? copy.loaded : copy.load }}
      </RsButton>
    </div>
    <div class="grid">
      <RsStatCard :label="copy.calls" :value="12480" :description="copy.loadingCaption" :loading="loading" />
      <RsStatCard :label="copy.running" :value="12" accent="success" :loading="loading" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-format"
    title="数字与货币"
    title-en="Numbers and currency"
    description="把 value 传成数字再打开 format。紧凑记法和货币符号位置跟 RsConfigProvider.locale。已经拼好的字符串不要再格式化。货币不要手写进 prefix。"
    description-en="Pass value as a number, then turn format on. Compact notation and currency placement follow RsConfigProvider.locale. Leave a string you already built alone. Do not put a currency symbol in prefix."
    :code="formatCode"
  >
    <p class="note">{{ copy.formatNote }}</p>
    <div class="grid">
      <RsStatCard :label="copy.raw" :value="12480" />
      <RsStatCard :label="copy.grouped" :value="12480" format />
      <RsStatCard :label="copy.compact" :value="12480" :format="compactFormat" accent="info" />
      <RsStatCard :label="copy.revenue" :value="1234.5" :format="usdFormat" accent="success" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-trend"
    title="涨跌"
    title-en="Trend"
    description="trend 只表示方向，trend-tone 表示好坏。错误率上升用 danger，调用量上升用 success。箭头对读屏隐藏，方向词跟语言包。"
    description-en="trend is direction. trend-tone is whether that direction is good. An error-rate increase uses danger; a call-volume increase uses success. The mark is hidden from assistive tech; the word follows the locale."
    :code="trendCode"
  >
    <div class="grid">
      <RsStatCard
        :label="copy.calls"
        :value="12480"
        format
        trend="up"
        trend-tone="success"
        :delta="copy.upGood"
      />
      <RsStatCard
        :label="copy.errors"
        value="0.12%"
        accent="danger"
        trend="up"
        trend-tone="danger"
        :delta="copy.upBad"
        :description="copy.window"
      />
      <RsStatCard
        :label="copy.latency"
        :value="42"
        suffix="ms"
        accent="warning"
        trend="down"
        trend-tone="success"
        delta="-6 ms"
      />
      <RsStatCard :label="copy.queue" :value="8" accent="info" trend="flat" :delta="copy.flat" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-affix"
    title="单位"
    title-en="Units"
    description="prefix / suffix 放你自己控制的单位。它们跟书写方向排在数字前后。货币仍走 format。"
    description-en="prefix / suffix are for units you control. They sit before or after the number in reading order. Money still goes through format."
    :code="affixCode"
  >
    <div class="grid">
      <RsStatCard :label="copy.unit" :value="860" suffix="req/s" />
      <RsStatCard :label="copy.duration" :value="42" suffix="ms" accent="info" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="疏密"
    title-en="Density"
    description="size 只改内边距和数值字号。不是按钮那套控件高度，没有 ssm。"
    description-en="size changes padding and the figure size. It is not control height, and there is no ssm."
    :code="sizeCode"
  >
    <div class="grid">
      <RsStatCard size="sm" :label="copy.compactSize" :value="12" />
      <RsStatCard size="md" :label="copy.defaultSize" :value="12" />
      <RsStatCard size="lg" :label="copy.relaxed" :value="12" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="图标放进 #icon（装饰，读屏跳过）。#value 换数值，单位仍可用 suffix。操作放默认插槽里的按钮，不要点图标。"
    description-en="Put an icon in #icon (decorative, skipped by assistive tech). #value replaces the figure; suffix can still add a unit. Put actions on a button in the default slot — do not click the icon."
    :code="slotsCode"
  >
    <div class="grid">
      <RsStatCard :label="copy.storage" value="68%" :description="copy.used">
        <template #icon>
          <RsIcon name="database" :size="18" />
        </template>
        <template #value>68</template>
        <template #suffix>%</template>
        <div class="meter" aria-hidden="true">
          <div class="meter__fill" />
        </div>
        <RsButton size="sm" variant="default">{{ copy.open }}</RsButton>
      </RsStatCard>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件，也没有 aria-live。数值更新不会自动播报。可感知的点击绑在旁边的按钮上。"
    description-en="No component events and no aria-live. Value updates are not announced. Bind a click you can feel on the button beside the card."
    :code="eventsCode"
  >
    <div class="row">
      <RsStatCard :label="copy.calls" :value="12480" />
      <RsButton variant="default" @click="onRefresh">{{ copy.refresh }}</RsButton>
    </div>
    <p class="event-log" :data-live="eventLog ? '1' : undefined">{{ eventNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsStatCard ref="cardRef" :label="copy.calls" :value="12480" />
      <RsButton variant="default" @click="inspectCardRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.note,
.event-log,
.canvas__caption {
  margin: 0 0 0.75rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.event-log {
  margin-block-start: 0.75rem;
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}

.canvas {
  margin: 0.9rem 0 0;
}

.stage {
  padding: var(--rs-space-lg);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}

.meter {
  block-size: var(--rs-space-xs);
  margin-block: var(--rs-space-sm) var(--rs-space-md);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-hover);
  overflow: hidden;
}

.meter__fill {
  inline-size: 68%;
  block-size: 100%;
  border-radius: inherit;
  background: var(--rs-info);
}
</style>
