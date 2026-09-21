import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import RsScrollbar from '../src/RsScrollbar.vue'
import {
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  isRsScrollbarBarVisible,
  resolveRsScrollbarOrientation,
  resolveRsScrollbarType,
  resolveScrollbarSize,
  showsRsScrollbarAxis,
} from '../src/scrollbar-utils'

function stubViewportOverflow(el: HTMLElement, box: number, content: number) {
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: box })
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: content })
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: box })
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: box })
}

async function flushFrame() {
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
      return
    }
    setTimeout(resolve, 20)
  })
  await nextTick()
}

describe('RsScrollbar', () => {
  it('registers the public component name', () => {
    expect(RsScrollbar.name).toBe('RsScrollbar')
  })

  it('renders slot content on a native viewport', () => {
    const wrapper = mount(RsScrollbar, {
      slots: {
        default: '<div class="slot-content">滚动内容</div>',
      },
    })

    expect(wrapper.find('.slot-content').exists()).toBe(true)
    expect(wrapper.classes()).toContain('rs-scrollbar')
    expect(wrapper.find('.rs-scrollbar__viewport').exists()).toBe(true)
    expect(wrapper.find('.rs-scrollbar__content').exists()).toBe(true)
    expect(wrapper.find('.rs-scrollbar__viewport').element.tagName).toBe('SECTION')
    expect(wrapper.find('.rs-scrollbar__viewport').attributes('aria-label')).toBeTruthy()
    expect(wrapper.find('.rs-scrollbar__viewport').attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('.rs-scrollbar__bar--vertical').attributes('aria-hidden')).toBe('true')
  })

  it('applies root sizing props', () => {
    const wrapper = mount(RsScrollbar, {
      props: {
        height: '10rem',
        maxHeight: '16rem',
        minHeight: '6rem',
      },
    })

    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('height: 10rem')
    expect(style).toContain('max-height: 16rem')
    expect(style).toContain('min-height: 6rem')
  })

  it('renders only the vertical bar when orientation is vertical', () => {
    const wrapper = mount(RsScrollbar, {
      props: { orientation: 'vertical' },
    })
    const bars = wrapper.findAll('.rs-scrollbar__bar')
    expect(bars).toHaveLength(1)
    expect(bars[0]?.attributes('data-orientation')).toBe('vertical')
    expect(wrapper.find('.rs-scrollbar__corner').exists()).toBe(false)
  })

  it('renders both bars by default', () => {
    const wrapper = mount(RsScrollbar)
    expect(wrapper.findAll('.rs-scrollbar__bar')).toHaveLength(2)
    expect(wrapper.find('.rs-scrollbar__bar--vertical').exists()).toBe(true)
    expect(wrapper.find('.rs-scrollbar__bar--horizontal').exists()).toBe(true)
    expect(wrapper.find('.rs-scrollbar__corner').exists()).toBe(true)
  })

  it('keeps type and hide delay as root attributes', () => {
    const wrapper = mount(RsScrollbar, {
      props: {
        type: 'always',
        scrollHideDelay: 400,
      },
    })
    expect(wrapper.attributes('data-type')).toBe('always')
    expect(wrapper.attributes('data-orientation')).toBe('both')
  })

  it('restores body user-select when pointer capture is lost', async () => {
    const previous = document.body.style.webkitUserSelect
    const wrapper = mount(RsScrollbar, {
      slots: { default: '<p>日志</p>' },
    })
    const bar = wrapper.find('.rs-scrollbar__bar--vertical').element
    bar.dispatchEvent(
      new PointerEvent('pointerdown', {
        button: 0,
        clientX: 0,
        clientY: 8,
        pointerId: 1,
        bubbles: true,
        cancelable: true,
      }),
    )
    expect(document.body.style.webkitUserSelect).toBe('none')
    bar.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }))
    expect(document.body.style.webkitUserSelect).toBe(previous)
    wrapper.unmount()
  })

  it('does not wipe host user-select when unmounting idle', () => {
    document.body.style.webkitUserSelect = 'text'
    const wrapper = mount(RsScrollbar, {
      slots: { default: '<p>日志</p>' },
    })
    wrapper.unmount()
    expect(document.body.style.webkitUserSelect).toBe('text')
    document.body.style.webkitUserSelect = ''
  })

  it('syncs auto-bar visibility after scroll when the box did not resize', async () => {
    const wrapper = mount(RsScrollbar, {
      props: { type: 'auto', orientation: 'vertical', height: '8rem' },
      slots: { default: '<p>row</p>' },
    })
    const viewport = wrapper.find('.rs-scrollbar__viewport').element as HTMLElement
    stubViewportOverflow(viewport, 80, 240)
    viewport.dispatchEvent(new Event('scroll'))
    await flushFrame()
    expect(wrapper.find('.rs-scrollbar__bar--vertical').attributes('data-state')).toBe('visible')
    wrapper.unmount()
  })

  it('syncs auto-bar visibility after a slot update', async () => {
    const Host = defineComponent({
      components: { RsScrollbar },
      data: () => ({ rows: 1 }),
      template:
        '<RsScrollbar type="auto" orientation="vertical" height="8rem"><p v-for="n in rows" :key="n">{{ n }}</p></RsScrollbar>',
    })
    const wrapper = mount(Host)
    const viewport = wrapper.find('.rs-scrollbar__viewport').element as HTMLElement
    stubViewportOverflow(viewport, 80, 80)
    await flushFrame()
    expect(wrapper.find('.rs-scrollbar__bar--vertical').attributes('data-state')).toBe('hidden')
    stubViewportOverflow(viewport, 80, 320)
    wrapper.vm.rows = 12
    await nextTick()
    await flushFrame()
    expect(wrapper.find('.rs-scrollbar__bar--vertical').attributes('data-state')).toBe('visible')
    wrapper.unmount()
  })

  it('exposes scrollTop, scrollTopLeft, and getViewport', () => {
    const wrapper = mount(RsScrollbar, {
      slots: { default: '<p>日志</p>' },
    })
    const exposed = wrapper.vm as unknown as {
      scrollTop: () => void
      scrollTopLeft: () => void
      getViewport: () => HTMLElement | undefined
    }
    expect(typeof exposed.scrollTop).toBe('function')
    expect(typeof exposed.scrollTopLeft).toBe('function')
    exposed.scrollTop()
    exposed.scrollTopLeft()
    const viewport = exposed.getViewport()
    expect(viewport?.classList.contains('rs-scrollbar__viewport')).toBe(true)
  })
})

