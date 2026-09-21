<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCard } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const methodLog = ref('')
const cardRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    title: 'Connection',
    desc: 'Host 10.0.0.12 · port 5432',
    body: 'Use Fieldset for form groups. Card is a surface, not a fieldset.',
    footer: 'Test connection',
    action: 'Edit',
    header: 'Custom heading',
    cover: 'Cover',
    compact: 'Compact',
    defaultDensity: 'Default',
    relaxed: 'Relaxed',
    outer: 'Outer panel',
    inner: 'Inner block',
    nested: 'Drop the second chrome with borderless.',
    flushTitle: 'Flush body',
    flushBody: 'padding={false} sits a table or chart on the edge.',
    darkSurface: 'Dark surface — card tokens follow data-rs-theme, do not hard-code color',
    idle: 'RsCard emits nothing. hoverable is visual only.',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no open() on the card ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    title: '连接信息',
    desc: '主机 10.0.0.12 · 端口 5432',
    body: '表单分组请用 Fieldset。Card 是表面，不是 fieldset。',
    footer: '测试连接',
    action: '编辑',
    header: '自定义标题',
    cover: '封面',
    compact: '紧凑',
    defaultDensity: '默认',
    relaxed: '宽松',
    outer: '外层面板',
    inner: '内层区块',
    nested: '内层用 borderless，避免双边框。',
    flushTitle: '贴边主体',
    flushBody: 'padding={false} 让表格或图表贴边。',
    darkSurface: '深色表面 — 卡片 token 跟 data-rs-theme，不要写死颜色',
    idle: 'RsCard 不发事件。hoverable 只是视觉。',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。卡片 ref 上没有 open()。',
    methodNone: 'expose 键：none',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsCard title="Connection" description="Host 10.0.0.12 · port 5432">
  Use Fieldset for form groups.
  <template #footer>
    <RsButton size="sm" variant="default">Test connection</RsButton>
  </template>
</RsCard>`

const variantCode = `<RsCard variant="grouped" title="Connection">…</RsCard>
<RsCard variant="plain" title="Connection">…</RsCard>
<RsCard variant="outlined" title="Connection">…</RsCard>
<RsCard variant="filled" title="Connection">…</RsCard>
<RsCard variant="glass" title="Connection">…</RsCard>`

const sizeCode = `<RsCard size="sm" title="Compact">…</RsCard>
<RsCard size="md" title="Default">…</RsCard>
<RsCard size="lg" title="Relaxed">…</RsCard>`

const flushCode = `<RsCard variant="outlined" title="Outer panel">
  <RsCard borderless size="sm" title="Inner block">
    Drop the second chrome with borderless.
  </RsCard>
</RsCard>
<RsCard variant="outlined" title="Flush body" :padding="false">
  A table or chart sits on the edge.
</RsCard>`

const slotsCode = `<RsCard clip>
  <template #cover>
    <div class="cover">Cover</div>
  </template>
  <template #header>Custom heading</template>
  <template #actions>
    <RsButton size="sm" variant="text">Edit</RsButton>
  </template>
  Body
  <template #footer>
    <RsButton size="sm" variant="default">Test connection</RsButton>
  </template>
</RsCard>`

const eventsCode = `<RsCard hoverable title="Connection">
  Use Fieldset for form groups.
