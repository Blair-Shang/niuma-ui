<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, useId, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, placeholder as cmPlaceholder, tooltips } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { useRsI18n } from '../../../composables/useRsI18n'
import type {
  RsCodeEditorDiagnostic,
  RsCodeEditorLanguage,
  RsCodeEditorSqlConfig,
  RsCodeEditorTheme,
} from './code-editor-utils'
import {
  codeEditorLanguageLabel,
  codeEditorModShortcut,
  readDocumentTheme,
  resolveCodeEditorLanguage,
  resolveCodeEditorSize,
  resolveCodeEditorTheme,
  subscribeDocumentTheme,
} from './code-editor-utils'
import { resolveCodeMirrorLanguage } from './code-mirror-lang'
import {
  diagnosticExtensions,
  setEditorDiagnostics,
} from './code-mirror-diagnostics'
import { codeMirrorIntelExtensions, goToPosition } from './code-mirror-intel'
import { codeMirrorCompletionExtensions } from './code-mirror-completion'
import { codeMirrorGhostExtensions, clearGhostCompletion } from './code-mirror-ghost'
import {
  codeMirrorInlineEditExtension,
  extractSurroundingContext,
  replaceEditorRange,
  type InlineEditTrigger,
} from './code-mirror-inline-edit'
import { isEditorViewAlive } from './code-mirror-session'

defineOptions({ name: 'RsCodeEditor' })

const model = defineModel<string>({ default: '' })

const emit = defineEmits<{
  'goto-definition': [loc: { file: string; line: number; column?: number }]
  ready: []
}>()

const props = withDefaults(
  defineProps<{
    language?: RsCodeEditorLanguage
    theme?: RsCodeEditorTheme
    height?: number | string
    readonly?: boolean
    disabled?: boolean
    /** 是否显示内置语言标签栏（文件工作台使用外部 FileEditorToolbar 时应关闭） */
    showToolbar?: boolean
    /**
     * 嵌入父容器：去边框，直角，铺满父级高度。
     * 嵌套在已有描边/分割条的面板（如过滤条）时使用，避免业务侧 :deep 改样式。
     */
    embedded?: boolean
    /** 外框圆角；embedded 时强制直角 */
    rounded?: boolean
    /**
     * 行号 gutter 最小宽度（px）。
     * 用于与表格 editGutterWidth / indexWidth 对齐。
     */
    gutterWidth?: number
    /** 是否显示代码折叠 gutter；过滤片段等场景可关以便与表格行号宽对齐 */
    foldGutter?: boolean
    diagnostics?: RsCodeEditorDiagnostic[]
    placeholder?: string
    /** SQL 表/字段补全（language=sql 时生效） */
    sqlConfig?: RsCodeEditorSqlConfig
    filePath?: string
    hoverRequest?: (line: number, column: number, signal?: AbortSignal) => Promise<string | null>
    definitionRequest?: (line: number, column: number, signal?: AbortSignal) => Promise<{
      file: string
      line: number
      column?: number
    } | null>
    completionRequest?: (
      prefix: string,
      suffix: string,
      line: number,
      column: number,
      signal?: AbortSignal,
    ) => Promise<string | null>
    inlineEditRequest?: (params: {
      selection: string
      instruction: string
      from: number
      to: number
      surroundingContext: string
      signal?: AbortSignal
    }) => Promise<string | null>
    /** 折行。默认开，与原先 EditorView.lineWrapping 一致。 */
    wrap?: boolean
    /** 首次创建后聚焦。语言或 SQL 重载不再抢焦点。 */
    autofocus?: boolean
    /** 覆盖读屏名称。不传走 codeEditor.label。 */
    ariaLabel?: string
    id?: string
  }>(),
  {
    language: 'plaintext',
    theme: 'auto',
    readonly: false,
    disabled: false,
    showToolbar: true,
    embedded: false,
    rounded: true,
    foldGutter: true,
    diagnostics: () => [],
    wrap: true,
    autofocus: false,
  },
)

const { t } = useRsI18n()
const inlineTitleId = useId()

