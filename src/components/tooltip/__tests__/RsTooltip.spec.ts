import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import RsTooltip from '../src/RsTooltip.vue'
import RsTooltipProvider from '../src/RsTooltipProvider.vue'
import { RS_TOOLTIP_POINTER_GRACE_MS, clampTooltipDelay, isKeyboardFocusVisible } from '../src/tooltip-utils'

function mountTooltip(
  template: string,
  props: Record<string, unknown> = {},
) {
  return mount(
    {
      components: { RsTooltip, RsTooltipProvider },
      template: `<RsTooltipProvider :delay-duration="0"><RsTooltip v-bind="props">${template}</RsTooltip></RsTooltipProvider>`,
      data() {
        return { props }
      },
    },
    { attachTo: document.body },
  )
}

describe('RsTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows content on pointer enter', async () => {
    const wrapper = mountTooltip(
      '<button type="button" class="trigger">Hover</button>',
      { content: 'Tooltip text' },
    )
    expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
    await wrapper.find('.trigger').trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(document.body.querySelector('.rs-tooltip__content')).not.toBeNull()
    expect(document.body.textContent).toContain('Tooltip text')
    wrapper.unmount()
  })

  it('does not show when disabled', async () => {
    const wrapper = mountTooltip(
      '<button type="button" class="trigger">Hover</button>',
      { content: 'Hidden', disabled: true },
    )
    await wrapper.find('.trigger').trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
    wrapper.unmount()
  })

  it('does not open on non-keyboard focus when ignoreNonKeyboardFocus is on', async () => {
    const wrapper = mountTooltip(
      '<button type="button" class="trigger">Hover</button>',
      { content: 'Focus tip' },
    )
    try {
      const trigger = wrapper.find('.trigger').element as HTMLButtonElement
      // 模拟 Dialog 关闭回焦：有 focus 但无 :focus-visible（jsdom 对 :focus-visible 不稳定）
      const matchesSpy = vi
        .spyOn(trigger, 'matches')
        .mockImplementation((selectors: string) => !selectors.includes(':focus-visible'))
      trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await vi.runAllTimersAsync()
      await flushPromises()
      expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
      matchesSpy.mockRestore()
    } finally {
      wrapper.unmount()
    }
  })

  it('opens on keyboard-style focus-visible', async () => {
    const wrapper = mountTooltip(
      '<button type="button" class="trigger">Hover</button>',
      { content: 'Keyboard tip' },
    )
    try {
      const trigger = wrapper.find('.trigger').element as HTMLButtonElement
      const matchesSpy = vi
        .spyOn(trigger, 'matches')
        .mockImplementation((selectors: string) => selectors.includes(':focus-visible'))
      trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await vi.runAllTimersAsync()
      await flushPromises()
      expect(document.body.querySelector('.rs-tooltip__content')).not.toBeNull()
      expect(document.body.textContent).toContain('Keyboard tip')
      matchesSpy.mockRestore()
    } finally {
      wrapper.unmount()
    }
  })


  it('renders custom content slot', async () => {
    const wrapper = mount(
      {
        components: { RsTooltip, RsTooltipProvider },
        template: `
          <RsTooltipProvider :delay-duration="0">
            <RsTooltip>
              <button type="button" class="trigger">Hover</button>
              <template #content>
                <span class="custom-tip">Custom body</span>
              </template>
            </RsTooltip>
          </RsTooltipProvider>
        `,
      },
      { attachTo: document.body },
    )
    await wrapper.find('.trigger').trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(document.body.querySelector('.custom-tip')).not.toBeNull()
    wrapper.unmount()
  })

  it('unmounts without leaving tooltip content in body', async () => {
    const wrapper = mountTooltip(
      '<button type="button" class="trigger">Hover</button>',
      { content: 'Cleanup' },
    )
    await wrapper.find('.trigger').trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    wrapper.unmount()
    expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
  })

  it('renders suffix help icon when icon=true', async () => {
    const wrapper = mountTooltip('<span class="field-label">Database</span>', {
      content: 'Initial database hint',
      icon: true,
    })
    expect(wrapper.find('.rs-tooltip__with-icon').exists()).toBe(true)
    expect(wrapper.find('.field-label').exists()).toBe(true)
    const trigger = wrapper.find('.rs-tooltip__icon-trigger')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toBe('Initial database hint')
    expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(document.body.querySelector('.rs-tooltip__content')).not.toBeNull()
    expect(document.body.textContent).toContain('Initial database hint')
    wrapper.unmount()
  })

  it('does not import reka-ui', () => {
    const tooltip = readFileSync(path.resolve('src/components/tooltip/src/RsTooltip.vue'), 'utf8')
    const provider = readFileSync(path.resolve('src/components/tooltip/src/RsTooltipProvider.vue'), 'utf8')
    expect(tooltip).not.toContain('reka-ui')
    expect(provider).not.toContain('reka-ui')
    const wrapper = mount(RsTooltip, {
      props: { content: 'Native' },
      slots: { default: '<button type="button">Tip</button>' },
    })
    expect(wrapper.vm.$options.name).toBe('RsTooltip')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    wrapper.unmount()
  })

  it('points the trigger at the tooltip while open', async () => {
    const wrapper = mountTooltip('<button type="button" class="trigger">Hover</button>', {
      content: 'Described',
    })
    await wrapper.find('.trigger').trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    const trigger = wrapper.find('.trigger').element
    const tip = document.body.querySelector('.rs-tooltip__content')
    expect(tip?.getAttribute('role')).toBe('tooltip')
    expect(trigger.getAttribute('aria-describedby')).toBe(tip?.id)
    wrapper.unmount()
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
  })

  it('closes on Escape and removes listeners', async () => {
    const addWin = vi.spyOn(window, 'addEventListener')
    const removeWin = vi.spyOn(window, 'removeEventListener')
    const addDoc = vi.spyOn(document, 'addEventListener')
    const removeDoc = vi.spyOn(document, 'removeEventListener')
    const wrapper = mountTooltip('<button type="button" class="trigger">Hover</button>', {
      content: 'Dismiss',
    })
    addWin.mockClear()
    removeWin.mockClear()
    addDoc.mockClear()
    removeDoc.mockClear()
    await wrapper.find('.trigger').trigger('pointermove', { pointerType: 'mouse' })
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(document.body.textContent).toContain('Dismiss')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
    wrapper.unmount()
    const added = addWin.mock.calls.filter((call) => call[0] === 'scroll' || call[0] === 'resize' || call[0] === 'keydown')
    const removed = removeWin.mock.calls.filter((call) => call[0] === 'scroll' || call[0] === 'resize' || call[0] === 'keydown')
    expect(added.length).toBeGreaterThan(0)
    expect(removed.length).toBeGreaterThanOrEqual(added.length)
    const docAdded = addDoc.mock.calls.filter((call) => call[0] === 'pointerdown').length
    const docRemoved = removeDoc.mock.calls.filter((call) => call[0] === 'pointerdown').length
    expect(docRemoved).toBeGreaterThanOrEqual(docAdded)
    addWin.mockRestore()
    removeWin.mockRestore()
    addDoc.mockRestore()
    removeDoc.mockRestore()
  })

  it('skips the open delay after another tip just closed', async () => {
    const wrapper = mount(
      {
        components: { RsTooltip, RsTooltipProvider },
        template: `
          <RsTooltipProvider :delay-duration="1000" :skip-delay-duration="500">
            <RsTooltip content="First">
              <button type="button" class="first">A</button>
            </RsTooltip>
            <RsTooltip content="Second">
              <button type="button" class="second">B</button>
            </RsTooltip>
          </RsTooltipProvider>
        `,
      },
      { attachTo: document.body },
    )
    await wrapper.find('.first').trigger('pointermove', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
    expect(document.body.textContent).toContain('First')
    await wrapper.find('.first').trigger('pointerleave', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(RS_TOOLTIP_POINTER_GRACE_MS)
    await flushPromises()
    expect(document.body.textContent).not.toContain('First')
    await wrapper.find('.second').trigger('pointermove', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()
    expect(document.body.textContent).toContain('Second')
    wrapper.unmount()
  })

  it('follows v-model:open and expose open/close', async () => {
    const Host = defineComponent({
      components: { RsTooltip, RsTooltipProvider },
      setup() {
        const open = ref(false)
        const log = ref('')
        const tip = ref<{ open: () => void; close: () => void } | null>(null)
        return { open, log, tip }
      },
      template: `
        <RsTooltipProvider :delay-duration="0">
          <RsTooltip
            ref="tip"
            v-model:open="open"
            content="Controlled"
            @open-change="log = $event ? 'open' : 'closed'"
          >
            <button type="button" class="trigger">Hover</button>
          </RsTooltip>
          <button type="button" class="do-open" @click="tip?.open()">Open</button>
          <button type="button" class="do-close" @click="tip?.close()">Close</button>
          <span class="log">{{ log }}</span>
        </RsTooltipProvider>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('.do-open').trigger('click')
    await nextTick()
    await flushPromises()
    expect(wrapper.find('.log').text()).toBe('open')
    expect(document.body.textContent).toContain('Controlled')
    await wrapper.find('.do-close').trigger('click')
    await flushPromises()
    expect(wrapper.find('.log').text()).toBe('closed')
    expect(document.body.querySelector('.rs-tooltip__content')).toBeNull()
    wrapper.unmount()
  })
})

describe('tooltip-utils', () => {
  it('clamps delay into 0..60000', () => {
    expect(clampTooltipDelay(undefined, 300)).toBe(300)
    expect(clampTooltipDelay(Number.NaN, 300)).toBe(300)
    expect(clampTooltipDelay(-20, 300)).toBe(0)
    expect(clampTooltipDelay(90_000, 300)).toBe(60_000)
  })

  it('ignores non-keyboard focus unless the flag is off', () => {
    const el = document.createElement('button')
    const matches = vi.spyOn(el, 'matches').mockReturnValue(false)
    expect(isKeyboardFocusVisible(el, true)).toBe(false)
    expect(isKeyboardFocusVisible(el, false)).toBe(true)
    matches.mockReturnValue(true)
    expect(isKeyboardFocusVisible(el, true)).toBe(true)
    expect(isKeyboardFocusVisible(null, false)).toBe(false)
  })
})
