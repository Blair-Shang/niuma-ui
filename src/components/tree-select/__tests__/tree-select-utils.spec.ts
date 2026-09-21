import { describe, expect, it } from 'vitest'
import { buildTreeNodeIndex, resolveTreeFieldNames, type RsTreeNode } from '../../tree/src/tree-utils'
import {
  emptyTreeSelectValue,
  formatTreeSelectDisplay,
  isTreeSelectMultiValue,
  normalizeTreeSelectKeys,
  packTreeSelectValue,
  resolveTreeSelectDisplayKeys,
  resolveTreeSelectLabels,
  resolveTreeSelectPortalTarget,
  treeSelectHasValue,
} from '../src/tree-select-utils'

const nodes: RsTreeNode[] = [
  {
    key: 'db',
    label: 'Database',
    children: [
      { key: 'pg', label: 'PostgreSQL' },
      { key: 'mysql', label: 'MySQL' },
    ],
  },
  { key: 'cache', label: 'Cache' },
]

const index = buildTreeNodeIndex(nodes, resolveTreeFieldNames())

describe('tree-select-utils', () => {
  it('treats checkable as a multi value', () => {
    expect(isTreeSelectMultiValue(false, false)).toBe(false)
    expect(isTreeSelectMultiValue(true, false)).toBe(true)
    expect(isTreeSelectMultiValue(false, true)).toBe(true)
  })

  it('normalizes empty and array values', () => {
    expect(normalizeTreeSelectKeys('')).toEqual([])
    expect(normalizeTreeSelectKeys(null)).toEqual([])
    expect(normalizeTreeSelectKeys('pg')).toEqual(['pg'])
    expect(normalizeTreeSelectKeys(['pg', 1 as unknown as string])).toEqual(['pg', '1'])
  })

  it('packs a single or multi value', () => {
    expect(packTreeSelectValue(['pg'], false)).toBe('pg')
    expect(packTreeSelectValue([], false)).toBe('')
    expect(packTreeSelectValue(['pg', 'mysql'], true)).toEqual(['pg', 'mysql'])
    expect(emptyTreeSelectValue(false)).toBe('')
    expect(emptyTreeSelectValue(true)).toEqual([])
    expect(treeSelectHasValue(['pg'])).toBe(true)
    expect(treeSelectHasValue([])).toBe(false)
  })

  it('SHOW_PARENT hides children when the parent is also selected', () => {
    expect(
      resolveTreeSelectDisplayKeys(['db', 'pg', 'mysql'], index, 'SHOW_PARENT', false),
    ).toEqual(['db'])
    expect(resolveTreeSelectDisplayKeys(['pg', 'mysql'], index, 'SHOW_PARENT', false)).toEqual([
      'pg',
      'mysql',
    ])
  })

  it('SHOW_CHILD hides a parent when every child is selected', () => {
    expect(
      resolveTreeSelectDisplayKeys(['db', 'pg', 'mysql'], index, 'SHOW_CHILD', false),
    ).toEqual(['pg', 'mysql'])
    expect(resolveTreeSelectDisplayKeys(['db', 'pg'], index, 'SHOW_CHILD', false)).toEqual([
      'db',
      'pg',
    ])
  })

  it('SHOW_ALL and checkStrictly keep the raw keys', () => {
    const keys = ['db', 'pg']
    expect(resolveTreeSelectDisplayKeys(keys, index, 'SHOW_ALL', false)).toEqual(keys)
    expect(resolveTreeSelectDisplayKeys(keys, index, 'SHOW_CHILD', true)).toEqual(keys)
  })

  it('resolves labels and folds extra tags', () => {
    expect(resolveTreeSelectLabels(['pg', 'missing'], index)).toEqual(['PostgreSQL', 'missing'])
    expect(formatTreeSelectDisplay(['A', 'B', 'C'], 2, '+1')).toBe('A, B, +1')
    expect(formatTreeSelectDisplay(['A', 'B'], 2)).toBe('A, B')
  })

  it('falls back to body when the popup container is empty', () => {
    expect(resolveTreeSelectPortalTarget(undefined)).toBe('body')
    expect(resolveTreeSelectPortalTarget(() => undefined)).toBe('body')
    expect(resolveTreeSelectPortalTarget(() => '#host')).toBe('#host')
  })
})
