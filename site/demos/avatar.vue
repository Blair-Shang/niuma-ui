<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsAvatar, RsButton } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const methodLog = ref('')
const avatarRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    zhang: 'Zhang San',
    jane: 'Jane Doe',
    studio: 'Weak Water',
    custom: 'AB',
    darkSurface: 'Dark surface — fallback fill follows container tokens, do not hard-code color',
    idle: 'RsAvatar emits nothing. The glyph is not a button.',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no setSrc() on the avatar ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    zhang: '张三',
    jane: 'Jane Doe',
    studio: '弱水工作室',
    custom: 'AB',
    darkSurface: '深色表面 — 回退底色跟 container token，不要写死颜色',
    idle: 'RsAvatar 不发事件。头像不是按钮。',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。头像 ref 上没有 setSrc()。',
    methodNone: 'expose 键：none',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const fallbackCode = `<RsAvatar src="/favicon.svg" name="Jane Doe" />
<RsAvatar src="https://invalid.niuma.invalid/missing.png" name="Jane Doe" />
<RsAvatar name="Zhang San" />
<RsAvatar fallback="AB" />
<RsAvatar />`

const sizeCode = `<RsAvatar name="Jane Doe" size="sm" />
<RsAvatar name="Jane Doe" size="md" />
<RsAvatar name="Jane Doe" size="lg" />`

const shapeCode = `<RsAvatar name="Jane Doe" shape="circle" />
<RsAvatar name="Jane Doe" shape="square" />`

const toneCode = `<RsAvatar name="Jane Doe" tone="default" />
<RsAvatar name="Jane Doe" tone="primary" />
<RsAvatar name="Jane Doe" tone="success" />
<RsAvatar name="Jane Doe" tone="warning" />
<RsAvatar name="Jane Doe" tone="danger" />`

const slotCode = `<RsAvatar>
  <template #fallback>AB</template>
</RsAvatar>`

const eventsCode = `<RsAvatar name="Jane Doe" />`

const methodsCode = `const avatar = ref()
// RsAvatar has no defineExpose — avatar.value.setSrc is undefined
<RsAvatar ref="avatar" name="Jane Doe" />`

function inspectAvatarRef() {
  const inst = avatarRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="图片与文字回退"
    title-en="Image and fallback"
    description="无 src 或加载失败时：fallback 文案，再是 name 缩写，再没有用 icon。不要用业务 CSS 改颜色。"
    description-en="If src is missing or fails: fallback text, then initials from name, then icon. Do not restyle color in product CSS."
    :code="fallbackCode"
  >
    <div class="row">
      <RsAvatar src="/favicon.svg" :name="copy.jane" />
      <RsAvatar src="https://invalid.niuma.invalid/missing.png" :name="copy.jane" />
      <RsAvatar :name="copy.zhang" />
      <RsAvatar :name="copy.studio" />
      <RsAvatar :fallback="copy.custom" />
      <RsAvatar />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsAvatar :name="copy.zhang" />
        <RsAvatar :name="copy.jane" />
        <RsAvatar />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="只有 sm / md / lg，没有 ssm。这是头像边长，不是控件四档。"
    description-en="Only sm / md / lg — no ssm. This is the avatar edge, not the four control sizes."
    :code="sizeCode"
  >
    <div class="row">
      <RsAvatar :name="copy.jane" size="sm" />
      <RsAvatar :name="copy.jane" size="md" />
      <RsAvatar :name="copy.jane" size="lg" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-shape"
    title="形状"
    title-en="Shape"
    description="circle 是默认。square 是小圆角方，不是直角。"
    description-en="circle is the default. square is a slightly rounded square, not a sharp box."
    :code="shapeCode"
  >
    <div class="row">
      <RsAvatar :name="copy.jane" shape="circle" />
      <RsAvatar :name="copy.jane" shape="square" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="回退色"
    title-en="Fallback tone"
    description="tone 只改无图时的底色。有图片时看不见。"
    description-en="tone only changes the fallback surface. It is hidden when the image loads."
    :code="toneCode"
  >
    <div class="row">
      <RsAvatar :name="copy.jane" tone="default" />
      <RsAvatar :name="copy.jane" tone="primary" />
      <RsAvatar :name="copy.jane" tone="success" />
      <RsAvatar :name="copy.jane" tone="warning" />
      <RsAvatar :name="copy.jane" tone="danger" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slot"
    title="自定义回退"
    title-en="Custom fallback"
    description="#fallback 覆盖文字缩写与默认图标。没有其它具名插槽。"
    description-en="#fallback replaces initials and the default icon. There are no other named slots."
    :code="slotCode"
  >
    <div class="row">
      <RsAvatar>
        <template #fallback>{{ copy.custom }}</template>
      </RsAvatar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。点头像不会发 click。可感知的操作请绑 RsButton。"
    description-en="No component events. A click on the avatar does not emit click. Bind actions on RsButton."
    :code="eventsCode"
  >
    <div class="row">
      <RsAvatar :name="copy.jane" />
    </div>
    <p class="event-log">{{ copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。改图走 src / name。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Change the picture with src / name. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsAvatar ref="avatarRef" :name="copy.jane" />
      <RsButton variant="default" @click="inspectAvatarRef">{{ copy.inspect }}</RsButton>
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
