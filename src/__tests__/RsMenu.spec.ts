import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import RsMenu from '../components/RsMenu.vue'
import RsConfigProvider from '../components/RsConfigProvider.vue'
import type { RsMenuItem, RsMenuItemGroup } from '../components/menu-utils'

describe('RsMenu', () => {
  const flatItems: RsMenuItem[] = [
    { key: 'dashboard', label: '仪表盘', icon: 'layout-dashboard' },
    { key: 'chat', label: '对话', icon: 'message-square' },
    { key: 'settings', label: '设置', icon: 'settings' },
  ]

  const groupedItems: RsMenuItemGroup[] = [
    {
      label: '工作区',
      children: [
        { key: 'projects', label: '项目', icon: 'folder' },
        { key: 'docs', label: '文档', icon: 'search' },
      ],
    },
    {
      label: '系统',
      children: [{ key: 'settings', label: '设置', icon: 'settings' }],
    },
  ]

  const nestedItems: RsMenuItem[] = [
    {
      key: 'workspace',
      label: '工作区',
      icon: 'folder',
      children: [
        { key: 'projects', label: '项目' },
        { key: 'archived', label: '归档', disabled: true },
      ],
    },
    { key: 'settings', label: '设置', icon: 'settings' },
  ]

  const deepNestedItems: RsMenuItem[] = [
    {
      key: 'workspace',
      label: '工作区',
      children: [
        {
          key: 'team',
          label: '团队',
          children: [
            { key: 'members', label: '成员' },
            { key: 'permissions', label: '权限' },
          ],
        },
      ],
    },
  ]

  const groupedNestedItems: RsMenuItemGroup[] = [
    {
      label: '产品',
      children: [
        {
          key: 'product-line',
          label: '产品线',
          children: [{ key: 'saas-billing', label: '计费' }],
        },
      ],
    },
  ]

  it('renders nav with menu aria-label', () => {
    const wrapper = mount(RsMenu, {
      props: { items: flatItems, modelValue: 'dashboard' },
    })
    expect(wrapper.find('nav.rs-menu').attributes('aria-label')).toBe('导航菜单')
  })

  it('uses en-US aria-label when locale is en-US', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () =>
          h(RsMenu, {
            items: flatItems,
            modelValue: 'dashboard',
          }),
      },
    })
    expect(wrapper.find('nav.rs-menu').attributes('aria-label')).toBe('Navigation menu')
  })

  it('applies vertical mode class by default', () => {
    const wrapper = mount(RsMenu, {
      props: { items: flatItems, modelValue: 'dashboard' },
    })
    expect(wrapper.classes()).toContain('rs-menu--vertical')
  })

  it('applies horizontal mode class', () => {
    const wrapper = mount(RsMenu, {
      props: { items: flatItems, modelValue: 'dashboard', mode: 'horizontal' },
    })
    expect(wrapper.classes()).toContain('rs-menu--horizontal')
  })

  it('marks active leaf with aria-current and active class', () => {
    const wrapper = mount(RsMenu, {
      props: { items: flatItems, modelValue: 'chat' },
    })
    const active = wrapper.find('.rs-menu__item--active')
    expect(active.exists()).toBe(true)
    expect(active.attributes('aria-current')).toBe('page')
    expect(active.text()).toContain('对话')
  })

  it('does not highlight parent by default when nested leaf is active', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'projects',
        openKeys: ['workspace'],
      },
    })
    const actives = wrapper.findAll('.rs-menu__item--active')
    expect(actives).toHaveLength(1)
    expect(actives[0]!.text()).toContain('项目')
    expect(actives[0]!.attributes('aria-current')).toBe('page')
  })

  it('highlights ancestor submenu triggers when highlightParent is true', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'projects',
        openKeys: ['workspace'],
        highlightParent: true,
      },
    })
    const leaf = wrapper.findAll('.rs-menu__item--active').find((n) => n.text().includes('项目'))
    expect(leaf).toBeDefined()
    expect(leaf?.attributes('aria-current')).toBe('page')
    const parent = wrapper
      .findAll('.rs-menu__item--active-parent')
      .find((n) => n.text().includes('工作区'))
    expect(parent).toBeDefined()
    expect(parent?.attributes('aria-current')).toBeUndefined()
    expect(parent!.classes()).not.toContain('rs-menu__item--active')
  })

  it('highlights collapsed parent icon when highlightParent is true', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'projects',
        openKeys: [],
        collapsed: true,
        highlightParent: true,
      },
    })
    const parent = wrapper
      .findAll('.rs-menu__item--submenu-trigger')
      .find((btn) => btn.attributes('aria-label') === '工作区')
    expect(parent).toBeDefined()
    expect(parent!.classes()).toContain('rs-menu__item--active-parent')
    expect(parent!.classes()).not.toContain('rs-menu__item--active')
  })

  it('emits select and updates model when item clicked', async () => {
    const wrapper = mount(RsMenu, {
      props: { items: flatItems, modelValue: 'dashboard' },
    })
    const buttons = wrapper.findAll('.rs-menu__item')
    const targetButton = buttons[1]
    expect(targetButton).toBeDefined()
    if (!targetButton) return
    await targetButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['chat'])
    expect(wrapper.emitted('select')?.[0]).toEqual(['chat'])
  })

  it('renders group labels', () => {
    const wrapper = mount(RsMenu, {
      props: { items: groupedItems, modelValue: 'projects' },
    })
    expect(wrapper.find('.rs-menu__group-label').text()).toBe('工作区')
    expect(wrapper.findAll('.rs-menu__group-label').map((n) => n.text())).toEqual([
      '工作区',
      '系统',
    ])
  })

  it('auto-expands parent submenu for active nested item', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'projects',
        openKeys: [],
      },
    })
    expect(wrapper.emitted('update:openKeys')?.pop()?.[0]).toContain('workspace')
  })

  it('auto-expands all ancestor keys for deeply nested active item', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: deepNestedItems,
        modelValue: 'permissions',
        openKeys: [],
      },
    })
    const keys = wrapper.emitted('update:openKeys')?.pop()?.[0] as string[]
    expect(keys).toEqual(expect.arrayContaining(['workspace', 'team']))
  })

  it('auto-expands ancestors inside grouped nested items', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: groupedNestedItems,
        modelValue: 'saas-billing',
        openKeys: [],
      },
    })
    expect(wrapper.emitted('update:openKeys')?.pop()?.[0]).toContain('product-line')
  })

  it('toggles openKeys when submenu trigger is clicked', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: [],
      },
    })
    const trigger = wrapper.find('.rs-menu__item--submenu-trigger')
    expect(trigger.exists()).toBe(true)
    await trigger.trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:openKeys')?.pop()?.[0]).toContain('workspace')
  })

  it('closes submenu when open trigger is clicked again', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: ['workspace'],
      },
    })
    const trigger = wrapper.find('.rs-menu__item--submenu-trigger')
    await trigger.trigger('click')
    await nextTick()
    const keys = wrapper.emitted('update:openKeys')?.pop()?.[0] as string[]
    expect(keys).not.toContain('workspace')
  })

  it('selects nested leaf under open submenu', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: ['workspace'],
      },
    })
    const projects = wrapper
      .findAll('.rs-menu__item')
      .find((btn) => btn.text().includes('项目'))
    expect(projects).toBeDefined()
    await projects!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['projects'])
    expect(wrapper.emitted('select')?.[0]).toEqual(['projects'])
  })

  it('does not emit select for disabled item', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'projects',
        openKeys: ['workspace'],
      },
    })
    const disabled = wrapper.find('.rs-menu__item:disabled')
    expect(disabled.exists()).toBe(true)
    await disabled.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('renders nested submenu as popup list in horizontal mode', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'projects',
        openKeys: ['workspace'],
        mode: 'horizontal',
      },
    })
    expect(wrapper.classes()).toContain('rs-menu--horizontal')
    expect(wrapper.find('.rs-menu__list--nested').exists()).toBe(true)
    expect(wrapper.find('.rs-menu__entry--submenu').exists()).toBe(true)
  })

  it('applies collapsed class and hides labels', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: flatItems,
        modelValue: 'dashboard',
        collapsed: true,
      },
    })
    expect(wrapper.classes()).toContain('rs-menu--collapsed')
    expect(wrapper.find('.rs-menu__label').exists()).toBe(false)
  })

  it('hides group labels when collapsed', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: groupedItems,
        modelValue: 'projects',
        collapsed: true,
      },
    })
    expect(wrapper.find('.rs-menu__group-label').exists()).toBe(false)
  })

  it('sets title and aria-label on items when collapsed', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: flatItems,
        modelValue: 'dashboard',
        collapsed: true,
      },
    })
    const settings = wrapper
      .findAll('.rs-menu__item')
      .find((btn) => btn.attributes('title') === '设置')
    expect(settings).toBeDefined()
    expect(settings!.attributes('aria-label')).toBe('设置')
  })

  it('still selects leaf items when collapsed', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: flatItems,
        modelValue: 'dashboard',
        collapsed: true,
      },
    })
    const chat = wrapper
      .findAll('.rs-menu__item')
      .find((btn) => btn.attributes('title') === '对话')
    expect(chat).toBeDefined()
    await chat!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['chat'])
    expect(wrapper.emitted('select')?.[0]).toEqual(['chat'])
  })

  it('does not render inline nested submenu list when collapsed', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: ['workspace'],
        collapsed: true,
      },
      attachTo: document.body,
    })
    expect(wrapper.find('.rs-menu__list--nested').exists()).toBe(false)
    expect(wrapper.find('.rs-menu__item--submenu-trigger').exists()).toBe(true)
    expect(document.body.querySelector('.rs-menu__flyout')).toBeNull()
    wrapper.unmount()
  })

  it('shows flyout submenu on hover when collapsed vertically', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: [],
        collapsed: true,
      },
      attachTo: document.body,
    })
    const parent = wrapper
      .findAll('.rs-menu__item')
      .find((btn) => btn.attributes('aria-label') === '工作区')
    expect(parent).toBeDefined()

    await parent!.trigger('mouseenter')
    await nextTick()
    await flushPromises()

    const flyout = document.body.querySelector('.rs-menu__flyout')
    expect(flyout).not.toBeNull()
    expect(flyout?.textContent).toContain('工作区')
    expect(flyout?.textContent).toContain('项目')
    expect(wrapper.emitted('update:openKeys')).toBeUndefined()
    // 折叠态父级点击不选中父 key，仅用于打开浮层
    await parent!.trigger('click')
    await nextTick()
    expect(wrapper.emitted('select')).toBeUndefined()
    wrapper.unmount()
  })

  it('selects nested leaf from collapsed flyout', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: [],
        collapsed: true,
      },
      attachTo: document.body,
    })
    const parent = wrapper
      .findAll('.rs-menu__item')
      .find((btn) => btn.attributes('aria-label') === '工作区')
    expect(parent).toBeDefined()
    await parent!.trigger('mouseenter')
    await nextTick()
    await flushPromises()

    const projects = Array.from(
      document.body.querySelectorAll('.rs-menu__flyout .rs-menu__item'),
    ).find((el) => el.textContent?.includes('项目')) as HTMLButtonElement | undefined
    expect(projects).toBeDefined()
    projects!.click()
    await nextTick()
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['projects'])
    expect(wrapper.emitted('select')?.[0]).toEqual(['projects'])
    expect(document.body.querySelector('.rs-menu__flyout')).toBeNull()
    wrapper.unmount()
  })

  it('renders icons on collapsed triggers and flyout children', async () => {
    const iconNestedItems: RsMenuItem[] = [
      {
        key: 'workspace',
        label: '工作区',
        icon: 'folder',
        children: [
          { key: 'projects', label: '项目', icon: 'box' },
          { key: 'docs', label: '文档', icon: 'file-text' },
        ],
      },
      { key: 'settings', label: '设置', icon: 'settings' },
    ]
    const wrapper = mount(RsMenu, {
      props: {
        items: iconNestedItems,
        modelValue: 'settings',
        openKeys: [],
        collapsed: true,
      },
      attachTo: document.body,
    })

    const triggers = wrapper.findAll('.rs-menu__item')
    expect(triggers.every((btn) => btn.find('.rs-menu__icon').exists())).toBe(true)

    const parent = triggers.find((btn) => btn.attributes('aria-label') === '工作区')
    expect(parent).toBeDefined()
    await parent!.trigger('mouseenter')
    await nextTick()
    await flushPromises()

    const flyout = document.body.querySelector('.rs-menu__flyout')
    expect(flyout).not.toBeNull()
    expect(flyout!.querySelectorAll('.rs-menu__icon').length).toBeGreaterThanOrEqual(2)
    expect(flyout!.textContent).toContain('项目')
    expect(flyout!.textContent).toContain('文档')
    wrapper.unmount()
  })

  it('keeps horizontal submenu expandable even when collapsed prop is true', async () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        openKeys: [],
        mode: 'horizontal',
        collapsed: true,
      },
    })
    // 水平模式忽略 collapsed：仍显示文案，不挂 rs-menu--collapsed
    expect(wrapper.classes()).not.toContain('rs-menu--collapsed')
    expect(wrapper.text()).toContain('工作区')
    const trigger = wrapper.find('.rs-menu__item--submenu-trigger')
    expect(trigger.exists()).toBe(true)
    await trigger.trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:openKeys')?.pop()?.[0]).toContain('workspace')
    // 子菜单内容可见，而非空气泡
    expect(wrapper.find('.rs-menu__list--nested').exists()).toBe(true)
    expect(wrapper.text()).toContain('项目')
  })

  it('does not hide horizontal labels when collapsed is true', () => {
    const wrapper = mount(RsMenu, {
      props: {
        items: nestedItems,
        modelValue: 'settings',
        mode: 'horizontal',
        collapsed: true,
      },
    })
    expect(wrapper.find('.rs-menu__label').exists()).toBe(true)
    expect(wrapper.find('.rs-menu__submenu-arrow').exists()).toBe(true)
  })
})
