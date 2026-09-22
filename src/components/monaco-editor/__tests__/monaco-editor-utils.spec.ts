import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as Monaco from 'monaco-editor'
import {
  applySharedMonacoTheme,
  buildMonacoThemeColors,
  completionLanguages,
  completionReplaceRange,
  createMonacoModelUri,
  cssColorToHex,
  isManagedSqlDialect,
  mergeMonacoEditorOptions,
  mergeMonacoJsonSchemas,
  monacoMotionOptions,
  readDocumentRsTheme,
  resetDocumentThemeSubscriptionForTests,
  resetMonacoCompletionProvidersForTests,
  resetOwnedMonacoJsonSchemasForTests,
  resetSharedMonacoThemeForTests,
  resolveCompletionPrefix,
  resolveMonacoHeight,
  resolveMonacoLineHeight,
  resolveMonacoThemeName,
  RS_MONACO_SCHEMA_PREFIX,
  RS_MONACO_THEME_DARK,
  RS_MONACO_THEME_LIGHT,
  setOwnedMonacoJsonSchema,
  subscribeDocumentTheme,
  syncMonacoCompletionProvider,
} from '../src/monaco-editor-utils'

afterEach(() => {
  resetDocumentThemeSubscriptionForTests()
  resetMonacoCompletionProvidersForTests()
  resetOwnedMonacoJsonSchemasForTests()
  resetSharedMonacoThemeForTests()
  document.documentElement.removeAttribute('data-rs-theme')
})

