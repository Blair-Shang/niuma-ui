<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsSplitPane, type RsSplitPaneExpose, type RsSplitPaneItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const eventSizes = ref<number[]>([36, 64])
const methodSizes = ref<number[]>([30, 70])
const lastAction = ref('')
const methodLog = ref('')
const methodRef = ref<RsSplitPaneExpose | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    tree: 'Tree',
    editor: 'Editor',
    top: 'Top',
    bottom: 'Bottom',
    nav: 'Nav',
    main: 'Main',
    aside: 'Aside',
    side: 'Side',
    content: 'Content',
    search: 'Filter',
    table: 'Table',
    explorer: 'Explorer',
    terminal: 'Terminal',
    locked: 'Locked sash',
    viewer: 'Viewer',
    darkSurface: 'Dark surface — sash and grip follow data-rs-theme, do not hard-code color',
    collapsed: 'Collapsed',
    expanded: 'Open',
    idle: 'No event yet. resize-start / resize / resize-end / collapse / expand log here.',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: 'Call collapse / expand / reset / getSizes / focus.',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
  },
  'zh-CN': {
    tree: '资源树',
    editor: '编辑区',
    top: '上栏',
    bottom: '下栏',
    nav: '导航',
    main: '主栏',
    aside: '侧栏',
    side: '侧栏',
    content: '内容',
    search: '筛选',
    table: '表格',
    explorer: '资源管理器',
    terminal: '终端',
    locked: '锁定缝',
    viewer: '预览',
    darkSurface: '深色表面 — 缝和抓手跟 data-rs-theme，不要写死颜色',
    collapsed: '已折叠',
    expanded: '展开',
    idle: '还没有事件。resize-start / resize / resize-end / collapse / expand 会记在这里。',
    changeHit: (name: string, detail: string) => `${name} → ${detail}`,
    methodIdle: '调用 collapse / expand / reset / getSizes / focus。',
    methodHit: (name: string, detail: string) => `${name} → ${detail}`,
  },
})

