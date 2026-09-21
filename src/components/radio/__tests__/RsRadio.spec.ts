import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import RsRadio from '../src/RsRadio.vue'
import RsRadioItem from '../src/RsRadioItem.vue'
import {
  isRsRadioValueEqual,
  resolveRsRadioOrientation,
  rsRadioInputValue,
} from '../src/radio-utils'

describe('radio-utils', () => {
  it('resolves orientation and compares values', () => {
    expect(resolveRsRadioOrientation('vertical')).toBe('vertical')
    expect(resolveRsRadioOrientation('sideways' as never)).toBe('horizontal')
    expect(isRsRadioValueEqual(1, 1)).toBe(true)
    expect(isRsRadioValueEqual(1, '1')).toBe(false)
    expect(rsRadioInputValue(true)).toBe('true')
  })
})

describe('RsRadio', () => {
  it('registers public component names', () => {
    expect(RsRadio.name).toBe('RsRadio')
    expect(RsRadioItem.name).toBe('RsRadioItem')
  })

  it('renders a native radiogroup without Reka', () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 'pro' },
      slots: {
        default: () => [
          h(RsRadioItem, { value: 'free' }, () => 'Free'),
          h(RsRadioItem, { value: 'pro' }, () => 'Pro'),
        ],
      },
    })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBe('radiogroup')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(2)
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
  })

  it('checks the matching item and emits change', async () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 'pro' },
      slots: {
        default: () => [
          h(RsRadioItem, { value: 'free' }, () => 'Free'),
          h(RsRadioItem, { value: 'pro' }, () => 'Pro'),
        ],
      },
    })
    const inputs = wrapper.findAll('input[type="radio"]')
    expect((inputs[1]!.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.findAll('.rs-radio--checked')).toHaveLength(1)
    await inputs[0]!.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['free'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['free'])
  })

  it('keeps number values as numbers', async () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 2 },
      slots: {
        default: () => [
          h(RsRadioItem, { value: 1 }, () => 'One'),
          h(RsRadioItem, { value: 2 }, () => 'Two'),
        ],
      },
    })
    await wrapper.findAll('input')[0]!.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
    expect(typeof wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('number')
  })

  it('disables the group and a single item', () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 'a', disabled: true },
      slots: {
        default: () => [
          h(RsRadioItem, { value: 'a' }, () => 'A'),
          h(RsRadioItem, { value: 'b' }, () => 'B'),
        ],
      },
    })
    expect(wrapper.classes()).toContain('rs-radio-group--disabled')
    expect(wrapper.findAll('input').every((input) => input.attributes('disabled') != null)).toBe(
      true,
    )
  })

  it('applies vertical orientation', () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 'a', orientation: 'vertical' },
      slots: {
        default: () => h(RsRadioItem, { value: 'a' }, () => 'A'),
      },
    })
    expect(wrapper.classes()).toContain('rs-radio-group--vertical')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it('keeps the indicator in the tree so selection does not remount layout', async () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 'a', orientation: 'vertical' },
      slots: {
        default: () => [
          h(RsRadioItem, { value: 'a' }, () => 'A'),
          h(RsRadioItem, { value: 'b' }, () => 'B'),
        ],
      },
    })
    expect(wrapper.findAll('.rs-radio__indicator')).toHaveLength(2)
    await wrapper.findAll('input')[1]!.setValue(true)
    expect(wrapper.findAll('.rs-radio__indicator')).toHaveLength(2)
    expect(wrapper.findAll('[data-state="checked"]')).toHaveLength(1)
  })

  it('does not emit change when the group is disabled', async () => {
    const wrapper = mount(RsRadio, {
      props: { modelValue: 'a', disabled: true },
      slots: {
        default: () => [
          h(RsRadioItem, { value: 'a' }, () => 'A'),
          h(RsRadioItem, { value: 'b' }, () => 'B'),
        ],
      },
    })
    await wrapper.findAll('input')[1]!.trigger('change')
    expect(wrapper.emitted('change')).toBeFalsy()
  })
})
