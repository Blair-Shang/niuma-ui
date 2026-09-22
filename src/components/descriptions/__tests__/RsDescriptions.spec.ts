import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import RsDescriptions from '../src/RsDescriptions.vue'
import RsDescriptionsItem from '../src/RsDescriptionsItem.vue'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import {
  clampRsDescriptionsSpan,
  resolveRsDescriptionsColumns,
  resolveRsDescriptionsLabelAlign,
  resolveRsDescriptionsLabelWidth,
  resolveRsDescriptionsValue,
} from '../src/descriptions-utils'

const sampleItems = [
  { key: 'name', label: '名称', value: '弱水' },
  { key: 'owner', label: '负责人', value: 'Ada' },
]

describe('RsDescriptions', () => {
  it('registers public component names and does not import reka-ui', () => {
    expect(RsDescriptions.name).toBe('RsDescriptions')
    expect(RsDescriptionsItem.name).toBe('RsDescriptionsItem')
    const root = readFileSync('src/components/descriptions/src/RsDescriptions.vue', 'utf8')
    const item = readFileSync('src/components/descriptions/src/RsDescriptionsItem.vue', 'utf8')
    const utils = readFileSync('src/components/descriptions/src/descriptions-utils.ts', 'utf8')
    for (const source of [root, item, utils]) {
      expect(source).not.toContain('reka-ui')
      expect(source).not.toMatch(
        /addEventListener|setInterval|setTimeout|ResizeObserver|matchMedia|MutationObserver/,
      )
    }
  })

  it('renders a description list', () => {
    const wrapper = mount(RsDescriptions, {
      props: { title: 'Service', items: sampleItems, id: 'svc' },
    })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('id')).toBe('svc')
    expect(wrapper.classes()).toContain('rs-descriptions--bordered')
    expect(wrapper.classes()).toContain('rs-descriptions--left')
    expect(wrapper.classes()).toContain('rs-descriptions--align-start')
    const list = wrapper.find('dl')
    expect(list.attributes('aria-labelledby')).toBeTruthy()
    expect(wrapper.find('dt').text()).toBe('名称')
    expect(wrapper.find('dd').text()).toBe('弱水')
    expect(wrapper.find('.rs-descriptions__colon').exists()).toBe(false)
  })

  it('defaults to md size without config override', () => {
    const wrapper = mount(RsDescriptions, {
      props: { items: sampleItems },
    })
    expect(wrapper.classes()).toContain('rs-descriptions--md')
  })

  it('inherits controlSize from RsConfigProvider when size omitted', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'sm' },
      slots: {
        default: () => h(RsDescriptions, { items: sampleItems }),
      },
    })
    expect(wrapper.find('.rs-descriptions').classes()).toContain('rs-descriptions--sm')
  })

  it('props size overrides RsConfigProvider controlSize', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'sm' },
      slots: {
        default: () => h(RsDescriptions, { items: sampleItems, size: 'lg' }),
      },
    })
    expect(wrapper.find('.rs-descriptions').classes()).toContain('rs-descriptions--lg')
    expect(wrapper.find('.rs-descriptions').classes()).not.toContain('rs-descriptions--sm')
  })

  it('supports ssm from config', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'ssm' },
      slots: {
        default: () => h(RsDescriptions, { items: sampleItems }),
      },
    })
    expect(wrapper.find('.rs-descriptions').classes()).toContain('rs-descriptions--ssm')
  })

  it('keeps nullish placeholders and leaves 0 and empty strings alone', () => {
    const wrapper = mount(RsDescriptions, {
      props: {
        items: [
          { key: 'a', label: 'Missing', value: null },
          { key: 'b', label: 'Unset' },
          { key: 'c', label: 'Zero', value: 0 },
          { key: 'd', label: 'Blank', value: '' },
        ],
      },
    })
    const values = wrapper.findAll('dd').map((node) => node.text())
    expect(values).toEqual(['—', '—', '0', ''])
  })

  it('uses locale colon glyphs and emptyText override', () => {
    const zh = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: {
        default: () =>
          h(RsDescriptions, {
            colon: true,
            items: [{ key: 'a', label: '名称', value: null }],
          }),
      },
    })
    expect(zh.find('.rs-descriptions__colon').text()).toBe('：')
    expect(zh.find('.rs-descriptions__colon').attributes('aria-hidden')).toBe('true')

    const en = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () =>
          h(RsDescriptions, {
            colon: true,
            emptyText: 'N/A',
            items: [{ key: 'a', label: 'Name', value: null }],
          }),
      },
    })
    expect(en.find('.rs-descriptions__colon').text()).toBe(':')
    expect(en.find('dd').text()).toBe('N/A')
  })

  it('applies label width, alignment, and clamped span', () => {
    const wrapper = mount(RsDescriptions, {
      props: {
        columns: 2,
        labelWidth: '9rem',
        labelAlign: 'end',
        items: [
          { key: 'a', label: 'A', value: '1', span: 4 },
          { key: 'b', label: 'B', value: '2', span: 0 },
        ],
      },
    })
    expect(wrapper.classes()).toContain('rs-descriptions--align-end')
    expect(wrapper.find('dl').attributes('style')).toContain('--rs-descriptions-columns: 2')
    expect(wrapper.find('dl').attributes('style')).toContain('--rs-descriptions-label-width: 9rem')
    const spans = wrapper.findAll('.rs-descriptions__item').map((node) => node.attributes('style'))
    expect(spans[0]).toContain('span 2')
    expect(spans[1]).toContain('span 1')
  })

  it('renders extra, title, and per-item slots', () => {
    const wrapper = mount(RsDescriptions, {
      props: {
        items: [{ key: 'status', label: 'Status', value: 'down' }],
        ariaLabel: 'Runtime',
      },
      slots: {
        title: () => 'Custom',
        extra: () => 'Edit',
        'label-status': () => 'Health',
        'item-status': () => 'Up',
      },
    })
    expect(wrapper.find('.rs-descriptions__title').text()).toBe('Custom')
    expect(wrapper.find('.rs-descriptions__extra').text()).toBe('Edit')
    expect(wrapper.find('dt').text()).toBe('Health')
    expect(wrapper.find('dd').text()).toBe('Up')
    expect(wrapper.find('dl').attributes('aria-label')).toBe('Runtime')
    expect(wrapper.find('dl').attributes('aria-labelledby')).toBeUndefined()
  })

  it('lets the default slot replace items and inherit colon', () => {
    const wrapper = mount(RsDescriptions, {
      props: {
        columns: 2,
        colon: true,
        items: [{ key: 'hidden', label: 'Hidden', value: 'no' }],
      },
      slots: {
        default: () => [
          h(RsDescriptionsItem, { label: 'Env', span: 2 }, () => 'prod'),
          h(RsDescriptionsItem, { label: 'Note' }, { default: () => 'ok', label: () => 'Region' }),
        ],
      },
    })
    expect(wrapper.text()).not.toContain('Hidden')
    const items = wrapper.findAll('.rs-descriptions__item')
    expect(items[0].attributes('style')).toContain('span 2')
    expect(items[0].find('.rs-descriptions__colon').attributes('aria-hidden')).toBe('true')
    expect(items[0].find('.rs-descriptions__colon').text().length).toBeGreaterThan(0)
    expect(items[1].find('dt').text()).toContain('Region')
    expect(items[1].find('dd').text()).toBe('ok')
  })
})

