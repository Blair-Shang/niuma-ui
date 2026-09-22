<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsDescriptions, RsDescriptionsItem, RsTag } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const eventLog = ref('')
const methodLog = ref('')
const descriptionsRef = ref<Record<string, unknown> | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    name: 'Name',
    version: 'Version',
    license: 'License',
    title: 'Package',
    plain: 'Plain',
    framed: 'Bordered',
    side: 'Label on the side',
    above: 'Label above',
    region: 'Region',
    notes: 'Notes',
    notesValue: 'Ships with the workbench theme.',
    edit: 'Edit',
    status: 'Status',
    healthy: 'Healthy',
    env: 'Environment',
    prod: 'Production',
    owner: 'Owner',
    zero: 'Retries',
    blank: 'Nickname',
    dark: 'Dark surface — description tokens follow data-rs-theme',
    sceneTitle: 'billing-api',
    sceneNote: 'Last health check passed.',
    eventIdle: 'RsDescriptions emits nothing. Bind Edit on RsButton.',
    eventHit: 'edit → billing-api',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. There is no refresh() on the descriptions ref.',
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    name: '名称',
    version: '版本',
    license: '协议',
    title: '组件包',
    plain: '无边框',
    framed: '有边框',
    side: '标签在左侧',
    above: '标签在上方',
    region: '地域',
    notes: '说明',
    notesValue: '跟随工作台主题。',
    edit: '编辑',
    status: '状态',
    healthy: '正常',
    env: '环境',
    prod: '生产',
    owner: '负责人',
    zero: '重试',
    blank: '昵称',
    dark: '深色表面 — 描述列表 token 跟 data-rs-theme',
    sceneTitle: 'billing-api',
    sceneNote: '最近一次健康检查通过。',
    eventIdle: 'RsDescriptions 不发事件。编辑绑在 RsButton 上。',
    eventHit: '编辑 → billing-api',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。描述列表 ref 上没有 refresh()。',
    methodNone: 'expose 键：none',
  },
})

const basicItems = computed(() => [
  { key: 'name', label: copy.value.name, value: 'niuma-ui' },
  { key: 'version', label: copy.value.version, value: '2.0.5' },
  { key: 'license', label: copy.value.license, value: 'Apache-2.0' },
])

const spanItems = computed(() => [
  { key: 'name', label: copy.value.name, value: 'niuma-ui' },
  { key: 'region', label: copy.value.region, value: 'ap-east-1', span: 2 },
  { key: 'notes', label: copy.value.notes, value: copy.value.notesValue, span: 3 },
])

const emptyItems = computed(() => [
  { key: 'owner', label: copy.value.owner, value: null },
  { key: 'retries', label: copy.value.zero, value: 0 },
  { key: 'nick', label: copy.value.blank, value: '' },
])

const eventNote = computed(() => eventLog.value || copy.value.eventIdle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsDescriptions title="Package" :items="items" :columns="3" />`

const borderCode = `<RsDescriptions title="Package" :items="items" />
<RsDescriptions title="Package" :items="items" :bordered="false" />`

const placementCode = `<RsDescriptions label-placement="left" :items="items" />
<RsDescriptions label-placement="top" :items="items" />`

const spanCode = `<RsDescriptions :columns="3" :items="items" />
<!-- { label: 'Region', value: 'ap-east-1', span: 2 } -->`

const sizeCode = `<RsDescriptions size="ssm" :items="items" />
<RsDescriptions size="sm" :items="items" />
<RsDescriptions size="md" :items="items" />
<RsDescriptions size="lg" :items="items" />`

const radiusCode = `<RsDescriptions radius="none" :items="items" />
<RsDescriptions radius="lg" :items="items" />`

const colonCode = `<RsDescriptions colon :items="items" />
<!-- zh-CN appends ：  en-US appends : -->`

const labelCode = `<RsDescriptions label-width="9rem" label-align="end" :items="items" />`

const slotsCode = `<RsDescriptions :columns="2">
  <template #title>billing-api</template>
  <template #extra>
    <RsButton size="sm">Edit</RsButton>
  </template>
  <RsDescriptionsItem label="Environment">Production</RsDescriptionsItem>
  <RsDescriptionsItem label="Status">
    <RsTag variant="success" size="sm">Healthy</RsTag>
  </RsDescriptionsItem>
</RsDescriptions>`

const emptyCode = `<RsDescriptions
  :items="[
    { label: 'Owner', value: null },
    { label: 'Retries', value: 0 },
    { label: 'Nickname', value: '' },
  ]"
