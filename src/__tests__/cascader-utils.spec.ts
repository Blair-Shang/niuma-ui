import { describe, expect, it } from 'vitest'
import {
  cascaderColumns,
  cascaderDisplay,
  isCascaderLeaf,
  type RsCascaderOption,
} from '../components/cascader-utils'

const options: RsCascaderOption[] = [
  {
    label: '华东',
    value: 'east',
    children: [
      { label: '上海', value: 'sh' },
      { label: '杭州', value: 'hz' },
    ],
  },
]

describe('cascader-utils', () => {
  it('builds columns from path', () => {
    const cols = cascaderColumns(options, ['east'])
    expect(cols).toHaveLength(2)
    expect(cols[1]?.map((item) => item.value)).toEqual(['sh', 'hz'])
  })

  it('joins labels', () => {
    expect(cascaderDisplay(options, ['east', 'sh'])).toBe('华东 / 上海')
  })

  it('detects leaf', () => {
    expect(isCascaderLeaf(options[0]!)).toBe(false)
    expect(isCascaderLeaf(options[0]!.children![0]!)).toBe(true)
  })
})
