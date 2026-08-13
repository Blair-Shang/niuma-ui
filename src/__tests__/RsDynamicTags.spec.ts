import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import RsDynamicTags from '../components/RsDynamicTags.vue'

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

    const input = wrapper.find('.rs-dynamic-tags__input')
    await input.setValue('a')
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()
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
})
