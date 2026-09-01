import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsAutoComplete from '../components/RsAutoComplete.vue'
import { filterSelectOptions } from '../components/select-utils'

function mockRect(el: Element, box: { top: number; left: number; width: number; height: number }) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON: () => box,
    }),
  })
}

describe('RsAutoComplete', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = () => {}
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('filters options as the user types', () => {
    const filtered = filterSelectOptions(
      [
        { label: 'GPT-4o', value: 'GPT-4o' },
        { label: 'Claude', value: 'Claude' },
      ],
      'cla',
      (text, q) => text.toLowerCase().includes(q.toLowerCase()),
    )
    expect(filtered).toEqual([{ label: 'Claude', value: 'Claude' }])
  })

  it('clears the value', async () => {
    const wrapper = mount(RsAutoComplete, {
      props: { options: ['A'], modelValue: 'A', allowClear: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-auto-complete__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    wrapper.unmount()
  })

  it('anchors the listbox to the textbox in the viewport', async () => {
    const wrapper = mount(RsAutoComplete, {
      props: {
        options: ['Alice', 'Bob'],
        open: true,
      },
      attachTo: document.body,
    })
    const input = wrapper.find('.rs-auto-complete__input').element
    mockRect(input, { top: 120, left: 80, width: 280, height: 32 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
    await wrapper.find('.rs-auto-complete__input').trigger('focus')
    await nextTick()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
    const list = document.body.querySelector('.rs-auto-complete__list') as HTMLElement | null
    expect(list).toBeTruthy()
    expect(list!.style.position).toBe('fixed')
    expect(list!.style.top).toBe('156px')
    expect(list!.style.left).toBe('80px')
    expect(list!.style.width).toBe('280px')
    expect(wrapper.find('.rs-auto-complete__input').attributes('role')).toBe('combobox')
    expect(wrapper.find('.rs-auto-complete__input').attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })

  it('highlights the query with a span instead of mark', async () => {
    const wrapper = mount(RsAutoComplete, {
      props: { options: ['DeepSeek', 'Claude'], modelValue: 'd', open: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-auto-complete__input').trigger('focus')
    await nextTick()
    const list = document.body.querySelector('.rs-auto-complete__list')
    expect(list?.querySelector('mark')).toBeNull()
    expect(list?.querySelector('.rs-auto-complete__mark')?.textContent).toBe('D')
    wrapper.unmount()
  })
})