const rootStyle = computed(() => {
  const style: Record<string, string> = {
    height: resolveCodeEditorSize(props.height),
  }
  if (props.gutterWidth != null && props.gutterWidth > 0) {
    style['--rs-code-editor-gutter-width'] = `${props.gutterWidth}px`
  }
  return style
})

const resolvedLanguage = computed(() => resolveCodeEditorLanguage(props.language))
const resolvedLanguageLabel = computed(() => codeEditorLanguageLabel(props.language))
const documentTheme = ref(readDocumentTheme())
const resolvedTheme = computed(() =>
  props.theme === 'auto' ? documentTheme.value : resolveCodeEditorTheme(props.theme),
)
/** auto 继承页面；显式 light/dark 在根上写 data-rs-theme，形成主题岛。 */
const themeIsland = computed(() => (props.theme === 'auto' ? undefined : resolvedTheme.value))
const editorLabel = computed(() => props.ariaLabel?.trim() || t('codeEditor.label'))
const inlineShortcut = computed(() => codeEditorModShortcut('K'))

const editorEl = ref<HTMLElement | null>(null)
const inlineEditPanelRef = ref<HTMLElement | null>(null)
const view = shallowRef<EditorView | null>(null)
const editableCompartment = new Compartment()
const themeCompartment = new Compartment()
const wrapCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const contentCompartment = new Compartment()
let stopTheme: (() => void) | null = null
let unmounted = false
let syncingFromModel = false
let ghostTimer: ReturnType<typeof setTimeout> | null = null
let initSeq = 0
let didAutofocus = false
let inlineAbort: AbortController | null = null
const inlineEditOpen = ref(false)
const inlineEditInstruction = ref('')
const inlineEditLoading = ref(false)
const inlineEditPreview = ref('')
const inlineEditError = ref('')
const inlineEditInputRef = ref<HTMLInputElement | null>(null)
let pendingInlineEdit: InlineEditTrigger | null = null

function codeMirrorThemeExts(theme: 'light' | 'dark') {
  return theme === 'light' ? [] : [oneDark]
}

function placeholderExt() {
  return props.placeholder ? [cmPlaceholder(props.placeholder)] : []
}

function wrapExt() {
  return props.wrap ? [EditorView.lineWrapping] : []
}

function contentAttributeExt() {
  const attrs: Record<string, string> = {
    'aria-label': editorLabel.value,
    spellcheck: 'false',
  }
  if (props.disabled) {
    attrs['aria-disabled'] = 'true'
    attrs.tabindex = '-1'
  } else if (props.readonly) {
    attrs['aria-readonly'] = 'true'
  }
  return EditorView.contentAttributes.of(attrs)
}

function applyChrome() {
  const current = view.value
  if (!isEditorViewAlive(current)) return
  const editable = !props.readonly && !props.disabled
  current.dispatch({
    effects: [
      editableCompartment.reconfigure(EditorView.editable.of(editable)),
      contentCompartment.reconfigure(contentAttributeExt()),
    ],
  })
}

function applyThemeExt() {
  const current = view.value
  if (!isEditorViewAlive(current)) return
  current.dispatch({
    effects: themeCompartment.reconfigure(codeMirrorThemeExts(resolvedTheme.value)),
  })
}

function abortInlineEdit() {
  inlineAbort?.abort()
  inlineAbort = null
}

function closeInlineEdit() {
  const wasOpen = inlineEditOpen.value
  abortInlineEdit()
  inlineEditOpen.value = false
  inlineEditInstruction.value = ''
  inlineEditPreview.value = ''
  inlineEditError.value = ''
  inlineEditLoading.value = false
  pendingInlineEdit = null
  if (wasOpen && isEditorViewAlive(view.value) && !props.disabled) view.value.focus()
}

function onInlineEditTrigger(_view: EditorView, info: InlineEditTrigger) {
  if (!props.inlineEditRequest || props.readonly || props.disabled) return
  if (isEditorViewAlive(view.value)) clearGhostCompletion(view.value)
  abortInlineEdit()
  inlineEditLoading.value = false
  pendingInlineEdit = info
  inlineEditPreview.value = info.selection.length > 120
    ? `${info.selection.slice(0, 120)}…`
    : info.selection
  inlineEditOpen.value = true
  inlineEditInstruction.value = ''
  inlineEditError.value = ''
  void nextTick(() => inlineEditInputRef.value?.focus())
}

