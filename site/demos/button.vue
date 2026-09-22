<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsDropdown } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const loading = ref(false)
const lastAction = ref('')

function runLoad() {
  loading.value = true
  globalThis.setTimeout(() => {
    loading.value = false
  }, 2000)
}

const { copy: label } = useSiteDemo({
  'en-US': {
    primary: 'Save',
    default: 'Cancel',
    ghost: 'Ghost',
    text: 'Text',
    link: 'Link',
    more: 'More',
    newChat: 'New chat',
    refresh: 'Refresh',
    search: 'Search',
    settings: 'Settings',
    open: 'Open project',
    save: 'Save',
    submit: 'Submitting',
    tonePrimary: 'Primary',
    toneSuccess: 'Success',
    toneWarning: 'Warning',
    toneDanger: 'Danger',
    toneInfo: 'Info',
    solidSuccess: 'Solid success',
    ghostDanger: 'Ghost danger',
    textInfo: 'Text info',
    square: 'Square',
    pill: 'Pill',
    withBorder: 'Border',
    darkSurface: 'Dark surface — ghost keeps theme tokens, do not hard-code color',
    idle: 'No click yet. The event is native @click on the button.',
    saveHit: 'click → Save',
    searchHit: 'click → Search',
    inspect: 'Inspect ref',
    methodIdle: 'No defineExpose. Inspect the ref — there is no focus() / validate().',
    methodNone: 'expose keys: none',
    moreExport: 'Export',
    moreArchive: 'Archive',
  },
  'zh-CN': {
    primary: '保存',
    default: '取消',
    ghost: '幽灵',
    text: '文字',
    link: '链接',
    more: '更多',
    newChat: '新建对话',
    refresh: '刷新',
    search: '搜索',
    settings: '设置',
    open: '打开项目',
    save: '保存',
    submit: '提交中',
    tonePrimary: '主色',
    toneSuccess: '成功',
    toneWarning: '警告',
    toneDanger: '危险',
    toneInfo: '信息',
    solidSuccess: '实心成功',
    ghostDanger: '幽灵危险',
    textInfo: '文字信息',
    square: '直角',
    pill: '胶囊',
    withBorder: '描边',
    darkSurface: '深色表面 — 幽灵跟主题 token，不要写死颜色',
    idle: '还没有点击。事件就是按钮上的原生 @click。',
    saveHit: 'click → 保存',
    searchHit: 'click → 搜索',
    inspect: '查看 ref',
    methodIdle: '没有 defineExpose。查看 ref — 没有 focus() / validate()。',
    methodNone: 'expose 键：none',
    moreExport: '导出',
    moreArchive: '归档',
  },
})

const eventLog = computed(() => lastAction.value || label.value.idle)
const methodLog = ref('')
const methodNote = computed(() => methodLog.value || label.value.methodIdle)
const btnRef = ref<{ $el?: unknown } | null>(null)

const moreItems = computed(() => [
  { label: label.value.moreExport, value: 'export', icon: 'download' },
  { label: label.value.moreArchive, value: 'archive', icon: 'archive' },
])

const typeCode = `<RsButton variant="primary">Save</RsButton>
<RsButton variant="default">Cancel</RsButton>
<RsButton variant="ghost">Ghost</RsButton>
<RsButton variant="text">Text</RsButton>
<RsButton variant="link">Link</RsButton>

<div data-rs-theme="dark">
  <RsButton variant="ghost">Ghost</RsButton>
</div>`

const toneCode = `<RsButton variant="default" tone="warning">Warning</RsButton>
<RsButton variant="primary" tone="success">Success</RsButton>
<RsButton variant="ghost" tone="danger">Delete</RsButton>`

const sizeCode = `<RsButton size="ssm">ssm</RsButton>
<RsButton size="sm">sm</RsButton>
<RsButton size="md">md</RsButton>
<RsButton size="lg">lg</RsButton>`

const iconCode = `<RsButton icon="plus">New chat</RsButton>
<RsButton icon="search" icon-only tooltip="Search" />
<RsButton icon="settings" :icon-size="18" icon-only tooltip="Settings" variant="ghost" />
<RsButton icon="folder" reveal-label>Open project</RsButton>`

const disabledCode = `<RsButton variant="primary">Save</RsButton>
<RsButton variant="primary" disabled>Save</RsButton>
<RsButton variant="ghost" disabled>Ghost</RsButton>`

