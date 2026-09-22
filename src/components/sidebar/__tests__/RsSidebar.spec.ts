import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import RsSidebar from '../src/RsSidebar.vue'
import RsSidebarGroup from '../src/RsSidebarGroup.vue'
import RsSidebarItem from '../src/RsSidebarItem.vue'
import type { RsSidebarExpose } from '../src/sidebar-utils'

describe('RsSidebar', () => {
  it('renders aside with title and subtitle', () => {
    const wrapper = mount(RsSidebar, {
      props: { title: '弱水', subtitle: 'Studio' },
    })
    expect(wrapper.element.tagName).toBe('ASIDE')
    expect(wrapper.find('.rs-sidebar__title').text()).toBe('弱水')
    expect(wrapper.find('.rs-sidebar__subtitle').text()).toBe('Studio')
  })

  it.each(['sm', 'md', 'lg'] as const)('applies %s width class', (width) => {
    const wrapper = mount(RsSidebar, { props: { width } })
    expect(wrapper.classes()).toContain(`rs-sidebar--${width}`)
  })

  it('toggles collapsed via collapse button', async () => {
    const wrapper = mount(RsSidebar, {
      props: { title: '弱水', collapsible: true, collapsed: false },
    })
    expect(wrapper.classes()).not.toContain('rs-sidebar--collapsed')
    await wrapper.find('.rs-sidebar__collapse').trigger('click')
    expect(wrapper.emitted('update:collapsed')?.pop()).toEqual([true])
    expect(wrapper.emitted('change')?.pop()).toEqual([true])
  })

  it('hides subtitle when collapsed', () => {
    const wrapper = mount(RsSidebar, {
      props: { title: '弱水', subtitle: 'Studio', collapsed: true },
    })
    expect(wrapper.classes()).toContain('rs-sidebar--collapsed')
    expect(wrapper.find('.rs-sidebar__subtitle').exists()).toBe(false)
  })

  it('renders custom header slot', () => {
    const wrapper = mount(RsSidebar, {
      slots: { header: '<div class="custom-header">自定义顶栏</div>' },
    })
    expect(wrapper.find('.custom-header').text()).toBe('自定义顶栏')
    expect(wrapper.find('.rs-sidebar__title').exists()).toBe(false)
  })

  it('renders footer slot with collapsed scope', () => {
    const wrapper = mount(RsSidebar, {
      props: { collapsed: true },
      slots: {
        footer: ({ collapsed }: { collapsed: boolean }) =>
          h('div', { class: 'footer-state' }, collapsed ? 'folded' : 'open'),
      },
    })
    expect(wrapper.find('.footer-state').text()).toBe('folded')
  })

  it('passes collapsed to default slot scope', () => {
    const wrapper = mount(RsSidebar, {
      props: { collapsed: true },
      slots: {
        default: ({ collapsed }: { collapsed: boolean }) =>
          h('div', { class: 'body-state' }, collapsed ? 'yes' : 'no'),
      },
    })
    expect(wrapper.find('.body-state').text()).toBe('yes')
  })

  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsSidebar, {
      props: { title: 'Studio' },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.element.tagName).toBe('ASIDE')
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsSidebar, { props: { title: 'Studio' } })
    expect(wrapper.vm.$options.name).toBe('RsSidebar')
  })

  it('uses ariaLabel when provided', () => {
    const wrapper = mount(RsSidebar, {
      props: { title: 'Studio', ariaLabel: 'Workbench' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Workbench')
  })

  it('exposes expand / collapse / toggle / focus', async () => {
    const wrapper = mount(RsSidebar, {
      props: { title: 'Studio', collapsible: true, collapsed: true },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as RsSidebarExpose
    exposed.expand()
    await nextTick()
    expect(wrapper.emitted('update:collapsed')?.pop()).toEqual([false])
    exposed.collapse()
    await nextTick()
    expect(wrapper.emitted('change')?.pop()).toEqual([true])
    exposed.toggle()
    await nextTick()
    expect(wrapper.emitted('update:collapsed')?.pop()).toEqual([false])
    exposed.focus()
    expect(document.activeElement).toBe(wrapper.find('.rs-sidebar__collapse').element)
    wrapper.unmount()
  })

  it('binds and removes the hotkey listener', async () => {
    const wrapper = mount(RsSidebar, {
      props: { title: 'Studio', collapsible: true, collapsed: false, hotkey: 'b' },
      attachTo: document.body,
    })
    await nextTick()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }),
    )
    await nextTick()
    expect(wrapper.emitted('update:collapsed')?.pop()).toEqual([true])
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('does not toggle from an input while the hotkey is pressed', async () => {
    const wrapper = mount(RsSidebar, {
      props: { title: 'Studio', collapsible: true, hotkey: 'b' },
      attachTo: document.body,
    })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }),
    )
    await nextTick()
    expect(wrapper.emitted('update:collapsed')).toBeUndefined()
    input.remove()
    wrapper.unmount()
  })
})

