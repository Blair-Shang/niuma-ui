import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RsCalendarGrid from '../src/RsCalendarGrid.vue'

describe('RsCalendarGrid', () => {
  it('renders month navigation and a 7×6 date grid', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    expect(wrapper.find('.rs-calendar-grid__table').exists()).toBe(true)
    expect(wrapper.findAll('thead th')).toHaveLength(7)
    expect(wrapper.findAll('.rs-calendar-grid__cell')).toHaveLength(42)
    expect(wrapper.find('.rs-calendar-grid__title').text()).toContain('2025')
  })

  it('emits select when a cell is clicked', async () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    const enabled = wrapper
      .findAll('.rs-calendar-grid__cell')
      .find((btn) => !btn.attributes('disabled'))
    await enabled?.trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({
      year: expect.any(Number),
      month: expect.any(Number),
      day: expect.any(Number),
    })
  })

  it('marks the selected date with selected class', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: {
        viewYear: 2025,
        viewMonth: 6,
        selected: { year: 2025, month: 6, day: 16 },
      },
    })
    expect(wrapper.find('.rs-calendar-grid__cell--selected').exists()).toBe(true)
  })

  it('shows outside-month cells', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    expect(wrapper.findAll('.rs-calendar-grid__cell--outside').length).toBeGreaterThan(0)
  })

  it('disables dates listed in disabledDates', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: {
        viewYear: 2025,
        viewMonth: 6,
        disabledDates: ['2025-06-01', '2025-06-15', '2025-06-30'],
      },
    })
    const disabledCount = wrapper
      .findAll('.rs-calendar-grid__cell')
      .filter((btn) => btn.attributes('disabled') !== undefined).length
    expect(disabledCount).toBeGreaterThanOrEqual(3)
  })

  it('updates view month via month navigation', async () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    await wrapper.find('.rs-calendar-grid__nav--next-month').trigger('click')
    expect(wrapper.emitted('update:viewMonth')?.[0]).toEqual([7])
    expect(wrapper.emitted('update:viewYear')).toBeUndefined()
  })

  it('updates view year via year navigation and keeps the month', async () => {
    const next = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    await next.find('.rs-calendar-grid__nav--next-year').trigger('click')
    expect(next.emitted('update:viewYear')?.[0]).toEqual([2026])
    expect(next.emitted('update:viewMonth')).toBeUndefined()
    next.unmount()

    const prev = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    await prev.find('.rs-calendar-grid__nav--prev-year').trigger('click')
    expect(prev.emitted('update:viewYear')?.[0]).toEqual([2024])
    expect(prev.emitted('update:viewMonth')).toBeUndefined()
    prev.unmount()
  })

  it('starts the week on Sunday when weekStartsOn is 0', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6, weekStartsOn: 0 },
    })
    expect(wrapper.findAll('.rs-calendar-grid__cell')[0]?.text()).toBe('1')
  })

  it('disables a date when disabledDate returns true', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: {
        viewYear: 2025,
        viewMonth: 6,
        disabledDate: (date) => date.day === 16,
      },
    })
    const cell = wrapper.findAll('.rs-calendar-grid__cell').find((btn) => btn.text() === '16')
    expect(cell?.attributes('disabled')).toBeDefined()
  })

  it('highlights range between start and end', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: {
        viewYear: 2025,
        viewMonth: 6,
        rangeStart: { year: 2025, month: 6, day: 10 },
        rangeEnd: { year: 2025, month: 6, day: 12 },
      },
    })
    expect(wrapper.findAll('.rs-calendar-grid__cell--in-range').length).toBeGreaterThan(0)
  })

  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.find('table.rs-calendar-grid__table').exists()).toBe(true)
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6 },
    })
    expect(wrapper.vm.$options.name).toBe('RsCalendarGrid')
  })

  it('moves focus with arrow keys and selects with Enter', async () => {
    const wrapper = mount(RsCalendarGrid, {
      props: {
        viewYear: 2025,
        viewMonth: 6,
        selected: { year: 2025, month: 6, day: 16 },
      },
      attachTo: document.body,
    })
    await wrapper.find('.rs-calendar-grid__table').trigger('keydown', { key: 'ArrowRight' })
    await wrapper.find('.rs-calendar-grid__table').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual({ year: 2025, month: 6, day: 17 })
    wrapper.unmount()
  })

  it('disables the whole grid and inherits no select', async () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6, disabled: true },
    })
    expect(wrapper.find('.rs-calendar-grid--disabled').exists()).toBe(true)
    expect(wrapper.find('.rs-calendar-grid__nav--next-month').attributes('disabled')).toBeDefined()
    await wrapper.findAll('.rs-calendar-grid__cell')[10]?.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('hides adjacent-month days when showOutside is false', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6, showOutside: false },
    })
    expect(wrapper.find('.rs-calendar-grid__cell--outside').exists()).toBe(false)
    expect(wrapper.findAll('.rs-calendar-grid__cell').length).toBeLessThan(42)
  })

  it('renders ISO week numbers', () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2025, viewMonth: 6, showWeekNumbers: true, weekStartsOn: 1 },
    })
    expect(wrapper.findAll('thead th')).toHaveLength(8)
    expect(wrapper.findAll('.rs-calendar-grid__week-num').length).toBe(6)
  })

  it('exposes focus and goToToday', async () => {
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: 2024, viewMonth: 1 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as { focus: () => void; goToToday: () => void }
    vm.goToToday()
    await wrapper.vm.$nextTick()
    const today = new Date()
    expect(wrapper.emitted('update:viewYear')?.at(-1)).toEqual([today.getFullYear()])
    expect(wrapper.emitted('update:viewMonth')?.at(-1)).toEqual([today.getMonth() + 1])
    vm.focus()
    wrapper.unmount()
  })

  it('marks today with aria-current=date', () => {
    const now = new Date()
    const wrapper = mount(RsCalendarGrid, {
      props: { viewYear: now.getFullYear(), viewMonth: now.getMonth() + 1 },
    })
    expect(wrapper.find('[aria-current="date"]').exists()).toBe(true)
  })
})
