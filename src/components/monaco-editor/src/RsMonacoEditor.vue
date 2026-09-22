<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import type { RsRadius } from '../../../theme/types'
import { applyMonacoDebugDecorations } from '../../../monaco/debug-decorations'
import { ensureMongodbShellLanguage, MONACO_MONGODB_SHELL_LANGUAGE } from '../../../monaco/languages'
/** VS Code 式调试装饰样式（断点 / 当前行）；业务组件勿再自定义 glyph CSS */
import '../../../monaco/debug-decorations.css'
import {
  applySharedMonacoTheme,
  completionLanguages,
  completionReplaceRange,
  createMonacoModelUri,
  isManagedSqlDialect,
  mergeMonacoEditorOptions,
  mergeMonacoJsonSchemas,
  monacoMotionOptions,
  prefersReducedMotion,
  readDocumentRsTheme,
  readMonacoMetrics,
  readMonacoThemeColors,
  resolveCompletionPrefix,
  resolveMonacoHeight,
  resolveMonacoThemeName,
  RS_MONACO_SCHEMA_PREFIX,
  setOwnedMonacoJsonSchema,
  subscribeDocumentTheme,
  subscribeReducedMotion,
  syncMonacoCompletionProvider,
  type MonacoCompletionSnippet,
  type MonacoJsonSchemaEntry,
  type RsMonacoEditorContextMenu,
  type RsMonacoEditorExpose,
} from './monaco-editor-utils'

export type {
  MonacoCompletionContext,
  MonacoCompletionPrefixResolver,
  MonacoCompletionRequest,
  MonacoCompletionSnippet,
  RsMonacoEditorContextMenu,
  RsMonacoEditorExpose,
  RsMonacoEditorInstance,
  RsMonacoEditorTheme,
} from './monaco-editor-utils'

defineOptions({ name: 'RsMonacoEditor' })

const props = withDefaults(
  defineProps<{
    language?: import('../../../monaco/languages').MonacoLanguage
    /** px 整数或 CSS 字符串如 '100%' / '20rem' */
    height?: number | string
    readonly?: boolean
    /** 不可编辑，且不再弹出只读提示。与 readonly 可同时开，disabled 优先锁 DOM。 */
    disabled?: boolean
    /** 深色/浅色：auto 跟随 documentElement 的 data-rs-theme。Monaco 主题是进程级的。 */
    theme?: 'auto' | 'vs-dark' | 'light'
    /** 是否显示 minimap */
    minimap?: boolean
    /**
     * 是否显示 glyph margin（VS Code 式断点槽）。
     * Monaco 无完整 DAP；断点/当前行靠 glyphMargin + decorations（与 VS Code 同源）。
     */
    glyphMargin?: boolean
    /**
     * 调试：当前执行行（1-based）。与 debugBreakpoints 一并交给公共装饰层渲染。
     */
    debugCurrentLine?: number
    /** 调试：断点行号列表（1-based，编辑器行号） */
    debugBreakpoints?: number[]
    /**
     * 嵌入面板：去掉自己的边框和底色，圆角跟父级，铺满父级。
     * height 仍生效；父级是 flex 时也会 flex: 1。
     */
    embedded?: boolean
    /** 外框圆角。embedded 时忽略，改跟父级。 */
    radius?: RsRadius
    /**
     * JSON Schema 对象（仅 language="json" 有效）。
     * 每个编辑器实例使用独立的 Model URI，schema 通过 fileMatch 精确绑定，
     * 不会污染其他 JSON 编辑器。
     */
    jsonSchema?: object
    /** 实例级补全片段（Ctrl+Space / 触发字符生效）。 */
    snippets?: MonacoCompletionSnippet[]
    /** 按光标上下文动态生成候选；设置后与 snippets 合并。 */
    completionRequest?: import('./monaco-editor-utils').MonacoCompletionRequest
    /** 自动触发动态补全的字符。 */
    completionTriggerCharacters?: string[]
    /**
     * 自定义补全前缀（决定替换范围）。
     * 默认按标识符字符切词；Mongo Shell / SQL 等方言由业务 composable 注入，勿写进本组件。
     */
    completionPrefixResolver?: import('./monaco-editor-utils').MonacoCompletionPrefixResolver
    /**
     * 覆盖/合并 Monaco Editor 构造选项（如 automaticLayout、suggest）。
     * 浅合并顶层；`suggest` 会与默认 suggest 再浅合并一层。
     * 请保持对象引用稳定，不要在模板里每次新建。
     */
    options?: Record<string, unknown>
    /** 空文档时的占位。不进 v-model。 */
    placeholder?: string
    /** 传给 Monaco 文本框的可访问名称。缺省走 monaco.label。 */
    ariaLabel?: string
    /** 根节点 id。不传时用 useId。 */
    id?: string
    /**
     * 原生右键菜单。默认开。
     * 关掉后不再弹出 Monaco 菜单，contextmenu 仍给出行、列和指针坐标。
     */
    contextMenu?: boolean
  }>(),
  {
    language: 'json',
    height: '100%',
    readonly: false,
    disabled: false,
    theme: 'auto',
    minimap: false,
    glyphMargin: false,
    debugCurrentLine: 0,
    debugBreakpoints: () => [],
    embedded: false,
    completionTriggerCharacters: () => ['"', '$', '{', ':', ','],
    contextMenu: true,
  },
)