const eventLog = computed(() => lastAction.value || copy.value.idle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicPanes = computed<RsSplitPaneItem[]>(() => [
  { key: 'left', size: 36 },
  { key: 'right', size: 64 },
])

const verticalPanes: RsSplitPaneItem[] = [
  { key: 'top', size: 60 },
  { key: 'bottom', size: 40 },
]

const constrainedPanes: RsSplitPaneItem[] = [
  { key: 'nav', size: 25, min: 15, max: 40 },
  { key: 'main', size: 50, min: 30 },
  { key: 'aside', size: 25, min: 15, max: 40 },
]

const collapsiblePanes: RsSplitPaneItem[] = [
  { key: 'side', size: 28, min: 18, collapsible: true, collapsedSize: 0 },
  { key: 'content', size: 72 },
]

const autoPanes: RsSplitPaneItem[] = [
  { key: 'search', size: 'auto' },
  { key: 'table' },
]

const fillPanes: RsSplitPaneItem[] = [
  { key: 'left', size: 32 },
  { key: 'right', size: 68 },
]

const disabledPanes: RsSplitPaneItem[] = [
  { key: 'locked', size: 40, resizable: false },
  { key: 'open', size: 60 },
]

const ideOuter: RsSplitPaneItem[] = [
  { key: 'explorer', size: 22, min: 12, collapsible: true, collapsedSize: 0 },
  { key: 'workbench', size: 78 },
]

const ideInner: RsSplitPaneItem[] = [
  { key: 'editor', size: 70, min: 30 },
  { key: 'terminal', size: 30, min: 12, collapsible: true, collapsedSize: 0 },
]

const eventPanes: RsSplitPaneItem[] = [
  { key: 'side', size: 36, min: 16, collapsible: true, collapsedSize: 0 },
  { key: 'viewer', size: 64 },
]

const methodPanes: RsSplitPaneItem[] = [
  { key: 'panel', size: 30, min: 18, collapsible: true, collapsedSize: 0 },
  { key: 'viewer', size: 70 },
]

const basicCode = `<RsSplitPane :panes="[
  { key: 'left', size: 36 },
  { key: 'right', size: 64 },
]" with-handle>
  <template #left>Tree</template>
  <template #right="{ size }">{{ Math.round(size ?? 0) }}%</template>
</RsSplitPane>`

const verticalCode = `<RsSplitPane
  orientation="vertical"
  :panes="[
    { key: 'top', size: 60 },
    { key: 'bottom', size: 40 },
  ]"
  with-handle
/>`

const constrainedCode = `<RsSplitPane :panes="[
  { key: 'nav', size: 25, min: 15, max: 40 },
  { key: 'main', size: 50, min: 30 },
  { key: 'aside', size: 25, min: 15, max: 40 },
]" />`

const collapsibleCode = `<RsSplitPane
  :panes="[
    { key: 'side', size: 28, min: 18, collapsible: true, collapsedSize: 0 },
    { key: 'content', size: 72 },
  ]"
  with-handle
/>`

const autoCode = `<RsSplitPane :panes="[
  { key: 'search', size: 'auto' },
  { key: 'table' },
]" />`

const fillCode = `<RsSplitPane fill :panes="panes">
  <template #left><div class="pane">…</div></template>
</RsSplitPane>`

const disabledCode = `<RsSplitPane disabled :panes="panes" />
<RsSplitPane :panes="[
  { key: 'locked', size: 40, resizable: false },
  { key: 'open', size: 60 },
]" />`

const nestedCode = `<RsSplitPane :panes="outer">
  <template #workbench>
    <RsSplitPane orientation="vertical" :panes="inner" />
  </template>
</RsSplitPane>`

const eventsCode = `<RsSplitPane
  v-model:sizes="sizes"
  :panes="panes"
  @resize-start="onStart"
  @resize="onResize"
  @resize-end="onEnd"
  @collapse="onCollapse"
  @expand="onExpand"
/>`

const methodsCode = `<RsSplitPane ref="splitRef" v-model:sizes="sizes" :panes="panes" />

splitRef.collapse('panel')
splitRef.expand('panel')
splitRef.reset()
splitRef.getSizes()
splitRef.focus()`

function fmtSizes(sizes: number[]): string {
  return sizes.map((n) => Math.round(n)).join(', ')
}

function onResizeStart(sizes: number[]) {
  lastAction.value = copy.value.changeHit('resize-start', fmtSizes(sizes))
}

function onResize(sizes: number[]) {
  lastAction.value = copy.value.changeHit('resize', fmtSizes(sizes))
}

function onResizeEnd(sizes: number[]) {
  lastAction.value = copy.value.changeHit('resize-end', fmtSizes(sizes))
}

function onCollapse(key: string) {
  lastAction.value = copy.value.changeHit('collapse', key)
}

function onExpand(key: string) {
  lastAction.value = copy.value.changeHit('expand', key)
}

function runCollapse() {
  methodRef.value?.collapse('panel')
  methodLog.value = copy.value.methodHit('collapse', fmtSizes(methodRef.value?.getSizes() ?? []))
}

function runExpand() {
  methodRef.value?.expand('panel')
  methodLog.value = copy.value.methodHit('expand', fmtSizes(methodRef.value?.getSizes() ?? []))
}

function runReset() {
  methodRef.value?.reset()
  methodLog.value = copy.value.methodHit('reset', fmtSizes(methodRef.value?.getSizes() ?? []))
}

function runGetSizes() {
  methodLog.value = copy.value.methodHit('getSizes', fmtSizes(methodRef.value?.getSizes() ?? []))
}

function runFocus() {
  methodRef.value?.focus()
  methodLog.value = copy.value.methodHit('focus', '0')
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="横向分割"
    title-en="Horizontal"
    description="panes 的 key 对应同名插槽。拖中缝改占比；with-handle 显示抓手，双击复位。"
    description-en="The pane key is the slot name. Drag the sash to change the ratio. with-handle shows a grip. Double-click resets."
    :code="basicCode"
  >
    <div class="frame">
      <RsSplitPane :panes="basicPanes" with-handle>
        <template #left>
          <div class="pane pane--accent">{{ copy.tree }}</div>
        </template>
        <template #right="{ size }">
          <div class="pane">{{ copy.editor }} · {{ Math.round(size ?? 0) }}%</div>
        </template>
      </RsSplitPane>
    </div>
    <div class="frame frame--dark" data-rs-theme="dark">
      <RsSplitPane :panes="basicPanes" with-handle>
        <template #left>
          <div class="pane pane--accent">{{ copy.darkSurface }}</div>
        </template>
        <template #right>
          <div class="pane">{{ copy.editor }}</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-vertical"
    title="纵向分割"
    title-en="Vertical"
    description="orientation=vertical 上下排布，拖纵向。交叉轴方向键忽略。"
    description-en="orientation=vertical stacks panes. Drag on the block axis. Cross-axis arrows are ignored."
    :code="verticalCode"
  >
    <div class="frame">
      <RsSplitPane :panes="verticalPanes" orientation="vertical" with-handle>
        <template #top>
          <div class="pane pane--accent">{{ copy.top }}</div>
        </template>
        <template #bottom>
          <div class="pane">{{ copy.bottom }}</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-constrained"
    title="多栏与约束"
    title-en="Constraints"
    description="三栏。两侧 15–40%，中栏至少 30%。一次拖只改相邻两栏。"
    description-en="Three panes. Sides 15–40%, center at least 30%. One drag moves only the two adjacent panes."
    :code="constrainedCode"
  >
    <div class="frame">
      <RsSplitPane :panes="constrainedPanes">
        <template #nav>
          <div class="pane pane--accent">{{ copy.nav }} · 15–40%</div>
        </template>
        <template #main="{ size }">
          <div class="pane">{{ copy.main }} · {{ Math.round(size ?? 0) }}%</div>
        </template>
        <template #aside>
          <div class="pane pane--accent">{{ copy.aside }} · 15–40%</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-collapsible"
    title="可折叠"
    title-en="Collapsible"
    description="向左拖过阈值吸附折叠。中缝聚焦后 Enter / Space 也可切换。缝上不钉折叠钮。"
    description-en="Drag past the threshold to snap shut. Enter / Space on the focused sash also toggles. There is no collapse button on the sash."
    :code="collapsibleCode"
  >
    <div class="frame">
      <RsSplitPane :panes="collapsiblePanes" with-handle>
        <template #side="{ collapsed }">
          <div class="pane pane--accent">
            {{ copy.side }} · {{ collapsed ? copy.collapsed : copy.expanded }}
          </div>
        </template>
        <template #content>
          <div class="pane">{{ copy.content }}</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-auto"
    title="内容自适应"
    title-en="Auto size"
    description="size=auto 按内容撑开，不占百分比配额。第一次拖会按像素物化成 %。"
    description-en="size=auto sizes to content and stays out of the percent pool. The first drag materializes it into percents."
    :code="autoCode"
  >
    <div class="frame">
      <RsSplitPane :panes="autoPanes" orientation="vertical">
        <template #search>
          <div class="pane pane--auto">{{ copy.search }}</div>
        </template>
        <template #table>
          <div class="pane">{{ copy.table }}</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-fill"
    title="铺满"
    title-en="Fill"
    description="fill 把插槽根节点拉满面板。工作台打开即可，不要 :deep。"
    description-en="fill stretches the slot root to the pane. Turn it on in a workbench; do not :deep."
    :code="fillCode"
  >
    <div class="frame">
      <RsSplitPane fill :panes="fillPanes" with-handle>
        <template #left>
          <div class="pane pane--accent">{{ copy.tree }}</div>
        </template>
        <template #right>
          <div class="pane">{{ copy.editor }}</div>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="disabled 锁整组。单缝用 panes[].resizable=false，缝仍在但不能拖。"
    description-en="disabled locks the group. panes[].resizable=false keeps the sash but it does not move."
    :code="disabledCode"
  >
    <div class="stack">
      <div class="frame frame--short">
        <RsSplitPane disabled :panes="basicPanes" with-handle>
          <template #left>
            <div class="pane pane--accent">{{ copy.tree }}</div>
          </template>
          <template #right>
            <div class="pane">{{ copy.editor }}</div>
          </template>
        </RsSplitPane>
      </div>
      <div class="frame frame--short">
        <RsSplitPane :panes="disabledPanes" with-handle>
          <template #locked>
            <div class="pane pane--accent">{{ copy.locked }}</div>
          </template>
          <template #open>
            <div class="pane">{{ copy.viewer }}</div>
          </template>
        </RsSplitPane>
      </div>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-nested"
    title="嵌套"
    title-en="Nested"
    description="横向里再嵌纵向，组成资源管理器 + 编辑器 / 终端。外缝拖动不会改内栏占比。"
    description-en="Nest a vertical split inside a horizontal one for explorer + editor / terminal. Dragging the outer sash does not change the inner ratio."
    :code="nestedCode"
  >
    <div class="frame frame--tall">
      <RsSplitPane :panes="ideOuter">
        <template #explorer>
          <div class="pane pane--accent pane--start">{{ copy.explorer }}</div>
        </template>
        <template #workbench>
          <RsSplitPane fill :panes="ideInner" orientation="vertical">
            <template #editor>
              <div class="pane pane--start">{{ copy.editor }}</div>
            </template>
            <template #terminal>
              <div class="pane pane--accent pane--start">{{ copy.terminal }}</div>
            </template>
          </RsSplitPane>
        </template>
      </RsSplitPane>
    </div>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="拖或按键会记 resize-start / resize / resize-end。折叠与展开记 key。"
    description-en="Drag or keys log resize-start / resize / resize-end. Collapse and expand log the key."
    :code="eventsCode"
  >
    <div class="frame">
      <RsSplitPane
        v-model:sizes="eventSizes"
        :panes="eventPanes"
        with-handle
        @resize-start="onResizeStart"
        @resize="onResize"
        @resize-end="onResizeEnd"
        @collapse="onCollapse"
        @expand="onExpand"
      >
        <template #side="{ collapsed }">
          <div class="pane pane--accent">
            {{ copy.side }} · {{ collapsed ? copy.collapsed : copy.expanded }}
          </div>
        </template>
        <template #viewer="{ size }">
          <div class="pane">{{ copy.viewer }} · {{ Math.round(size ?? 0) }}%</div>
        </template>
      </RsSplitPane>
    </div>
    <p class="log">{{ eventLog }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="模板 ref 用 RsSplitPaneExpose。collapse / expand / reset / getSizes / focus。"
    description-en="Type the template ref as RsSplitPaneExpose. collapse / expand / reset / getSizes / focus."
    :code="methodsCode"
  >
    <div class="toolbar">
      <RsButton size="sm" variant="ghost" @click="runCollapse">collapse()</RsButton>
      <RsButton size="sm" variant="ghost" @click="runExpand">expand()</RsButton>
      <RsButton size="sm" variant="ghost" @click="runReset">reset()</RsButton>
      <RsButton size="sm" variant="ghost" @click="runGetSizes">getSizes()</RsButton>
      <RsButton size="sm" variant="ghost" @click="runFocus">focus()</RsButton>
    </div>
    <div class="frame">
      <RsSplitPane
        ref="methodRef"
        v-model:sizes="methodSizes"
        :panes="methodPanes"
        with-handle
      >
        <template #panel>
          <div class="pane pane--accent">{{ copy.side }}</div>
        </template>
        <template #viewer>
          <div class="pane">{{ copy.viewer }}</div>
        </template>
      </RsSplitPane>
    </div>
    <p class="log">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  margin-block-end: var(--rs-space-md);
}

.frame {
  height: 12rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
  background: var(--rs-surface);
}

.frame--short {
  height: 8rem;
}

.frame--tall {
  height: 18rem;
}

.frame--dark {
  margin-block-start: var(--rs-space-md);
  background: var(--rs-bg);
}

.pane {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--rs-space-md);
  box-sizing: border-box;
  font-size: var(--rs-font-size-sm);
  color: var(--rs-text-primary);
  background: var(--rs-surface);
}

.pane--accent {
  background: var(--rs-surface-hover);
}

.pane--auto {
  height: auto;
  min-height: 2.5rem;
}

.pane--start {
  align-items: flex-start;
  justify-content: flex-start;
}

.log {
  margin: var(--rs-space-sm) 0 0;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
