<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsMarkdown, type RsMarkdownMode } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
import { useSiteDemo } from '../composables/use-site-i18n'

const sample = `## Release notes

- In-app updates
- Startup crash fix

See [the docs](https://example.com).
`

const locked = `Preview only. The mode bar stays hidden while the parent keeps \`mode\`.
`

const tight = 'Line one\nLine two'

const draft = ref(sample)
const draftMode = ref<RsMarkdownMode>('edit')
const split = ref(sample)
const splitMode = ref<RsMarkdownMode>('split')
const published = ref(sample)
const fixed = ref(locked)
const blocked = ref(sample)
const soft = ref(tight)
const hard = ref(tight)
const island = ref(sample)
const live = ref(sample)
const liveMode = ref<RsMarkdownMode>('split')
const methodTarget = ref(sample)
const methodLog = ref('')

const mdRef = ref<{ focus: () => void } | null>(null)

const { copy } = useSiteDemo({
  'en-US': {
    dark: 'Dark island — the frame follows data-rs-theme. theme="dark" paints the source the same way.',
    disabled: 'Disabled hides the mode bar and ignores focus().',
    mode: 'update:mode',
    source: 'update:modelValue',
    methodIdle: 'focus() moves into the preview surface.',
    focused: 'focus()',
    focus: 'Focus',
  },
  'zh-CN': {
    dark: '深色岛 — 外框跟 data-rs-theme。theme="dark" 让源码面同一套明暗。',
    disabled: '禁用会藏起模式条，并且 focus() 无操作。',
    mode: 'update:mode',
    source: 'update:modelValue',
    methodIdle: 'focus() 把焦点放进预览面。',
    focused: 'focus()',
    focus: '聚焦',
  },
})

const methodNote = computed(() => methodLog.value || copy.value.methodIdle)

const editCode = `const source = ref(sample)
const mode = ref('edit')

<RsMarkdown
  v-model="source"
  v-model:mode="mode"
  :height="220"
  placeholder="Write Markdown…"
/>`

const splitCode = `const source = ref(sample)
const mode = ref('split')

<RsMarkdown v-model="source" v-model:mode="mode" :height="240" />`

const readonlyCode = `<RsMarkdown v-model="published" readonly :height="180" />`

const lockedCode = `<RsMarkdown v-model="note" mode="preview" :show-mode-toggle="false" :height="140" />`

const disabledCode = `<RsMarkdown v-model="note" disabled :height="140" />`

const breaksCode = `<RsMarkdown v-model="text" mode="preview" :show-mode-toggle="false" />
<RsMarkdown v-model="text" mode="preview" :breaks="false" :show-mode-toggle="false" />`

const themeCode = `<div data-rs-theme="dark">
  <RsMarkdown v-model="source" mode="split" theme="dark" :height="200" />
</div>`

const eventsCode = `const source = ref(sample)
const mode = ref('split')

<RsMarkdown v-model="source" v-model:mode="mode" :height="200" />`

const methodsCode = `const note = ref()

function focusNote() {
  note.value?.focus()
}

<RsMarkdown ref="note" v-model="source" mode="preview" :height="160" />
<RsButton @click="focusNote">Focus</RsButton>`

function focusNote() {
  mdRef.value?.focus()
  methodLog.value = copy.value.focused
}
</script>