const emit = defineEmits<{
  /** glyph 槽点击（仅 glyphMargin=true）；业务据此切换断点 */
  glyphMarginClick: [line: number]
  /** 文本区获得焦点 */
  focus: []
  /** 文本区失去焦点 */
  blur: []
  /** 编辑器完成创建（含 language 变化后的重建） */
  ready: []
  /** 右键。contextMenu 关闭时已拦住浏览器菜单。 */
  contextmenu: [event: RsMonacoEditorContextMenu]
}>()

const model = defineModel<string>({ default: '' })

const { t } = useRsI18n()
const autoId = useId()
const rootId = computed(() => props.id || autoId)
const resolvedAriaLabel = computed(() => props.ariaLabel || t('monaco.label'))
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'md')
const frameStyle = computed(() => ({
  height: resolveMonacoHeight(props.height),
  '--rs-monaco-radius': props.embedded ? 'inherit' : rsRadiusCss(resolvedRadius.value),
}))

const editorEl = ref<HTMLElement | null>(null)

let editor: monaco.editor.IStandaloneCodeEditor | null = null
let editorModel: monaco.editor.ITextModel | null = null
/** 每个 JSON 实例的唯一 schema URI，用于 fileMatch 精确匹配 */
let schemaUri = ''
let contentDisposable: monaco.IDisposable | null = null
let focusDisposable: monaco.IDisposable | null = null
let blurDisposable: monaco.IDisposable | null = null
let glyphClickDisposable: monaco.IDisposable | null = null
let contextMenuDisposable: monaco.IDisposable | null = null
let debugDecoIds: string[] = []
let suppressChange = false
let unmounted = false
let completionGeneration = 0
let unsubscribeTheme: (() => void) | null = null
let unsubscribeMotion: (() => void) | null = null

function syncDebugDecorations(): void {
  if (!editor || !props.glyphMargin) {
    if (editor && debugDecoIds.length) {
      debugDecoIds = editor.deltaDecorations(debugDecoIds, [])
    }
    return
  }
  debugDecoIds = applyMonacoDebugDecorations(editor, monaco, debugDecoIds, {
    currentLine: props.debugCurrentLine ?? 0,
    breakpointLines: props.debugBreakpoints ?? [],
  })
}

function bindGlyphClick(): void {
  glyphClickDisposable?.dispose()
  glyphClickDisposable = null
  if (!editor || !props.glyphMargin) return
  glyphClickDisposable = editor.onMouseDown((event) => {
    if (event.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) return
    const line = event.target.position?.lineNumber
    if (!line) return
    emit('glyphMarginClick', line)
  })
}

function bindContextMenu(): void {
  contextMenuDisposable?.dispose()
  contextMenuDisposable = null
  if (!editor) return
  contextMenuDisposable = editor.onContextMenu((event) => {
    if (!editor?.getOption(monaco.editor.EditorOption.contextmenu)) {
      event.event.preventDefault()
      event.event.stopPropagation()
    }
    const position = event.target.position
    const selection = editor?.getSelection()
    const selectedText = position && selection && editorModel && !selection.isEmpty() && selection.containsPosition(position)
      ? editorModel.getValueInRange(selection)
      : ''
    emit('contextmenu', {
      line: position?.lineNumber ?? 0,
      column: position?.column ?? 0,
      selectedText,
      x: event.event.browserEvent.clientX,
      y: event.event.browserEvent.clientY,
    })
  })
}

