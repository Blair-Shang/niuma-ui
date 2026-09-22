<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCodeBlock } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const sample = `export function save(name: string) {
  return name.trim()
}`

const jsonSample = `{
  "ok": true,
  "locale": "en-US"
}`

const sqlSample = `select id, name
from users
where active = true;`

const longSample = `const label = 'A single long line that should stay on one row when word wrap is off, so the block scrolls sideways.'
const second = 2
const third = 3
const fourth = 4
const fifth = 5
const sixth = 6`

const draft = ref(sample)
const editLog = ref('')
const eventLog = ref('')
const slotLog = ref('')
const methodLog = ref('')
const blockRef = ref<{
  getSelection: () => { text: string; startLine: number; endLine: number } | null
  focus: () => void
} | null>(null)

const highlighted = [2]

const { copy } = useSiteDemo({
  'en-US': {
    dark: 'Dark surface — chrome follows data-rs-theme. Syntax uses the dark scheme only while the document is dark.',
    editIdle: 'Type in the block. update:code fires for keystrokes, not when code is set from outside.',
    edited: 'update:code',
    copyIdle: 'Use the Copy button on the block.',
    copied: 'copy',
    slotIdle: 'The Run button is the actions slot. Copy stays on the component.',
    ran: 'actions → Run',
    methodIdle: 'Focus, select some text, then read the selection. An empty selection returns null.',
    focused: 'focus()',
    emptySelection: 'getSelection → null',
    selection: 'getSelection',
    focus: 'Focus',
    read: 'Read selection',
    run: 'Run',
  },
  'zh-CN': {
    dark: '深色表面 — 外壳跟 data-rs-theme。只有文档是深色时，语法才用深色方案。',
    editIdle: '在块里输入。update:code 只在击键时发出，从外面改 code 不会回声。',
    edited: 'update:code',
    copyIdle: '点块上的复制。',
    copied: 'copy',
    slotIdle: '运行按钮来自 actions 插槽。复制仍是组件自己的。',
    ran: 'actions → 运行',
    methodIdle: '先聚焦，选中一段文字，再读取选区。空选区返回 null。',
    focused: 'focus()',
    emptySelection: 'getSelection → null',
    selection: 'getSelection',
    focus: '聚焦',
    read: '读取选区',
    run: '运行',
  },
})

const editNote = computed(() => editLog.value || copy.value.editIdle)
const eventNote = computed(() => eventLog.value || copy.value.copyIdle)
const slotNote = computed(() => slotLog.value || copy.value.slotIdle)
const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const basicCode = `<RsCodeBlock :code="sample" lang="ts" />`

const languagesCode = `<RsCodeBlock :code="json" lang="json" />
<RsCodeBlock :code="sql" lang="sql" />`

const fileCode = `<RsCodeBlock
  :code="sample"
  lang="ts"
  filename="main.ts"
  download-filename="main.ts"
  :highlight-lines="[2]"
/>`

const chromeCode = `<RsCodeBlock
  :code="longSample"
  lang="ts"
  :line-numbers="false"
  :word-wrap="false"
  max-height="8rem"
/>`

const editableCode = `const draft = ref(sample)
function onEdit(value: string) {
  draft.value = value
}
<RsCodeBlock :code="draft" lang="ts" editable @update:code="onEdit" />`

const embedCode = `<RsCodeBlock :code="sample" lang="ts" :show-bar="false" aria-label="Snippet" />`

const slotsCode = `<RsCodeBlock :code="sample" lang="ts">
  <template #actions>
    <RsButton size="sm" variant="default" @click="ran = true">Run</RsButton>
  </template>
</RsCodeBlock>`

const eventsCode = `<RsCodeBlock :code="sample" lang="ts" @copy="onCopy" />`

const methodsCode = `const block = ref()
function readSelection() {
  const sel = block.value?.getSelection()
}
<RsCodeBlock ref="block" :code="sample" lang="ts" />
<RsButton @click="block.focus()">Focus</RsButton>`

function onEdit(value: string) {
  draft.value = value
  editLog.value = `${copy.value.edited} → ${value.length}`
}

function onCopy(text: string) {
  eventLog.value = `${copy.value.copied} → ${text.length}`
}

function onRun() {
  slotLog.value = copy.value.ran
}

function focusBlock() {
  blockRef.value?.focus()
  methodLog.value = copy.value.focused
}

