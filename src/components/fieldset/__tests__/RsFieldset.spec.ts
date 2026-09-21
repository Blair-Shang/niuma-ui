import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsFieldset from '../src/RsFieldset.vue'
import RsForm from '../../form/src/RsForm.vue'
import RsTooltipProvider from '../../tooltip/src/RsTooltipProvider.vue'
import {
  resolveFieldsetInvalid,
  resolveFieldsetTitleSize,
  resolveFieldsetTitleWeight,
  resolveFieldsetTooltip,
} from '../src/fieldset-utils'

describe('fieldset-utils', () => {
  it('maps title size and weight to tokens', () => {
    expect(resolveFieldsetTitleSize('sm')).toBe('var(--rs-font-size-sm)')
    expect(resolveFieldsetTitleWeight('bold')).toBe('var(--rs-font-weight-bold)')
  })

  it('prefers tooltip over deprecated description', () => {
    expect(resolveFieldsetTooltip('  Help  ', 'old')).toBe('Help')
    expect(resolveFieldsetTooltip(undefined, '  old  ')).toBe('old')
    expect(resolveFieldsetTooltip(undefined, undefined)).toBe('')
  })

  it('treats error text or error slot as invalid', () => {
    expect(resolveFieldsetInvalid(false, undefined, false)).toBe(false)
    expect(resolveFieldsetInvalid(true, undefined, false)).toBe(true)
    expect(resolveFieldsetInvalid(false, ' Pick one ', false)).toBe(true)
    expect(resolveFieldsetInvalid(false, '   ', true)).toBe(true)
    expect(resolveFieldsetInvalid(false, '', false)).toBe(false)
  })
})

