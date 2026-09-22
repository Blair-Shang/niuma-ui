<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { RsButton, RsLoadingBar, useRsLoadingBar, type RsLoadingBarExpose } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const bar = useRsLoadingBar()
const shellOn = ref(false)
const shellNote = ref('')

const eventBar = ref<RsLoadingBarExpose | null>(null)
const eventNote = ref('')
const changeNote = ref('')
const methodNote = ref('')

const uploadBar = ref<RsLoadingBarExpose | null>(null)
const uploadNote = ref('')

const nestBar = ref<RsLoadingBarExpose | null>(null)
const nestNote = ref('')

const controlled = ref(0)

const unknownBar = ref<RsLoadingBarExpose | null>(null)
const placeBar = ref<RsLoadingBarExpose | null>(null)
const delayBar = ref<RsLoadingBarExpose | null>(null)
const delayNote = ref('')
let delayHandle: ReturnType<typeof setTimeout> | null = null

const { copy } = useSiteDemo({
  'en-US': {
    shellIdle: 'The site root already mounts RsLoadingBar. start / finish / error move the viewport bar.',
    started: 'started',
    finished: 'finished',
    failed: 'error',
    eventIdle: 'start / finish / error / change show up here.',
    methodIdle: 'isStarted and getProgress read the ref.',
    uploadIdle: 'trickle is off. inc moves a known upload.',
    nestIdle: 'Two starts, then finish once — the bar stays. Finish again to fade.',
    controlledIdle: 'This instance is driven only by :progress.',
    unknownIdle: 'No aria-valuenow. The bar slides until finish.',
    placeIdle: 'attach=parent keeps this bar inside the frame.',
    panel: 'Panel content stays in normal flow. The bar does not wrap it.',
    darkSurface: 'Dark island — the bar follows --rs-loading-bar-color, not a hex.',
    customColor: 'color="var(--rs-info)" overrides the token.',
    delayIdle: 'delay=600. Finish immediately and the bar never appears.',
    waiting: 'Waiting inside delay.',
    skipped: 'Finished during delay — bar stayed hidden.',
    shown: 'Shown after the delay, then finished.',
    start: 'Start',
    finish: 'Finish',
    fail: 'Fail',
    read: 'Read state',
    chunk: 'Chunk +12',
    done: 'Done',
    again: 'Start again',
    reset: 'Reset',
    bump: '+20',
    fast: 'Finish immediately',
    slow: 'Finish after 800ms',
  },
  'zh-CN': {
    shellIdle: '文档站根上已经挂了 RsLoadingBar。start / finish / error 驱动视口顶上那条。',
    started: '已开始',
    finished: '已结束',
    failed: '失败',
    eventIdle: 'start / finish / error / change 会写在这里。',
    methodIdle: 'isStarted 与 getProgress 读的是这条 ref。',
    uploadIdle: '关闭 trickle。inc 按已知上传量前进。',
    nestIdle: 'start 两次再 finish 一次，条还在。再 finish 一次才淡出。',
    controlledIdle: '这一条只跟 :progress。',
    unknownIdle: '没有 aria-valuenow。条会滑到 finish。',
    placeIdle: 'attach=parent 把条留在这个框里。',
    panel: '面板内容仍在文档流里。条不包住它。',
    darkSurface: '深色岛 — 条跟 --rs-loading-bar-color，不要写死 hex。',
    customColor: 'color="var(--rs-info)" 覆盖 token。',
    delayIdle: 'delay=600。马上 finish，条不会出现。',
    waiting: '还在 delay 里。',
    skipped: 'delay 内结束 — 条没有出现。',
    shown: '过了 delay 才显示，然后结束。',
    start: '开始',
    finish: '完成',
    fail: '失败',
    read: '读取状态',
    chunk: '分片 +12',
    done: '完成',
    again: '再开始',
    reset: '重置',
    bump: '+20',
    fast: '马上结束',
    slow: '800ms 后结束',
  },
})

