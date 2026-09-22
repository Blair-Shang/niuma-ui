/**
 * Markdown 渲染：GFM + 安全链接/图片 + DOMPurify。
 * 面向说明、变更记录和表单。不含公式、图表和流式拼接。
 * renderMarkdown 是同步的，同一调用栈里不要重入。
 */
import { Marked } from 'marked'
import type { Tokens } from 'marked'
import DOMPurify from 'dompurify'
import type { RsCodeEditorTheme } from '../../code-editor/src/code-editor-utils'

export type RsMarkdownMode = 'edit' | 'preview' | 'split'

export type RsMarkdownRenderOptions = {
  /** GFM 换行（单个换行转 <br>），默认 true */
  breaks?: boolean
  /** 任务列表已完成的读屏文案。未传为英文 completed */
  taskDoneLabel?: string
  /** 任务列表未完成的读屏文案。未传为英文 not completed */
  taskOpenLabel?: string
  /** 新标签页链接的读屏后缀。未传为英文 opens in a new tab */
  externalLabel?: string
}

export interface RsMarkdownExpose {
  /** 编辑或分栏时聚焦源码；预览时聚焦预览面。禁用时无操作。 */
  focus: () => void
}

const MODES: RsMarkdownMode[] = ['edit', 'preview', 'split']

/** 预览跟手的合并间隔。切模式和首次绘制不走这段等待。 */
export const markdownPreviewDelayMs = 32

type RenderSession = {
  headings: Set<string>
  taskDone: string
  taskOpen: string
  external: string
}

let session: RenderSession = {
  headings: new Set(),
  taskDone: 'completed',
  taskOpen: 'not completed',
  external: 'opens in a new tab',
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function hasControlChar(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value)
}

export function isSafeHref(href: string): boolean {
  const value = href.trim()
  if (!value || hasControlChar(value) || value.includes('\\') || value.startsWith('//')) return false
  if (value.startsWith('#')) return true
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return /^(https?:|mailto:|tel:)/i.test(value)
  return true
}

function opensInNewTab(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href.trim())
}

/** 行内代码整段就是 http(s) 地址时，转成可点击链接（模型常用反引号包 URL）。 */
function isStandaloneHttpUrl(text: string): boolean {
  const value = text.trim()
  if (!value || /\s/.test(value)) return false
  if (!/^https?:\/\//i.test(value)) return false
  return isSafeHref(value)
}

function renderSafeLink(href: string, innerHtml: string, title?: string): string {
  const url = href.trim()
  if (!isSafeHref(url)) return innerHtml
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
  const external = opensInNewTab(url)
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : ''
  const hint = external
    ? `<span class="rs-markdown__sr"> ${escapeHtml(session.external)}</span>`
    : ''
  return `<a href="${escapeHtml(url)}"${titleAttr}${target}>${innerHtml}${hint}</a>`
}

const SAFE_RASTER_DATA = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp)(?:[;,])/i

export function isSafeImageSrc(src: string): boolean {
  const value = src.trim()
  if (!value || hasControlChar(value) || value.includes('\\') || value.startsWith('//')) return false
  if (/^data:/i.test(value)) return SAFE_RASTER_DATA.test(value)
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return /^https?:/i.test(value)
  return true
}