async function submitInlineEdit() {
  const range = pendingInlineEdit
  const instruction = inlineEditInstruction.value.trim()
  if (!range || !instruction || !props.inlineEditRequest || !isEditorViewAlive(view.value) || inlineEditLoading.value) return
  abortInlineEdit()
  const controller = new AbortController()
  inlineAbort = controller
  const signal = controller.signal
  inlineEditLoading.value = true
  inlineEditError.value = ''
  try {
    const doc = view.value.state.doc.toString()
    const edited = await props.inlineEditRequest({
      selection: range.selection,
      instruction,
      from: range.from,
      to: range.to,
      surroundingContext: extractSurroundingContext(doc, range.from, range.to),
      signal,
    })
    if (signal.aborted || unmounted || !isEditorViewAlive(view.value)) return
    if (edited == null) {
      inlineEditError.value = t('codeEditor.inlineEditFailed')
      return
    }
    replaceEditorRange(view.value, range.from, range.to, edited)
    closeInlineEdit()
  } catch {
    if (signal.aborted || unmounted) return
    inlineEditError.value = t('codeEditor.inlineEditFailed')
  } finally {
    if (inlineAbort === controller) inlineAbort = null
    if (!unmounted && inlineEditOpen.value) inlineEditLoading.value = false
  }
}

function onInlineEditKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeInlineEdit()
    return
  }
  if (event.key !== 'Tab') return
  const root = inlineEditPanelRef.value
  if (!root) return
  const items = [...root.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)')]
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  const active = document.activeElement
  if (event.shiftKey && (active === first || !root.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

function jumpToDiagnostic(diagnostic: RsCodeEditorDiagnostic) {
  if (!isEditorViewAlive(view.value) || props.disabled) return
  if (diagnostic.line == null) {
    view.value.focus()
    return
  }
  goToPosition(view.value, diagnostic.line, diagnostic.column ?? 1)
}

function scheduleGhostCompletion(fn: () => void) {
  if (ghostTimer) clearTimeout(ghostTimer)
  ghostTimer = setTimeout(fn, 900)
}

function cancelGhostCompletionSchedule() {
  if (ghostTimer) {
    clearTimeout(ghostTimer)
    ghostTimer = null
  }
}

async function initEditor() {
  if (!editorEl.value || unmounted) return
  const seq = ++initSeq
  const targetEl = editorEl.value
  const previous = isEditorViewAlive(view.value) ? view.value.state.selection.main : null

  view.value?.destroy()
  view.value = null

  const langExts = await resolveCodeMirrorLanguage(resolvedLanguage.value, {
    sql: props.sqlConfig,
  })
  if (unmounted || !targetEl.isConnected || seq !== initSeq) return

  const editable = !props.readonly && !props.disabled
  const state = EditorState.create({
    doc: model.value,
    extensions: [
      basicSetup,
      ...(props.embedded && typeof document !== 'undefined' ? [tooltips({ parent: document.body })] : []),
      wrapCompartment.of(wrapExt()),
      editableCompartment.of(EditorView.editable.of(editable)),
      placeholderCompartment.of(placeholderExt()),
      contentCompartment.of(contentAttributeExt()),
      ...langExts,
      diagnosticExtensions(),
      ...codeMirrorIntelExtensions(() => ({
        hoverRequest: props.hoverRequest,
        definitionRequest: props.definitionRequest,
        currentFilePath: props.filePath,
        onGotoDefinition: (loc) => emit('goto-definition', loc),
      })),
      ...codeMirrorCompletionExtensions(() => ({
        completionRequest: props.completionRequest,
      })),
      ...codeMirrorGhostExtensions(
        () => ({ completionRequest: props.completionRequest }),
        scheduleGhostCompletion,
        cancelGhostCompletionSchedule,
      ),
      ...(props.inlineEditRequest
        ? [codeMirrorInlineEditExtension(onInlineEditTrigger)]
        : []),
      themeCompartment.of(codeMirrorThemeExts(resolvedTheme.value)),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged || syncingFromModel) return
        const next = update.state.doc.toString()
        if (next !== model.value) model.value = next
      }),
    ],
  })

  if (unmounted || !targetEl.isConnected || seq !== initSeq) return
  const created = new EditorView({ state, parent: targetEl })
  view.value = created
  if (previous) {
    const length = created.state.doc.length
    const anchor = Math.min(previous.anchor, length)
    const head = Math.min(previous.head, length)
    if (anchor !== 0 || head !== 0) {
      created.dispatch({ selection: { anchor, head } })
    }
  }
  setEditorDiagnostics(created, props.diagnostics ?? [])
  if (props.autofocus && !didAutofocus && editable) {
    didAutofocus = true
    created.focus()
  }
  emit('ready')
}