/>`

const sceneCode = `<RsDescriptions title="billing-api" :columns="2">
  <template #extra>
    <RsButton size="sm">Edit</RsButton>
  </template>
  <RsDescriptionsItem label="Environment">Production</RsDescriptionsItem>
  <RsDescriptionsItem label="Status">
    <RsTag variant="success" size="sm">Healthy</RsTag>
  </RsDescriptionsItem>
  <RsDescriptionsItem label="Notes" :span="2">
    Last health check passed.
  </RsDescriptionsItem>
</RsDescriptions>`

const eventsCode = `<RsDescriptions title="billing-api">
  <template #extra>
    <RsButton size="sm" @click="log">Edit</RsButton>
  </template>
</RsDescriptions>`

const methodsCode = `const list = ref()
// RsDescriptions has no defineExpose — list.value.refresh is undefined
<RsDescriptions ref="list" :items="items" />`

function onEdit() {
  eventLog.value = copy.value.eventHit
}

function inspectRef() {
  const inst = descriptionsRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="数据驱动"
    title-en="Items"
    description="传入 items 即可。颜色跟 token，不要写死 hex。"
    description-en="Pass items. Colors follow tokens — do not hard-code hex."
    :code="basicCode"
  >
    <RsDescriptions :title="copy.title" :items="basicItems" :columns="3" />
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.dark }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsDescriptions :title="copy.title" :items="basicItems" :columns="3" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-border"
    title="边框"
    title-en="Border"
    description="默认有表格外框。bordered 关掉后只剩键值。"
    description-en="The frame is on by default. Set bordered to false for plain pairs."
    :code="borderCode"
  >
    <div class="stack">
      <RsDescriptions :title="copy.framed" :items="basicItems" />
      <RsDescriptions :title="copy.plain" :items="basicItems" :bordered="false" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-placement"
    title="标签位置"
    title-en="Label placement"
    description="left 标签与值同一行。top 把标签放到值的上方。"
    description-en="left keeps the label beside the value. top stacks the label above it."
    :code="placementCode"
  >
    <div class="stack">
      <RsDescriptions :title="copy.side" :items="basicItems" label-placement="left" />
      <RsDescriptions :title="copy.above" :items="basicItems" label-placement="top" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-span"
    title="列与跨列"
    title-en="Columns and span"
    description="columns 是列数。span 不能超过列数，0 和负数按 1。"
    description-en="columns is the column count. span cannot exceed it. 0 and negatives become 1."
    :code="spanCode"
  >
    <RsDescriptions :columns="3" :items="spanItems" />
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="四档 ssm / sm / md / lg。未传跟 Form 或 ConfigProvider，再回退 md。"
    description-en="Four steps: ssm, sm, md, lg. Omit to follow Form or ConfigProvider, then md."
    :code="sizeCode"
  >
    <div class="stack">
      <RsDescriptions size="ssm" title="ssm" :items="basicItems" :columns="3" />
      <RsDescriptions size="sm" title="sm" :items="basicItems" :columns="3" />
      <RsDescriptions size="md" title="md" :items="basicItems" :columns="3" />
      <RsDescriptions size="lg" title="lg" :items="basicItems" :columns="3" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-radius"
    title="圆角"
    title-en="Radius"
    description="有边框时圆角走 radius。未传跟 controlRadius。"
    description-en="When bordered, radius sets the corners. Omit to follow controlRadius."
    :code="radiusCode"
  >
    <div class="stack">
      <RsDescriptions radius="none" :items="basicItems" />
      <RsDescriptions radius="lg" :items="basicItems" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-colon"
    title="冒号"
    title-en="Colon"
    description="默认不加冒号。打开后跟当前语言：中文全角，英文半角。冒号对读屏隐藏。"
    description-en="Colon is off by default. When on, zh-CN uses a fullwidth colon and en-US an ASCII colon. The glyph is hidden from assistive tech."
    :code="colonCode"
  >
    <RsDescriptions colon :title="copy.title" :items="basicItems" />
  </DocDemo>

  <DocDemo
    id="demo-label"
    title="标签列"
    title-en="Label column"
    description="label-width 固定左标签列宽。label-align 用 start / center / end，跟书写方向。"
    description-en="label-width fixes the side-label column. label-align is start, center, or end and follows writing direction."
    :code="labelCode"
  >
    <div class="stack">
      <RsDescriptions label-width="9rem" :items="basicItems" />
      <RsDescriptions label-align="end" label-width="9rem" :items="basicItems" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="自定义内容用 RsDescriptionsItem。#title、#extra、#label 和默认插槽都能看见。"
    description-en="Use RsDescriptionsItem for custom content. #title, #extra, #label, and the default slot are all visible here."
    :code="slotsCode"
  >
    <RsDescriptions :columns="2">
      <template #title>{{ copy.sceneTitle }}</template>
      <template #extra>
        <RsButton size="sm">{{ copy.edit }}</RsButton>
      </template>
      <RsDescriptionsItem :label="copy.env">{{ copy.prod }}</RsDescriptionsItem>
      <RsDescriptionsItem>
        <template #label>{{ copy.status }}</template>
        <RsTag variant="success" size="sm">{{ copy.healthy }}</RsTag>
      </RsDescriptionsItem>
    </RsDescriptions>
  </DocDemo>

  <DocDemo
    id="demo-empty"
    title="空值"
    title-en="Empty values"
    description="只有 null / undefined 显示占位破折号。0 和空字符串原样留下。"
    description-en="Only null and undefined show the em dash. 0 and an empty string stay as they are."
    :code="emptyCode"
  >
    <RsDescriptions :items="emptyItems" :columns="3" />
  </DocDemo>

  <DocDemo
    id="demo-scene"
    title="详情页"
    title-en="Detail page"
    description="标题行放编辑，状态用标签，说明跨两列。这是只读详情，不是表单。"
    description-en="Put Edit on the heading row, a tag in the status value, and let notes span both columns. This is a read-only detail, not a form."
    :code="sceneCode"
  >
    <RsDescriptions :title="copy.sceneTitle" :columns="2">
      <template #extra>
        <RsButton size="sm">{{ copy.edit }}</RsButton>
      </template>
      <RsDescriptionsItem :label="copy.env">{{ copy.prod }}</RsDescriptionsItem>
      <RsDescriptionsItem :label="copy.status">
        <RsTag variant="success" size="sm">{{ copy.healthy }}</RsTag>
      </RsDescriptionsItem>
      <RsDescriptionsItem :label="copy.notes" :span="2">
        {{ copy.sceneNote }}
      </RsDescriptionsItem>
    </RsDescriptions>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="描述列表不发事件。要点出结果，把点击绑在 #extra 的按钮上。"
    description-en="Descriptions emit nothing. To show a result, bind the click on the button in #extra."
    :code="eventsCode"
  >
    <RsDescriptions :title="copy.sceneTitle" :items="basicItems">
      <template #extra>
        <RsButton size="sm" @click="onEdit">{{ copy.edit }}</RsButton>
      </template>
    </RsDescriptions>
    <p class="event-log" :data-live="eventLog ? '1' : undefined">{{ eventNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。ref 上没有 refresh()。"
    description-en="There is no defineExpose. refresh() is not on the ref."
    :code="methodsCode"
  >
    <RsDescriptions ref="descriptionsRef" :title="copy.title" :items="basicItems" />
    <div class="row">
      <RsButton size="sm" variant="default" @click="inspectRef">{{ copy.inspect }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
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
  padding: 0.9rem 1rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}

.event-log {
  margin: 0.75rem 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}
</style>