function sanitizeLang(lang: string | undefined): string {
  const raw = (lang ?? 'text').trim().split(/\s+/)[0] ?? 'text'
  return raw.replace(/[^\w.+#-]/g, '') || 'text'
}

export function slugMarkdownHeading(text: string, used: Set<string>): string {
  const plain = text.replace(/<[^>]+>/g, '').trim().normalize('NFKC')
  let slug = plain
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!slug) slug = 'section'
  const base = slug
  let n = 2
  while (used.has(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  used.add(slug)
  return slug
}

function renderCodeBlock(text: string, lang: string | undefined): string {
  const language = sanitizeLang(lang)
  const code = text.replace(/\n$/, '')
  return [
    `<div class="rs-markdown__codeblock" dir="ltr" data-rs-md-lang="${escapeHtml(language)}">`,
    `<div class="rs-markdown__code-head">`,
    `<span class="rs-markdown__code-lang">${escapeHtml(language)}</span>`,
    `</div>`,
    `<pre class="rs-markdown__pre"><code class="language-${escapeHtml(language)}">${escapeHtml(code)}</code></pre>`,
    `</div>`,
  ].join('')
}

function wrapTables(html: string): string {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
    return `<div class="rs-markdown__table-wrap">${table}</div>`
  })
}

function renderTaskMarker(checked: boolean): string {
  const on = checked ? ' rs-markdown__task--on' : ''
  const label = checked ? session.taskDone : session.taskOpen
  return `<span class="rs-markdown__task${on}" aria-hidden="true"></span><span class="rs-markdown__sr">${escapeHtml(label)}</span> `
}

function createMarked(breaks: boolean): Marked {
  return new Marked({
    gfm: true,
    breaks,
    renderer: {
      checkbox({ checked }) {
        return renderTaskMarker(Boolean(checked))
      },
      code({ text, lang }) {
        return renderCodeBlock(text, lang)
      },
      heading(this: { parser: { parseInline: (tokens: Tokens.Heading['tokens']) => string } }, token: Tokens.Heading) {
        const text = this.parser.parseInline(token.tokens)
        const id = slugMarkdownHeading(token.text, session.headings)
        const depth = token.depth
        return `<h${depth} id="${escapeHtml(id)}">${text}</h${depth}>`
      },
      link(
        this: { parser: { parseInline: (tokens: Tokens.Link['tokens']) => string } },
        token: Tokens.Link,
      ) {
        const text = this.parser.parseInline(token.tokens)
        return renderSafeLink(token.href ?? '', text, token.title ?? undefined)
      },
      codespan({ text }) {
        const inner = `<code>${escapeHtml(text)}</code>`
        if (!isStandaloneHttpUrl(text)) return inner
        return renderSafeLink(text.trim(), inner)
      },
      image({ href, title, text }) {
        const src = href?.trim() ?? ''
        if (!isSafeImageSrc(src)) return escapeHtml(text || '')
        const alt = escapeHtml(text || '')
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
        return `<img class="rs-markdown__img" src="${escapeHtml(src)}" alt="${alt}"${titleAttr} loading="lazy" decoding="async" />`
      },
    },
  })
}

const markedCache = new Map<boolean, Marked>()

function getMarked(breaks: boolean): Marked {
  const cached = markedCache.get(breaks)
  if (cached) return cached
  const instance = createMarked(breaks)
  markedCache.set(breaks, instance)
  return instance
}

function beginSession(options?: RsMarkdownRenderOptions): void {
  session = {
    headings: new Set(),
    taskDone: options?.taskDoneLabel?.trim() || 'completed',
    taskOpen: options?.taskOpenLabel?.trim() || 'not completed',
    external: options?.externalLabel?.trim() || 'opens in a new tab',
  }
}

function canSanitizeMarkdown(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 将 Markdown 转为可安全注入的 HTML（必须配合 v-html 使用消毒结果）。
 * 无 window 时返回空字符串，不抛错。
 */
export function renderMarkdown(source = '', options?: RsMarkdownRenderOptions): string {
  if (!source.trim()) return ''
  if (!canSanitizeMarkdown()) return ''
  beginSession(options)
  const breaks = options?.breaks !== false
  const dirty = wrapTables(getMarked(breaks).parse(source, { async: false }) as string)
  return sanitizeMarkdownHtml(dirty)
}

/** 行内 Markdown（不包 <p>），供对话里夹杂公式的片段使用。 */
export function renderMarkdownInline(source = ''): string {
  if (!source) return ''
  if (!canSanitizeMarkdown()) return ''
  beginSession()
  const dirty = getMarked(true).parseInline(source, { async: false }) as string
  return sanitizeMarkdownHtml(dirty)
}

function sanitizeMarkdownHtml(dirty: string): string {
  if (!dirty || !canSanitizeMarkdown()) return ''
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['input', 'form', 'textarea', 'select', 'option', 'button'],
    ADD_ATTR: [
      'class',
      'target',
      'rel',
      'loading',
      'decoding',
      'alt',
      'src',
      'dir',
      'data-rs-md-lang',
      'align',
      'start',
    ],
  })
}

export function resolveMarkdownHeight(height?: number | string): string {
  if (height === undefined) return '16rem'
  return typeof height === 'number' ? `${height}px` : height
}

export function resolveMarkdownMode(
  mode: RsMarkdownMode | undefined,
  readonly: boolean,
): RsMarkdownMode {
  if (readonly) return 'preview'
  return mode ?? 'edit'
}

/** 横向标签栏。左右键在 RTL 下对调。不处理的键返回 null。 */
export function resolveMarkdownTabMove(key: string, rtl = false): number | 'start' | 'end' | null {
  if (key === 'Home') return 'start'
  if (key === 'End') return 'end'
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  if (key === 'ArrowRight') return rtl ? -1 : 1
  return null
}

export function applyMarkdownTabMove(
  current: RsMarkdownMode,
  move: number | 'start' | 'end',
): RsMarkdownMode {
  if (move === 'start') return 'edit'
  if (move === 'end') return 'split'
  const index = Math.max(0, MODES.indexOf(current))
  return MODES[(index + move + MODES.length) % MODES.length]!
}

export function isMarkdownRtl(node: EventTarget | null): boolean {
  if (typeof document === 'undefined') return false
  const el = node instanceof HTMLElement ? node : null
  const host = el?.closest('[dir], [data-rs-dir]') ?? document.documentElement
  if (!(host instanceof Element)) return false
  const dir = host.getAttribute('dir') || host.getAttribute('data-rs-dir') || ''
  return dir === 'rtl'
}

/**
 * 最近的主题岛。documentElement 交给编辑器的 auto，避免再观察一遍。
 * 组件自己写上 data-rs-theme 时从父级继续找。
 */
export function nearestMarkdownThemeHost(el: HTMLElement | null): HTMLElement | null {
  if (!el || typeof document === 'undefined') return null
  let node: HTMLElement | null = el.parentElement
  while (node) {
    const raw = node.getAttribute('data-rs-theme')
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      if (node === document.documentElement) return null
      return node
    }
    node = node.parentElement
  }
  return null
}

/** auto 且落在主题岛里时，把岛的明暗交给编辑器；否则保持 auto 或显式值。 */
export function resolveMarkdownEditorTheme(
  theme: RsCodeEditorTheme | undefined,
  nearestIsland: 'light' | 'dark' | null,
): RsCodeEditorTheme {
  if (theme === 'light' || theme === 'dark') return theme
  if (nearestIsland) return nearestIsland
  return 'auto'
}