onMounted(() => {
  unmounted = false
  void initEditor()
  stopTheme = subscribeDocumentTheme(() => {
    documentTheme.value = readDocumentTheme()
  })
})

onUnmounted(() => {
  unmounted = true
  initSeq += 1
  abortInlineEdit()
  cancelGhostCompletionSchedule()
  stopTheme?.()
  stopTheme = null
  view.value?.destroy()
  view.value = null
})

watch(
  () => [props.language, Boolean(props.inlineEditRequest), resolvedLanguage.value === 'sql' ? props.sqlConfig : null] as const,
  () => {
    void initEditor()
  },
  { deep: true },
)

watch(resolvedTheme, () => {
  applyThemeExt()
})

watch(
  () => props.wrap,
  () => {
    const current = view.value
    if (!isEditorViewAlive(current)) return
    current.dispatch({ effects: wrapCompartment.reconfigure(wrapExt()) })
  },
)

watch(
  () => props.placeholder,
  () => {
    const current = view.value
    if (!isEditorViewAlive(current)) return
    current.dispatch({ effects: placeholderCompartment.reconfigure(placeholderExt()) })
  },
)

watch(
  () => [props.readonly, props.disabled, editorLabel.value] as const,
  () => {
    applyChrome()
  },
)

watch(
  () => model.value,
  (newCode) => {
    if (!isEditorViewAlive(view.value)) return
    const current = view.value.state.doc.toString()
    if (current === newCode) return
    syncingFromModel = true
    try {
      clearGhostCompletion(view.value)
      view.value.dispatch({
        changes: { from: 0, to: view.value.state.doc.length, insert: newCode },
      })
    } finally {
      syncingFromModel = false
    }
  },
)

watch(
  () => props.diagnostics,
  (diags) => {
    if (!isEditorViewAlive(view.value)) return
    setEditorDiagnostics(view.value, diags ?? [])
  },
  { deep: true },
)

defineExpose({
  goToPosition(line: number, column = 1) {
    if (!isEditorViewAlive(view.value)) return
    goToPosition(view.value, line, column)
  },
  focus() {
    if (!isEditorViewAlive(view.value) || props.disabled) return
    view.value.focus()
  },
})
</script>

