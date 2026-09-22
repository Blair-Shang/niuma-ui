import type * as Monaco from 'monaco-editor'
import {
  MONACO_CLICKHOUSE_LANGUAGE,
  MONACO_DAMENG_LANGUAGE,
  MONACO_KINGBASE_LANGUAGE,
  MONACO_MONGODB_SHELL_LANGUAGE,
  MONACO_MYSQL_LANGUAGE,
  MONACO_ORACLE_LANGUAGE,
  MONACO_POSTGRESQL_LANGUAGE,
  MONACO_SQLITE_LSP_LANGUAGE,
  MONACO_SQLSERVER_LANGUAGE,
} from '../../../monaco/languages'
import { readCodeFontFamily, readCodeFontSizePx, readCssLengthPx, readCssVar } from '../../../theme/css-token'

/** 实例级补全片段（仅作用于当前编辑器 Model）。 */
export interface MonacoCompletionSnippet {
  label: string
  insertText: string
  detail?: string
  documentation?: string
  filterText?: string
  sortText?: string
  kind?: 'snippet' | 'keyword' | 'property' | 'field' | 'function' | 'value'
  preselect?: boolean
}

/** MonacoCompletionContext 描述一次补全请求的编辑器上下文。 */
export interface MonacoCompletionContext {
  text: string
  offset: number
  line: number
  column: number
  prefix: string
  triggerCharacter?: string
}

/** MonacoCompletionRequest 按当前文本和光标位置返回实例级候选。 */
export type MonacoCompletionRequest = (
  context: MonacoCompletionContext,
) => MonacoCompletionSnippet[] | Promise<MonacoCompletionSnippet[]>

/** 补全前缀解析：由业务侧按方言注入，默认按标识符切词。 */
export type MonacoCompletionPrefixResolver = (linePrefix: string) => string

/**
 * RsMonacoEditor 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsMonacoEditor>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsMonacoEditorExpose {
  format: () => void
  getEditor: () => Monaco.editor.IStandaloneCodeEditor | null
  revealLine: (line: number) => void
  focus: () => void
  blur: () => void
}

export type RsMonacoEditorInstance = RsMonacoEditorExpose

/** `light` / `vs-dark` 是公开取值；实际主题名是带 token 色的 rs-light / rs-dark。 */
export type RsMonacoEditorTheme = 'auto' | 'vs-dark' | 'light'

export const RS_MONACO_THEME_LIGHT = 'rs-light'
export const RS_MONACO_THEME_DARK = 'rs-dark'
export const RS_MONACO_SCHEMA_PREFIX = 'inmemory://rs-monaco/'

export interface MonacoJsonSchemaEntry {
  uri: string
  fileMatch?: string[]
  schema?: unknown
}

export interface MonacoCompletionBinding {
  language: string
  triggers: readonly string[]
  provide: Monaco.languages.CompletionItemProvider['provideCompletionItems']
}

const MANAGED_SQL = new Set<string>([
  MONACO_MYSQL_LANGUAGE,
  MONACO_DAMENG_LANGUAGE,
  MONACO_KINGBASE_LANGUAGE,
  MONACO_POSTGRESQL_LANGUAGE,
  MONACO_CLICKHOUSE_LANGUAGE,
  MONACO_SQLITE_LSP_LANGUAGE,
  MONACO_SQLSERVER_LANGUAGE,
  MONACO_ORACLE_LANGUAGE,
])

const SNIPPET_LANGUAGES = new Set<string>([
  'javascript',
  'typescript',
  MONACO_MONGODB_SHELL_LANGUAGE,
  'plaintext',
  'sql',
  'yaml',
  'json',
])

/** Bridge LSP 接管补全；勿再注册实例级 Provider。 */
export function isManagedSqlDialect(language: string | undefined): boolean {
  return language != null && MANAGED_SQL.has(language)
}

export function completionLanguages(language: string | undefined): string[] {
  if (!language || isManagedSqlDialect(language) || !SNIPPET_LANGUAGES.has(language)) return []
  return [language]
}

export function resolveMonacoHeight(height: number | string | undefined): string {
  if (typeof height === 'number' && Number.isFinite(height)) return `${height}px`
  if (typeof height === 'string' && height.trim()) return height
  return '100%'
}

/** 未写 data-rs-theme 时跟全库浅色，不把缺省当成深色。 */
export function readDocumentRsTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.rsTheme === 'dark' ? 'dark' : 'light'
}

