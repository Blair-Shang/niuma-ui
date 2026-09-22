import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsDropdown from '../src/RsDropdown.vue'

describe('RsDropdown', () => {
  const items = [
    { label: '对话', value: 'chat', icon: 'message-square' as const },
    { label: '编程', value: 'code', icon: 'folder' as const },
  ]

  const groupedItems = [
    {
      label: '创作',
      options: [
        { label: '对话', value: 'chat', icon: 'message-square' as const },
        { label: '编程', value: 'code', icon: 'folder' as const },
      ],
    },
    {
      label: '检索',
      options: [{ label: '知识库', value: 'kb', icon: 'search' as const }],
    },
  ]

  it('opens menu on trigger click', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    expect(document.body.querySelector('.rs-dropdown__content')).toBeNull()
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__content')).not.toBeNull()
    wrapper.unmount()
  })

  it('emits select when flat item chosen', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    const menuItems = document.body.querySelectorAll('.rs-dropdown__item')
    ;(menuItems[1] as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['code'])
    expect(wrapper.emitted('select')?.[0]).toEqual(['code'])
    wrapper.unmount()
  })

  it('renders grouped labels and nested items', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items: groupedItems, modelValue: 'chat' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    const labels = document.body.querySelectorAll('.rs-dropdown__group-label')
    expect(labels).toHaveLength(2)
    expect(labels[0]?.textContent).toContain('创作')
    expect(labels[1]?.textContent).toContain('检索')
    expect(document.body.querySelectorAll('.rs-dropdown__item')).toHaveLength(3)
    wrapper.unmount()
  })

  it('emits select when grouped item chosen', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items: groupedItems, modelValue: 'chat' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    const menuItems = document.body.querySelectorAll('.rs-dropdown__item')
    ;(menuItems[2] as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['kb'])
    expect(wrapper.emitted('select')?.[0]).toEqual(['kb'])
    wrapper.unmount()
  })

  it('shows selected label from grouped options', () => {
    const wrapper = mount(RsDropdown, {
      props: { items: groupedItems, modelValue: 'kb' },
    })
    expect(wrapper.find('.rs-dropdown__label').text()).toBe('知识库')
  })

  it('shows placeholder when value not in items', () => {
    const wrapper = mount(RsDropdown, {
      props: { items: groupedItems, modelValue: '', placeholder: '选择模式' },
    })
    expect(wrapper.find('.rs-dropdown__label').text()).toBe('选择模式')
    expect(wrapper.find('.rs-dropdown__label--placeholder').exists()).toBe(true)
  })

  it('keeps trigger label when showSelected is false', async () => {
    const wrapper = mount(RsDropdown, {
      props: {
        items,
        modelValue: 'chat',
        showSelected: false,
        placeholder: '更多操作',
      },
      attachTo: document.body,
    })
    expect(wrapper.find('.rs-dropdown__label').text()).toBe('更多操作')

    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    const menuItems = document.body.querySelectorAll('.rs-dropdown__item')
    ;(menuItems[1] as HTMLElement).click()
    await flushPromises()

    expect(wrapper.find('.rs-dropdown__label').text()).toBe('更多操作')
    expect(wrapper.emitted('select')?.[0]).toEqual(['code'])
    wrapper.unmount()
  })

  it('does not mark checked state in action mode', async () => {
    const wrapper = mount(RsDropdown, {
      props: {
        items,
        modelValue: 'chat',
        showSelected: false,
        placeholder: '操作',
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__item[data-state="checked"]')).toBeNull()
    wrapper.unmount()
  })

  it('applies size and fit content width on the menu', async () => {
    const wrapper = mount(RsDropdown, {
      props: {
        items: [
          { label: 'EXPLAIN', value: 'explain', icon: 'list-tree', hint: '估算计划' },
        ],
        showSelected: false,
        size: 'ssm',
        contentWidth: 'fit',
        placeholder: '计划',
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    const panel = document.body.querySelector('.rs-dropdown__content')
    expect(panel?.classList.contains('rs-dropdown__content--ssm')).toBe(true)
    expect(panel?.classList.contains('rs-dropdown__content--fit')).toBe(true)
    expect(document.body.querySelector('.rs-dropdown__item-hint')?.textContent).toContain('估算计划')
    wrapper.unmount()
  })

  it('does not import or render reka-ui', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(document.body.querySelector('[data-reka-popper-content-wrapper]')).toBeNull()
    expect(document.body.querySelector('.rs-dropdown__content')?.getAttribute('role')).toBe('menu')
    wrapper.unmount()
  })

  it('opens from the keyboard and moves with arrows', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    const trigger = wrapper.find('.rs-dropdown__trigger')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__content')).not.toBeNull()
    const panel = document.body.querySelector('.rs-dropdown__content')
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__item[data-highlighted]')?.textContent).toContain('编程')
    wrapper.unmount()
  })

  it('closes on Escape and restores trigger focus', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    const trigger = wrapper.find('.rs-dropdown__trigger')
    ;(trigger.element as HTMLButtonElement).focus()
    await trigger.trigger('click')
    await flushPromises()
    const panel = document.body.querySelector('.rs-dropdown__content')
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__content')).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
    wrapper.unmount()
  })

  it('emits openChange and supports expose open/close/focus', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as {
      open: () => void
      close: () => void
      focus: () => void
    }
    vm.open()
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__content')).not.toBeNull()
    expect(wrapper.emitted('openChange')?.pop()).toEqual([true])
    vm.close()
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__content')).toBeNull()
    expect(wrapper.emitted('openChange')?.pop()).toEqual([false])
    vm.focus()
    expect(document.activeElement).toBe(wrapper.find('.rs-dropdown__trigger').element)
    wrapper.unmount()
  })

  it('renders a divider and danger tone without checked state in action mode', async () => {
    const wrapper = mount(RsDropdown, {
      props: {
        items: [
          { label: '复制', value: 'copy' },
          { label: '', value: 'div', type: 'divider' },
          { label: '删除', value: 'delete', tone: 'danger' },
        ],
        showSelected: false,
        placeholder: '更多',
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__divider')).not.toBeNull()
    expect(document.body.querySelector('.rs-dropdown__item--danger')?.textContent).toContain('删除')
    expect(document.body.querySelector('.rs-dropdown__item[data-state="checked"]')).toBeNull()
    wrapper.unmount()
  })

  it('opens a submenu and selects a child', async () => {
    const wrapper = mount(RsDropdown, {
      props: {
        items: [
          { label: '资料', value: 'profile' },
          {
            label: '主题',
            value: 'theme',
            children: [
              { label: '浅色', value: 'light' },
              { label: '深色', value: 'dark' },
            ],
          },
        ],
        showSelected: false,
        placeholder: '账号',
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    const parent = [...document.body.querySelectorAll('.rs-dropdown__item')].find((node) =>
      node.textContent?.includes('主题'),
    ) as HTMLElement
    parent.click()
    await flushPromises()
    const child = [...document.body.querySelectorAll('.rs-dropdown__submenu .rs-dropdown__item')].find((node) =>
      node.textContent?.includes('深色'),
    ) as HTMLElement
    child.click()
    await flushPromises()
    expect(wrapper.emitted('select')?.[0]).toEqual(['dark'])
    wrapper.unmount()
  })

  it('mounts the panel into getPopupContainer', async () => {
    const host = document.createElement('div')
    host.id = 'dropdown-host'
    document.body.appendChild(host)
    const wrapper = mount(RsDropdown, {
      props: {
        items,
        modelValue: 'chat',
        getPopupContainer: () => host,
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    expect(host.querySelector('.rs-dropdown__content')).not.toBeNull()
    wrapper.unmount()
    host.remove()
  })

  it('removes the panel and listeners when unmounted while open', async () => {
    const wrapper = mount(RsDropdown, {
      props: { items, modelValue: 'chat' },
      attachTo: document.body,
    })
    await wrapper.find('.rs-dropdown__trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-dropdown__content')).not.toBeNull()
    wrapper.unmount()
    expect(document.body.querySelector('.rs-dropdown__content')).toBeNull()
  })
})