<template>
  <div
    :id="id"
    class="rs-code-editor"
    :class="[
      `rs-code-editor--${resolvedTheme}`,
      {
        'rs-code-editor--embedded': embedded,
        'rs-code-editor--square': !rounded || embedded,
        'rs-code-editor--no-fold': !foldGutter,
        'rs-code-editor--gutter-fixed': gutterWidth != null && gutterWidth > 0,
      },
    ]"
    :style="rootStyle"
    :data-rs-theme="themeIsland"
    role="group"
    :aria-label="editorLabel"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <div v-if="showToolbar" class="rs-code-editor__toolbar">
      <span>{{ resolvedLanguageLabel }}</span>
      <slot name="toolbar" />
    </div>
    <div class="rs-code-editor__body">
      <div
        ref="editorEl"
        class="rs-code-editor__surface"
        :class="{ 'rs-code-editor__surface--disabled': disabled }"
      />
      <div
        v-if="inlineEditOpen"
        ref="inlineEditPanelRef"
        class="rs-code-editor__inline-edit"
        role="dialog"
        aria-modal="false"
        :aria-labelledby="inlineTitleId"
        aria-keyshortcuts="Control+K Meta+K"
        :aria-busy="inlineEditLoading ? 'true' : undefined"
        @keydown="onInlineEditKeydown"
      >
        <div class="rs-code-editor__inline-edit-head">
          <span :id="inlineTitleId">{{ t('codeEditor.inlineEdit') }}</span>
          <kbd>{{ inlineShortcut }}</kbd>
        </div>
        <p class="rs-code-editor__inline-preview">{{ inlineEditPreview }}</p>
        <input
          ref="inlineEditInputRef"
          v-model="inlineEditInstruction"
          class="rs-code-editor__inline-input"
          type="text"
          :placeholder="t('codeEditor.inlineEditPlaceholder')"
          :disabled="inlineEditLoading"
          @keydown.enter.prevent="submitInlineEdit"
        />
        <p v-if="inlineEditError" class="rs-code-editor__inline-error" role="alert">{{ inlineEditError }}</p>
        <div class="rs-code-editor__inline-actions">
          <button type="button" class="rs-code-editor__inline-btn" :disabled="inlineEditLoading" @click="closeInlineEdit">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="rs-code-editor__inline-btn rs-code-editor__inline-btn--primary"
            :disabled="inlineEditLoading || !inlineEditInstruction.trim()"
            @click="submitInlineEdit"
          >
            {{ inlineEditLoading ? t('codeEditor.inlineEditApplying') : t('codeEditor.inlineEditApply') }}
          </button>
        </div>
      </div>
    </div>
    <ul
      v-if="diagnostics.length"
      class="rs-code-editor__diagnostics"
      :aria-label="t('codeEditor.diagnostics')"
    >
      <li
        v-for="(diagnostic, index) in diagnostics"
        :key="index"
        :class="`rs-code-editor__diagnostic--${diagnostic.severity ?? 'error'}`"
      >
        <button type="button" class="rs-code-editor__diagnostic-btn" @click="jumpToDiagnostic(diagnostic)">
          <span v-if="diagnostic.line">{{ diagnostic.line }}:{{ diagnostic.column ?? 1 }}</span>
          {{ diagnostic.message }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rs-code-editor {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-input-bg);
  color: var(--rs-text-primary);
}
.rs-code-editor--square {
  border-radius: 0;
}
.rs-code-editor--embedded {
  border: 0;
  border-radius: 0;
  background: transparent;
  flex: 1 1 auto;
  min-block-size: 0;
  inline-size: 100%;
}
.rs-code-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  border-block-end: 1px solid var(--rs-border-subtle);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
}
.rs-code-editor__body {
  position: relative;
  flex: 1;
  min-block-size: 0;
  display: flex;
  flex-direction: column;
}
.rs-code-editor__surface {
  flex: 1;
  min-block-size: 0;
  overflow: hidden;
}
.rs-code-editor--embedded .rs-code-editor__body,
.rs-code-editor--embedded .rs-code-editor__surface {
  block-size: 100%;
}
.rs-code-editor__inline-edit {
  position: absolute;
  z-index: var(--rs-z-dropdown);
  inset-block-start: 12%;
  inset-inline: 0;
  inline-size: min(var(--rs-code-editor-inline-width), calc(100% - 2 * var(--rs-space-lg)));
  margin-inline: auto;
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow-lg);
}
.rs-code-editor__inline-edit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-text-primary);
}
.rs-code-editor__inline-edit-head kbd {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-xs);
  border-radius: var(--rs-radius-xs);
  border: 1px solid var(--rs-border-subtle);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}
