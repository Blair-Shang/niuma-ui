<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RsButton, RsLoading } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const tones = ['default', 'neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const

const loading = ref(true)
const panelLoading = ref(true)
const blur = ref(false)
const full = ref(false)
const delayLoading = ref(false)
const delayState = ref<'idle' | 'pending' | 'shown' | 'skipped'>('idle')
const methodLog = ref('')
const loadingRef = ref<Record<string, unknown> | null>(null)

let delayTimers: ReturnType<typeof setTimeout>[] = []
let fullTimer: ReturnType<typeof setTimeout> | undefined

const { copy } = useSiteDemo({
  'en-US': {
    sync: 'Syncing projects…',
    refresh: 'Refreshing the list…',
    hide: 'Hide',
    show: 'Show',
    panelOn: 'loading = true. The list stays mounted and is inert.',
    panelOff: 'loading = false. The indicator unmounts. The list is still here.',
    blurOn: 'Blur off',
    blurOff: 'Blur on',
    legacyBody: 'Parent is position: relative. The indicator does not wrap this text.',
    legacyLabel: 'Loading this pane…',
    fast: 'Fast request (80ms)',
    slow: 'Slow request',
    delayLabel: 'Saving…',
    delayIdle: 'Idle. A request shorter than delay never shows the indicator.',
    delayPending: 'Waiting. delay is 300ms.',
    delayShown: 'Shown. The request outlasted delay.',
    delaySkipped: 'Skipped. loading became false before delay.',
    customLabel: 'Fetching the latest draft',
    fullLabel: 'Loading the workspace…',
    openFull: 'Open fullscreen',
    closeFull: 'Close',
    fullIdle: 'Fullscreen is closed. The indicator teleports to body and leaves on close.',
    fullOn: 'Fullscreen is open. Close is in #label so it stays clickable.',
    darkSurface: 'Dark surface — loading tokens follow data-rs-theme, do not hard-code color',
    idle: 'RsLoading emits nothing. Toggle loading on RsButton.',
    switchedOn: 'loading → true',
    switchedOff: 'loading → false',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no show() on the loading ref.',
    methodNone: 'expose keys: none',
    rows: 'rows',
  },
  'zh-CN': {
    sync: '正在同步项目…',
    refresh: '正在刷新列表…',
    hide: '隐藏',
    show: '显示',
    panelOn: 'loading = true。列表仍挂着，并且 inert。',
    panelOff: 'loading = false。指示器卸掉，列表还在。',
    blurOn: '关闭模糊',
    blurOff: '打开模糊',
    legacyBody: '父级自己 position: relative。指示器不包裹这段文字。',
    legacyLabel: '正在加载此区域…',
    fast: '快请求（80ms）',
    slow: '慢请求',
    delayLabel: '正在保存…',
    delayIdle: '空闲。短于 delay 的请求不会出现指示器。',
    delayPending: '等待中。delay 为 300ms。',
    delayShown: '已出现。请求长过了 delay。',
    delaySkipped: '已跳过。delay 结束前 loading 已变为 false。',
    customLabel: '正在获取最新草稿',
    fullLabel: '正在加载工作区…',
    openFull: '打开全屏',
    closeFull: '关闭',
    fullIdle: '全屏已关。指示器传送到 body，关闭后离开。',
    fullOn: '全屏已开。关闭按钮在 #label 里，所以还能点。',
    darkSurface: '深色表面 — 加载 token 跟 data-rs-theme，不要写死颜色',
    idle: 'RsLoading 不发事件。用 RsButton 改 loading。',
    switchedOn: 'loading → true',
    switchedOff: 'loading → false',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。loading ref 上没有 show()。',
    methodNone: 'expose 键：none',
    rows: '行',
  },
})

const switchNote = computed(() => (loading.value ? copy.value.switchedOn : copy.value.switchedOff))
const panelNote = computed(() => (panelLoading.value ? copy.value.panelOn : copy.value.panelOff))
const fullNote = computed(() => (full.value ? copy.value.fullOn : copy.value.fullIdle))
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)
const delayNote = computed(() => {
  if (delayState.value === 'pending') return copy.value.delayPending
  if (delayState.value === 'shown') return copy.value.delayShown
  if (delayState.value === 'skipped') return copy.value.delaySkipped
  return copy.value.delayIdle
})

