<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsScrollbar } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const methodLog = ref('')
const barRef = ref<{
  scrollTop: () => void
  scrollTopLeft: () => void
  getViewport: () => HTMLElement | undefined
} | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    line: (n: number) => `Deploy log #${n} · node ${String(((n - 1) % 4) + 1).padStart(2, '0')}`,
    wide: 'Wide row — scroll sideways when the pane is narrow.',
    darkSurface: 'Dark surface — thumb follows theme tokens, do not hard-code color',
    idle: 'RsScrollbar emits nothing. Keyboard scroll stays on the viewport.',
    hover: 'hover (default)',
    always: 'always',
    toTop: 'scrollTop()',
    toCorner: 'scrollTopLeft()',
    inspect: 'getViewport()',
    methodIdle: 'Host methods: scrollTop, scrollTopLeft, getViewport. Click a button.',
    scrolled: 'scrollTop() → viewport at top',
    scrolledCorner: 'scrollTopLeft() → viewport at top-left',
    viewport: (tag: string) => `getViewport() → ${tag}`,
    missing: 'getViewport() → undefined',
  },
  'zh-CN': {
    line: (n: number) => `部署日志 #${n} · 节点 ${String(((n - 1) % 4) + 1).padStart(2, '0')}`,
    wide: '很宽的一行 — 面板窄时可以横向滚。',
    darkSurface: '深色表面 — 滑块跟主题 token，不要写死颜色',
    idle: 'RsScrollbar 不发事件。键盘滚动仍在视口上。',
    hover: 'hover（默认）',
    always: 'always',
    toTop: 'scrollTop()',
    toCorner: 'scrollTopLeft()',
    inspect: 'getViewport()',
    methodIdle: '宿主方法：scrollTop、scrollTopLeft、getViewport。点按钮调用。',
    scrolled: 'scrollTop() → 视口回到顶部',
    scrolledCorner: 'scrollTopLeft() → 视口回到左上角',
    viewport: (tag: string) => `getViewport() → ${tag}`,
    missing: 'getViewport() → undefined',
  },
})

const logs = computed(() => Array.from({ length: 24 }, (_, i) => copy.value.line(i + 1)))
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsScrollbar height="12rem">
  <ul>{/* long list */}</ul>
</RsScrollbar>`

const typeCode = `<RsScrollbar type="hover" height="8rem">…</RsScrollbar>
<RsScrollbar type="always" height="8rem">…</RsScrollbar>`

const horizontalCode = `<RsScrollbar orientation="horizontal" height="4.5rem">
  <p style="min-width: 40rem">Wide row</p>
</RsScrollbar>`

const bothCode = `<RsScrollbar orientation="both" height="8rem">
  <p style="min-width: 40rem">Wide row</p>
</RsScrollbar>`

const eventsCode = `<RsScrollbar height="8rem">
  <ul>{/* long list */}</ul>
