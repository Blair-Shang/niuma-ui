import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsToaster from '../src/RsToaster.vue'
import { RS_TOAST_DEFAULT_POSITION } from '../../_shared/src/overlay-utils'
import { useRsToast } from '../../../composables/useRsToast'
import { resetRsToastStore, rsToasts } from '../src/toast-store'
import {
  RS_TOAST_LEAVE_MS,
  RS_TOAST_MAX,
  clampVisibleToasts,
  matchToastHotkey,
  resolveRsToastDuration,
  shouldArmToastTimer,
  trimToastList,
} from '../src/toast-utils'

describe('toast-utils', () => {
  it('keeps the previous default duration and treats 0 as sticky', () => {
    expect(resolveRsToastDuration(undefined, 4000)).toBe(4000)
    expect(resolveRsToastDuration(0, 4000)).toBe(Number.POSITIVE_INFINITY)
    expect(resolveRsToastDuration(1200, 4000)).toBe(1200)
    expect(shouldArmToastTimer(Number.POSITIVE_INFINITY, true)).toBe(false)
    expect(shouldArmToastTimer(4000, false)).toBe(false)
  })

  it('caps the visible stack and the memory queue', () => {
    expect(clampVisibleToasts(undefined)).toBe(3)
    expect(clampVisibleToasts(0)).toBe(3)
    expect(clampVisibleToasts(99)).toBe(RS_TOAST_MAX)
    expect(trimToastList(['a', 'b', 'c'], 2)).toEqual(['a', 'b'])
  })

  it('matches alt+t and ignores a bare key', () => {
    const alt = new KeyboardEvent('keydown', { key: 't', altKey: true })
    const plain = new KeyboardEvent('keydown', { key: 't' })
    expect(matchToastHotkey(alt, 'alt+t')).toBe(true)
    expect(matchToastHotkey(plain, 'alt+t')).toBe(false)
    expect(matchToastHotkey(alt, '')).toBe(false)
  })
})

describe('RsToaster', () => {
  afterEach(() => {
    resetRsToastStore()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renders a native region and does not import reka-ui or vue-sonner', async () => {
    const toaster = readFileSync('src/components/toaster/src/RsToaster.vue', 'utf8')
    const api = readFileSync('src/composables/useRsToast.ts', 'utf8')
    const store = readFileSync('src/components/toaster/src/toast-store.ts', 'utf8')
    const styles = readFileSync('src/styles/index.css', 'utf8')
    for (const source of [toaster, api, store, styles]) {
      expect(source).not.toContain('reka-ui')
      expect(source).not.toContain('vue-sonner')
    }
    const wrapper = mount(RsToaster, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.vm.$options.name).toBe('RsToaster')
    const region = document.body.querySelector('.rs-toaster')
    expect(region?.getAttribute('role')).toBe('region')
    expect(region?.getAttribute('data-position')).toBe(RS_TOAST_DEFAULT_POSITION)
    wrapper.unmount()
  })

  it('defaults closeButton, richColors, expand and duration', () => {
    const wrapper = mount(RsToaster)
    expect(wrapper.props('position')).toBe(RS_TOAST_DEFAULT_POSITION)
    expect(wrapper.props('closeButton')).toBe(true)
    expect(wrapper.props('richColors')).toBe(false)
    expect(wrapper.props('expand')).toBe(true)
    expect(wrapper.props('duration')).toBe(4000)
    wrapper.unmount()
  })

  it('accepts custom position and removes the hotkey listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(RsToaster, {
      props: { position: 'bottom-right', closeButton: false, richColors: true, hotkey: 'alt+t' },
      attachTo: document.body,
    })
    expect(wrapper.props('position')).toBe('bottom-right')
    expect(document.body.querySelector('.rs-toaster')?.getAttribute('data-position')).toBe('bottom-right')
    expect(add.mock.calls.some((call) => call[0] === 'keydown')).toBe(true)
    wrapper.unmount()
    expect(remove.mock.calls.some((call) => call[0] === 'keydown')).toBe(true)
    add.mockRestore()
    remove.mockRestore()
  })

  it('does not register a hotkey listener when hotkey is empty', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const wrapper = mount(RsToaster, { props: { hotkey: '' }, attachTo: document.body })
    expect(add.mock.calls.some((call) => call[0] === 'keydown')).toBe(false)
    wrapper.unmount()
    add.mockRestore()
  })
})

