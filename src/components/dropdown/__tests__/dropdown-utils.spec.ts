import { describe, expect, it } from 'vitest'
import {
  flattenDropdownItems,
  isDropdownDivider,
  isDropdownItemGroup,
  listDropdownLayerItems,
  matchDropdownTypeahead,
  normalizeDropdownTriggers,
  placeDropdownPopup,
  resolveDropdownExternalRel,
  resolveDropdownMenuKeys,
  resolveDropdownPortalTarget,
  type RsDropdownItem,
  type RsDropdownItemGroup,
} from '../src/dropdown-utils'

describe('dropdown-utils', () => {
  const flat: RsDropdownItem[] = [
    { label: 'Chat', value: 'chat' },
    { label: 'Code', value: 'code', disabled: true },
    { label: '', value: 'div', type: 'divider' },
    { label: 'More', value: 'more', children: [{ label: 'Export', value: 'export' }] },
  ]

  const grouped: RsDropdownItemGroup[] = [
    {
      label: 'Create',
      options: [
        { label: 'Chat', value: 'chat' },
        { label: '', value: 'div', type: 'divider' },
        { label: 'Write', value: 'write' },
      ],
    },
  ]

  it('detects groups and dividers', () => {
    expect(isDropdownItemGroup(grouped[0]!)).toBe(true)
    expect(isDropdownItemGroup(flat[0]!)).toBe(false)
    expect(isDropdownDivider(flat[2]!)).toBe(true)
  })

  it('flattens groups, children, and skips dividers', () => {
    expect(flattenDropdownItems(flat).map((item) => item.value)).toEqual([
      'chat',
      'code',
      'more',
      'export',
    ])
    expect(flattenDropdownItems(grouped).map((item) => item.value)).toEqual(['chat', 'write'])
  })

  it('lists only the current layer', () => {
    expect(listDropdownLayerItems(flat).map((item) => item.value)).toEqual([
      'chat',
      'code',
      'more',
    ])
  })

  it('normalizes triggers and falls back to click', () => {
    expect(normalizeDropdownTriggers(undefined)).toEqual(['click'])
    expect(normalizeDropdownTriggers('hover')).toEqual(['hover'])
    expect(normalizeDropdownTriggers(['click', 'hover'])).toEqual(['click', 'hover'])
    expect(normalizeDropdownTriggers([] as never)).toEqual(['click'])
  })

  it('matches typeahead from the next enabled item', () => {
    const items: RsDropdownItem[] = [
      { label: 'Apple', value: 'a' },
      { label: 'Apricot', value: 'b' },
      { label: 'Banana', value: 'c' },
    ]
    expect(matchDropdownTypeahead(items, 'ap', -1)).toBe(0)
    expect(matchDropdownTypeahead(items, 'ap', 0)).toBe(1)
    expect(matchDropdownTypeahead(items, 'b', 0)).toBe(2)
    expect(matchDropdownTypeahead(items, '', 0)).toBe(-1)
  })

  it('adds noopener on _blank links', () => {
    expect(resolveDropdownExternalRel({ label: 'Docs', value: 'd', href: '/x' })).toBeUndefined()
    expect(
      resolveDropdownExternalRel({
        label: 'Site',
        value: 's',
        href: 'https://example.com',
        target: '_blank',
      }),
    ).toBe('noopener noreferrer')
    expect(
      resolveDropdownExternalRel({
        label: 'Site',
        value: 's',
        href: 'https://example.com',
        target: '_blank',
        rel: 'noreferrer',
      }),
    ).toBe('noreferrer')
  })

  it('flips submenu keys in RTL', () => {
    expect(resolveDropdownMenuKeys(false).openSub).toBe('ArrowRight')
    expect(resolveDropdownMenuKeys(true).openSub).toBe('ArrowLeft')
  })

  it('places the panel below by default and aligns end to the right', () => {
    const below = placeDropdownPopup(
      { top: 80, left: 40, height: 32, width: 200 },
      { width: 160, height: 120 },
      { width: 800, height: 600 },
      'bottom',
    )
    expect(below.placement).toBe('bottom')
    expect(below.top).toBe(116)
    expect(below.left).toBe(40)

    const end = placeDropdownPopup(
      { top: 80, left: 40, height: 32, width: 200 },
      { width: 160, height: 120 },
      { width: 800, height: 600 },
      'bottom-end',
    )
    expect(end.left).toBe(80)
  })

  it('prefers top when asked and room exists', () => {
    const box = placeDropdownPopup(
      { top: 400, left: 40, height: 32, width: 160 },
      { width: 160, height: 120 },
      { width: 800, height: 600 },
      'top',
    )
    expect(box.placement).toBe('top')
    expect(box.top).toBe(276)
  })

  it('mirrors start/end in RTL', () => {
    const box = placeDropdownPopup(
      { top: 80, left: 40, height: 32, width: 200 },
      { width: 160, height: 120 },
      { width: 800, height: 600 },
      'bottom-start',
      true,
    )
    expect(box.left).toBe(80)
  })

  it('resolves a portal target without assuming a browser in SSR', () => {
    expect(resolveDropdownPortalTarget(undefined)).toBe('body')
  })
})