describe('monaco-editor-utils', () => {
  it('resolves height, theme, and line height without a dark default', () => {
    expect(resolveMonacoHeight(160)).toBe('160px')
    expect(resolveMonacoHeight('12rem')).toBe('12rem')
    expect(resolveMonacoHeight(undefined)).toBe('100%')
    expect(readDocumentRsTheme()).toBe('light')
    document.documentElement.dataset.rsTheme = 'dark'
    expect(readDocumentRsTheme()).toBe('dark')
    expect(resolveMonacoThemeName('auto', 'light')).toBe(RS_MONACO_THEME_LIGHT)
    expect(resolveMonacoThemeName('auto', 'dark')).toBe(RS_MONACO_THEME_DARK)
    expect(resolveMonacoThemeName('light', 'dark')).toBe(RS_MONACO_THEME_LIGHT)
    expect(resolveMonacoThemeName('vs-dark', 'light')).toBe(RS_MONACO_THEME_DARK)
    expect(resolveMonacoLineHeight(16, '1.5')).toBe(24)
    expect(resolveMonacoLineHeight(16, 'nope')).toBe(26)
  })

  it('keeps snippet completion off managed SQL dialects', () => {
    expect(isManagedSqlDialect('mysql')).toBe(true)
    expect(isManagedSqlDialect('sql')).toBe(false)
    expect(isManagedSqlDialect('pgsql')).toBe(false)
    expect(completionLanguages('json')).toEqual(['json'])
    expect(completionLanguages('mysql')).toEqual([])
    expect(completionLanguages('pgsql')).toEqual([])
  })

  it('merges suggest options and clamps the completion range', () => {
    expect(resolveCompletionPrefix('db.user')).toBe('db.user')
    expect(resolveCompletionPrefix('db.user', () => 'user')).toBe('user')
    expect(completionReplaceRange(2, 4, 'abcdef')).toEqual({
      startLineNumber: 2,
      endLineNumber: 2,
      startColumn: 1,
      endColumn: 4,
    })
    const merged = mergeMonacoEditorOptions({
      wordWrap: 'off',
      suggest: { showIcons: false },
    }, 'json')
    expect(merged.wordWrap).toBe('off')
    expect(merged.suggest).toMatchObject({
      snippetsPreventQuickSuggestions: false,
      filterGraceful: true,
      showIcons: false,
    })
  })

  it('converts css colors and skips values Monaco cannot store', () => {
    expect(cssColorToHex('#abc')).toBe('#aabbcc')
    expect(cssColorToHex('rgb(38, 38, 38)')).toBe('#262626')
    expect(cssColorToHex('rgb(10 20 30 / 50%)')).toBe('#0a141e80')
    expect(cssColorToHex('var(--rs-text)')).toBeNull()
    expect(buildMonacoThemeColors({ background: '#111111', foreground: 'nope' })).toEqual({
      'editor.background': '#111111',
    })
    expect(monacoMotionOptions(true).cursorSmoothCaretAnimation).toBe('off')
    expect(monacoMotionOptions(false).smoothScrolling).toBe(true)
  })

  it('owns json schemas without dropping external ones', () => {
    setOwnedMonacoJsonSchema(`${RS_MONACO_SCHEMA_PREFIX}a.json`, { type: 'object' })
    setOwnedMonacoJsonSchema(`${RS_MONACO_SCHEMA_PREFIX}b.json`, { type: 'string' })
    const merged = mergeMonacoJsonSchemas([
      { uri: `${RS_MONACO_SCHEMA_PREFIX}stale.json`, schema: { type: 'null' } },
      { uri: 'file:///external.json', schema: { type: 'array' } },
    ])
    expect(merged.map((item) => item.uri)).toEqual([
      'file:///external.json',
      `${RS_MONACO_SCHEMA_PREFIX}a.json`,
      `${RS_MONACO_SCHEMA_PREFIX}b.json`,
    ])
    setOwnedMonacoJsonSchema(`${RS_MONACO_SCHEMA_PREFIX}a.json`, null)
    expect(mergeMonacoJsonSchemas([]).map((item) => item.uri)).toEqual([
      `${RS_MONACO_SCHEMA_PREFIX}b.json`,
    ])
  })

  it('shares one theme observer and one completion provider', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const stopFirst = subscribeDocumentTheme(first)
    const stopSecond = subscribeDocumentTheme(second)
    document.documentElement.setAttribute('data-rs-theme', 'dark')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(first).toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
    stopFirst()
    first.mockClear()
    second.mockClear()
    document.documentElement.setAttribute('data-rs-theme', 'light')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
    stopSecond()
    stopSecond()

    const defineTheme = vi.fn()
    const setTheme = vi.fn()
    const themeApi = { editor: { defineTheme, setTheme } } as unknown as typeof Monaco
    applySharedMonacoTheme(themeApi, RS_MONACO_THEME_LIGHT, { 'editor.background': '#ffffff' })
    applySharedMonacoTheme(themeApi, RS_MONACO_THEME_LIGHT, { 'editor.background': '#ffffff' })
    expect(defineTheme).toHaveBeenCalledTimes(2)
    expect(setTheme).toHaveBeenCalledTimes(1)

    const providers: { dispose: ReturnType<typeof vi.fn>; provide: (model: { uri: { toString(): string } }) => unknown }[] = []
    const completionApi = {
      languages: {
        registerCompletionItemProvider: (_language: string, provider: { provideCompletionItems: (model: { uri: { toString(): string } }) => unknown }) => {
          const dispose = vi.fn()
          providers.push({ dispose, provide: provider.provideCompletionItems })
          return { dispose }
        },
      },
    } as unknown as typeof Monaco
    const provideA = (() => ({ suggestions: [{ label: 'a' }] })) as unknown as Monaco.languages.CompletionItemProvider['provideCompletionItems']
    const provideB = (() => ({ suggestions: [{ label: 'b' }] })) as unknown as Monaco.languages.CompletionItemProvider['provideCompletionItems']
    syncMonacoCompletionProvider(completionApi, 'inmemory://a', {
      language: 'json',
      triggers: ['"'],
      provide: provideA,
    })
    syncMonacoCompletionProvider(completionApi, 'inmemory://b', {
      language: 'json',
      triggers: ['"'],
      provide: provideB,
    })
    expect(providers).toHaveLength(1)
    expect(providers[0]?.provide({ uri: { toString: () => 'inmemory://b' } })).toEqual({ suggestions: [{ label: 'b' }] })
    syncMonacoCompletionProvider(completionApi, 'inmemory://a', null)
    expect(providers[0]?.dispose).not.toHaveBeenCalled()
    expect(providers[0]?.provide({ uri: { toString: () => 'inmemory://a' } })).toEqual({ suggestions: [] })
    syncMonacoCompletionProvider(completionApi, 'inmemory://b', null)
    expect(providers[0]?.dispose).toHaveBeenCalledTimes(1)
    expect(createMonacoModelUri().startsWith(RS_MONACO_SCHEMA_PREFIX)).toBe(true)
  })
})

describe('RsMonacoEditor source', () => {
  it('does not import reka-ui and disposes editor resources', () => {
    const source = readFileSync('src/components/monaco-editor/src/RsMonacoEditor.vue', 'utf8')
    const utils = readFileSync('src/components/monaco-editor/src/monaco-editor-utils.ts', 'utf8')
    expect(source).toContain("defineOptions({ name: 'RsMonacoEditor' })")
    expect(source).not.toContain('reka-ui')
    expect(utils).not.toContain('reka-ui')
    expect(source).toContain('contentDisposable')
    expect(source).toContain('syncMonacoCompletionProvider')
    expect(source).toContain('subscribeDocumentTheme')
    expect(source).not.toContain('registerCompletionItemProvider')
    expect(source).toContain('dir="ltr"')
    expect(source).toContain('overflow: hidden')
    expect(source).toContain('useResolvedRsRadius')
  })
})
