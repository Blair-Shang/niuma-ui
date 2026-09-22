<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { useRsI18n } from '../../../composables/useRsI18n'
import { copyTextToClipboard } from '../../../utils/rs-clipboard'
import { resolveCodeMirrorLanguage } from '../../code-editor/src/code-mirror-lang'
import { codeBlockHighlightExtension, highlightCodeBlockLines } from './code-block-highlight'
import {
  codeBlockCopyFeedbackMs,
  codeBlockDownloadRevokeMs,
  mimeForDownloadFilename,
  readCodeBlockSelection,
  isCodeBlockDarkTheme,
  sanitizeDownloadFilename,
  subscribeCodeBlockTheme,
  type RsCodeBlockSelection,
} from './code-block-utils'

defineOptions({ name: 'RsCodeBlock' })

const props = withDefaults(
  defineProps<{
    code: string
    lang?: string
    /** 语言条上的文件名。不参与下载。 */
    filename?: string
    /** 覆盖内置「复制」文案 */
    copyLabel?: string
    /** 覆盖内置「已复制」文案 */
    copiedLabel?: string
    /** 覆盖内置「复制失败」文案 */
    copyFailedLabel?: string
    /** 提供时显示下载按钮，值为建议文件名 */
    downloadFilename?: string
    /** 覆盖内置「下载」文案 */
    downloadLabel?: string
    /** 为 true 时允许改正文，并向外同步 */
    editable?: boolean
    /** 为 false 时隐藏语言条与复制/下载（嵌入编辑器用） */
    showBar?: boolean
    /** 为 false 时藏起行号槽。默认仍显示。 */
    lineNumbers?: boolean
    /** 为 false 时不折行。默认折行。 */
    wordWrap?: boolean
    /** 从 1 开始的行号，高亮这些行 */
    highlightLines?: readonly number[]
    /** 覆盖最大高度。showBar 为 false 且未传时不限制。 */
    maxHeight?: string
    ariaLabel?: string
    id?: string
  }>(),
  { lang: 'text', editable: false, showBar: true, lineNumbers: true, wordWrap: true },
)

const emit = defineEmits<{
  'update:code': [value: string]
  copy: [text: string]
}>()

const { t } = useRsI18n()

const editorEl = ref<HTMLElement | null>(null)
const view = shallowRef<EditorView | null>(null)
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
const liveText = ref('')

const editableCompartment = new Compartment()
const wrapCompartment = new Compartment()
const themeCompartment = new Compartment()

let copyTimer: ReturnType<typeof setTimeout> | null = null
let downloadTimer: ReturnType<typeof setTimeout> | null = null
let downloadUrl: string | null = null
let unsubscribeTheme = () => {}
let unmounted = false
let syncingFromModel = false
let themeIsDark: boolean | null = null
let initSeq = 0

const copyVisual = computed(() => {
  if (copyState.value === 'copied') return props.copiedLabel ?? t('codeBlock.copied')
  if (copyState.value === 'failed') return props.copyFailedLabel ?? t('codeBlock.copyFailed')
  return props.copyLabel ?? t('codeBlock.copy')
})
const copyAria = computed(() => props.copyLabel ?? t('codeBlock.copy'))
const downloadVisual = computed(() => props.downloadLabel ?? t('codeBlock.download'))
const toolbarLabel = computed(() => props.ariaLabel || t('codeBlock.toolbar'))
const figureLabel = computed(() => props.ariaLabel || t('codeBlock.label'))
const rootStyle = computed(() => {
  if (!props.maxHeight) return undefined
  return { '--rs-code-block-max-height': props.maxHeight }
})

function applyTheme() {
  const dark = isCodeBlockDarkTheme(editorEl.value)
  if (themeIsDark === dark) return
  themeIsDark = dark
  view.value?.dispatch({
    effects: themeCompartment.reconfigure(dark ? [oneDark] : []),
  })
}

function applyHighlights() {
  if (unmounted || !view.value) return
  view.value.dispatch({ effects: highlightCodeBlockLines(props.highlightLines) })
}

function replaceDocument(next: string) {
  const ed = view.value
  if (!ed || unmounted) return
  if (ed.state.doc.toString() === next) return
  syncingFromModel = true
  try {
    ed.dispatch({
      changes: { from: 0, to: ed.state.doc.length, insert: next },
      effects: highlightCodeBlockLines(props.highlightLines),
    })
  } finally {
    syncingFromModel = false
  }
}

