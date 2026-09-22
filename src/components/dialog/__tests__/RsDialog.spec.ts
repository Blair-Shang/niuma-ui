import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsDialog from '../src/RsDialog.vue'
import { resetDialogGuardsForTests } from '../src/dialog-utils'

async function flushAnimationFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

describe('RsDialog', () => {
  afterEach(() => {
    resetDialogGuardsForTests()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingInlineEnd = ''
  })
  it('renders title, description, and body slot when open', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '编辑成员',
        description: '修改角色与权限。',
        deferBodyMount: false,
      },
      slots: { body: '<p class="slot-body">正文内容</p>' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.textContent).toContain('编辑成员')
    expect(content?.textContent).toContain('修改角色与权限。')
    expect(document.body.querySelector('.slot-body')?.textContent).toBe('正文内容')
    wrapper.unmount()
  })

  it('defers body slot mount until after paint in window layout', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '延后挂载' },
      slots: { body: '<p class="slot-body">正文内容</p>' },
      attachTo: document.body,
    })
    expect(document.body.querySelector('.slot-body')).toBeNull()

    await flushAnimationFrames()
    await flushPromises()
    expect(document.body.querySelector('.slot-body')?.textContent).toBe('正文内容')
    wrapper.unmount()
  })

  it('destroys deferred body content when closed', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDialog v-model:open="open" title="关闭销毁"><template #body><p class="slot-body">正文</p></template></RsDialog>',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushAnimationFrames()
    await flushPromises()
    expect(document.body.querySelector('.slot-body')).not.toBeNull()

    await wrapper.findComponent(RsDialog).setValue(false, 'open')
    await flushPromises()
    expect(document.body.querySelector('.slot-body')).toBeNull()
    wrapper.unmount()
  })

  it('opens window layout at a viewport percentage height', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '百分比高度', width: '80%', height: '70%' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const height = Number.parseFloat(content.style.height)
    const available = window.innerHeight - 32
    const expectedHeight = Math.min(available, Math.max(240, Math.round(available * 0.7)))
    expect(height).toBe(expectedHeight)
    wrapper.unmount()
  })

  it('centers window layout when width is a viewport percentage', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '百分比宽度', width: '90%' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const width = Number.parseFloat(content.style.width)
    const left = Number.parseFloat(content.style.left)
    const available = window.innerWidth - 32
    const expectedWidth = Math.min(available, Math.max(320, Math.round(available * 0.9)))
    expect(width).toBe(expectedWidth)
    expect(left).toBeCloseTo(16 + (available - expectedWidth) / 2, 1)
    expect(content.style.maxWidth).toBe('')
    wrapper.unmount()
  })

  it('applies window layout with resize handles by default', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '测试', width: 'sm' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.classList.contains('rs-dialog__content--window')).toBe(true)
    expect(content?.classList.contains('rs-dialog__content--sm')).toBe(true)
    expect(document.body.querySelectorAll('.rs-dialog__resize-handle').length).toBe(8)
    wrapper.unmount()
  })

  it('applies confirm layout when explicitly set', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '测试', width: 'sm', layout: 'confirm', resizable: false, fullscreenable: false },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.classList.contains('rs-dialog__content--confirm')).toBe(true)
    expect(content?.classList.contains('rs-dialog__content--form')).toBe(true)
    expect(content?.classList.contains('rs-dialog__content--sm')).toBe(true)
    wrapper.unmount()
  })

  it('applies form layout without confirm deprecation class-only alias', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '表单', width: 'sm', layout: 'form', resizable: false, fullscreenable: false },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.classList.contains('rs-dialog__content--form')).toBe(true)
    expect(content?.classList.contains('rs-dialog__content--confirm')).toBe(false)
    wrapper.unmount()
  })

  it('renders footer slot', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '保存' },
      slots: { footer: '<button type="button" class="footer-save">保存</button>' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__footer .footer-save')?.textContent).toBe('保存')
    wrapper.unmount()
  })

  it('closes when header close button is clicked', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDialog v-model:open="open" title="关闭测试" :fullscreenable="false" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-dialog__actions button') as HTMLElement
    await closeBtn.click()
    await flushPromises()
    expect(wrapper.findComponent(RsDialog).props('open')).toBe(false)
    wrapper.unmount()
  })

  it('hides overlay by default', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '无遮罩' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__overlay')).toBeNull()
    wrapper.unmount()
  })

  it('shows overlay when showOverlay is true', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '有遮罩', showOverlay: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__overlay')).not.toBeNull()
    wrapper.unmount()
  })

  it('hides close button when showClose is false', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '无关闭', showClose: false, fullscreenable: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelectorAll('.rs-dialog__actions button').length).toBe(0)
    wrapper.unmount()
  })

  it('applies window layout class and inline size style', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '窗口',
        layout: 'window',
        draggable: true,
        resizable: true,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    expect(content.classList.contains('rs-dialog__content--window')).toBe(true)
    expect(content.style.width).not.toBe('')
    expect(content.style.height).not.toBe('')
    wrapper.unmount()
  })

  it('renders resize handles in resizable window mode', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '可缩放',
        layout: 'window',
        resizable: true,
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelectorAll('.rs-dialog__resize-handle').length).toBe(8)
    wrapper.unmount()
  })

  it('shows fullscreen toggle only in window layout with fullscreenable', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '全屏',
        layout: 'window',
        fullscreenable: true,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const actionButtons = document.body.querySelectorAll('.rs-dialog__actions button')
    expect(actionButtons.length).toBe(2)
    wrapper.unmount()
  })

  it('toggles fullscreen class and restores window bounds', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '全屏',
        layout: 'window',
        fullscreenable: true,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const fullscreenBtn = document.body.querySelectorAll('.rs-dialog__actions button')[0] as HTMLElement
    const beforeWidth = content.style.width
    const beforeHeight = content.style.height

    await fullscreenBtn.click()
    await flushPromises()
    expect(content.classList.contains('rs-dialog__content--fullscreen')).toBe(true)
    expect(content.style.width).toContain('calc')
    expect(content.classList.contains('rs-dialog__content--bounds-transition')).toBe(false)

    await fullscreenBtn.click()
    await flushPromises()
    expect(content.classList.contains('rs-dialog__content--fullscreen')).toBe(false)
    expect(content.style.width).toBe(beforeWidth)
    expect(content.style.height).toBe(beforeHeight)
    wrapper.unmount()
  })

  it('enables bounds transition when boundsTransition is true', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '全屏动画',
        layout: 'window',
        fullscreenable: true,
        boundsTransition: true,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const fullscreenBtn = document.body.querySelectorAll('.rs-dialog__actions button')[0] as HTMLElement

    await fullscreenBtn.click()
    await flushPromises()
    expect(content.classList.contains('rs-dialog__content--bounds-transition')).toBe(true)
    wrapper.unmount()
  })

  it('moves window when draggable header is dragged', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '拖拽',
        layout: 'window',
        draggable: true,
        resizable: true,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const header = document.body.querySelector('.rs-dialog__header') as HTMLElement
    expect(content.classList.contains('rs-dialog__content--draggable')).toBe(true)
    const startLeft = content.style.left
    const startTop = content.style.top

    header.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 120, clientY: 80, bubbles: true, cancelable: true }),
    )
    expect(document.body.style.cursor).toBe('move')
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 180, clientY: 120, bubbles: true, cancelable: true }),
    )
    // 拖拽过程中应即时位移，不能等到 pointerup
    expect(content.style.left).not.toBe(startLeft)
    expect(content.style.top).not.toBe(startTop)

    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(content.style.left).not.toBe(startLeft)
    expect(content.style.top).not.toBe(startTop)
    wrapper.unmount()
  })

  it('does not move window when draggable is false', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '不可拖',
        layout: 'window',
        draggable: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const header = document.body.querySelector('.rs-dialog__header') as HTMLElement
    const startLeft = content.style.left
    const startTop = content.style.top

    header.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 120, clientY: 80, bubbles: true, cancelable: true }),
    )
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 180, clientY: 120, bubbles: true, cancelable: true }),
    )
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(content.style.left).toBe(startLeft)
    expect(content.style.top).toBe(startTop)
    wrapper.unmount()
  })

  it('applies tone modifier class', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '警告', tone: 'warning' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.classList.contains('rs-dialog__content--tone-warning')).toBe(true)
    wrapper.unmount()
  })

  it('uses en-US close tooltip inside RsConfigProvider', async () => {
    const Host = defineComponent({
      components: { RsDialog, RsConfigProvider },
      setup() {
        return () =>
          h(RsConfigProvider, { locale: 'en-US' }, {
            default: () => h(RsDialog, { open: true, title: 'Dialog', fullscreenable: false }),
          })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-dialog__actions button') as HTMLElement
    expect(closeBtn?.getAttribute('aria-label')).toContain('Close')
    wrapper.unmount()
  })

  it('mounts portal into custom target via teleportTo', async () => {
    const target = document.createElement('div')
    target.id = 'rs-dialog-target'
    document.body.appendChild(target)

    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '挂载目标',
        teleportTo: '#rs-dialog-target',
      },
      attachTo: document.body,
    })

    await flushPromises()
    expect(target.querySelector('.rs-dialog__content')).not.toBeNull()
    wrapper.unmount()
    target.remove()
  })

  it('defers teleport until a sibling target rendered by Vue is mounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template:
        '<div id="rs-dialog-sibling-target"></div><RsDialog :open="open" teleport-to="#rs-dialog-sibling-target" title="Sibling" />',
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()

    const dock = document.getElementById('rs-dialog-sibling-target')
    expect(dock?.querySelector('.rs-dialog__content')).not.toBeNull()
    expect(warn.mock.calls.some((call) => String(call[0]).includes('Teleport'))).toBe(false)
    warn.mockRestore()
    wrapper.unmount()
  })

  it('resolves a teleport target created in the host onMounted when the dialog opens', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(false)
        const targetId = 'rs-dialog-late-target'
        onMounted(() => {
          const target = document.createElement('div')
          target.id = targetId
          document.body.appendChild(target)
        })
        onBeforeUnmount(() => {
          document.getElementById(targetId)?.remove()
        })
        return { open, targetId }
      },
      template:
        '<RsDialog v-model:open="open" :teleport-to="`#${targetId}`" title="Late" :defer-body-mount="false" />',
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__content')).toBeNull()

    await wrapper.findComponent(RsDialog).setValue(true, 'open')
    await flushPromises()
    const dock = document.getElementById('rs-dialog-late-target')
    expect(dock?.querySelector('.rs-dialog__content')).not.toBeNull()
    wrapper.unmount()
  })

  it('re-teleports to body while fullscreen, then restores custom target', async () => {
    const target = document.createElement('div')
    target.id = 'rs-dialog-fullscreen-target'
    document.body.appendChild(target)

    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '全屏挂载',
        layout: 'window',
        fullscreenable: true,
        teleportTo: '#rs-dialog-fullscreen-target',
      },
      attachTo: document.body,
    })

    await flushPromises()
    expect(target.querySelector('.rs-dialog__content')).not.toBeNull()

    const enterFullscreenBtn = target.querySelectorAll('.rs-dialog__actions button')[0] as HTMLElement
    await enterFullscreenBtn.click()
    await flushPromises()

    expect(target.querySelector('.rs-dialog__content')).toBeNull()
    const bodyContent = document.body.querySelector('.rs-dialog__content') as HTMLElement
    expect(bodyContent).not.toBeNull()
    expect(bodyContent.classList.contains('rs-dialog__content--fullscreen')).toBe(true)
    expect(target.contains(bodyContent)).toBe(false)

    const exitFullscreenBtn = document.body.querySelectorAll(
      '.rs-dialog__actions button',
    )[0] as HTMLElement
    await exitFullscreenBtn.click()
    await flushPromises()
    expect(target.querySelector('.rs-dialog__content')).not.toBeNull()
    expect(
      target.querySelector('.rs-dialog__content')?.classList.contains('rs-dialog__content--fullscreen'),
    ).toBe(false)

    wrapper.unmount()
    target.remove()
  })

  it('mounts a draggable window on body so drag can leave a clipping host', async () => {
    const target = document.createElement('div')
    target.id = 'rs-dialog-drag-target'
    target.style.overflow = 'hidden'
    document.body.appendChild(target)

    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '可拖挂载',
        layout: 'window',
        draggable: true,
        teleportTo: '#rs-dialog-drag-target',
      },
      attachTo: document.body,
    })

    await flushPromises()
    expect(target.querySelector('.rs-dialog__content')).toBeNull()
    const bodyContent = document.body.querySelector('.rs-dialog__content') as HTMLElement
    expect(bodyContent).not.toBeNull()
    expect(bodyContent.classList.contains('rs-dialog__content--draggable')).toBe(true)
    expect(target.contains(bodyContent)).toBe(false)

    wrapper.unmount()
    target.remove()
  })

  it('releases scroll lock and inert when a KeepAlive page hides an open dialog', async () => {
    const probe = document.createElement('button')
    probe.type = 'button'
    document.body.appendChild(probe)
    document.body.style.overflow = 'scroll'

    const show = ref(true)
    const Page = defineComponent({
      name: 'RsDialogKeepAlivePage',
      components: { RsDialog },
      template:
        '<RsDialog open title="缓存页" layout="window" :draggable="true" :defer-body-mount="false" />',
    })
    const Host = defineComponent({
      components: { Page },
      setup() {
        return { show }
      },
      template: '<KeepAlive><Page v-if="show" /></KeepAlive>',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__content')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
    expect(probe.hasAttribute('inert')).toBe(true)

    show.value = false
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__content')).toBeNull()
    expect(document.body.style.overflow).toBe('scroll')
    expect(probe.hasAttribute('inert')).toBe(false)

    show.value = true
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__content')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
    expect(probe.hasAttribute('inert')).toBe(true)

    wrapper.unmount()
    expect(document.body.style.overflow).toBe('scroll')
    expect(probe.hasAttribute('inert')).toBe(false)
    probe.remove()
  })

  it('does not mark a non-modal dialog as a modal or lock scroll', async () => {
    document.body.style.overflow = 'scroll'
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '非模态',
        modal: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.tagName).toBe('DIALOG')
    expect(content?.hasAttribute('open')).toBe(true)
    expect(content?.getAttribute('aria-modal')).toBe('false')
    expect(document.body.querySelector('.rs-dialog__backdrop')).toBeNull()
    expect(document.body.style.overflow).toBe('scroll')
    wrapper.unmount()
  })

  it('keeps a non-modal dialog open when the pointer goes outside and closeOnOverlayClick is false', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '非模态',
        modal: false,
        closeOnOverlayClick: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const outside = document.createElement('button')
    outside.type = 'button'
    document.body.appendChild(outside)
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    outside.dispatchEvent(event)
    await flushPromises()
    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.props('open')).toBe(true)
    wrapper.unmount()
  })

  it('beforeClose returning false keeps dialog open', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        const beforeClose = () => false
        return { open, beforeClose }
      },
      template:
        '<RsDialog v-model:open="open" title="拦截关闭" :fullscreenable="false" :before-close="beforeClose" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-dialog__actions button') as HTMLElement
    await closeBtn.click()
    await flushPromises()
    expect(wrapper.findComponent(RsDialog).props('open')).toBe(true)
    wrapper.unmount()
  })

  it('renders builtin footer when showFooter is true and no footer slot', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '内置页脚',
        showFooter: true,
        layout: 'confirm',
        resizable: false,
        fullscreenable: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const footer = document.body.querySelector('.rs-dialog__footer')
    expect(footer).not.toBeNull()
    expect(footer?.querySelectorAll('button').length).toBe(2)
    wrapper.unmount()
  })

  it('does not render builtin footer by default', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '无页脚',
        layout: 'confirm',
        resizable: false,
        fullscreenable: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__footer')).toBeNull()
    wrapper.unmount()
  })

  it('applies custom numeric width on confirm layout', async () => {
    const wrapper = mount(RsDialog, {
      props: {
        open: true,
        title: '自定义宽度',
        layout: 'confirm',
        width: 520,
        resizable: false,
        fullscreenable: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    expect(content.classList.contains('rs-dialog__content--custom-width')).toBe(true)
    expect(content.style.maxWidth).toBe('520px')
    wrapper.unmount()
  })

  it('title slot overrides title prop text', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '属性标题', fullscreenable: false },
      slots: { title: '<span class="slot-title">插槽标题</span>' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.slot-title')?.textContent).toBe('插槽标题')
    wrapper.unmount()
  })

  it('emits afterClose when closed via close button', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        const reason = ref('')
        return { open, reason }
      },
      template: `
        <RsDialog
          v-model:open="open"
          title="关闭事件"
          :fullscreenable="false"
          @after-close="reason = $event"
        />
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.body.querySelector('.rs-dialog__actions button') as HTMLElement
    await closeBtn.click()
    await flushPromises()
    expect(wrapper.vm.reason).toBe('close')
    expect(wrapper.findComponent(RsDialog).props('open')).toBe(false)
    wrapper.unmount()
  })

  it('closes on Escape (APG Dialog)', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDialog v-model:open="open" title="Escape" :fullscreenable="false" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('.rs-dialog__content')).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.findComponent(RsDialog).props('open')).toBe(false)
    wrapper.unmount()
  })

  it('does not import or render reka-ui', async () => {
    const source = readFileSync(path.resolve('src/components/dialog/src/RsDialog.vue'), 'utf8')
    expect(source).not.toContain('reka-ui')
    expect(source).not.toContain("from '../../_shared/src/reka'")
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '原生', fullscreenable: false, deferBodyMount: false },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content')
    expect(content?.tagName).toBe('DIALOG')
    expect(content?.hasAttribute('open')).toBe(true)
    expect(content?.getAttribute('aria-modal')).toBe('true')
    expect(document.body.innerHTML.toLowerCase()).not.toContain('reka')
    wrapper.unmount()
  })

  it('renders the default slot when body is omitted', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '默认插槽', fullscreenable: false, deferBodyMount: false },
      slots: { default: '<p class="slot-body">默认正文</p>' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.slot-body')?.textContent).toBe('默认正文')
    wrapper.unmount()
  })

  it('locks body scroll while modal and restores it on unmount', async () => {
    document.body.style.overflow = 'scroll'
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '锁滚动', fullscreenable: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.querySelector('.rs-dialog__backdrop')).not.toBeNull()
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('does not lock scroll when lockScroll is false', async () => {
    document.body.style.overflow = 'auto'
    const wrapper = mount(RsDialog, {
      props: { open: true, title: '不锁', fullscreenable: false, lockScroll: false },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.style.overflow).toBe('auto')
    wrapper.unmount()
  })

  it('keeps Escape from closing when closeOnEsc is false', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: '<RsDialog v-model:open="open" title="Stay" :fullscreenable="false" :close-on-esc="false" />',
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(wrapper.findComponent(RsDialog).props('open')).toBe(true)
    wrapper.unmount()
  })

  it('closes only the top dialog when two are open', async () => {
    const Host = defineComponent({
      components: { RsDialog },
      setup() {
        const first = ref(true)
        const second = ref(true)
        return { first, second }
      },
      template: `
        <RsDialog v-model:open="first" title="First" :fullscreenable="false" />
        <RsDialog v-model:open="second" title="Second" :fullscreenable="false" />
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelectorAll('.rs-dialog__content').length).toBe(2)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(wrapper.vm.second).toBe(false)
    expect(wrapper.vm.first).toBe(true)
    expect(document.body.querySelector('.rs-dialog__content')?.textContent).toContain('First')
    wrapper.unmount()
  })

  it('wraps Tab inside a modal dialog', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: 'Tab', fullscreenable: false, deferBodyMount: false },
      slots: {
        body: '<button type="button" class="one">One</button><button type="button" class="two">Two</button>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-dialog__content') as HTMLElement
    const buttons = [...content.querySelectorAll('button')]
    const last = buttons[buttons.length - 1] as HTMLButtonElement
    const first = buttons[0] as HTMLButtonElement
    last.focus()
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    document.dispatchEvent(forward)
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    const backward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true, shiftKey: true })
    document.dispatchEvent(backward)
    expect(document.activeElement).toBe(last)
    wrapper.unmount()
  })

  it('restores focus to the trigger after close', async () => {
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()
    const wrapper = mount(RsDialog, {
      props: { open: false, title: 'Focus', fullscreenable: false },
      attachTo: document.body,
    })
    await flushPromises()
    wrapper.vm.openDialog()
    await flushPromises()
    expect(document.activeElement).toBe(document.body.querySelector('.rs-dialog__content'))
    await wrapper.vm.close()
    await flushPromises()
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  it('focuses an autofocus field inside the body', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: 'Field', layout: 'form', fullscreenable: false, deferBodyMount: false },
      slots: { default: '<input class="name" autofocus />' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.activeElement).toBe(document.body.querySelector('.name'))
    wrapper.unmount()
  })

  it('exposes focus()', async () => {
    const wrapper = mount(RsDialog, {
      props: { open: true, title: 'Focus method', fullscreenable: false },
      attachTo: document.body,
    })
    await flushPromises()
    document.body.focus()
    wrapper.vm.focus()
    expect(document.activeElement).toBe(document.body.querySelector('.rs-dialog__content'))
    wrapper.unmount()
  })
})
