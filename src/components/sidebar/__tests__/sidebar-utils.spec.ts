import { describe, expect, it } from 'vitest'
import {
  hasRsSidebarBadge,
  isRsSidebarTypingTarget,
  matchesRsSidebarHotkey,
  mergeRsSidebarLinkRel,
  resolveRsSidebarCollapsed,
  resolveRsSidebarCollapseIcon,
  resolveRsSidebarItemHref,
  resolveRsSidebarItemTag,
  resolveRsSidebarOrientation,
  resolveRsSidebarPlacement,
  resolveRsSidebarWidth,
} from '../src/sidebar-utils'

describe('sidebar-utils', () => {
  it('resolves orientation / placement / width with fallbacks', () => {
    expect(resolveRsSidebarOrientation()).toBe('vertical')
    expect(resolveRsSidebarOrientation('horizontal')).toBe('horizontal')
    expect(resolveRsSidebarPlacement()).toBe('left')
    expect(resolveRsSidebarPlacement('right')).toBe('right')
    expect(resolveRsSidebarWidth()).toBe('md')
    expect(resolveRsSidebarWidth('lg')).toBe('lg')
  })

  it('prefers explicit collapsed over inherited', () => {
    expect(resolveRsSidebarCollapsed(true, false)).toBe(true)
    expect(resolveRsSidebarCollapsed(false, true)).toBe(false)
    expect(resolveRsSidebarCollapsed(undefined, true)).toBe(true)
    expect(resolveRsSidebarCollapsed()).toBe(false)
  })

  it('resolves item href and tag', () => {
    expect(resolveRsSidebarItemHref('/docs', '/ignored')).toBe('/docs')
    expect(resolveRsSidebarItemHref(undefined, '/apps')).toBe('/apps')
    expect(resolveRsSidebarItemHref()).toBeUndefined()
    expect(resolveRsSidebarItemTag('/docs')).toBe('a')
    expect(resolveRsSidebarItemTag()).toBe('button')
  })

  it('merges noopener noreferrer for _blank', () => {
    expect(mergeRsSidebarLinkRel(undefined, '_self')).toBeUndefined()
    expect(mergeRsSidebarLinkRel(undefined, '_blank')).toBe('noopener noreferrer')
    expect(mergeRsSidebarLinkRel('nofollow', '_blank')).toBe('nofollow noopener noreferrer')
    expect(mergeRsSidebarLinkRel('noopener noreferrer', '_blank')).toBe('noopener noreferrer')
  })

  it('picks collapse icons from orientation and placement', () => {
    expect(resolveRsSidebarCollapseIcon('vertical', 'left', false)).toBe('chevron-left')
    expect(resolveRsSidebarCollapseIcon('vertical', 'left', true)).toBe('chevron-right')
    expect(resolveRsSidebarCollapseIcon('vertical', 'right', false)).toBe('chevron-right')
    expect(resolveRsSidebarCollapseIcon('horizontal', 'left', true)).toBe('chevron-down')
  })

  it('matches Ctrl/Cmd letter hotkeys and ignores typing targets', () => {
    expect(
      matchesRsSidebarHotkey(
        { key: 'b', altKey: false, shiftKey: false, ctrlKey: true, metaKey: false },
        'b',
      ),
    ).toBe(true)
    expect(
      matchesRsSidebarHotkey(
        { key: 'b', altKey: false, shiftKey: false, ctrlKey: false, metaKey: true },
        'Control+b',
      ),
    ).toBe(true)
    expect(
      matchesRsSidebarHotkey(
        { key: 'b', altKey: true, shiftKey: false, ctrlKey: true, metaKey: false },
        'b',
      ),
    ).toBe(false)

    const input = document.createElement('input')
    expect(isRsSidebarTypingTarget(input)).toBe(true)
    expect(isRsSidebarTypingTarget(document.createElement('div'))).toBe(false)
    expect(isRsSidebarTypingTarget(null)).toBe(false)
  })

  it('treats empty and zero badges as hidden', () => {
    expect(hasRsSidebarBadge('3')).toBe(true)
    expect(hasRsSidebarBadge(2)).toBe(true)
    expect(hasRsSidebarBadge(0)).toBe(false)
    expect(hasRsSidebarBadge('')).toBe(false)
    expect(hasRsSidebarBadge()).toBe(false)
  })
})
