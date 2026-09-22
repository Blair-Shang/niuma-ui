<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RsButton,
  RsDivider,
  RsIcon,
  RsInput,
  RsToolbar,
  type RsToolbarExpose,
  type RsToolbarSize,
} from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const running = ref(false)
const filterText = ref('')
const mode = ref<'shell' | 'pipeline'>('shell')
const lastAction = ref('')
const methodLog = ref('')
const methodRef = ref<RsToolbarExpose | null>(null)
const sizes: RsToolbarSize[] = ['ssm', 'sm', 'md', 'lg']

const { copy } = useSiteDemo({
  'en-US': {
    identity: 'prod / orders',
    schema: 'public',
    format: 'Format',
    explain: 'Explain',
    run: 'Run',
    cancel: 'Cancel',
    result: 'Result pane',
    shell: 'Shell',
    pipeline: 'Pipeline',
    remote: 'REMOTE',
    pathPh: '/var/www/html',
    refresh: 'Refresh',
    create: 'New',
    more: 'More',
    darkSurface: 'Dark surface — chrome follows data-rs-theme, do not hard-code color',
    wrapHint: 'Long labels wrap instead of clipping.',
    stickyHint: 'Scroll the pane. The bar stays at the top.',
    stickyBody: 'Scrollable body',
    disabledHint: 'The whole bar is inert. Buttons do not receive clicks.',
    idle: 'RsToolbar emits nothing. Bind click on a slotted RsButton.',
    clickHit: (name: string) => `click → ${name}`,
    inspect: 'Inspect ref',
    focus: 'focus()',
    blur: 'blur()',
    methodIdle: 'Call focus() / blur(). There is no setValue() on the ref.',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodNone: 'expose keys: none',
  },
  'zh-CN': {
    identity: 'prod / orders',
    schema: 'public',
    format: '格式化',
    explain: 'Explain',
    run: '运行',
    cancel: '取消',
    result: '结果区',
    shell: 'Shell',
    pipeline: 'Pipeline',
    remote: 'REMOTE',
    pathPh: '/var/www/html',
    refresh: '刷新',
    create: '新建',
    more: '更多',
    darkSurface: '深色表面 — 顶栏跟 data-rs-theme，不要写死颜色',
    wrapHint: '长文案换行，不再裁切。',
    stickyHint: '滚动面板，顶栏贴在顶部。',
    stickyBody: '可滚动内容',
    disabledHint: '整栏 inert。按钮点不了。',
    idle: 'RsToolbar 不发事件。点击绑在插槽里的 RsButton。',
    clickHit: (name: string) => `click → ${name}`,
    inspect: '查看 ref',
    focus: 'focus()',
    blur: 'blur()',
    methodIdle: '调用 focus() / blur()。ref 上没有 setValue()。',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodNone: 'expose 键：none',
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

function onAction(name: string) {
  lastAction.value = copy.value.clickHit(name)
}

function toggleRun() {
  running.value = !running.value
  onAction(running.value ? copy.value.cancel : copy.value.run)
}

function inspectToolbar() {
  const inst = methodRef.value as unknown as Record<string, unknown> | null
  const keys = inst
    ? Object.keys(inst).filter((key) => !key.startsWith('_') && !key.startsWith('$'))
    : []
  methodLog.value = keys.length ? keys.join(', ') : copy.value.methodNone
}

function callFocus() {
  methodRef.value?.focus()
  const active = document.activeElement
  const label = active instanceof HTMLElement ? active.textContent?.trim() || active.tagName : 'none'
  methodLog.value = copy.value.methodHit('focus()', label)
}

function callBlur() {
  methodRef.value?.blur()
  methodLog.value = copy.value.methodHit('blur()', 'done')
}

const basicCode = `<RsToolbar aria-label="Query toolbar" elevated>
  <template #start>
    <RsIcon name="database" :size="15" />
    <span>prod / orders</span>
  </template>
  <template #end>
    <RsButton variant="ghost" size="sm">Format</RsButton>
    <RsButton variant="primary" size="sm">Run</RsButton>
  </template>
</RsToolbar>`

const regionsCode = `<RsToolbar aria-label="Mongo query">
  <template #start>demo.users</template>
  <template #center><!-- optically centered --></template>
  <template #end>
    <RsButton variant="primary" size="sm">Run</RsButton>
  </template>
</RsToolbar>`

const filterCode = `<RsToolbar size="sm" compact>
  <span>REMOTE</span>
  <RsInput v-model="path" size="sm" placeholder="/var/www/html" />
  <RsButton variant="ghost" size="sm" aria-label="Refresh" />
</RsToolbar>`

const sizeCode = `<RsToolbar size="ssm" />
<RsToolbar size="sm" />
<RsToolbar />
<RsToolbar size="lg" />`

const borderCode = `<RsToolbar border="bottom" />
<RsToolbar border="top" />
<RsToolbar border="both" elevated />
<RsToolbar border="none" />`

const verticalCode = `<RsToolbar orientation="vertical" aria-label="Side actions">
  <template #start>
    <RsButton variant="ghost" size="sm">Format</RsButton>
  </template>
  <template #end>
    <RsButton variant="primary" size="sm">Run</RsButton>
  </template>
</RsToolbar>`

const wrapCode = `<RsToolbar wrap>
  <template #start>A long identity that should wrap</template>
  <template #end>
    <RsButton size="sm">More</RsButton>
  </template>
</RsToolbar>`

const stickyCode = `<RsToolbar sticky :sticky-offset="0" elevated>
  <template #end>
    <RsButton size="sm">Refresh</RsButton>
  </template>
</RsToolbar>`

const disabledCode = `<RsToolbar disabled>
  <template #end>
    <RsButton size="sm">New</RsButton>
  </template>
</RsToolbar>`

const eventsCode = `<RsToolbar>
  <template #end>
    <RsButton size="sm" @click="onAction('Refresh')">Refresh</RsButton>
  </template>
</RsToolbar>
<!-- RsToolbar has no defineEmits -->`

const methodsCode = `const bar = ref<RsToolbarExpose>()
bar.value?.focus()
bar.value?.blur()`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="查询顶栏"
    title-en="Query bar"
    description="身份在 start，命令按内容宽度贴在 end。标题过长才裁切，不和按钮对半切。"
    description-en="Identity sits in start. Commands stay content-sized on end. The title clips only when it actually runs out of room."
    :code="basicCode"
  >
    <div class="frame">
      <RsToolbar aria-label="Query toolbar" elevated>
        <template #start>
          <RsIcon class="mark" name="database" :size="15" />
          <span class="id">{{ copy.identity }}</span>
          <span class="meta-chip">{{ copy.schema }}</span>
        </template>
        <template #end>
          <RsButton variant="ghost" size="sm" @click="onAction(copy.format)">
            {{ copy.format }}
          </RsButton>
          <RsButton variant="primary" size="sm" @click="toggleRun">
            {{ running ? copy.cancel : copy.run }}
          </RsButton>
        </template>
      </RsToolbar>
      <div class="body">{{ copy.result }}</div>
    </div>
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.darkSurface }}</figcaption>
      <div class="frame" data-rs-theme="dark">
        <RsToolbar elevated>
          <template #start>
            <RsIcon class="mark" name="database" :size="15" />
            <span class="id">{{ copy.identity }}</span>
            <span class="meta-chip">{{ copy.schema }}</span>
          </template>
          <template #end>
            <RsButton variant="primary" size="sm">{{ copy.run }}</RsButton>
          </template>
        </RsToolbar>
        <div class="body">{{ copy.result }}</div>
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-regions"
    title="三区"
    title-en="Three regions"
    description="只要有 #center 就是 1fr / auto / 1fr。缺一侧也占列，中间仍在正中。"
    description-en="With #center the row is 1fr / auto / 1fr. A missing side still occupies a column, so the middle stays centered."
    :code="regionsCode"
  >
    <div class="frame">
      <RsToolbar aria-label="Mongo query">
        <template #start>
          <RsIcon class="mark" name="database" :size="14" />
          <span class="mono">demo</span>
          <span class="dot">.</span>
          <span class="mono">users</span>
        </template>
        <template #center>
          <div class="seg" role="tablist">
            <button
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': mode === 'shell' }"
              @click="mode = 'shell'"
            >
              {{ copy.shell }}
            </button>
            <button
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': mode === 'pipeline' }"
              @click="mode = 'pipeline'"
            >
              {{ copy.pipeline }}
            </button>
          </div>
        </template>
        <template #end>
          <RsButton variant="ghost" size="sm">{{ copy.format }}</RsButton>
          <RsDivider orientation="vertical" />
          <RsButton variant="primary" size="sm">{{ copy.run }}</RsButton>
        </template>
      </RsToolbar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-filter"
    title="筛选条"
    title-en="Filter bar"
    description="默认插槽落在 start。输入框仍是独立 Tab 停，方向键不抢走光标。"
    description-en="The default slot lands in start. The input stays its own tab stop; arrows do not steal the caret."
    :code="filterCode"
  >
    <div class="frame">
      <RsToolbar size="sm" compact>
        <span class="label">{{ copy.remote }}</span>
        <RsInput v-model="filterText" size="sm" class="path" :placeholder="copy.pathPh" />
        <RsButton variant="ghost" size="sm" :aria-label="copy.refresh">
          <RsIcon name="refresh-cw" :size="13" />
        </RsButton>
      </RsToolbar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-size"
    title="密度"
    title-en="Density"
    description="四档：ssm 28 / sm 32 / md 40 / lg 48，对齐常见工作台顶栏。未传跟 ConfigProvider。"
    description-en="Four sizes: ssm 28 / sm 32 / md 40 / lg 48, matching common workbench chrome. Follows ConfigProvider when omitted."
    :code="sizeCode"
  >
    <div class="stack">
      <div v-for="size in sizes" :key="size" class="frame">
        <RsToolbar :size="size" :aria-label="`size=${size}`">
          <template #start>
            <span class="meta">size={{ size }}</span>
          </template>
          <template #end>
            <RsButton variant="ghost" size="sm">{{ copy.refresh }}</RsButton>
          </template>
        </RsToolbar>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-border"
    title="分割线与底色"
    title-en="Border and surface"
    description="border 控制分割线。elevated 换抬升底。不要写死 hex。"
    description-en="border paints the hairline. elevated swaps the surface. Do not hard-code hex."
    :code="borderCode"
  >
    <div class="stack">
      <div v-for="border in ['bottom', 'top', 'both', 'none'] as const" :key="border" class="frame">
        <RsToolbar :border="border" :elevated="border === 'both'">
          <template #start>
            <span class="meta">border={{ border }}{{ border === 'both' ? ' · elevated' : '' }}</span>
          </template>
          <template #end>
            <RsButton variant="ghost" size="sm">{{ copy.more }}</RsButton>
          </template>
        </RsToolbar>
        <div class="body body--tight">{{ copy.result }}</div>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-vertical"
    title="竖排"
    title-en="Vertical"
    description="竖排时 start 在上、end 贴底，栏宽跟最宽的一项。分割线映射到 inline 边。"
    description-en="Vertical pins start to the top and end to the bottom. The rail width follows the widest control. The hairline maps to the inline edges."
    :code="verticalCode"
  >
    <div class="frame frame--rail">
      <RsToolbar orientation="vertical" aria-label="Side actions">
        <template #start>
          <RsButton variant="ghost" size="sm">{{ copy.format }}</RsButton>
          <RsButton variant="ghost" size="sm">{{ copy.explain }}</RsButton>
        </template>
        <template #end>
          <RsButton variant="primary" size="sm">{{ copy.run }}</RsButton>
        </template>
      </RsToolbar>
      <div class="body">{{ copy.result }}</div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-wrap"
    title="换行"
    title-en="Wrap"
    description="默认 start 区 overflow hidden。长文案传 wrap。"
    description-en="The start region clips by default. Pass wrap for long labels."
    :code="wrapCode"
  >
    <p class="hint">{{ copy.wrapHint }}</p>
    <div class="frame frame--narrow">
      <RsToolbar wrap>
        <template #start>
          <span class="wrap-id">
            prod / analytics / public / fact_orders_daily_by_region
          </span>
        </template>
        <template #end>
          <RsButton variant="ghost" size="sm">{{ copy.more }}</RsButton>
        </template>
      </RsToolbar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-sticky"
    title="吸附"
    title-en="Sticky"
    description="sticky 相对最近滚动祖先。偏移写 stickyOffset，不要自己写 position。"
    description-en="sticky is relative to the nearest scroll ancestor. Pass stickyOffset. Do not set position yourself."
    :code="stickyCode"
  >
    <p class="hint">{{ copy.stickyHint }}</p>
    <div class="scroller">
      <RsToolbar sticky elevated>
        <template #start>
          <span class="id">{{ copy.identity }}</span>
        </template>
        <template #end>
          <RsButton variant="ghost" size="sm">{{ copy.refresh }}</RsButton>
        </template>
      </RsToolbar>
      <div v-for="n in 8" :key="n" class="body">{{ copy.stickyBody }} {{ n }}</div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 给整栏加 inert 与 aria-disabled。"
    description-en="disabled sets inert and aria-disabled on the whole bar."
    :code="disabledCode"
  >
    <p class="hint">{{ copy.disabledHint }}</p>
    <div class="frame">
      <RsToolbar disabled>
        <template #start>
          <span class="id">{{ copy.identity }}</span>
        </template>
        <template #end>
          <RsButton variant="primary" size="sm">{{ copy.create }}</RsButton>
        </template>
      </RsToolbar>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="没有 defineEmits。点顶栏本身无回调；点按钮才有 click。"
    description-en="No defineEmits. A click on the chrome does nothing. A slotted button logs click."
    :code="eventsCode"
  >
    <div class="frame">
      <RsToolbar>
        <template #end>
          <RsButton variant="ghost" size="sm" @click="onAction(copy.refresh)">
            {{ copy.refresh }}
          </RsButton>
          <RsButton variant="primary" size="sm" @click="onAction(copy.create)">
            {{ copy.create }}
          </RsButton>
        </template>
      </RsToolbar>
    </div>
    <p class="log">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="expose 只有 focus / blur。没有 setValue。"
    description-en="The only expose keys are focus / blur. There is no setValue()."
    :code="methodsCode"
  >
    <div class="row">
      <RsButton size="sm" @click="callFocus">{{ copy.focus }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="callBlur">{{ copy.blur }}</RsButton>
      <RsButton size="sm" variant="ghost" @click="inspectToolbar">{{ copy.inspect }}</RsButton>
    </div>
    <div class="frame">
      <RsToolbar ref="methodRef" aria-label="Methods toolbar">
        <template #end>
          <RsButton variant="ghost" size="sm">{{ copy.format }}</RsButton>
          <RsButton variant="primary" size="sm">{{ copy.run }}</RsButton>
        </template>
      </RsToolbar>
    </div>
    <p class="log">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.frame {
  overflow: hidden;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-bg);
}

.frame--rail {
  display: flex;
  align-items: stretch;
  min-height: 12rem;
}

.frame--narrow {
  max-width: 18rem;
}

.body {
  padding: 1.25rem;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.body--tight {
  padding: 0.5rem 0.75rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
  margin-block-end: var(--rs-space-sm);
}

.mark {
  color: var(--rs-text-secondary);
  flex-shrink: 0;
}

.id {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--rs-font-weight-medium);
}

.meta-chip {
  flex-shrink: 0;
  padding-block: 0;
  padding-inline: var(--rs-space-xs);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-xs);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.seg {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  background: color-mix(in srgb, var(--rs-surface-hover) 55%, var(--rs-surface));
}

.seg__btn {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  border: 0;
  border-radius: calc(var(--rs-radius-sm) - 2px);
  background: transparent;
  color: var(--rs-text-secondary);
  font: inherit;
  font-size: var(--rs-font-size-xs);
  line-height: 1;
  cursor: pointer;
}

.seg__btn--on {
  background: var(--rs-surface-elevated);
  color: var(--rs-text-primary);
  box-shadow: var(--rs-shadow-sm);
}

.wrap-id {
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  white-space: normal;
}

.mono {
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-sm);
}

.dot {
  color: var(--rs-text-secondary);
}

.label {
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--rs-text-secondary);
  flex-shrink: 0;
}

.path {
  flex: 1;
  min-width: 0;
}

.meta {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}

.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}

.log {
  margin: 0.75rem 0 0;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text-secondary);
}

.canvas {
  margin: 1rem 0 0;
  padding: 0;
  border: 0;
}

.canvas__caption {
  margin: 0 0 0.5rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}

.scroller {
  max-height: 10rem;
  overflow: auto;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
}
</style>
