import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RsCalendarGrid from '../components/RsCalendarGrid.vue'

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
})
