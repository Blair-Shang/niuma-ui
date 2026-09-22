import { describe, expect, it } from 'vitest'
import {
  claimContextMenu,
  firstEnabledContextMenuKey,
  hasActionableContextMenuItems,
  matchContextMenuTypeahead,
  placeContextMenuPoint,
  releaseContextMenu,
  resolveContextMenuKeys,
  resolveContextMenuLayers,
  resolveContextMenuRel,
  shouldCloseContextMenuOnSelect,
  stepContextMenuKey,
  type RsContextMenuItem,
} from '../src/context-menu-utils'

const items: RsContextMenuItem[] = [
  { key: 'open', label: 'Open' },
  { key: 'sep', label: '', separator: true },
  { key: 'rename', label: 'Rename', disabled: true },
  { key: 'share', label: 'Share', children: [{ key: 'link', label: 'Copy link' }] },
]

describe('context menu utils', () => {
  it('treats separators as empty and keeps disabled rows', () => {
    expect(hasActionableContextMenuItems([])).toBe(false)
    expect(hasActionableContextMenuItems([{ key: 's', label: '', separator: true }])).toBe(false)
    expect(hasActionableContextMenuItems(items)).toBe(true)
    expect(firstEnabledContextMenuKey(items)).toBe('open')
  })

  it('skips disabled rows when moving', () => {
    expect(stepContextMenuKey(items, 'open', 1)).toBe('share')
    expect(stepContextMenuKey(items, 'share', -1)).toBe('open')
  })

  it('resolves only the open submenu path', () => {
    const layers = resolveContextMenuLayers(items, ['share'])
    expect(layers.map((layer) => layer.id)).toEqual(['root', 'share'])
    expect(resolveContextMenuLayers(items, ['missing'])).toHaveLength(1)
  })

  it('keeps checkbox and radio menus open unless closeOnSelect is set', () => {
    const check: RsContextMenuItem = { key: 'hidden', label: 'Hidden', type: 'checkbox' }
    expect(shouldCloseContextMenuOnSelect(check, true)).toBe(false)
    expect(shouldCloseContextMenuOnSelect({ ...check, closeOnSelect: true }, true)).toBe(true)
    expect(shouldCloseContextMenuOnSelect({ key: 'open', label: 'Open' }, true)).toBe(true)
    expect(shouldCloseContextMenuOnSelect({ key: 'open', label: 'Open' }, false)).toBe(false)
  })

  it('flips the submenu arrow keys in RTL', () => {
    expect(resolveContextMenuKeys(false).openSub).toBe('ArrowRight')
    expect(resolveContextMenuKeys(true).openSub).toBe('ArrowLeft')
  })

  it('matches typeahead by label and skips disabled rows', () => {
    expect(matchContextMenuTypeahead(items, 's', -1)).toBe(2)
    expect(matchContextMenuTypeahead(items, 'r')).toBe(-1)
  })

  it('opens down-right, and flips up or left at the viewport edge', () => {
    const viewport = { width: 800, height: 600 }
    const down = placeContextMenuPoint({ x: 40, y: 40 }, { width: 180, height: 120 }, viewport)
    expect(down.left).toBe(40)
    expect(down.top).toBe(40)
    expect(down.originX).toBe('left')
    expect(down.originY).toBe('top')

    const up = placeContextMenuPoint({ x: 40, y: 560 }, { width: 180, height: 120 }, viewport)
    expect(up.originY).toBe('bottom')
    expect(up.top).toBeLessThan(560)

    const left = placeContextMenuPoint({ x: 760, y: 40 }, { width: 180, height: 120 }, viewport)
    expect(left.originX).toBe('right')
    expect(left.left).toBeLessThan(760)
  })

  it('prefers the left side in RTL when there is room', () => {
    const placed = placeContextMenuPoint({ x: 400, y: 40 }, { width: 180, height: 80 }, { width: 800, height: 600 }, 8, true)
    expect(placed.originX).toBe('right')
    expect(placed.left).toBe(220)
  })

  it('adds noopener on blank targets and keeps a single open menu', () => {
    expect(resolveContextMenuRel({ key: 'docs', label: 'Docs', href: 'https://example.com', target: '_blank' })).toBe(
      'noopener noreferrer',
    )
    const closed: string[] = []
    const first = () => closed.push('first')
    const second = () => closed.push('second')
    claimContextMenu(first)
    claimContextMenu(second)
    expect(closed).toEqual(['first'])
    releaseContextMenu(first)
    releaseContextMenu(second)
  })
})
