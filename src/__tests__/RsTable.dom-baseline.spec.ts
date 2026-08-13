/**
 * DOM 结构基线（轻量「视觉回归」）：锁定关键 a11y/壳层骨架，不引 Playwright。
 * 只采集 tag + role + 结构类（rs-table / rs-table__*），忽略 --size/--theme 修饰，降低抖动。
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RsTable from '../components/RsTable.vue'

function structuralClass(el: Element): string {
  return [...el.classList]
    .filter(
      (c) =>
        c === 'rs-table-shell' ||
        c === 'rs-table' ||
        c.startsWith('rs-table__'),
    )
    .sort()
    .join('.')
}

function structureFingerprint(root: Element): string {
  const parts: string[] = []
  const walk = (el: Element, depth: number) => {
    if (depth > 5) return
    const tag = el.tagName.toLowerCase()
    // 跳过纯展示文案节点，基线只关心结构
    if (tag === 'span' && !el.getAttribute('role') && !structuralClass(el)) {
      return
    }
    const role = el.getAttribute('role')
    const cls = structuralClass(el)
    const bits = [tag]
    if (role) bits.push(`role=${role}`)
    if (cls) bits.push(cls)
    parts.push(`${'  '.repeat(depth)}${bits.join(' ')}`)
    for (const child of Array.from(el.children).slice(0, 16)) {
      walk(child, depth + 1)
    }
  }
  walk(root, 0)
  return parts.join('\n')
}

describe('RsTable DOM 结构基线', () => {
  it('只读表壳层 / grid / 行格骨架稳定', () => {
    const wrapper = mount(RsTable, {
      props: {
        columns: [
          { key: 'name', title: 'Name' },
          { key: 'age', title: 'Age' },
        ],
        data: [
          { id: '1', name: 'a', age: 1 },
          { id: '2', name: 'b', age: 2 },
        ],
        rowKey: 'id',
        ariaLabel: '基线表',
        contextMenu: false,
        cellTooltip: false,
      },
    })
    const shell = wrapper.find('.rs-table-shell').element
    const fp = structureFingerprint(shell)
    expect(fp).toContain('div role=region rs-table-shell')
    expect(fp).toContain('table role=grid rs-table__table')
    expect(fp).toContain('tr role=row rs-table__row')
    expect(fp).toContain('td role=gridcell')
    expect(fp).toMatchInlineSnapshot(`
      "div role=region rs-table-shell
        div rs-table
          table role=grid rs-table__table
            thead rs-table__head
              tr role=row
                th role=columnheader rs-table__cell--left.rs-table__th
                th role=columnheader rs-table__cell--left.rs-table__th
            tbody
              tr role=row rs-table__row
                td role=gridcell rs-table__cell--left.rs-table__td.rs-table__td--data
                td role=gridcell rs-table__cell--left.rs-table__td.rs-table__td--data
              tr role=row rs-table__row
                td role=gridcell rs-table__cell--left.rs-table__td.rs-table__td--data
                td role=gridcell rs-table__cell--left.rs-table__td.rs-table__td--data"
    `)
    wrapper.unmount()
  })
})
