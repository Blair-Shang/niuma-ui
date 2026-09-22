import { describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsToolbar from '../src/RsToolbar.vue'
import {
  applyToolbarRovingTabindex,
  collectToolbarCommands,
  isToolbarCommand,
  isToolbarTextField,
  nextToolbarIndex,
  resolveToolbarKeyboardDelta,
} from '../src/toolbar-utils'

const sizes = ['ssm', 'sm', 'md', 'lg'] as const
const borders = ['bottom', 'top', 'both', 'none'] as const

describe('toolbar-utils', () => {
  it('classifies text fields vs commands', () => {
    const input = document.createElement('input')
    input.type = 'text'
    const search = document.createElement('input')
    search.type = 'search'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    const button = document.createElement('button')
    const link = document.createElement('a')
    link.setAttribute('href', '#')
    const textarea = document.createElement('textarea')

    expect(isToolbarTextField(input)).toBe(true)
    expect(isToolbarTextField(search)).toBe(true)
    expect(isToolbarTextField(textarea)).toBe(true)
    expect(isToolbarTextField(checkbox)).toBe(false)
    expect(isToolbarTextField(button)).toBe(false)
    expect(isToolbarCommand(button)).toBe(true)
    expect(isToolbarCommand(link)).toBe(true)
    expect(isToolbarCommand(checkbox)).toBe(true)
    expect(isToolbarCommand(input)).toBe(false)
  })

  it('skips disabled and nested commands', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button type="button">A</button>
      <button type="button" disabled>B</button>
      <a href="#ok">C</a>
      <button type="button" class="outer">Outer<span role="button">inner</span></button>
      <input type="text" value="q" />
    `
    const items = collectToolbarCommands(root)
    expect(items.map((el) => el.className || el.textContent?.trim() || el.getAttribute('href'))).toEqual([
      'A',
      'C',
      'outer',
    ])
    expect(items.some((el) => el.tagName === 'SPAN')).toBe(false)
  })

  it('walks index with and without loop', () => {
    expect(nextToolbarIndex(0, 3, -1, true)).toBe(2)
    expect(nextToolbarIndex(2, 3, 1, true)).toBe(0)
    expect(nextToolbarIndex(0, 3, -1, false)).toBe(0)
    expect(nextToolbarIndex(2, 3, 1, false)).toBe(2)
    expect(nextToolbarIndex(-1, 3, 1, true)).toBe(0)
    expect(nextToolbarIndex(0, 0, 1, true)).toBe(-1)
  })

  it('maps keys for orientation and RTL', () => {
    expect(resolveToolbarKeyboardDelta('ArrowRight', 'horizontal', false)).toBe(1)
    expect(resolveToolbarKeyboardDelta('ArrowLeft', 'horizontal', false)).toBe(-1)
    expect(resolveToolbarKeyboardDelta('ArrowRight', 'horizontal', true)).toBe(-1)
    expect(resolveToolbarKeyboardDelta('ArrowDown', 'vertical', false)).toBe(1)
    expect(resolveToolbarKeyboardDelta('ArrowUp', 'vertical', false)).toBe(-1)
    expect(resolveToolbarKeyboardDelta('Home', 'horizontal', false)).toBe('start')
    expect(resolveToolbarKeyboardDelta('End', 'vertical', true)).toBe('end')
    expect(resolveToolbarKeyboardDelta('Tab', 'horizontal', false)).toBeNull()
  })

  it('applies roving tabindex', () => {
    const a = document.createElement('button')
    const b = document.createElement('button')
    const current = applyToolbarRovingTabindex([a, b], b)
    expect(current).toBe(b)
    expect(a.tabIndex).toBe(-1)
    expect(b.tabIndex).toBe(0)
  })
})

describe('RsToolbar', () => {
  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsToolbar)
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.classes()).toContain('rs-toolbar')
  })

  it('registers the Vue component name', () => {
    const wrapper = mount(RsToolbar)
    expect(wrapper.vm.$options.name).toBe('RsToolbar')
  })

  it('renders as header with base class by default', () => {
    const wrapper = mount(RsToolbar)
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.classes()).toContain('rs-toolbar')
    expect(wrapper.classes()).toContain('rs-toolbar--md')
    expect(wrapper.classes()).toContain('rs-toolbar--border-bottom')
    expect(wrapper.classes()).toContain('rs-toolbar--horizontal')
    expect(wrapper.attributes('role')).toBe('toolbar')
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
  })

  it('renders custom root tag', () => {
    const wrapper = mount(RsToolbar, { props: { tag: 'div' } })
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it.each(sizes)('applies %s size class', (size) => {
    const wrapper = mount(RsToolbar, { props: { size } })
    expect(wrapper.classes()).toContain(`rs-toolbar--${size}`)
  })

  it.each(borders)('applies %s border class', (border) => {
    const wrapper = mount(RsToolbar, { props: { border } })
    expect(wrapper.classes()).toContain(`rs-toolbar--border-${border}`)
  })

  it('applies elevated compact wrap sticky and vertical modifiers', () => {
    const wrapper = mount(RsToolbar, {
      props: {
        elevated: true,
        compact: true,
        wrap: true,
        sticky: true,
        orientation: 'vertical',
      },
    })
    expect(wrapper.classes()).toContain('rs-toolbar--elevated')
    expect(wrapper.classes()).toContain('rs-toolbar--compact')
    expect(wrapper.classes()).toContain('rs-toolbar--wrap')
    expect(wrapper.classes()).toContain('rs-toolbar--sticky')
    expect(wrapper.classes()).toContain('rs-toolbar--vertical')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it('writes sticky offset token', () => {
    const wrapper = mount(RsToolbar, { props: { sticky: true, stickyOffset: 8 } })
    expect(wrapper.attributes('style')).toContain('--rs-toolbar-sticky-offset: 8px')
  })

  it('sets aria-label from ariaLabel, then label, then locale', () => {
    const named = mount(RsToolbar, { props: { ariaLabel: 'Query toolbar' } })
    expect(named.attributes('aria-label')).toBe('Query toolbar')

    const compat = mount(RsToolbar, { props: { label: '查询工具栏' } })
    expect(compat.attributes('aria-label')).toBe('查询工具栏')

    const fallback = mount(RsToolbar)
    expect(fallback.attributes('aria-label')).toBeTruthy()
  })

  it('renders default slot into start region', () => {
    const wrapper = mount(RsToolbar, {
      slots: { default: '<span class="title">标题</span>' },
    })
    expect(wrapper.find('.rs-toolbar__start .title').text()).toBe('标题')
    expect(wrapper.find('.rs-toolbar__end').exists()).toBe(false)
    expect(wrapper.find('.rs-toolbar__center').exists()).toBe(false)
  })

  it('renders left / center / right slots', () => {
    const wrapper = mount(RsToolbar, {
      slots: {
        left: '<span class="left">左</span>',
        center: '<span class="center">中</span>',
        right: '<span class="right">右</span>',
      },
    })
    expect(wrapper.find('.rs-toolbar__start .left').text()).toBe('左')
    expect(wrapper.find('.rs-toolbar__center .center').text()).toBe('中')
    expect(wrapper.find('.rs-toolbar__end .right').text()).toBe('右')
  })

  it('marks occupied regions', () => {
    const split = mount(RsToolbar, {
      slots: {
        start: '<span>S</span>',
        end: '<span>E</span>',
      },
    })
    expect(split.classes()).toContain('rs-toolbar--has-start')
    expect(split.classes()).toContain('rs-toolbar--has-end')
    expect(split.classes()).not.toContain('rs-toolbar--has-center')

    const triple = mount(RsToolbar, {
      slots: {
        start: '<span>S</span>',
        center: '<span>C</span>',
        end: '<span>E</span>',
      },
    })
    expect(triple.classes()).toContain('rs-toolbar--has-center')
  })

  it('renders start / end as logical aliases', () => {
    const wrapper = mount(RsToolbar, {
      slots: {
        start: '<span class="start">Start</span>',
        end: '<span class="end">End</span>',
      },
    })
    expect(wrapper.find('.rs-toolbar__start .start').text()).toBe('Start')
    expect(wrapper.find('.rs-toolbar__end .end').text()).toBe('End')
  })

  it('omits start region when no left or default slot', () => {
    const wrapper = mount(RsToolbar, {
      slots: { right: '<button type="button" class="run">运行</button>' },
    })
    expect(wrapper.find('.rs-toolbar__start').exists()).toBe(false)
    expect(wrapper.find('.rs-toolbar__end .run').text()).toBe('运行')
  })

  it('disables the chrome with inert', async () => {
    const wrapper = mount(RsToolbar, {
      props: { disabled: true },
      slots: { default: '<button type="button">Run</button>' },
    })
    expect(wrapper.classes()).toContain('rs-toolbar--disabled')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('inert')).toBeDefined()
  })

  it('moves focus with arrow keys when keyboard is on', async () => {
    const wrapper = mount(RsToolbar, {
      attachTo: document.body,
      slots: {
        default: `
          <button type="button" class="a">A</button>
          <button type="button" class="b">B</button>
          <button type="button" class="c">C</button>
        `,
      },
    })
    await flushPromises()
    await nextTick()
    const first = wrapper.find('button.a').element as HTMLButtonElement
    const second = wrapper.find('button.b').element as HTMLButtonElement
    first.focus()
    expect(document.activeElement).toBe(first)
    await wrapper.find('button.a').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(second)
    await wrapper.find('button.b').trigger('keydown', { key: 'End' })
    expect((document.activeElement as HTMLElement).classList.contains('c')).toBe(true)
    await wrapper.find('button.c').trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(first)
    wrapper.unmount()
  })

  it('does not steal keys from a text field', async () => {
    const wrapper = mount(RsToolbar, {
      attachTo: document.body,
      slots: {
        default: `
          <button type="button" class="a">A</button>
          <input class="q" type="text" />
        `,
      },
    })
    await flushPromises()
    const input = wrapper.find('input.q').element as HTMLInputElement
    input.focus()
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('exposes focus and blur', async () => {
    const wrapper = mount(RsToolbar, {
      attachTo: document.body,
      slots: {
        default: '<button type="button" class="run">Run</button>',
      },
    })
    await flushPromises()
    const exposed = wrapper.vm as unknown as { focus: () => void; blur: () => void }
    exposed.focus()
    expect((document.activeElement as HTMLElement).classList.contains('run')).toBe(true)
    exposed.blur()
    expect(document.activeElement).not.toBe(wrapper.find('button.run').element)
    wrapper.unmount()
  })
})
