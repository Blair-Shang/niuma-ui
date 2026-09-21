<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsAnchor, RsButton, type RsAnchorExpose, type RsAnchorItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const basicBox = ref<HTMLElement | null>(null)
const lineBox = ref<HTMLElement | null>(null)
const horizBox = ref<HTMLElement | null>(null)
const offsetBox = ref<HTMLElement | null>(null)
const slotBox = ref<HTMLElement | null>(null)
const eventBox = ref<HTMLElement | null>(null)
const methodBox = ref<HTMLElement | null>(null)
const methodRef = ref<RsAnchorExpose | null>(null)
const eventHref = ref('')
const lastAction = ref('')
const methodLog = ref('')

const { copy } = useSiteDemo({
  'en-US': {
    basic: 'Basic',
    nested: 'Nested',
    child: 'Child',
    bodyBasic: 'Scroll or click. The ink follows the current heading.',
    bodyNested: 'children indent one level. Use them for API / Token subsections.',
    bodyChild: 'When the workbench pane is not window, pass that scroller to getContainer.',
    darkSurface: 'Dark surface — rail and ink follow data-rs-theme, do not hard-code color',
    lineless: 'Lineless',
    bodyLine: 'The same items without a rail. The active row uses a light wash.',
    overview: 'Overview',
    install: 'Install',
    usage: 'Usage',
    bodyH: 'direction="horizontal" puts the rail on top. Keep titles short.',
    offsetHint: 'offset=24, targetOffset=8, affixOffset=8. The heading stops a little below the top.',
    slotHint: '#item can prefix a mark. The row is still a native a[href].',
    idle: 'No event yet. click / change log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toOverview: 'scrollTo(#anchor-fn-a)',
    toUsage: 'scrollTo(#anchor-fn-c)',
    methodIdle: 'Call scrollTo(href). There is no setValue() on the ref.',
    methodHit: (href: string) => `scrollTo(${href})`,
    disabled: 'Deprecated',
    bodyDisabled: 'disabled still emits click, but does not scroll or change the active href.',
  },
  'zh-CN': {
    basic: '基本用法',
    nested: '嵌套',
    child: '子标题',
    bodyBasic: '滚动或点击目录，墨点会跟到当前标题。',
    bodyNested: 'children 会缩进一级，适合 API / Token 等子节。',
    bodyChild: '工作台主栏不是 window 时，把滚动容器交给 getContainer。',
    darkSurface: '深色表面 — 轨道和墨点跟 data-rs-theme，不要写死颜色',
    lineless: '无轨道',
    bodyLine: '同一套 items，关闭墨点轨道。激活项用浅底。',
    overview: '概述',
    install: '安装',
    usage: '用法',
    bodyH: 'direction="horizontal" 把轨道放在上方。标题宜短。',
    offsetHint: 'offset=24，targetOffset=8，affixOffset=8。标题会停在距顶稍下的位置。',
    slotHint: '#item 可以加标记。这一行仍是原生 a[href]。',
    idle: '还没有事件。click / change 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    toOverview: 'scrollTo(#anchor-fn-a)',
    toUsage: 'scrollTo(#anchor-fn-c)',
    methodIdle: '调用 scrollTo(href)。ref 上没有 setValue()。',
    methodHit: (href: string) => `scrollTo(${href})`,
    disabled: '已废弃',
    bodyDisabled: '禁用项仍发 click，但不滚动、不改激活。',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-demo-basic', title: copy.value.basic },
  {
    href: '#anchor-demo-nested',
    title: copy.value.nested,
    children: [{ href: '#anchor-demo-child', title: copy.value.child }],
  },
])

const lineItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-line-basic', title: copy.value.lineless },
  {
    href: '#anchor-line-nested',
    title: copy.value.nested,
    children: [{ href: '#anchor-line-child', title: copy.value.child }],
  },
])

const horizItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-h-a', title: copy.value.overview },
  { href: '#anchor-h-b', title: copy.value.install },
  { href: '#anchor-h-c', title: copy.value.usage },
])

const offsetItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-off-a', title: copy.value.overview },
  { href: '#anchor-off-b', title: copy.value.usage },
])

const slotItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-slot-a', title: copy.value.overview },
  { href: '#anchor-slot-b', title: copy.value.usage, disabled: true },
])

const eventItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-ev-a', title: copy.value.overview },
  { href: '#anchor-ev-b', title: copy.value.usage },
])

