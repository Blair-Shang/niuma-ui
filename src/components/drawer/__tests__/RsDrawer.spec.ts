import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsDrawer from '../src/RsDrawer.vue'
import { resetRsDrawerRuntime } from '../src/drawer-utils'

describe('RsDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    resetRsDrawerRuntime()
  })

  it('renders title, description, and default slot when open', async () => {
    const wrapper = mount(RsDrawer, {
      props: {
        open: true,
        title: '筛选条件',
        description: '按状态与时间过滤。',
      },
      slots: { default: '<p class="slot-body">正文内容</p>' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content')
    expect(content?.getAttribute('role')).toBe('dialog')
    expect(content?.getAttribute('aria-modal')).toBe('true')
    expect(content?.getAttribute('aria-labelledby')).toBeTruthy()
    expect(content?.textContent).toContain('筛选条件')
    expect(content?.textContent).toContain('按状态与时间过滤。')
    expect(document.body.querySelector('.slot-body')?.textContent).toBe('正文内容')
    wrapper.unmount()
  })

  it('applies default right side and md size classes', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '测试' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content')
    expect(content?.classList.contains('rs-drawer__content--right')).toBe(true)
    expect(content?.classList.contains('rs-drawer__content--md')).toBe(true)
    wrapper.unmount()
  })

  it('applies custom side and size classes', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '左侧', side: 'left', size: 'lg' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content')
    expect(content?.classList.contains('rs-drawer__content--left')).toBe(true)
    expect(content?.classList.contains('rs-drawer__content--lg')).toBe(true)
    wrapper.unmount()
  })

  it('applies custom width via CSS variable', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '自定义宽', width: 420 },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content') as HTMLElement
    expect(content.style.getPropertyValue('--rs-drawer-panel-size')).toBe('420px')
    expect(content.classList.contains('rs-drawer__content--custom-size')).toBe(true)
    wrapper.unmount()
  })

  it('does not mark a size preset as a custom size', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '预设', size: 'lg' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content')
    expect(content?.classList.contains('rs-drawer__content--custom-size')).toBe(false)
    wrapper.unmount()
  })

  it('renders footer slot', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '保存' },
      slots: { footer: '<button type="button" class="footer-save">保存</button>' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-drawer__footer .footer-save')?.textContent).toBe('保存')
    wrapper.unmount()
  })

  it('provides visually hidden DialogTitle when using header slot', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true },
      slots: {
        header: '<div class="custom-header">自定义标题</div>',
        default: '正文',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const hiddenTitle = document.body.querySelector('.rs-drawer__title--sr-only')
    expect(hiddenTitle).not.toBeNull()
    expect(document.body.querySelector('.custom-header')?.textContent).toBe('自定义标题')
    wrapper.unmount()
  })

  it('closes when header close button is clicked', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDrawer v-model:open="open" title="关闭测试" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-drawer__header button') as HTMLElement
    await closeBtn.click()
    await flushPromises()
    expect(wrapper.findComponent(RsDrawer).props('open')).toBe(false)
    wrapper.unmount()
  })

  it('beforeClose returning false keeps drawer open', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        const beforeClose = () => false
        return { open, beforeClose }
      },
      template: '<RsDrawer v-model:open="open" title="拦截" :before-close="beforeClose" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-drawer__header button') as HTMLElement
    await closeBtn.click()
    await flushPromises()
    expect(wrapper.findComponent(RsDrawer).props('open')).toBe(true)
    wrapper.unmount()
  })

  it('emits afterClose when closed via close button', async () => {
    const onAfterClose = vi.fn()
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        return { open, onAfterClose }
      },
      template: '<RsDrawer v-model:open="open" title="关闭" @after-close="onAfterClose" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-drawer__header button') as HTMLElement
    await closeBtn.click()
    await flushPromises()
    expect(onAfterClose).toHaveBeenCalledWith('close')
    wrapper.unmount()
  })

  it('hides overlay when showOverlay is false', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '无遮罩', showOverlay: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-drawer__overlay')).toBeNull()
    wrapper.unmount()
  })

  it('does not close on outside when closeOnOverlayClick is false', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        return { open }
      },
      template:
        '<RsDrawer v-model:open="open" title="非点外关" :show-overlay="false" :close-on-overlay-click="false" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.findComponent(RsDrawer).props('open')).toBe(true)
    wrapper.unmount()
  })

  it('teleports into a container and uses contained positioning', async () => {
    const host = document.createElement('div')
    host.id = 'drawer-host'
    host.style.position = 'relative'
    document.body.appendChild(host)

    const wrapper = mount(RsDrawer, {
      props: {
        open: true,
        title: '容器内抽屉',
        teleportTo: '#drawer-host',
      },
      attachTo: document.body,
    })
    await flushPromises()

    const content = host.querySelector('.rs-drawer__content') as HTMLElement | null
    expect(content).not.toBeNull()
    expect(content?.classList.contains('rs-drawer__content--contained')).toBe(true)
    expect(document.body.querySelector(':scope > .rs-drawer__content')).toBeNull()

    wrapper.unmount()
    host.remove()
  })

  it('hides close button when showClose is false', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '无关闭', showClose: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelectorAll('.rs-drawer__header button').length).toBe(0)
    wrapper.unmount()
  })

  it('omits header when no title, description, close, or header slot', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, showClose: false },
      slots: { default: '仅正文' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-drawer__header')).toBeNull()
    wrapper.unmount()
  })

  it('uses en-US close tooltip inside RsConfigProvider', async () => {
    const Host = defineComponent({
      components: { RsDrawer, RsConfigProvider },
      setup() {
        return () =>
          h(RsConfigProvider, { locale: 'en-US' }, {
            default: () => h(RsDrawer, { open: true, title: 'Drawer' }),
          })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-drawer__header button') as HTMLElement
    expect(closeBtn).not.toBeNull()
    vi.useFakeTimers()
    closeBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(document.body.querySelector('.rs-btn__tooltip')?.textContent).toContain('Close')
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('renders an inner-edge resize handle by default', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '帮助' },
      attachTo: document.body,
    })
    await flushPromises()
    const handle = document.body.querySelector('.rs-drawer__resize') as HTMLElement | null
    expect(handle).toBeTruthy()
    expect(handle?.getAttribute('role')).toBe('separator')
    expect(handle?.getAttribute('aria-orientation')).toBe('vertical')
    wrapper.unmount()
  })

  it('hides the resize handle when size is full or resizable is false', async () => {
    const full = mount(RsDrawer, {
      props: { open: true, title: '全屏', size: 'full' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-drawer__resize')).toBeNull()
    full.unmount()

    const locked = mount(RsDrawer, {
      props: { open: true, title: '固定', resizable: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-drawer__resize')).toBeNull()
    locked.unmount()
  })

  it('widens a right drawer with ArrowLeft on the resize handle', async () => {
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '缩放', width: 360 },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content') as HTMLElement
    Object.defineProperty(content, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 360, height: 800, top: 0, left: 800, right: 1160, bottom: 800, x: 800, y: 0, toJSON: () => ({}) }),
    })
    const handle = document.body.querySelector('.rs-drawer__resize') as HTMLElement
    await handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await flushPromises()
    expect(content.style.width).toBe('376px')
    wrapper.unmount()
  })

  it('locks body scroll while a modal drawer is open and restores it on unmount', async () => {
    document.body.style.overflow = 'auto'
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '锁滚动' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('does not lock body scroll for a non-modal drawer', async () => {
    document.body.style.overflow = 'auto'
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '非模态', showOverlay: false, modal: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.style.overflow).toBe('auto')
    wrapper.unmount()
  })

  it('closes the top drawer on Escape and leaves the one below open', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const lower = ref(true)
        const upper = ref(true)
        return { lower, upper }
      },
      template: `
        <RsDrawer v-model:open="lower" title="下层" />
        <RsDrawer v-model:open="upper" title="上层" />
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.findAllComponents(RsDrawer)[1]?.props('open')).toBe(false)
    expect(wrapper.findAllComponents(RsDrawer)[0]?.props('open')).toBe(true)
    wrapper.unmount()
  })

  it('keeps the drawer open when Escape is handled by a child', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        function onInputKeydown(event: KeyboardEvent) {
          if (event.key === 'Escape') event.preventDefault()
        }
        return { open, onInputKeydown }
      },
      template:
        '<RsDrawer v-model:open="open" title="输入"><input class="inner" @keydown="onInputKeydown" /></RsDrawer>',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const input = document.body.querySelector('.inner') as HTMLElement
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(wrapper.findComponent(RsDrawer).props('open')).toBe(true)
    wrapper.unmount()
  })

  it('closes on an outside pointerdown after the open gesture', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDrawer v-model:open="open" title="点外关" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.findComponent(RsDrawer).props('open')).toBe(false)
    wrapper.unmount()
  })

  it('moves focus into the dialog and restores it on close', async () => {
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.textContent = '打开'
    document.body.appendChild(trigger)
    trigger.focus()

    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(false)
        return { open }
      },
      template: '<RsDrawer v-model:open="open" title="焦点" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const vm = wrapper.vm as unknown as { open: boolean }
    vm.open = true
    await flushPromises()
    await nextTick()
    const content = document.body.querySelector('.rs-drawer__content')
    expect(document.activeElement).toBe(content)
    vm.open = false
    await flushPromises()
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
    trigger.remove()
  })

  it('drops the panel after the close motion when destroyOnClose is true', async () => {
    const Host = defineComponent({
      components: { RsDrawer },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDrawer v-model:open="open" title="卸载" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    vi.useFakeTimers()
    const closeBtn = document.body.querySelector('.rs-drawer__header button') as HTMLElement
    closeBtn.click()
    await flushPromises()
    expect(document.body.querySelector('.rs-drawer__content')?.getAttribute('data-state')).toBe('closed')
    await vi.advanceTimersByTimeAsync(220)
    expect(document.body.querySelector('.rs-drawer__content')).toBeNull()
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('copies data-rs-theme onto the teleported panel', async () => {
    const host = document.createElement('div')
    host.setAttribute('data-rs-theme', 'dark')
    host.setAttribute('dir', 'rtl')
    host.lang = 'ar'
    document.body.appendChild(host)
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '主题' },
      attachTo: host,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-drawer__content')
    expect(content?.getAttribute('data-rs-theme')).toBe('dark')
    expect(content?.getAttribute('dir')).toBe('rtl')
    expect(content?.getAttribute('lang')).toBe('ar')
    wrapper.unmount()
    host.remove()
  })

  it('removes window listeners on unmount', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(RsDrawer, {
      props: { open: true, title: '监听' },
      attachTo: document.body,
    })
    await flushPromises()
    wrapper.unmount()
    const types = remove.mock.calls.map((call) => call[0])
    expect(types).toContain('pointerdown')
    expect(types).toContain('keydown')
    remove.mockRestore()
  })
})
