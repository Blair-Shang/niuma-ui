import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsTextarea from '../components/RsTextarea.vue'
import type { RsTextareaExpose } from '../components/RsTextarea.vue'

describe('RsTextarea', () => {
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(RsTextarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('hello')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello'])
  })

  it('renders rows and label', () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: '', rows: 5, label: '备注', required: true },
    })
    expect(wrapper.find('textarea').attributes('rows')).toBe('5')
    expect(wrapper.text()).toContain('备注')
    expect(wrapper.find('.rs-field__required').exists()).toBe(true)
  })

  it('marks invalid state', () => {
    const wrapper = mount(RsTextarea, { props: { modelValue: '', invalid: true } })
    expect(wrapper.find('.rs-textarea__shell').classes()).toContain('is-invalid')
  })

  it('shows count without maxlength', () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: 'abc', showCount: true },
    })
    expect(wrapper.find('.rs-textarea__count').text()).toBe('3')
  })

  it('shows count with maxlength', () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: 'abc', maxlength: 10, showCount: true },
    })
    expect(wrapper.find('.rs-textarea__count').text()).toBe('3 / 10')
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('10')
  })

  it('clears value when clearable button is clicked', async () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: 'hello', clearable: true },
    })
    await wrapper.find('.rs-textarea__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('hides clear button when empty or disabled', () => {
    const empty = mount(RsTextarea, { props: { modelValue: '', clearable: true } })
    expect(empty.find('.rs-textarea__clear').exists()).toBe(false)
    const disabled = mount(RsTextarea, {
      props: { modelValue: 'x', clearable: true, disabled: true },
    })
    expect(disabled.find('.rs-textarea__clear').exists()).toBe(false)
  })

  it('emits pressEnter on Enter key', async () => {
    const wrapper = mount(RsTextarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('pressEnter')).toHaveLength(1)
  })

  it('does not emit pressEnter while IME is composing', async () => {
    const wrapper = mount(RsTextarea, { props: { modelValue: '' } })
    const el = wrapper.find('textarea')
    await el.trigger('compositionstart')
    await el.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('pressEnter')).toBeFalsy()
    await el.trigger('compositionend')
    await el.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('pressEnter')).toHaveLength(1)
  })

  it('forces resize none when autosize is on', () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: 'a', autosize: true, resize: 'both' },
    })
    const el = wrapper.find('textarea').element as HTMLTextAreaElement
    expect(el.style.resize).toBe('none')
    expect(wrapper.find('.rs-textarea__shell').classes()).toContain('is-autosize')
  })

  it('uses minRows as the rows attribute when autosize is an object', () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: '', rows: 2, autosize: { minRows: 4, maxRows: 8 } },
    })
    expect(wrapper.find('textarea').attributes('rows')).toBe('4')
  })

  it('exposes focus and blur', () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: '' },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as RsTextareaExpose
    exposed.focus()
    expect(document.activeElement).toBe(wrapper.find('textarea').element)
    exposed.blur()
    expect(document.activeElement).not.toBe(wrapper.find('textarea').element)
    wrapper.unmount()
  })

  it('validates required on blur', async () => {
    const wrapper = mount(RsTextarea, {
      props: { modelValue: '', required: true, validateTrigger: 'blur' },
    })
    await wrapper.find('textarea').trigger('blur')
    await flushPromises()
    expect(wrapper.find('.rs-field__error').exists()).toBe(true)
    expect(wrapper.find('.rs-textarea__shell').classes()).toContain('is-invalid')
  })
})