const methodItems = computed<RsAnchorItem[]>(() => [
  { href: '#anchor-fn-a', title: copy.value.overview },
  { href: '#anchor-fn-b', title: copy.value.install },
  { href: '#anchor-fn-c', title: copy.value.usage },
])

const basicCode = `<RsAnchor
  :items="items"
  :change-hash="false"
  :get-container="() => scroller"
/>`

const linelessCode = `<RsAnchor
  :items="items"
  lineless
  :change-hash="false"
  :get-container="() => scroller"
/>`

const horizontalCode = `<RsAnchor
  direction="horizontal"
  :items="items"
  :change-hash="false"
  :get-container="() => scroller"
/>`

const offsetCode = `<RsAnchor
  :items="items"
  :offset="24"
  :target-offset="8"
  :affix-offset="8"
  :change-hash="false"
  :get-container="() => scroller"
/>`

const slotsCode = `<RsAnchor :items="items" :change-hash="false">
  <template #item="{ item, active }">
    {{ active ? '●' : '○' }} {{ item.title }}
  </template>
</RsAnchor>`

const eventsCode = `<RsAnchor
  v-model="href"
  :items="items"
  :change-hash="false"
  @click="onClick"
  @change="onChange"
/>`

const methodsCode = `const toc = ref<RsAnchorExpose>()
toc.value?.scrollTo('#usage')

<RsAnchor ref="toc" :items="items" :change-hash="false" />`

function log(name: string, detail: string) {
  lastAction.value = copy.value.changeHit(name, detail)
}

