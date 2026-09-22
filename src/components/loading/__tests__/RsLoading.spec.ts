import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsLoading from '../src/RsLoading.vue'
import {
  acquireRsLoadingScrollLock,
  clampRsLoadingDuration,
  planRsLoadingVisibility,
  resetRsLoadingScrollLock,
  resolveRsLoadingSkeletonCount,
  resolveRsLoadingTeleportTarget,
  resolveRsLoadingTone,
  RS_LOADING_MAX_MS,
  RS_LOADING_SKELETON_MAX,
} from '../src/loading-utils'

afterEach(() => {
  resetRsLoadingScrollLock()
  document.body.style.overflow = ''
  document.body.style.pointerEvents = ''
  document.documentElement.removeAttribute('aria-busy')
  document.querySelectorAll('.rs-loading, .rs-loading-anchor').forEach((node) => node.remove())
})

describe('RsLoading', () => {
  it('registers the public component name', () => {
    expect(RsLoading.name).toBe('RsLoading')
  })

  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsLoading)
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('renders spinner by default', () => {
    const wrapper = mount(RsLoading)
    expect(wrapper.find('.rs-loading__spinner').exists()).toBe(true)
    expect(wrapper.classes()).toContain('rs-loading')
    expect(wrapper.find('.rs-loading__mark').attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('renders dots variant', () => {
    const wrapper = mount(RsLoading, { props: { variant: 'dots' } })
    expect(wrapper.find('.rs-loading__dots').exists()).toBe(true)
    expect(wrapper.findAll('.rs-loading__dot')).toHaveLength(3)
  })

  it('renders skeleton variant with default line count', () => {
    const wrapper = mount(RsLoading, { props: { variant: 'skeleton' } })
    expect(wrapper.find('.rs-loading__skeleton').exists()).toBe(true)
    expect(wrapper.findAll('.rs-loading__skeleton-line')).toHaveLength(4)
  })

  it('respects skeletonLines prop', () => {
    const wrapper = mount(RsLoading, {
      props: { variant: 'skeleton', skeletonLines: 2 },
    })
    expect(wrapper.findAll('.rs-loading__skeleton-line')).toHaveLength(2)
  })

  it('caps skeleton lines', () => {
    const wrapper = mount(RsLoading, {
      props: { variant: 'skeleton', skeletonLines: 100 },
    })
    expect(wrapper.findAll('.rs-loading__skeleton-line')).toHaveLength(RS_LOADING_SKELETON_MAX)
  })

  it.each(['sm', 'md', 'lg'] as const)('applies %s size class on spinner', (size) => {
    const wrapper = mount(RsLoading, { props: { size } })
    expect(wrapper.find('.rs-loading__spinner').classes()).toContain(`rs-loading__spinner--${size}`)
    expect(wrapper.classes()).toContain(`rs-loading--${size}`)
  })

  it.each(['default', 'primary'] as const)('applies %s tone class on spinner', (tone) => {
    const wrapper = mount(RsLoading, { props: { tone } })
    expect(wrapper.find('.rs-loading__spinner').classes()).toContain(`rs-loading__spinner--${tone}`)
    expect(wrapper.classes()).toContain(`rs-loading--tone-${tone}`)
  })

  it('applies semantic tone on the root', () => {
    const wrapper = mount(RsLoading, { props: { tone: 'danger', variant: 'dots' } })
    expect(wrapper.classes()).toContain('rs-loading--tone-danger')
    expect(wrapper.find('.rs-loading__dot').exists()).toBe(true)
  })

  it('hides root when loading is false', () => {
    const wrapper = mount(RsLoading, { props: { loading: false } })
    expect(wrapper.find('.rs-loading').exists()).toBe(false)
  })

  it('applies block and overlay modifier classes', () => {
    const wrapper = mount(RsLoading, { props: { block: true, overlay: true } })
    expect(wrapper.classes()).toContain('rs-loading--block')
    expect(wrapper.classes()).toContain('rs-loading--overlay')
  })

  it('exposes status role and default en-US aria-label', () => {
    const wrapper = mount(RsLoading)
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Loading')
  })

  it('shows label when showLabel is true', () => {
    const wrapper = mount(RsLoading, { props: { showLabel: true } })
    expect(wrapper.find('.rs-loading__label').text()).toBe('Loading')
  })

  it('uses custom label for visible text and aria-label', () => {
    const wrapper = mount(RsLoading, {
      props: { showLabel: true, label: '正在同步…' },
    })
    expect(wrapper.find('.rs-loading__label').text()).toBe('正在同步…')
    expect(wrapper.attributes('aria-label')).toBe('正在同步…')
  })

  it('uses ariaLabel for the accessible name without replacing visible text', () => {
    const wrapper = mount(RsLoading, {
      props: { showLabel: true, label: 'Syncing', ariaLabel: 'Syncing projects' },
    })
    expect(wrapper.find('.rs-loading__label').text()).toBe('Syncing')
    expect(wrapper.attributes('aria-label')).toBe('Syncing projects')
  })

  it('uses zh-CN copy inside RsConfigProvider', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: {
        default: () => h(RsLoading, { showLabel: true }),
      },
    })
    const loading = wrapper.find('.rs-loading')
    expect(loading.attributes('aria-label')).toBe('加载中')
    expect(loading.find('.rs-loading__label').text()).toBe('加载中')
  })

  it('uses en-US aria-label inside RsConfigProvider', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsLoading, { showLabel: true }),
      },
    })
    const loading = wrapper.find('.rs-loading')
    expect(loading.attributes('aria-label')).toBe('Loading')
    expect(loading.find('.rs-loading__label').text()).toBe('Loading')
  })

  it('covers slotted content and keeps it mounted when loading ends', async () => {
    const wrapper = mount(RsLoading, {
      props: { overlay: true, blur: true },
      slots: { default: '<p class="body">Projects</p>' },
    })
    expect(wrapper.find('.rs-loading-host').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.rs-loading-host--blur').exists()).toBe(true)
    expect(wrapper.find('.body').text()).toBe('Projects')
    expect(wrapper.find('.rs-loading--overlay').exists()).toBe(true)
    const inert = wrapper.find('.rs-loading-host__content').attributes('inert')
    expect(inert === '' || inert === 'true').toBe(true)

    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.body').text()).toBe('Projects')
    expect(wrapper.find('.rs-loading').exists()).toBe(false)
    expect(wrapper.find('.rs-loading-host').attributes('aria-busy')).toBe('false')
    expect(wrapper.find('.rs-loading-host__content').attributes('inert')).toBeUndefined()
  })

  it('renders a custom indicator instead of the spinner', () => {
    const wrapper = mount(RsLoading, {
      slots: { indicator: '<span class="custom-mark">*</span>' },
    })
    expect(wrapper.find('.custom-mark').exists()).toBe(true)
    expect(wrapper.find('.rs-loading__spinner').exists()).toBe(false)
  })

  it('does not call getContainer until fullscreen', () => {
    const getContainer = vi.fn(() => document.body)
    const wrapper = mount(RsLoading, { props: { getContainer } })
    expect(getContainer).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('teleports fullscreen indicator to getContainer and removes it on unmount', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const wrapper = mount(RsLoading, {
      props: {
        fullscreen: true,
        id: 'page-loading',
        getContainer: () => host,
      },
    })
    const indicator = host.querySelector('.rs-loading--fullscreen')
    expect(indicator).toBeTruthy()
    expect(indicator?.id).toBe('page-loading')
    wrapper.unmount()
    expect(host.querySelector('.rs-loading')).toBeNull()
    host.remove()
  })

  it('locks body scroll only while fullscreen lock is shown, then restores', () => {
    document.body.style.overflow = 'scroll'
    const first = mount(RsLoading, { props: { fullscreen: true, lock: true } })
    const second = mount(RsLoading, { props: { fullscreen: true, lock: true } })
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.pointerEvents).toBe('none')
    expect(document.documentElement.getAttribute('aria-busy')).toBe('true')
    first.unmount()
    expect(document.body.style.overflow).toBe('hidden')
    second.unmount()
    expect(document.body.style.overflow).toBe('scroll')
    expect(document.body.style.pointerEvents).toBe('')
    expect(document.documentElement.hasAttribute('aria-busy')).toBe(false)
  })

  it('does not lock scroll without fullscreen', () => {
    const wrapper = mount(RsLoading, { props: { lock: true } })
    expect(document.body.style.overflow).not.toBe('hidden')
    wrapper.unmount()
  })

  it('release of the scroll lock is idempotent', () => {
    document.body.style.overflow = 'auto'
    const release = acquireRsLoadingScrollLock()
    expect(document.body.style.overflow).toBe('hidden')
    release()
    release()
    expect(document.body.style.overflow).toBe('auto')
  })
})