function shellStart() {
  bar.start()
  shellOn.value = true
  shellNote.value = `${copy.value.started} · ${bar.getProgress()}% · isStarted=${bar.isStarted()}`
}

function shellFinish() {
  bar.finish()
  shellOn.value = false
  shellNote.value = `${copy.value.finished} · isStarted=${bar.isStarted()}`
}

function shellError() {
  bar.error()
  shellOn.value = false
  shellNote.value = copy.value.failed
}

function readEventBar() {
  const api = eventBar.value
  methodNote.value = api
    ? `isStarted=${api.isStarted()} · getProgress=${api.getProgress()}`
    : copy.value.methodIdle
}

function beginUpload() {
  uploadBar.value?.start()
  uploadNote.value = `${uploadBar.value?.getProgress() ?? 0}%`
}

function chunkUpload() {
  const api = uploadBar.value
  if (!api) return
  if (!api.isStarted()) api.start()
  api.inc(12)
  uploadNote.value = `${api.getProgress()}%`
}

function doneUpload() {
  uploadBar.value?.finish()
  uploadNote.value = copy.value.finished
}

function bumpControlled() {
  controlled.value = Math.min(100, controlled.value + 20)
}

function resetControlled() {
  controlled.value = 0
}

function clearDelayHandle() {
  if (delayHandle !== null) {
    clearTimeout(delayHandle)
    delayHandle = null
  }
}

function finishFast() {
  clearDelayHandle()
  delayBar.value?.start()
  delayBar.value?.finish()
  delayNote.value = copy.value.skipped
}

function finishSlow() {
  clearDelayHandle()
  delayBar.value?.start()
  delayNote.value = `${copy.value.waiting} · isStarted=${delayBar.value?.isStarted()}`
  delayHandle = setTimeout(() => {
    delayHandle = null
    delayBar.value?.finish()
    delayNote.value = copy.value.shown
  }, 800)
}

onBeforeUnmount(() => {
  clearDelayHandle()
  if (shellOn.value) {
    bar.finish()
    shellOn.value = false
  }
})

const shellCode = `const bar = useRsLoadingBar()

<RsButton @click="bar.start()">Start</RsButton>
<RsButton @click="bar.finish()">Finish</RsButton>
<RsButton @click="bar.error()">Fail</RsButton>`

const eventsCode = `<RsLoadingBar
  ref="bar"
  attach="parent"
  @start="(pending) => {}"
  @finish="(pending) => {}"
  @error="() => {}"
  @change="(progress) => {}"
/>
bar.value?.isStarted()
bar.value?.getProgress()`

const progressCode = `<RsLoadingBar ref="bar" attach="parent" :trickle="false" />
bar.value?.start()
bar.value?.inc(12)
bar.value?.finish()`

const nestingCode = `<RsLoadingBar ref="bar" attach="parent" nesting />`

const controlledCode = `<RsLoadingBar :progress="value" attach="parent" />`

const indeterminateCode = `<RsLoadingBar ref="bar" attach="parent" indeterminate />`

const placeCode = `<div class="frame">
  <RsLoadingBar attach="parent" position="bottom" tone="info">
    Panel content stays in normal flow.
  </RsLoadingBar>
</div>`

const delayCode = `<RsLoadingBar ref="bar" attach="parent" :delay="600" />`
</script>