function publishJsonSchemas(): void {
  const defaults = monaco.json.jsonDefaults
  const existing = defaults.diagnosticsOptions
  const schemas = mergeMonacoJsonSchemas(existing.schemas as MonacoJsonSchemaEntry[] | undefined)
  const owned = schemas.some((item) => item.uri.startsWith(RS_MONACO_SCHEMA_PREFIX))
  defaults.setDiagnosticsOptions({
    ...existing,
    ...(owned ? { validate: true } : {}),
    schemas,
  })
}

function applyJsonSchema(): void {
  if (props.language === 'json' && props.jsonSchema && schemaUri) {
    setOwnedMonacoJsonSchema(schemaUri, props.jsonSchema)
  } else if (schemaUri) {
    setOwnedMonacoJsonSchema(schemaUri, null)
  }
  publishJsonSchemas()
}

function completionKind(kind: MonacoCompletionSnippet['kind']): monaco.languages.CompletionItemKind {
  switch (kind) {
    case 'keyword': return monaco.languages.CompletionItemKind.Keyword
    case 'property': return monaco.languages.CompletionItemKind.Property
    case 'field': return monaco.languages.CompletionItemKind.Field
    case 'function': return monaco.languages.CompletionItemKind.Function
    case 'value': return monaco.languages.CompletionItemKind.Value
    default: return monaco.languages.CompletionItemKind.Snippet
  }
}

function applySnippets(): void {
  const uri = editorModel?.uri.toString() ?? ''
  const languages = completionLanguages(props.language)
  const enabled = languages.length > 0 && Boolean(props.snippets?.length || props.completionRequest)
  if (!uri || !enabled) {
    if (uri) syncMonacoCompletionProvider(monaco, uri, null)
    return
  }
  const language = languages[0]
  if (!language) return
  const generation = completionGeneration
  syncMonacoCompletionProvider(monaco, uri, {
    language,
    triggers: props.completionTriggerCharacters ?? [],
    provide: async (textModel, position, context, token) => {
      if (generation !== completionGeneration || unmounted || token.isCancellationRequested) {
        return { suggestions: [] }
      }
      const linePrefix = textModel.getLineContent(position.lineNumber).slice(0, position.column - 1)
      const prefix = resolveCompletionPrefix(linePrefix, props.completionPrefixResolver)
      const range = completionReplaceRange(position.lineNumber, position.column, prefix)
      const dynamic = props.completionRequest
        ? await props.completionRequest({
          text: textModel.getValue(),
          offset: textModel.getOffsetAt(position),
          line: position.lineNumber,
          column: position.column,
          prefix,
          triggerCharacter: context.triggerCharacter,
        })
        : []
      if (generation !== completionGeneration || unmounted || token.isCancellationRequested) {
        return { suggestions: [] }
      }
      const snippets = [...(props.snippets ?? []), ...dynamic]
      return {
        incomplete: true,
        suggestions: snippets.map((snippet) => ({
          label: snippet.label,
          kind: completionKind(snippet.kind),
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: snippet.detail,
          documentation: snippet.documentation,
          filterText: snippet.filterText ?? snippet.label,
          sortText: snippet.sortText,
          preselect: snippet.preselect,
          range,
        })),
      }
    },
  })
}

function applyTheme(): void {
  if (!editor || !editorEl.value || unmounted) return
  const host = editorEl.value
  const metrics = readMonacoMetrics(host)
  const motion = monacoMotionOptions(prefersReducedMotion())
  editor.updateOptions({
    fontFamily: metrics.fontFamily,
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight,
    smoothScrolling: motion.smoothScrolling,
    cursorSmoothCaretAnimation: motion.cursorSmoothCaretAnimation,
    ariaLabel: resolvedAriaLabel.value,
  })
  const overrides = mergeMonacoEditorOptions(props.options, props.language)
  if (typeof overrides.theme === 'string') {
    monaco.editor.setTheme(overrides.theme)
    return
  }
  applySharedMonacoTheme(
    monaco,
    resolveMonacoThemeName(props.theme, readDocumentRsTheme()),
    readMonacoThemeColors(host),
  )
}

