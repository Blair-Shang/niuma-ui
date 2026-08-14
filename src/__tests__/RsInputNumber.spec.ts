import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsInputNumber from '../components/RsInputNumber.vue'
import {
  clampNumber,
  formatNumberValue,
  fromModelValue,
  isNumberInputInterim,
  normalizeCommittedNumber,
  parseNumberInput,
  stepNumberValue,
  toModelValue,
} from '../components/input-number-utils'

describe('input-number-utils', () => {
  it('parses and rejects invalid text', () => {
    expect(parseNumberInput('12.5')).toBe(12.5)
    expect(parseNumberInput('')).toBeNull()
    expect(parseNumberInput('-')).toBeNull()
    expect(parseNumberInput('abc')).toBeNull()
  })

  it('detects interim typing states', () => {
    expect(isNumberInputInterim('-')).toBe(true)
    expect(isNumberInputInterim('+')).toBe(true)
    expect(isNumberInputInterim('1.')).toBe(true)
    expect(isNumberInputInterim('1e')).toBe(true)
    expect(isNumberInputInterim('12')).toBe(false)
  })

  it('steps with precision and clamps', () => {
    expect(stepNumberValue(1, 1, { step: 0.1, precision: 1 })).toBe(1.1)
    expect(stepNumberValue(9, 1, { step: 1, max: 9 })).toBe(9)
    expect(stepNumberValue(null, 1, { step: 1 })).toBe(1)
  })

  it('normalizes commit with min/max/precision', () => {
    expect(normalizeCommittedNumber('3.456', { precision: 2 })).toBe(3.46)
    expect(normalizeCommittedNumber('100', { max: 10 })).toBe(10)
    expect(normalizeCommittedNumber('-', {})).toBeNull()
  })

  it('converts model modes', () => {
    expect(toModelValue(3, false)).toBe(3)
    expect(toModelValue(3, true)).toBe('3')
    expect(fromModelValue('2.5')).toBe(2.5)
    expect(clampNumber(20, 0, 10)).toBe(10)
    expect(formatNumberValue(1.2, { precision: 2 })).toBe('1.20')
  })
})

describe('RsInputNumber', () => {
  function mountNumber(props: Record<string, unknown> = {}) {
    const state = { value: (props.modelValue ?? null) as unknown }
    const wrapper = mount(RsInputNumber, {
      props: {
        ...props,
        modelValue: state.value as never,
        'onUpdate:modelValue': (v: unknown) => {
          state.value = v
          void wrapper.setProps({ modelValue: v as never })
        },
      },
    })
    return { wrapper, state }
  }

  it('emits number by default', async () => {
    const { wrapper, state } = mountNumber({ modelValue: 1 })
    const input = wrapper.find('input')
    await input.setValue('42')
    await input.trigger('blur')
    expect(state.value).toBe(42)
  })

  it('emits string in stringMode', async () => {
    const { wrapper, state } = mountNumber({ modelValue: '1', stringMode: true })
    const input = wrapper.find('input')
    await input.setValue('256')
    await input.trigger('blur')
    expect(state.value).toBe('256')
    expect(typeof state.value).toBe('string')
  })

  it('steps via controls and clamps to max', async () => {
    const { wrapper, state } = mountNumber({
      modelValue: 9,
      step: 1,
      max: 10,
      controls: true,
    })
    const up = wrapper.find('.rs-input-number__handler--up')
    await up.trigger('click')
    await nextTick()
    expect(state.value).toBe(10)
    await up.trigger('click')
    await nextTick()
    expect(state.value).toBe(10)
  })

  it('supports keyboard arrow steps', async () => {
    const { wrapper, state } = mountNumber({ modelValue: 5, step: 2, keyboard: true })
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(state.value).toBe(7)
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(state.value).toBe(5)
  })

  it('ignores wheel when changeOnWheel is off', async () => {
    const { wrapper, state } = mountNumber({ modelValue: 5, step: 1 })
    const input = wrapper.find('input')
    await input.trigger('focus')
    await input.trigger('wheel', { deltaY: -100 })
    expect(state.value).toBe(5)
  })

  it('steps on wheel when changeOnWheel is on and focused', async () => {
    const { wrapper, state } = mountNumber({
      modelValue: 5,
      step: 1,
      changeOnWheel: true,
    })
    const input = wrapper.find('input')
    await input.trigger('focus')
    await input.trigger('wheel', { deltaY: -100 })
    expect(state.value).toBe(6)
    await input.trigger('wheel', { deltaY: 100 })
    expect(state.value).toBe(5)
  })

  it('ignores wheel when changeOnWheel is on but not focused', async () => {
    const { wrapper, state } = mountNumber({
      modelValue: 5,
      step: 1,
      changeOnWheel: true,
    })
    const input = wrapper.find('input')
    await input.trigger('wheel', { deltaY: -100 })
    expect(state.value).toBe(5)
  })

  it('clears to null on empty blur', async () => {
    const { wrapper, state } = mountNumber({ modelValue: 3 })
    const input = wrapper.find('input')
    await input.setValue('')
    await input.trigger('blur')
    expect(state.value).toBeNull()
  })
})
