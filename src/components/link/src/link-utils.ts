/**
 * RsLink 语义色（色相）。链接没有形态轴，默认 primary。
 * 操作按钮请用 RsButton variant="link"，不要用本组件冒充按钮。
 */
export type RsLinkTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export type RsLinkUnderline = 'always' | 'hover' | 'none'

export function resolveRsLinkTone(tone?: RsLinkTone): RsLinkTone {
  return tone ?? 'primary'
}

/** `_blank` 时补上 noopener / noreferrer，并保留调用方已有 rel。 */
export function mergeRsLinkRel(rel: string | undefined, target: string | undefined): string | undefined {
  const parts = (rel ?? '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (target === '_blank') {
    if (!parts.includes('noopener')) parts.push('noopener')
    if (!parts.includes('noreferrer')) parts.push('noreferrer')
  }
  return parts.length > 0 ? parts.join(' ') : undefined
}
