import { documentThemeAttributes } from '../../../theme/color-theme'

export interface RsCodeBlockSelection {
  text: string
  startLine: number
  endLine: number
}

export interface RsCodeBlockExpose {
  getSelection: () => RsCodeBlockSelection | null
  focus: () => void
}

const COPY_FEEDBACK_MS = 1500
const DOWNLOAD_REVOKE_MS = 1500

export function codeBlockCopyFeedbackMs(): number {
  return COPY_FEEDBACK_MS
}

export function codeBlockDownloadRevokeMs(): number {
  return DOWNLOAD_REVOKE_MS
}

/** 下载名只留最后一段，避免把目录写进 download 属性。 */
export function sanitizeDownloadFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, '').replace(/[\u0000-\u001f]/g, '')
  return base || 'download.html'
}

export function mimeForDownloadFilename(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html;charset=utf-8'
  return 'text/plain;charset=utf-8'
}

export function readCodeBlockSelection(
  empty: boolean,
  text: string,
  startLine: number,
  endLine: number,
): RsCodeBlockSelection | null {
  if (empty || !text.trim()) return null
  return { text, startLine, endLine }
}

/** 行号从 1 开始，去重后升序。超出文档的行丢掉。 */
export function normalizeHighlightLines(lines: readonly number[] | undefined, lineCount: number): number[] {
  if (!lines?.length || lineCount < 1) return []
  const seen = new Set<number>()
  const out: number[] = []
  for (const raw of lines) {
    if (!Number.isInteger(raw) || raw < 1 || raw > lineCount || seen.has(raw)) continue
    seen.add(raw)
    out.push(raw)
  }
  out.sort((a, b) => a - b)
  return out
}

/** 最近的 data-rs-theme。没有时看 documentElement。深色岛不必改整页。 */
export function isCodeBlockDarkTheme(el: HTMLElement | null): boolean {
  if (typeof document === 'undefined') return false
  const themed = el?.closest('[data-rs-theme]')
  const node = themed ?? document.documentElement
  return node.getAttribute('data-rs-theme') === 'dark'
}

type ThemeListener = () => void

const themeListeners = new Set<ThemeListener>()
let themeObserver: MutationObserver | null = null

function ensureThemeObserver(): void {
  if (themeObserver || typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
  themeObserver = new MutationObserver(() => {
    for (const listener of themeListeners) listener()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [...documentThemeAttributes],
    subtree: true,
  })
}

/** 多个代码块共用一个主题观察器。最后一个退订时断开。 */
export function subscribeCodeBlockTheme(listener: ThemeListener): () => void {
  themeListeners.add(listener)
  ensureThemeObserver()
  return () => {
    themeListeners.delete(listener)
    if (themeListeners.size === 0 && themeObserver) {
      themeObserver.disconnect()
      themeObserver = null
    }
  }
}
