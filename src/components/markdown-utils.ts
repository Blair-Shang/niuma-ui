/**
 * Markdown 渲染工具：GFM + 安全链接/图片 + DOMPurify 消毒。
 * 面向表单/说明类场景，不含 AI 流式、公式、图表等业务能力。
 */
import { Marked } from 'marked'
import type { Tokens } from 'marked'
import DOMPurify from 'dompurify'

export type RsMarkdownMode = 'edit' | 'preview' | 'split'

export type RsMarkdownRenderOptions = {
  /** GFM 换行（单个换行转 <br>），默认 true */
  breaks?: boolean
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function isSafeHref(href: string): boolean {
  const value = href.trim()
  if (!value) return false
  if (value.startsWith('#') || value.startsWith('/')) return true
  return /^(https?:|mailto:)/i.test(value)
}

export function isSafeImageSrc(src: string): boolean {
  const value = src.trim()
  if (!value) return false
  if (value.startsWith('data:image/')) return true
  return /^(https?:)/i.test(value)
}

function sanitizeLang(lang: string | undefined): string {
  const raw = (lang ?? 'text').trim().split(/\s+/)[0] ?? 'text'
  return raw.replace(/[^\w.+#-]/g, '') || 'text'
}

function renderCodeBlock(text: string, lang: string | undefined): string {
  const language = sanitizeLang(lang)
  const code = text.replace(/\n$/, '')
  return [
    `<div class="rs-markdown__codeblock" data-rs-md-lang="${escapeHtml(language)}">`,
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

function createMarked(breaks: boolean): Marked {
  return new Marked({
    gfm: true,
    breaks,
    renderer: {
      code({ text, lang }) {
        return renderCodeBlock(text, lang)
      },
      link(
        this: { parser: { parseInline: (tokens: Tokens.Link['tokens']) => string } },
        token: Tokens.Link,
      ) {
        const text = this.parser.parseInline(token.tokens)
        const href = token.href?.trim() ?? ''
        if (!isSafeHref(href)) return text
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
        return `<a href="${escapeHtml(href)}"${title} target="_blank" rel="noopener noreferrer">${text}</a>`
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

/**
 * 将 Markdown 转为可安全注入的 HTML（必须配合 v-html 使用消毒结果）。
 */
export function renderMarkdown(source = '', options?: RsMarkdownRenderOptions): string {
  if (!source.trim()) return ''
  const breaks = options?.breaks !== false
  const dirty = wrapTables(getMarked(breaks).parse(source, { async: false }) as string)
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['class', 'target', 'rel', 'loading', 'decoding', 'alt', 'src', 'data-rs-md-lang'],
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
