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
    toTop: 'scrollTop()',
    inspect: 'getViewport()',
    methodIdle: 'Host methods: scrollTop, scrollTopLeft, getViewport. Click a button.',
    scrolled: 'scrollTop() → viewport at top',
    viewport: (tag: string) => `getViewport() → ${tag}`,
    missing: 'getViewport() → undefined',
  },
  'zh-CN': {
    line: (n: number) => `部署日志 #${n} · 节点 ${String(((n - 1) % 4) + 1).padStart(2, '0')}`,
    wide: '很宽的一行 — 面板窄时可以横向滚。',
    darkSurface: '深色表面 — 滑块跟主题 token，不要写死颜色',
    idle: 'RsScrollbar 不发事件。键盘滚动仍在视口上。',
    toTop: 'scrollTop()',
    inspect: 'getViewport()',
    methodIdle: '宿主方法：scrollTop、scrollTopLeft、getViewport。点按钮调用。',
    scrolled: 'scrollTop() → 视口回到顶部',
    viewport: (tag: string) => `getViewport() → ${tag}`,
    missing: 'getViewport() → undefined',
  },
})

const logs = computed(() => Array.from({ length: 24 }, (_, i) => copy.value.line(i + 1)))
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsScrollbar height="12rem">
  <ul>{/* long list */}</ul>
</RsScrollbar>`

const bothCode = `<RsScrollbar orientation="both" height="8rem">
  <p style="min-width: 40rem">Wide row</p>
</RsScrollbar>`

const methodsCode = `const bar = ref()
bar.value?.scrollTop()
bar.value?.getViewport()
<RsScrollbar ref="bar" height="12rem" />`

function scrollToTop() {
  barRef.value?.scrollTop()
  methodLog.value = copy.value.scrolled
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
    description="用 height 限制可视高度。方向是 orientation，不是 direction。适合日志、侧栏。"
    description-en="Pin the viewport with height. Direction is orientation, not direction. Use it for logs and sidebars."
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
    description="没有组件 scroll / change 事件。滚动是视口上的原生行为。"
    description-en="There is no component scroll or change event. Scrolling is native on the viewport."
    :code="basicCode"
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
    description="defineExpose：scrollTop、scrollTopLeft、getViewport。先滚下去，再点按钮看结果。"
    description-en="defineExpose: scrollTop, scrollTopLeft, getViewport. Scroll down, then click a button to see the result."
    :code="methodsCode"
  >
    <RsScrollbar ref="barRef" height="12rem">
      <ul class="list">
        <li v-for="line in logs" :key="line">{{ line }}</li>
      </ul>
    </RsScrollbar>
    <div class="row">
      <RsButton variant="default" @click="scrollToTop">{{ copy.toTop }}</RsButton>
      <RsButton variant="default" @click="inspectViewport">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
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