describe('descriptions-utils', () => {
  it('resolves columns, span, align, width, and values', () => {
    expect(resolveRsDescriptionsColumns(undefined)).toBe(3)
    expect(resolveRsDescriptionsColumns(Number.NaN)).toBe(3)
    expect(resolveRsDescriptionsColumns(0)).toBe(1)
    expect(resolveRsDescriptionsColumns(2.9)).toBe(2)

    expect(clampRsDescriptionsSpan(undefined, 3)).toBe(1)
    expect(clampRsDescriptionsSpan(0, 3)).toBe(1)
    expect(clampRsDescriptionsSpan(5, 3)).toBe(3)

    expect(resolveRsDescriptionsLabelAlign(undefined)).toBe('start')
    expect(resolveRsDescriptionsLabelAlign('end')).toBe('end')

    expect(resolveRsDescriptionsLabelWidth(12)).toBe('12px')
    expect(resolveRsDescriptionsLabelWidth(' 8rem ')).toBe('8rem')
    expect(resolveRsDescriptionsLabelWidth(-1)).toBeUndefined()
    expect(resolveRsDescriptionsLabelWidth('1px;color:red')).toBeUndefined()
    expect(resolveRsDescriptionsLabelWidth('url(evil)')).toBeUndefined()

    expect(resolveRsDescriptionsValue(null, '—')).toBe('—')
    expect(resolveRsDescriptionsValue(undefined, '—')).toBe('—')
    expect(resolveRsDescriptionsValue(0, '—')).toBe('0')
    expect(resolveRsDescriptionsValue('', '—')).toBe('')
  })
})