describe('RsSidebarGroup', () => {
  it('renders group title', () => {
    const wrapper = mount(RsSidebarGroup, {
      props: { title: '导航' },
      slots: { default: '<button class="item">项</button>' },
    })
    expect(wrapper.find('.rs-sidebar-group__title').text()).toBe('导航')
  })

  it('hides group title when collapsed', () => {
    const wrapper = mount(RsSidebarGroup, {
      props: { title: '导航', collapsed: true },
    })
    expect(wrapper.find('.rs-sidebar-group__title').exists()).toBe(false)
  })

  it('inherits collapsed from RsSidebar without an explicit prop', () => {
    const Host = defineComponent({
      components: { RsSidebar, RsSidebarGroup, RsSidebarItem },
      template: `
        <RsSidebar title="Studio" :collapsed="true">
          <RsSidebarGroup title="导航">
            <RsSidebarItem label="首页" />
          </RsSidebarGroup>
        </RsSidebar>
      `,
    })
    const wrapper = mount(Host)
    expect(wrapper.find('.rs-sidebar--collapsed').exists()).toBe(true)
    expect(wrapper.find('.rs-sidebar-group__title').exists()).toBe(false)
    expect(wrapper.find('.rs-sidebar-item__label').exists()).toBe(false)
  })
})

describe('RsSidebarItem', () => {
  it('renders label and icon', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '仪表盘', icon: 'layout-dashboard' },
    })
    expect(wrapper.find('.rs-sidebar-item__label').text()).toBe('仪表盘')
    expect(wrapper.find('.rs-sidebar-item__icon').exists()).toBe(true)
  })

  it('applies active class', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '仪表盘', active: true },
    })
    expect(wrapper.classes()).toContain('rs-sidebar-item--active')
    expect(wrapper.attributes('aria-current')).toBe('page')
  })

  it('disables interaction when disabled', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '不可用', disabled: true },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('hides label and sets title when collapsed', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '设置', collapsed: true },
    })
    expect(wrapper.find('.rs-sidebar-item__label').exists()).toBe(false)
    expect(wrapper.attributes('title')).toBe('设置')
    expect(wrapper.classes()).toContain('rs-sidebar-item--collapsed')
  })

  it('renders a link when href is set and merges rel for _blank', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '文档', href: 'https://example.com', target: '_blank' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('https://example.com')
    expect(wrapper.attributes('rel')).toBe('noopener noreferrer')
  })

  it('writes to as href when href is omitted', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '应用', to: '/apps' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/apps')
  })

  it('emits click and prevents navigation when disabled', async () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '锁定', href: '/locked', disabled: true },
    })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    await nextTick()
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('shows a badge and a collapsed dot', () => {
    const wrapper = mount(RsSidebarItem, {
      props: { label: '收件箱', badge: 4 },
    })
    expect(wrapper.find('.rs-sidebar-item__badge').text()).toBe('4')
    const folded = mount(RsSidebarItem, {
      props: { label: '收件箱', badge: 4, collapsed: true },
    })
    expect(folded.find('.rs-sidebar-item__badge--dot').exists()).toBe(true)
    expect(folded.find('.rs-sidebar-item__badge').text()).toBe('')
  })
})
