import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsVirtualList from '../src/RsVirtualList.vue'
import {
  axisMax,
  buildVirtualMetrics,
  capExtent,
  contentToScroll,
  detectRtlScrollType,
  findIndexAtOffset,
  normalizeOverscan,
  readHorizontalOffset,
  resetRtlScrollTypeCache,
  resolveAlignedOffset,
  resolveItemSize,
  resolveVirtualListHeight,
  resolveVirtualListKeyIndex,
  resolveVisibleRange,
  scrollToContent,
  windowOrigin,
  writeHorizontalOffset,
} from '../src/virtual-list-utils'

describe('virtual-list-utils', () => {
  it('resolves item size from number or function', () => {
    expect(resolveItemSize(32)).toBe(32)
    expect(resolveItemSize((index) => index * 10 + 20, 2)).toBe(40)
    expect(resolveItemSize('auto')).toBe(32)
  })

  it('resolves list height', () => {
    expect(resolveVirtualListHeight(240)).toBe('240px')
    expect(resolveVirtualListHeight('50%')).toBe('50%')
    expect(resolveVirtualListHeight(0)).toBeUndefined()
  })

  it('keeps a fixed-size window in constant time', () => {
    const metrics = buildVirtualMetrics(100_000, 32)
    expect(metrics.fixed).toBe(32)
    expect(metrics.total).toBe(3_200_000)
    expect(metrics.extent).toBe(3_200_000)
    expect(metrics.offsetAt(10)).toBe(320)
    const range = resolveVisibleRange(100_000, 320, 200, 4, metrics)
    expect(range.start).toBe(6)
    expect(range.end).toBe(6 + Math.ceil(200 / 32) + 8)
  })

  it('sums variable sizes and finds the index by binary search', () => {
    const metrics = buildVirtualMetrics(5, (index) => (index === 1 ? 80 : 20))
    expect(metrics.fixed).toBeNull()
    expect(metrics.offsetAt(2)).toBe(100)
    expect(metrics.total).toBe(20 + 80 + 20 + 20 + 20)
    expect(findIndexAtOffset(5, 100, metrics)).toBe(2)
    expect(findIndexAtOffset(5, 99, metrics)).toBe(1)
  })

  it('compresses the scrollbar past the extent cap without changing short lists', () => {
    expect(capExtent(100)).toBe(100)
    expect(capExtent(9_000_000)).toBe(8_000_000)
    const total = 16_000_000
    const viewport = 200
    const extent = capExtent(total)
    expect(contentToScroll(0, total, viewport, extent)).toBe(0)
    expect(contentToScroll(axisMax(total, viewport), total, viewport, extent)).toBe(axisMax(extent, viewport))
    expect(scrollToContent(0, total, viewport, total)).toBe(0)
    expect(contentToScroll(1920, 4000, 200, 4000)).toBe(1920)
    expect(windowOrigin(1920, 1920, 2000)).toBe(2000)
  })

  it('normalizes horizontal scroll offsets', () => {
    expect(readHorizontalOffset(40, 100, false, 'default')).toBe(40)
    expect(readHorizontalOffset(-40, 100, true, 'negative')).toBe(40)
    expect(writeHorizontalOffset(40, 100, true, 'negative')).toBe(-40)
    expect(readHorizontalOffset(60, 100, true, 'reverse')).toBe(40)
    expect(writeHorizontalOffset(40, 100, true, 'reverse')).toBe(60)
  })

  it('moves the active index from keys, and swaps horizontal arrows in RTL', () => {
    expect(normalizeOverscan(Number.NaN)).toBe(4)
    expect(resolveVirtualListKeyIndex({
      key: 'ArrowDown',
      index: 1,
      count: 5,
      orientation: 'vertical',
      rtl: false,
      pageSize: 3,
    })).toBe(2)
    expect(resolveVirtualListKeyIndex({
      key: 'ArrowLeft',
      index: 1,
      count: 5,
      orientation: 'horizontal',
      rtl: true,
      pageSize: 3,
    })).toBe(2)
    expect(resolveVirtualListKeyIndex({
      key: 'End',
      index: 0,
      count: 5,
      orientation: 'vertical',
      rtl: false,
      pageSize: 3,
    })).toBe(4)
  })

  it('centers an index unless nearest is already visible', () => {
    const metrics = buildVirtualMetrics(100, 40)
    const centered = resolveAlignedOffset({
      index: 50,
      align: 'center',
      count: 100,
      viewport: 200,
      contentOffset: 0,
      total: metrics.total,
      offsetAt: metrics.offsetAt,
      sizeAt: metrics.sizeAt,
    })
    expect(centered).toBe(1920)
    expect(resolveAlignedOffset({
      index: 0,
      align: 'nearest',
      count: 100,
      viewport: 200,
      contentOffset: 0,
      total: metrics.total,
      offsetAt: metrics.offsetAt,
      sizeAt: metrics.sizeAt,
    })).toBeNull()
  })

  it('detects RTL scroll type without leaving a probe node', () => {
    resetRtlScrollTypeCache()
    const before = document.body.childElementCount
    const type = detectRtlScrollType()
    expect(['default', 'negative', 'reverse']).toContain(type)
    expect(document.body.childElementCount).toBe(before)
    expect(detectRtlScrollType()).toBe(type)
    resetRtlScrollTypeCache()
  })
})

