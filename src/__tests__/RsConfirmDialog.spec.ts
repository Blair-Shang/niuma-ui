import { defineComponent, h, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../components/RsConfigProvider.vue'
import RsConfirmDialog from '../components/RsConfirmDialog.vue'

describe('RsConfirmDialog', () => {
  it('renders custom title and description when open', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: {
        open: true,
        title: '删除项目？',
        description: '此操作不可撤销。',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content')
    expect(content?.textContent).toContain('删除项目？')
    expect(content?.textContent).toContain('此操作不可撤销。')
    wrapper.unmount()
  })

  it('falls back to zh-CN i18n defaults', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content')
    expect(content?.textContent).toContain('确认操作？')
    expect(content?.textContent).toContain('此操作可能无法撤销')
    wrapper.unmount()
  })

  it('uses en-US defaults inside RsConfigProvider', async () => {
    const Host = defineComponent({
      components: { RsConfirmDialog, RsConfigProvider },
      setup() {
        return () =>
          h(RsConfigProvider, { locale: 'en-US' }, {
            default: () => h(RsConfirmDialog, { open: true }),
          })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content')
    expect(content?.textContent).toContain('Confirm action?')
    expect(content?.textContent).toContain('This action may not be reversible')
    wrapper.unmount()
  })

  it('applies tone class to icon', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, tone: 'warning' },
      attachTo: document.body,
    })
    await flushPromises()
    const icon = document.body.querySelector('.rs-confirm-dialog__icon')
    expect(icon?.classList.contains('rs-confirm-dialog__icon--warning')).toBe(true)
    wrapper.unmount()
  })

  it('renders subtitle and description separately', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: {
        open: true,
        title: '确认删除',
        subtitle: '此操作不可恢复',
        description: '确定删除该用户吗？',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content')
    expect(content?.querySelector('.rs-confirm-dialog__subtitle')?.textContent).toContain(
      '此操作不可恢复',
    )
    expect(content?.querySelector('.rs-confirm-dialog__description')?.textContent).toContain(
      '确定删除该用户吗？',
    )
    wrapper.unmount()
  })

  it('applies custom width as max-width', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, title: '宽', width: 500 },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content') as HTMLElement
    expect(content.style.maxWidth).toBe('500px')
    wrapper.unmount()
  })

  it('applies preset width class', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, title: 'md', width: 'md' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content')
    expect(content?.classList.contains('rs-confirm-dialog__content--md')).toBe(true)
    wrapper.unmount()
  })

  it('keeps open when autoCloseOnConfirm is false', async () => {
    const Host = defineComponent({
      components: { RsConfirmDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <RsConfirmDialog
          v-model:open="open"
          title="异步确认"
          :auto-close-on-confirm="false"
          @confirm="$emit('confirmed')"
        />
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const buttons = document.body.querySelectorAll('.rs-confirm-dialog__footer button')
    const confirmBtn = buttons[buttons.length - 1] as HTMLElement
    await confirmBtn.click()
    await flushPromises()
    expect(wrapper.emitted('confirmed')).toHaveLength(1)
    expect(wrapper.findComponent(RsConfirmDialog).props('open')).toBe(true)
    wrapper.unmount()
  })

  it('hides overlay by default', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, title: '无遮罩' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-confirm-dialog__overlay')).toBeNull()
    wrapper.unmount()
  })

  it('shows overlay when showOverlay is true', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, title: '有遮罩', showOverlay: true },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.querySelector('.rs-confirm-dialog__overlay')).not.toBeNull()
    wrapper.unmount()
  })

  it('enables pointer events on content when open (reka-ui 2.9.10)', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, title: '测试' },
      attachTo: document.body,
    })
    await flushPromises()
    const content = document.body.querySelector('.rs-confirm-dialog__content') as HTMLElement | null
    expect(content?.style.pointerEvents).toBe('auto')
    wrapper.unmount()
  })

  it('emits confirm and closes dialog', async () => {
    const Host = defineComponent({
      components: { RsConfirmDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <RsConfirmDialog
          v-model:open="open"
          title="保存更改？"
          @confirm="$emit('confirmed')"
        />
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const buttons = document.body.querySelectorAll('.rs-confirm-dialog__footer button')
    const confirmBtn = buttons[buttons.length - 1] as HTMLElement
    await confirmBtn.click()
    await flushPromises()
    expect(wrapper.emitted('confirmed')).toHaveLength(1)
    expect(wrapper.findComponent(RsConfirmDialog).props('open')).toBe(false)
    wrapper.unmount()
  })

  it('emits cancel', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: {
        open: true,
        title: '离开页面？',
        onCancel: () => undefined,
      },
      attachTo: document.body,
    })
    await flushPromises()
    const buttons = document.body.querySelectorAll('.rs-confirm-dialog__footer button')
    const cancelBtn = buttons[0] as HTMLElement
    await cancelBtn.click()
    await flushPromises()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })

  it('mounts portal into custom target via teleportTo', async () => {
    const target = document.createElement('div')
    target.id = 'rs-confirm-target'
    document.body.appendChild(target)

    const wrapper = mount(RsConfirmDialog, {
      props: {
        open: true,
        title: '挂载目标',
        teleportTo: '#rs-confirm-target',
      },
      attachTo: document.body,
    })

    await flushPromises()
    expect(target.querySelector('.rs-confirm-dialog__content')).not.toBeNull()
    wrapper.unmount()
  })

  it('hides cancel button when showCancel is false', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: {
        open: true,
        title: '单按钮提示',
        showCancel: false,
        confirmText: '知道了',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const buttons = document.body.querySelectorAll('.rs-confirm-dialog__footer button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toContain('知道了')
    wrapper.unmount()
  })

  it('renders #extra slot between description and footer', async () => {
    const wrapper = mount(RsConfirmDialog, {
      props: { open: true, title: '额外内容', description: '正文' },
      slots: {
        extra: () => h('div', { class: 'extra-probe' }, 'extra-body'),
      },
      attachTo: document.body,
    })
    await flushPromises()
    const extra = document.body.querySelector('.rs-confirm-dialog__extra .extra-probe')
    expect(extra?.textContent).toContain('extra-body')
    wrapper.unmount()
  })

  it('blocks close when beforeClose returns false', async () => {
    const Host = defineComponent({
      components: { RsConfirmDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <RsConfirmDialog
          v-model:open="open"
          title="拦截"
          :before-close="() => false"
        />
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    const cancelBtn = document.body.querySelector(
      '.rs-confirm-dialog__footer button',
    ) as HTMLElement
    await cancelBtn.click()
    await flushPromises()
    expect(wrapper.findComponent(RsConfirmDialog).props('open')).toBe(true)
    wrapper.unmount()
  })
})
