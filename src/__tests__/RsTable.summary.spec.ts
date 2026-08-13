import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RsTable from '../components/RsTable.vue'

describe('RsTable summary', () => {
  it('renders builtin summary row from column.summary', async () => {
    const wrapper = mount(RsTable, {
      props: {
        showSummary: true,
        summaryMode: 'client',
        columns: [
          { key: 'name', title: '名称' },
          {
            key: 'amount',
            title: '金额',
            summary: { type: 'sum' as const },
          },
        ],
        data: [
          { id: 1, name: 'A', amount: 10 },
          { id: 2, name: 'B', amount: 5 },
        ],
        rowKey: 'id',
      },
    })
    expect(wrapper.find('.rs-table__summary-row').exists()).toBe(true)
    expect(wrapper.find('.rs-table__summary-row').text()).toContain('15')
    wrapper.unmount()
  })

  it('prefers summary slot over builtin row', async () => {
    const wrapper = mount(RsTable, {
      props: {
        showSummary: true,
        columns: [{ key: 'name', title: '名称', summary: { type: 'count' as const } }],
        data: [{ id: 1, name: 'A' }],
        rowKey: 'id',
      },
      slots: { summary: () => 'custom-summary' },
    })
    expect(wrapper.text()).toContain('custom-summary')
    expect(wrapper.find('.rs-table__summary-row').exists()).toBe(false)
    wrapper.unmount()
  })
})
