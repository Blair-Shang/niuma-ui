import { describe, expect, it } from 'vitest'
import {
  buildBreadcrumbRenderItems,
  mergeBreadcrumbLinkRel,
  pickCollapsedBreadcrumbIndexes,
  resolveBreadcrumbHref,
} from '../src/breadcrumb-utils'

describe('breadcrumb-utils', () => {
  it('prefers href over to', () => {
    expect(resolveBreadcrumbHref({ href: '/href', to: '/to' })).toBe('/href')
    expect(resolveBreadcrumbHref({ to: '/to' })).toBe('/to')
    expect(resolveBreadcrumbHref({ label: 'x' } as { href?: string; to?: string })).toBeUndefined()
  })

  it('adds noopener noreferrer for _blank and keeps caller rel', () => {
    expect(mergeBreadcrumbLinkRel(undefined, '_self')).toBeUndefined()
    expect(mergeBreadcrumbLinkRel(undefined, '_blank')).toBe('noopener noreferrer')
    expect(mergeBreadcrumbLinkRel('nofollow', '_blank')).toBe('nofollow noopener noreferrer')
    expect(mergeBreadcrumbLinkRel('noopener', '_blank')).toBe('noopener noreferrer')
  })

  it('does not collapse when length fits or expanded', () => {
    expect(pickCollapsedBreadcrumbIndexes(3, 4)).toBeNull()
    expect(pickCollapsedBreadcrumbIndexes(3, 3)).toBeNull()
    expect(pickCollapsedBreadcrumbIndexes(8, 3, 1, 1, true)).toBeNull()
    expect(pickCollapsedBreadcrumbIndexes(2, 1)).toBeNull()
  })

  it('hides the middle and inserts ellipsis after the leading items', () => {
    expect(pickCollapsedBreadcrumbIndexes(6, 3, 1, 1)).toEqual({
      visible: [0, 5],
      hidden: [1, 2, 3, 4],
      insertEllipsisAt: 1,
    })
    expect(pickCollapsedBreadcrumbIndexes(6, 4, 1, 2)).toEqual({
      visible: [0, 4, 5],
      hidden: [1, 2, 3],
      insertEllipsisAt: 1,
    })
  })

  it('marks the last item current and writes to as href', () => {
    const items = buildBreadcrumbRenderItems([
      { label: 'Home', to: '/home' },
      { label: 'Docs', href: '/docs' },
      { label: 'Here' },
    ])
    expect(items).toHaveLength(3)
    expect(items[0]?.href).toBe('/home')
    expect(items[0]?.isLink).toBe(true)
    expect(items[2]?.isCurrent).toBe(true)
    expect(items[2]?.isLink).toBe(false)
  })

  it('does not keep the last item as a link even when href is set', () => {
    const items = buildBreadcrumbRenderItems([
      { label: 'Home', href: '/' },
      { label: 'Here', href: '/here' },
    ])
    expect(items[1]?.isCurrent).toBe(true)
    expect(items[1]?.isLink).toBe(false)
    expect(items[1]?.href).toBe('/here')
  })

  it('renders an ellipsis item that carries the hidden crumbs', () => {
    const items = buildBreadcrumbRenderItems(
      [
        { label: 'A', href: '/a' },
        { label: 'B', href: '/b' },
        { label: 'C', href: '/c' },
        { label: 'D' },
      ],
      { maxItems: 3, itemsBeforeCollapse: 1, itemsAfterCollapse: 1 },
    )
    expect(items.map((item) => item.isEllipsis || item.label)).toEqual(['A', true, 'D'])
    expect(items[1]?.hiddenItems?.map((item) => item.label)).toEqual(['B', 'C'])
  })

  it('keeps disabled items as non-links', () => {
    const [item] = buildBreadcrumbRenderItems([{ label: 'Locked', href: '/x', disabled: true }, { label: 'Now' }])
    expect(item?.isLink).toBe(false)
    expect(item?.isDisabled).toBe(true)
    expect(item?.href).toBe('/x')
  })
})