export function resolveMonacoThemeName(
  theme: RsMonacoEditorTheme | undefined,
  documentTheme: 'light' | 'dark',
): string {
  if (theme === 'light') return RS_MONACO_THEME_LIGHT
  if (theme === 'vs-dark') return RS_MONACO_THEME_DARK
  return documentTheme === 'dark' ? RS_MONACO_THEME_DARK : RS_MONACO_THEME_LIGHT
}

export function monacoThemeBase(themeName: string): 'vs' | 'vs-dark' {
  return themeName === RS_MONACO_THEME_LIGHT ? 'vs' : 'vs-dark'
}

export function resolveMonacoLineHeight(fontSize: number, lineHeightRaw: string): number {
  const ratio = Number.parseFloat(lineHeightRaw)
  const safe = Number.isFinite(ratio) && ratio > 0 ? ratio : 1.625
  const size = Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 14
  return Math.max(1, Math.round(size * safe))
}

export function resolveCompletionPrefix(line: string, resolver?: MonacoCompletionPrefixResolver): string {
  if (resolver) return resolver(line)
  let start = line.length
  while (start > 0 && /[\w$.-]/.test(line[start - 1] ?? '')) start -= 1
  return line.slice(start)
}

export function completionReplaceRange(lineNumber: number, column: number, prefix: string): {
  startLineNumber: number
  endLineNumber: number
  startColumn: number
  endColumn: number
} {
  const safeColumn = Number.isFinite(column) ? Math.max(1, column) : 1
  const safeLine = Number.isFinite(lineNumber) ? Math.max(1, lineNumber) : 1
  return {
    startLineNumber: safeLine,
    endLineNumber: safeLine,
    startColumn: Math.max(1, safeColumn - prefix.length),
    endColumn: safeColumn,
  }
}

/** 合并业务侧 options；suggest 做一层浅合并，避免整对象覆盖默认。 */
export function mergeMonacoEditorOptions(
  overrides: Record<string, unknown> | undefined,
  language: string | undefined,
): Record<string, unknown> {
  if (!overrides) return {}
  const out: Record<string, unknown> = { ...overrides }
  if (overrides.suggest && typeof overrides.suggest === 'object' && !Array.isArray(overrides.suggest)) {
    out.suggest = {
      snippetsPreventQuickSuggestions: false,
      filterGraceful: !isManagedSqlDialect(language),
      matchOnWordStartOnly: isManagedSqlDialect(language),
      ...(overrides.suggest as Record<string, unknown>),
    }
  }
  return out
}

export function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function monacoMotionOptions(reduced: boolean): {
  smoothScrolling: boolean
  cursorSmoothCaretAnimation: 'on' | 'off'
} {
  if (reduced) return { smoothScrolling: false, cursorSmoothCaretAnimation: 'off' }
  return { smoothScrolling: true, cursorSmoothCaretAnimation: 'on' }
}

function expandHex(value: string): string | null {
  const body = value.slice(1)
  if (!/^[0-9a-f]+$/i.test(body)) return null
  if (body.length === 3 || body.length === 4) {
    return `#${[...body].map((ch) => ch + ch).join('').toLowerCase()}`
  }
  if (body.length === 6 || body.length === 8) return `#${body.toLowerCase()}`
  return null
}

function channelByte(raw: string | undefined): number | null {
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(255, Math.round(n)))
}