describe('scrollbar-utils', () => {
  it('resolves type, orientation, and css size', () => {
    expect(resolveRsScrollbarType('always')).toBe('always')
    expect(resolveRsScrollbarType(undefined)).toBe('hover')
    expect(resolveRsScrollbarType('nope' as never)).toBe('hover')
    expect(resolveRsScrollbarOrientation('vertical')).toBe('vertical')
    expect(resolveRsScrollbarOrientation(undefined)).toBe('both')
    expect(resolveScrollbarSize(24)).toBe('24px')
    expect(resolveScrollbarSize('10rem')).toBe('10rem')
    expect(resolveScrollbarSize(undefined)).toBeUndefined()
  })

  it('decides which axis to render', () => {
    expect(showsRsScrollbarAxis('both', 'y')).toBe(true)
    expect(showsRsScrollbarAxis('vertical', 'x')).toBe(false)
    expect(showsRsScrollbarAxis('horizontal', 'x')).toBe(true)
  })

  it('computes thumb metrics and visibility', () => {
    expect(getThumbRatio(100, 200)).toBe(0.5)
    expect(getThumbRatio(100, 0)).toBe(0)
    const sizes = {
      content: 400,
      viewport: 100,
      scrollbar: { size: 100, paddingStart: 2, paddingEnd: 2 },
    }
    expect(getThumbSize(sizes)).toBe(24)
    expect(getThumbOffsetFromScroll(0, sizes)).toBe(0)
    expect(getThumbOffsetFromScroll(300, sizes)).toBe(72)
    expect(
      isRsScrollbarBarVisible({
        type: 'hover',
        overflowing: true,
        hovering: false,
        scrolling: false,
      }),
    ).toBe(false)
    expect(
      isRsScrollbarBarVisible({
        type: 'always',
        overflowing: false,
        hovering: false,
        scrolling: false,
      }),
    ).toBe(true)
    expect(
      isRsScrollbarBarVisible({
        type: 'scroll',
        overflowing: true,
        hovering: false,
        scrolling: false,
        interacting: true,
      }),
    ).toBe(true)
  })
})
