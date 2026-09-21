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
<RsCard variant="outlined" title="Connection">…</RsCard>
<RsCard variant="filled" title="Connection">…</RsCard>`

const slotsCode = `<RsCard>
  <template #header>Custom heading</template>
  <template #actions>
    <RsButton size="sm" variant="text">Edit</RsButton>
  </template>
  Body
  <template #footer>
    <RsButton size="sm" variant="default">Test connection</RsButton>
  </template>
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
    description="标题、主体与页脚收在同一表面。size 是疏密，不是控件高度。表单分组请用 Fieldset。"
    description-en="Title, body, and footer share one surface. size is density, not control height. Form groups belong on Fieldset."
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
    description="grouped 是默认工作台分层。outlined / filled 偏信息面板。不要用业务 CSS 改边框色。"
    description-en="grouped is the default layered workbench surface. outlined / filled suit info panels. Do not restyle the border in product CSS."
    :code="variantCode"
  >
    <div class="stack">
      <RsCard variant="grouped" :title="copy.title">{{ copy.body }}</RsCard>
      <RsCard variant="outlined" :title="copy.title">{{ copy.body }}</RsCard>
      <RsCard variant="filled" :title="copy.title">{{ copy.body }}</RsCard>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#header 覆盖 title / description。#actions 在标题行右侧。#footer 是页脚。#cover 在最顶上。"
    description-en="#header replaces title / description. #actions sit on the right of the heading. #footer is the footer. #cover is the top media."
    :code="slotsCode"
  >
    <RsCard>
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
    :code="basicCode"
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