function clearDelayTimers() {
  delayTimers.forEach((id) => clearTimeout(id))
  delayTimers = []
}

function arm(ms: number, fn: () => void) {
  delayTimers.push(setTimeout(fn, ms))
}

function runFast() {
  clearDelayTimers()
  delayState.value = 'pending'
  delayLoading.value = true
  arm(80, () => {
    delayLoading.value = false
    delayState.value = 'skipped'
  })
}

function runSlow() {
  clearDelayTimers()
  delayState.value = 'pending'
  delayLoading.value = true
  arm(500, () => {
    delayState.value = 'shown'
  })
  arm(1100, () => {
    delayLoading.value = false
    delayState.value = 'idle'
  })
}

function openFull() {
  full.value = true
  if (fullTimer) clearTimeout(fullTimer)
  fullTimer = setTimeout(() => {
    full.value = false
  }, 4000)
}

function closeFull() {
  full.value = false
  if (fullTimer) clearTimeout(fullTimer)
}

function inspectLoadingRef() {
  const inst = loadingRef.value
  const keys = inst ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$')) : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}

onUnmounted(() => {
  clearDelayTimers()
  closeFull()
})

const variantCode = `<RsLoading variant="spinner" />
<RsLoading variant="dots" />
<RsLoading variant="skeleton" />`

const sizeCode = `<RsLoading size="sm" />
<RsLoading size="md" />
<RsLoading size="lg" />
<RsLoading variant="dots" size="lg" />`

const toneCode = `<RsLoading tone="default" />
<RsLoading tone="primary" />
<RsLoading tone="success" />
<RsLoading tone="warning" />
<RsLoading tone="danger" />
<RsLoading tone="info" />`

const labelCode = `<RsLoading show-label />
<RsLoading show-label label="Syncing projects…" />
<RsLoading show-label label="Syncing" aria-label="Syncing projects" />`

const switchCode = `<RsButton @click="loading = !loading">{{ loading ? 'Hide' : 'Show' }}</RsButton>
<RsLoading :loading="loading" show-label />`

const wrapCode = `<RsLoading :loading="panelLoading" :blur="blur" show-label label="Refreshing the list…">
  <ul>
    <li>Alpha · In progress</li>
    <li>Beta · In review</li>
    <li>Gamma · Archived</li>
  </ul>
</RsLoading>`

const overlayCode = `<div class="pane">
  <p>Parent is position: relative.</p>
  <RsLoading overlay show-label label="Loading this pane…" />
</div>`

const delayCode = `<RsLoading :loading="pending" :delay="300" show-label label="Saving…" />`

const skeletonCode = `<RsLoading variant="skeleton" :skeleton-lines="2" />
<RsLoading variant="skeleton" :skeleton-lines="6" />`

const slotsCode = `<RsLoading show-label>
  <template #indicator>
    <span class="mark" />
  </template>
  <template #label>Fetching the latest draft</template>
</RsLoading>`

const fullCode = `<RsButton @click="open = true">Open fullscreen</RsButton>
<RsLoading v-if="open" fullscreen>
  <template #label>
    <span>Loading the workspace…</span>
    <RsButton @click="open = false">Close</RsButton>
  </template>
</RsLoading>`

const themeCode = `<div data-rs-theme="dark">
  <RsLoading />
  <RsLoading variant="dots" tone="success" />
  <RsLoading variant="skeleton" />
</div>`

const methodCode = `<RsLoading ref="loadingRef" />
<RsButton @click="inspect">Inspect ref</RsButton>`
</script>

<template>
  <DocDemo
    id="demo-variant"
    title="形态"
    title-en="Variant"
    description="variant 只改形状：圆环、三点、骨架。颜色走 tone。loading=false 时不渲染指示器。"
    description-en="variant changes shape only: ring, dots, or skeleton. Color is tone. loading=false does not render the indicator."
    :code="variantCode"
  >
    <div class="row">
      <RsLoading variant="spinner" />
      <RsLoading variant="dots" />
      <div class="skeleton-box">
        <RsLoading variant="skeleton" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="sm / md / lg 同时作用于圆环、圆点和骨架行高。不跟 ConfigProvider。"
    description-en="sm / md / lg size the ring, the dots, and the skeleton rows. Size does not follow ConfigProvider."
    :code="sizeCode"
  >
    <div class="stack">
      <div class="row">
        <RsLoading size="sm" />
        <RsLoading size="md" />
        <RsLoading size="lg" />
      </div>
      <div class="row">
        <RsLoading variant="dots" size="sm" />
        <RsLoading variant="dots" size="md" />
        <RsLoading variant="dots" size="lg" />
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="色相"
    title-en="Tone"
    description="tone 给圆环和圆点上色。default 与 neutral 都是次级文字色。未传 tone 时是 primary。骨架不跟着变色。"
    description-en="tone colors the ring and the dots. default and neutral both use secondary text. Omitting tone uses primary. Skeleton does not pick up the hue."
    :code="toneCode"
  >
    <div class="tones">
      <figure v-for="tone in tones" :key="tone">
        <RsLoading :tone="tone" variant="dots" />
        <figcaption>{{ tone }}</figcaption>
      </figure>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-label"
    title="文案"
    title-en="Label"
    description="不传 label 时，可见文案和 aria-label 都走 loading.label，随 RsConfigProvider 的语言变化。aria-label 只改可访问名称。"
    description-en="Omit label and both the visible copy and aria-label use loading.label, which follows RsConfigProvider locale. aria-label changes only the accessible name."
    :code="labelCode"
  >
    <div class="row">
      <RsLoading show-label />
      <RsLoading show-label :label="copy.sync" />
      <RsLoading show-label label="Syncing" aria-label="Syncing projects" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-switch"
    title="开关"
    title-en="Toggle"
    description="组件不发事件。用按钮改 loading。点指示器本身没有回调。"
    description-en="The component emits nothing. Change loading from a button. Clicking the indicator has no callback."
    :code="switchCode"
  >
    <div class="row">
      <RsButton size="sm" variant="default" @click="loading = !loading">
        {{ loading ? copy.hide : copy.show }}
      </RsButton>
      <RsLoading :loading="loading" show-label />
    </div>
    <p class="event-log" :data-live="loading ? '1' : undefined">{{ switchNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-wrap"
    title="盖住内容"
    title-en="Cover content"
    description="默认插槽是被盖住的区域。loading 期间这块 inert，取消按钮要放在外面。blur 默认关。"
    description-en="The default slot is the region to cover. It is inert while loading, so keep a cancel button outside. blur is off unless you turn it on."
    :code="wrapCode"
  >
    <div class="row">
      <RsButton size="sm" variant="primary" @click="panelLoading = !panelLoading">
        {{ panelLoading ? copy.hide : copy.show }}
      </RsButton>
      <RsButton size="sm" variant="default" @click="blur = !blur">
        {{ blur ? copy.blurOn : copy.blurOff }}
      </RsButton>
    </div>
    <div class="panel">
      <RsLoading :loading="panelLoading" :blur="blur" show-label :label="copy.refresh">
        <ul class="list">
          <li>Alpha · In progress</li>
          <li>Beta · In review</li>
          <li>Gamma · Archived</li>
        </ul>
      </RsLoading>
    </div>
    <p class="event-log" :data-live="panelLoading ? '1' : undefined">{{ panelNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-overlay"
    title="父级遮罩"
    title-en="Parent overlay"
    description="不传插槽时，overlay 仍绝对铺满父级。父级要自己 position: relative。新代码优先用默认插槽。"
    description-en="Without a slot, overlay still fills a parent that is position: relative. New code should prefer the default slot."
    :code="overlayCode"
  >
    <div class="panel panel--legacy">
      <p class="legacy">{{ copy.legacyBody }}</p>
      <RsLoading overlay show-label :label="copy.legacyLabel" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-delay"
    title="延迟"
    title-en="Delay"
    description="delay 让快请求不闪一下。请求在延迟结束前完成，指示器不会出现。定时器在卸载时清除。"
    description-en="delay hides the indicator for a fast request. If loading ends first, the indicator never appears. The timer is cleared on unmount."
    :code="delayCode"
  >
    <div class="row">
      <RsButton size="sm" variant="default" @click="runFast">{{ copy.fast }}</RsButton>
      <RsButton size="sm" variant="primary" @click="runSlow">{{ copy.slow }}</RsButton>
      <RsLoading :loading="delayLoading" :delay="300" show-label :label="copy.delayLabel" />
    </div>
    <p class="event-log" :data-live="delayState !== 'idle' ? '1' : undefined">{{ delayNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-skeleton"
    title="骨架"
    title-en="Skeleton"
    description="skeletonLines 控制行数，末行更短。超过 12 行会截断，避免挂出过多无限动画。"
    description-en="skeletonLines sets the row count. The last row is shorter. Counts above 12 are capped so one indicator cannot mount too many infinite animations."
    :code="skeletonCode"
  >
    <div class="skeleton-grid">
      <div class="skeleton-box">
        <RsLoading variant="skeleton" :skeleton-lines="2" />
        <p class="hint">2 {{ copy.rows }}</p>
      </div>
      <div class="skeleton-box">
        <RsLoading variant="skeleton" :skeleton-lines="6" />
        <p class="hint">6 {{ copy.rows }}</p>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#indicator 替换图形，并且 aria-hidden。#label 可以放按钮。不要把按钮放进 #indicator。"
    description-en="#indicator replaces the graphic and is aria-hidden. #label may contain a button. Do not put a button in #indicator."
    :code="slotsCode"
  >
    <RsLoading show-label>
      <template #indicator>
        <span class="custom-mark" />
      </template>
      <template #label>{{ copy.customLabel }}</template>
    </RsLoading>
  </DocDemo>

  <DocDemo
    id="demo-fullscreen"
    title="全屏"
    title-en="Fullscreen"
    description="fullscreen 传送到 body，盖住视口。关闭按钮放在 #label。演示会在 4 秒后自己关掉，不使用 lock，避免把文档页滚动锁住。"
    description-en="fullscreen teleports to body and covers the viewport. Put Close in #label. This demo closes itself after 4 seconds and does not use lock, so the docs page can still scroll."
    :code="fullCode"
  >
    <RsButton size="sm" variant="primary" @click="openFull">{{ copy.openFull }}</RsButton>
    <RsLoading v-if="full" fullscreen>
      <template #label>
        <span>{{ copy.fullLabel }}</span>
        <RsButton size="sm" variant="default" @click="closeFull">{{ copy.closeFull }}</RsButton>
      </template>
    </RsLoading>
    <p class="event-log" :data-live="full ? '1' : undefined">{{ fullNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题"
    title-en="Theme"
    description="颜色只走 --rs-loading-* 和语义色。深色岛用 data-rs-theme，不要写死 hex。"
    description-en="Color comes from --rs-loading-* and the semantic hues. A dark island uses data-rs-theme. Do not hard-code hex."
    :code="themeCode"
  >
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsLoading show-label />
        <RsLoading variant="dots" tone="success" />
        <div class="skeleton-box">
          <RsLoading variant="skeleton" :skeleton-lines="3" />
        </div>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。检查 ref 只能看到 none。开关已经在「开关」一节。"
    description-en="There is no defineExpose. Inspecting the ref reports none. The switch is in the Toggle section."
    :code="methodCode"
  >
    <div class="row">
      <RsLoading ref="loadingRef" size="sm" />
      <RsButton size="sm" variant="default" @click="inspectLoadingRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-md);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.tones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-lg);
}

.tones figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--rs-space-xs);
  margin: 0;
}

.tones figcaption,
.hint,
.legacy {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.panel {
  margin-block-start: var(--rs-space-md);
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}

.panel--legacy {
  position: relative;
  min-block-size: 6rem;
}

.list {
  margin: 0;
  padding-inline-start: var(--rs-space-lg);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--rs-space-lg);
}

.skeleton-box {
  inline-size: min(100%, 18rem);
}

.custom-mark {
  inline-size: 1rem;
  block-size: 1rem;
  border: var(--rs-loading-stroke, 2px) solid var(--rs-primary);
  border-radius: var(--rs-radius-xs);
}

.event-log {
  margin: var(--rs-space-md) 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}

.canvas {
  margin: 0;
}

.canvas__caption {
  margin: 0 0 var(--rs-space-xs);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--rs-space-md);
  padding: var(--rs-space-md) var(--rs-space-lg);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}
</style>
