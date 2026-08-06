<script setup lang="ts">
import { computed } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import RsButton from './RsButton.vue'
import RsCodeEditor from './RsCodeEditor.vue'
import type { RsCodeEditorTheme } from './code-editor-utils'
import {
  renderMarkdown,
  resolveMarkdownHeight,
  resolveMarkdownMode,
  type RsMarkdownMode,
} from './markdown-utils'

const model = defineModel<string>({ default: '' })
const mode = defineModel<RsMarkdownMode>('mode', { default: 'edit' })

const props = withDefaults(
  defineProps<{
    /** 只读：强制预览并隐藏模式切换 */
    readonly?: boolean
    height?: number | string
    placeholder?: string
    theme?: RsCodeEditorTheme
    rounded?: boolean
    /** 是否显示编辑/预览/分栏切换，默认 true（readonly 时强制隐藏） */
    showModeToggle?: boolean
    /** GFM 单个换行转 <br>，默认 true */
    breaks?: boolean
    disabled?: boolean
  }>(),
  {
    readonly: false,
    theme: 'auto',
    rounded: true,
    showModeToggle: true,
    breaks: true,
    disabled: false,
  },
)

const { t } = useRsI18n()

const activeMode = computed(() => resolveMarkdownMode(mode.value, props.readonly))

const showToggle = computed(() => props.showModeToggle && !props.readonly && !props.disabled)

const rootStyle = computed(() => ({
  height: resolveMarkdownHeight(props.height),
}))

const previewHtml = computed(() =>
  renderMarkdown(model.value, { breaks: props.breaks }),
)

const editorPlaceholder = computed(
  () => props.placeholder ?? t('markdown.placeholder'),
)

const modeItems = computed(() => [
  { value: 'edit' as const, label: t('markdown.edit') },
  { value: 'preview' as const, label: t('markdown.preview') },
  { value: 'split' as const, label: t('markdown.split') },
])

function setMode(next: RsMarkdownMode): void {
  if (props.readonly || props.disabled) return
  mode.value = next
}
</script>

