import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsForm from '../../form/src/RsForm.vue'
import RsInput from '../../input/src/RsInput.vue'
import RsLabel from '../src/RsLabel.vue'

describe('RsLabel', () => {
  it('registers the component name', () => {
    expect(RsLabel.name).toBe('RsLabel')
  })

  it('renders slot text', () => {
    const wrapper = mount(RsLabel, {
      slots: { default: '邮箱' },
    })
    expect(wrapper.text()).toContain('邮箱')
  })

  it('shows required marker when required is true', () => {
    const wrapper = mount(RsLabel, {
      props: { required: true },
      slots: { default: '名称' },
    })
    expect(wrapper.find('.rs-label__required').exists()).toBe(true)
    expect(wrapper.find('.rs-label__required').text()).toBe('*')
    expect(wrapper.find('.rs-label__sr').text()).toBe('required')
  })

  it('hides required marker by default', () => {
    const wrapper = mount(RsLabel, {
      slots: { default: '名称' },
    })
    expect(wrapper.find('.rs-label__required').exists()).toBe(false)
    expect(wrapper.find('.rs-label__sr').exists()).toBe(false)
  })

  it('marks required asterisk as aria-hidden', () => {
    const wrapper = mount(RsLabel, {
      props: { required: true },
      slots: { default: '密码' },
    })
    expect(wrapper.find('.rs-label__required').attributes('aria-hidden')).toBe('true')
  })

  it('binds for attribute when forId is set', () => {
    const wrapper = mount(RsLabel, {
      props: { forId: 'email' },
      slots: { default: '邮箱' },
    })
    expect(wrapper.attributes('for')).toBe('email')
  })

  it('accepts htmlFor and native for as aliases of forId', () => {
    const htmlFor = mount(RsLabel, {
      props: { htmlFor: 'role' },
      slots: { default: 'Role' },
    })
    expect(htmlFor.attributes('for')).toBe('role')

    const nativeFor = mount(RsLabel, {
      props: { for: 'plan' },
      slots: { default: 'Plan' },
    })
    expect(nativeFor.attributes('for')).toBe('plan')
  })

  it('prefers htmlFor when aliases disagree', () => {
    const wrapper = mount(RsLabel, {
      props: { htmlFor: 'a', forId: 'b', for: 'c' },
      slots: { default: 'Name' },
    })
    expect(wrapper.attributes('for')).toBe('a')
  })

  it('omits for attribute when no control id is set', () => {
    const wrapper = mount(RsLabel, {
      slots: { default: '说明' },
    })
    expect(wrapper.attributes('for')).toBeUndefined()
  })

  it('renders hint text and assigns an id', () => {
    const wrapper = mount(RsLabel, {
      props: { hint: '用于登录与通知', hintId: 'hint-email' },
      slots: { default: '邮箱地址' },
    })
    expect(wrapper.find('.rs-label__hint').text()).toBe('用于登录与通知')
    expect(wrapper.find('.rs-label__hint').attributes('id')).toBe('hint-email')
  })

  it('renders the hint slot over the hint prop', () => {
    const wrapper = mount(RsLabel, {
      props: { hint: 'prop hint' },
      slots: { default: 'Bio', hint: 'slot hint' },
    })
    expect(wrapper.find('.rs-label__hint').text()).toBe('slot hint')
  })

  it('does not render hint element when hint is omitted', () => {
    const wrapper = mount(RsLabel, {
      slots: { default: '邮箱地址' },
    })
    expect(wrapper.find('.rs-label__hint').exists()).toBe(false)
  })

  it('shows optional mark and hides it when required', () => {
    const optional = mount(RsLabel, {
      props: { optional: true },
      slots: { default: 'Phone' },
    })
    expect(optional.find('.rs-label__optional').text()).toBe('(optional)')

    const both = mount(RsLabel, {
      props: { optional: true, required: true },
      slots: { default: 'Email' },
    })
    expect(both.find('.rs-label__optional').exists()).toBe(false)
    expect(both.find('.rs-label__required').exists()).toBe(true)
  })

  it('follows ConfigProvider locale for required / optional / colon', () => {
    const wrapper = mount({
      components: { RsConfigProvider, RsLabel },
      template: `
        <RsConfigProvider locale="zh-CN">
          <RsLabel required optional colon>邮箱</RsLabel>
        </RsConfigProvider>
      `,
    })
    expect(wrapper.find('.rs-label__sr').text()).toBe('必填')
    expect(wrapper.find('.rs-label__colon').text()).toBe('：')
    expect(wrapper.find('.rs-label__optional').exists()).toBe(false)
  })

  it('appends a localized colon', () => {
    const wrapper = mount(RsLabel, {
      props: { colon: true },
      slots: { default: '邮箱' },
    })
    expect(wrapper.find('.rs-label__colon').text()).toBe(':')
    expect(wrapper.find('.rs-label__colon').attributes('aria-hidden')).toBe('true')
  })

  it('applies nowrap class', () => {
    const wrapper = mount(RsLabel, {
      props: { nowrap: true },
      slots: { default: '组织名称' },
    })
    expect(wrapper.classes()).toContain('rs-label--nowrap')
  })

  it('writes id on the label', () => {
    const wrapper = mount(RsLabel, {
      props: { id: 'field-name-label' },
      slots: { default: 'Name' },
    })
    expect(wrapper.attributes('id')).toBe('field-name-label')
  })

  it('applies disabled class when disabled', () => {
    const wrapper = mount(RsLabel, {
      props: { disabled: true },
      slots: { default: '已禁用字段' },
    })
    expect(wrapper.classes()).toContain('rs-label--disabled')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('inherits Form.disabled', () => {
    const wrapper = mount({
      components: { RsForm, RsLabel },
      template: '<RsForm disabled><RsLabel>组织 ID</RsLabel></RsForm>',
    })
    expect(wrapper.find('.rs-label--disabled').exists()).toBe(true)
    expect(wrapper.find('label').attributes('aria-disabled')).toBe('true')
  })

  it('supports required, hint, forId and disabled together', () => {
    const wrapper = mount(RsLabel, {
      props: {
        forId: 'username',
        required: true,
        hint: '3–20 个字符',
        disabled: true,
      },
      slots: { default: '用户名' },
    })
    expect(wrapper.attributes('for')).toBe('username')
    expect(wrapper.classes()).toContain('rs-label--disabled')
    expect(wrapper.find('.rs-label__required').exists()).toBe(true)
    expect(wrapper.find('.rs-label__hint').text()).toBe('3–20 个字符')
    expect(wrapper.text()).toContain('用户名')
  })

  it('links label to input when forId matches input id', () => {
    const wrapper = mount({
      components: { RsLabel, RsInput },
      template: `
        <div>
          <RsLabel for-id="pg-label-input">可点击聚焦</RsLabel>
          <RsInput id="pg-label-input" />
        </div>
      `,
    })
    expect(wrapper.find('label').attributes('for')).toBe('pg-label-input')
    expect(wrapper.find('input').attributes('id')).toBe('pg-label-input')
  })
})
