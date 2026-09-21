import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import RsForm from '../../form/src/RsForm.vue'
import type { RsTreeNode } from '../../tree/src/tree-utils'
import RsTreeSelect, { type RsTreeSelectExpose } from '../src/RsTreeSelect.vue'

const nodes: RsTreeNode[] = [
  {
    key: 'db',
    label: 'PostgreSQL Family',
    children: [
      { key: 'pg', label: 'PostgreSQL' },
      { key: 'mysql', label: 'MySQL' },
    ],
  },
  { key: 'cache', label: 'Cache' },
]

describe('RsTreeSelect', () => {
  it('registers the public component name', () => {
    expect(RsTreeSelect.name).toBe('RsTreeSelect')
  })

  it('shows the selected tree label', () => {
    const wrapper = mount(RsTreeSelect, {
      props: {
        treeData: [{ key: 'pg', label: 'PostgreSQL' }],
        modelValue: 'pg',
      },
    })
    expect(wrapper.find('.rs-tree-select__value').text()).toBe('PostgreSQL')
  })

  it('does not mount a Reka popover root', async () => {
    const wrapper = mount(RsTreeSelect, {
      props: { treeData: nodes, open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('.rs-tree-select').exists()).toBe(true)
    expect(document.querySelector('[data-reka-popper-content-wrapper]')).toBeNull()
    expect(document.querySelector('.rs-tree-select__panel')).not.toBeNull()
    wrapper.unmount()
  })

  it('picks a leaf and closes in single mode', async () => {
    const Host = defineComponent({
      components: { RsTreeSelect },
      setup() {
        const value = ref('')
        const opened = ref(true)
        return { value, opened, nodes }
      },
      template: '<RsTreeSelect v-model="value" v-model:open="opened" :tree-data="nodes" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const leaf = document.querySelector('[data-tree-key="pg"]') as HTMLElement
    leaf.click()
    await nextTick()
    expect(wrapper.vm.value).toBe('pg')
    expect(wrapper.vm.opened).toBe(false)
    wrapper.unmount()
  })

  it('keeps the panel open when checkable and writes an array', async () => {
    const Host = defineComponent({
      components: { RsTreeSelect },
      setup() {
        const value = ref<string[]>([])
        const opened = ref(true)
        return { value, opened, nodes }
      },
      template:
        '<RsTreeSelect v-model="value" v-model:open="opened" checkable :tree-data="nodes" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const box = Array.from(document.querySelectorAll('.rs-tree__checkbox-input')).find((el) => {
      const row = el.closest('.rs-tree__row, [role="treeitem"]')
      return row?.textContent?.includes('Cache')
    }) as HTMLInputElement
    box.click()
    await nextTick()
    expect(wrapper.vm.value).toContain('cache')
    expect(wrapper.vm.opened).toBe(true)
    wrapper.unmount()
  })

  it('does not open when disabled', async () => {
    const wrapper = mount(RsTreeSelect, {
      props: { treeData: nodes, disabled: true },
      attachTo: document.body,
    })
    await wrapper.find('.rs-tree-select').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(document.querySelector('.rs-tree-select__panel')).toBeNull()
    wrapper.unmount()
  })

  it('inherits Form.disabled', async () => {
    const Host = defineComponent({
      components: { RsForm, RsTreeSelect },
      setup() {
        return { nodes }
      },
      template: '<RsForm disabled><RsTreeSelect :tree-data="nodes" /></RsForm>',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('.rs-tree-select').trigger('click')
    expect(document.querySelector('.rs-tree-select__panel')).toBeNull()
    wrapper.unmount()
  })

  it('clears the value and emits change / clear', async () => {
    const wrapper = mount(RsTreeSelect, {
      props: { treeData: nodes, allowClear: true, modelValue: 'pg' },
      attachTo: document.body,
    })
    await nextTick()
    await wrapper.find('.rs-tree-select__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('change')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    wrapper.unmount()
  })

  it('exposes focus on the trigger', async () => {
    const Host = defineComponent({
      components: { RsTreeSelect },
      setup() {
        const treeSelectRef = ref<RsTreeSelectExpose | null>(null)
        return { treeSelectRef, nodes }
      },
      template: '<RsTreeSelect ref="treeSelectRef" :tree-data="nodes" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    wrapper.vm.treeSelectRef!.focus()
    expect(document.activeElement).toBe(wrapper.find('.rs-tree-select').element)
    wrapper.unmount()
  })

  it('detaches overlay listeners on unmount while open', async () => {
    const wrapper = mount(RsTreeSelect, {
      props: { treeData: nodes, open: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.querySelector('.rs-tree-select__panel')).not.toBeNull()
    wrapper.unmount()
    expect(document.querySelector('.rs-tree-select__panel')).toBeNull()
  })
})
