export { default as RsCodeEditor } from './src/RsCodeEditor.vue'
export { resolveCodeMirrorLanguage, isCodeMirrorLightTheme, prewarmCodeMirrorEditor } from './src/code-mirror-lang'
export type {
  RsCodeEditorDiagnostic,
  RsCodeEditorExpose,
  RsCodeEditorLanguage,
  RsCodeEditorSqlColumn,
  RsCodeEditorSqlConfig,
  RsCodeEditorSqlDialect,
  RsCodeEditorSqlNamespace,
  RsCodeEditorTheme,
  RsResolvedCodeEditorTheme,
} from './src/code-editor-utils'
export {
  codeEditorLanguageLabel,
  readDocumentTheme,
  resolveCodeEditorLanguage,
  resolveCodeEditorSize,
  resolveCodeEditorTheme,
} from './src/code-editor-utils'
