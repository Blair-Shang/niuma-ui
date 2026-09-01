import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsTreeSelect from '../components/RsTreeSelect.vue'

describe('RsTreeSelect', () => {
  it('shows selected tree label', () => {
    const wrapper = mount(RsTreeSelect, {
      props: {
        treeData: [{ key: 'pg', label: 'PostgreSQL' }],
        modelValue: 'pg',
      },
    })
    expect(wrapper.find('.rs-tree-select__value').text()).toBe('PostgreSQL')
  })
})
