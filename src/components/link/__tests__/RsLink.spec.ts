import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsLink from '../src/RsLink.vue'
import { mergeRsLinkRel, resolveRsLinkTone } from '../src/link-utils'

describe('RsLink', () => {
  it('registers the public component name', () => {
    expect(RsLink.name).toBe('RsLink')
  })

  it('renders a native anchor without Reka', () => {
    const wrapper = mount(RsLink, {
      props: { href: '/docs' },
      slots: { default: '查看文档' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.text()).toContain('查看文档')
    expect(wrapper.attributes('href')).toBe('/docs')
  })

  it('defaults to primary tone', () => {
    const wrapper = mount(RsLink, {
      props: { href: '/docs' },
      slots: { default: '文档' },
    })
    expect(wrapper.classes()).toContain('rs-link--tone-primary')
    expect(wrapper.classes()).not.toContain('rs-link--has-icon')
  })

  it('applies tone class', () => {
    const wrapper = mount(RsLink, {
      props: { href: '/docs', tone: 'danger' },
      slots: { default: '删除' },
    })
    expect(wrapper.classes()).toContain('rs-link--tone-danger')
  })

  it('renders a decorative prefix icon', () => {
    const wrapper = mount(RsLink, {
      props: { href: 'https://example.com', target: '_blank', icon: 'external-link' },
      slots: { default: '外部' },
    })
    expect(wrapper.find('.rs-link__icon').exists()).toBe(true)
    expect(wrapper.classes()).toContain('rs-link--has-icon')
  })

  it('adds secure rel for target blank', () => {
    const wrapper = mount(RsLink, {
      props: { href: 'https://example.com', target: '_blank' },
    })
    const rel = wrapper.attributes('rel')
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
  })

  it('merges custom rel with secure rel for target blank', () => {
    const wrapper = mount(RsLink, {
      props: { href: 'https://example.com', target: '_blank', rel: 'external' },
    })
    const rel = wrapper.attributes('rel')
    expect(rel).toContain('external')
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
  })

  it('sets disabled accessibility attributes and blocks click', () => {
    const wrapper = mount(RsLink, {
      props: { href: '/docs', disabled: true },
      slots: { default: '禁用' },
    })
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.attributes('href')).toBeUndefined()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('applies underline variant class', () => {
    const wrapper = mount(RsLink, {
      props: { href: '/docs', underline: 'always' },
    })
    expect(wrapper.classes()).toContain('rs-link--underline-always')
  })
})

describe('link-utils', () => {
  it('defaults tone to primary', () => {
    expect(resolveRsLinkTone()).toBe('primary')
    expect(resolveRsLinkTone('danger')).toBe('danger')
  })

  it('merges rel for blank targets', () => {
    expect(mergeRsLinkRel('external', '_blank')).toBe('external noopener noreferrer')
    expect(mergeRsLinkRel(undefined, '_self')).toBeUndefined()
  })
})