function readSelection() {
  const sel = blockRef.value?.getSelection()
  methodLog.value = sel
    ? `${copy.value.selection} → L${sel.startLine}–L${sel.endLine}: ${sel.text}`
    : copy.value.emptySelection
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="只读代码"
    title-en="Read only"
    description="文档和接口响应里的短代码。根是原生 figure，带语言和复制。需要补全或诊断时用 CodeEditor，IDE 级用 Monaco。"
    description-en="Short samples in docs and API responses. The root is a native figure with a language label and Copy. Use CodeEditor for completions, Monaco for an IDE."
    :code="basicCode"
  >
    <RsCodeBlock :code="sample" lang="ts" />
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.dark }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsCodeBlock :code="sample" lang="ts" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-languages"
    title="语言"
    title-en="Languages"
    description="lang 按标识动态加载语法。未知语言仍显示纯文本，不报错。"
    description-en="lang loads a grammar on demand. An unknown language stays plain text and does not throw."
    :code="languagesCode"
  >
    <div class="stack">
      <RsCodeBlock :code="jsonSample" lang="json" />
      <RsCodeBlock :code="sqlSample" lang="sql" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-file"
    title="文件名、下载与高亮行"
    title-en="Filename, download, highlight"
    description="filename 只出现在语言条上。download-filename 才出现下载，并丢掉目录。highlight-lines 从 1 开始。"
    description-en="filename is only the label. download-filename adds Download and strips directories. highlight-lines are 1-based."
    :code="fileCode"
  >
    <RsCodeBlock
      :code="sample"
      lang="ts"
      filename="main.ts"
      download-filename="main.ts"
      :highlight-lines="highlighted"
    />
  </DocDemo>

  <DocDemo
    id="demo-chrome"
    title="行号、折行与高度"
    title-en="Lines, wrap, height"
    description="行号和折行默认开着，和原来一样。关掉行号只藏行号槽。max-height 盖过默认 32rem；嵌入且不传时仍不限制高度。"
    description-en="Line numbers and wrapping stay on, as before. Turning line numbers off only hides the gutter. max-height overrides the 32rem default; an embedded block with no max-height is still uncapped."
    :code="chromeCode"
  >
    <RsCodeBlock :code="longSample" lang="ts" :line-numbers="false" :word-wrap="false" max-height="8rem" />
  </DocDemo>

  <DocDemo
    id="demo-editable"
    title="可编辑"
    title-en="Editable"
    description="editable 打开光标，击键发出 update:code。从外面改 code 会换文档，但不会再把同一次写入发回来。"
    description-en="editable shows the caret and emits update:code on keystrokes. Setting code from outside replaces the document and does not echo that write."
    :code="editableCode"
  >
    <RsCodeBlock :code="draft" lang="ts" editable @update:code="onEdit" />
    <p class="event-log" :data-live="editLog ? '1' : undefined">{{ editNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-embed"
    title="嵌入"
    title-en="Embedded"
    description="show-bar 为 false 时没有语言条，外框也去掉。没有标题时用 aria-label 给读屏一个名字。"
    description-en="show-bar false removes the language bar and the frame. Pass aria-label so the figure still has a name."
    :code="embedCode"
  >
    <RsCodeBlock :code="sample" lang="ts" :show-bar="false" aria-label="Snippet" />
  </DocDemo>

  <DocDemo
    id="demo-slots"
    title="插槽"
    title-en="Slots"
    description="额外操作放进 #actions，跟复制、下载排在同一条工具条里。没有默认插槽。"
    description-en="Put extra actions in #actions. They sit on the same toolbar as Copy and Download. There is no default slot."
    :code="slotsCode"
  >
    <RsCodeBlock :code="sample" lang="ts">
      <template #actions>
        <RsButton size="sm" variant="default" @click="onRun">{{ copy.run }}</RsButton>
      </template>
    </RsCodeBlock>
    <p class="event-log" :data-live="slotLog ? '1' : undefined">{{ slotNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="复制成功才发 copy，载荷是全文。失败只改按钮和状态播报，不发事件。击键走 update:code，见上一节。"
    description-en="copy fires only after a successful write, with the full text. Failure updates the button and the status text, and does not emit. Keystrokes use update:code, shown above."
    :code="eventsCode"
  >
    <RsCodeBlock :code="sample" lang="ts" @copy="onCopy" />
    <p class="event-log" :data-live="eventLog ? '1' : undefined">{{ eventNote }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="focus() 把光标放进代码。getSelection() 在没有选区或只有空白时返回 null，否则给出文本和起止行号。"
    description-en="focus() moves the caret into the code. getSelection() returns null when nothing is selected or the selection is blank; otherwise it returns the text and line numbers."
    :code="methodsCode"
  >
    <RsCodeBlock ref="blockRef" :code="sample" lang="ts" />
    <div class="row">
      <RsButton variant="default" @click="focusBlock">{{ copy.focus }}</RsButton>
      <RsButton variant="default" @click="readSelection">{{ copy.read }}</RsButton>
    </div>
    <p class="event-log" :data-live="methodLog ? '1' : undefined">{{ methodNote }}</p>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-block-start: 0.75rem;
}

.event-log,
.canvas__caption {
  margin: 0.75rem 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
}

.event-log[data-live] {
  color: var(--rs-text-primary);
}

.canvas {
  margin: 0.9rem 0 0;
}

.canvas__caption {
  margin: 0 0 0.75rem;
}

.stage {
  padding: var(--rs-space-lg);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-surface);
  color: var(--rs-text-primary);
}
</style>