describe('RsFieldset', () => {
  it('registers the component name', () => {
    expect(RsFieldset.name).toBe('RsFieldset')
  })

  it('renders a native fieldset with legend', () => {
    const wrapper = mount(RsFieldset, {
      props: { legend: '推送配置' },
      slots: { default: '<input class="inner" />' },
    })
    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.find('legend').text()).toBe('推送配置')
    expect(wrapper.find('.inner').exists()).toBe(true)
  })

  it('omits legend when title and slots are empty', () => {
    const wrapper = mount(RsFieldset, {
      slots: { default: '内容' },
    })
    expect(wrapper.find('legend').exists()).toBe(false)
    expect(wrapper.text()).toContain('内容')
  })

  it('puts group help on a tooltip icon, not a description row', () => {
    const wrapper = mount({
      components: { RsFieldset, RsTooltipProvider },
      template: `
        <RsTooltipProvider>
          <RsFieldset legend="推送对象" tooltip="已选 2 个文件" />
        </RsTooltipProvider>
      `,
    })
    expect(wrapper.find('.rs-fieldset__description').exists()).toBe(false)
    expect(wrapper.find('.rs-tooltip__icon-trigger').exists()).toBe(true)
    expect(wrapper.find('.rs-tooltip__icon-trigger').attributes('aria-label')).toBe('Group help')
    expect(wrapper.find('legend').text()).toContain('推送对象')
    expect(wrapper.find('legend').text()).not.toContain('已选 2 个文件')
  })

  it('maps deprecated description to the same tooltip', () => {
    const wrapper = mount({
      components: { RsFieldset, RsTooltipProvider },
      template: `
        <RsTooltipProvider>
          <RsFieldset legend="推送对象" description="已选 2 个文件" />
        </RsTooltipProvider>
      `,
    })
    expect(wrapper.find('.rs-tooltip__icon-trigger').exists()).toBe(true)
    expect(wrapper.find('.rs-fieldset__description').exists()).toBe(false)
  })

  it('uses en-US help label inside RsConfigProvider', () => {
    const wrapper = mount({
      components: { RsConfigProvider, RsFieldset, RsTooltipProvider },
      template: `
        <RsConfigProvider locale="en-US">
          <RsTooltipProvider>
            <RsFieldset legend="Target" tooltip="Two files" />
          </RsTooltipProvider>
        </RsConfigProvider>
      `,
    })
    expect(wrapper.find('.rs-tooltip__icon-trigger').attributes('aria-label')).toBe('Group help')
  })

  it('applies size, border and title classes', () => {
    const wrapper = mount(RsFieldset, {
      props: {
        legend: '分组',
        size: 'sm',
        borderStyle: 'dashed',
        borderTone: 'faded',
        titleTone: 'muted',
        titleWeight: 'bold',
      },
    })
    expect(wrapper.classes()).toContain('rs-fieldset--sm')
    expect(wrapper.classes()).toContain('rs-fieldset--dashed')
    expect(wrapper.classes()).toContain('rs-fieldset--tone-faded')
    expect(wrapper.classes()).toContain('rs-fieldset--title-muted')
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--rs-fieldset-title-weight')).toBe(
      'var(--rs-font-weight-bold)',
    )
  })

  it('forwards native name, id and form', () => {
    const wrapper = mount(RsFieldset, {
      props: { legend: '账号', name: 'account', id: 'acct', form: 'signup' },
    })
    expect(wrapper.attributes('name')).toBe('account')
    expect(wrapper.attributes('id')).toBe('acct')
    expect(wrapper.attributes('form')).toBe('signup')
  })

  it('disables the native fieldset', () => {
    const wrapper = mount(RsFieldset, {
      props: { legend: '推送配置', disabled: true },
      slots: { default: '<input class="inner" />' },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('rs-fieldset--disabled')
  })

  it('shows tooltip text as a hint when the group is disabled', () => {
    const wrapper = mount({
      components: { RsFieldset, RsTooltipProvider },
      template: `
        <RsTooltipProvider>
          <RsFieldset legend="推送配置" tooltip="任务进行中不可改" disabled />
        </RsTooltipProvider>
      `,
    })
    expect(wrapper.find('.rs-tooltip__icon-trigger').exists()).toBe(false)
    expect(wrapper.find('.rs-fieldset__hint').text()).toBe('任务进行中不可改')
    expect(wrapper.find('fieldset').attributes('aria-describedby')).toBeTruthy()
  })

  it('inherits disabled from RsForm', () => {
    const wrapper = mount({
      components: { RsForm, RsFieldset },
      template: `
        <RsForm disabled>
          <RsFieldset legend="账号">
            <input class="inner" />
          </RsFieldset>
        </RsForm>
      `,
    })
    expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.find('fieldset').classes()).toContain('rs-fieldset--disabled')
  })

  it('marks the group required without putting * in the accessible name twice', () => {
    const wrapper = mount(RsFieldset, {
      props: { legend: '协议', required: true },
    })
    expect(wrapper.find('.rs-fieldset__required').text()).toBe('*')
    expect(wrapper.find('.rs-fieldset__required').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.rs-fieldset__sr').text()).toBe('required')
  })

  it('exposes group error as alert and aria-invalid', () => {
    const wrapper = mount(RsFieldset, {
      props: { legend: '协议', error: 'Pick one protocol' },
    })
    expect(wrapper.classes()).toContain('rs-fieldset--invalid')
    expect(wrapper.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.rs-fieldset__error').attributes('role')).toBe('alert')
    expect(wrapper.find('.rs-fieldset__error').text()).toBe('Pick one protocol')
    expect(wrapper.attributes('aria-describedby')).toBe(wrapper.find('.rs-fieldset__error').attributes('id'))
  })

  it('renders legend, extra and error slots', () => {
    const wrapper = mount(RsFieldset, {
      slots: {
        legend: '<span class="custom-legend">自定义</span>',
        extra: '<span class="count">3</span>',
        error: '<span class="custom-error">组错误</span>',
        default: '正文',
      },
    })
    expect(wrapper.find('.custom-legend').text()).toBe('自定义')
    expect(wrapper.find('.count').text()).toBe('3')
    expect(wrapper.find('.custom-error').text()).toBe('组错误')
    expect(wrapper.classes()).toContain('rs-fieldset--invalid')
    expect(wrapper.text()).toContain('正文')
  })
})
