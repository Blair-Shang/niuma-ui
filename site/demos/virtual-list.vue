<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RsButton, RsVirtualList } from 'niuma-ui'
import type { RsVirtualListInstance } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const activeIndex = ref(12)
const keyboardIndex = ref(0)
const eventLog = ref('')
const methodLog = ref('')
const keyboardRef = ref<RsVirtualListInstance | null>(null)
const listRef = ref<RsVirtualListInstance | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    row: (n: number) => `Deploy log #${String(n).padStart(2, '0')}`,
    tall: (n: number) => `Section ${n} · extra lines so the row is taller`,
    card: (n: number) => `Lane ${n}`,
    dark: 'Dark surface — frame and active bar follow theme tokens',
    plain: 'No frame — bordered false, radius none, for embedding',
    active: (n: number) => `Active index ${n}`,
    prev: 'Previous',
    next: 'Next',
    emptyTitle: 'Nothing to list',
    emptyHint: 'Clear the filter or wait for the next batch.',
    keyIdle: 'Focus the list, then Arrow / Home / End.',
    keyAt: (n: number) => `keyboard → index ${n}`,
    focus: 'focus()',
    eventIdle: 'Scroll or click a row.',
    scrolled: (top: number) => `scroll → ${Math.round(top)}px`,
    changed: (n: number, label: string) => `change → ${n} ${label}`,
    methodIdle: 'Host methods. Click a button.',
    toIndex: 'scrollToIndex(40)',
    toOffset: 'scrollToOffset(0)',
    readOffset: 'getScrollOffset()',
    inspect: 'getViewport()',
    scrolledIndex: 'scrollToIndex(40, start) → row 41 at the start',
    scrolledOffset: 'scrollToOffset(0) → content offset 0',
    offset: (n: number) => `getScrollOffset() → ${Math.round(n)}`,
    viewport: (tag: string) => `getViewport() → ${tag}`,
    missing: 'getViewport() → undefined',
    focused: 'focus() → list focused',
    blurred: 'focus() → not focused',
    feedReady: (n: number, total: number) => `loaded ${n} / ${total} · scroll to the end for the next page`,
    feedLoading: (n: number, total: number) => `loading… ${n} / ${total}`,
    feedEnd: (total: number) => `end · ${total} rows`,
  },
  'zh-CN': {
    row: (n: number) => `部署日志 #${String(n).padStart(2, '0')}`,
    tall: (n: number) => `第 ${n} 节 · 多一行，所以这一行更高`,
    card: (n: number) => `泳道 ${n}`,
    dark: '深色表面 — 外框和当前项色条跟主题 token',
    plain: '无外框 — bordered false、radius none，嵌进已有表面',
    active: (n: number) => `当前索引 ${n}`,
    prev: '上一项',
    next: '下一项',
    emptyTitle: '没有可列的数据',
    emptyHint: '清掉筛选，或等下一批。',
    keyIdle: '先聚焦列表，再用方向键 / Home / End。',
    keyAt: (n: number) => `keyboard → 索引 ${n}`,
    focus: 'focus()',
    eventIdle: '滚动，或点一行。',
    scrolled: (top: number) => `scroll → ${Math.round(top)}px`,
    changed: (n: number, label: string) => `change → ${n} ${label}`,
    methodIdle: '宿主方法。点按钮调用。',
    toIndex: 'scrollToIndex(40)',
    toOffset: 'scrollToOffset(0)',
    readOffset: 'getScrollOffset()',
    inspect: 'getViewport()',
    scrolledIndex: 'scrollToIndex(40, start) → 第 41 行贴在起点',
    scrolledOffset: 'scrollToOffset(0) → 内容偏移 0',
    offset: (n: number) => `getScrollOffset() → ${Math.round(n)}`,
    viewport: (tag: string) => `getViewport() → ${tag}`,
    missing: 'getViewport() → undefined',
    focused: 'focus() → 列表已聚焦',
    blurred: 'focus() → 未聚焦',
    feedReady: (n: number, total: number) => `已加载 ${n} / ${total} · 滚到底继续`,
    feedLoading: (n: number, total: number) => `正在加载… ${n} / ${total}`,
    feedEnd: (total: number) => `已到底 · 共 ${total} 条`,
  },
})