const loadingCode = `<RsButton :loading="saving" @click="save">Save</RsButton>
<RsButton variant="default" loading>Submitting</RsButton>`

const radiusCode = `<RsButton radius="none">Square</RsButton>
<RsButton radius="sm">sm</RsButton>
<RsButton radius="full">Pill</RsButton>
<RsButton variant="default" bordered>Border</RsButton>`

const groupCode = `<RsButton variant="primary">Save</RsButton>
<RsButton variant="default">Cancel</RsButton>
<RsDropdown :items="more" :show-selected="false" content-width="fit">
  <template #trigger>
    <RsButton variant="default" icon="ellipsis">More</RsButton>
  </template>
</RsDropdown>`

const eventsCode = `<RsButton variant="primary" @click="onSave">Save</RsButton>
<RsButton icon="search" icon-only tooltip="Search" @click="onSearch" />
<RsButton variant="primary" loading @click="onSave">Save</RsButton>`

const methodsCode = `const btn = ref()
// RsButton has no defineExpose — btn.value.focus is undefined
<RsButton ref="btn">Save</RsButton>`

function onSave() {
  lastAction.value = label.value.saveHit
}

function onSearch() {
  lastAction.value = label.value.searchHit
}

function inspectButtonRef() {
  const inst = btnRef.value as Record<string, unknown> | null
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : label.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-type"
    title="形态"
    title-en="Shape"
    description="一个操作区只放一个主按钮。default 是次操作；幽灵透明底 + 描边，悬浮铺 --rs-surface-hover。深色底请用 data-rs-theme，不要写死颜色。"
    description-en="One primary button per action group. default is secondary. Ghost is transparent with an outline; hover fills --rs-surface-hover. On a dark surface, set data-rs-theme — do not hard-code color."
    :code="typeCode"
  >
    <div class="row">
      <RsButton variant="primary">{{ label.primary }}</RsButton>
      <RsButton variant="default">{{ label.default }}</RsButton>
      <RsButton variant="ghost">{{ label.ghost }}</RsButton>
      <RsButton variant="text">{{ label.text }}</RsButton>
      <RsButton variant="link">{{ label.link }}</RsButton>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ label.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsButton variant="ghost">{{ label.ghost }}</RsButton>
        <RsButton variant="text">{{ label.text }}</RsButton>
        <RsButton variant="link">{{ label.link }}</RsButton>
        <RsButton variant="ghost" icon="settings" icon-only :tooltip="label.settings" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="语义色"
    title-en="Tone"
    description="tone 只改色相，variant 只管形态。描边要再传 bordered，例如 variant=&quot;default&quot; tone=&quot;warning&quot; bordered。不要用业务 CSS 改颜色。"
    description-en="tone changes hue only. variant stays the shape. Pass bordered to draw an outline, for example variant=&quot;default&quot; tone=&quot;warning&quot; bordered. Do not restyle color in product CSS."
    :code="toneCode"
  >
    <div class="row">
      <RsButton variant="default" tone="primary">{{ label.tonePrimary }}</RsButton>
      <RsButton variant="default" tone="success">{{ label.toneSuccess }}</RsButton>
      <RsButton variant="default" tone="warning">{{ label.toneWarning }}</RsButton>
      <RsButton variant="default" tone="danger">{{ label.toneDanger }}</RsButton>
      <RsButton variant="default" tone="info">{{ label.toneInfo }}</RsButton>
    </div>
    <div class="row">
      <RsButton variant="primary" tone="success">{{ label.solidSuccess }}</RsButton>
      <RsButton variant="ghost" tone="danger">{{ label.ghostDanger }}</RsButton>
      <RsButton variant="text" tone="info">{{ label.textInfo }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="ssm / sm / md / lg 四档。未传 size 时跟随 RsConfigProvider.control-size。"
    description-en="Four sizes: ssm, sm, md, lg. Omit size to follow RsConfigProvider.control-size."
    :code="sizeCode"
  >
    <div class="row">
      <RsButton size="ssm">ssm</RsButton>
      <RsButton size="sm">sm</RsButton>
      <RsButton size="md">md</RsButton>
      <RsButton size="lg">lg</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-icon"
    title="图标"
    title-en="Icons"
    description="仅图标必须提供 tooltip 或 aria-label。reveal-label 适合工具栏：默认收起文字，悬停展开。"
    description-en="Icon-only buttons need tooltip or aria-label. reveal-label hides the text until hover — use it on dense toolbars."
    :code="iconCode"
  >
    <div class="row">
      <RsButton icon="plus">{{ label.newChat }}</RsButton>
      <RsButton icon="refresh-cw" variant="default">{{ label.refresh }}</RsButton>
      <RsButton icon="search" icon-only :tooltip="label.search" />
      <RsButton icon="settings" :icon-size="18" icon-only :tooltip="label.settings" variant="ghost" />
      <RsButton icon="folder" reveal-label variant="default">{{ label.open }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="每种形态都有对应的禁用样式。灰掉按钮时，附近要写清为什么不可用。"
    description-en="Every shape has a disabled style. When you disable a control, explain nearby why it is unavailable."
    :code="disabledCode"
  >
    <div class="stack">
      <div class="row">
        <RsButton variant="primary">{{ label.primary }}</RsButton>
        <RsButton variant="primary" disabled>{{ label.primary }}</RsButton>
      </div>
      <div class="row">
        <RsButton variant="default">{{ label.default }}</RsButton>
        <RsButton variant="default" disabled>{{ label.default }}</RsButton>
        <RsButton variant="ghost" disabled>{{ label.ghost }}</RsButton>
        <RsButton variant="text" disabled>{{ label.text }}</RsButton>
        <RsButton variant="link" disabled>{{ label.link }}</RsButton>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-loading"
    title="加载中"
    title-en="Loading"
    description="loading 会转圈并拦住再次点击。不要再加 disabled。左侧按钮可点一下看进入加载。"
    description-en="loading shows a spinner and blocks extra clicks. Do not also set disabled. Click the first button to try it."
    :code="loadingCode"
  >
    <div class="row">
      <RsButton :loading="loading" @click="runLoad">{{ label.save }}</RsButton>
      <RsButton variant="default" :loading="true">{{ label.submit }}</RsButton>
      <RsButton icon="plus" :loading="true">{{ label.newChat }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-radius"
    title="圆角与描边"
    title-en="Radius and border"
    description="默认 radius=&quot;full&quot;（胶囊）。直角工作台传 none。未传 bordered 不画边，需要轮廓时再传。"
    description-en="Default radius is full (pill). Pass none for a square workbench. Omit bordered to leave the outline off."
    :code="radiusCode"
  >
    <div class="row">
      <RsButton radius="none">{{ label.square }}</RsButton>
      <RsButton radius="sm">sm</RsButton>
      <RsButton radius="md">md</RsButton>
      <RsButton radius="full">{{ label.pill }}</RsButton>
      <RsButton variant="default" bordered>{{ label.withBorder }}</RsButton>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-group"
    title="组合"
    title-en="Groups"
    description="推荐 1 个主操作 + 若干次操作。超过三个动作时，把其余放进 Dropdown。"
    description-en="Prefer one primary action plus a few secondary ones. If you have more than three, move the rest into a Dropdown."
    :code="groupCode"
  >
    <div class="row">
      <RsButton variant="primary">{{ label.primary }}</RsButton>
      <RsButton variant="default">{{ label.default }}</RsButton>
      <RsDropdown :items="moreItems" :show-selected="false" content-width="fit">
        <template #trigger>
          <RsButton variant="default" icon="ellipsis">{{ label.more }}</RsButton>
        </template>
      </RsDropdown>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="根节点是原生 button，直接绑 @click。loading 时点击被拦住。没有 @press / @success 这类额外事件。"
    description-en="The root is a native button. Bind @click. Clicks are blocked while loading. There is no extra @press or @success event."
    :code="eventsCode"
  >
    <div class="row">
      <RsButton variant="primary" @click="onSave">{{ label.primary }}</RsButton>
      <RsButton icon="search" icon-only :tooltip="label.search" @click="onSearch" />
      <RsButton variant="primary" :loading="true" @click="onSave">{{ label.save }}</RsButton>
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose。组件 ref 上没有 focus / validate。点下面按钮查看 expose 键，应是 none。"
    description-en="No defineExpose. The component ref has no focus or validate. Inspect expose keys below — they should be none."
    :code="methodsCode"
  >
    <div class="row">
      <RsButton ref="btnRef" variant="primary">{{ label.primary }}</RsButton>
      <RsButton variant="default" @click="inspectButtonRef">
        {{ label.inspect }}
      </RsButton>
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

.row + .row,
.stack .row + .row {
  margin-top: 0.75rem;
}

.stack {
  display: flex;
  flex-direction: column;
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
