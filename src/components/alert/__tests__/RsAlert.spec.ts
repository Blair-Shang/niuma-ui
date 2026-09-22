import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import RsAlert from '../src/RsAlert.vue'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import {
  hasAlertDescription,
  hasAlertTitle,
  resolveAlertIcon,
  resolveAlertRole,
  resolveAlertSize,
  resolveAlertTone,
  resolveAlertVariant,
  shouldShowAlertIcon,
} from '../src/alert-utils'
import type { RsAlertExpose } from '../src/alert-utils'

describe('alert-utils', () => {
  it('prefers tone over type and falls back to info', () => {
    expect(resolveAlertTone('danger', 'success')).toBe('danger')
    expect(resolveAlertTone(undefined, 'warning')).toBe('warning')
    expect(resolveAlertTone('nope', 'also-nope')).toBe('info')
    expect(resolveAlertTone()).toBe('info')
  })

  it('maps unknown variant to soft and ssm size to sm', () => {
    expect(resolveAlertVariant('outline')).toBe('outline')
    expect(resolveAlertVariant('filled')).toBe('soft')
    expect(resolveAlertSize('ssm')).toBe('sm')
    expect(resolveAlertSize('lg')).toBe('lg')
    expect(resolveAlertSize()).toBe('md')
  })

  it('picks icons and live roles from tone', () => {
    expect(resolveAlertIcon('success')).toBe('circle-check')
    expect(resolveAlertIcon('warning')).toBe('triangle-alert')
    expect(resolveAlertIcon('danger')).toBe('circle-alert')
    expect(resolveAlertIcon('info')).toBe('info')
    expect(resolveAlertIcon('default')).toBe('info')
    expect(resolveAlertRole('danger')).toBe('alert')
    expect(resolveAlertRole('warning')).toBe('alert')
    expect(resolveAlertRole('info')).toBe('status')
    expect(resolveAlertRole('success')).toBe('status')
  })

  it('keeps a custom icon slot even when showIcon is false', () => {
    expect(shouldShowAlertIcon(false, true)).toBe(true)
    expect(shouldShowAlertIcon(false, false)).toBe(false)
    expect(shouldShowAlertIcon(true, false)).toBe(true)
    expect(hasAlertTitle('Title')).toBe(true)
    expect(hasAlertTitle('', true)).toBe(true)
    expect(hasAlertTitle('')).toBe(false)
    expect(hasAlertDescription('Body')).toBe(true)
    expect(hasAlertDescription('', true)).toBe(true)
    expect(hasAlertDescription('')).toBe(false)
  })
})

describe('RsAlert', () => {
  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsAlert, {
      props: { title: 'Ready' },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.find('.rs-alert').exists()).toBe(true)
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsAlert, { props: { title: 'Ready' } })
    expect(wrapper.vm.$options.name).toBe('RsAlert')
  })

  it('keeps the historical type prop and defaults to info', () => {
    const info = mount(RsAlert, { props: { title: 'Synced' } })
    expect(info.classes()).toContain('rs-alert--info')
    expect(info.classes()).toContain('rs-alert--soft')
    expect(info.attributes('role')).toBe('status')

    const typed = mount(RsAlert, { props: { type: 'success', title: 'Done' } })
    expect(typed.classes()).toContain('rs-alert--success')
    expect(typed.attributes('role')).toBe('status')
  })

  it('lets tone win over type', () => {
    const wrapper = mount(RsAlert, {
      props: { type: 'success', tone: 'danger', title: 'Conflict' },
    })
    expect(wrapper.classes()).toContain('rs-alert--danger')
    expect(wrapper.classes()).not.toContain('rs-alert--success')
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('renders title, description prop, and default slot', () => {
    const withProp = mount(RsAlert, {
      props: { title: 'Quota', description: 'Scale up soon.' },
    })
    expect(withProp.find('.rs-alert__title').text()).toBe('Quota')
    expect(withProp.find('.rs-alert__content').text()).toBe('Scale up soon.')

    const withSlot = mount(RsAlert, {
      props: { title: 'Quota' },
      slots: { default: 'Use the default slot.' },
    })
    expect(withSlot.find('.rs-alert__content').text()).toBe('Use the default slot.')
  })

  it('emits close and does not unmount itself', async () => {
    const wrapper = mount(RsAlert, {
      props: { title: 'Closable', closable: true },
    })
    expect(wrapper.find('.rs-alert__close').exists()).toBe(true)
    await wrapper.find('.rs-alert__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.find('.rs-alert').exists()).toBe(true)
  })

  it('hides the default icon when showIcon is false', () => {
    const hidden = mount(RsAlert, {
      props: { title: 'Plain', showIcon: false },
    })
    expect(hidden.find('.rs-alert__icon').exists()).toBe(false)
    expect(hidden.classes()).toContain('rs-alert--no-icon')

    const custom = mount(RsAlert, {
      props: { title: 'Custom', showIcon: false },
      slots: { icon: '<span class="custom-icon">!</span>' },
    })
    expect(custom.find('.rs-alert__icon .custom-icon').text()).toBe('!')
  })

  it('renders action, title, and close slots', () => {
    const wrapper = mount(RsAlert, {
      props: { closable: true },
      slots: {
        title: 'Slotted title',
        default: 'Body',
        action: '<button type="button" class="retry">Retry</button>',
        close: '<span class="close-copy">Hide</span>',
      },
    })
    expect(wrapper.find('.rs-alert__title').text()).toBe('Slotted title')
    expect(wrapper.find('.rs-alert__action .retry').text()).toBe('Retry')
    expect(wrapper.find('.rs-alert__close .close-copy').text()).toBe('Hide')
  })

  it('applies banner, outline, and radius tokens', () => {
    const wrapper = mount(RsAlert, {
      props: { title: 'Banner', banner: true, variant: 'outline', radius: 'lg' },
    })
    expect(wrapper.classes()).toContain('rs-alert--banner')
    expect(wrapper.classes()).toContain('rs-alert--outline')
    const style = wrapper.attributes('style') ?? ''
    expect(style).toMatch(/--rs-alert-radius:\s*0/)
  })

  it('follows ConfigProvider size when size is omitted', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'lg' },
      slots: {
        default: () => h(RsAlert, { title: 'Sized' }),
      },
    })
    expect(wrapper.find('.rs-alert').classes()).toContain('rs-alert--lg')
  })

  it('exposes focus onto the close button', async () => {
    const wrapper = mount(RsAlert, {
      props: { title: 'Focus me', closable: true },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as RsAlertExpose
    exposed.focus()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('.rs-alert__close').element)
    wrapper.unmount()
  })
})