<template>
  <DocDemo
    id="demo-shell"
    title="应用壳"
    title-en="App shell"
    description="把 RsLoadingBar 挂在应用根，子树里用 useRsLoadingBar()。条 fixed 在视口边缘，不占布局。插槽外调用是空操作。"
    description-en="Mount RsLoadingBar at the app root and call useRsLoadingBar() inside the slot. The bar is fixed to the viewport and does not take layout. Calls outside the slot are no-ops."
    :code="shellCode"
  >
    <div class="row">
      <RsButton size="sm" @click="shellStart">{{ copy.start }}</RsButton>
      <RsButton size="sm" variant="default" @click="shellFinish">{{ copy.finish }}</RsButton>
      <RsButton size="sm" variant="danger" @click="shellError">{{ copy.fail }}</RsButton>
    </div>
    <p class="note">{{ shellNote || copy.shellIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件与方法"
    title-en="Events and methods"
    description="start / finish / error / change 都能在预览里看到。宿主用 ref 调 isStarted 与 getProgress。传了 progress 的实例不会发这些命令式事件。"
    description-en="start, finish, error, and change are visible here. The host reads isStarted and getProgress from the ref. A progress-controlled instance does not emit these imperative events."
    :code="eventsCode"
  >
    <div class="frame">
      <RsLoadingBar
        ref="eventBar"
        attach="parent"
        :trickle="false"
        @start="(pending) => (eventNote = `start → ${pending}`)"
        @finish="(pending) => (eventNote = `finish → ${pending}`)"
        @error="() => (eventNote = 'error')"
        @change="(progress) => (changeNote = `change → ${progress}`)"
      >
        <p class="frame__copy">{{ copy.panel }}</p>
      </RsLoadingBar>
    </div>
    <div class="row">
      <RsButton size="sm" @click="eventBar?.start()">{{ copy.start }}</RsButton>
      <RsButton size="sm" variant="default" @click="eventBar?.finish()">{{ copy.finish }}</RsButton>
      <RsButton size="sm" variant="danger" @click="eventBar?.error()">{{ copy.fail }}</RsButton>
      <RsButton size="sm" variant="default" @click="readEventBar">{{ copy.read }}</RsButton>
    </div>
    <p class="note">{{ eventNote || copy.eventIdle }}</p>
    <p class="note">{{ changeNote }}</p>
    <p class="note">{{ methodNote || copy.methodIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-progress"
    title="已知进度"
    title-en="Known progress"
    description="上传分片这类已知百分比关掉 trickle，用 inc / set。inc 停在 100 以下，结束仍调用 finish。"
    description-en="Turn trickle off for a known percent, such as upload chunks, and call inc or set. inc stays under 100. Call finish to complete."
    :code="progressCode"
  >
    <div class="frame">
      <RsLoadingBar ref="uploadBar" attach="parent" :trickle="false" />
    </div>
    <div class="row">
      <RsButton size="sm" @click="beginUpload">{{ copy.start }}</RsButton>
      <RsButton size="sm" variant="default" @click="chunkUpload">{{ copy.chunk }}</RsButton>
      <RsButton size="sm" variant="default" @click="doneUpload">{{ copy.done }}</RsButton>
    </div>
    <p class="note">{{ uploadNote || copy.uploadIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-nesting"
    title="重叠请求"
    title-en="Overlapping requests"
    description="默认每次 start 都回到起点，先返回的 finish 会收起条。重叠请求打开 nesting：计数归零才淡出。"
    description-en="By default each start jumps back to the minimum, and the first finish hides the bar. Turn on nesting so the bar fades only when the count hits zero."
    :code="nestingCode"
  >
    <div class="frame">
      <RsLoadingBar
        ref="nestBar"
        attach="parent"
        nesting
        :trickle="false"
        @start="(pending) => (nestNote = `start → ${pending}`)"
        @finish="(pending) => (nestNote = `finish → ${pending}`)"
      />
    </div>
    <div class="row">
      <RsButton size="sm" @click="nestBar?.start()">{{ copy.start }}</RsButton>
      <RsButton size="sm" variant="default" @click="nestBar?.start()">{{ copy.again }}</RsButton>
      <RsButton size="sm" variant="default" @click="nestBar?.finish()">{{ copy.finish }}</RsButton>
    </div>
    <p class="note">{{ nestNote || copy.nestIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-controlled"
    title="受控进度"
    title-en="Controlled progress"
    description=":progress 单向驱动这一条。到 100 后淡出。不要和 start / finish 混在同一个实例上。"
    description-en=":progress drives this instance one way. It fades at 100. Do not mix start / finish on the same instance."
    :code="controlledCode"
  >
    <div class="frame">
      <RsLoadingBar attach="parent" :progress="controlled" />
    </div>
    <div class="row">
      <RsButton size="sm" @click="bumpControlled">{{ copy.bump }}</RsButton>
      <RsButton size="sm" variant="default" @click="resetControlled">{{ copy.reset }}</RsButton>
    </div>
    <p class="note">{{ copy.controlledIdle }} · progress={{ controlled }}</p>
  </DocDemo>

  <DocDemo
    id="demo-indeterminate"
    title="未知进度"
    title-en="Indeterminate"
    description="总时长未知、也不想要假百分比时用 indeterminate。不设置 aria-valuenow。减少动态时停成满宽。"
    description-en="Use indeterminate when the duration is unknown and a fake percent would be wrong. aria-valuenow is omitted. Reduced motion shows a static full-width bar."
    :code="indeterminateCode"
  >
    <div class="frame">
      <RsLoadingBar ref="unknownBar" attach="parent" indeterminate />
    </div>
    <div class="row">
      <RsButton size="sm" @click="unknownBar?.start()">{{ copy.start }}</RsButton>
      <RsButton size="sm" variant="default" @click="unknownBar?.finish()">{{ copy.finish }}</RsButton>
    </div>
    <p class="note">{{ copy.unknownIdle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-place"
    title="位置与主题"
    title-en="Placement and theme"
    description="position=bottom 贴下沿。attach=parent 留在定位过的父级里，适合面板而不是整窗。颜色跟 token；深色岛用 data-rs-theme。color 只在要偏离色相时再传。"
    description-en="position=bottom pins the trailing edge. attach=parent stays in a positioned parent for a panel rather than the window. Color follows tokens; dark islands use data-rs-theme. Pass color only to leave the hue."
    :code="placeCode"
  >
    <div class="frame frame--tall">
      <RsLoadingBar ref="placeBar" attach="parent" position="bottom" tone="info" :trickle="false">
        <p class="frame__copy">{{ copy.panel }}</p>
      </RsLoadingBar>
    </div>
    <div class="row">
      <RsButton size="sm" @click="placeBar?.start()">{{ copy.start }}</RsButton>
      <RsButton size="sm" variant="default" @click="placeBar?.finish()">{{ copy.finish }}</RsButton>
    </div>
    <p class="note">{{ copy.placeIdle }}</p>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="frame" data-rs-theme="dark">
        <RsLoadingBar attach="parent" :progress="68" />
        <p class="frame__copy">{{ copy.darkSurface }}</p>
      </div>
    </figure>
    <div class="frame">
      <RsLoadingBar attach="parent" color="var(--rs-info)" :progress="68" />
      <p class="frame__copy">{{ copy.customColor }}</p>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-delay"
    title="短请求"
    title-en="Short requests"
    description="delay 让快请求不闪一条。等待期间 isStarted 已是 true，条还没出现。到点再显示。"
    description-en="delay keeps a fast request from flashing the bar. isStarted is already true during the wait, before the bar is visible."
    :code="delayCode"
  >
    <div class="frame">
      <RsLoadingBar ref="delayBar" attach="parent" :delay="600" :trickle="false" />
    </div>
    <div class="row">
      <RsButton size="sm" @click="finishFast">{{ copy.fast }}</RsButton>
      <RsButton size="sm" variant="default" @click="finishSlow">{{ copy.slow }}</RsButton>
    </div>
    <p class="note">{{ delayNote || copy.delayIdle }}</p>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.note {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.frame {
  position: relative;
  min-height: 4.5rem;
  overflow: hidden;
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text);
}

.frame--tall {
  min-height: 5.5rem;
}

.frame__copy {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  line-height: 1.5;
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
</style>
