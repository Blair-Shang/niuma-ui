import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import RsBreadcrumb from '../src/RsBreadcrumb.vue'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'

const threeLevelItems = [
  { label: '首页', href: '/' },
  { label: '应用', href: '/apps' },
  { label: '详情' },
]

describe('RsBreadcrumb', () => {
  it('renders nav with breadcrumb aria-label', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    expect(wrapper.find('nav.rs-breadcrumb').attributes('aria-label')).toBe('Breadcrumb')
  })

  it('renders all items', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('应用')
    expect(wrapper.text()).toContain('详情')
  })

  it('renders single item without separator', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [{ label: '仅一项' }] },
    })
    expect(wrapper.findAll('.rs-breadcrumb__item')).toHaveLength(1)
    expect(wrapper.findAll('.rs-breadcrumb__sep')).toHaveLength(0)
    expect(wrapper.text()).toBe('仅一项')
  })

  it('renders empty list when items is empty', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [] },
    })
    expect(wrapper.findAll('.rs-breadcrumb__item')).toHaveLength(0)
    expect(wrapper.find('.rs-breadcrumb__list').exists()).toBe(true)
  })

  it('renders href items as anchor with correct href', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [
          { label: '首页', href: '/' },
          { label: '当前页' },
        ],
      },
    })
    const anchors = wrapper.findAll('a.rs-breadcrumb__link')
    expect(anchors).toHaveLength(1)
    expect(anchors[0]?.text()).toBe('首页')
    expect(anchors[0]?.attributes('href')).toBe('/')
  })

  it('renders plain items as span without href', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [{ label: 'A' }, { label: 'B' }] },
    })
    const spans = wrapper.findAll('span.rs-breadcrumb__link')
    expect(spans).toHaveLength(2)
    expect(spans[0]?.text()).toBe('A')
    expect(spans[1]?.text()).toBe('B')
  })

  it('renders anchor when only to is provided', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [{ label: '路由页', to: '/route' }, { label: '当前' }],
      },
    })
    const anchors = wrapper.findAll('a.rs-breadcrumb__link')
    expect(anchors).toHaveLength(1)
    expect(anchors[0]?.attributes('href')).toBe('/route')
    expect(wrapper.findAll('span.rs-breadcrumb__link')).toHaveLength(1)
  })

  it('marks last item as current page', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [{ label: 'A' }, { label: 'B' }] },
    })
    const links = wrapper.findAll('.rs-breadcrumb__link')
    expect(links.at(-1)?.attributes('aria-current')).toBe('page')
  })

  it('does not set aria-current on non-last items', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    const links = wrapper.findAll('.rs-breadcrumb__link')
    expect(links[0]?.attributes('aria-current')).toBeUndefined()
    expect(links[1]?.attributes('aria-current')).toBeUndefined()
    expect(links[2]?.attributes('aria-current')).toBe('page')
  })

  it('applies current class only to last item', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    const links = wrapper.findAll('.rs-breadcrumb__link')
    expect(links[0]?.classes()).not.toContain('rs-breadcrumb__link--current')
    expect(links[1]?.classes()).not.toContain('rs-breadcrumb__link--current')
    expect(links[2]?.classes()).toContain('rs-breadcrumb__link--current')
  })

  it('renders separators between items but not after last', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    expect(wrapper.findAll('.rs-breadcrumb__sep')).toHaveLength(2)
    expect(wrapper.findAll('.rs-breadcrumb__item')).toHaveLength(3)
  })

  it('renders separator icon with accessible label', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [{ label: 'A' }, { label: 'B' }] },
    })
    const sep = wrapper.find('.rs-breadcrumb__sep')
    expect(sep.exists()).toBe(true)
    expect(sep.attributes('aria-label')).toBe('Separator')
  })

  it('renders i18n labels in en-US locale', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () =>
          h(RsBreadcrumb, {
            items: [{ label: 'Home', href: '/' }, { label: 'Docs' }],
          }),
      },
    })
    expect(wrapper.find('nav.rs-breadcrumb').attributes('aria-label')).toBe('Breadcrumb')
    expect(wrapper.find('.rs-breadcrumb__sep').attributes('aria-label')).toBe('Separator')
  })

  it('uses href as rendered anchor href when both to and href exist', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [
          { label: 'Entry', to: '/route-target', href: '/href-target' },
          { label: 'Current' },
        ],
      },
    })
    const anchor = wrapper.find('a.rs-breadcrumb__link')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('/href-target')
  })

  it('updates current item and separators after items prop changes', async () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [{ label: 'Root' }, { label: 'Leaf' }] },
    })
    expect(wrapper.findAll('.rs-breadcrumb__sep')).toHaveLength(1)
    expect(wrapper.findAll('.rs-breadcrumb__link')[1]?.text()).toBe('Leaf')

    await wrapper.setProps({
      items: [{ label: 'Root' }, { label: 'Branch' }, { label: 'Leaf' }],
    })

    const links = wrapper.findAll('.rs-breadcrumb__link')
    expect(wrapper.findAll('.rs-breadcrumb__sep')).toHaveLength(2)
    expect(links[1]?.attributes('aria-current')).toBeUndefined()
    expect(links[2]?.attributes('aria-current')).toBe('page')
    expect(links[2]?.text()).toBe('Leaf')
  })

  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.find('nav.rs-breadcrumb').exists()).toBe(true)
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems },
    })
    expect(wrapper.vm.$options.name).toBe('RsBreadcrumb')
  })

  it('uses ariaLabel when provided', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems, ariaLabel: 'Path' },
    })
    expect(wrapper.find('nav.rs-breadcrumb').attributes('aria-label')).toBe('Path')
  })

  it('renders a custom text separator', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: threeLevelItems, separator: '/' },
    })
    expect(wrapper.findAll('.rs-breadcrumb__sep')).toHaveLength(2)
    expect(wrapper.find('.rs-breadcrumb__sep').text()).toBe('/')
  })

  it('collapses middle items and expands on more click', async () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        maxItems: 3,
        items: [
          { label: 'A', href: '/a' },
          { label: 'B', href: '/b' },
          { label: 'C', href: '/c' },
          { label: 'D', href: '/d' },
          { label: 'E' },
        ],
      },
    })
    expect(wrapper.find('.rs-breadcrumb__more').exists()).toBe(true)
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).not.toContain('B')
    expect(wrapper.text()).toContain('E')

    await wrapper.find('.rs-breadcrumb__more').trigger('click')
    expect(wrapper.find('.rs-breadcrumb__more').exists()).toBe(false)
    expect(wrapper.text()).toContain('B')
    expect(wrapper.text()).toContain('C')
  })

  it('renders disabled items as spans and still emits click', async () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Locked', href: '/locked', disabled: true },
          { label: 'Now' },
        ],
      },
    })
    const disabled = wrapper.find('.rs-breadcrumb__link--disabled')
    expect(disabled.element.tagName).toBe('SPAN')
    expect(disabled.attributes('aria-disabled')).toBe('true')

    await disabled.trigger('click')
    const emitted = wrapper.emitted('click')
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toMatchObject({ label: 'Locked', disabled: true })
  })

  it('adds noopener noreferrer on target=_blank', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [
          { label: 'Docs', href: 'https://vuejs.org', target: '_blank' },
          { label: 'Here' },
        ],
      },
    })
    const anchor = wrapper.find('a.rs-breadcrumb__link')
    expect(anchor.attributes('target')).toBe('_blank')
    expect(anchor.attributes('rel')).toBe('noopener noreferrer')
  })

  it('renders the last item as a span even when it has href', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Here', href: '/here' },
        ],
      },
    })
    const current = wrapper.find('.rs-breadcrumb__link--current')
    expect(current.element.tagName).toBe('SPAN')
    expect(current.attributes('aria-current')).toBe('page')
  })

  it('renders item icons', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: {
        items: [
          { label: 'Home', href: '/', icon: 'house' },
          { label: 'Now' },
        ],
      },
    })
    expect(wrapper.find('.rs-breadcrumb__icon').exists()).toBe(true)
  })

  it('renders #item and #separator slots', () => {
    const wrapper = mount(RsBreadcrumb, {
      props: { items: [{ label: 'Home', href: '/' }, { label: 'Now' }] },
      slots: {
        item: ({ item, isCurrent }: { item: { label: string }; isCurrent: boolean }) =>
          `${isCurrent ? '●' : '○'} ${item.label}`,
        separator: () => '|',
      },
    })
    expect(wrapper.text()).toContain('○ Home')
    expect(wrapper.text()).toContain('● Now')
    expect(wrapper.text()).toContain('|')
  })
})

