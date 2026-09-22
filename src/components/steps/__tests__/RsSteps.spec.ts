import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsSteps from '../src/RsSteps.vue'
import {
  buildStepRenderItems,
  clampStepPercent,
  isStepSeparatorCompleted,
  resolveActiveStepIndex,
  resolveAdjacentStepValue,
  resolveCurrentStepStatus,
  resolveSelectableStepValues,
  resolveStepIndicator,
  resolveStepKeyboardMove,
  resolveStepStatus,
} from '../src/steps-utils'

const items = [
  { value: 'a', title: '步骤 A', description: '描述 A' },
  { value: 'b', title: '步骤 B' },
  { value: 'c', title: '步骤 C' },
]

describe('steps-utils', () => {
  it('resolveStepStatus derives finish/process/wait from active index', () => {
    expect(resolveStepStatus(0, 1)).toBe('finish')
    expect(resolveStepStatus(1, 1)).toBe('process')
    expect(resolveStepStatus(2, 1)).toBe('wait')
  })

  it('resolveStepStatus prefers explicit status', () => {
    expect(resolveStepStatus(1, 0, 'error')).toBe('error')
  })

  it('resolveCurrentStepStatus prefers item status then current status', () => {
    expect(resolveCurrentStepStatus(1, 1, 'error', 'finish')).toBe('error')
    expect(resolveCurrentStepStatus(1, 1, undefined, 'error')).toBe('error')
    expect(resolveCurrentStepStatus(0, 1, undefined, 'error')).toBe('finish')
  })

  it('isStepSeparatorCompleted is true only for finish', () => {
    expect(isStepSeparatorCompleted('finish')).toBe(true)
    expect(isStepSeparatorCompleted('process')).toBe(false)
  })

  it('resolveActiveStepIndex falls back to 0 when value is missing', () => {
    expect(resolveActiveStepIndex(items, 'b')).toBe(1)
    expect(resolveActiveStepIndex(items, 'missing')).toBe(0)
    expect(resolveActiveStepIndex([], 'a')).toBe(0)
  })

  it('clampStepPercent clamps to 0–100', () => {
    expect(clampStepPercent(undefined)).toBeUndefined()
    expect(clampStepPercent(Number.NaN)).toBeUndefined()
    expect(clampStepPercent(-10)).toBe(0)
    expect(clampStepPercent(140)).toBe(100)
    expect(clampStepPercent(40)).toBe(40)
  })

  it('resolveSelectableStepValues skips disabled items', () => {
    expect(
      resolveSelectableStepValues([
        { value: 'a', title: 'A' },
        { value: 'b', title: 'B', disabled: true },
        { value: 'c', title: 'C' },
      ]),
    ).toEqual(['a', 'c'])
  })

  it('resolveAdjacentStepValue does not wrap', () => {
    expect(resolveAdjacentStepValue(['a', 'b', 'c'], 'b', 1)).toBe('c')
    expect(resolveAdjacentStepValue(['a', 'b', 'c'], 'c', 1)).toBeUndefined()
    expect(resolveAdjacentStepValue(['a', 'b', 'c'], 'a', -1)).toBeUndefined()
    expect(resolveAdjacentStepValue(['a', 'b', 'c'], undefined, 1)).toBe('a')
  })

  it('resolveStepKeyboardMove flips horizontal arrows in RTL', () => {
    expect(resolveStepKeyboardMove('ArrowLeft', 'horizontal', false)).toBe(-1)
    expect(resolveStepKeyboardMove('ArrowLeft', 'horizontal', true)).toBe(1)
    expect(resolveStepKeyboardMove('ArrowUp', 'vertical')).toBe(-1)
    expect(resolveStepKeyboardMove('ArrowLeft', 'vertical')).toBeNull()
    expect(resolveStepKeyboardMove('Home', 'horizontal')).toBe('start')
    expect(resolveStepKeyboardMove('End', 'vertical')).toBe('end')
    expect(resolveStepKeyboardMove('Tab', 'horizontal')).toBeNull()
  })

  it('resolveStepIndicator prefers dot, then icon, then status marks', () => {
    expect(resolveStepIndicator('finish', 'dot')).toBe('dot')
    expect(resolveStepIndicator('wait', 'default', 'user')).toBe('icon')
    expect(resolveStepIndicator('finish', 'default')).toBe('check')
    expect(resolveStepIndicator('error', 'default')).toBe('error')
    expect(resolveStepIndicator('process', 'default')).toBe('number')
  })

  it('buildStepRenderItems precomputes status and separator', () => {
    const rows = buildStepRenderItems(items, 1)
    expect(rows).toHaveLength(3)
    expect(rows[0]?.status).toBe('finish')
    expect(rows[0]?.completedSeparator).toBe(true)
    expect(rows[1]?.active).toBe(true)
    expect(rows[1]?.indicator).toBe('number')
    expect(rows[2]?.status).toBe('wait')
  })
})