</RsScrollbar>`

const methodsCode = `const bar = ref()
bar.value?.scrollTop()
bar.value?.scrollTopLeft()
bar.value?.getViewport()
<RsScrollbar ref="bar" orientation="both" height="12rem" />`

function scrollToTop() {
  barRef.value?.scrollTop()
  methodLog.value = copy.value.scrolled
}

function scrollToTopLeft() {
  barRef.value?.scrollTopLeft()
  methodLog.value = copy.value.scrolledCorner
}

function inspectViewport() {
  const el = barRef.value?.getViewport()
  methodLog.value = el ? copy.value.viewport(el.tagName.toLowerCase()) : copy.value.missing
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="纵向滚动"
    title-en="Vertical"
    description="用 height 限制可视高度。方向是 orientation，不是 direction。适合日志、侧栏。不要用业务 CSS 改滑块色。"
    description-en="Pin the viewport with height. Direction is orientation, not direction. Use it for logs and sidebars. Do not restyle the thumb in product CSS."
    :code="basicCode"
  >
    <RsScrollbar height="12rem">
      <ul class="list">
        <li v-for="line in logs" :key="line">{{ line }}</li>
      </ul>
    </RsScrollbar>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsScrollbar height="8rem">
          <ul class="list">
            <li v-for="line in logs.slice(0, 10)" :key="line">{{ line }}</li>
          </ul>
        </RsScrollbar>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-type"
    title="显隐"
    title-en="Visibility"
    description="hover 是默认：指针进入才出条。always 常驻轨道。auto 只在溢出时出条。scroll 只在滚动时出条。"
    description-en="hover is the default: the bar appears on pointer enter. always keeps the track. auto shows only when content overflows. scroll shows only while scrolling."
    :code="typeCode"
  >
    <div class="stack">
      <p class="label">{{ copy.hover }}</p>
      <RsScrollbar type="hover" height="8rem">
        <ul class="list">
          <li v-for="line in logs.slice(0, 12)" :key="line">{{ line }}</li>
        </ul>
      </RsScrollbar>
      <p class="label">{{ copy.always }}</p>
      <RsScrollbar type="always" height="8rem">
        <ul class="list">
          <li v-for="line in logs.slice(0, 12)" :key="line">{{ line }}</li>
        </ul>
      </RsScrollbar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-horizontal"
    title="横向"
    title-en="Horizontal"
    description="只要横条时用 orientation=&quot;horizontal&quot;。竖向溢出不会出竖条。"
    description-en="Use orientation=&quot;horizontal&quot; when only the x-axis should scroll. Vertical overflow does not show a y-bar."
    :code="horizontalCode"
  >
    <RsScrollbar orientation="horizontal" height="4.5rem">
      <p class="wide">{{ copy.wide }}</p>
    </RsScrollbar>
  </DocDemo>

  <DocDemo
    id="demo-both"
    title="双向"
    title-en="Both axes"
    description="orientation=&quot;both&quot;（默认）在内容超出时同时出竖条和横条。"
    description-en="orientation=&quot;both&quot; (the default) shows a vertical and a horizontal bar when content overflows."
    :code="bothCode"
  >
    <RsScrollbar orientation="both" height="8rem">
      <p class="wide">{{ copy.wide }}</p>
      <ul class="list">
        <li v-for="line in logs.slice(0, 8)" :key="line">{{ line }}</li>
      </ul>
    </RsScrollbar>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件 scroll / change。点滑块不会发 click。滚动是视口上的原生行为。"
    description-en="There is no component scroll or change. A click on the thumb does not emit click. Scrolling is native on the viewport."
    :code="eventsCode"
  >
    <RsScrollbar height="8rem">
      <ul class="list">
        <li v-for="line in logs.slice(0, 8)" :key="line">{{ line }}</li>
      </ul>
    </RsScrollbar>
    <p class="event-log">{{ copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="defineExpose：scrollTop、scrollTopLeft、getViewport。先滚下去或横推，再点按钮看结果。"
    description-en="defineExpose: scrollTop, scrollTopLeft, getViewport. Scroll down or sideways, then click a button to see the result."
    :code="methodsCode"
  >
    <RsScrollbar ref="barRef" orientation="both" height="12rem">
      <p class="wide">{{ copy.wide }}</p>
      <ul class="list">
        <li v-for="line in logs" :key="line">{{ line }}</li>
      </ul>
    </RsScrollbar>
    <div class="row">
      <RsButton variant="default" @click="scrollToTop">{{ copy.toTop }}</RsButton>
      <RsButton variant="default" @click="scrollToTopLeft">{{ copy.toCorner }}</RsButton>
      <RsButton variant="default" @click="inspectViewport">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  margin: 0.35rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.list li {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--rs-border);
  font-size: var(--rs-font-size-sm);
}

.wide {
  margin: 0 0 0.5rem;
  min-width: 40rem;
  white-space: nowrap;
  font-size: var(--rs-font-size-sm);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
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
  border-radius: var(--rs-radius-lg);
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
