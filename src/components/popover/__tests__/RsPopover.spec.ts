import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsPopover from '../src/RsPopover.vue'

describe('RsPopover', () => {
  it('opens content on trigger click', async () => {
    const wrapper = mount(RsPopover, {
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="panel">Popover body</p>',
      },
      attachTo: document.body,
    })
    expect(document.body.querySelector('.rs-popover__content')).toBeNull()
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content')).not.toBeNull()
    expect(document.body.textContent).toContain('Popover body')
    wrapper.unmount()
  })

  it('supports v-model:open', async () => {
    const wrapper = mount(RsPopover, {
      props: { open: true },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="panel">Controlled</p>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content')).not.toBeNull()
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content')).toBeNull()
    wrapper.unmount()
  })

  it('applies width modifier class', async () => {
    const wrapper = mount(RsPopover, {
      props: { open: true, width: 'lg' },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p>Wide panel</p>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content--lg')).not.toBeNull()
    wrapper.unmount()
  })

  it('applies popupClassName on content', async () => {
    const wrapper = mount(RsPopover, {
      props: { open: true, popupClassName: 'custom-pop' },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p>Custom chrome</p>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content.custom-pop')).not.toBeNull()
    wrapper.unmount()
  })

  it('lazy-mounts content when closed by default', async () => {
    const wrapper = mount(RsPopover, {
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Lazy content</p>',
      },
      attachTo: document.body,
    })
    expect(document.body.querySelector('.marker')).toBeNull()
    wrapper.unmount()
  })

  it('unmounts content after close with default lazyMount', async () => {
    const wrapper = mount(RsPopover, {
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Toggle content</p>',
      },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.marker')).not.toBeNull()
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.marker')).toBeNull()
    wrapper.unmount()
  })

  it('keeps content mounted when lazyMount is false and closed', async () => {
    const wrapper = mount(RsPopover, {
      props: { lazyMount: false },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Eager content</p>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.marker')).not.toBeNull()
    wrapper.unmount()
  })

  it('keeps content mounted when forceMount is true and closed', async () => {
    const wrapper = mount(RsPopover, {
      props: { forceMount: true },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Forced content</p>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.marker')).not.toBeNull()
    wrapper.unmount()
  })

  it('retains eager content in DOM after close when lazyMount is false', async () => {
    const wrapper = mount(RsPopover, {
      props: { lazyMount: false, open: true },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Persistent content</p>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.marker')).not.toBeNull()
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.body.querySelector('.marker')).not.toBeNull()
    wrapper.unmount()
  })

  it('registers the public component name and does not render reka-ui', () => {
    const wrapper = mount(RsPopover, {
      slots: { default: '<button type="button" class="trigger">Open</button>' },
      attachTo: document.body,
    })
    expect(RsPopover.name).toBe('RsPopover')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.get('button').attributes('aria-haspopup')).toBe('dialog')
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('closes on Escape and on an outside pointerdown', async () => {
    const wrapper = mount(RsPopover, {
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="panel">Body</p>',
      },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content')).toBeNull()

    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-popover__content')).toBeNull()
    wrapper.unmount()
  })

  it('emits openChange and exposes open, close, and focus', async () => {
    const onOpenChange = vi.fn()
    const wrapper = mount(RsPopover, {
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p>Panel</p>',
      },
      attrs: { onOpenChange },
      attachTo: document.body,
    })
    wrapper.vm.open()
    await flushPromises()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(document.body.querySelector('.rs-popover__content')).not.toBeNull()
    wrapper.vm.close()
    await flushPromises()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    wrapper.vm.focus()
    expect(document.activeElement).toBe(wrapper.get('button').element)
    wrapper.unmount()
  })

  it('does not open while disabled', async () => {
    const wrapper = mount(RsPopover, {
      props: { disabled: true },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="panel">Nope</p>',
      },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.panel')).toBeNull()
    wrapper.unmount()
  })

  it('renders a titled dialog and a localized close button', async () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () =>
          h(RsPopover, { title: 'Session', showClose: true, open: true }, {
            default: () => h('button', { type: 'button', class: 'trigger' }, 'Open'),
            content: () => h('p', { class: 'panel' }, 'Details'),
          }),
      },
      attachTo: document.body,
    })
    await flushPromises()
    const dialog = document.body.querySelector('.rs-popover__content')
    expect(dialog?.tagName).toBe('DIALOG')
    expect(dialog?.hasAttribute('open')).toBe(true)
    expect(dialog?.textContent).toContain('Session')
    expect(document.body.querySelector('.rs-popover__close')?.getAttribute('aria-label')).toBe('Close')
    wrapper.unmount()
  })

  it('removes overlay listeners after close and unmount', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = mount(RsPopover, {
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p>Panel</p>',
      },
      attachTo: document.body,
    })
    expect(add.mock.calls.filter((call) => call[0] === 'pointerdown')).toHaveLength(0)
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(add.mock.calls.filter((call) => call[0] === 'pointerdown')).toHaveLength(1)
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(remove.mock.calls.filter((call) => call[0] === 'pointerdown')).toHaveLength(1)
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    wrapper.unmount()
    expect(remove.mock.calls.filter((call) => call[0] === 'pointerdown').length).toBeGreaterThanOrEqual(2)
    add.mockRestore()
    remove.mockRestore()
  })

  it('does not open from a hover timer after unmount', async () => {
    const wrapper = mount(RsPopover, {
      props: { trigger: 'hover', mouseEnterDelay: 30 },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Hover</p>',
      },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('mouseenter')
    wrapper.unmount()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.body.querySelector('.marker')).toBeNull()
  })

  it('opens on hover and keeps the panel while the pointer is inside', async () => {
    const wrapper = mount(RsPopover, {
      props: { trigger: 'hover', mouseEnterDelay: 0, mouseLeaveDelay: 30 },
      slots: {
        default: '<button type="button" class="trigger">Open</button>',
        content: '<p class="marker">Hover</p>',
      },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('mouseenter')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
    expect(document.body.querySelector('.marker')).not.toBeNull()
    wrapper.unmount()
  })

  it('merges click onto a component trigger', async () => {
    const Trigger = defineComponent({
      name: 'PopoverTriggerProbe',
      emits: ['click'],
      setup(_, { emit }) {
        return () =>
          h('button', { type: 'button', class: 'trigger', onClick: () => emit('click') }, 'Open')
      },
    })
    const wrapper = mount(RsPopover, {
      slots: {
        default: () => h(Trigger),
        content: '<p class="panel">From component</p>',
      },
      attachTo: document.body,
    })
    await wrapper.find('.trigger').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('.panel')).not.toBeNull()
    wrapper.unmount()
  })
})
