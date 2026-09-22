import { readResolvedTheme } from '../../../theme/apply'

export type RsCodeEditorLanguage =
  | 'plaintext'
  | 'json'
  | 'typescript'
  | 'javascript'
  | 'css'
  | 'html'
  | 'xml'
  | 'sql'
  | 'go'
  | 'python'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'c'
  | 'shell'
  | 'yaml'
  | 'toml'
  | 'markdown'
  | 'vue'

export type RsCodeEditorTheme = 'auto' | 'light' | 'dark'
export type RsResolvedCodeEditorTheme = 'light' | 'dark'

export interface RsCodeEditorDiagnostic {
  message: string
  line?: number
  column?: number
  severity?: 'error' | 'warning' | 'info'
}

/** CodeMirror SQL 字段/表补全（对应 @codemirror/lang-sql SQLConfig 子集） */
export type RsCodeEditorSqlDialect = 'postgresql' | 'standard' | 'mysql'

export interface RsCodeEditorSqlColumn {
  label: string
  /** 展示用类型，如 integer / text */
  detail?: string
  type?: string
  boost?: number
}

export type RsCodeEditorSqlNamespace =
  | readonly (string | RsCodeEditorSqlColumn)[]
  | { [name: string]: RsCodeEditorSqlNamespace }

export interface RsCodeEditorSqlConfig {
  dialect?: RsCodeEditorSqlDialect
  schema?: RsCodeEditorSqlNamespace
  /** 顶层直接补全该表列（适合 WHERE 片段） */
  defaultTable?: string
  defaultSchema?: string
}

const SUPPORTED_LANGUAGES: RsCodeEditorLanguage[] = [
  'plaintext', 'json', 'typescript', 'javascript', 'css', 'html', 'xml', 'sql',
  'go', 'python', 'rust', 'java', 'cpp', 'c', 'shell', 'yaml', 'toml', 'markdown', 'vue',
]

/** 语言 → 工具栏展示名称映射 */
const LANGUAGE_DISPLAY_NAME: Record<RsCodeEditorLanguage, string> = {
  plaintext: 'Plain Text',
  json: 'JSON',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  css: 'CSS',
  html: 'HTML',
  xml: 'XML',
  sql: 'SQL',
  go: 'Go',
  python: 'Python',
  rust: 'Rust',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  shell: 'Shell',
  yaml: 'YAML',
  toml: 'TOML',
  markdown: 'Markdown',
  vue: 'Vue',
}

export function resolveCodeEditorLanguage(language?: string): RsCodeEditorLanguage {
  return (SUPPORTED_LANGUAGES as string[]).includes(language ?? '')
    ? (language as RsCodeEditorLanguage)
    : 'plaintext'
}

export function codeEditorLanguageLabel(language?: string): string {
  const lang = resolveCodeEditorLanguage(language)
  return LANGUAGE_DISPLAY_NAME[lang] ?? lang
}

export function readDocumentTheme(): RsResolvedCodeEditorTheme {
  return readResolvedTheme()
}

export function resolveCodeEditorTheme(theme: RsCodeEditorTheme = 'auto'): RsResolvedCodeEditorTheme {
  return theme === 'auto' ? readDocumentTheme() : theme
}

export function resolveCodeEditorSize(height?: number | string): string {
  if (height === undefined) return '20rem'
  return typeof height === 'number' ? `${height}px` : height
}

/** 修饰键文案。Mac 显示 ⌘，其它显示 Ctrl。无 navigator 时按 Ctrl。 */
export function codeEditorModShortcut(key: string): string {
  if (typeof navigator === 'undefined') return `Ctrl+${key}`
  const platform = `${navigator.platform || ''} ${navigator.userAgent || ''}`
  return /Mac|iPhone|iPad|iPod/i.test(platform) ? `⌘${key}` : `Ctrl+${key}`
}

type ThemeListener = () => void

const themeListeners = new Set<ThemeListener>()
let themeObserver: MutationObserver | null = null

/**
 * 多个编辑器共用一个 MutationObserver。最后一个退订时断开。
 * 无 document / MutationObserver（SSR）时返回空操作。
 */
export function subscribeDocumentTheme(listener: ThemeListener): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }
  themeListeners.add(listener)
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      for (const fn of themeListeners) fn()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-rs-theme'],
    })
  }
  let active = true
  return () => {
    if (!active) return
    active = false
    themeListeners.delete(listener)
    if (themeListeners.size === 0 && themeObserver) {
      themeObserver.disconnect()
      themeObserver = null
    }
  }
}

export interface RsCodeEditorExpose {
  /** 跳到 1-based 行列并聚焦。编辑器未就绪时无操作。 */
  goToPosition: (line: number, column?: number) => void
  /** 聚焦编辑区。禁用或未就绪时无操作。 */
  focus: () => void
}