describe('RsLoading timers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for delay, then clears the timer on unmount', () => {
    vi.useFakeTimers()
    const wrapper = mount(RsLoading, { props: { delay: 400, loading: true } })
    expect(wrapper.find('.rs-loading').exists()).toBe(false)
    const pending = vi.getTimerCount()
    expect(pending).toBeGreaterThan(0)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows after the delay elapses', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsLoading, { props: { delay: 300 } })
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('.rs-loading__spinner').exists()).toBe(true)
    wrapper.unmount()
  })

  it('skips the indicator when loading ends before delay', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsLoading, { props: { delay: 300, loading: true } })
    await wrapper.setProps({ loading: false })
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('.rs-loading').exists()).toBe(false)
    wrapper.unmount()
  })

  it('keeps the indicator until minDuration elapses', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RsLoading, { props: { minDuration: 500, loading: true } })
    expect(wrapper.find('.rs-loading').exists()).toBe(true)
    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.rs-loading').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.find('.rs-loading').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('loading-utils', () => {
  it('clamps durations and skeleton counts', () => {
    expect(clampRsLoadingDuration(undefined)).toBe(0)
    expect(clampRsLoadingDuration(-1)).toBe(0)
    expect(clampRsLoadingDuration(Number.POSITIVE_INFINITY)).toBe(0)
    expect(clampRsLoadingDuration(RS_LOADING_MAX_MS + 5)).toBe(RS_LOADING_MAX_MS)
    expect(resolveRsLoadingSkeletonCount(undefined)).toBe(4)
    expect(resolveRsLoadingSkeletonCount(0)).toBe(1)
    expect(resolveRsLoadingSkeletonCount(3.9)).toBe(3)
    expect(resolveRsLoadingSkeletonCount(100)).toBe(RS_LOADING_SKELETON_MAX)
    expect(resolveRsLoadingTone('nope')).toBe('primary')
    expect(resolveRsLoadingTone('default')).toBe('default')
  })

  it('plans show, delay, hide, and min duration', () => {
    expect(
      planRsLoadingVisibility({
        loading: true,
        visible: false,
        delayMs: 0,
        minDurationMs: 0,
        shownAt: null,
        now: 10,
      }),
    ).toEqual({ action: 'show', shownAt: 10 })

    expect(
      planRsLoadingVisibility({
        loading: true,
        visible: false,
        delayMs: 200,
        minDurationMs: 0,
        shownAt: null,
        now: 10,
      }),
    ).toEqual({ action: 'wait', ms: 200, then: 'show' })

    expect(
      planRsLoadingVisibility({
        loading: false,
        visible: false,
        delayMs: 200,
        minDurationMs: 0,
        shownAt: null,
        now: 10,
      }).action,
    ).toBe('idle')

    expect(
      planRsLoadingVisibility({
        loading: false,
        visible: true,
        delayMs: 0,
        minDurationMs: 400,
        shownAt: 100,
        now: 250,
      }),
    ).toEqual({ action: 'wait', ms: 250, then: 'hide' })

    expect(
      planRsLoadingVisibility({
        loading: true,
        visible: true,
        delayMs: 0,
        minDurationMs: 400,
        shownAt: 100,
        now: 250,
      }).action,
    ).toBe('keep')
  })

  it('resolves a teleport target without assuming window', () => {
    const host = document.createElement('div')
    expect(resolveRsLoadingTeleportTarget(false, () => host)).toBe('body')
    expect(resolveRsLoadingTeleportTarget(true, () => host)).toBe(host)
    expect(resolveRsLoadingTeleportTarget(true, () => '  #app  ')).toBe('  #app  ')
    expect(resolveRsLoadingTeleportTarget(true, () => '')).toBe('body')
    expect(resolveRsLoadingTeleportTarget(true, () => null)).toBe('body')
    expect(
      resolveRsLoadingTeleportTarget(true, () => {
        throw new Error('missing')
      }),
    ).toBe('body')
  })
})
