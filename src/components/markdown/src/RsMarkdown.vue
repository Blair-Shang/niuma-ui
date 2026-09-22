<script setup lang="ts">
import { computed, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { readResolvedTheme } from '../../../theme/apply'
import RsButton from '../../button/src/RsButton.vue'
import RsCodeEditor from '../../code-editor/src/RsCodeEditor.vue'
import type { RsCodeEditorExpose, RsCodeEditorTheme } from '../../code-editor/src/code-editor-utils'
import {
  applyMarkdownTabMove,
  isMarkdownRtl,
  markdownPreviewDelayMs,
  nearestMarkdownThemeHost,
  renderMarkdown,
  resolveMarkdownEditorTheme,
  resolveMarkdownHeight,
  resolveMarkdownMode,
  resolveMarkdownTabMove,
  type RsMarkdownExpose,
  type RsMarkdownMode,
} from './markdown-utils'

defineOptions({ name: 'RsMarkdown' })

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
    /** 区域名称。未传走 markdown.label */
    ariaLabel?: string
    /** 根节点 id。未传时自动生成 */
    id?: string
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
const autoId = useId()

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const editorRef = ref<RsCodeEditorExpose | null>(null)
const previewHtml = ref('')
const editorTheme = ref<RsCodeEditorTheme>(props.theme === 'auto' ? 'auto' : props.theme)

let previewTimer: ReturnType<typeof setTimeout> | null = null
let unobserveTheme = () => {}
let alive = true

const activeMode = computed(() => resolveMarkdownMode(mode.value, props.readonly))
const showToggle = computed(() => props.showModeToggle && !props.readonly && !props.disabled)
const rootId = computed(() => props.id?.trim() || autoId)
const panelDomId = computed(() => `${rootId.value}-panel`)
const surfaceTheme = computed(() => (props.theme === 'auto' ? undefined : props.theme))
const regionLabel = computed(() => props.ariaLabel?.trim() || t('markdown.label'))

const rootStyle = computed(() => ({
  height: resolveMarkdownHeight(props.height),
}))

const renderOptions = computed(() => ({
  breaks: props.breaks,
  taskDoneLabel: t('markdown.taskDone'),
  taskOpenLabel: t('markdown.taskOpen'),
  externalLabel: t('markdown.external'),
}))

const editorPlaceholder = computed(
  () => props.placeholder ?? t('markdown.placeholder'),
)

const modeItems = computed(() => [
  { value: 'edit' as const, label: t('markdown.edit') },
  { value: 'preview' as const, label: t('markdown.preview') },
  { value: 'split' as const, label: t('markdown.split') },
])

function tabDomId(value: RsMarkdownMode): string {
  return `${rootId.value}-tab-${value}`
}

function clearPreviewTimer(): void {
  if (previewTimer == null) return
  clearTimeout(previewTimer)
  previewTimer = null
}

function stopThemeWatch(): void {
  unobserveTheme()
  unobserveTheme = () => {}
}

function paintPreview(): void {
  if (!alive) return
  if (activeMode.value === 'edit') {
    previewHtml.value = ''
    return
  }
  previewHtml.value = renderMarkdown(model.value, renderOptions.value)
}

function schedulePreview(immediate: boolean): void {
  clearPreviewTimer()
  if (!alive) return
  if (immediate || activeMode.value === 'edit') {
    paintPreview()
    return
  }
  previewTimer = setTimeout(() => {
    previewTimer = null
    paintPreview()
  }, markdownPreviewDelayMs)
}

function syncEditorTheme(): void {
  stopThemeWatch()
  if (!alive) return
  if (props.theme === 'light' || props.theme === 'dark') {
    editorTheme.value = props.theme
    return
  }
  const host = nearestMarkdownThemeHost(rootRef.value)
  if (!host) {
    editorTheme.value = 'auto'
    return
  }
  const apply = () => {
    if (!alive || props.theme !== 'auto') return
    const resolved = readResolvedTheme(host)
    editorTheme.value = resolveMarkdownEditorTheme('auto', resolved)
  }
  apply()
  if (typeof MutationObserver === 'undefined') return
  const observer = new MutationObserver(apply)
  observer.observe(host, { attributes: true, attributeFilter: ['data-rs-theme'] })
  unobserveTheme = () => observer.disconnect()
}

function setMode(next: RsMarkdownMode): void {
  if (props.readonly || props.disabled) return
  mode.value = next
}

function onToolbarKeydown(event: KeyboardEvent): void {
  if (props.readonly || props.disabled) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const move = resolveMarkdownTabMove(event.key, isMarkdownRtl(event.currentTarget))
  if (move == null) return
  event.preventDefault()
  const next = applyMarkdownTabMove(activeMode.value, move)
  if (next === activeMode.value) return
  setMode(next)
  void nextTick(() => {
    const id = tabDomId(next)
    const esc = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id
    rootRef.value?.querySelector<HTMLElement>(`#${esc}`)?.focus()
  })
}

function focus(): void {
  if (props.disabled) return
  if (activeMode.value === 'preview' || !editorRef.value) {
    panelRef.value?.focus()
    return
  }
  editorRef.value.focus()
}

watch(
  [model, renderOptions, activeMode],
  (next, prev) => {
    const modeChanged = !prev || next[2] !== prev[2]
    const optionsChanged = !prev || next[1] !== prev[1]
    schedulePreview(!prev || modeChanged || optionsChanged || activeMode.value === 'edit')
  },
  { immediate: true },
)

watch(() => props.theme, () => syncEditorTheme())

onMounted(syncEditorTheme)
onActivated(() => {
  syncEditorTheme()
  schedulePreview(true)
})
onDeactivated(() => {
  clearPreviewTimer()
  stopThemeWatch()
})
onUnmounted(() => {
  alive = false
  clearPreviewTimer()
  stopThemeWatch()
})

defineExpose<RsMarkdownExpose>({ focus })
</script>

<template>
  <section
    :id="rootId"
    ref="rootRef"
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
    :data-rs-theme="surfaceTheme"
    :aria-label="regionLabel"
    :aria-disabled="disabled || undefined"
  >
    <div
      v-if="showToggle"
      class="rs-markdown__toolbar"
      role="tablist"
      aria-orientation="horizontal"
      :aria-label="t('markdown.modes')"
      @keydown="onToolbarKeydown"
    >
      <RsButton
        v-for="item in modeItems"
        :id="tabDomId(item.value)"
        :key="item.value"
        size="sm"
        type="button"
        :variant="activeMode === item.value ? 'secondary' : 'ghost'"
        :aria-selected="activeMode === item.value"
        :aria-controls="panelDomId"
        :tabindex="activeMode === item.value ? 0 : -1"
        role="tab"
        @click="setMode(item.value)"
      >
        {{ item.label }}
      </RsButton>
    </div>

    <div
      :id="panelDomId"
      ref="panelRef"
      class="rs-markdown__body"
      :role="showToggle ? 'tabpanel' : activeMode === 'preview' ? 'group' : undefined"
      :aria-labelledby="showToggle ? tabDomId(activeMode) : undefined"
      :aria-label="!showToggle && activeMode === 'preview' ? regionLabel : undefined"
      :tabindex="activeMode === 'preview' ? -1 : undefined"
    >
      <div
        v-if="activeMode === 'edit' || activeMode === 'split'"
        class="rs-markdown__editor"
        dir="ltr"
      >
        <RsCodeEditor
          ref="editorRef"
          v-model="model"
          language="markdown"
          :theme="editorTheme"
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
          dir="auto"
          v-html="previewHtml"
        />
        <p v-else class="rs-markdown__empty">{{ t('markdown.empty') }}</p>
      </div>
    </div>
  </section>
</template>

<style>
.rs-markdown {
  --rs-markdown-bg: var(--rs-surface);
  --rs-markdown-fg: var(--rs-text);
  --rs-markdown-muted: var(--rs-muted);
  --rs-markdown-border: var(--rs-border);
  --rs-markdown-accent: var(--rs-primary);
  --rs-markdown-radius: var(--rs-radius);
  --rs-markdown-bar-bg: color-mix(in srgb, var(--rs-surface) 88%, var(--rs-muted-bg, var(--rs-border)) 12%);
  --rs-markdown-code-bg: color-mix(in srgb, var(--rs-muted-bg, var(--rs-border)) 55%, transparent);
  --rs-markdown-code-frame: color-mix(in srgb, var(--rs-surface) 92%, var(--rs-muted-bg, var(--rs-border)) 8%);
  --rs-markdown-th-bg: color-mix(in srgb, var(--rs-muted-bg, var(--rs-border)) 40%, transparent);
  --rs-markdown-measure: 48rem;
  --rs-markdown-disabled-opacity: 0.65;
  display: flex;
  flex-direction: column;
  margin: 0;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--rs-markdown-border);
  background: var(--rs-markdown-bg);
  color: var(--rs-markdown-fg);
  overflow: hidden;
}
.rs-markdown--rounded {
  border-radius: var(--rs-markdown-radius);
}
.rs-markdown:focus-within {
  border-color: var(--rs-focus-border, var(--rs-markdown-accent));
}
.rs-markdown--disabled {
  opacity: var(--rs-markdown-disabled-opacity);
  pointer-events: none;
}
.rs-markdown__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
  flex: 0 0 auto;
  padding: var(--rs-space-xs) var(--rs-space-sm);
  border-bottom: 1px solid var(--rs-markdown-border);
  background: var(--rs-markdown-bar-bg);
}
.rs-markdown__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  outline: none;
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
  border-inline-end: 1px solid var(--rs-markdown-border);
}
.rs-markdown__preview {
  overflow: auto;
  padding: var(--rs-space-md) var(--rs-space-lg);
  background: var(--rs-markdown-bg);
}
.rs-markdown__preview--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}
.rs-markdown__empty {
  margin: 0;
  color: var(--rs-markdown-muted);
  font-size: var(--rs-font-size-sm);
}
.rs-markdown__prose {
  position: relative;
  max-width: var(--rs-markdown-measure);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal, 1.65);
  overflow-wrap: anywhere;
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
  font-weight: var(--rs-font-weight-semibold);
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--rs-markdown-fg);
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
  padding-inline-start: 1.4em;
}
.rs-markdown__prose li + li {
  margin-top: 0.25em;
}
.rs-markdown__prose a {
  color: var(--rs-markdown-accent);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
}
.rs-markdown__prose a code {
  color: inherit;
}
.rs-markdown__prose a:hover {
  opacity: 0.85;
}
.rs-markdown__prose strong {
  font-weight: var(--rs-font-weight-semibold);
}
.rs-markdown__prose blockquote {
  padding-block: 0.15em;
  padding-inline: 0.9em 0;
  border-inline-start: 3px solid var(--rs-markdown-border);
  color: var(--rs-markdown-muted);
}
.rs-markdown__prose hr {
  margin: 1.25em 0;
  border: 0;
  border-top: 1px solid var(--rs-markdown-border);
}
.rs-markdown__prose code {
  padding: 0.1em 0.35em;
  border-radius: calc(var(--rs-markdown-radius) * 0.6);
  background: var(--rs-markdown-code-bg);
  font-family: var(--rs-font-mono);
  font-size: 0.9em;
}
.rs-markdown__codeblock {
  overflow: hidden;
  border: 1px solid var(--rs-markdown-border);
  border-radius: var(--rs-markdown-radius);
  background: var(--rs-markdown-code-frame);
}
.rs-markdown__code-head {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid var(--rs-markdown-border);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-markdown-muted);
}
.rs-markdown__pre {
  margin: 0;
  padding: 0.75rem 0.9rem;
  overflow: auto;
  font-family: var(--rs-font-mono);
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
  border: 1px solid var(--rs-markdown-border);
  text-align: start;
}
.rs-markdown__prose th {
  background: var(--rs-markdown-th-bg);
  font-weight: var(--rs-font-weight-semibold);
}
.rs-markdown__img {
  max-width: 100%;
  height: auto;
  border-radius: var(--rs-markdown-radius);
}
.rs-markdown__task {
  display: inline-block;
  width: 0.9em;
  height: 0.9em;
  margin-block: 0 0.05em;
  margin-inline: 0 0.4em;
  border: 1px solid var(--rs-markdown-border);
  border-radius: 0.15em;
  vertical-align: middle;
  background: var(--rs-markdown-bg);
}
.rs-markdown__task--on {
  background: var(--rs-markdown-accent);
  border-color: var(--rs-markdown-accent);
  box-shadow: inset 0 0 0 0.12em var(--rs-markdown-bg);
}
.rs-markdown__prose li:has(> .rs-markdown__task) {
  list-style: none;
  margin-inline-start: -1.15em;
}
.rs-markdown__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 40rem) {
  .rs-markdown--split .rs-markdown__body {
    flex-direction: column;
  }
  .rs-markdown--split .rs-markdown__editor {
    border-inline-end: 0;
    border-block-end: 1px solid var(--rs-markdown-border);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rs-markdown__preview {
    scroll-behavior: auto;
  }
}
</style>
