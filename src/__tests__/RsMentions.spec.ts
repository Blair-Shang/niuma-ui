import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsMentions from '../components/RsMentions.vue'

describe('RsMentions', () => {
  it('exposes combobox semantics when @ is active', async () => {
    const wrapper = mount(RsMentions, {
      props: {
        modelValue: '你好 @',
        options: [
          { label: 'Alice', value: 'alice' },
          { label: 'Bob', value: 'bob' },
        ],
      },
      attachTo: document.body,
    })
    const area = wrapper.find('textarea')
    const el = area.element as HTMLTextAreaElement
    el.setSelectionRange(4, 4)
    await area.trigger('keyup')
    await nextTick()
    expect(area.attributes('role')).toBe('combobox')
    expect(area.attributes('aria-expanded')).toBe('true')
    expect(document.body.querySelector('[role="listbox"]')).toBeTruthy()
    wrapper.unmount()
  })
})