async function initEditor() {
  if (!editorEl.value || unmounted) return
  const seq = ++initSeq
  const targetEl = editorEl.value

  view.value?.destroy()
  view.value = null

  const langExts = await resolveCodeMirrorLanguage(props.lang ?? '')
  if (unmounted || !targetEl.isConnected || seq !== initSeq) return

  const dark = isCodeBlockDarkTheme(targetEl)
  themeIsDark = dark
  const state = EditorState.create({
    doc: props.code,
    extensions: [
      basicSetup,
      wrapCompartment.of(props.wordWrap ? EditorView.lineWrapping : []),
      editableCompartment.of(props.editable ? [] : [EditorState.readOnly.of(true)]),
      ...langExts,
      codeBlockHighlightExtension(),
      themeCompartment.of(dark ? [oneDark] : []),
      EditorView.updateListener.of((update) => {
        if (!props.editable || !update.docChanged || syncingFromModel) return
        emit('update:code', update.state.doc.toString())
      }),
    ],
  })

  if (unmounted || seq !== initSeq) return
  view.value = new EditorView({ state, parent: targetEl })
  applyHighlights()
}

function clearCopyTimer() {
  if (copyTimer !== null) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
}

function clearDownload() {
  if (downloadTimer !== null) {
    clearTimeout(downloadTimer)
    downloadTimer = null
  }
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl)
    downloadUrl = null
  }
}

onMounted(() => {
  unmounted = false
  void initEditor()
  unsubscribeTheme = subscribeCodeBlockTheme(() => applyTheme())
})

onUnmounted(() => {
  unmounted = true
  initSeq += 1
  clearCopyTimer()
  clearDownload()
  unsubscribeTheme()
  view.value?.destroy()
  view.value = null
})

watch(() => props.lang, () => { void initEditor() })

watch(() => props.editable, (editable) => {
  view.value?.dispatch({
    effects: editableCompartment.reconfigure(editable ? [] : [EditorState.readOnly.of(true)]),
  })
})

watch(() => props.wordWrap, (wrap) => {
  view.value?.dispatch({
    effects: wrapCompartment.reconfigure(wrap ? EditorView.lineWrapping : []),
  })
})

watch(() => props.code, (next) => replaceDocument(next))

watch(
  () => (props.highlightLines ?? []).join(','),
  () => applyHighlights(),
)

function getSelection(): RsCodeBlockSelection | null {
  const ed = view.value
  if (!ed) return null
  const range = ed.state.selection.main
  if (range.empty) return null
  return readCodeBlockSelection(
    false,
    ed.state.sliceDoc(range.from, range.to),
    ed.state.doc.lineAt(range.from).number,
    ed.state.doc.lineAt(range.to).number,
  )
}

function focus() {
  view.value?.focus()
}

defineExpose({ getSelection, focus })

async function copy() {
  const text = props.code
  const ok = await copyTextToClipboard(text)
  if (unmounted) return
  copyState.value = ok ? 'copied' : 'failed'
  liveText.value = ok
    ? (props.copiedLabel ?? t('codeBlock.copied'))
    : (props.copyFailedLabel ?? t('codeBlock.copyFailed'))
  if (ok) emit('copy', text)
  clearCopyTimer()
  copyTimer = setTimeout(() => {
    copyState.value = 'idle'
    liveText.value = ''
    copyTimer = null
  }, codeBlockCopyFeedbackMs())
}

function download() {
  const raw = props.downloadFilename
  if (!raw || typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return
  }
  const name = sanitizeDownloadFilename(raw)
  const blob = new Blob([props.code], { type: mimeForDownloadFilename(name) })
  clearDownload()
  const url = URL.createObjectURL(blob)
  downloadUrl = url
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  downloadTimer = setTimeout(() => {
    if (downloadUrl === url) {
      URL.revokeObjectURL(url)
      downloadUrl = null
    }
    downloadTimer = null
  }, codeBlockDownloadRevokeMs())
}
</script>

<template>
  <figure
    :id="id || undefined"
    class="rs-code-block"
    :class="{
      'rs-code-block--editable': editable,
      'rs-code-block--plain': !showBar,
      'rs-code-block--no-lines': !lineNumbers,
      'rs-code-block--nowrap': !wordWrap,
      'rs-code-block--capped': !!maxHeight,
    }"
    :style="rootStyle"
    :aria-label="showBar ? undefined : figureLabel"
  >
    <figcaption v-if="showBar" class="rs-code-block__bar">
      <div class="rs-code-block__meta">
        <span v-if="filename" class="rs-code-block__file">{{ filename }}</span>
        <span class="rs-code-block__lang">{{ lang }}</span>
      </div>
      <div class="rs-code-block__actions" role="toolbar" :aria-label="toolbarLabel">
        <slot name="actions" />
        <button
          v-if="downloadFilename"
          type="button"
          class="rs-code-block__copy"
          @click="download"
        >
          {{ downloadVisual }}
        </button>
        <button type="button" class="rs-code-block__copy" :aria-label="copyAria" @click="copy">
          <span aria-hidden="true">{{ copyVisual }}</span>
        </button>
      </div>
    </figcaption>
    <span class="rs-code-block__sr" role="status">{{ liveText }}</span>
    <div ref="editorEl" class="rs-code-block__editor" dir="ltr" />
  </figure>