function rgbToHex(value: string): string | null {
  const open = value.indexOf('(')
  const close = value.lastIndexOf(')')
  if (open < 0 || close <= open) return null
  const parts = value.slice(open + 1, close).trim().split(/[,\s/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const r = channelByte(parts[0])
  const g = channelByte(parts[1])
  const b = channelByte(parts[2])
  if (r == null || g == null || b == null) return null
  const hex2 = (n: number) => n.toString(16).padStart(2, '0')
  const rawAlpha = parts[3]
  if (!rawAlpha) return `#${hex2(r)}${hex2(g)}${hex2(b)}`
  const alpha = rawAlpha.endsWith('%') ? Number(rawAlpha.slice(0, -1)) / 100 : Number(rawAlpha)
  if (!Number.isFinite(alpha)) return null
  const a = Math.max(0, Math.min(255, Math.round(Math.max(0, Math.min(1, alpha)) * 255)))
  if (a === 255) return `#${hex2(r)}${hex2(g)}${hex2(b)}`
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a)}`
}

/** Monaco 主题色只收 hex。rgb()/rgba() 在这里转成 #rrggbb / #rrggbbaa。 */
export function cssColorToHex(input: string): string | null {
  const value = input.trim()
  if (value.startsWith('#')) return expandHex(value)
  if (value.startsWith('rgb')) return rgbToHex(value)
  return null
}

const THEME_COLOR_IDS = {
  background: 'editor.background',
  foreground: 'editor.foreground',
  gutter: 'editorGutter.background',
  gutterForeground: 'editorLineNumber.foreground',
  lineHighlight: 'editor.lineHighlightBackground',
  selection: 'editor.selectionBackground',
  widget: 'editorWidget.background',
  widgetBorder: 'editorWidget.border',
} as const

export function buildMonacoThemeColors(
  raw: Partial<Record<keyof typeof THEME_COLOR_IDS, string>>,
): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const key of Object.keys(THEME_COLOR_IDS) as (keyof typeof THEME_COLOR_IDS)[]) {
    const hex = cssColorToHex(raw[key] ?? '')
    if (hex) colors[THEME_COLOR_IDS[key]] = hex
  }
  return colors
}

export function readMonacoThemeColors(el?: HTMLElement | null): Record<string, string> {
  const pick = (token: string, fallback: string) => readCssVar(token, el) || readCssVar(fallback, el)
  return buildMonacoThemeColors({
    background: pick('--rs-monaco-bg', '--rs-surface-elevated'),
    foreground: pick('--rs-monaco-fg', '--rs-text-primary'),
    gutter: pick('--rs-monaco-gutter', '--rs-surface'),
    gutterForeground: pick('--rs-monaco-gutter-fg', '--rs-text-tertiary'),
    lineHighlight: pick('--rs-monaco-line-highlight', '--rs-surface-hover'),
    selection: pick('--rs-monaco-selection', '--rs-primary-container'),
    widget: pick('--rs-monaco-widget-bg', '--rs-surface-elevated'),
    widgetBorder: pick('--rs-monaco-widget-border', '--rs-border'),
  })
}

export function readMonacoMetrics(el?: HTMLElement | null): {
  fontFamily: string
  fontSize: number
  lineHeight: number
  padding: number
  scrollbarSize: number
  glyphWidth: number
  decorationWidth: number
} {
  const fontSize = readCodeFontSizePx(el)
  const ratio = readCssVar('--rs-code-line-height', el) || readCssVar('--rs-line-height-relaxed', el)
  return {
    fontFamily: readCodeFontFamily(el),
    fontSize,
    lineHeight: resolveMonacoLineHeight(fontSize, ratio),
    padding: readCssLengthPx('--rs-monaco-padding', 8, el),
    scrollbarSize: readCssLengthPx('--rs-monaco-scrollbar-size', 8, el),
    glyphWidth: readCssLengthPx('--rs-monaco-glyph-width', 16, el),
    decorationWidth: readCssLengthPx('--rs-monaco-decoration-width', 4, el),
  }
}

let modelUriSeq = 0

export function createMonacoModelUri(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') {
    return `${RS_MONACO_SCHEMA_PREFIX}${cryptoApi.randomUUID()}.json`
  }
  modelUriSeq += 1
  return `${RS_MONACO_SCHEMA_PREFIX}fallback-${Date.now().toString(36)}-${modelUriSeq.toString(36)}.json`
}

const ownedSchemas = new Map<string, object>()

export function setOwnedMonacoJsonSchema(uri: string, schema: object | null): void {
  if (!uri) return
  if (schema) ownedSchemas.set(uri, schema)
  else ownedSchemas.delete(uri)
}

/** 外部 schema 保留；本组件的 uri 只来自这份登记，避免两个编辑器交错写丢。 */
export function mergeMonacoJsonSchemas(
  existing: readonly MonacoJsonSchemaEntry[] | undefined,
): MonacoJsonSchemaEntry[] {
  const external = (existing ?? []).filter((item) => !item.uri.startsWith(RS_MONACO_SCHEMA_PREFIX))
  const owned = [...ownedSchemas.entries()].map(([uri, schema]) => ({
    uri,
    fileMatch: [uri],
    schema,
  }))
  return [...external, ...owned]
}

export function resetOwnedMonacoJsonSchemasForTests(): void {
  ownedSchemas.clear()
}

const themeListeners = new Set<() => void>()
let themeObserver: MutationObserver | null = null

/** 多个编辑器共用一个 MutationObserver，最后一个卸载才断开。 */
export function subscribeDocumentTheme(listener: () => void): () => void {
  themeListeners.add(listener)
  if (
    themeListeners.size === 1
    && themeObserver == null
    && typeof document !== 'undefined'
    && typeof MutationObserver !== 'undefined'
  ) {
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
    if (themeListeners.size === 0) {
      themeObserver?.disconnect()
      themeObserver = null
    }
  }
}

export function resetDocumentThemeSubscriptionForTests(): void {
  themeObserver?.disconnect()
  themeObserver = null
  themeListeners.clear()
}

export function subscribeReducedMotion(listener: (reduced: boolean) => void): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const query = matchMedia('(prefers-reduced-motion: reduce)')
  const onChange = () => listener(query.matches)
  query.addEventListener?.('change', onChange)
  return () => query.removeEventListener?.('change', onChange)
}

let appliedThemeSignature = ''

/** defineTheme 可重复；setTheme 是进程级的，签名没变就不再刷。 */
export function applySharedMonacoTheme(
  monaco: MonacoNamespace,
  themeName: string,
  colors: Record<string, string>,
): void {
  monaco.editor.defineTheme(themeName, {
    base: monacoThemeBase(themeName),
    inherit: true,
    rules: [],
    colors,
  })
  const signature = `${themeName}:${JSON.stringify(colors)}`
  if (signature === appliedThemeSignature) return
  appliedThemeSignature = signature
  monaco.editor.setTheme(themeName)
}

export function resetSharedMonacoThemeForTests(): void {
  appliedThemeSignature = ''
}

type MonacoNamespace = typeof import('monaco-editor')

interface CompletionRegistration {
  dispose: () => void
  signature: string
}

const completionBridges = new Map<string, MonacoCompletionBinding>()
const completionRegistrations = new Map<string, CompletionRegistration>()

function completionTriggersByLanguage(): Map<string, Set<string>> {
  const triggersByLanguage = new Map<string, Set<string>>()
  for (const item of completionBridges.values()) {
    let set = triggersByLanguage.get(item.language)
    if (!set) {
      set = new Set()
      triggersByLanguage.set(item.language, set)
    }
    for (const ch of item.triggers) {
      if (ch) set.add(ch)
    }
  }
  return triggersByLanguage
}

function dropUnusedCompletionLanguages(triggersByLanguage: Map<string, Set<string>>): void {
  for (const [language, registration] of completionRegistrations) {
    if (!triggersByLanguage.has(language)) {
      registration.dispose()
      completionRegistrations.delete(language)
    }
  }
}

function ensureCompletionLanguage(
  monaco: MonacoNamespace,
  language: string,
  triggers: Set<string>,
): void {
  const signature = [...triggers].sort((left, right) => left.localeCompare(right)).join('\n')
  const current = completionRegistrations.get(language)
  if (current?.signature === signature) return
  current?.dispose()
  const disposable = monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: [...triggers],
    provideCompletionItems: (model, position, context, token) => {
      const found = completionBridges.get(model.uri.toString())
      if (found?.language !== language) return { suggestions: [] }
      return found.provide(model, position, context, token)
    },
  })
  completionRegistrations.set(language, {
    dispose: () => disposable.dispose(),
    signature,
  })
}

/**
 * 每种语言只注册一个 Provider，按 model uri 分发。
 * 避免 N 个编辑器各挂一个、卸载时只丢掉最后一个。
 */
export function syncMonacoCompletionProvider(
  monaco: MonacoNamespace,
  modelUri: string,
  binding: MonacoCompletionBinding | null,
): void {
  if (!modelUri) return
  if (binding) completionBridges.set(modelUri, binding)
  else completionBridges.delete(modelUri)
  const triggersByLanguage = completionTriggersByLanguage()
  dropUnusedCompletionLanguages(triggersByLanguage)
  for (const [language, triggers] of triggersByLanguage) {
    ensureCompletionLanguage(monaco, language, triggers)
  }
}

export function resetMonacoCompletionProvidersForTests(): void {
  for (const registration of completionRegistrations.values()) registration.dispose()
  completionRegistrations.clear()
  completionBridges.clear()
}
