import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import { useRsLoadingBar } from '../../../composables/useRsLoadingBar'
import RsLoadingBar from '../src/RsLoadingBar.vue'
import {
  advanceLoadingBar,
  clampLoadingBar,
  loadingBarHasTimerHost,
  nextLoadingBarInc,
  resolveLoadingBarAttach,
  resolveLoadingBarDelay,
  resolveLoadingBarDuration,
  resolveLoadingBarHeight,
  resolveLoadingBarPosition,
  resolveLoadingBarRange,
  resolveLoadingBarSpeed,
  resolveLoadingBarTone,
} from '../src/loading-bar-utils'

describe('loading-bar-utils', () => {
  it('clamps non-finite and out-of-range progress', () => {
    expect(clampLoadingBar(Number.NaN)).toBe(0)
    expect(clampLoadingBar(-3)).toBe(0)
    expect(clampLoadingBar(40)).toBe(40)
    expect(clampLoadingBar(150)).toBe(100)
  })

  it('keeps the historical trickle step and stops at the ceiling', () => {
    expect(advanceLoadingBar(8, 92)).toBeCloseTo(14.72)
    expect(advanceLoadingBar(90, 92)).toBeCloseTo(90.5)
    expect(advanceLoadingBar(92, 92)).toBe(92)
    expect(advanceLoadingBar(Number.NaN, 92)).toBeCloseTo(7.36)
  })

  it('increments with a shrinking step and never reaches 100', () => {
    expect(nextLoadingBarInc(8)).toBe(18)
    expect(nextLoadingBarInc(40, 10)).toBe(50)
    expect(nextLoadingBarInc(98)).toBe(98.5)
    expect(nextLoadingBarInc(99)).toBe(99)
    expect(nextLoadingBarInc(100)).toBe(100)
  })

  it('resolves tone, placement, size, range, speed, and delay', () => {
    expect(resolveLoadingBarTone('info')).toBe('info')
    expect(resolveLoadingBarTone('nope')).toBe('primary')
    expect(resolveLoadingBarPosition('bottom')).toBe('bottom')
    expect(resolveLoadingBarPosition('side')).toBe('top')
    expect(resolveLoadingBarAttach('parent')).toBe('parent')
    expect(resolveLoadingBarAttach('fixed')).toBe('viewport')
    expect(resolveLoadingBarHeight(0)).toBe(2)
    expect(resolveLoadingBarHeight(Number.NaN)).toBe(2)
    expect(resolveLoadingBarHeight(4)).toBe(4)
    expect(resolveLoadingBarRange(undefined, undefined)).toEqual({ minimum: 8, maximum: 92 })
    expect(resolveLoadingBarRange(95, 10)).toEqual({ minimum: 10, maximum: 10 })
    expect(resolveLoadingBarSpeed(0)).toBe(200)
    expect(resolveLoadingBarSpeed(32)).toBe(32)
    expect(resolveLoadingBarDelay(-5)).toBe(0)
    expect(resolveLoadingBarDelay(40)).toBe(40)
    expect(resolveLoadingBarDuration(-1, 280)).toBe(280)
    expect(resolveLoadingBarDuration(0, 280)).toBe(0)
  })

  it('treats a missing window as having no timer host', () => {
    expect(loadingBarHasTimerHost(null)).toBe(false)
    expect(loadingBarHasTimerHost({})).toBe(false)
    expect(loadingBarHasTimerHost(window)).toBe(true)
  })
})

