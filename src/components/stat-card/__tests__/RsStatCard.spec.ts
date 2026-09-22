import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsStatCard from '../src/RsStatCard.vue'
import {
  formatRsStatValue,
  resolveRsStatAccent,
  resolveRsStatNumberFormat,
  resolveRsStatSize,
  resolveRsStatTrend,
  resolveRsStatTrendTone,
  rsStatFormatterCacheSize,
} from '../src/stat-card-utils'

const accents = ['primary', 'success', 'warning', 'danger', 'info'] as const

describe('RsStatCard', () => {
  it('renders label and value', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '今日调用', value: 12480 },
    })
    expect(wrapper.find('.rs-stat-card__label').text()).toBe('今日调用')
    expect(wrapper.find('.rs-stat-card__value').text()).toBe('12480')
  })

  it('renders as section with base class', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '指标', value: 1 },
    })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.classes()).toContain('rs-stat-card')
    expect(wrapper.getCurrentComponent().type.name).toBe('RsStatCard')
  })

  it('uses primary accent by default', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '指标', value: 1 },
    })
    expect(wrapper.classes()).toContain('rs-stat-card--primary')
    expect(wrapper.classes()).toContain('rs-stat-card--md')
  })

  it.each(accents)('applies %s accent class', (accent) => {
    const wrapper = mount(RsStatCard, {
      props: { label: '指标', value: 1, accent },
    })
    expect(wrapper.classes()).toContain(`rs-stat-card--${accent}`)
  })

  it('renders description when provided', () => {
    const wrapper = mount(RsStatCard, {
      props: {
        label: '错误率',
        value: '0.12%',
        description: '过去 24 小时',
      },
    })
    expect(wrapper.find('.rs-stat-card__description').text()).toBe('过去 24 小时')
  })

  it('omits description when not provided', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '指标', value: 1 },
    })
    expect(wrapper.find('.rs-stat-card__description').exists()).toBe(false)
  })

  it('shows skeleton instead of value when loading', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: {
        default: () => h(RsStatCard, { label: '活跃用户', value: 3842, loading: true }),
      },
    })
    const card = wrapper.find('.rs-stat-card')
    expect(card.find('.rs-stat-card__skeleton').exists()).toBe(true)
    expect(card.find('.rs-stat-card__value').exists()).toBe(false)
    expect(card.attributes('aria-busy')).toBe('true')
    expect(card.find('.rs-stat-card__sr').text()).toBe('加载中')
  })

  it('keeps description and extra content while loading', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '存储', value: '68%', description: '已用', loading: true, prefix: '$' },
      slots: { default: '<div class="extra">进度条</div>' },
    })
    expect(wrapper.find('.rs-stat-card__description').text()).toBe('已用')
    expect(wrapper.find('.extra').text()).toBe('进度条')
    expect(wrapper.find('.rs-stat-card__affix').exists()).toBe(false)
  })

  it('renders value slot', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '营收' },
      slots: { value: '<span class="custom-value">¥ 128万</span>' },
    })
    expect(wrapper.find('.custom-value').text()).toBe('¥ 128万')
  })

  it('renders default slot for extra content', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: '存储', value: '68%' },
      slots: { default: '<div class="extra">进度条</div>' },
    })
    expect(wrapper.find('.extra').text()).toBe('进度条')
  })

  it('renders prefix, suffix, and trend without treating direction as good or bad', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () =>
          h(RsStatCard, {
            label: 'Error rate',
            value: '0.12%',
            suffix: 'req/s',
            trend: 'up',
            trendTone: 'danger',
            delta: '+0.03%',
          }),
      },
    })
    expect(wrapper.find('.rs-stat-card__affix').text()).toBe('req/s')
    expect(wrapper.find('.rs-stat-card__delta').text()).toBe('+0.03%')
    expect(wrapper.find('.rs-stat-card__trend').classes()).toContain('rs-stat-card__trend--danger')
    expect(wrapper.find('.rs-stat-card__mark').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.rs-stat-card__sr').text()).toBe('Increased')
  })

  it('formats numbers only when asked and keeps strings raw', () => {
    const raw = mount(RsStatCard, { props: { label: 'Calls', value: 12480 } })
    expect(raw.find('.rs-stat-card__value').text()).toBe('12480')

    const grouped = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsStatCard, { label: 'Calls', value: 12480, format: true }),
      },
    })
    expect(grouped.find('.rs-stat-card__value').text()).toBe('12,480')

    const text = mount(RsStatCard, {
      props: { label: 'Rate', value: '0.12%', format: true },
    })
    expect(text.find('.rs-stat-card__value').text()).toBe('0.12%')
  })

  it('does not import reka-ui or register window listeners', () => {
    const source = readFileSync('src/components/stat-card/src/RsStatCard.vue', 'utf8')
    const utils = readFileSync('src/components/stat-card/src/stat-card-utils.ts', 'utf8')
    expect(source).not.toContain('reka-ui')
    expect(utils).not.toContain('reka-ui')
    expect(source).not.toContain('addEventListener')
    expect(source).not.toContain('setInterval')
    expect(source).not.toContain('setTimeout')
    expect(source).not.toContain('ResizeObserver')
  })

  it('unmounts without throwing', () => {
    const wrapper = mount(RsStatCard, {
      props: { label: 'Calls', value: 1, loading: true, trend: 'up', delta: 1 },
    })
    wrapper.unmount()
    expect(wrapper.exists()).toBe(false)
  })
})

