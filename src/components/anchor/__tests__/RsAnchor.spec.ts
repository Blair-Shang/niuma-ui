import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  flattenAnchorItems,
  hrefToAnchorId,
  pickActiveAnchorHref,
} from '../src/anchor-utils'
import RsAnchor from '../src/RsAnchor.vue'

const items = [
  { href: '#overview', title: '概述' },
  {
    href: '#api',
    title: 'API',
    children: [{ href: '#props', title: '属性' }],
  },
]

describe('anchor-utils', () => {
  it('hrefToAnchorId strips hash and URL prefix', () => {
    expect(hrefToAnchorId('#overview')).toBe('overview')
    expect(hrefToAnchorId('overview')).toBe('overview')
    expect(hrefToAnchorId('/docs#api')).toBe('api')
  })

  it('flattenAnchorItems keeps document order and depth', () => {
    expect(flattenAnchorItems(items)).toEqual([
      { href: '#overview', title: '概述', depth: 0 },
      { href: '#api', title: 'API', depth: 0 },
      { href: '#props', title: '属性', depth: 1 },
    ])
  })

  it('pickActiveAnchorHref uses the last heading that has crossed the offset', () => {
    const entries = [
      { href: '#overview', top: -40 },
      { href: '#api', top: 8 },
      { href: '#props', top: 120 },
    ]
    expect(pickActiveAnchorHref(entries, 16)).toBe('#api')
    expect(pickActiveAnchorHref(entries, 0)).toBe('#overview')
  })
})

describe('RsAnchor', () => {
  it('renders titles and nested indent', () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false },
    })
    expect(wrapper.text()).toContain('概述')
    expect(wrapper.text()).toContain('API')
    expect(wrapper.text()).toContain('属性')
    const propsLink = wrapper.find('[data-rs-anchor-href="#props"]')
    expect(propsLink.exists()).toBe(true)
  })

  it('emits click and change when a link is selected', async () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false },
    })
    await wrapper.find('[data-rs-anchor-href="#api"]').trigger('click')
    expect(wrapper.emitted('click')?.[0]?.[0]).toBe('#api')
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('#api')
    expect(wrapper.find('[data-rs-anchor-href="#api"]').classes()).toContain('rs-anchor__link--active')
  })
})