<template>
  <div
    class="rs-markdown"
    :class="[
      `rs-markdown--${activeMode}`,
      {
        'rs-markdown--rounded': rounded,
        'rs-markdown--readonly': readonly,
        'rs-markdown--disabled': disabled,
        'rs-markdown--with-toggle': showToggle,
      },
    ]"
    :style="rootStyle"
  >
    <div v-if="showToggle" class="rs-markdown__toolbar" role="tablist" :aria-label="t('markdown.modes')">
      <RsButton
        v-for="item in modeItems"
        :key="item.value"
        size="sm"
        :variant="activeMode === item.value ? 'secondary' : 'ghost'"
        :aria-selected="activeMode === item.value"
        role="tab"
        @click="setMode(item.value)"
      >
        {{ item.label }}
      </RsButton>
    </div>

    <div class="rs-markdown__body">
      <div
        v-if="activeMode === 'edit' || activeMode === 'split'"
        class="rs-markdown__editor"
      >
        <RsCodeEditor
          v-model="model"
          language="markdown"
          :theme="theme"
          :placeholder="editorPlaceholder"
          :readonly="readonly || disabled"
          :disabled="disabled"
          :show-toolbar="false"
          :rounded="false"
          embedded
          height="100%"
        />
      </div>

      <div
        v-if="activeMode === 'preview' || activeMode === 'split'"
        class="rs-markdown__preview rs-native-scrollbar"
        :class="{ 'rs-markdown__preview--empty': !previewHtml }"
      >
        <div
          v-if="previewHtml"
          class="rs-markdown__prose"
          v-html="previewHtml"
        />
        <p v-else class="rs-markdown__empty">{{ t('markdown.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<style>
.rs-markdown {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--rs-border);
  background: var(--rs-surface);
  color: var(--rs-text);
  overflow: hidden;
}
.rs-markdown--rounded {
  border-radius: var(--rs-radius);
}
.rs-markdown--disabled {
  opacity: 0.65;
  pointer-events: none;
}
.rs-markdown__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
  flex: 0 0 auto;
  padding: var(--rs-space-xs) var(--rs-space-sm);
  border-bottom: 1px solid var(--rs-border);
  background: color-mix(in srgb, var(--rs-surface) 88%, var(--rs-muted-bg, var(--rs-border)) 12%);
}
.rs-markdown__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}
.rs-markdown--edit .rs-markdown__body,
.rs-markdown--preview .rs-markdown__body {
  flex-direction: column;
}
.rs-markdown--split .rs-markdown__body {
  flex-direction: row;
}
.rs-markdown__editor,
.rs-markdown__preview {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
.rs-markdown--split .rs-markdown__editor {
  border-right: 1px solid var(--rs-border);
}
.rs-markdown__preview {
  overflow: auto;
  padding: var(--rs-space-md) var(--rs-space-lg);
  background: var(--rs-surface);
}
.rs-markdown__preview--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}
.rs-markdown__empty {
  margin: 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
.rs-markdown__prose {
  max-width: 48rem;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal, 1.65);
  word-break: break-word;
}
.rs-markdown__prose > :first-child {
  margin-top: 0;
}
.rs-markdown__prose > :last-child {
  margin-bottom: 0;
}
.rs-markdown__prose h1,
.rs-markdown__prose h2,
.rs-markdown__prose h3,
.rs-markdown__prose h4 {
  margin: 1.25em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--rs-text);
}
.rs-markdown__prose h1 {
  font-size: 1.5em;
}
.rs-markdown__prose h2 {
  font-size: 1.25em;
}
.rs-markdown__prose h3 {
  font-size: 1.1em;
}
.rs-markdown__prose p,
.rs-markdown__prose ul,
.rs-markdown__prose ol,
.rs-markdown__prose blockquote,
.rs-markdown__prose pre,
.rs-markdown__prose .rs-markdown__codeblock,
.rs-markdown__prose .rs-markdown__table-wrap {
  margin: 0.75em 0;
}
.rs-markdown__prose ul,
.rs-markdown__prose ol {
  padding-left: 1.4em;
}
.rs-markdown__prose li + li {
  margin-top: 0.25em;
}
.rs-markdown__prose a {
  color: var(--rs-primary);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
.rs-markdown__prose a:hover {
  opacity: 0.85;
}
.rs-markdown__prose strong {
  font-weight: 600;
}
.rs-markdown__prose blockquote {
  padding: 0.15em 0 0.15em 0.9em;
  border-left: 3px solid var(--rs-border);
  color: var(--rs-muted);
}
.rs-markdown__prose hr {
  margin: 1.25em 0;
  border: 0;
  border-top: 1px solid var(--rs-border);
}
.rs-markdown__prose code {
  padding: 0.1em 0.35em;
  border-radius: calc(var(--rs-radius) * 0.6);
  background: color-mix(in srgb, var(--rs-muted-bg, var(--rs-border)) 55%, transparent);
  font-family: var(--rs-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 0.9em;
}
.rs-markdown__codeblock {
  overflow: hidden;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: color-mix(in srgb, var(--rs-surface) 92%, var(--rs-muted-bg, var(--rs-border)) 8%);
}
.rs-markdown__code-head {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid var(--rs-border);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.rs-markdown__pre {
  margin: 0;
  padding: 0.75rem 0.9rem;
  overflow: auto;
  font-family: var(--rs-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 0.85em;
  line-height: 1.55;
}
.rs-markdown__pre code {
  padding: 0;
  background: transparent;
  border-radius: 0;
  font-size: inherit;
}
.rs-markdown__table-wrap {
  overflow: auto;
}
.rs-markdown__prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}
.rs-markdown__prose th,
.rs-markdown__prose td {
  padding: 0.45em 0.7em;
  border: 1px solid var(--rs-border);
  text-align: left;
}
.rs-markdown__prose th {
  background: color-mix(in srgb, var(--rs-muted-bg, var(--rs-border)) 40%, transparent);
  font-weight: 600;
}
.rs-markdown__img {
  max-width: 100%;
  height: auto;
  border-radius: var(--rs-radius);
}
.rs-markdown__prose input[type='checkbox'] {
  margin-right: 0.35em;
  vertical-align: middle;
}
</style>
