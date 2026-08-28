import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RsButton from '../components/RsButton.vue'

async function openTooltip(wrapper: ReturnType<typeof mount>) {
  await wrapper.trigger('mouseenter')
  await vi.advanceTimersByTimeAsync(300)
}

describe('RsButton', () => {
  it('renders slot', () => {
    const wrapper = mount(RsButton, {
      slots: { default: '确定' },
    })
    expect(wrapper.text()).toContain('确定')
  })

  it('applies size class', () => {
    const wrapper = mount(RsButton, {
      props: { size: 'lg' },
    })
    expect(wrapper.classes()).toContain('rs-btn--lg')
  })

  it('applies default variant class', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'default' },
    })
    expect(wrapper.classes()).toContain('rs-btn--default')
  })

  it('applies variant class', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'ghost' },
    })
    expect(wrapper.classes()).toContain('rs-btn--ghost')
  })

  it('text variant defaults to borderless + neutral tone', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'text' },
      slots: { default: '编辑' },
    })
    expect(wrapper.classes()).toContain('rs-btn--text')
    expect(wrapper.classes()).toContain('rs-btn--borderless')
    expect(wrapper.classes()).toContain('rs-btn--tone-neutral')
  })

  it('text + tone applies semantic tone class', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'text', tone: 'primary' },
      slots: { default: '新增' },
    })
    expect(wrapper.classes()).toContain('rs-btn--text')
    expect(wrapper.classes()).toContain('rs-btn--tone-primary')
  })

  it('ghost supports tone without becoming filled', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'ghost', tone: 'danger' },
      slots: { default: '删除' },
    })
    expect(wrapper.classes()).toContain('rs-btn--ghost')
    expect(wrapper.classes()).toContain('rs-btn--tone-danger')
    expect(wrapper.classes()).not.toContain('rs-btn--danger')
  })

  it('filled primary ignores tone class', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'primary', tone: 'danger' },
      slots: { default: '保存' },
    })
    expect(wrapper.classes()).toContain('rs-btn--primary')
    expect(wrapper.classes()).not.toContain('rs-btn--tone-danger')
  })

  it('link defaults to primary tone', () => {
    const wrapper = mount(RsButton, {
      props: { variant: 'link' },
      slots: { default: '查看' },
    })
    expect(wrapper.classes()).toContain('rs-btn--link')
    expect(wrapper.classes()).toContain('rs-btn--tone-primary')
  })

  it('renders prefix icon', () => {
    const wrapper = mount(RsButton, {
      props: { icon: 'plus' },
      slots: { default: '新建' },
    })
    expect(wrapper.find('.rs-btn__icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('新建')
  })

  it('iconOnly with tooltip sets aria-label', () => {
    const wrapper = mount(RsButton, {
      props: { icon: 'search', iconOnly: true, tooltip: '搜索' },
    })
    expect(wrapper.classes()).toContain('rs-btn--icon-only')
    expect(wrapper.attributes('aria-label')).toBe('搜索')
    expect(document.body.querySelector('.rs-btn__tooltip')).toBeNull()
    wrapper.unmount()
  })

  it('iconOnly uses slot text in floating tooltip when tooltip omitted', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsButton, {
      props: { icon: 'message-square', iconOnly: true },
      slots: { default: '消息' },
      attachTo: document.body,
    })
    expect(wrapper.find('.rs-btn__label').exists()).toBe(false)
    await openTooltip(wrapper)
    expect(document.body.querySelector('.rs-btn__tooltip')?.textContent).toBe('消息')
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('reveal-label mode keeps label in dom with reveal class', () => {
    const wrapper = mount(RsButton, {
      props: { icon: 'plus', revealLabel: true },
      slots: { default: '新建对话' },
    })
    expect(wrapper.classes()).toContain('rs-btn--reveal-label')
    expect(wrapper.find('.rs-btn__label--reveal').exists()).toBe(true)
    expect(wrapper.text()).toContain('新建对话')
  })

  it('shows tooltip when tooltip prop is set with label', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsButton, {
      props: { icon: 'plus', tooltip: 'Ctrl+N' },
      slots: { default: '新建' },
      attachTo: document.body,
    })
    await openTooltip(wrapper)
    const tip = document.body.querySelector('.rs-btn__tooltip')
    expect(tip?.textContent).toBe('Ctrl+N')
    expect(wrapper.attributes('aria-describedby')).toBe(tip?.id)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('portals tooltip to document.body so overflow parents cannot clip it', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsButton, {
      props: { icon: 'plus', iconOnly: true, tooltip: '新建' },
      attachTo: document.body,
    })
    await openTooltip(wrapper)
    const tip = document.body.querySelector('.rs-btn__tooltip')
    expect(tip).not.toBeNull()
    expect(wrapper.element.contains(tip)).toBe(false)
    expect(tip?.parentElement).toBe(document.body)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('loading: applies class, keeps enabled, shows inline spinner and label', async () => {
    const wrapper = mount(RsButton, {
      props: { loading: true, variant: 'secondary' },
      slots: { default: '测试连接' },
    })
    const btn = wrapper.find('button')
    expect(btn.classes()).toContain('rs-btn--loading')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.attributes('aria-busy')).toBe('true')
    expect(btn.find('.rs-btn__spinner-ring').exists()).toBe(true)
    expect(btn.text()).toContain('测试连接')
  })

  it('loading: locks min-width to avoid layout shift', async () => {
    const wrapper = mount(RsButton, {
      props: { loading: false, variant: 'default' },
      slots: { default: '测试连接' },
      attachTo: document.body,
    })
    const btn = wrapper.find('button').element as HTMLButtonElement
    Object.defineProperty(btn, 'offsetWidth', { configurable: true, value: 120 })
    await wrapper.setProps({ loading: true })
    await wrapper.vm.$nextTick()
    expect(btn.style.minWidth).toBe('120px')
    await wrapper.setProps({ loading: false })
    await wrapper.vm.$nextTick()
    expect(btn.style.minWidth).toBe('')
    wrapper.unmount()
  })
})
