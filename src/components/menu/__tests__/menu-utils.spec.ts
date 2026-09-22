import { describe, expect, it } from 'vitest'
import {
  collectMenuDescendantKeys,
  findMenuParentKeys,
  findMenuSiblingKeys,
  isMenuDivider,
  isMenuItemGroup,
  menuArrowKeys,
  mergeMenuLinkRel,
  mergeOpenKeysWithParents,
  partitionMenuEntries,
  resolveMenuItemHref,
  toggleMenuOpenKeys,
  type RsMenuItem,
  type RsMenuItemGroup,
} from '../src/menu-utils'

const nested: RsMenuItem[] = [
  {
    key: 'workspace',
    label: 'Workspace',
    children: [
      {
        key: 'team',
        label: 'Team',
        children: [{ key: 'members', label: 'Members' }],
      },
      { key: 'docs', label: 'Docs' },
    ],
  },
  { key: 'settings', label: 'Settings' },
]

const grouped: RsMenuItemGroup[] = [
  {
    label: 'Product',
    children: [
      {
        key: 'line',
        label: 'Line',
        children: [{ key: 'billing', label: 'Billing' }],
      },
    ],
  },
]

describe('menu-utils', () => {
  it('distinguishes groups from items by the absence of key', () => {
    expect(isMenuItemGroup({ label: 'G', children: [] })).toBe(true)
    expect(isMenuItemGroup({ key: 'a', label: 'A' })).toBe(false)
  })

  it('finds ancestor keys for a nested leaf', () => {
    expect(findMenuParentKeys(nested, 'members')).toEqual(['workspace', 'team'])
    expect(findMenuParentKeys(grouped, 'billing')).toEqual(['line'])
    expect(findMenuParentKeys(nested, 'missing')).toEqual([])
  })

  it('returns the same openKeys reference when parents are already open', () => {
    const current = ['workspace', 'team']
    expect(mergeOpenKeysWithParents(current, ['workspace', 'team'])).toBe(current)
    expect(mergeOpenKeysWithParents(current, ['workspace'])).toBe(current)
    expect(mergeOpenKeysWithParents(current, [])).toBe(current)
    expect(mergeOpenKeysWithParents(['workspace'], ['workspace', 'team'])).toEqual([
      'workspace',
      'team',
    ])
  })

  it('toggles accordion by closing siblings and their descendants', () => {
    const twoSubs: RsMenuItem[] = [
      { key: 'a', label: 'A', children: [{ key: 'a-1', label: 'A1' }] },
      { key: 'b', label: 'B', children: [{ key: 'b-1', label: 'B1' }] },
    ]
    expect(toggleMenuOpenKeys(['a'], 'b', true, twoSubs, true)).toEqual(['b'])
    const current = ['workspace']
    expect(toggleMenuOpenKeys(current, 'workspace', true, nested, false)).toBe(current)
    const closed = toggleMenuOpenKeys(['workspace', 'team'], 'workspace', false, nested, false)
    expect(closed).toEqual([])
  })

  it('collects sibling submenu keys at the same level', () => {
    expect(findMenuSiblingKeys(nested, 'workspace')).toEqual(['workspace'])
    expect(findMenuSiblingKeys(nested, 'team')).toEqual(['team'])
    expect(collectMenuDescendantKeys(nested, 'workspace')).toEqual(['team'])
  })

  it('batches consecutive leaves and keeps groups apart', () => {
    const blocks = partitionMenuEntries([
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { label: 'G', children: [{ key: 'c', label: 'C' }] },
      { key: 'd', label: 'D' },
    ])
    expect(blocks.map((block) => block.type)).toEqual(['items', 'group', 'items'])
    if (blocks[0]?.type === 'items') expect(blocks[0].items.map((item) => item.key)).toEqual(['a', 'b'])
    if (blocks[2]?.type === 'items') expect(blocks[2].items.map((item) => item.key)).toEqual(['d'])
  })

  it('maps disclosure arrow keys and swaps left/right in RTL', () => {
    expect(menuArrowKeys(true, false)).toEqual({
      next: 'ArrowDown',
      prev: 'ArrowUp',
      open: 'ArrowRight',
    })
    expect(menuArrowKeys(true, true).open).toBe('ArrowLeft')
    expect(menuArrowKeys(false, true)).toEqual({
      next: 'ArrowLeft',
      prev: 'ArrowRight',
      open: 'ArrowDown',
    })
  })

  it('resolves href over to and merges rel for _blank', () => {
    expect(resolveMenuItemHref({ key: 'a', label: 'A', href: '/a', to: '/b' })).toBe('/a')
    expect(resolveMenuItemHref({ key: 'a', label: 'A', to: '/b' })).toBe('/b')
    expect(mergeMenuLinkRel(undefined, '_blank')).toBe('noopener noreferrer')
    expect(mergeMenuLinkRel('nofollow', '_blank')).toBe('nofollow noopener noreferrer')
    expect(isMenuDivider({ key: 'd', label: '', type: 'divider' })).toBe(true)
  })
})
