import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsCodeEditor from '../src/RsCodeEditor.vue'
import {
  codeEditorModShortcut,
  resolveCodeEditorLanguage,
  resolveCodeEditorSize,
  resolveCodeEditorTheme,
  subscribeDocumentTheme,
} from '../src/code-editor-utils'
import { resolveCodeMirrorLanguage } from '../src/code-mirror-lang'
import { isEditorViewAlive } from '../src/code-mirror-session'

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
    wrapper.unmount()
  })

  it('applies theme class', () => {
    const wrapper = mount(RsCodeEditor, {
      props: { theme: 'dark' },
    })
    expect(wrapper.classes()).toContain('rs-code-editor--dark')
    expect(wrapper.attributes('data-rs-theme')).toBe('dark')
    wrapper.unmount()
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
    wrapper.unmount()
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
    wrapper.unmount()
  })

  it('keeps rounded corners by default', () => {
    const wrapper = mount(RsCodeEditor, {
      props: { modelValue: 'select 1' },
    })
    expect(wrapper.classes()).not.toContain('rs-code-editor--square')
    expect(wrapper.classes()).not.toContain('rs-code-editor--embedded')
    wrapper.unmount()
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
    expect(items[0].find('button').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders toolbar slot', () => {
    const wrapper = mount(RsCodeEditor, {
      slots: { toolbar: '<button type="button" class="save-btn">Save</button>' },
    })
    expect(wrapper.find('.save-btn').exists()).toBe(true)
    wrapper.unmount()
  })

  it('registers the public name and does not import reka-ui', () => {
    expect(RsCodeEditor.name).toBe('RsCodeEditor')
    const dir = 'src/components/code-editor/src'
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.vue') && !file.endsWith('.ts')) continue
      const source = readFileSync(`${dir}/${file}`, 'utf8')
      expect(source).not.toContain('reka-ui')
    }
    const vue = readFileSync(`${dir}/RsCodeEditor.vue`, 'utf8')
    expect(vue).not.toContain('描述要如何修改选区')
    expect(vue).toContain('codeEditor.inlineEdit')
    const wrapper = mount(RsCodeEditor, { props: { ariaLabel: 'SQL editor' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('SQL editor')
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    wrapper.unmount()
  })

  it('islands an explicit theme and leaves auto on the page', () => {
    document.documentElement.dataset.rsTheme = 'dark'
    const island = mount(RsCodeEditor, { props: { theme: 'light' } })
    expect(island.classes()).toContain('rs-code-editor--light')
    expect(island.attributes('data-rs-theme')).toBe('light')
    island.unmount()
    const auto = mount(RsCodeEditor, { props: { theme: 'auto' } })
    expect(auto.attributes('data-rs-theme')).toBeUndefined()
    expect(auto.classes()).toContain('rs-code-editor--dark')
    auto.unmount()
  })

  it('focuses and moves the cursor after ready', async () => {
    const wrapper = mount(RsCodeEditor, {
      props: { modelValue: 'alpha\nbeta', autofocus: false },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 80))
    wrapper.vm.focus()
    wrapper.vm.goToPosition(2, 1)
    expect(document.activeElement?.className ?? '').toContain('cm-content')
    wrapper.unmount()
  })

  it('shares the document theme observer and drops it after the last unsubscribe', async () => {
    let calls = 0
    const stopA = subscribeDocumentTheme(() => { calls += 1 })
    const stopB = subscribeDocumentTheme(() => { calls += 1 })
    document.documentElement.dataset.rsTheme = document.documentElement.dataset.rsTheme === 'dark' ? 'light' : 'dark'
    await new Promise((r) => setTimeout(r, 30))
    expect(calls).toBeGreaterThanOrEqual(2)
    stopA()
    stopA()
    const afterFirst = calls
    document.documentElement.dataset.rsTheme = document.documentElement.dataset.rsTheme === 'dark' ? 'light' : 'dark'
    await new Promise((r) => setTimeout(r, 30))
    expect(calls).toBeGreaterThan(afterFirst)
    stopB()
    const afterLast = calls
    document.documentElement.dataset.rsTheme = document.documentElement.dataset.rsTheme === 'dark' ? 'light' : 'dark'
    await new Promise((r) => setTimeout(r, 30))
    expect(calls).toBe(afterLast)
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

  it('labels the modifier key without a navigator as Ctrl', () => {
    expect(codeEditorModShortcut('K')).toMatch(/K$/)
  })

  it('treats a missing editor view as dead', () => {
    expect(isEditorViewAlive(null)).toBe(false)
    expect(isEditorViewAlive(undefined)).toBe(false)
  })

  it('loads a toml grammar', async () => {
    const extensions = await resolveCodeMirrorLanguage('toml')
    expect(extensions.length).toBeGreaterThan(0)
  })
})
