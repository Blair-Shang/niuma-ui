import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  flattenAnchorItems,
  hrefToAnchorId,
  isAnchorScrolledToEnd,
  isAnchorWindow,
  pickActiveAnchorHref,
  resolveAnchorContainer,
  resolveAnchorScrollBehavior,
  type RsAnchorExpose,
} from '../src/anchor-utils'
import RsAnchor from '../src/RsAnchor.vue'

const items = [
  { href: '#overview', title: 'Overview' },
  {
    href: '#api',
    title: 'API',
    children: [{ href: '#props', title: 'Props' }],
  },
]

describe('anchor-utils', () => {
  it('hrefToAnchorId strips hash, URL prefix, and decodes', () => {
    expect(hrefToAnchorId('#overview')).toBe('overview')
    expect(hrefToAnchorId('overview')).toBe('overview')
    expect(hrefToAnchorId('/docs#api')).toBe('api')
    expect(hrefToAnchorId('#%E6%A6%82%E8%BF%B0')).toBe('概述')
    expect(hrefToAnchorId('%E7%AB%A0%E8%8A%82')).toBe('章节')
  })

  it('flattenAnchorItems keeps document order, depth, and disabled', () => {
    expect(
      flattenAnchorItems([
        ...items,
        { href: '#legacy', title: 'Legacy', disabled: true },
      ]),
    ).toEqual([
      { href: '#overview', title: 'Overview', depth: 0, disabled: undefined },
      { href: '#api', title: 'API', depth: 0, disabled: undefined },
      { href: '#props', title: 'Props', depth: 1, disabled: undefined },
      { href: '#legacy', title: 'Legacy', depth: 0, disabled: true },
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
    expect(pickActiveAnchorHref(entries, 16, { atEnd: true })).toBe('#props')
    expect(pickActiveAnchorHref([], 12)).toBe('')
  })

  it('isAnchorScrolledToEnd treats a container at max scroll as the end', () => {
    const box = document.createElement('div')
    Object.defineProperty(box, 'scrollTop', { configurable: true, value: 96 })
    Object.defineProperty(box, 'scrollHeight', { configurable: true, value: 200 })
    Object.defineProperty(box, 'clientHeight', { configurable: true, value: 100 })
    expect(isAnchorScrolledToEnd(box)).toBe(true)
    Object.defineProperty(box, 'scrollTop', { configurable: true, value: 20 })
    expect(isAnchorScrolledToEnd(box)).toBe(false)
  })

  it('isAnchorWindow uses scrollY / nodeType, not instanceof', () => {
    expect(isAnchorWindow(window)).toBe(true)
    expect(isAnchorWindow(document.createElement('div'))).toBe(false)
    expect(isAnchorWindow(null)).toBe(false)
  })

  it('resolveAnchorContainer returns window and does not throw without a getter', () => {
    expect(resolveAnchorContainer()).toBe(window)
    expect(resolveAnchorContainer(() => null)).toBe(window)
  })

  it('resolveAnchorScrollBehavior honors an explicit value', () => {
    expect(resolveAnchorScrollBehavior('auto')).toBe('auto')
    expect(resolveAnchorScrollBehavior('smooth')).toBe('smooth')
  })
})

describe('RsAnchor', () => {
  it('renders titles without reka and uses a native nav', () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('API')
    expect(wrapper.text()).toContain('Props')
    expect(wrapper.find('[data-rs-anchor-href="#props"]').exists()).toBe(true)
  })

  it('emits click and change when a link is selected', async () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false },
    })
    await wrapper.find('[data-rs-anchor-href="#api"]').trigger('click')
    expect(wrapper.emitted('click')?.[0]?.[0]).toBe('#api')
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('#api')
    expect(wrapper.find('[data-rs-anchor-href="#api"]').classes()).toContain(
      'rs-anchor__link--active',
    )
    expect(wrapper.find('[data-rs-anchor-href="#api"]').attributes('aria-current')).toBe(
      'location',
    )
  })

  it('does not activate a disabled item on click', async () => {
    const wrapper = mount(RsAnchor, {
      props: {
        items: [
          { href: '#overview', title: 'Overview' },
          { href: '#legacy', title: 'Legacy', disabled: true },
        ],
        changeHash: false,
      },
    })
    await wrapper.find('[data-rs-anchor-href="#legacy"]').trigger('click')
    expect(wrapper.emitted('click')?.[0]?.[0]).toBe('#legacy')
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.find('[data-rs-anchor-href="#legacy"]').attributes('aria-disabled')).toBe(
      'true',
    )
  })

  it('exposes scrollTo and applies direction / lineless classes', async () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false, direction: 'horizontal', lineless: true },
    })
    expect(wrapper.classes()).toContain('rs-anchor--horizontal')
    expect(wrapper.classes()).toContain('rs-anchor--lineless')
    const exposed = wrapper.vm as unknown as RsAnchorExpose
    exposed.scrollTo('#props')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('#props')
  })

  it('renders the item slot', () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false },
      slots: {
        item: ({ item }: { item: { title: string } }) => `#${item.title}`,
      },
    })
    expect(wrapper.text()).toContain('#Overview')
  })

  it('unmounts without throwing after scroll listeners attach', () => {
    const wrapper = mount(RsAnchor, {
      props: { items, changeHash: false },
    })
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
