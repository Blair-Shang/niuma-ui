import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { RsForm } from '../../form'
import RsDynamicTags from '../src/RsDynamicTags.vue'

async function typeAndEnter(wrapper: ReturnType<typeof mount>, value: string) {
  const input = wrapper.find('.rs-dynamic-tags__input')
  await input.setValue(value)
  await input.trigger('keydown', { key: 'Enter' })
  await nextTick()
}

describe('RsDynamicTags', () => {
  it('opens input from trigger and creates tag on Enter', async () => {
    const Host = defineComponent({
      components: { RsDynamicTags },
      data: () => ({ tags: [] as string[] }),
      template: '<RsDynamicTags v-model="tags" />',
    })
    const wrapper = mount(Host)

    await wrapper.find('.rs-dynamic-tags__trigger').trigger('click')
    await nextTick()
    const input = wrapper.find('.rs-dynamic-tags__input')
    expect(input.exists()).toBe(true)

    await input.setValue('alpha')
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect((wrapper.vm as { tags: string[] }).tags).toEqual(['alpha'])
  })

  it('rejects duplicate tags', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: ['a'],
        inputMode: 'always',
      },
    })

    await typeAndEnter(wrapper, 'a')
    expect(wrapper.emitted('reject')?.[0]).toEqual(['duplicate', 'a'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('hides trigger when max reached', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: ['a', 'b'],
        max: 2,
      },
    })
    expect(wrapper.find('.rs-dynamic-tags__trigger').exists()).toBe(false)
    expect(wrapper.find('.rs-dynamic-tags__input').exists()).toBe(false)
  })

  it('splits on separators while typing', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: [],
        inputMode: 'always',
        separators: ',',
      },
    })

    const input = wrapper.find('.rs-dynamic-tags__input')
    await input.setValue('vue,react,')
    await input.trigger('input')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['vue', 'react'])
  })

  it('pastes a comma-separated list', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: [],
        inputMode: 'always',
        separators: [','],
      },
    })

    const input = wrapper.find('.rs-dynamic-tags__input')
    await input.trigger('paste', {
      clipboardData: {
        getData: () => 'alpha, beta, gamma',
      },
    })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('uses parse to transform or reject', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: [],
        inputMode: 'always',
        parse: (value: string) => (value === 'nope' ? false : value.toLowerCase()),
      },
    })

    await typeAndEnter(wrapper, 'Vue')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['vue'])

    await typeAndEnter(wrapper, 'nope')
    expect(wrapper.emitted('reject')?.[0]).toEqual(['invalid', 'nope'])
  })

  it('clears tags and emits clear', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: ['a', 'b'],
        allowClear: true,
      },
    })

    await wrapper.find('.rs-dynamic-tags__clear').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('does not edit when readonly', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: ['locked'],
        readonly: true,
        allowClear: true,
      },
    })
    expect(wrapper.find('.rs-dynamic-tags__trigger').exists()).toBe(false)
    expect(wrapper.find('.rs-dynamic-tags__input').exists()).toBe(false)
    expect(wrapper.find('.rs-dynamic-tags__clear').exists()).toBe(false)
    expect(wrapper.find('.rs-tag__close').exists()).toBe(false)
  })

  it('inherits Form.disabled', async () => {
    const Host = defineComponent({
      components: { RsForm, RsDynamicTags },
      template: `
        <RsForm disabled>
          <RsDynamicTags :model-value="['a']" />
        </RsForm>
      `,
    })
    const wrapper = mount(Host)
    expect(wrapper.find('.rs-dynamic-tags--disabled').exists()).toBe(true)
    expect(wrapper.find('.rs-dynamic-tags__trigger').exists()).toBe(false)
  })

  it('commits on Tab when the draft is not empty', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: {
        modelValue: [],
        inputMode: 'always',
      },
    })
    const input = wrapper.find('.rs-dynamic-tags__input')
    await input.setValue('tabbed')
    await input.trigger('keydown', { key: 'Tab' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['tabbed'])
  })

  it('exposes focus / blur / setValue', async () => {
    const wrapper = mount(RsDynamicTags, {
      props: { modelValue: [], inputMode: 'always' },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as {
      focus: () => void
      blur: () => void
      setValue: (value: unknown) => void
    }
    exposed.focus()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('.rs-dynamic-tags__input').element)

    exposed.blur()
    await nextTick()
    expect(document.activeElement).not.toBe(wrapper.find('.rs-dynamic-tags__input').element)

    exposed.setValue(['one', 'two'])
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['one', 'two'])
    wrapper.unmount()
  })
})
