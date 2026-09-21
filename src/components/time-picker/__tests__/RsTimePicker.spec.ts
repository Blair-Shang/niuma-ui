import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsTimePicker from '../src/RsTimePicker.vue'

describe('RsTimePicker', () => {
  it('renders popover trigger with placeholder', () => {
    const wrapper = mount(RsTimePicker, { props: { modelValue: '' } })
    expect(wrapper.find('.rs-time-picker__trigger').exists()).toBe(true)
    expect(wrapper.find('.rs-time-picker__value').text()).toContain('Select time')
    expect(wrapper.classes()).toContain('rs-field')
  })

  it('shows preset value on trigger when model is set', () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '14:30' },
    })
    expect(wrapper.find('.rs-time-picker__trigger--placeholder').exists()).toBe(false)
    expect(wrapper.find('.rs-time-picker__value').text()).toBe('14:30')
  })

  it('renders label, hint, and required marker', () => {
    const wrapper = mount(RsTimePicker, {
      props: {
        modelValue: '',
        label: '签到时间',
        hint: '请选择时间',
        required: true,
      },
    })
    expect(wrapper.find('.rs-field__label').text()).toContain('签到时间')
    expect(wrapper.find('.rs-field__required').exists()).toBe(true)
    expect(wrapper.find('.rs-field__hint').text()).toBe('请选择时间')
  })

  it('applies left label layout class', () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '', labelPosition: 'left' },
    })
    expect(wrapper.classes()).toContain('rs-field--label-left')
  })

  it('uses single trigger for range mode', () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: { start: '', end: '' }, range: true },
    })
    expect(wrapper.findAll('.rs-time-picker__trigger')).toHaveLength(1)
    expect(wrapper.find('.rs-time-picker__value').text()).toContain('Select time range')
  })

  it('shows range label when range model is set', () => {
    const wrapper = mount(RsTimePicker, {
      props: {
        modelValue: { start: '09:00', end: '18:00' },
        range: true,
      },
    })
    expect(wrapper.find('.rs-time-picker__value').text()).toContain('09:00')
    expect(wrapper.find('.rs-time-picker__value').text()).toContain('18:00')
  })

  it('opens panel with scroll columns', async () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '', open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-time-columns')).not.toBeNull()
    wrapper.unmount()
  })

  it('applies size class on root and columns panel', async () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '08:00', size: 'sm', open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.classes()).toContain('rs-time-picker--sm')
    expect(document.body.querySelector('.rs-time-columns--sm')).not.toBeNull()
    wrapper.unmount()
  })

  it('disables trigger when disabled', () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '10:00', disabled: true },
    })
    expect(wrapper.find('.rs-time-picker__trigger').attributes('disabled')).toBeDefined()
  })

  it('marks invalid on the trigger instead of the field wrapper', () => {
    const wrapper = mount(RsTimePicker, { props: { modelValue: '', invalid: true } })
    expect(wrapper.find('.rs-time-picker__trigger').classes()).toContain(
      'rs-time-picker__trigger--invalid',
    )
    expect(wrapper.find('.rs-time-picker__trigger').attributes('aria-invalid')).toBe('true')
    expect(wrapper.attributes('aria-invalid')).toBeUndefined()
  })

  it('uses a native button trigger without Reka attributes', () => {
    const wrapper = mount(RsTimePicker, { props: { modelValue: '' } })
    const trigger = wrapper.find('.rs-time-picker__trigger')
    expect(trigger.element.tagName).toBe('BUTTON')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('data-reka-collection-item')).toBeUndefined()
  })

  it('shows a 12-hour locale label without changing v-model', () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '14:30', hourCycle: 12 },
    })
    const text = wrapper.find('.rs-time-picker__value').text()
    expect(text).not.toBe('14:30')
    expect(text.toLowerCase()).toMatch(/2:30|14:30|pm|下午/)
  })

  it('shows a clear button when clearable and valued', async () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '14:30', clearable: true },
    })
    expect(wrapper.find('.rs-time-picker__clear').exists()).toBe(true)
    await wrapper.find('.rs-time-picker__clear').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('')
  })

  it('closes the panel on Escape and unmounts the overlay', async () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '', open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-time-picker__content')).not.toBeNull()
    await wrapper.find('.rs-time-picker__trigger').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    expect(document.body.querySelector('.rs-time-picker__content')).toBeNull()
    wrapper.unmount()
  })

  it('renders AM/PM column when hourCycle is 12 and open', async () => {
    const wrapper = mount(RsTimePicker, {
      props: { modelValue: '14:30', hourCycle: 12, open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('[data-unit="period"]')).not.toBeNull()
    wrapper.unmount()
  })
})
