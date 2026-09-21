import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsCheckbox from '../src/RsCheckbox.vue'
import {
  applyRsCheckboxIndeterminate,
  resolveRsCheckboxAriaChecked,
} from '../src/checkbox-utils'

describe('checkbox-utils', () => {
  it('resolves aria-checked including mixed', () => {
    expect(resolveRsCheckboxAriaChecked(true, false)).toBe('true')
    expect(resolveRsCheckboxAriaChecked(false, false)).toBe('false')
    expect(resolveRsCheckboxAriaChecked(false, true)).toBe('mixed')
  })

  it('writes the indeterminate IDL', () => {
    const el = document.createElement('input')
    el.type = 'checkbox'
    applyRsCheckboxIndeterminate(el, true)
    expect(el.indeterminate).toBe(true)
    applyRsCheckboxIndeterminate(el, false)
    expect(el.indeterminate).toBe(false)
    applyRsCheckboxIndeterminate(null, true)
  })
})

describe('RsCheckbox', () => {
  it('registers the public component name', () => {
    expect(RsCheckbox.name).toBe('RsCheckbox')
  })

  it('toggles model on change', async () => {
    const wrapper = mount(RsCheckbox, { props: { modelValue: false } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('applies checked and size classes', async () => {
    const wrapper = mount(RsCheckbox, {
      props: { modelValue: true, size: 'sm' },
    })
    expect(wrapper.find('.rs-checkbox').classes()).toContain('rs-checkbox--checked')
    expect(wrapper.find('.rs-checkbox').classes()).toContain('rs-checkbox--sm')
  })

  it('supports indeterminate visual state and native IDL', async () => {
    const wrapper = mount(RsCheckbox, {
      props: { modelValue: false, indeterminate: true },
    })
    await nextTick()
    const input = wrapper.find('input').element as HTMLInputElement
    expect(wrapper.find('.rs-checkbox').classes()).toContain('rs-checkbox--indeterminate')
    expect(wrapper.find('input').attributes('aria-checked')).toBe('mixed')
    expect(input.indeterminate).toBe(true)
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(RsCheckbox, {
      props: { modelValue: false, disabled: true },
    })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('exposes focus', () => {
    const wrapper = mount(RsCheckbox)
    const exposed = wrapper.vm as unknown as { focus: () => void }
    expect(typeof exposed.focus).toBe('function')
    exposed.focus()
  })
})