function disposeEditor(): void {
  completionGeneration += 1
  const uri = editorModel?.uri.toString() ?? ''
  if (uri) syncMonacoCompletionProvider(monaco, uri, null)
  const hadSchema = Boolean(schemaUri)
  if (schemaUri) setOwnedMonacoJsonSchema(schemaUri, null)
  contentDisposable?.dispose()
  contentDisposable = null
  focusDisposable?.dispose()
  focusDisposable = null
  blurDisposable?.dispose()
  blurDisposable = null
  glyphClickDisposable?.dispose()
  glyphClickDisposable = null
  contextMenuDisposable?.dispose()
  contextMenuDisposable = null
  debugDecoIds = []
  editor?.dispose()
  editorModel?.dispose()
  editor = null
  editorModel = null
  schemaUri = ''
  if (hadSchema) publishJsonSchemas()
}

function initEditor(): void {
  if (!editorEl.value || unmounted) return
  disposeEditor()
  const host = editorEl.value
  if (!host || unmounted) return

  if (props.language === MONACO_MONGODB_SHELL_LANGUAGE) {
    ensureMongodbShellLanguage(monaco)
  }

  const metrics = readMonacoMetrics(host)
  const motion = monacoMotionOptions(prefersReducedMotion())
  const overrides = mergeMonacoEditorOptions(props.options, props.language)
  const forcedTheme = typeof overrides.theme === 'string' ? overrides.theme : ''
  const themeName = forcedTheme || resolveMonacoThemeName(props.theme, readDocumentRsTheme())
  if (!forcedTheme) {
    applySharedMonacoTheme(monaco, themeName, readMonacoThemeColors(host))
  }

  schemaUri = props.language === 'json' ? createMonacoModelUri() : ''
  editorModel = monaco.editor.createModel(
    model.value,
    props.language,
    schemaUri ? monaco.Uri.parse(schemaUri) : undefined,
  )

  editor = monaco.editor.create(host, {
    model: editorModel,
    theme: themeName,
    readOnly: props.readonly || props.disabled,
    domReadOnly: props.disabled,
    ariaLabel: resolvedAriaLabel.value,
    placeholder: props.placeholder ?? '',
    automaticLayout: true,
    minimap: { enabled: props.minimap },
    scrollBeyondLastLine: false,
    fontFamily: metrics.fontFamily,
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight,
    tabSize: 2,
    wordWrap: 'on',
    bracketPairColorization: { enabled: true },
    padding: { top: metrics.padding, bottom: metrics.padding },
    renderLineHighlight: 'line',
    smoothScrolling: motion.smoothScrolling,
    cursorSmoothCaretAnimation: motion.cursorSmoothCaretAnimation,
    folding: true,
    glyphMargin: props.glyphMargin,
    lineNumbersMinChars: 3,
    lineDecorationsWidth: props.glyphMargin ? metrics.glyphWidth : metrics.decorationWidth,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    quickSuggestions: props.language === MONACO_MONGODB_SHELL_LANGUAGE
      ? { other: true, comments: false, strings: true }
      : true,
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: props.language === MONACO_MONGODB_SHELL_LANGUAGE || isManagedSqlDialect(props.language)
      ? 'off'
      : 'currentDocument',
    suggest: {
      snippetsPreventQuickSuggestions: false,
      filterGraceful: !isManagedSqlDialect(props.language),
      matchOnWordStartOnly: isManagedSqlDialect(props.language),
    },
    scrollbar: {
      verticalScrollbarSize: metrics.scrollbarSize,
      horizontalScrollbarSize: metrics.scrollbarSize,
    },
    fixedOverflowWidgets: true,
    ...overrides,
    contextmenu: props.contextMenu,
  })

  contentDisposable = editorModel.onDidChangeContent(() => {
    if (suppressChange) return
    const value = editorModel?.getValue() ?? ''
    if (value !== model.value) model.value = value
  })
  focusDisposable = editor.onDidFocusEditorText(() => emit('focus'))
  blurDisposable = editor.onDidBlurEditorText(() => emit('blur'))

  applyJsonSchema()
  applySnippets()
  bindGlyphClick()
  bindContextMenu()
  syncDebugDecorations()
  emit('ready')
}

onMounted(() => {
  unmounted = false
  initEditor()
  unsubscribeTheme = subscribeDocumentTheme(() => applyTheme())
  unsubscribeMotion = subscribeReducedMotion(() => applyTheme())
})

onUnmounted(() => {
  unmounted = true
  unsubscribeTheme?.()
  unsubscribeTheme = null
  unsubscribeMotion?.()
  unsubscribeMotion = null
  disposeEditor()
})