const rows = computed(() => Array.from({ length: 80 }, (_, index) => copy.value.row(index + 1)))
const variableRows = computed(() => Array.from({ length: 40 }, (_, index) => ({
  id: `row-${index}`,
  label: index % 3 === 0 ? copy.value.tall(index + 1) : copy.value.row(index + 1),
})))
const lanes = computed(() => Array.from({ length: 24 }, (_, index) => copy.value.card(index + 1)))
const measuredRows = computed(() => Array.from({ length: 30 }, (_, index) => (
  index % 4 === 0 ? copy.value.tall(index + 1) : copy.value.row(index + 1)
)))
const eventNote = computed(() => eventLog.value || copy.value.eventIdle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)
const keyNote = computed(() => (keyboardIndex.value == null ? copy.value.keyIdle : copy.value.keyAt(keyboardIndex.value)))

function variableSize(index: number): number {
  return index % 3 === 0 ? 52 : 32
}

function onListScroll(event: Event): void {
  const el = event.target
  if (!(el instanceof HTMLElement)) return
  eventLog.value = copy.value.scrolled(el.scrollTop)
}

function onListChange(index: number, item: string): void {
  eventLog.value = copy.value.changed(index, item)
}

function scrollToSample(): void {
  listRef.value?.scrollToIndex(40, 'start')
  methodLog.value = copy.value.scrolledIndex
}

function scrollToStart(): void {
  listRef.value?.scrollToOffset(0)
  methodLog.value = copy.value.scrolledOffset
}

function readOffset(): void {
  methodLog.value = copy.value.offset(listRef.value?.getScrollOffset() ?? 0)
}

function inspectViewport(): void {
  const el = listRef.value?.getViewport()
  methodLog.value = el ? copy.value.viewport(el.tagName.toLowerCase()) : copy.value.missing
}

function focusKeyboard(): void {
  keyboardRef.value?.focus()
}

const FEED_PAGE = 20
const FEED_TOTAL = 100
const feedCount = ref(FEED_PAGE)
const feedLoading = ref(false)
let feedTimer = 0

const feedRows = computed(() => Array.from({ length: feedCount.value }, (_, index) => copy.value.row(index + 1)))
const feedNote = computed(() => {
  if (feedLoading.value) return copy.value.feedLoading(feedCount.value, FEED_TOTAL)
  if (feedCount.value >= FEED_TOTAL) return copy.value.feedEnd(FEED_TOTAL)
  return copy.value.feedReady(feedCount.value, FEED_TOTAL)
})

function onFeedScroll(event: Event): void {
  const el = event.target
  if (!(el instanceof HTMLElement) || feedLoading.value || feedCount.value >= FEED_TOTAL) return
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight
  if (remain > 64) return
  feedLoading.value = true
  window.clearTimeout(feedTimer)
  feedTimer = window.setTimeout(() => {
    feedTimer = 0
    feedCount.value = Math.min(FEED_TOTAL, feedCount.value + FEED_PAGE)
    feedLoading.value = false
  }, 480)
}

onUnmounted(() => {
  window.clearTimeout(feedTimer)
})

function focusList(): void {
  listRef.value?.focus()
  const el = listRef.value?.getViewport()
  methodLog.value = el && document.activeElement === el ? copy.value.focused : copy.value.blurred
}

const basicCode = `<RsVirtualList :items="rows" :height="200" :item-size="32">
  <template #default="{ item, index }">
    <div class="row">{{ index + 1 }}. {{ item }}</div>
  </template>
</RsVirtualList>`

const variableCode = `function itemSize(index: number) {
  return index % 3 === 0 ? 52 : 32
}

<RsVirtualList
  :items="rows"
  :height="220"
  :item-size="itemSize"
  :item-key="(item) => item.id"
/>`

const activeCode = `<RsVirtualList
  v-model:active-index="activeIndex"
  :items="rows"
  :height="200"
  :item-size="32"
/>`

const horizontalCode = `<RsVirtualList
  orientation="horizontal"
  :items="lanes"
  :height="96"
  :item-size="144"
/>`

const autoCode = `<RsVirtualList :items="rows" :height="220" item-size="auto" :estimate-size="32" />`

const emptyCode = `<RsVirtualList :items="[]" :height="120">
  <template #empty>
    <strong>Nothing to list</strong>
  </template>
</RsVirtualList>`

