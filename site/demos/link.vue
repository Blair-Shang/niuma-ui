<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsLink } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const lastAction = ref('')

const { copy: label } = useSiteDemo({
  'en-US': {
    docs: 'Read the guide',
    button: 'Button docs',
    vue: 'Vue website',
    hover: 'Underline on hover',
    always: 'Always underlined',
    none: 'No underline',
    tonePrimary: 'Primary',
    toneNeutral: 'Neutral',
    toneSuccess: 'Success',
    toneWarning: 'Warning',
    toneDanger: 'Danger',
    toneInfo: 'Info',
    download: 'Download',
    external: 'External docs',
    enabled: 'Available',
    disabled: 'Unavailable',
    inheritXs: 'Same link in xs copy.',
    inheritLg: 'Same link in large copy.',
    darkSurface: 'Dark surface — link keeps theme tokens, do not hard-code color',
    composeLead: 'See the',
    composeTail: 'for shape and tone.',
    composeButton: 'Toolbar action',
    idle: 'No click yet. The event is native @click on the <a>.',
    guideHit: 'click → Read the guide',
  },
  'zh-CN': {
    docs: '阅读指南',
    button: 'Button 文档',
    vue: 'Vue 官网',
    hover: '悬停显示下划线',
    always: '始终下划线',
    none: '无下划线',
    tonePrimary: '主色',
    toneNeutral: '中性',
    toneSuccess: '成功',
    toneWarning: '警告',
    toneDanger: '危险',
    toneInfo: '信息',
    download: '下载',
    external: '外部文档',
    enabled: '可用',
    disabled: '不可用',
    inheritXs: '同一条链接，放在 xs 正文里。',
    inheritLg: '同一条链接，放在大号正文里。',
    darkSurface: '深色表面 — 链接跟主题 token，不要写死颜色',
    composeLead: '参见',
    composeTail: '的形态与语义色。',
    composeButton: '工具栏动作',
    idle: '还没有点击。事件就是 <a> 上的原生 @click。',
    guideHit: 'click → 阅读指南',
  },
})

const eventLog = computed(() => lastAction.value || label.value.idle)

function onGuide(event: MouseEvent) {
  event.preventDefault()
  lastAction.value = label.value.guideHit
}

const basicCode = `<RsLink href="#/guide/introduce">Read the guide</RsLink>
<RsLink href="https://vuejs.org" target="_blank" icon="external-link">
  Vue website
</RsLink>`

const underlineCode = `<RsLink href="#/guide/introduce" underline="hover">Hover</RsLink>
<RsLink href="#/guide/introduce" underline="always">Always</RsLink>
<RsLink href="#/guide/introduce" underline="none">None</RsLink>`

const toneCode = `<RsLink href="#/guide/introduce">Primary</RsLink>
<RsLink href="#/guide/introduce" tone="danger">Danger</RsLink>
<RsLink href="#/guide/introduce" tone="neutral">Neutral</RsLink>`

const iconCode = `<RsLink href="#/guide/introduce" icon="book-open">Read the guide</RsLink>
<RsLink href="https://vuejs.org" target="_blank" icon="external-link">
  Vue website
</RsLink>`

const disabledCode = `<RsLink href="#/guide/introduce">Available</RsLink>
<RsLink href="#/guide/introduce" disabled>Unavailable</RsLink>`

const inheritCode = `<p style="font-size: var(--rs-font-size-xs)">
  <RsLink href="#/guide/introduce">Read the guide</RsLink>
</p>
<p style="font-size: var(--rs-font-size-lg)">
  <RsLink href="#/guide/introduce">Read the guide</RsLink>
</p>`

const eventsCode = `<RsLink href="#/guide/introduce" @click.prevent="onGuide">
  Read the guide
</RsLink>
<RsLink href="#/guide/introduce" disabled>Unavailable</RsLink>`