describe('RsVirtualList', () => {
  const items = Array.from({ length: 500 }, (_, index) => `Row ${index}`)

  it('registers the public component name and does not import reka-ui', () => {
    expect(RsVirtualList.name).toBe('RsVirtualList')
    const source = readFileSync('src/components/virtual-list/src/RsVirtualList.vue', 'utf8')
    const utils = readFileSync('src/components/virtual-list/src/virtual-list-utils.ts', 'utf8')
    expect(source).not.toContain('reka-ui')
    expect(utils).not.toContain('reka-ui')
    const wrapper = mount(RsVirtualList, { props: { items: ['A'], height: 40, itemSize: 32 } })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
  })

  it('renders subset of items for large lists', () => {
    const wrapper = mount(RsVirtualList, {
      props: { items, height: 200, itemSize: 32 },
      slots: {
        default: `<div class="item">{{ item }}</div>`,
      },
    })
    expect(wrapper.findAll('.item').length).toBeLessThan(items.length)
  })

  it('passes index to default slot', () => {
    const wrapper = mount(RsVirtualList, {
      props: { items: ['A', 'B', 'C'], height: 96, itemSize: 32 },
      slots: {
        default: `<div class="cell">{{ index }}-{{ item }}</div>`,
      },
    })
    expect(wrapper.text()).toContain('0-A')
  })

  it('marks active row with activeIndex', () => {
    const wrapper = mount(RsVirtualList, {
      props: { items: ['A', 'B', 'C', 'D'], height: 128, itemSize: 32, activeIndex: 2 },
      slots: {
        default: `<div class="cell">{{ index }}</div>`,
      },
    })
    expect(wrapper.find('.rs-virtual-list__item--active').exists()).toBe(true)
    expect(wrapper.find('.rs-virtual-list__item--active').text()).toBe('2')
  })

  it('scrolls active row into view on mount', async () => {
    const rows = Array.from({ length: 100 }, (_, index) => `Row ${index}`)
    const wrapper = mount(RsVirtualList, {
      props: { items: rows, height: 200, itemSize: 40, activeIndex: 50 },
      slots: {
        default: `<div class="cell">{{ index }}</div>`,
      },
      attachTo: document.body,
    })
    const listEl = wrapper.find('.rs-virtual-list').element as HTMLElement
    Object.defineProperty(listEl, 'clientHeight', { configurable: true, value: 200 })
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(listEl.scrollTop).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('applies radius none as CSS variable', () => {
    const wrapper = mount(RsVirtualList, {
      props: { items: ['A'], height: 64, itemSize: 32, radius: 'none' },
    })
    const el = wrapper.find('.rs-virtual-list').element as HTMLElement
    expect(el.style.getPropertyValue('--rs-virtual-list-radius')).toBe('0')
  })

  it('keeps a parent role and renders variable row heights', () => {
    const wrapper = mount(RsVirtualList, {
      props: {
        items: ['A', 'B', 'C'],
        height: 120,
        itemSize: (index: number) => (index === 1 ? 48 : 24),
      },
      attrs: { role: 'list' },
    })
    expect(wrapper.attributes('role')).toBe('list')
    const rows = wrapper.findAll('.rs-virtual-list__item')
    expect(rows[0]?.attributes('style')).toContain('height: 24px')
    expect(rows[1]?.attributes('style')).toContain('height: 48px')
  })

  it('emits the native scroll event and a row change', async () => {
    const wrapper = mount(RsVirtualList, {
      props: { items: ['A', 'B', 'C'], height: 96, itemSize: 32 },
    })
    await wrapper.find('.rs-virtual-list').trigger('scroll')
    const payload = wrapper.emitted('scroll')?.[0]?.[0]
    expect(payload).toBeInstanceOf(Event)
    await wrapper.findAll('.rs-virtual-list__item')[1]?.trigger('click')
    expect(wrapper.emitted('change')?.[0]).toEqual([1, 'B'])
  })

  it('moves the active option from the keyboard when enabled', async () => {
    const wrapper = mount(RsVirtualList, {
      props: { items: ['A', 'B', 'C'], height: 96, itemSize: 32, keyboard: true, activeIndex: 0 },
    })
    expect(wrapper.attributes('role')).toBe('listbox')
    await wrapper.find('.rs-virtual-list').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:activeIndex')?.[0]).toEqual([1])
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe(1)
  })

  it('uses locale empty copy', () => {
    const en = mount(RsVirtualList, { props: { items: [], height: 80, itemSize: 32 } })
    expect(en.find('.rs-virtual-list__empty').text()).toBe('No items')
    const zh = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: {
        default: () => h(RsVirtualList, { items: [], height: 80, itemSize: 32 }),
      },
    })
    expect(zh.find('.rs-virtual-list__empty').text()).toBe('暂无数据')
  })

  it('exposes scroll helpers and disconnects observers on unmount', () => {
    const disconnect = vi.fn()
    const Original = globalThis.ResizeObserver
    class FakeObserver {
      observe() {}
      unobserve() {}
      disconnect() {
        disconnect()
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver)
    const wrapper = mount(RsVirtualList, {
      props: { items: ['A', 'B', 'C'], height: 64, itemSize: 32 },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as {
      scrollToOffset: (offset: number) => void
      getScrollOffset: () => number
      getViewport: () => HTMLElement | undefined
    }
    exposed.scrollToOffset(0)
    expect(exposed.getScrollOffset()).toBe(0)
    expect(exposed.getViewport()?.classList.contains('rs-virtual-list')).toBe(true)
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalled()
    if (Original) vi.stubGlobal('ResizeObserver', Original)
    else vi.unstubAllGlobals()
  })
})
