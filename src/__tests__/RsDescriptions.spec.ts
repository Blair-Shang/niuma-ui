import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import RsDescriptions from '../components/RsDescriptions.vue'
import RsConfigProvider from '../components/RsConfigProvider.vue'

const sampleItems = [
  { key: 'name', label: '名称', value: '弱水' },
  { key: 'owner', label: '负责人', value: 'Ada' },
]

describe('RsDescriptions', () => {
  it('defaults to md size without config override', () => {
    const wrapper = mount(RsDescriptions, {
      props: { items: sampleItems },
    })
    expect(wrapper.classes()).toContain('rs-descriptions--md')
  })

  it('inherits controlSize from RsConfigProvider when size omitted', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'sm' },
      slots: {
        default: () => h(RsDescriptions, { items: sampleItems }),
      },
    })
    expect(wrapper.find('.rs-descriptions').classes()).toContain('rs-descriptions--sm')
  })

  it('props size overrides RsConfigProvider controlSize', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'sm' },
      slots: {
        default: () => h(RsDescriptions, { items: sampleItems, size: 'lg' }),
      },
    })
    expect(wrapper.find('.rs-descriptions').classes()).toContain('rs-descriptions--lg')
    expect(wrapper.find('.rs-descriptions').classes()).not.toContain('rs-descriptions--sm')
  })

  it('supports ssm from config', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'ssm' },
      slots: {
        default: () => h(RsDescriptions, { items: sampleItems }),
      },
    })
    expect(wrapper.find('.rs-descriptions').classes()).toContain('rs-descriptions--ssm')
  })
})