const composeCode = `<p>See the <RsLink href="#/components/button">Button docs</RsLink>.</p>
<RsButton variant="link">Toolbar action</RsButton>`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="段落里的导航用 RsLink。外链加 target=&quot;_blank&quot;，组件会补 noopener noreferrer。按钮形态请用 RsButton variant=&quot;link&quot;。"
    description-en="Use RsLink for navigation inside prose. External links take target=&quot;_blank&quot;; the component adds noopener noreferrer. Button-shaped navigation belongs on RsButton variant=&quot;link&quot;."
    :code="basicCode"
  >
    <div class="row">
      <RsLink href="#/guide/introduce">{{ label.docs }}</RsLink>
      <RsLink href="#/components/button">{{ label.button }}</RsLink>
      <RsLink href="https://vuejs.org" target="_blank" icon="external-link">{{ label.vue }}</RsLink>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ label.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsLink href="#/guide/introduce">{{ label.docs }}</RsLink>
        <RsLink href="https://vuejs.org" target="_blank" icon="external-link">{{ label.vue }}</RsLink>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-underline"
    title="下划线"
    title-en="Underline"
    description="默认 hover：静止无下划线，悬停与键盘焦点时出现。正文里要一直能看出是链接时用 always。"
    description-en="Default is hover: no underline at rest, underline on hover and keyboard focus. Use always when the link must stay obvious in a paragraph."
    :code="underlineCode"
  >
    <div class="row">
      <RsLink href="#/guide/introduce" underline="hover">{{ label.hover }}</RsLink>
      <RsLink href="#/guide/introduce" underline="always">{{ label.always }}</RsLink>
      <RsLink href="#/guide/introduce" underline="none">{{ label.none }}</RsLink>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-tone"
    title="语义色"
    title-en="Tone"
    description="tone 只改色相。默认 primary。不要用业务 CSS 改颜色。"
    description-en="tone changes hue only. Default is primary. Do not restyle color in product CSS."
    :code="toneCode"
  >
    <div class="row">
      <RsLink href="#/guide/introduce" tone="primary">{{ label.tonePrimary }}</RsLink>
      <RsLink href="#/guide/introduce" tone="neutral">{{ label.toneNeutral }}</RsLink>
      <RsLink href="#/guide/introduce" tone="success">{{ label.toneSuccess }}</RsLink>
      <RsLink href="#/guide/introduce" tone="warning">{{ label.toneWarning }}</RsLink>
      <RsLink href="#/guide/introduce" tone="danger">{{ label.toneDanger }}</RsLink>
      <RsLink href="#/guide/introduce" tone="info">{{ label.toneInfo }}</RsLink>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-inherit"
    title="跟正文"
    title-en="Follows text"
    description="没有 size / theme prop。字号 inherit；颜色跟 data-rs-theme 与 --rs-primary。控件四档请用 RsButton。"
    description-en="There is no size or theme prop. Font-size inherits. Color follows data-rs-theme and --rs-primary. Control sizes belong on RsButton."
    :code="inheritCode"
  >
    <p class="prose prose--xs">
      {{ label.inheritXs }}
      <RsLink href="#/guide/introduce">{{ label.docs }}</RsLink>
    </p>
    <p class="prose prose--lg">
      {{ label.inheritLg }}
      <RsLink href="#/guide/introduce">{{ label.docs }}</RsLink>
    </p>
  </DocDemo>

  <DocDemo
    id="demo-icon"
    title="图标"
    title-en="Icons"
    description="icon 是装饰前缀，名称走默认插槽。外链用 external-link，不要另写一套箭头。"
    description-en="icon is a decorative prefix; the accessible name is the default slot. Use external-link for outbound URLs. Do not draw a custom arrow."
    :code="iconCode"
  >
    <div class="row">
      <RsLink href="#/guide/introduce" icon="book-open">{{ label.docs }}</RsLink>
      <RsLink href="#/guide/introduce" icon="download" tone="neutral">{{ label.download }}</RsLink>
      <RsLink href="https://vuejs.org" target="_blank" icon="external-link">{{ label.external }}</RsLink>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="禁用时去掉 href，并加上 aria-disabled 与 tabindex=&quot;-1&quot;。附近要写清为什么不可点。"
    description-en="Disabled links drop href and set aria-disabled plus tabindex=&quot;-1&quot;. Explain nearby why the action is unavailable."
    :code="disabledCode"
  >
    <div class="row">
      <RsLink href="#/guide/introduce">{{ label.enabled }}</RsLink>
      <RsLink href="#/guide/introduce" disabled>{{ label.disabled }}</RsLink>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="根节点是原生 &lt;a&gt;，直接绑 @click。演示用 preventDefault 留在本页。禁用链接点了日志不会变。"
    description-en="The root is a native &lt;a&gt;. Bind @click. This demo uses preventDefault so you stay on the page. Clicking the disabled link does not change the log."
    :code="eventsCode"
  >
    <div class="row">
      <RsLink href="#/guide/introduce" @click="onGuide">{{ label.docs }}</RsLink>
      <RsLink href="#/guide/introduce" disabled>{{ label.disabled }}</RsLink>
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-compose"
    title="组合"
    title-en="Composition"
    description="混在句子里的跳转用 RsLink。工具栏、表格操作等独立动作请用 RsButton variant=&quot;link&quot;。"
    description-en="Use RsLink when the navigation sits inside a sentence. Standalone actions on a toolbar or table belong on RsButton variant=&quot;link&quot;."
    :code="composeCode"
  >
    <p class="prose">
      {{ label.composeLead }}
      <RsLink href="#/components/button">{{ label.button }}</RsLink>
      {{ label.composeTail }}
    </p>
    <div class="row">
      <RsButton variant="link">{{ label.composeButton }}</RsButton>
    </div>
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

.prose {
  margin: 0 0 0.75rem;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.prose--xs {
  font-size: var(--rs-font-size-xs);
}

.prose--lg {
  margin-bottom: 0;
  font-size: var(--rs-font-size-lg);
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
</style>