describe('stat-card-utils', () => {
  it('falls back unknown accent, trend, tone, and size', () => {
    expect(resolveRsStatAccent(undefined)).toBe('primary')
    expect(resolveRsStatAccent('nope')).toBe('primary')
    expect(resolveRsStatTrend('up')).toBe('up')
    expect(resolveRsStatTrend('sideways')).toBeNull()
    expect(resolveRsStatTrendTone(undefined)).toBe('neutral')
    expect(resolveRsStatSize('ssm')).toBe('md')
    expect(resolveRsStatSize('lg')).toBe('lg')
  })

  it('keeps formatting off until format or precision is set', () => {
    expect(resolveRsStatNumberFormat(false, undefined)).toBeNull()
    expect(resolveRsStatNumberFormat(undefined, undefined)).toBeNull()
    expect(formatRsStatValue(12480, { format: false, locale: 'en-US' })).toBe('12480')
    expect(formatRsStatValue('0.12%', { format: true, locale: 'en-US' })).toBe('0.12%')
    expect(formatRsStatValue(Number.NaN, { format: true, locale: 'en-US' })).toBe('NaN')
    expect(formatRsStatValue(null, { format: true, locale: 'en-US' })).toBe('')
  })

  it('formats with the caller locale and clamps precision', () => {
    expect(formatRsStatValue(12480, { format: { notation: 'compact' }, locale: 'en-US' })).toBe('12K')
    expect(formatRsStatValue(12480, { format: { notation: 'compact' }, locale: 'zh-CN' })).toBe('1.2万')
    expect(formatRsStatValue(1234.5, { format: true, locale: 'de-DE' })).toBe('1.234,5')
    expect(formatRsStatValue(1.2, { precision: 2, locale: 'en-US' })).toBe('1.20')
    expect(formatRsStatValue(10, { format: { style: 'currency', currency: 'NOPE' }, locale: 'en-US' })).toBe(
      '10',
    )
  })

  it('caps the formatter cache', () => {
    for (let i = 0; i < 40; i += 1) {
      formatRsStatValue(1000, { format: true, locale: `en-US-x-stat-${i}` })
    }
    expect(rsStatFormatterCacheSize()).toBeLessThanOrEqual(24)
    expect(rsStatFormatterCacheSize()).toBe(24)
  })
})
