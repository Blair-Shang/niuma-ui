<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsDivider } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const methodLog = ref('')
const dividerRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    above: 'Section above',
    below: 'Section below',
    more: 'More options',
    or: 'Or',
    edit: 'Edit',
    copy: 'Copy',
    remove: 'Delete',
    darkSurface: 'Dark surface — stroke follows --rs-border, do not hard-code color',
    idle: 'RsDivider emits nothing. The line is not a control.',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no setOrientation() on the divider ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    above: '上方内容',
    below: '下方内容',
    more: '更多选项',
    or: '或',
    edit: '编辑',
    copy: '复制',
    remove: '删除',
    darkSurface: '深色表面 — 描边跟 --rs-border，不要写死颜色',
    idle: 'RsDivider 不发事件。分割线不是控件。',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。分割线 ref 上没有 setOrientation()。',
    methodNone: 'expose 键：none',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const horizontalCode = `<p>Section above</p>
<RsDivider />
<p>Section below</p>`

const labelCode = `<RsDivider>Or</RsDivider>
<RsDivider dashed>More options</RsDivider>`

const verticalCode = `<span>Edit</span>
<RsDivider orientation="vertical" />
<span>Copy</span>
<RsDivider orientation="vertical" dashed />
<span>Delete</span>`

const eventsCode = `<RsDivider>Or</RsDivider>
<RsButton variant="default">Inspect ref</RsButton>`

const methodsCode = `const divider = ref()
// RsDivider has no defineExpose — divider.value.setOrientation is undefined
<RsDivider ref="divider" />`

function inspectDividerRef() {
  const inst = dividerRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-h"
    title="水平分割"
    title-en="Horizontal"
    description="默认水平。用来切开上下两块内容。不要用它当按钮或标题。"
    description-en="Default is horizontal. Use it to split blocks above and below. It is not a button or a heading."
    :code="horizontalCode"
  >
    <p>{{ copy.above }}</p>
    <RsDivider />
    <p>{{ copy.below }}</p>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <p>{{ copy.above }}</p>
        <RsDivider />
        <p>{{ copy.below }}</p>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-label"
    title="中间标题"
    title-en="Label"
    description="标题只走默认插槽，没有 label prop。虚线传 dashed。竖线时插槽不渲染。"
    description-en="The title is the default slot — there is no label prop. Pass dashed for a dashed stroke. The slot does not render on a vertical rule."
    :code="labelCode"
  >
    <p>{{ copy.above }}</p>
    <RsDivider>{{ copy.or }}</RsDivider>
    <p>{{ copy.below }}</p>
    <RsDivider dashed>{{ copy.more }}</RsDivider>
    <p>{{ copy.more }}</p>
  </DocDemo>

  <DocDemo
    id="demo-v"
    title="垂直分割"
    title-en="Vertical"
    description="工具栏文字或按钮之间用竖线。父级要是横向 flex，否则竖线没有高度。"
    description-en="Use a vertical rule between toolbar text or buttons. The parent must be a horizontal flex row, or the rule has no height."
    :code="verticalCode"
  >
    <div class="row">
      <span>{{ copy.edit }}</span>
      <RsDivider orientation="vertical" />
      <span>{{ copy.copy }}</span>
      <RsDivider orientation="vertical" dashed />
      <span>{{ copy.remove }}</span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有组件事件。点分割线不会发 click / change。可感知的操作请绑 RsButton。"
    description-en="No component events. A click on the rule does not emit click or change. Bind actions on RsButton."
    :code="eventsCode"
  >
    <div class="row">
      <RsDivider>{{ copy.or }}</RsDivider>
    </div>
    <p class="event-log">{{ copy.idle }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。改方向走 orientation。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose. Change direction with orientation. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsDivider ref="dividerRef" />
      <RsButton variant="default" @click="inspectDividerRef">{{ copy.inspect }}</RsButton>
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
