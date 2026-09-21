import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import RsCascader, { type RsCascaderExpose } from '../src/RsCascader.vue'
import type { RsCascaderOption } from '../src/cascader-utils'

const options: RsCascaderOption[] = [
  {
    label: 'East',
    value: 'east',
    children: [
      { label: 'Shanghai', value: 'sh' },
      { label: 'Hangzhou', value: 'hz' },
    ],
  },
  { label: 'North', value: 'north', disabled: true },
]

describe('RsCascader', () => {
  it('registers the public component name', () => {
    expect(RsCascader.name).toBe('RsCascader')
  })

  it('does not mount a Reka popover root', async () => {
    const wrapper = mount(RsCascader, {
      props: { options, open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('.rs-cascader').exists()).toBe(true)
    expect(document.querySelector('[data-reka-popper-content-wrapper]')).toBeNull()
    expect(document.querySelector('.rs-cascader__panel')).not.toBeNull()
    wrapper.unmount()
  })

  it('picks a leaf and closes', async () => {
    const Host = defineComponent({
      components: { RsCascader },
      setup() {
        const path = ref<(string | number)[]>([])
        const opened = ref(true)
        return { path, opened, options }
      },
      template: '<RsCascader v-model="path" v-model:open="opened" :options="options" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const items = document.querySelectorAll('.rs-cascader__item')
    ;(items[0] as HTMLElement).click()
    await nextTick()
    expect(wrapper.vm.path).toEqual(['east'])
    const leaf = Array.from(document.querySelectorAll('.rs-cascader__item')).find(
      (el) => el.textContent?.includes('Shanghai'),
    ) as HTMLElement
    leaf.click()
    await nextTick()
    expect(wrapper.vm.path).toEqual(['east', 'sh'])
    expect(wrapper.vm.opened).toBe(false)
    wrapper.unmount()
  })

  it('does not emit change when hover expands a parent', async () => {
    const wrapper = mount(RsCascader, {
      props: { options, expandTrigger: 'hover', open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const first = document.querySelector('.rs-cascader__item') as HTMLElement
    first.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['east']])
    wrapper.unmount()
  })

  it('does not open when disabled', async () => {
    const wrapper = mount(RsCascader, {
      props: { options, disabled: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-cascader').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(document.querySelector('.rs-cascader__panel')).toBeNull()
    wrapper.unmount()
  })

  it('clears the path', async () => {
    const wrapper = mount(RsCascader, {
      props: { options, allowClear: true, modelValue: ['east', 'sh'] },
      attachTo: document.body,
    })
    await nextTick()
    await wrapper.find('.rs-cascader__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]])
    expect(wrapper.emitted('change')?.[0]).toEqual([[]])
    wrapper.unmount()
  })

  it('puts size class on trigger and portaled panel', async () => {
    const wrapper = mount(RsCascader, {
      props: { options, size: 'sm', open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('.rs-cascader').classes()).toContain('rs-cascader--sm')
    expect(document.querySelector('.rs-cascader__panel')?.classList.contains('rs-cascader__panel--sm')).toBe(
      true,
    )
    wrapper.unmount()
  })

  it('exposes focus on the trigger', async () => {
    const Host = defineComponent({
      components: { RsCascader },
      setup() {
        const cascaderRef = ref<RsCascaderExpose | null>(null)
        return { cascaderRef, options }
      },
      template: '<RsCascader ref="cascaderRef" :options="options" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    wrapper.vm.cascaderRef!.focus()
    expect(document.activeElement).toBe(wrapper.find('.rs-cascader').element)
    wrapper.unmount()
  })
})