.rs-code-editor__inline-preview {
  margin: 0;
  margin-block-end: var(--rs-space-sm);
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  border-radius: var(--rs-radius-xs);
  background: color-mix(in srgb, var(--rs-text-secondary) 8%, transparent);
  color: var(--rs-text-secondary);
  font-family: var(--rs-code-font-family, var(--rs-font-mono));
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
  white-space: pre-wrap;
  max-block-size: 4.5rem;
  overflow: hidden;
}
.rs-code-editor__inline-input {
  inline-size: 100%;
  box-sizing: border-box;
  margin-block-end: var(--rs-space-sm);
  padding-block: var(--rs-space-sm);
  padding-inline: var(--rs-space-sm);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-input-bg);
  color: var(--rs-text-primary);
  font-size: var(--rs-font-size-sm);
  font-family: inherit;
}
.rs-code-editor__inline-input:focus-visible,
.rs-code-editor__inline-btn:focus-visible,
.rs-code-editor__diagnostic-btn:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: 1px;
}
.rs-code-editor__inline-error {
  margin: 0;
  margin-block-end: var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-danger);
}
.rs-code-editor__inline-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--rs-space-xs);
}
.rs-code-editor__inline-btn {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-text-primary);
  font-size: var(--rs-font-size-xs);
  font-family: inherit;
  cursor: pointer;
}
.rs-code-editor__inline-btn--primary {
  border-color: var(--rs-primary);
  background: var(--rs-primary);
  color: var(--rs-primary-foreground);
}
.rs-code-editor__inline-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rs-code-editor__surface--disabled {
  opacity: 0.6;
  pointer-events: none;
}
.rs-code-editor__surface :deep(.cm-editor) {
  /* CodeMirror 自己写 height / width / border-right，逻辑属性盖不住。 */
  height: 100%;
  background: var(--rs-surface-elevated) !important;
}
.rs-code-editor__surface :deep(.cm-scroller) {
  font-family: var(--rs-code-font-family, var(--rs-font-mono));
  font-size: var(--rs-code-font-size, var(--rs-font-size-sm));
  line-height: var(--rs-code-line-height, var(--rs-line-height-relaxed));
}
.rs-code-editor__surface :deep(.cm-gutters) {
  background: color-mix(in srgb, var(--rs-surface-elevated) 85%, var(--rs-border) 15%) !important;
  border-right-color: var(--rs-border-subtle) !important;
  color: var(--rs-text-secondary);
}
.rs-code-editor--embedded .rs-code-editor__surface :deep(.cm-editor) {
  height: 100%;
  background: transparent !important;
}
.rs-code-editor--no-fold .rs-code-editor__surface :deep(.cm-foldGutter) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
}
.rs-code-editor--gutter-fixed .rs-code-editor__surface :deep(.cm-gutters) {
  min-width: var(--rs-code-editor-gutter-width);
}
.rs-code-editor--gutter-fixed.rs-code-editor--no-fold .rs-code-editor__surface :deep(.cm-lineNumbers) {
  min-width: var(--rs-code-editor-gutter-width);
}
.rs-code-editor--gutter-fixed.rs-code-editor--no-fold .rs-code-editor__surface :deep(.cm-lineNumbers .cm-gutterElement) {
  min-width: calc(var(--rs-code-editor-gutter-width) - var(--rs-space-sm));
}
.rs-code-editor__surface :deep(.cm-content) {
  color: var(--rs-text-primary);
}
.rs-code-editor__surface :deep(.cm-lintRange-error) {
  background: color-mix(in srgb, var(--rs-danger) 12%, transparent);
}
.rs-code-editor__surface :deep(.cm-lintRange-warning) {
  background: color-mix(in srgb, var(--rs-warning) 12%, transparent);
}
.rs-code-editor__surface :deep(.cm-lintRange-info) {
  background: color-mix(in srgb, var(--rs-info) 10%, transparent);
}
.rs-code-editor__surface :deep(.rs-code-editor__ghost) {
  color: var(--rs-text-secondary);
  opacity: 0.55;
  pointer-events: none;
}
.rs-code-editor__surface :deep(.rs-code-editor__hover) {
  max-inline-size: var(--rs-code-editor-inline-width);
  padding-block: var(--rs-space-sm);
  padding-inline: var(--rs-space-sm);
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface-elevated);
  color: var(--rs-text-primary);
  font-family: var(--rs-code-font-family, var(--rs-font-mono));
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  white-space: pre-wrap;
  box-shadow: var(--rs-shadow);
}
.rs-code-editor__diagnostics {
  margin: 0;
  padding-block: var(--rs-space-sm);
  padding-inline: var(--rs-space-md);
  border-block-start: 1px solid var(--rs-border-subtle);
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-xs);
  list-style: none;
}
.rs-code-editor__diagnostic-btn {
  display: block;
  inline-size: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.rs-code-editor__diagnostic--error {
  color: var(--rs-danger);
}
.rs-code-editor__diagnostic--warning {
  color: var(--rs-warning);
}
.rs-code-editor__diagnostic--info {
  color: var(--rs-info);
}
</style>