</template>

<style scoped>
.rs-code-block {
  position: relative;
  margin: 0;
  min-inline-size: 0;
  max-inline-size: 100%;
  border: 1px solid var(--rs-code-block-border, var(--rs-border-subtle));
  border-radius: var(--rs-radius);
  overflow: hidden;
  background: var(--rs-code-block-bg, var(--rs-surface-elevated));
  font-size: var(--rs-font-size-sm);
  color: var(--rs-code-block-fg, var(--rs-text-primary));
}

.rs-code-block--plain {
  border: 0;
  border-radius: 0;
}

.rs-code-block__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-md);
  border-block-end: 1px solid var(--rs-code-block-border, var(--rs-border-subtle));
  background: var(--rs-code-block-bar-bg, var(--rs-surface-elevated));
}

.rs-code-block__meta {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  min-inline-size: 0;
}

.rs-code-block__file {
  min-inline-size: 0;
  overflow: hidden;
  font-family: var(--rs-code-font-family, var(--rs-font-mono));
  font-size: var(--rs-font-size-xs);
  color: var(--rs-code-block-fg, var(--rs-text-primary));
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-code-block__lang {
  flex-shrink: 0;
  font-family: var(--rs-code-font-family, var(--rs-font-mono));
  font-size: var(--rs-font-size-xs);
  color: var(--rs-code-block-muted, var(--rs-text-tertiary));
  text-transform: lowercase;
}

.rs-code-block__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--rs-space-xs);
}

.rs-code-block__copy {
  padding-block: calc(var(--rs-space-xs) / 2);
  padding-inline: var(--rs-space-sm);
  border: 1px solid var(--rs-code-block-border, var(--rs-border-subtle));
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-code-block-muted, var(--rs-text-tertiary));
  font-size: var(--rs-font-size-xs);
  cursor: pointer;
  transition:
    color var(--rs-code-block-transition, 120ms),
    border-color var(--rs-code-block-transition, 120ms),
    background var(--rs-code-block-transition, 120ms);
}

.rs-code-block__copy:hover {
  color: var(--rs-code-block-fg, var(--rs-text-primary));
  border-color: var(--rs-border);
  background: var(--rs-item-hover);
}

.rs-code-block__copy:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-code-block__sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rs-code-block__editor :deep(.cm-editor) {
  background: var(--rs-code-block-bg, var(--rs-surface-elevated)) !important;
  max-height: var(--rs-code-block-max-height, 32rem);
  overflow-y: auto;
}

.rs-code-block--plain .rs-code-block__editor :deep(.cm-editor) {
  max-height: none;
}

.rs-code-block--capped .rs-code-block__editor :deep(.cm-editor) {
  max-height: var(--rs-code-block-max-height, 32rem);
}

.rs-code-block__editor :deep(.cm-content) {
  color: var(--rs-code-block-fg, var(--rs-text-primary));
}

.rs-code-block__editor :deep(.cm-gutters) {
  background: var(--rs-code-block-gutter, var(--rs-surface-elevated)) !important;
  border-right-color: var(--rs-code-block-border, var(--rs-border-subtle)) !important;
  color: var(--rs-code-block-muted, var(--rs-text-tertiary));
}

.rs-code-block--no-lines .rs-code-block__editor :deep(.cm-gutters) {
  display: none;
}

.rs-code-block__editor :deep(.cm-activeLine) {
  background: color-mix(in srgb, var(--rs-primary) 4%, transparent) !important;
}

.rs-code-block__editor :deep(.cm-activeLineGutter) {
  background: color-mix(in srgb, var(--rs-primary) 6%, transparent) !important;
}

.rs-code-block__editor :deep(.cm-scroller) {
  font-family: var(--rs-code-font-family, var(--rs-font-mono));
  font-size: var(--rs-code-font-size, var(--rs-font-size-sm));
  line-height: var(--rs-code-line-height, var(--rs-line-height-relaxed));
}

.rs-code-block:not(.rs-code-block--editable) :deep(.cm-cursor) {
  display: none;
}

.rs-code-block__editor :deep(.cm-editor.cm-focused) {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-code-block__editor :deep(.cm-selectionBackground) {
  background: color-mix(in srgb, var(--rs-primary) 22%, transparent) !important;
}

.rs-code-block__editor :deep(.cm-focused .cm-selectionBackground) {
  background: color-mix(in srgb, var(--rs-primary) 28%, transparent) !important;
}

.rs-code-block__editor :deep(.cm-rs-code-line--highlight) {
  background-color: var(--rs-code-block-highlight, color-mix(in srgb, var(--rs-primary) 14%, transparent));
}

@media (prefers-reduced-motion: reduce) {
  .rs-code-block__copy {
    transition: none;
  }
}
</style>
