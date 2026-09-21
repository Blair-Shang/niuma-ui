import { describe, expect, it, vi } from 'vitest'
import {
  escapeRsFormSelectorValue,
  normalizeRsFormNameFilter,
  prefersRsReducedMotion,
  queryRsFormItem,
  resolveFieldRules,
  scrollRsFormField,
} from '../src/form-utils'

describe('form-utils', () => {
  it('normalizes names filter', () => {
    expect(normalizeRsFormNameFilter()).toBeNull()
    expect([...normalizeRsFormNameFilter('email')!]).toEqual(['email'])
    expect([...normalizeRsFormNameFilter(['a', 'b'])!]).toEqual(['a', 'b'])
  })

  it('resolves field rules by name', () => {
    expect(resolveFieldRules(undefined, 'email')).toEqual([])
    expect(resolveFieldRules({ email: { required: true } }, 'email')).toEqual([
      { required: true },
    ])
  })

  it('escapes selector values without CSS.escape', () => {
    const css = globalThis.CSS
    // @ts-expect-error test fallback
    globalThis.CSS = undefined
    expect(escapeRsFormSelectorValue('user.email')).toBe('user.email')
    expect(escapeRsFormSelectorValue('a"b')).toBe('a\\"b')
    globalThis.CSS = css
  })

  it('queries and scrolls only inside the given root', () => {
    const root = document.createElement('form')
    const other = document.createElement('form')
    const mine = document.createElement('div')
    mine.setAttribute('data-rs-form-item', 'email')
    const theirs = document.createElement('div')
    theirs.setAttribute('data-rs-form-item', 'email')
    root.append(mine)
    other.append(theirs)
    document.body.append(other, root)

    expect(queryRsFormItem(root, 'email')).toBe(mine)
    expect(queryRsFormItem(other, 'email')).toBe(theirs)
    expect(queryRsFormItem(null, 'email')).toBeNull()

    const scroll = vi.fn()
    mine.scrollIntoView = scroll
    scrollRsFormField(root, 'email')
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' })

    root.remove()
    other.remove()
  })

  it('uses auto scroll when the user prefers reduced motion', () => {
    const root = document.createElement('form')
    const item = document.createElement('div')
    item.setAttribute('data-rs-form-item', 'note')
    const scroll = vi.fn()
    item.scrollIntoView = scroll
    root.append(item)
    const original = globalThis.matchMedia
    globalThis.matchMedia = ((query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener() {},
        removeEventListener() {},
      })) as typeof matchMedia
    expect(prefersRsReducedMotion()).toBe(true)
    scrollRsFormField(root, 'note')
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' })
    globalThis.matchMedia = original
  })
})