describe('RsLoadingBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsLoadingBar)
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.find('.rs-loading-bar').exists()).toBe(true)
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsLoadingBar)
    expect(wrapper.vm.$options.name).toBe('RsLoadingBar')
  })

  it('renders the default slot and stays hidden until start', async () => {
    const wrapper = mount(RsLoadingBar, {
      props: { trickle: false },
      slots: { default: 'child' },
    })
    expect(wrapper.text()).toContain('child')
    const bar = wrapper.find('.rs-loading-bar')
    expect(bar.classes()).toContain('rs-loading-bar--primary')
    expect(bar.classes()).not.toContain('rs-loading-bar--visible')
    expect(bar.attributes('aria-hidden')).toBe('true')
    expect(bar.attributes('role')).toBeUndefined()
    expect(bar.attributes('style') ?? '').not.toContain('--rs-loading-bar-size')

    wrapper.vm.start()
    await nextTick()
    expect(bar.classes()).toContain('rs-loading-bar--visible')
    expect(bar.attributes('role')).toBe('progressbar')
    expect(bar.attributes('aria-valuenow')).toBe('8')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(wrapper.emitted('start')).toEqual([[1]])
    expect(wrapper.emitted('change')).toEqual([[8]])
    expect(wrapper.vm.isStarted()).toBe(true)
    expect(wrapper.vm.getProgress()).toBe(8)
  })

  it('finishes at 100 and hides after the historical delay', async () => {
    const wrapper = mount(RsLoadingBar, { props: { trickle: false } })
    wrapper.vm.finish()
    await nextTick()
    expect(wrapper.find('.rs-loading-bar').attributes('aria-valuenow')).toBe('100')
    expect(wrapper.emitted('finish')).toEqual([[0]])
    vi.advanceTimersByTime(280)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(false)
    expect(wrapper.vm.isStarted()).toBe(false)
  })

  it('drops a stale hide timer when start runs during finish', async () => {
    const wrapper = mount(RsLoadingBar, { props: { trickle: false } })
    wrapper.vm.start()
    wrapper.vm.finish()
    vi.advanceTimersByTime(100)
    wrapper.vm.start()
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(true)
    expect(wrapper.vm.isStarted()).toBe(true)
    expect(wrapper.vm.getProgress()).toBe(8)
  })

  it('resets to the minimum when nesting is off', async () => {
    const wrapper = mount(RsLoadingBar, { props: { trickle: false } })
    wrapper.vm.start()
    wrapper.vm.set(40)
    wrapper.vm.start()
    await nextTick()
    expect(wrapper.vm.getProgress()).toBe(8)
  })

  it('keeps the bar up until nested finishes return to zero', async () => {
    const wrapper = mount(RsLoadingBar, { props: { nesting: true, trickle: false } })
    wrapper.vm.start()
    wrapper.vm.start()
    expect(wrapper.emitted('start')).toEqual([[1], [2]])
    wrapper.vm.finish()
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(true)
    expect(wrapper.vm.isStarted()).toBe(true)
    expect(wrapper.emitted('finish')).toEqual([[1]])
    wrapper.vm.finish()
    vi.advanceTimersByTime(280)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(false)
    expect(wrapper.vm.isStarted()).toBe(false)
  })

  it('skips the flash when finish arrives inside delay', async () => {
    const wrapper = mount(RsLoadingBar, { props: { delay: 500, trickle: false } })
    wrapper.vm.start()
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(false)
    expect(wrapper.vm.isStarted()).toBe(true)
    wrapper.vm.finish()
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(false)
    expect(wrapper.vm.isStarted()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows an error peg and clears it', async () => {
    const wrapper = mount(RsLoadingBar, { props: { trickle: false } })
    wrapper.vm.error()
    await nextTick()
    const bar = wrapper.find('.rs-loading-bar')
    expect(bar.classes()).toContain('rs-loading-bar--error')
    expect(wrapper.emitted('error')).toHaveLength(1)
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--error').exists()).toBe(false)
  })

  it('sets and increments without reaching 100', async () => {
    const wrapper = mount(RsLoadingBar, { props: { trickle: false } })
    wrapper.vm.set(40)
    wrapper.vm.inc(10)
    await nextTick()
    expect(wrapper.vm.getProgress()).toBe(50)
    expect(wrapper.emitted('finish')).toBeUndefined()
    wrapper.vm.inc()
    expect(wrapper.vm.getProgress()).toBe(52)
  })

  it('stops the trickle interval once the ceiling is reached', () => {
    const wrapper = mount(RsLoadingBar)
    wrapper.vm.start()
    for (let i = 0; i < 80; i += 1) vi.advanceTimersByTime(200)
    expect(wrapper.vm.getProgress()).toBe(92)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears trickle and hide timers on unmount', () => {
    const wrapper = mount(RsLoadingBar)
    wrapper.vm.start()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('hides a controlled bar after it reaches 100', async () => {
    const wrapper = mount(RsLoadingBar, { props: { progress: 30 } })
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(true)
    expect(wrapper.vm.getProgress()).toBe(30)
    wrapper.vm.start()
    expect(wrapper.emitted('start')).toBeUndefined()
    await wrapper.setProps({ progress: 100 })
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(true)
    vi.advanceTimersByTime(280)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(false)
  })

  it('cancels the controlled hide when progress drops below 100', async () => {
    const wrapper = mount(RsLoadingBar, { props: { progress: 100 } })
    vi.advanceTimersByTime(50)
    await wrapper.setProps({ progress: 25 })
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(true)
    expect(wrapper.vm.getProgress()).toBe(25)
  })

  it('applies placement, tone, color, and height without a hardcoded default size', () => {
    const wrapper = mount(RsLoadingBar, {
      props: {
        id: 'top-bar',
        progress: 10,
        position: 'bottom',
        attach: 'parent',
        tone: 'info',
        color: 'var(--rs-info)',
        errorColor: 'var(--rs-warning)',
        height: 4,
      },
    })
    const bar = wrapper.find('.rs-loading-bar')
    expect(bar.attributes('id')).toBe('top-bar')
    expect(bar.classes()).toContain('rs-loading-bar--bottom')
    expect(bar.classes()).toContain('rs-loading-bar--parent')
    expect(bar.classes()).toContain('rs-loading-bar--info')
    const style = bar.attributes('style') ?? ''
    expect(style).toContain('--rs-loading-bar-color: var(--rs-info)')
    expect(style).toContain('--rs-loading-bar-error: var(--rs-warning)')
    expect(style).toContain('--rs-loading-bar-size: 4px')
  })

  it('omits aria-valuenow while indeterminate', async () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsLoadingBar, { indeterminate: true, trickle: false }),
      },
    })
    const bar = wrapper.findComponent(RsLoadingBar)
    bar.vm.start()
    await nextTick()
    const el = bar.find('.rs-loading-bar')
    expect(el.classes()).toContain('rs-loading-bar--indeterminate')
    expect(el.attributes('role')).toBe('progressbar')
    expect(el.attributes('aria-valuenow')).toBeUndefined()
    expect(el.attributes('aria-label')).toBe('Loading, progress unknown')
  })

  it('uses locale for the progress name and the error text', async () => {
    const en = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: { default: () => h(RsLoadingBar, { progress: 20 }) },
    })
    expect(en.find('.rs-loading-bar').attributes('aria-label')).toBe('Loading')

    const zh = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: { default: () => h(RsLoadingBar, { trickle: false }) },
    })
    const bar = zh.findComponent(RsLoadingBar)
    bar.vm.error()
    await nextTick()
    expect(bar.find('.rs-loading-bar').attributes('aria-label')).toBe('加载失败')
  })

  it('lets ariaLabel override locale', () => {
    const wrapper = mount(RsLoadingBar, {
      props: { progress: 12, ariaLabel: 'Saving draft' },
    })
    expect(wrapper.find('.rs-loading-bar').attributes('aria-label')).toBe('Saving draft')
  })

  it('no-ops useRsLoadingBar outside a provider', async () => {
    const Probe = defineComponent({
      setup() {
        const api = useRsLoadingBar()
        return () =>
          h(
            'button',
            {
              class: 'go',
              onClick: () => {
                api.start()
                api.finish()
                api.error()
                api.set(10)
                api.inc(1)
              },
            },
            `${api.getProgress()}${api.isStarted() ? 'on' : 'off'}`,
          )
      },
    })
    const wrapper = mount(Probe)
    expect(wrapper.text()).toBe('0off')
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toBe('0off')
  })

  it('drives the nearest bar from useRsLoadingBar', async () => {
    const Probe = defineComponent({
      setup() {
        const api = useRsLoadingBar()
        return () => h('button', { class: 'go', onClick: () => api.start() }, 'go')
      },
    })
    const wrapper = mount(RsLoadingBar, {
      props: { trickle: false },
      slots: { default: () => h(Probe) },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.rs-loading-bar--visible').exists()).toBe(true)
    expect(wrapper.vm.getProgress()).toBe(8)
  })
})
