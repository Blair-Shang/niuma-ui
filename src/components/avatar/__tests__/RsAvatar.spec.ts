import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsAvatar from '../src/RsAvatar.vue'
import { getAvatarInitials, resolveRsAvatarSize, resolveRsAvatarTone } from '../src/avatar-utils'

describe('RsAvatar', () => {
  it('registers the public component name', () => {
    expect(RsAvatar.name).toBe('RsAvatar')
  })

  it('renders a native span without Reka', () => {
    const wrapper = mount(RsAvatar, { props: { name: 'Jane Doe' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('rs-avatar')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
  })

  it('uses initials from name', () => {
    const wrapper = mount(RsAvatar, { props: { name: 'Jane Doe' } })
    expect(wrapper.text()).toBe('JD')
    expect(wrapper.classes()).toContain('rs-avatar--md')
    expect(wrapper.classes()).toContain('rs-avatar--circle')
  })

  it('prefers fallback text over name initials', () => {
    const wrapper = mount(RsAvatar, { props: { name: 'Jane Doe', fallback: 'AB' } })
    expect(wrapper.text()).toBe('AB')
  })

  it('renders the default icon when there is no text', () => {
    const wrapper = mount(RsAvatar)
    expect(wrapper.find('.rs-avatar__fallback').exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })

  it('applies size, shape and tone classes', () => {
    const wrapper = mount(RsAvatar, {
      props: { name: 'Jane', size: 'lg', shape: 'square', tone: 'danger' },
    })
    expect(wrapper.classes()).toContain('rs-avatar--lg')
    expect(wrapper.classes()).toContain('rs-avatar--square')
    expect(wrapper.get('.rs-avatar__fallback').classes()).toContain('rs-avatar__fallback--danger')
  })

  it('falls back to defaults for unknown size or tone', () => {
    const wrapper = mount(RsAvatar, {
      props: { name: 'Jane', size: 'xl' as never, tone: 'info' as never },
    })
    expect(wrapper.classes()).toContain('rs-avatar--md')
    expect(wrapper.get('.rs-avatar__fallback').classes()).toContain('rs-avatar__fallback--primary')
  })

  it('renders a custom fallback slot', () => {
    const wrapper = mount(RsAvatar, {
      slots: { fallback: 'OK' },
    })
    expect(wrapper.text()).toBe('OK')
  })

  it('shows the image after load and hides fallback', async () => {
    const wrapper = mount(RsAvatar, {
      props: { src: '/portrait.png', name: 'Jane Doe' },
    })
    const img = wrapper.get('img')
    expect(img.attributes('alt')).toBe('Jane Doe')
    expect(wrapper.find('.rs-avatar__fallback').exists()).toBe(true)
    await img.trigger('load')
    expect(wrapper.find('.rs-avatar__fallback').exists()).toBe(false)
    expect(wrapper.get('img').classes()).toContain('rs-avatar__image--ready')
  })

  it('returns to fallback when the image errors', async () => {
    const wrapper = mount(RsAvatar, {
      props: { src: '/missing.png', name: 'Jane Doe' },
    })
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('JD')
  })

  it('uses label for the accessible name when there is no image', () => {
    const wrapper = mount(RsAvatar, { props: { name: 'Jane Doe', label: 'Account owner' } })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Account owner')
  })
})

describe('avatar-utils', () => {
  it('resolves size and tone', () => {
    expect(resolveRsAvatarSize('sm')).toBe('sm')
    expect(resolveRsAvatarSize(undefined)).toBe('md')
    expect(resolveRsAvatarTone('danger')).toBe('danger')
    expect(resolveRsAvatarTone('info' as never)).toBe('primary')
  })

  it('formats initials', () => {
    expect(getAvatarInitials('Jane Doe')).toBe('JD')
    expect(getAvatarInitials('张三')).toBe('张三')
    expect(getAvatarInitials('弱水工作室')).toBe('弱水')
    expect(getAvatarInitials('  ')).toBe('')
  })
})