watch(
  () => model.value,
  (val) => {
    if (!editorModel || editorModel.getValue() === val) return
    suppressChange = true
    try {
      editorModel.setValue(val)
    } finally {
      suppressChange = false
    }
  },
)

watch(() => [props.readonly, props.disabled] as const, ([readonly, disabled]) => {
  editor?.updateOptions({ readOnly: readonly || disabled, domReadOnly: disabled })
})
watch(() => props.minimap, (val) => editor?.updateOptions({ minimap: { enabled: val } }))
watch(() => props.contextMenu, (val) => editor?.updateOptions({ contextmenu: val }))
watch(resolvedAriaLabel, (label) => editor?.updateOptions({ ariaLabel: label }))
watch(() => props.placeholder, (value) => editor?.updateOptions({ placeholder: value ?? '' }))
watch(
  () => props.glyphMargin,
  (val) => {
    const metrics = readMonacoMetrics(editorEl.value)
    editor?.updateOptions({
      glyphMargin: val,
      lineDecorationsWidth: val ? metrics.glyphWidth : metrics.decorationWidth,
    })
    bindGlyphClick()
    syncDebugDecorations()
  },
)
watch(
  () => [props.debugCurrentLine, props.debugBreakpoints] as const,
  () => syncDebugDecorations(),
  { deep: true },
)
watch(() => props.language, () => initEditor())
watch(() => props.theme, () => applyTheme())
watch(() => props.jsonSchema, () => applyJsonSchema(), { deep: true })
watch(() => props.snippets, () => applySnippets(), { deep: true })
watch(() => props.completionRequest, () => applySnippets())
watch(() => props.completionTriggerCharacters, () => applySnippets(), { deep: true })
watch(() => props.completionPrefixResolver, () => applySnippets())
watch(() => props.options, () => {
  if (!editor || !props.options) return
  editor.updateOptions({
    ...mergeMonacoEditorOptions(props.options, props.language),
    contextmenu: props.contextMenu,
  } as monaco.editor.IEditorOptions)
  applyTheme()
})

defineExpose<RsMonacoEditorExpose>({
  /** 格式化文档（等价于 Shift+Alt+F） */
  format(): void {
    editor?.getAction('editor.action.formatDocument')?.run().catch(() => undefined)
  },
  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return editor
  },
  /** 将指定行滚入视口中央（调试当前行） */
  revealLine(line: number): void {
    if (!editor || line <= 0) return
    editor.revealLineInCenter(line)
  },
  focus(): void {
    editor?.focus()
  },
  blur(): void {
    const node = editor?.getDomNode()
    if (!node) return
    const active = node.ownerDocument.activeElement
    if (active instanceof HTMLElement && node.contains(active)) active.blur()
  },
})
</script>

<template>
  <div
    :id="rootId"
    ref="editorEl"
    class="rs-monaco"
    :class="{ 'rs-monaco--embedded': embedded, 'rs-monaco--disabled': disabled }"
    :style="frameStyle"
    dir="ltr"
    :aria-disabled="disabled || undefined"
  />
</template>

<style scoped>
.rs-monaco {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--rs-monaco-border, var(--rs-border));
  border-radius: var(--rs-monaco-radius, var(--rs-radius));
  background: var(--rs-monaco-bg, var(--rs-surface-elevated));
  color: var(--rs-monaco-fg, var(--rs-text-primary));
}

.rs-monaco:not(.rs-monaco--embedded):focus-within {
  outline: var(--rs-focus-ring-width, 2px) solid var(--rs-focus-border);
  outline-offset: 1px;
}

.rs-monaco--embedded {
  border: 0;
  background: transparent;
  flex: 1 1 auto;
  min-block-size: 0;
}

.rs-monaco--disabled {
  opacity: var(--rs-monaco-disabled-opacity, 0.72);
}

:deep(.monaco-editor),
:deep(.monaco-editor .overflow-guard),
:deep(.monaco-editor .monaco-scrollable-element) {
  border-radius: inherit;
}

:deep(.monaco-editor .overflow-guard) {
  overflow: hidden;
}

:deep(.monaco-editor .find-widget) {
  z-index: var(--rs-z-dropdown);
}

@media (prefers-reduced-motion: reduce) {
  .rs-monaco:not(.rs-monaco--embedded):focus-within {
    outline-offset: 0;
  }
}
</style>