<template>
  <DocDemo
    id="demo-edit"
    title="编辑"
    title-en="Edit"
    description="v-model 绑定源码，v-model:mode 在 edit / preview / split 之间切换。默认进入编辑，预览要切过去才解析。"
    description-en="v-model is the source. v-model:mode switches edit, preview, and split. The default is edit, and the preview parses only after you open it."
    :code="editCode"
  >
    <RsMarkdown
      v-model="draft"
      v-model:mode="draftMode"
      :height="220"
      placeholder="Write Markdown…"
    />
  </DocDemo>

  <DocDemo
    id="demo-split"
    title="分栏"
    title-en="Split"
    description="左边改源码，右边是消毒后的预览。窄屏改成上下排，代码仍从左往右。"
    description-en="Edit on one side and the sanitized preview on the other. Narrow widths stack the panes. Code stays left to right."
    :code="splitCode"
  >
    <RsMarkdown v-model="split" v-model:mode="splitMode" :height="240" />
  </DocDemo>

  <DocDemo
    id="demo-readonly"
    title="只读"
    title-en="Read only"
    description="readonly 强制预览并藏起模式条。http(s) 外链新开标签；页内锚点和相对路径留在当前页。"
    description-en="readonly forces preview and hides the mode bar. http(s) links open a new tab. Hash and relative links stay on this page."
    :code="readonlyCode"
  >
    <RsMarkdown v-model="published" readonly :height="180" />
  </DocDemo>

  <DocDemo
    id="demo-locked"
    title="隐藏切换"
    title-en="Hidden toggle"
    description="showModeToggle 为 false 时不画模式条，当前 mode 仍由外面决定。适合嵌在说明里、暂时不要编辑入口。"
    description-en="showModeToggle false hides the bar. The parent still owns mode. Use it when a note should not offer an editor yet."
    :code="lockedCode"
  >
    <RsMarkdown v-model="fixed" mode="preview" :show-mode-toggle="false" :height="140" />
  </DocDemo>

  <DocDemo
    id="demo-disabled"
    title="禁用"
    title-en="Disabled"
    description="禁用藏起模式条，源码不能改，focus() 也不进入。"
    description-en="Disabled hides the mode bar, blocks edits, and focus() does not enter."
    :code="disabledCode"
  >
    <RsMarkdown v-model="blocked" disabled :height="140" />
    <p class="event-log">{{ copy.disabled }}</p>
  </DocDemo>

  <DocDemo
    id="demo-breaks"
    title="换行"
    title-en="Line breaks"
    description="默认把单个换行收成 <br>。breaks 为 false 时按 CommonMark，两行仍在同一段。"
    description-en="A single newline becomes <br> by default. breaks false follows CommonMark and keeps both lines in one paragraph."
    :code="breaksCode"
  >
    <div class="stack">
      <RsMarkdown v-model="soft" mode="preview" :show-mode-toggle="false" :height="96" />
      <RsMarkdown v-model="hard" mode="preview" :breaks="false" :show-mode-toggle="false" :height="96" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-theme"
    title="主题"
    title-en="Theme"
    description="颜色走 --rs-markdown-*。显式 theme 写到根的 data-rs-theme，预览和源码同一套明暗。auto 跟页面；放进主题岛时源码面跟岛。"
    description-en="Color uses --rs-markdown-*. An explicit theme writes data-rs-theme on the root so preview and source match. auto follows the page, and a theme island pulls the source with it."
    :code="themeCode"
  >
    <figure class="canvas">
      <figcaption class="canvas__caption">{{ copy.dark }}</figcaption>
      <div class="stage" data-rs-theme="dark">
        <RsMarkdown v-model="island" mode="split" theme="dark" :height="200" />
      </div>
    </figure>
  </DocDemo>

  <DocDemo
    id="demo-events"
    title="事件"
    title-en="Events"
    description="击键发出 update:modelValue。点模式条或按左右键、Home、End 发出 update:mode。只读和禁用不改这两边。"
    description-en="Keystrokes emit update:modelValue. The mode bar, arrow keys, Home, and End emit update:mode. Readonly and disabled change neither."
    :code="eventsCode"
  >
    <RsMarkdown v-model="live" v-model:mode="liveMode" :height="200" />
    <p class="event-log" data-live="1">{{ copy.mode }} → {{ liveMode }}</p>
    <p class="event-log" data-live="1">{{ copy.source }} → {{ live.length }}</p>
  </DocDemo>

  <DocDemo
    id="demo-methods"
    title="方法"
    title-en="Methods"
    description="focus() 在预览时进入预览面，在编辑或分栏时进入源码。禁用时无操作。"
    description-en="focus() enters the preview surface in preview mode, and the source in edit or split. It does nothing while disabled."
    :code="methodsCode"
  >
    <RsMarkdown ref="mdRef" v-model="methodTarget" mode="preview" :height="160" />
    <div class="row">
      <RsButton variant="default" @click="focusNote">{{ copy.focus }}</RsButton>
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
  margin: 0;
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
