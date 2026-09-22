import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import RsContextMenu from '../src/RsContextMenu.vue'

describe('RsContextMenu', () => {
  const items = [
    { key: 'open', label: '打开', icon: 'folder-open' },
    { key: 'rename', label: '重命名', icon: 'pen-line' },
  ]

  it('opens menu on contextmenu', async () => {
    const wrapper = mount(RsContextMenu, {
      props: { items },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    expect(document.body.querySelector('.rs-context-menu__content')).toBeNull()
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    const content = document.body.querySelector('.rs-context-menu__content')
    expect(content).not.toBeNull()
    expect(content?.hasAttribute('data-placed')).toBe(true)
    const rows = document.body.querySelectorAll('.rs-context-menu__item')
    rows[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    await flushPromises()
    expect(rows[1].hasAttribute('data-highlighted')).toBe(true)
    expect(rows[0].hasAttribute('data-highlighted')).toBe(false)
    wrapper.unmount()
  })

  it('emits select with item key', async () => {
    const wrapper = mount(RsContextMenu, {
      props: { items },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    const menuItems = document.body.querySelectorAll('.rs-context-menu__item')
    ;(menuItems[1] as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('select')?.[0]).toEqual(['rename'])
    wrapper.unmount()
  })

  it('renders separator and danger item', async () => {
    const wrapper = mount(RsContextMenu, {
      props: {
        items: [
          { key: 'edit', label: '编辑' },
          { key: 'sep', label: '', separator: true },
          { key: 'delete', label: '删除', danger: true },
        ],
      },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__separator')).not.toBeNull()
    const danger = document.body.querySelector('.rs-context-menu__item--danger')
    expect(danger?.textContent).toContain('删除')
    wrapper.unmount()
  })

  it('renders submenu trigger', async () => {
    const wrapper = mount(RsContextMenu, {
      props: {
        items: [
          {
            key: 'share',
            label: '分享',
            children: [{ key: 'link', label: '复制链接' }],
          },
        ],
      },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    expect(document.body.textContent).toContain('分享')
    wrapper.unmount()
  })

  it('renders deep nested submenu triggers', async () => {
    const wrapper = mount(RsContextMenu, {
      props: {
        items: [
          {
            key: 'move',
            label: '移动到',
            children: [
              {
                key: 'workspace',
                label: '工作区',
                children: [
                  {
                    key: 'archive',
                    label: '归档',
                    children: [{ key: 'y2026', label: '2026' }],
                  },
                ],
              },
            ],
          },
          ...Array.from({ length: 20 }, (_, i) => ({
            key: `item-${i}`,
            label: `项 ${i}`,
          })),
        ],
      },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    const content = document.body.querySelector('.rs-context-menu__content')
    expect(content).not.toBeNull()
    expect(content?.classList.contains('rs-native-scrollbar')).toBe(true)
    expect(document.body.textContent).toContain('移动到')
    expect(document.body.textContent).toContain('项 19')
    wrapper.unmount()
  })

  it('does not open empty menu bubble when items are empty', async () => {
    const wrapper = mount(RsContextMenu, {
      props: { items: [] },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__content')).toBeNull()
    wrapper.unmount()
  })

  it('moves with the keyboard, opens a submenu, and closes on Escape', async () => {
    const wrapper = mount(RsContextMenu, {
      props: {
        items: [
          { key: 'open', label: '打开' },
          {
            key: 'share',
            label: '分享',
            children: [{ key: 'link', label: '复制链接' }],
          },
        ],
      },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__item[data-highlighted]')?.textContent).toContain('分享')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await flushPromises()
    expect(document.body.textContent).toContain('复制链接')
    const panels = document.body.querySelectorAll('.rs-context-menu__content')
    expect(panels.length).toBe(2)
    for (const panel of panels) expect(panel.hasAttribute('data-placed')).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.body.textContent).toContain('分享')
    expect(document.body.textContent).not.toContain('复制链接')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__content')).toBeNull()
    wrapper.unmount()
  })

  it('keeps checkbox rows open and exposes aria-checked', async () => {
    const wrapper = mount(RsContextMenu, {
      props: {
        items: [{ key: 'hidden', label: '显示隐藏', type: 'checkbox', checked: true }],
      },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    const row = document.body.querySelector('.rs-context-menu__item')
    expect(row?.getAttribute('role')).toBe('menuitemcheckbox')
    expect(row?.getAttribute('aria-checked')).toBe('true')
    ;(row as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('select')?.[0]).toEqual(['hidden'])
    expect(document.body.querySelector('.rs-context-menu__content')).not.toBeNull()
    wrapper.unmount()
  })

  it('does not open when disabled and drops listeners after unmount', async () => {
    const disabled = mount(RsContextMenu, {
      props: { items, disabled: true },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await disabled.find('.trigger').trigger('contextmenu')
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__content')).toBeNull()
    disabled.unmount()

    const wrapper = mount(RsContextMenu, {
      props: { items },
      slots: { default: '<div class="trigger">Right click</div>' },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__content')).not.toBeNull()
    wrapper.unmount()
    await flushPromises()
    expect(document.body.querySelector('.rs-context-menu__content')).toBeNull()
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }).not.toThrow()
  })

  it('closes the previous menu when another one opens', async () => {
    const first = mount(RsContextMenu, {
      props: { items },
      slots: { default: '<div class="trigger">A</div>' },
      attachTo: document.body,
    })
    const second = mount(RsContextMenu, {
      props: { items: [{ key: 'copy', label: '复制' }] },
      slots: { default: '<div class="trigger">B</div>' },
      attachTo: document.body,
    })
    await first.find('.trigger').trigger('contextmenu')
    await flushPromises()
    await second.find('.trigger').trigger('contextmenu')
    await flushPromises()
    const labels = [...document.body.querySelectorAll('.rs-context-menu__label')].map((node) =>
      node.textContent?.trim(),
    )
    expect(labels).toEqual(['复制'])
    first.unmount()
    second.unmount()
  })

  it('syncs v-model:open', async () => {
    const Host = defineComponent({
      components: { RsContextMenu },
      setup() {
        const open = ref(false)
        return { open, items }
      },
      template:
        '<RsContextMenu v-model:open="open" :items="items"><div class="trigger">Right click</div></RsContextMenu>',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('.trigger').trigger('contextmenu')
    await flushPromises()
    expect(wrapper.vm.open).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.vm.open).toBe(false)
    wrapper.unmount()
  })

  it('does not import reka-ui', () => {
    const menu = readFileSync(path.resolve('src/components/context-menu/src/RsContextMenu.vue'), 'utf8')
    const rows = readFileSync(path.resolve('src/components/context-menu/src/RsContextMenuItems.vue'), 'utf8')
    expect(menu).not.toContain('reka-ui')
    expect(menu).not.toContain('scale(')
    expect(menu).not.toContain("_shared/src/reka")
    expect(rows).not.toContain('reka-ui')
    expect(rows).not.toContain('ContextMenuRoot')
  })
})