</RsCard>`

const methodsCode = `const card = ref()
// RsCard has no defineExpose — card.value.open is undefined
<RsCard ref="card" title="Connection" />`

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
    description="标题、主体与页脚收在同一表面。根是原生 section。size 是疏密，不是控件高度。表单分组请用 Fieldset。"
    description-en="Title, body, and footer share one surface. The root is a native section. size is density, not control height. Form groups belong on Fieldset."
    :code="basicCode"
  >
    <RsCard :title="copy.title" :description="copy.desc">
      {{ copy.body }}
      <template #footer>
        <RsButton size="sm" variant="default">{{ copy.footer }}</RsButton>
      </template>
    </RsCard>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsCard :title="copy.title" :description="copy.desc">
          {{ copy.body }}
        </RsCard>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-variant"
    title="表面"
    title-en="Surface"
    description="grouped 是默认工作台分层。plain 偏指标。outlined / filled 偏信息面板。glass 是毛玻璃。不要用业务 CSS 改边框色。"
    description-en="grouped is the default layered workbench surface. plain suits a metric. outlined / filled suit info panels. glass is vibrancy. Do not restyle the border in product CSS."
    :code="variantCode"
  >
    <div class="stack">
      <RsCard variant="grouped" :title="copy.title">{{ copy.body }}</RsCard>
      <RsCard variant="plain" :title="copy.title">{{ copy.body }}</RsCard>
      <RsCard variant="outlined" :title="copy.title">{{ copy.body }}</RsCard>
      <RsCard variant="filled" :title="copy.title">{{ copy.body }}</RsCard>
      <RsCard variant="glass" :title="copy.title">{{ copy.body }}</RsCard>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="疏密"
    title-en="Density"
    description="只有 sm / md / lg，没有 ssm。改的是内边距和标题字号，不是按钮高度。"
    description-en="Only sm / md / lg — no ssm. This changes padding and title size, not control height."
    :code="sizeCode"
  >
    <div class="stack">
      <RsCard size="sm" :title="copy.compact">{{ copy.body }}</RsCard>
      <RsCard size="md" :title="copy.defaultDensity">{{ copy.body }}</RsCard>
      <RsCard size="lg" :title="copy.relaxed">{{ copy.body }}</RsCard>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-flush"
    title="贴边与嵌套"
    title-en="Flush and nested"
    description="内层用 borderless，避免双边框。表格或图表贴边传 padding={false}。"
    description-en="Use borderless on the inner card so chrome is not doubled. Pass padding={false} so a table or chart sits on the edge."
    :code="flushCode"
  >
    <div class="stack">
      <RsCard variant="outlined" :title="copy.outer">
        <RsCard borderless size="sm" :title="copy.inner">
          {{ copy.nested }}
        </RsCard>
      </RsCard>
      <RsCard variant="outlined" :title="copy.flushTitle" :padding="false">
        <p class="flush">{{ copy.flushBody }}</p>
      </RsCard>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#cover 在最顶上，配合 clip 裁切圆角。#header 覆盖 title / description。#actions 在标题行右侧。#footer 是页脚。"
    description-en="#cover is the top media — pass clip so it follows the radius. #header replaces title / description. #actions sit on the right of the heading. #footer is the footer."
    :code="slotsCode"
  >
    <RsCard clip>
      <template #cover>
        <div class="cover">{{ copy.cover }}</div>
      </template>
      <template #header>{{ copy.header }}</template>
      <template #actions>
        <RsButton size="sm" variant="text">{{ copy.action }}</RsButton>
      </template>
      {{ copy.body }}
      <template #footer>
        <RsButton size="sm" variant="default">{{ copy.footer }}</RsButton>
      </template>
    </RsCard>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。hoverable 只抬升阴影。可点卡片请在外面包 RsButton 或原生按钮，不要给 Card 绑 click 当控件。"
    description-en="No component events. hoverable only lifts the shadow. Wrap a clickable card in RsButton or a native button — do not treat Card as a control."
    :code="eventsCode"
  >
    <RsCard hoverable :title="copy.title">{{ copy.body }}</RsCard>
    <p class="event-log">{{ copy.idle }}</p>
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
      <RsCard ref="cardRef" :title="copy.title">{{ copy.body }}</RsCard>
      <RsButton variant="default" @click="inspectCardRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack,
.row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.cover {
  box-sizing: border-box;
  min-height: 6.5rem;
  padding-block: 2rem;
  padding-inline: 1rem;
  background: color-mix(in srgb, var(--rs-primary) 18%, var(--rs-surface));
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  text-align: center;
}

.flush {
  margin: 0;
  padding: var(--rs-space-md);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
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
