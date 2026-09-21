import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import RsLog from '../src/RsLog.vue'

describe('RsLog a11y baseline', () => {
  it('names the log region and keeps virtualization off the live channel', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: '[ERROR] boom',
        ariaLabel: '构建日志',
        height: 160,
        itemSize: 24,
      },
    })
    const viewport = wrapper.find('.rs-log__viewport')
    expect(viewport.attributes('role')).toBe('region')
    expect(viewport.attributes('aria-label')).toBe('构建日志')
    expect(viewport.attributes('tabindex')).toBe('0')
    expect(wrapper.find('[role="list"]').exists()).toBe(true)
    expect(wrapper.find('.rs-log__row').attributes('aria-label')).toContain('错误')
    expect(wrapper.find('.rs-log__row').attributes('aria-label')).toContain('[ERROR] boom')
    wrapper.unmount()
  })

  it('sets aria-busy when busy', () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'running', busy: true, height: 80 },
    })
    expect(wrapper.find('.rs-log__viewport').attributes('aria-busy')).toBe('true')
    wrapper.unmount()
  })

  it('announces new lines only when live is enabled', async () => {
    const off = mount(RsLog, {
      props: { lines: 'a', height: 80, itemSize: 24 },
    })
    expect(off.find('[aria-live="polite"]').exists()).toBe(false)
    off.unmount()

    const on = mount(RsLog, {
      props: { lines: 'a', live: 'polite', height: 80, itemSize: 24 },
    })
    expect(on.find('[aria-live="polite"]').exists()).toBe(true)
    await on.setProps({ lines: 'a\nb' })
    await nextTick()
    expect(on.find('[aria-live="polite"]').text()).toContain('新增')
    on.unmount()
  })

  it('moves the active row with arrow keys', async () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: 'one\ntwo\nthree',
        height: 160,
        itemSize: 24,
      },
      attachTo: document.body,
    })
    const viewport = wrapper.find('.rs-log__viewport')
    await viewport.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.find('.rs-log__row--active').exists()).toBe(true)
    expect(wrapper.find('.rs-log__row--active').text()).toContain('one')

    await viewport.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.find('.rs-log__row--active').text()).toContain('two')

    await viewport.trigger('keydown', { key: 'End' })
    await nextTick()
    expect(wrapper.find('.rs-log__row--active').text()).toContain('three')
    wrapper.unmount()
  })
})
