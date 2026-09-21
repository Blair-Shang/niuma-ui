<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsTag } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const lastAction = ref('')
const methodLog = ref('')
const tagRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    def: 'Default',
    prod: 'Production',
    health: 'Healthy',
    delay: 'Delayed',
    fault: 'Fault',
    gray: 'Canary',
    close: 'Closable',
    locked: 'Locked',
    pill: 'Pill',
    darkSurface: 'Dark surface — fill follows container tokens, do not hard-code color',
        idle: 'Click the label: no component event. Close emits close. Disabled close does not emit.',
        closed: 'close → Closable',
        inspect: 'Inspect ref',
        methodIdle: 'No defineExpose. There is no remove() on the tag ref.',
        methodNone: 'expose keys: none',
  },
  'zh-CN': {
    def: '默认',
    prod: '生产',
    health: '健康',
    delay: '延迟',
    fault: '故障',
    gray: '灰度',
    close: '可关闭',
    locked: '禁用',
    pill: '胶囊',
    darkSurface: '深色表面 — 底色跟 container token，不要写死颜色',
        idle: '点正文没有组件事件。点关闭发 close。禁用关闭不发。',
        closed: 'close → 可关闭',
        inspect: '查看 ref',
    methodIdle: '没有 defineExpose。标签 ref 上没有 remove()。',
    methodNone: 'expose 键：none',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const toneCode = `<RsTag>Default</RsTag>
<RsTag variant="primary">Production</RsTag>
<RsTag variant="success">Healthy</RsTag>
<RsTag variant="warning">Delayed</RsTag>
<RsTag variant="danger">Fault</RsTag>
<RsTag variant="info">Canary</RsTag>`

const closeCode = `<RsTag closable @close="onClose">Closable</RsTag>
<RsTag closable disabled>Locked</RsTag>
<RsTag round variant="primary">Pill</RsTag>`

const sizeCode = `<RsTag size="ssm">Default</RsTag>
<RsTag size="sm">Default</RsTag>
<RsTag size="md">Default</RsTag>
<RsTag size="lg">Default</RsTag>`

const radiusCode = `<RsTag radius="none">Default</RsTag>
<RsTag radius="sm">Default</RsTag>
<RsTag radius="full">Default</RsTag>
<RsTag round>Pill</RsTag>`

const eventsCode = `<RsTag>Default</RsTag>
<RsTag closable @close="onClose">Closable</RsTag>
<RsTag closable disabled>Locked</RsTag>`

const methodsCode = `const tag = ref()
// RsTag has no defineExpose — tag.value.remove is undefined
<RsTag ref="tag">Default</RsTag>`

function onClose() {
  lastAction.value = copy.value.closed
}

function inspectTagRef() {
  const inst = tagRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-type"
    title="语义色"
    title-en="Tone"
    description="variant 只改色相。标签不是按钮。一组可增删请用 DynamicTags。"
    description-en="variant changes hue only. A tag is not a button. An editable group belongs on DynamicTags."
    :code="toneCode"
  >
    <div class="row">
      <RsTag>{{ copy.def }}</RsTag>
      <RsTag variant="primary">{{ copy.prod }}</RsTag>
      <RsTag variant="success">{{ copy.health }}</RsTag>
      <RsTag variant="warning">{{ copy.delay }}</RsTag>
      <RsTag variant="danger">{{ copy.fault }}</RsTag>
      <RsTag variant="info">{{ copy.gray }}</RsTag>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsTag>{{ copy.def }}</RsTag>
        <RsTag variant="primary">{{ copy.prod }}</RsTag>
        <RsTag variant="danger">{{ copy.fault }}</RsTag>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-close"
    title="可关闭与胶囊"
    title-en="Closable and pill"
    description="closable 只显示关闭钮。点关闭发 close，不自己卸掉。round 等价 radius=&quot;full&quot;。"
    description-en="closable only shows the close control. close fires; the tag does not unmount itself. round is the same as radius=&quot;full&quot;."
    :code="closeCode"
  >
    <div class="row">
      <RsTag closable @close="onClose">{{ copy.close }}</RsTag>
      <RsTag closable disabled>{{ copy.locked }}</RsTag>
      <RsTag round variant="primary">{{ copy.pill }}</RsTag>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档跟 RsComponentSize。未传时跟随 RsConfigProvider.control-size。"
    description-en="Four steps on RsComponentSize. Omitted size follows RsConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="row">
      <RsTag size="ssm">{{ copy.def }}</RsTag>
      <RsTag size="sm">{{ copy.def }}</RsTag>
      <RsTag size="md">{{ copy.def }}</RsTag>
      <RsTag size="lg">{{ copy.def }}</RsTag>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-radius"
    title="圆角"
    title-en="Radius"
    description="radius 走统一档位。胶囊用 full 或 round，不要 :deep 改边角。"
    description-en="radius uses the shared scale. Use full or round for a pill. Do not restyle corners with :deep."
    :code="radiusCode"
  >
    <div class="row">
      <RsTag radius="none">{{ copy.def }}</RsTag>
      <RsTag radius="sm">{{ copy.def }}</RsTag>
      <RsTag radius="full">{{ copy.def }}</RsTag>
      <RsTag round>{{ copy.pill }}</RsTag>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="只有 close。点正文没有组件 click。禁用关闭不会发事件。标签会留着，直到宿主删数据。"
    description-en="Only close is a component event. The label is not a control. A disabled close does not emit. The tag stays until the host removes it."
    :code="eventsCode"
  >
    <div class="row">
      <RsTag>{{ copy.def }}</RsTag>
      <RsTag closable @close="onClose">{{ copy.close }}</RsTag>
      <RsTag closable disabled>{{ copy.locked }}</RsTag>
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。从列表里移除走宿主 @close。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. The host removes the item on @close. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsTag ref="tagRef">{{ copy.def }}</RsTag>
      <RsButton variant="default" @click="inspectTagRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
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
