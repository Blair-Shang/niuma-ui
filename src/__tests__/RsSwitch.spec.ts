import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import RsSwitch from '../components/RsSwitch.vue'

describe('RsSwitch', () => {
  it('toggles v-model on click', async () => {
    const Host = defineComponent({
      components: { RsSwitch },
      data: () => ({ on: false }),
      template: '<RsSwitch v-model="on" />',
    })
    const wrapper = mount(Host)

    await wrapper.find('.rs-switch__root').trigger('click')
    await nextTick()
    expect(wrapper.find('.rs-switch--checked').exists()).toBe(true)
    expect((wrapper.vm as { on: boolean }).on).toBe(true)

    await wrapper.find('.rs-switch__root').trigger('click')
    await nextTick()
    expect(wrapper.find('.rs-switch--checked').exists()).toBe(false)
    expect((wrapper.vm as { on: boolean }).on).toBe(false)
  })

  it('emits change when toggled', async () => {
    const wrapper = mount(RsSwitch, {
      props: { modelValue: false },
    })

    await wrapper.find('.rs-switch__root').trigger('click')
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('does not toggle when disabled', async () => {
    const wrapper = mount(RsSwitch, {
      props: { modelValue: false, disabled: true },
    })

    await wrapper.find('.rs-switch__root').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
