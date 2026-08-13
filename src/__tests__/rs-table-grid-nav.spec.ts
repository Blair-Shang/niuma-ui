import { describe, expect, it } from 'vitest'
import {
  navigateGridCell,
  resolveGridNavDirection,
} from '../components/table/rs-table-grid-nav'

const rows = [
  { rowKey: '1', rowIndex: 0 },
  { rowKey: '2', rowIndex: 1 },
  { rowKey: '3', rowIndex: 2 },
]
const cols = ['a', 'b', 'c']

describe('navigateGridCell', () => {
  it('无焦点时以左上角为种子', () => {
    expect(navigateGridCell(rows, cols, null, 'right')).toEqual({
      rowKey: '1',
      colKey: 'b',
      rowIndex: 0,
    })
  })

  it('箭头在边界钳制', () => {
    const at = { rowKey: '1', colKey: 'a', rowIndex: 0 }
    expect(navigateGridCell(rows, cols, at, 'left')?.colKey).toBe('a')
    expect(navigateGridCell(rows, cols, at, 'up')?.rowKey).toBe('1')
    const br = { rowKey: '3', colKey: 'c', rowIndex: 2 }
    expect(navigateGridCell(rows, cols, br, 'right')?.colKey).toBe('c')
    expect(navigateGridCell(rows, cols, br, 'down')?.rowKey).toBe('3')
  })

  it('Home/End 与 Ctrl 角点', () => {
    const mid = { rowKey: '2', colKey: 'b', rowIndex: 1 }
    expect(navigateGridCell(rows, cols, mid, 'home')?.colKey).toBe('a')
    expect(navigateGridCell(rows, cols, mid, 'end')?.colKey).toBe('c')
    expect(navigateGridCell(rows, cols, mid, 'first')).toEqual({
      rowKey: '1',
      colKey: 'a',
      rowIndex: 0,
    })
    expect(navigateGridCell(rows, cols, mid, 'last')).toEqual({
      rowKey: '3',
      colKey: 'c',
      rowIndex: 2,
    })
  })

  it('PageDown 按 pageSize 跳行', () => {
    const at = { rowKey: '1', colKey: 'a', rowIndex: 0 }
    expect(navigateGridCell(rows, cols, at, 'pageDown', 2)?.rowKey).toBe('3')
  })
})

describe('resolveGridNavDirection', () => {
  it('映射常用键', () => {
    expect(resolveGridNavDirection({ key: 'ArrowRight' } as KeyboardEvent)).toBe('right')
    expect(resolveGridNavDirection({ key: 'Home' } as KeyboardEvent)).toBe('home')
    expect(resolveGridNavDirection({ key: 'Home', ctrlKey: true } as KeyboardEvent)).toBe(
      'first',
    )
    expect(resolveGridNavDirection({ key: 'a' } as KeyboardEvent)).toBeNull()
  })
})
