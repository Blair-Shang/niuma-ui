import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import RsPagination from '../src/RsPagination.vue'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsInput from '../../input/src/RsInput.vue'
import RsSelect from '../../select/src/RsSelect.vue'
import {
  buildPaginationPagerItems,
  getPaginationRange,
  resolveAdjacentPagerKey,
  resolvePaginationKeyboardMove,
  resolvePaginationSize,
  shouldHidePagination,
} from '../src/pagination-utils'
import type { RsPaginationExpose } from '../src/pagination-utils'

describe('pagination-utils', () => {
  it('maps ssm to sm and unknown sizes to md', () => {
    expect(resolvePaginationSize('ssm')).toBe('sm')
    expect(resolvePaginationSize('sm')).toBe('sm')
    expect(resolvePaginationSize('lg')).toBe('lg')
    expect(resolvePaginationSize()).toBe('md')
  })

  it('hides only when hideOnSinglePage and one page', () => {
    expect(shouldHidePagination(true, 1)).toBe(true)
    expect(shouldHidePagination(true, 2)).toBe(false)
    expect(shouldHidePagination(false, 1)).toBe(false)
  })

  it('flips arrow keys in RTL and keeps Home / End as ends', () => {
    expect(resolvePaginationKeyboardMove('ArrowLeft')).toBe(-1)
    expect(resolvePaginationKeyboardMove('ArrowLeft', true)).toBe(1)
    expect(resolvePaginationKeyboardMove('ArrowRight', true)).toBe(-1)
    expect(resolvePaginationKeyboardMove('Home')).toBe('start')
    expect(resolvePaginationKeyboardMove('End')).toBe('end')
    expect(resolvePaginationKeyboardMove('Enter')).toBeNull()
  })

  it('resolves the next focusable pager key', () => {
    expect(resolveAdjacentPagerKey(['prev', 'page-1', 'next'], 'page-1', 1)).toBe('next')
    expect(resolveAdjacentPagerKey(['prev', 'page-1', 'next'], undefined, 'end')).toBe('next')
    expect(resolveAdjacentPagerKey([], 'page-1', 1)).toBeUndefined()
  })

  it('builds first / last and skips page numbers in simple mode', () => {
    const items = buildPaginationPagerItems({
      page: 4,
      pageCount: 10,
      range: getPaginationRange(4, 10),
      simple: true,
      showFirstLast: true,
      disabled: false,
    })
    expect(items.map((item) => item.type)).toEqual(['first', 'prev', 'simple', 'next', 'last'])
  })
})