describe('useRsToast', () => {
  afterEach(() => {
    resetRsToastStore()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  function mountHost() {
    return mount(RsToaster, { attachTo: document.body })
  }

  it.each(['success', 'error', 'info', 'warning'] as const)(
    'shows %s toast with semantic class',
    async (type) => {
      const wrapper = mountHost()
      const api = useRsToast()
      api[type](`${type} 消息`)
      await flushPromises()
      const toastEl = document.body.querySelector(`.rs-toast--${type}`)
      expect(toastEl?.textContent).toContain(`${type} 消息`)
      expect(toastEl?.getAttribute('role')).toBe(type === 'error' ? 'alert' : 'status')
      wrapper.unmount()
    },
  )

  it('shows title and description', async () => {
    const wrapper = mountHost()
    const { success } = useRsToast()
    success({
      title: '保存成功',
      description: '更改已同步到云端。',
    })
    await flushPromises()
    const root = document.body.querySelector('.rs-toast--success')
    expect(root?.querySelector('.rs-toast__title')?.textContent).toBe('保存成功')
    expect(root?.querySelector('.rs-toast__description')?.textContent).toBe('更改已同步到云端。')
    wrapper.unmount()
  })

  it('accepts string shorthand', async () => {
    const wrapper = mountHost()
    const { info } = useRsToast()
    info('简短提示')
    await flushPromises()
    expect(document.body.querySelector('.rs-toast--info')?.textContent).toContain('简短提示')
    wrapper.unmount()
  })

  it('dismiss removes visible toasts and clears timers', async () => {
    vi.useFakeTimers()
    const wrapper = mountHost()
    const { success, dismiss } = useRsToast()
    success('待关闭')
    await flushPromises()
    expect(document.body.querySelector('.rs-toast[data-visible="true"]')).toBeTruthy()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    dismiss()
    await flushPromises()
    expect(document.body.querySelector('.rs-toast[data-visible="true"]')).toBeFalsy()
    await vi.advanceTimersByTimeAsync(RS_TOAST_LEAVE_MS)
    expect(document.body.querySelector('.rs-toast')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    wrapper.unmount()
  })

  it('dismisses one id and leaves the other', async () => {
    vi.useFakeTimers()
    const wrapper = mountHost()
    const { success, dismiss } = useRsToast()
    const first = success({ title: '先来', duration: 0 })
    success({ title: '留下', duration: 0 })
    await flushPromises()
    dismiss(first)
    await vi.advanceTimersByTimeAsync(RS_TOAST_LEAVE_MS)
    expect(document.body.textContent).not.toContain('先来')
    expect(document.body.textContent).toContain('留下')
    wrapper.unmount()
  })

  it('pauses while the pointer is over the stack', async () => {
    vi.useFakeTimers()
    const wrapper = mountHost()
    useRsToast().info({ title: '保持', duration: 1000 })
    await flushPromises()
    const viewport = document.body.querySelector('.rs-toaster__viewport') as HTMLElement
    viewport.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1500)
    expect(document.body.querySelector('.rs-toast[data-visible="true"]')?.textContent).toContain('保持')
    viewport.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000 + RS_TOAST_LEAVE_MS)
    expect(document.body.querySelector('.rs-toast')).toBeNull()
    wrapper.unmount()
  })

  it('runs the action and then dismisses', async () => {
    vi.useFakeTimers()
    const wrapper = mountHost()
    const clicks: string[] = []
    useRsToast().success({
      title: '已保存',
      duration: 0,
      action: { label: 'Undo', onClick: () => clicks.push('undo') },
    })
    await flushPromises()
    const button = document.body.querySelector('.rs-toast__action') as HTMLButtonElement
    button.click()
    expect(clicks).toEqual(['undo'])
    await vi.advanceTimersByTimeAsync(RS_TOAST_LEAVE_MS)
    expect(document.body.querySelector('.rs-toast')).toBeNull()
    wrapper.unmount()
  })

  it('places a single toast on the requested corner', async () => {
    const wrapper = mountHost()
    useRsToast().info({ title: '角落', position: 'bottom-right', duration: 0 })
    await flushPromises()
    expect(document.body.querySelector('.rs-toaster__viewport--bottom-right')).toBeTruthy()
    wrapper.unmount()
  })

  it('updates a promise toast from loading to success or error', async () => {
    const wrapper = mountHost()
    const api = useRsToast()
    let resolveOk: (value: string) => void = () => {}
    const ok = new Promise<string>((resolve) => {
      resolveOk = resolve
    })
    api.promise(ok, { loading: 'Saving', success: 'Saved', error: 'Failed' })
    await flushPromises()
    expect(document.body.querySelector('.rs-toast--loading')?.textContent).toContain('Saving')
    resolveOk('done')
    await flushPromises()
    expect(document.body.querySelector('.rs-toast--success')?.textContent).toContain('Saved')

    const failed = Promise.reject(new Error('nope'))
    api.promise(failed, { loading: 'Saving', error: (error: unknown) => (error instanceof Error ? error.message : 'Failed') })
    await flushPromises()
    expect(document.body.textContent).toContain('nope')
    wrapper.unmount()
  })

  it('keeps sticky toasts and caps the queue', async () => {
    vi.useFakeTimers()
    const wrapper = mountHost()
    const api = useRsToast()
    api.loading('处理中')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(document.body.querySelector('.rs-toast--loading')?.textContent).toContain('处理中')
    for (let index = 0; index < RS_TOAST_MAX + 4; index += 1) {
      api.message({ title: `n${index}`, duration: 0 })
    }
    expect(rsToasts.value.length).toBeLessThanOrEqual(RS_TOAST_MAX)
    wrapper.unmount()
  })

  it('localizes the close button from the provider', async () => {
    const Root = defineComponent({
      components: { RsConfigProvider, RsToaster },
      template: `<RsConfigProvider locale="en-US"><RsToaster /></RsConfigProvider>`,
    })
    const wrapper = mount(Root, { attachTo: document.body })
    useRsToast().success('Saved')
    await flushPromises()
    expect(document.body.querySelector('.rs-toast__close')?.getAttribute('aria-label')).toBe(
      'Dismiss notification',
    )
    wrapper.unmount()
  })

  it('removes the visibility listener after the queue drains', async () => {
    vi.useFakeTimers()
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = mountHost()
    useRsToast().success({ title: '闪过', duration: 500 })
    await flushPromises()
    expect(add.mock.calls.some((call) => call[0] === 'visibilitychange')).toBe(true)
    await vi.advanceTimersByTimeAsync(500 + RS_TOAST_LEAVE_MS)
    expect(remove.mock.calls.some((call) => call[0] === 'visibilitychange')).toBe(true)
    wrapper.unmount()
    add.mockRestore()
    remove.mockRestore()
  })
})
