import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsBadge from '../src/RsBadge.vue'
import { formatRsBadgeCount, resolveRsBadgeVariant } from '../src/badge-utils'

const variants = ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const

describe('RsBadge', () => {
  it('registers the public component name', () => {
    expect(RsBadge.name).toBe('RsBadge')
  })

  it('renders slot text', () => {
    const wrapper = mount(RsBadge, { slots: { default: 'Open' } })
    expect(wrapper.text()).toBe('Open')
  })

  it('renders as span with base class', () => {
    const wrapper = mount(RsBadge, { slots: { default: 'Tag' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('rs-badge')
    expect(wrapper.classes()).not.toContain('rs-badge-wrap')
    expect(wrapper.classes()).not.toContain('rs-badge--mark')
  })

  it('uses default variant when variant is omitted', () => {
    const wrapper = mount(RsBadge, { slots: { default: '默认' } })
    expect(wrapper.classes()).toContain('rs-badge--default')
  })

  it.each(variants)('applies %s variant class', (variant) => {
    const wrapper = mount(RsBadge, {
      props: { variant },
      slots: { default: variant },
    })
    expect(wrapper.classes()).toContain(`rs-badge--${variant}`)
  })

  it('renders longer slot content', () => {
    const wrapper = mount(RsBadge, {
      props: { variant: 'warning' },
      slots: { default: '配额已用尽' },
    })
    expect(wrapper.text()).toBe('配额已用尽')
    expect(wrapper.classes()).toContain('rs-badge--warning')
  })

  it('falls back to default for an unknown variant', () => {
    const wrapper = mount(RsBadge, {
      props: { variant: 'legacy' as never },
      slots: { default: '旧值' },
    })
    expect(wrapper.classes()).toContain('rs-badge--default')
    expect(wrapper.classes()).not.toContain('rs-badge--legacy')
  })

  it('renders a standalone count', () => {
    const wrapper = mount(RsBadge, {
      props: { count: 5, variant: 'danger' },
    })
    expect(wrapper.classes()).toContain('rs-badge')
    expect(wrapper.classes()).toContain('rs-badge--mark')
    expect(wrapper.classes()).toContain('rs-badge--danger')
    expect(wrapper.text()).toBe('5')
    expect(wrapper.attributes('aria-label')).toBe('5')
  })

  it('caps overflow with max', () => {
    const wrapper = mount(RsBadge, {
      props: { count: 120, max: 99, variant: 'danger' },
    })
    expect(wrapper.text()).toBe('99+')
  })

  it('hides zero unless showZero is set', () => {
    const hidden = mount(RsBadge, { props: { count: 0 } })
    expect(hidden.text()).toBe('')
    expect(hidden.find('.rs-badge').exists()).toBe(false)

    const shown = mount(RsBadge, { props: { count: 0, showZero: true } })
    expect(shown.text()).toBe('0')
  })

  it('wraps the default slot when count is set', () => {
    const wrapper = mount(RsBadge, {
      props: { count: 8, variant: 'danger' },
      slots: { default: '<button type="button">Inbox</button>' },
    })
    expect(wrapper.classes()).toContain('rs-badge-wrap')
    expect(wrapper.classes()).not.toContain('rs-badge')
    expect(wrapper.get('button').text()).toBe('Inbox')
    expect(wrapper.get('.rs-badge').text()).toBe('8')
  })

  it('keeps the host when count is zero and hidden', () => {
    const wrapper = mount(RsBadge, {
      props: { count: 0 },
      slots: { default: '<button type="button">Inbox</button>' },
    })
    expect(wrapper.classes()).toContain('rs-badge-wrap')
    expect(wrapper.find('.rs-badge').exists()).toBe(false)
    expect(wrapper.get('button').text()).toBe('Inbox')
  })

  it('renders a decorative dot on the host', () => {
    const wrapper = mount(RsBadge, {
      props: { dot: true, variant: 'danger' },
      slots: { default: '<button type="button">Inbox</button>' },
    })
    const mark = wrapper.get('.rs-badge')
    expect(wrapper.classes()).toContain('rs-badge-wrap')
    expect(mark.classes()).toContain('rs-badge--dot')
    expect(mark.text()).toBe('')
    expect(mark.attributes('aria-hidden')).toBe('true')
  })

  it('prefers dot over count text', () => {
    const wrapper = mount(RsBadge, {
      props: { dot: true, count: 12, variant: 'danger' },
    })
    expect(wrapper.classes()).toContain('rs-badge--dot')
    expect(wrapper.text()).toBe('')
  })
})

describe('badge-utils', () => {
  it('resolves known and unknown variants', () => {
    expect(resolveRsBadgeVariant('success')).toBe('success')
    expect(resolveRsBadgeVariant(undefined)).toBe('default')
    expect(resolveRsBadgeVariant('nope' as never)).toBe('default')
  })

  it('formats counts', () => {
    expect(formatRsBadgeCount(undefined)).toBeNull()
    expect(formatRsBadgeCount(0)).toBeNull()
    expect(formatRsBadgeCount(0, 99, true)).toBe('0')
    expect(formatRsBadgeCount(-1)).toBeNull()
    expect(formatRsBadgeCount(5)).toBe('5')
    expect(formatRsBadgeCount(100)).toBe('99+')
    expect(formatRsBadgeCount(12, 9)).toBe('9+')
    expect(formatRsBadgeCount('7')).toBe('7')
  })
})
