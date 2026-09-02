import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsCodeEditor from '../components/RsCodeEditor.vue'
import {
  resolveCodeEditorLanguage,
  resolveCodeEditorSize,
  resolveCodeEditorTheme,
} from '../components/code-editor-utils'

describe('RsCodeEditor', () => {
  it('renders CodeMirror surface', async () => {
    const wrapper = mount(RsCodeEditor, {
      props: { modelValue: 'hello' },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.find('.rs-code-editor__surface').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows resolved language label in toolbar', () => {
    const wrapper = mount(RsCodeEditor, {
      props: { language: 'typescript' },
    })
    expect(wrapper.find('.rs-code-editor__toolbar').text()).toContain('TypeScript')
  })

  it('applies theme class', () => {
    const wrapper = mount(RsCodeEditor, {
      props: { theme: 'dark' },
    })
    expect(wrapper.classes()).toContain('rs-code-editor--dark')
  })

  it('keeps document when data-rs-theme changes', async () => {
    document.documentElement.dataset.rsTheme = 'dark'
    const wrapper = mount(RsCodeEditor, {
      props: { modelValue: 'keep-me', theme: 'auto', showToolbar: false },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 80))
    expect(wrapper.find('.cm-content').text()).toContain('keep-me')
    document.documentElement.dataset.rsTheme = 'light'
    await new Promise((r) => setTimeout(r, 80))
    expect(wrapper.find('.cm-content').text()).toContain('keep-me')
    expect(wrapper.classes()).toContain('rs-code-editor--light')
    wrapper.unmount()
  })

  it('sets height from number prop', () => {
    const wrapper = mount(RsCodeEditor, {
      props: { height: 200 },
    })
    expect(wrapper.attributes('style')).toContain('height: 200px')
  })

  it('supports embedded square chrome without consumer deep styles', () => {
    const wrapper = mount(RsCodeEditor, {
      props: {
        embedded: true,
        rounded: false,
        foldGutter: false,
        gutterWidth: 40,
        showToolbar: false,
      },
    })
    expect(wrapper.classes()).toContain('rs-code-editor--embedded')
    expect(wrapper.classes()).toContain('rs-code-editor--square')
    expect(wrapper.classes()).toContain('rs-code-editor--no-fold')
    expect(wrapper.classes()).toContain('rs-code-editor--gutter-fixed')
    expect(wrapper.attributes('style')).toContain('--rs-code-editor-gutter-width: 40px')
  })

  it('keeps rounded corners by default', () => {
    const wrapper = mount(RsCodeEditor, {
      props: { modelValue: 'select 1' },
    })
    expect(wrapper.classes()).not.toContain('rs-code-editor--square')
    expect(wrapper.classes()).not.toContain('rs-code-editor--embedded')
  })

  it('renders diagnostics with severity classes', () => {
    const wrapper = mount(RsCodeEditor, {
      props: {
        diagnostics: [
          { message: 'Syntax error', line: 1, column: 3, severity: 'error' },
          { message: 'Unused var', severity: 'warning' },
        ],
      },
    })
    const items = wrapper.findAll('.rs-code-editor__diagnostics li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('1:3')
    expect(items[0].text()).toContain('Syntax error')
    expect(items[0].classes()).toContain('rs-code-editor__diagnostic--error')
    expect(items[1].classes()).toContain('rs-code-editor__diagnostic--warning')
  })

  it('renders toolbar slot', () => {
    const wrapper = mount(RsCodeEditor, {
      slots: { toolbar: '<button type="button" class="save-btn">Save</button>' },
    })
    expect(wrapper.find('.save-btn').exists()).toBe(true)
  })
})

describe('code-editor-utils', () => {
  it('resolves supported languages', () => {
    expect(resolveCodeEditorLanguage('json')).toBe('json')
    expect(resolveCodeEditorLanguage('go')).toBe('go')
    expect(resolveCodeEditorLanguage('xml')).toBe('xml')
    expect(resolveCodeEditorLanguage('unknown')).toBe('plaintext')
  })

  it('resolves theme', () => {
    document.documentElement.dataset.rsTheme = 'light'
    expect(resolveCodeEditorTheme('auto')).toBe('light')
    expect(resolveCodeEditorTheme('dark')).toBe('dark')
  })

  it('resolves editor height', () => {
    expect(resolveCodeEditorSize()).toBe('20rem')
    expect(resolveCodeEditorSize(240)).toBe('240px')
    expect(resolveCodeEditorSize('16rem')).toBe('16rem')
  })
})