function runScrollTo(href: string) {
  methodRef.value?.scrollTo(href)
  methodLog.value = copy.value.methodHit(href)
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    title-en="Basic"
    description="传入章节 items。Hash 路由必须关闭 change-hash，否则会覆盖当前路由。滚动容器不是 window 时交给 getContainer。"
    description-en="Pass section items. Hash routers must turn change-hash off or the current route is overwritten. Pass getContainer when the scroller is not window."
    :code="basicCode"
  >
    <div class="demo">
      <RsAnchor :items="basicItems" :change-hash="false" :get-container="() => basicBox" />
      <div ref="basicBox" class="demo__scroller">
        <section id="anchor-demo-basic">
          <h3>{{ copy.basic }}</h3>
          <p>{{ copy.bodyBasic }}</p>
        </section>
        <section id="anchor-demo-nested">
          <h3>{{ copy.nested }}</h3>
          <p>{{ copy.bodyNested }}</p>
        </section>
        <section id="anchor-demo-child">
          <h3>{{ copy.child }}</h3>
          <p>{{ copy.bodyChild }}</p>
        </section>
      </div>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <div class="demo">
          <RsAnchor :items="basicItems" :change-hash="false" :get-container="() => basicBox" />
          <p class="hint">{{ copy.darkSurface }}</p>
        </div>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-lineless"
    title="无轨道"
    title-en="Lineless"
    description="lineless 只高亮文字，适合空间更紧的侧栏。"
    description-en="lineless highlights text only. Use it in a tight side column."
    :code="linelessCode"
  >
    <div class="demo">
      <RsAnchor
        :items="lineItems"
        lineless
        :change-hash="false"
        :get-container="() => lineBox"
      />
      <div ref="lineBox" class="demo__scroller">
        <section id="anchor-line-basic">
          <h3>{{ copy.lineless }}</h3>
          <p>{{ copy.bodyLine }}</p>
        </section>
        <section id="anchor-line-nested">
          <h3>{{ copy.nested }}</h3>
          <p>{{ copy.bodyNested }}</p>
        </section>
        <section id="anchor-line-child">
          <h3>{{ copy.child }}</h3>
          <p>{{ copy.bodyChild }}</p>
        </section>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-horizontal"
    title="横向"
    title-en="Horizontal"
    description="direction=horizontal 把轨道放到上方，适合文档顶栏。"
    description-en="direction=horizontal puts the rail on top. Typical for a doc header."
    :code="horizontalCode"
  >
    <div class="stack">
      <RsAnchor
        direction="horizontal"
        :items="horizItems"
        :change-hash="false"
        :get-container="() => horizBox"
      />
      <div ref="horizBox" class="demo__scroller demo__scroller--short">
        <section id="anchor-h-a">
          <h3>{{ copy.overview }}</h3>
          <p>{{ copy.bodyH }}</p>
        </section>
        <section id="anchor-h-b">
          <h3>{{ copy.install }}</h3>
          <p>{{ copy.bodyH }}</p>
        </section>
        <section id="anchor-h-c">
          <h3>{{ copy.usage }}</h3>
          <p>{{ copy.bodyH }}</p>
        </section>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-offset"
    title="偏移与吸附"
    title-en="Offset and affix"
    description="offset 判定已滚过，targetOffset 是点完后标题距顶的距离，affixOffset 是 sticky 顶距。"
    description-en="offset decides a heading has been passed. targetOffset is the gap after a click. affixOffset is the sticky top."
    :code="offsetCode"
  >
    <div class="demo">
      <RsAnchor
        :items="offsetItems"
        :offset="24"
        :target-offset="8"
        :affix-offset="8"
        :change-hash="false"
        :get-container="() => offsetBox"
      />
      <div ref="offsetBox" class="demo__scroller">
        <section id="anchor-off-a">
          <h3>{{ copy.overview }}</h3>
          <p>{{ copy.offsetHint }}</p>
        </section>
        <section id="anchor-off-b">
          <h3>{{ copy.usage }}</h3>
          <p>{{ copy.offsetHint }}</p>
        </section>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="#item 自定义一条标题。disabled 仍发 click，但不滚动。"
    description-en="#item customizes a row title. disabled still emits click but does not scroll."
    :code="slotsCode"
  >
    <div class="demo">
      <RsAnchor :items="slotItems" :change-hash="false" :get-container="() => slotBox">
        <template #item="{ item, active }">
          {{ active ? '●' : '○' }} {{ item.title }}
        </template>
      </RsAnchor>
      <div ref="slotBox" class="demo__scroller demo__scroller--short">
        <section id="anchor-slot-a">
          <h3>{{ copy.overview }}</h3>
          <p>{{ copy.slotHint }}</p>
        </section>
        <section id="anchor-slot-b">
          <h3>{{ copy.disabled }}</h3>
          <p>{{ copy.bodyDisabled }}</p>
        </section>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="可感知的是 click 与 change。v-model 同步激活 href。"
    description-en="The events you can feel are click and change. v-model keeps the active href."
    :code="eventsCode"
  >
    <div class="demo">
      <RsAnchor
        v-model="eventHref"
        :items="eventItems"
        :change-hash="false"
        :get-container="() => eventBox"
        @click="(href) => log('click', href)"
        @change="(href) => log('change', href)"
      />
      <div ref="eventBox" class="demo__scroller demo__scroller--short">
        <section id="anchor-ev-a">
          <h3>{{ copy.overview }}</h3>
          <p>{{ copy.bodyBasic }}</p>
        </section>
        <section id="anchor-ev-b">
          <h3>{{ copy.usage }}</h3>
          <p>{{ copy.bodyBasic }}</p>
        </section>
      </div>
    </div>
    <p class="event-log" :data-live="lastAction ? '1' : undefined">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="宿主可调 scrollTo(href)。模板 ref 用 RsAnchorExpose。"
    description-en="Hosts can call scrollTo(href). Type the template ref as RsAnchorExpose."
    :code="methodsCode"
  >
    <div class="row">
      <RsButton variant="default" @click="runScrollTo('#anchor-fn-a')">{{ copy.toOverview }}</RsButton>
      <RsButton variant="default" @click="runScrollTo('#anchor-fn-c')">{{ copy.toUsage }}</RsButton>
    </div>
    <div class="demo">
      <RsAnchor
        ref="methodRef"
        :items="methodItems"
        :change-hash="false"
        :get-container="() => methodBox"
      />
      <div ref="methodBox" class="demo__scroller demo__scroller--short">
        <section id="anchor-fn-a">
          <h3>{{ copy.overview }}</h3>
          <p>{{ copy.methodIdle }}</p>
        </section>
        <section id="anchor-fn-b">
          <h3>{{ copy.install }}</h3>
          <p>{{ copy.bodyH }}</p>
        </section>
        <section id="anchor-fn-c">
          <h3>{{ copy.usage }}</h3>
          <p>{{ copy.methodIdle }}</p>
        </section>
      </div>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.demo {
  display: grid;
  grid-template-columns: 9.5rem 1fr;
  gap: var(--rs-space-lg);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-block-end: var(--rs-space-md);
}

.demo__scroller {
  max-height: 16rem;
  overflow: auto;
  padding-inline: var(--rs-space-md);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

.demo__scroller--short {
  max-height: 12rem;
}

.demo__scroller section {
  min-height: 8.5rem;
  padding-block: var(--rs-space-lg);
  border-bottom: 1px solid var(--rs-border-subtle);
}

.demo__scroller h3 {
  margin: 0 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text-primary);
}

.demo__scroller p {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.6;
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

.hint {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: 1.4;
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