describe('RsSteps', () => {
  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
    })
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.find('nav.rs-steps').exists()).toBe(true)
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
    })
    expect(wrapper.vm.$options.name).toBe('RsSteps')
  })

  it('renders all step titles and descriptions', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'b' },
    })
    expect(wrapper.text()).toContain('步骤 A')
    expect(wrapper.text()).toContain('描述 A')
    expect(wrapper.text()).toContain('步骤 B')
    expect(wrapper.text()).toContain('步骤 C')
  })

  it('applies auto-derived status classes', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'b' },
    })
    const stepItems = wrapper.findAll('.rs-steps__item')
    expect(stepItems[0]?.classes()).toContain('rs-steps__item--finish')
    expect(stepItems[1]?.classes()).toContain('rs-steps__item--process')
    expect(stepItems[2]?.classes()).toContain('rs-steps__item--wait')
  })

  it('applies explicit status when provided', () => {
    const wrapper = mount(RsSteps, {
      props: {
        items: [
          { value: 'a', title: 'A', status: 'finish' as const },
          { value: 'b', title: 'B', status: 'error' as const },
        ],
        modelValue: 'a',
      },
    })
    const stepItems = wrapper.findAll('.rs-steps__item')
    expect(stepItems[1]?.classes()).toContain('rs-steps__item--error')
  })

  it('applies component status to the current step', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'b', status: 'error' },
    })
    const stepItems = wrapper.findAll('.rs-steps__item')
    expect(stepItems[0]?.classes()).toContain('rs-steps__item--finish')
    expect(stepItems[1]?.classes()).toContain('rs-steps__item--error')
  })

  it('renders horizontal layout and md size by default', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
    })
    expect(wrapper.find('.rs-steps').classes()).toContain('rs-steps--horizontal')
    expect(wrapper.find('.rs-steps').classes()).toContain('rs-steps--md')
  })

  it('follows ConfigProvider control-size when size is omitted', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { controlSize: 'sm' },
      slots: {
        default: () => h(RsSteps, { items, modelValue: 'a' }),
      },
    })
    expect(wrapper.find('.rs-steps').classes()).toContain('rs-steps--sm')
  })

  it('renders vertical and sm modifiers', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a', orientation: 'vertical', size: 'sm' },
    })
    expect(wrapper.find('.rs-steps').classes()).toContain('rs-steps--vertical')
    expect(wrapper.find('.rs-steps').classes()).toContain('rs-steps--sm')
  })

  it('renders separators between items but not after the last', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
    })
    expect(wrapper.findAll('.rs-steps__separator')).toHaveLength(items.length - 1)
  })

  it('marks finished separators', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'b' },
    })
    const separators = wrapper.findAll('.rs-steps__separator')
    expect(separators[0]?.classes()).toContain('rs-steps__separator--finish')
    expect(separators[1]?.classes()).not.toContain('rs-steps__separator--finish')
  })

  it('renders non-button triggers when not clickable', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
    })
    expect(wrapper.findAll('button.rs-steps__trigger')).toHaveLength(0)
    expect(wrapper.findAll('.rs-steps__trigger')).toHaveLength(items.length)
  })

  it('updates model when a clickable step is selected', async () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a', clickable: true },
    })
    await wrapper.findAll('.rs-steps__trigger')[1]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('b')
  })

  it('emits click without changing model when not clickable', async () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
    })
    await wrapper.findAll('.rs-steps__trigger')[1]?.trigger('click')
    expect(wrapper.emitted('click')?.[0]?.[0]).toMatchObject({ value: 'b' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not update model when disabled step is clicked', async () => {
    const wrapper = mount(RsSteps, {
      props: {
        items: [
          { value: 'a', title: 'A' },
          { value: 'b', title: 'B', disabled: true },
        ],
        modelValue: 'a',
        clickable: true,
      },
    })
    await wrapper.findAll('.rs-steps__trigger')[1]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('falls back to first step when model value is unknown', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'missing' },
    })
    expect(wrapper.findAll('.rs-steps__item')[0]?.classes()).toContain('rs-steps__item--process')
  })

  it('sets aria-current on the active step and uses locale label', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsSteps, { items, modelValue: 'b' }),
      },
    })
    expect(wrapper.find('nav.rs-steps').attributes('aria-label')).toBe('Steps')
    const stepItems = wrapper.findAll('.rs-steps__item')
    expect(stepItems[0]?.attributes('aria-current')).toBeUndefined()
    expect(stepItems[1]?.attributes('aria-current')).toBe('step')
    expect(wrapper.text()).toContain('In progress')
  })

  it('uses ariaLabel when provided', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a', ariaLabel: 'Checkout' },
    })
    expect(wrapper.find('nav.rs-steps').attributes('aria-label')).toBe('Checkout')
  })

  it('renders finish and error icons instead of numbers', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'b' },
    })
    const marks = wrapper.findAll('.rs-steps__mark')
    expect(marks[0]?.text()).not.toBe('1')
    expect(marks[1]?.text()).toBe('2')
    expect(wrapper.find('.rs-steps__item--finish .rs-icon').exists()).toBe(true)
  })

  it('renders custom item icons', () => {
    const wrapper = mount(RsSteps, {
      props: {
        items: [
          { value: 'a', title: 'A', icon: 'user' },
          { value: 'b', title: 'B' },
        ],
        modelValue: 'a',
      },
    })
    expect(wrapper.find('.rs-steps__item--process .rs-icon').exists()).toBe(true)
  })

  it('renders percent on the current process indicator', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a', percent: 60 },
    })
    expect(wrapper.find('.rs-steps__indicator--percent').exists()).toBe(true)
  })

  it('moves focus with arrows when clickable and does not change the model', async () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a', clickable: true },
      attachTo: document.body,
    })
    const triggers = wrapper.findAll('button.rs-steps__trigger')
    const first = triggers[0]?.element as HTMLButtonElement
    first.focus()
    await triggers[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(triggers[1]?.element)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('exposes next / prev / goTo / focus', async () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as {
      next: () => string | undefined
      prev: () => string | undefined
      goTo: (value: string) => boolean
      focus: (value?: string) => void
    }
    expect(exposed.next()).toBe('b')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(exposed.prev()).toBe('a')
    expect(exposed.goTo('c')).toBe(true)
    expect(exposed.goTo('missing')).toBe(false)
    exposed.focus('b')
    expect(document.activeElement).toBe(wrapper.findAll('.rs-steps__trigger')[1]?.element)
    wrapper.unmount()
  })

  it('renders title and icon slots', () => {
    const wrapper = mount(RsSteps, {
      props: { items, modelValue: 'a' },
      slots: {
        title: ({ item }: { item: { title: string } }) => `*${item.title}`,
        icon: ({ index }: { index: number }) => `#${index + 1}`,
      },
    })
    expect(wrapper.text()).toContain('*步骤 A')
    expect(wrapper.find('.rs-steps__mark').text()).toBe('#1')
  })
})
