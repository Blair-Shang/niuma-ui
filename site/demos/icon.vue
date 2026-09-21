<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsIcon, rsBrandIconNames } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const lastAction = ref('')

const names = ['plus', 'search', 'settings', 'folder', 'user', 'trash-2']

const { copy } = useSiteDemo({
  'en-US': {
    inherit: 'Inherits currentColor — wrap with a token, do not hard-code hex',
    notify: 'Notifications',
    docs: 'Documents',
    newChat: 'New chat',
    search: 'Search',
    darkSurface: 'Dark surface — stroke follows --rs-text, brand marks keep accent tokens',
    idle: 'RsIcon emits nothing. Click the button to see the event.',
    searchHit: 'Button click → Search',
    newChatHit: 'Button click → New chat',
    methodIdle: 'No defineExpose. There is no setName() / spin() on the icon ref.',
    methodNone: 'expose keys: none',
    inspect: 'Inspect ref',
  },
  'zh-CN': {
    inherit: '继承 currentColor — 外套 token，不要写死十六进制',
    notify: '通知',
    docs: '文档',
    newChat: '新建对话',
    search: '搜索',
    darkSurface: '深色表面 — 线标跟 --rs-text，品牌 mark 仍走 accent token',
    idle: 'RsIcon 不发事件。点右边的按钮才能看到回调。',
    searchHit: '按钮 click → 搜索',
    newChatHit: '按钮 click → 新建对话',
    methodIdle: '没有 defineExpose。图标 ref 上没有 setName() / spin()。',
    methodNone: 'expose 键：none',
    inspect: '查看 ref',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodLog = ref('')
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)
const iconRef = ref<Record<string, unknown> | null>(null)

const nameCode = `<RsIcon name="plus" />
<RsIcon name="search" />
<RsIcon name="trash-2" />`

const sizeCode = `<RsIcon name="settings" size="ssm" />
<RsIcon name="settings" size="sm" />
<RsIcon name="settings" size="md" />
<RsIcon name="settings" size="lg" />
<RsIcon name="settings" size="1.5rem" />`

const colorCode = `<span style="color: var(--rs-primary)">
  <RsIcon name="star" />
</span>
<RsIcon name="check" color="var(--rs-success)" />
<RsIcon name="triangle-alert" color="var(--rs-warning)" />
<RsIcon name="circle-x" color="var(--rs-danger)" />`

const labelCode = `<RsIcon name="bell" label="Notifications" />
<span>
  <RsIcon name="folder" />
  Documents
</span>`

const transformCode = `<RsIcon name="chevron-right" flip="horizontal" />
<RsIcon name="chevron-right" :rotate="90" />
<RsIcon name="loader" spin />`

const brandCode = `import 'niuma-ui/brand-icons.css'

<RsIcon name="mysql" />
<RsIcon name="postgres" />
<RsIcon name="redis" />`

const composeCode = `<RsButton icon="plus">New chat</RsButton>
<RsButton icon="search" icon-only tooltip="Search" />
<span>
  <RsIcon name="folder" />
  Documents
</span>`

const eventsCode = `<RsIcon name="bell" label="Notifications" />

<RsButton icon="plus" @click="onCreate">New chat</RsButton>
<RsButton icon="search" icon-only tooltip="Search" @click="onSearch" />`

const methodsCode = `const icon = ref()
// RsIcon has no defineExpose — icon.value.setName is undefined
<RsIcon ref="icon" name="bell" />`

function onSearch() {
  lastAction.value = copy.value.searchHit
}

function onCreate() {
  lastAction.value = copy.value.newChatHit
}

function inspectIconRef() {
  const inst = iconRef.value
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}
</script>

<template>
  <DocDemo
    id="demo-name"
    title="按名称"
    title-en="By name"
    description="Lucide 用 kebab-case（trash-2，不是 Trash2）。未知名称不渲染。"
    description-en="Lucide uses kebab-case (trash-2, not Trash2). Unknown names render nothing."
    :code="nameCode"
  >
    <div class="row">
      <span v-for="name in names" :key="name" class="item">
        <RsIcon :name="name" />
        <code>{{ name }}</code>
      </span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="尺寸"
    title-en="Size"
    description="ssm / sm / md / lg 与控件同一套边长。独立展示可用数字 px 或 rem，控件内不要硬编码。"
    description-en="ssm / sm / md / lg match control icon sizes. Standalone icons may use a px number or rem. Do not hard-code px inside controls."
    :code="sizeCode"
  >
    <div class="row">
      <span class="item">
        <RsIcon name="settings" size="ssm" />
        <code>ssm</code>
      </span>
      <span class="item">
        <RsIcon name="settings" size="sm" />
        <code>sm</code>
      </span>
      <span class="item">
        <RsIcon name="settings" size="md" />
        <code>md</code>
      </span>
      <span class="item">
        <RsIcon name="settings" size="lg" />
        <code>lg</code>
      </span>
      <span class="item">
        <RsIcon name="settings" size="1.5rem" />
        <code>1.5rem</code>
      </span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-color"
    title="颜色"
    title-en="Color"
    description="默认 currentColor。语义色传 token，不要写死 hex。深色底请用 data-rs-theme。"
    description-en="Default is currentColor. Pass semantic tokens — do not hard-code hex. On a dark surface, set data-rs-theme."
    :code="colorCode"
  >
    <div class="row">
      <span class="inherit" style="color: var(--rs-primary)">
        <RsIcon name="star" />
        <span>{{ copy.inherit }}</span>
      </span>
    </div>
    <div class="row">
      <RsIcon name="check" color="var(--rs-success)" />
      <RsIcon name="triangle-alert" color="var(--rs-warning)" />
      <RsIcon name="circle-x" color="var(--rs-danger)" />
      <RsIcon name="info" color="var(--rs-info)" />
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsIcon name="settings" />
        <RsIcon name="star" color="var(--rs-primary)" />
        <RsIcon name="mysql" size="lg" />
        <RsIcon name="postgres" size="lg" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-label"
    title="无障碍"
    title-en="Accessibility"
    description="旁边已有文字时不要传 label，保持装饰。只有图标本身表达含义时才加 label。可点击请用 RsButton。"
    description-en="Skip label when nearby text already names the icon. Pass label only when the glyph itself carries meaning. Clickable icons belong on RsButton."
    :code="labelCode"
  >
    <div class="row">
      <RsIcon name="bell" :label="copy.notify" />
      <span class="inline">
        <RsIcon name="folder" />
        {{ copy.docs }}
      </span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-transform"
    title="翻转与旋转"
    title-en="Flip and spin"
    description="指向类图标用 flip 或 rotate。loader 用 spin。不要同时传 rotate 和 spin。系统减少动态时停转。"
    description-en="Use flip or rotate on directional icons. Use spin on loaders. Do not combine rotate with spin. Spin stops when the user prefers reduced motion."
    :code="transformCode"
  >
    <div class="row">
      <span class="item">
        <RsIcon name="chevron-right" />
        <code>default</code>
      </span>
      <span class="item">
        <RsIcon name="chevron-right" flip="horizontal" />
        <code>flip</code>
      </span>
      <span class="item">
        <RsIcon name="chevron-right" :rotate="90" />
        <code>90°</code>
      </span>
      <span class="item">
        <RsIcon name="loader" spin />
        <code>spin</code>
      </span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-brand"
    title="品牌 mark"
    title-en="Brand marks"
    description="工作台数据源 mark。填充色走 --rs-icon-{name}-accent，需引入 niuma-ui/brand-icons.css。也可传 color 覆盖。"
    description-en="Workbench data-source marks. Fill uses --rs-icon-{name}-accent after you import niuma-ui/brand-icons.css. color overrides the accent."
    :code="brandCode"
  >
    <div class="row">
      <span v-for="name in rsBrandIconNames" :key="name" class="item">
        <RsIcon :name="name" size="lg" />
        <code>{{ name }}</code>
      </span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-compose"
    title="组合"
    title-en="Composition"
    description="可点击操作用 RsButton icon。行内说明用 RsIcon + 文字。不要给 RsIcon 绑点击。"
    description-en="Clickable actions use RsButton icon. Inline hints use RsIcon plus text. Do not bind click on RsIcon."
    :code="composeCode"
  >
    <div class="row">
      <RsButton icon="plus">{{ copy.newChat }}</RsButton>
      <RsButton icon="search" icon-only :tooltip="copy.search" />
      <span class="inline">
        <RsIcon name="folder" />
        {{ copy.docs }}
      </span>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="RsIcon 没有组件事件。原生 click 会落到 svg，但没有焦点环，不能当按钮。可感知的点击、悬停、键盘请绑在 RsButton 上。"
    description-en="RsIcon has no component events. A native click can fall through to the svg, but there is no focus ring — do not treat it as a button. Bind click, hover, and keyboard on RsButton."
    :code="eventsCode"
  >
    <div class="row">
      <span class="item">
        <RsIcon name="bell" :label="copy.notify" />
        <code>RsIcon</code>
      </span>
      <RsButton icon="plus" @click="onCreate">{{ copy.newChat }}</RsButton>
      <RsButton icon="search" icon-only :tooltip="copy.search" @click="onSearch" />
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="没有 defineExpose，也没有插槽。改图形走 name / spin props。点查看 ref，expose 键应是 none。"
    description-en="No defineExpose and no slots. Change the glyph with name / spin props. Inspect the ref — expose keys should be none."
    :code="methodsCode"
  >
    <div class="row">
      <span class="item">
        <RsIcon ref="iconRef" name="bell" :label="copy.notify" />
        <code>RsIcon</code>
      </span>
      <RsButton variant="default" @click="inspectIconRef">{{ copy.inspect }}</RsButton>
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

.row + .row {
  margin-top: 0.75rem;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  color: var(--rs-text);
  font-size: var(--rs-font-size-xs);
}

.inherit,
.inline {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
}

.inherit {
  color: var(--rs-primary);
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
