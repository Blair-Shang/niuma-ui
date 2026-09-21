import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsForm from '../../form/src/RsForm.vue'
import RsMentions from '../src/RsMentions.vue'
import {
  filterMentionOptions,
  normalizeRsMentionOptions,
} from '../src/mentions-utils'

const people = [
  { label: 'Alice', value: 'alice' },
  { label: 'Bob', value: 'bob' },
]

describe('mentions option helpers', () => {
  it('normalizes strings and keeps disabled options visible', () => {
    const options = normalizeRsMentionOptions([
      'alice',
      { label: 'Bob', value: 'bob', disabled: true },
    ])
    expect(options).toEqual([
      { label: 'alice', value: 'alice' },
      { label: 'Bob', value: 'bob', disabled: true },
    ])
    expect(filterMentionOptions(options, '').map((item) => item.value)).toEqual([
      'alice',
      'bob',
    ])
    expect(filterMentionOptions(options, 'al').map((item) => item.value)).toEqual(['alice'])
    expect(filterMentionOptions(options, 'al', false)).toHaveLength(2)
  })
})

describe('RsMentions', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = () => {}
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('registers the public name and stays native', () => {
    expect(RsMentions.name).toBe('RsMentions')
    const wrapper = mount(RsMentions, {
      props: { options: people },
      attachTo: document.body,
    })
    expect(wrapper.find('textarea').attributes('role')).toBe('combobox')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    wrapper.unmount()
  })

  it('exposes combobox semantics when @ is active', async () => {
    const wrapper = mount(RsMentions, {
      props: {
        modelValue: '你好 @',
        options: people,
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

  it('clears the value', async () => {
    const wrapper = mount(RsMentions, {
      props: { options: people, modelValue: 'hi @alice', allowClear: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-mentions__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toBeTruthy()
    wrapper.unmount()
  })

  it('inherits Form.disabled', () => {
    const form = mount(
      {
        components: { RsForm, RsMentions },
        template: '<RsForm disabled><RsMentions name="comment" :options="people" /></RsForm>',
        setup() {
          return { people }
        },
      },
      { attachTo: document.body },
    )
    expect(form.find('textarea').attributes('disabled')).toBeDefined()
    form.unmount()
  })

  it('does not pick during IME composition', async () => {
    const wrapper = mount(RsMentions, {
      props: {
        modelValue: '你好 @',
        options: people,
      },
      attachTo: document.body,
    })
    const area = wrapper.find('textarea')
    const el = area.element as HTMLTextAreaElement
    el.setSelectionRange(4, 4)
    await area.trigger('keyup')
    await nextTick()
    await area.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('select')).toBeFalsy()
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    wrapper.unmount()
  })

  it('exposes focus and blur', async () => {
    const wrapper = mount(RsMentions, {
      props: { options: people },
      attachTo: document.body,
    })
    const area = wrapper.find('textarea').element as HTMLTextAreaElement
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    await nextTick()
    expect(document.activeElement).toBe(area)
    ;(wrapper.vm as unknown as { blur: () => void }).blur()
    await nextTick()
    expect(document.activeElement).not.toBe(area)
    wrapper.unmount()
  })

  it('removes the caret meter on unmount', async () => {
    const wrapper = mount(RsMentions, {
      props: {
        modelValue: '你好 @',
        options: people,
      },
      attachTo: document.body,
    })
    const area = wrapper.find('textarea')
    const el = area.element as HTMLTextAreaElement
    el.setSelectionRange(4, 4)
    await area.trigger('keyup')
    await nextTick()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
    expect(document.body.querySelector('[aria-hidden="true"]')).toBeTruthy()
    wrapper.unmount()
    expect(document.body.querySelector('[aria-hidden="true"]')).toBeFalsy()
  })
})
