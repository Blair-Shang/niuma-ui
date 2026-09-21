import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsDivider from '../src/RsDivider.vue'
import { resolveRsDividerOrientation } from '../src/divider-utils'

describe('RsDivider', () => {
  it('registers the public component name', () => {
    expect(RsDivider.name).toBe('RsDivider')
  })

  it('renders a horizontal hr by default', () => {
    const wrapper = mount(RsDivider)
    expect(wrapper.element.tagName).toBe('HR')
    expect(wrapper.classes()).toContain('rs-divider')
    expect(wrapper.classes()).toContain('rs-divider--horizontal')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
    expect(wrapper.find('.rs-divider__label').exists()).toBe(false)
  })

  it('renders a vertical hr and ignores the default slot', () => {
    const wrapper = mount(RsDivider, {
      props: { orientation: 'vertical' },
      slots: { default: 'Or' },
    })
    expect(wrapper.element.tagName).toBe('HR')
    expect(wrapper.classes()).toContain('rs-divider--vertical')
    expect(wrapper.classes()).toContain('rs-divider--with-label')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
    expect(wrapper.find('.rs-divider__label').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('shows the default slot only on a horizontal rule', () => {
    const wrapper = mount(RsDivider, { slots: { default: 'Or' } })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
    const label = wrapper.get('.rs-divider__label')
    expect(wrapper.classes()).toContain('rs-divider--with-label')
    expect(label.text()).toBe('Or')
  })

  it('applies dashed', () => {
    const wrapper = mount(RsDivider, { props: { dashed: true } })
    expect(wrapper.classes()).toContain('rs-divider--dashed')
  })

  it('keeps the raw orientation class', () => {
    const wrapper = mount(RsDivider, { props: { orientation: 'legacy' as never } })
    expect(wrapper.classes()).toContain('rs-divider--legacy')
    expect(wrapper.classes()).not.toContain('rs-divider--horizontal')
  })
})

describe('divider-utils', () => {
  it('resolves known and unknown orientations', () => {
    expect(resolveRsDividerOrientation('vertical')).toBe('vertical')
    expect(resolveRsDividerOrientation(undefined)).toBe('horizontal')
    expect(resolveRsDividerOrientation('nope' as never)).toBe('horizontal')
  })
})
