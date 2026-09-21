<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsContainer } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const methodLog = ref('')
const containerRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    main: 'Main column · lg, centered',
    head: 'Header (12)',
    primary: 'Main (8)',
    side: 'Aside (4)',
    fluid: 'fluid fills the parent and ignores maxWidth',
    darkSurface: 'Dark surface — width tokens stay --rs-container-max-*, do not hard-code px',
    idle: 'RsContainer emits nothing. It is a layout shell, not a control.',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no setMaxWidth() on the container ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    main: '主内容区 · lg 居中',
    head: '页头（12）',
    primary: '主栏（8）',
    side: '侧栏（4）',
    fluid: 'fluid 占满父级，忽略 maxWidth',
    darkSurface: '深色表面 — 宽度仍走 --rs-container-max-*，不要写死 px',
    idle: 'RsContainer 不发事件。它是版心，不是控件。',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。容器 ref 上没有 setMaxWidth()。',
    methodNone: 'expose 键：none',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsContainer max-width="lg" padding="md">
  Main column
</RsContainer>`

const fluidCode = `<RsContainer fluid padding="md">
  fluid fills the parent
</RsContainer>`

const gridCode = `<RsContainer grid :columns="12" gap="sm">
  <div style="grid-column: span 12">Header</div>
  <div style="grid-column: span 8">Main</div>
  <div style="grid-column: span 4">Aside</div>
</RsContainer>`

const methodsCode = `const box = ref()
// RsContainer has no defineExpose — box.value.setMaxWidth is undefined
<RsContainer ref="box" />`

function inspectContainerRef() {
  const inst = containerRef.value
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
    description="限制阅读宽度并水平居中。max-width 分 sm / md / lg / xl / full。不要写死像素宽。"
    description-en="Keep a readable measure and center it. max-width is sm / md / lg / xl / full. Do not hard-code a pixel width."
    :code="basicCode"
  >
    <div class="viewport">
      <RsContainer max-width="lg" padding="md">
        <div class="box">{{ copy.main }}</div>
      </RsContainer>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsContainer max-width="lg" padding="md">
          <div class="box">{{ copy.main }}</div>
        </RsContainer>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-fluid"
    title="铺满"
    title-en="Fluid"
    description="fluid 占满父级，忽略 maxWidth。全宽工作台用它，正文版心不要开。"
    description-en="fluid fills the parent and ignores maxWidth. Use it on a full-bleed workbench, not on prose."
    :code="fluidCode"
  >
    <div class="viewport">
      <RsContainer fluid padding="md">
        <div class="box">{{ copy.fluid }}</div>
      </RsContainer>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-grid"
    title="栅格"
    title-en="Grid"
    description="grid + columns + gap 组成简单 12 列。子项用 grid-column 控制跨度，不要再引入另一套栅格。"
    description-en="grid + columns + gap is a simple 12-column layout. Children use grid-column for span. Do not add a second grid system."
    :code="gridCode"
  >
    <RsContainer grid :columns="12" gap="sm">
      <div class="card col-12">{{ copy.head }}</div>
      <div class="card col-8">{{ copy.primary }}</div>
      <div class="card col-4">{{ copy.side }}</div>
    </RsContainer>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。点容器不会发 click。"
    description-en="No component events. A click on the shell does not emit click."
    :code="basicCode"
  >
    <RsContainer max-width="lg" padding="md">
      <div class="box">{{ copy.main }}</div>
    </RsContainer>
    <p class="event-log">{{ copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。改宽度走 max-width / fluid。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Change width with max-width / fluid. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsContainer ref="containerRef" max-width="lg" padding="md">
        <div class="box">{{ copy.main }}</div>
      </RsContainer>
      <RsButton variant="default" @click="inspectContainerRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.viewport {
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  overflow: hidden;
}

.box,
.card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-elevated);
  font-size: var(--rs-font-size-sm);
}

.col-12 {
  grid-column: span 12;
}

.col-8 {
  grid-column: span 8;
}

.col-4 {
  grid-column: span 4;
}

@media (width < 40rem) {
  .col-8,
  .col-4 {
    grid-column: span 12;
  }
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

.row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
