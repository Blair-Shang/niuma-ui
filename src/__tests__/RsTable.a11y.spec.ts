import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import RsTable from '../components/RsTable.vue'

describe('RsTable a11y baseline', () => {
  it('壳层 region + table grid 语义与行列计数', () => {
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
        ariaLabel: '用户列表',
      },
    })
    const shell = wrapper.find('.rs-table-shell')
    expect(shell.attributes('role')).toBe('region')
    expect(shell.attributes('aria-label')).toBe('用户列表')
    expect(shell.attributes('tabindex')).toBeUndefined()

    const table = wrapper.find('table.rs-table__table')
    expect(table.attributes('role')).toBe('grid')
    expect(table.attributes('tabindex')).toBe('0')
    expect(table.attributes('aria-label')).toBe('用户列表')
    expect(table.attributes('aria-rowcount')).toBe('2')
    expect(table.attributes('aria-colcount')).toBe('2')
    expect(wrapper.find('tr.rs-table__row').attributes('role')).toBe('row')
    expect(wrapper.find('td.rs-table__td--data').attributes('role')).toBe('gridcell')
    wrapper.unmount()
  })

  it('loading 时 aria-busy', () => {
    const wrapper = mount(RsTable, {
      props: {
        columns: [{ key: 'name', title: 'Name' }],
        data: [],
        loading: true,
      },
    })
    expect(wrapper.find('.rs-table-shell').attributes('aria-busy')).toBe('true')
    wrapper.unmount()
  })

  it('只读表方向键漫游 focus 格', async () => {
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
        ariaLabel: '键盘表',
      },
      attachTo: document.body,
    })
    const table = wrapper.find('table.rs-table__table')
    await table.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.find('.rs-table__td--focused').exists()).toBe(true)
    expect(wrapper.find('.rs-table__td--focused').attributes('data-col-key')).toBe('name')

    await table.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(wrapper.find('.rs-table__td--focused').attributes('data-col-key')).toBe('age')

    await table.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    const focusedRow = wrapper.find('.rs-table__td--focused').element.closest('tr')
    expect(focusedRow?.getAttribute('data-row-key')).toBe('2')

    wrapper.unmount()
  })
})