describe('RsPagination', () => {
  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 10 },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.find('nav.rs-pagination').exists()).toBe(true)
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 40, page: 1, pageSize: 10 },
    })
    expect(wrapper.vm.$options.name).toBe('RsPagination')
  })

  it('renders nav with pagination aria-label', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 10 },
    })
    expect(wrapper.find('nav.rs-pagination').attributes('aria-label')).toBe('Pagination')
  })

  it('uses en-US aria-label when locale is en-US', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () =>
          h(RsPagination, {
            total: 100,
            page: 1,
            pageSize: 10,
          }),
      },
    })
    expect(wrapper.find('nav.rs-pagination').attributes('aria-label')).toBe('Pagination')
  })

  it('renders summary text with total', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 86, page: 1, pageSize: 20 },
    })
    expect(wrapper.find('.rs-pagination__summary').text()).toBe('86 items')
  })

  it('hides summary when showSummary is false', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 86, page: 1, showSummary: false },
    })
    expect(wrapper.find('.rs-pagination__summary').exists()).toBe(false)
  })

  it('emits update:page when next is clicked', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 10 },
    })
    await wrapper.find('[data-rs-pagination="next"]').trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
    expect(wrapper.emitted('change')?.[0]).toEqual([2, 10])
  })

  it('emits update:page when a page number is clicked', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 50, page: 1, pageSize: 10 },
    })
    await wrapper.find('[data-rs-pagination="page-3"]').trigger('click')
    expect(wrapper.emitted('update:page')?.pop()).toEqual([3])
  })

  it('marks the current page with aria-current', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 50, page: 2, pageSize: 10 },
    })
    expect(wrapper.find('[data-rs-pagination="page-2"]').attributes('aria-current')).toBe('page')
    expect(wrapper.find('[data-rs-pagination="page-1"]').attributes('aria-current')).toBeUndefined()
  })

  it('disables prev on first page', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 10 },
    })
    expect(wrapper.find('[data-rs-pagination="prev"]').attributes('disabled')).toBeDefined()
  })

  it('disables next on last page', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 10, pageSize: 10 },
    })
    expect(wrapper.find('[data-rs-pagination="next"]').attributes('disabled')).toBeDefined()
  })

  it('renders ellipsis for large page counts', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 500, page: 12, pageSize: 20 },
    })
    expect(wrapper.find('.rs-pagination__ellipsis').exists()).toBe(true)
  })

  it('renders RsSelect for page size when showPageSize is true', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 20, showPageSize: true },
    })
    expect(wrapper.find('.rs-pagination__size .rs-select').exists()).toBe(true)
  })

  it('emits update:pageSize when page size changes', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 20, showPageSize: true },
    })
    await wrapper.findComponent(RsSelect).setValue('50')
    expect(wrapper.emitted('update:pageSize')?.pop()).toEqual([50])
    expect(wrapper.emitted('pageSizeChange')?.pop()).toEqual([50, 1])
  })

  it('clamps page when page size increases', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 5, pageSize: 10, showPageSize: true },
    })
    await wrapper.findComponent(RsSelect).setValue('50')
    expect(wrapper.emitted('update:page')?.pop()).toEqual([2])
    expect(wrapper.emitted('change')?.pop()).toEqual([2, 50])
  })

  it('does not emit update:page when disabled', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 10, disabled: true },
    })
    await wrapper.find('[data-rs-pagination="next"]').trigger('click')
    expect(wrapper.emitted('update:page')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('renders quick jumper when showQuickJumper is true', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 100, page: 1, pageSize: 10, showQuickJumper: true },
    })
    expect(wrapper.find('.rs-pagination__jumper').exists()).toBe(true)
    expect(wrapper.find('.rs-pagination__jumper-input input').exists()).toBe(true)
  })

  it('hides quick jumper when only one page exists', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 8, page: 1, pageSize: 10, showQuickJumper: true },
    })
    expect(wrapper.find('.rs-pagination__jumper').exists()).toBe(false)
  })

  it('jumps to page when confirm is clicked', async () => {
    const wrapper = mount(RsPagination, {
      props: {
        total: 100,
        page: 1,
        pageSize: 10,
        showQuickJumper: true,
        showJumpConfirm: true,
      },
    })
    const input = wrapper.find('.rs-pagination__jumper-input input')
    await input.setValue('7')
    await wrapper.find('[data-rs-pagination="confirm"]').trigger('click')
    expect(wrapper.emitted('update:page')?.pop()).toEqual([7])
  })

  it('hides jump confirm button by default', () => {
    const wrapper = mount(RsPagination, {
      props: {
        total: 100,
        page: 1,
        pageSize: 10,
        showQuickJumper: true,
      },
    })
    expect(wrapper.find('[data-rs-pagination="confirm"]').exists()).toBe(false)
  })

  it('hides jump confirm button when showJumpConfirm is false', () => {
    const wrapper = mount(RsPagination, {
      props: {
        total: 100,
        page: 1,
        pageSize: 10,
        showQuickJumper: true,
        showJumpConfirm: false,
      },
    })
    expect(wrapper.find('[data-rs-pagination="confirm"]').exists()).toBe(false)
  })

  it('jumps to page on enter when confirm is hidden', async () => {
    const wrapper = mount(RsPagination, {
      props: {
        total: 100,
        page: 1,
        pageSize: 10,
        showQuickJumper: true,
        showJumpConfirm: false,
      },
    })
    const input = wrapper.find('.rs-pagination__jumper-input input')
    await input.setValue('4')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:page')?.pop()).toEqual([4])
  })

  it('applies size class for sm / md / lg', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const wrapper = mount(RsPagination, {
        props: { total: 40, page: 1, pageSize: 10, size },
      })
      expect(wrapper.find('nav').classes()).toContain(`rs-pagination--${size}`)
    }
  })

  it('passes the same size to jumper input and page-size select', () => {
    const wrapper = mount(RsPagination, {
      props: {
        total: 80,
        page: 1,
        pageSize: 10,
        size: 'sm',
        showQuickJumper: true,
        showPageSize: true,
      },
    })
    expect(wrapper.findComponent(RsInput).props('size')).toBe('sm')
    expect(wrapper.findComponent(RsSelect).props('size')).toBe('sm')
    expect(wrapper.find('.rs-pagination__jumper-input').exists()).toBe(true)
    expect(wrapper.find('.rs-pagination__size').exists()).toBe(true)
  })

  it('maps ConfigProvider ssm to sm', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'ssm' },
      slots: {
        default: () => h(RsPagination, { total: 40, page: 1, pageSize: 10 }),
      },
    })
    expect(wrapper.find('nav').classes()).toContain('rs-pagination--sm')
  })

  it('clamps jump target to valid page range', async () => {
    const wrapper = mount(RsPagination, {
      props: {
        total: 100,
        page: 1,
        pageSize: 10,
        showQuickJumper: true,
        showJumpConfirm: true,
      },
    })
    const input = wrapper.find('.rs-pagination__jumper-input input')
    await input.setValue('99')
    await wrapper.find('[data-rs-pagination="confirm"]').trigger('click')
    expect(wrapper.emitted('update:page')?.pop()).toEqual([10])
  })

  it('renders first / last when showFirstLast is true', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 200, page: 4, pageSize: 10, showFirstLast: true },
    })
    expect(wrapper.find('[data-rs-pagination="first"]').exists()).toBe(true)
    expect(wrapper.find('[data-rs-pagination="last"]').exists()).toBe(true)
    await wrapper.find('[data-rs-pagination="first"]').trigger('click')
    expect(wrapper.emitted('update:page')?.pop()).toEqual([1])
  })

  it('renders simple pager without page number buttons', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 200, page: 3, pageSize: 10, simple: true, showSummary: false },
    })
    expect(wrapper.find('.rs-pagination__simple').text()).toBe('3 / 20')
    expect(wrapper.find('[data-rs-pagination="page-3"]').exists()).toBe(false)
  })

  it('hides the nav when hideOnSinglePage and only one page', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 8, page: 1, pageSize: 10, hideOnSinglePage: true },
    })
    expect(wrapper.find('nav.rs-pagination').exists()).toBe(false)
  })

  it('applies align class', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 40, page: 1, pageSize: 10, align: 'end' },
    })
    expect(wrapper.find('nav').classes()).toContain('rs-pagination--align-end')
  })

  it('moves focus with arrow keys and does not change page', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 50, page: 2, pageSize: 10 },
      attachTo: document.body,
    })
    const current = wrapper.find('[data-rs-pagination="page-2"]')
    ;(current.element as HTMLElement).focus()
    await current.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(wrapper.find('[data-rs-pagination="page-3"]').element)
    expect(wrapper.emitted('update:page')).toBeUndefined()
    wrapper.unmount()
  })

  it('exposes goTo / next / prev / focus', async () => {
    const wrapper = mount(RsPagination, {
      props: { total: 80, page: 2, pageSize: 10 },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as RsPaginationExpose
    expect(exposed.next()).toBe(3)
    expect(exposed.prev()).toBe(2)
    expect(exposed.goTo(8)).toBe(true)
    exposed.focus(8)
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('[data-rs-pagination="page-8"]').element)
    wrapper.unmount()
  })

  it('renders item and summary slots', () => {
    const wrapper = mount(RsPagination, {
      props: { total: 30, page: 1, pageSize: 10 },
      slots: {
        summary: ({ total }: { total: number }) => `total=${total}`,
        item: ({ type, page }: { type: string; page: number }) =>
          type === 'page' ? `#${page}` : type,
      },
    })
    expect(wrapper.find('.rs-pagination__summary').text()).toBe('total=30')
    expect(wrapper.find('[data-rs-pagination="page-1"]').text()).toBe('#1')
    expect(wrapper.find('[data-rs-pagination="next"]').text()).toBe('next')
  })
})