const keyboardCode = `<RsVirtualList
  v-model:active-index="index"
  keyboard
  :items="rows"
  :height="160"
  :item-size="32"
/>`

const eventsCode = `<RsVirtualList
  :items="rows"
  :height="160"
  :item-size="32"
  @scroll="onScroll"
  @change="onChange"
/>`

const infiniteCode = `const page = 20
const total = 100
const count = ref(page)
const loading = ref(false)

function onScroll(event: Event) {
  const el = event.target
  if (!(el instanceof HTMLElement) || loading.value || count.value >= total) return
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight
  if (remain > 64) return
  loading.value = true
  window.setTimeout(() => {
    count.value = Math.min(total, count.value + page)
    loading.value = false
  }, 480)
}

<RsVirtualList :items="rows" :height="200" :item-size="32" @scroll="onScroll" />`

const methodsCode = `const list = ref<RsVirtualListInstance | null>(null)
list.value?.scrollToIndex(40, 'start')
list.value?.scrollToOffset(0)
list.value?.getScrollOffset()
list.value?.getViewport()
list.value?.focus()`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="定高"
    title-en="Fixed size"
    description="height 限制视口，item-size 固定时只渲染窗口。万行把 items 换成真实数据。颜色走 token，不要写死色值。"
    description-en="height pins the viewport. A fixed item-size renders only the window. Swap items for real data at tens of thousands of rows. Colors come from tokens."
    :code="basicCode"
  >
    <RsVirtualList :items="rows" :height="200" :item-size="32">
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.dark }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsVirtualList :items="rows.slice(0, 20)" :height="140" :item-size="32" :active-index="2">
          <template #default="{ item, index }">
            <div class="row">{{ index + 1 }}. {{ item }}</div>
          </template>
        </RsVirtualList>
      </div>
    </figure>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.plain }}</figcaption>
      <RsVirtualList :items="rows.slice(0, 8)" :height="120" :item-size="32" :bordered="false" radius="none">
        <template #default="{ item, index }">
          <div class="row">{{ index + 1 }}. {{ item }}</div>
        </template>
      </RsVirtualList>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-variable"
    title="按索引变高"
    title-en="Variable size"
    description="item-size 可以是函数。把函数定义在 script 里，不要在模板里每次新建。对象列表用 item-key。"
    description-en="item-size may be a function. Define it in script, not as a new template closure. Object rows should pass item-key."
    :code="variableCode"
  >
    <RsVirtualList
      :items="variableRows"
      :height="220"
      :item-size="variableSize"
      :item-key="(item) => item.id"
    >
      <template #default="{ item, index }">
        <div class="row" :class="{ 'row--tall': index % 3 === 0 }">{{ item.label }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-active"
    title="当前项"
    title-en="Active row"
    description="v-model:active-index 高亮一行，并把它滚进视口（默认居中）。色条在逻辑起点，RTL 跟书写方向。"
    description-en="v-model:active-index highlights a row and scrolls it into view (centered by default). The bar sits on the logical start edge."
    :code="activeCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="activeIndex = Math.max(0, activeIndex - 1)">{{ copy.prev }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="activeIndex = Math.min(rows.length - 1, activeIndex + 1)">{{ copy.next }}</RsButton>
      <span class="note">{{ copy.active(activeIndex) }}</span>
    </div>
    <RsVirtualList v-model:active-index="activeIndex" :items="rows" :height="200" :item-size="32">
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-horizontal"
    title="横向"
    title-en="Horizontal"
    description="orientation=&quot;horizontal&quot; 时 item-size 是每一项的宽。适合泳道、时间刻度，不是表格列。"
    description-en="With orientation=&quot;horizontal&quot;, item-size is each item's width. Use it for lanes or ticks, not table columns."
    :code="horizontalCode"
  >
    <RsVirtualList orientation="horizontal" :items="lanes" :height="96" :item-size="144">
      <template #default="{ item, index }">
        <div class="lane">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-auto"
    title="测量高度"
    title-en="Measured size"
    description="内容高度事先不知道时用 item-size=&quot;auto&quot;。estimate-size 只用于测量前的总高度。可见行离开视口后不再观察。"
    description-en="Use item-size=&quot;auto&quot; when content height is not known ahead of time. estimate-size is only the total before measurement. Rows stop being observed once they leave the window."
    :code="autoCode"
  >
    <RsVirtualList :items="measuredRows" :height="220" item-size="auto" :estimate-size="32">
      <template #default="{ item, index }">
        <div class="row" :class="{ 'row--tall': index % 4 === 0 }">{{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-empty"
    title="空态"
    title-en="Empty"
    description="items 为空时渲染 #empty。不传插槽时文案跟 locale（virtualList.empty）。"
    description-en="An empty items array renders #empty. Without the slot, copy follows the locale (virtualList.empty)."
    :code="emptyCode"
  >
    <div class="stack">
      <RsVirtualList :items="[]" :height="96" :item-size="32" />
      <RsVirtualList :items="[]" :height="120" :item-size="32">
        <template #empty>
          <div class="empty">
            <strong>{{ copy.emptyTitle }}</strong>
            <span>{{ copy.emptyHint }}</span>
          </div>
        </template>
      </RsVirtualList>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-keyboard"
    title="键盘"
    title-en="Keyboard"
    description="keyboard 打开后，根是 listbox。方向键、Home、End 移动当前项。默认关闭，把方向键留给外层（例如日志）。"
    description-en="With keyboard, the root is a listbox. Arrow keys, Home, and End move the active item. Leave it off so a parent (a log, for example) keeps the keys."
    :code="keyboardCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="focusKeyboard">{{ copy.focus }}</RsButton>
      <span class="note">{{ keyNote }}</span>
    </div>
    <RsVirtualList
      ref="keyboardRef"
      v-model:active-index="keyboardIndex"
      keyboard
      :items="rows.slice(0, 20)"
      :height="160"
      :item-size="32"
    >
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="scroll 的载荷是原生 Event。change 在点击一行时带上索引和数据。"
    description-en="scroll payload is the native Event. change carries the index and the item when a row is clicked."
    :code="eventsCode"
  >
    <p class="note">{{ eventNote }}</p>
    <RsVirtualList :items="rows" :height="160" :item-size="32" @scroll="onListScroll" @change="onListChange">
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-infinite"
    title="无限滚动"
    title-en="Infinite scroll"
    description="听 scroll。距底部不到 64px 时追加下一页，并用 loading 挡住重复请求。组件不发请求，数据仍由你追加到 items。"
    description-en="Listen to scroll. Append the next page when the end is within 64px, and keep a loading flag so the request does not fire twice. The list does not fetch; you append to items."
    :code="infiniteCode"
  >
    <p class="note">{{ feedNote }}</p>
    <RsVirtualList :items="feedRows" :height="200" :item-size="32" @scroll="onFeedScroll">
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主用模板 ref 调用 scrollToIndex、scrollToOffset、getScrollOffset、getViewport、focus。预览里能看到结果。"
    description-en="Call scrollToIndex, scrollToOffset, getScrollOffset, getViewport, and focus on the template ref. The preview shows the result."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="scrollToSample">{{ copy.toIndex }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="scrollToStart">{{ copy.toOffset }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="readOffset">{{ copy.readOffset }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="inspectViewport">{{ copy.inspect }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="focusList">{{ copy.focus }}</RsButton>
    </div>
    <p class="note">{{ methodNote }}</p>
    <RsVirtualList ref="listRef" keyboard :items="rows" :height="180" :item-size="32">
      <template #default="{ item, index }">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </template>
    </RsVirtualList>
  </DocDemo>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-sm);
}

.note {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.row,
.lane {
  box-sizing: border-box;
  height: 100%;
  padding-inline: var(--rs-space-md);
  display: flex;
  align-items: center;
  font-size: var(--rs-font-size-sm);
  border-block-end: 1px solid var(--rs-border-subtle);
}

.row--tall {
  align-items: flex-start;
  padding-block: var(--rs-space-sm);
  line-height: 1.4;
}

.lane {
  border-block-end: 0;
  border-inline-end: 1px solid var(--rs-border-subtle);
}

.empty {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-xs);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.empty strong {
  color: var(--rs-text-primary);
  font-weight: var(--rs-font-weight-medium);
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.45rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.stage {
  padding: var(--rs-space-md) var(--rs-space-lg);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}
</style>
