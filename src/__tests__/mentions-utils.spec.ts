import { describe, expect, it } from 'vitest'
import {
  applyMention,
  findActiveMention,
  filterMentionOptions,
  measureTextareaCaret,
  placeMentionPopup,
  stepMentionIndex,
} from '../components/mentions-utils'

describe('mentions-utils', () => {
  it('finds @ query before cursor', () => {
    const active = findActiveMention('hi @al', 6, ['@'])
    expect(active).toEqual({ prefix: '@', query: 'al', start: 3, end: 6 })
  })

  it('applies mention and moves cursor', () => {
    const next = applyMention('hi @al', { prefix: '@', query: 'al', start: 3, end: 6 }, 'alice')
    expect(next.text).toBe('hi @alice ')
    expect(next.cursor).toBe(10)
  })

  it('filters options by query', () => {
    const list = filterMentionOptions(
      [
        { label: 'Alice', value: 'alice' },
        { label: 'Bob', value: 'bob' },
      ],
      'al',
    )
    expect(list.map((item) => item.value)).toEqual(['alice'])
  })

  it('measures caret relative to the textarea', () => {
    const area = document.createElement('textarea')
    area.value = '你好 @'
    area.style.width = '240px'
    area.style.font = '14px sans-serif'
    document.body.appendChild(area)
    const pos = measureTextareaCaret(area, 3)
    expect(pos.left).toBeGreaterThanOrEqual(0)
    expect(pos.top).toBeGreaterThanOrEqual(0)
    expect(pos.height).toBeGreaterThan(0)
    area.remove()
  })

  it('flips the popup above when the viewport bottom is tight', () => {
    const box = placeMentionPopup(
      { top: 500, left: 40, height: 20 },
      { width: 160, height: 120 },
      { width: 800, height: 560 },
    )
    expect(box.placement).toBe('top')
    expect(box.top).toBeLessThan(500)
  })

  it('steps over disabled mention options', () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
      { label: 'C', value: 'c' },
    ]
    expect(stepMentionIndex(options, 0, 1)).toBe(2)
    expect(stepMentionIndex(options, 2, -1)).toBe(0)
    expect(stepMentionIndex(options, -1, 1)).toBe(0)
    expect(stepMentionIndex(options, options.length, -1)).toBe(2)
  })
})
