import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsTag from '../src/RsTag.vue'
import { resolveRsTagVariant } from '../src/tag-utils'

const variants = ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const

describe('RsTag', () => {
  it('registers the public component name', () => {
    expect(RsTag.name).toBe('RsTag')
  })

  it('renders slot text on a span', () => {
    const wrapper = mount(RsTag, { slots: { default: 'Production' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('rs-tag')
    expect(wrapper.classes()).toContain('rs-tag--default')
    expect(wrapper.text()).toBe('Production')
    expect(wrapper.find('.rs-tag__close').exists()).toBe(false)
  })

  it.each(variants)('applies %s variant class', (variant) => {
    const wrapper = mount(RsTag, {
      props: { variant },
      slots: { default: variant },
    })
    expect(wrapper.classes()).toContain(`rs-tag--${variant}`)
  })

  it('keeps the raw variant class like the original markup', () => {
    const wrapper = mount(RsTag, {
      props: { variant: 'legacy' as never },
      slots: { default: 'old' },
    })
    expect(wrapper.classes()).toContain('rs-tag--legacy')
    expect(wrapper.classes()).not.toContain('rs-tag--default')
  })

  it('marks a pill when round or radius is full', () => {
    const round = mount(RsTag, { props: { round: true }, slots: { default: 'pill' } })
    expect(round.classes()).toContain('rs-tag--round')

    const full = mount(RsTag, { props: { radius: 'full' }, slots: { default: 'pill' } })
    expect(full.classes()).toContain('rs-tag--round')
  })

  it('emits close from the RsButton and does not unmount', async () => {
    const wrapper = mount(RsTag, {
      props: { closable: true },
      slots: { default: 'Vue' },
    })
    const close = wrapper.get('.rs-tag__close')
    expect(close.classes()).toContain('rs-btn')
    expect(close.attributes('aria-label')).toBeTruthy()

    await close.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.text()).toContain('Vue')
  })

  it('does not emit close when disabled', async () => {
    const wrapper = mount(RsTag, {
      props: { closable: true, disabled: true },
      slots: { default: 'Locked' },
    })
    expect(wrapper.classes()).toContain('rs-tag--disabled')
    await wrapper.get('.rs-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})

describe('tag-utils', () => {
  it('resolves known and unknown variants', () => {
    expect(resolveRsTagVariant('success')).toBe('success')
    expect(resolveRsTagVariant(undefined)).toBe('default')
    expect(resolveRsTagVariant('nope' as never)).toBe('default')
  })
})
