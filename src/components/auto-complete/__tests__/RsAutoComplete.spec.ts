import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import RsForm from '../../form/src/RsForm.vue'
import RsAutoComplete from '../src/RsAutoComplete.vue'
import {
  filterRsAutoCompleteOptions,
  normalizeRsAutoCompleteOptions,
} from '../src/auto-complete-utils'

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

describe('auto-complete-utils', () => {
  it('normalizes strings and filters locally', () => {
    const options = normalizeRsAutoCompleteOptions(['GPT-4o', { label: 'Claude', value: 'Claude' }])
    expect(options).toEqual([
      { label: 'GPT-4o', value: 'GPT-4o' },
      { label: 'Claude', value: 'Claude' },
    ])
    expect(filterRsAutoCompleteOptions(options, 'cla', true)).toEqual([
      { label: 'Claude', value: 'Claude' },
    ])
    expect(filterRsAutoCompleteOptions(options, 'cla', false)).toHaveLength(2)
  })
})

describe('RsAutoComplete', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = () => {}
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('registers the public name and stays native', () => {
    expect(RsAutoComplete.name).toBe('RsAutoComplete')
    const wrapper = mount(RsAutoComplete, {
      props: { options: ['A'] },
      attachTo: document.body,
    })
    expect(wrapper.find('input').attributes('role')).toBe('combobox')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    wrapper.unmount()
  })

  it('clears the value', async () => {
    const wrapper = mount(RsAutoComplete, {
      props: { options: ['A'], modelValue: 'A', allowClear: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-auto-complete__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toBeTruthy()
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

  it('renders a native select list with option elements', async () => {
    const wrapper = mount(RsAutoComplete, {
      props: { options: ['DeepSeek', 'Claude'], modelValue: 'd', open: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-auto-complete__input').trigger('focus')
    await nextTick()
    const list = document.body.querySelector('.rs-auto-complete__list')
    expect(list?.tagName).toBe('SELECT')
    const options = [...(list?.querySelectorAll('option') ?? [])].map((el) => el.textContent?.trim())
    expect(options).toContain('DeepSeek')
    expect(list?.querySelector('[role="listbox"]')).toBeNull()
    expect(list?.querySelector('[role="option"]')).toBeNull()
    wrapper.unmount()
  })

  it('writes name and exposes focus / blur', async () => {
    const wrapper = mount(RsAutoComplete, {
      props: { options: ['A'], name: 'model' },
      attachTo: document.body,
    })
    expect(wrapper.find('input').attributes('name')).toBe('model')
    const exposed = wrapper.vm as unknown as { focus: () => void; blur: () => void }
    expect(typeof exposed.focus).toBe('function')
    expect(typeof exposed.blur).toBe('function')
    exposed.focus()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('input').element)
    wrapper.unmount()
  })

  it('stamps data-rs-theme from the field ancestor onto the list', async () => {
    const Host = defineComponent({
      components: { RsAutoComplete },
      template:
        '<div data-rs-theme="dark"><RsAutoComplete :options="[\'Alice\']" /></div>',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('.rs-auto-complete__input').trigger('focus')
    await nextTick()
    const list = document.body.querySelector('.rs-auto-complete__list')
    expect(list?.getAttribute('data-rs-theme')).toBe('dark')
    wrapper.unmount()
  })

  it('inherits Form.disabled', () => {
    const wrapper = mount(RsForm, {
      props: { disabled: true },
      slots: {
        default: () => h(RsAutoComplete, { options: ['A'] }),
      },
      attachTo: document.body,
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('debounces search and skips local filter when filterOption is false', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsAutoComplete, {
      props: {
        options: ['Alpha', 'Beta'],
        filterOption: false,
        debounce: 80,
      },
      attachTo: document.body,
    })
    await wrapper.find('input').setValue('zzz')
    expect(wrapper.emitted('search')).toBeFalsy()
    await vi.advanceTimersByTimeAsync(80)
    expect(wrapper.emitted('search')?.at(-1)).toEqual(['zzz'])
    wrapper.unmount()
    vi.useRealTimers()
  })
})
