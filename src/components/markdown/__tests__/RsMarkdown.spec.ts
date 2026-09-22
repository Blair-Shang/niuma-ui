import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsMarkdown from '../src/RsMarkdown.vue'
import {
  applyMarkdownTabMove,
  escapeHtml,
  isSafeHref,
  isSafeImageSrc,
  nearestMarkdownThemeHost,
  renderMarkdown,
  resolveMarkdownEditorTheme,
  resolveMarkdownHeight,
  resolveMarkdownMode,
  resolveMarkdownTabMove,
} from '../src/markdown-utils'

describe('markdown-utils', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">'"&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&quot;&amp;')
  })

  it('allows safe href / image protocols', () => {
    expect(isSafeHref('https://example.com')).toBe(true)
    expect(isSafeHref('/docs')).toBe(true)
    expect(isSafeHref('#section')).toBe(true)
    expect(isSafeHref('mailto:a@b.com')).toBe(true)
    expect(isSafeHref('javascript:alert(1)')).toBe(false)
    expect(isSafeImageSrc('https://cdn.example.com/a.png')).toBe(true)
    expect(isSafeImageSrc('data:image/png;base64,xx')).toBe(true)
    expect(isSafeImageSrc('javascript:alert(1)')).toBe(false)
  })

  it('renders GFM headings, lists and code safely', () => {
    const html = renderMarkdown('# Hello\n\n- item\n\n```js\nconst a = 1\n```')
    expect(html).toContain('<h1')
    expect(html).toContain('<li>')
    expect(html).toContain('rs-markdown__codeblock')
    expect(html).toContain('const a = 1')
    expect(html).not.toContain('<script')
  })

  it('strips javascript links and keeps link text', () => {
    const html = renderMarkdown('[x](javascript:alert(1))')
    expect(html).toContain('x')
    expect(html).not.toContain('javascript:')
  })

  it('keeps GFM table alignment attributes', () => {
    const html = renderMarkdown('| a | b |\n| ---: | :---: |\n| 1 | 2 |')
    expect(html).toContain('align="right"')
    expect(html).toContain('align="center"')
  })

  it('opens http links in a new tab with noopener', () => {
    const html = renderMarkdown('[docs](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('autolinks bare http addresses', () => {
    const html = renderMarkdown('然后打开 http://127.0.0.1:3000')
    expect(html).toContain('href="http://127.0.0.1:3000"')
    expect(html).toContain('target="_blank"')
  })

  it('turns inline-code http addresses into links', () => {
    const html = renderMarkdown('然后打开 `http://127.0.0.1:3000`')
    expect(html).toContain('<code>http://127.0.0.1:3000</code>')
    expect(html).toContain('href="http://127.0.0.1:3000"')
    expect(html).toContain('target="_blank"')
  })

  it('does not linkify inline code that is not a URL', () => {
    const html = renderMarkdown('run `npm start`')
    expect(html).toContain('<code>npm start</code>')
    expect(html).not.toContain('href=')
  })

  it('renders GFM task lists without input tags', () => {
    const html = renderMarkdown('- [ ] todo\n- [x] done')
    expect(html).toContain('rs-markdown__task')
    expect(html).toContain('rs-markdown__task--on')
    expect(html.toLowerCase()).not.toContain('<input')
  })

  it('strips raw HTML input tags', () => {
    const html = renderMarkdown('Hello <input type="text" name="x">')
    expect(html.toLowerCase()).not.toContain('<input')
  })

  it('sanitizes raw HTML injection', () => {
    const html = renderMarkdown('Hello <img src=x onerror=alert(1)>')
    expect(html.toLowerCase()).not.toContain('onerror')
  })

  it('resolves height and readonly mode', () => {
    expect(resolveMarkdownHeight()).toBe('16rem')
    expect(resolveMarkdownHeight(240)).toBe('240px')
    expect(resolveMarkdownHeight('12rem')).toBe('12rem')
    expect(resolveMarkdownMode('edit', true)).toBe('preview')
    expect(resolveMarkdownMode('split', false)).toBe('split')
    expect(resolveMarkdownMode(undefined, false)).toBe('edit')
  })

  it('keeps hash and relative links in the same tab', () => {
    const hash = renderMarkdown('[top](#top)')
    expect(hash).toContain('href="#top"')
    expect(hash).not.toContain('target="_blank"')
    const page = renderMarkdown('[guide](docs/guide)')
    expect(page).toContain('href="docs/guide"')
    expect(page).not.toContain('target="_blank"')
  })

  it('allows tel links and rejects control characters', () => {
    expect(isSafeHref('tel:+1-555-0100')).toBe(true)
    expect(renderMarkdown('[call](tel:+1-555-0100)')).toContain('href="tel:+1-555-0100"')
    expect(isSafeHref('java\nscript:alert(1)')).toBe(false)
    expect(isSafeHref('//evil.example')).toBe(false)
  })

  it('allows same-origin images and rejects svg data urls', () => {
    expect(isSafeImageSrc('/img/a.png')).toBe(true)
    expect(isSafeImageSrc('images/a.png')).toBe(true)
    expect(isSafeImageSrc('data:image/svg+xml;base64,PHN2Zy8+')).toBe(false)
    const kept = renderMarkdown('![diagram](/img/a.png)')
    expect(kept).toContain('src="/img/a.png"')
    const dropped = renderMarkdown('![diagram](data:image/svg+xml;base64,PHN2Zy8+)')
    expect(dropped).not.toContain('svg')
    expect(dropped).toContain('diagram')
  })

  it('adds stable heading ids and keeps code left to right', () => {
    const html = renderMarkdown('# Hello World\n\n# Hello World\n\n```js\nconst a = 1\n```')
    expect(html).toContain('id="hello-world"')
    expect(html).toContain('id="hello-world-2"')
    expect(html).toContain('dir="ltr"')
    expect(renderMarkdown('# 发布说明')).toContain('id="发布说明"')
  })

  it('names task items and external links for assistive tech', () => {
    const tasks = renderMarkdown('- [x] done', { taskDoneLabel: 'done-label', taskOpenLabel: 'open-label' })
    expect(tasks).toContain('done-label')
    expect(tasks).not.toContain('<input')
    const link = renderMarkdown('[docs](https://example.com)', { externalLabel: 'new-tab' })
    expect(link).toContain('new-tab')
    expect(link).toContain('rel="noopener noreferrer"')
  })

  it('returns empty html when document is missing', () => {
    const doc = globalThis.document
    // @ts-expect-error 模拟 SSR
    delete globalThis.document
    try {
      expect(renderMarkdown('# Hi')).toBe('')
    } finally {
      globalThis.document = doc
    }
  })

  it('resolves tab moves and theme islands', () => {
    expect(resolveMarkdownTabMove('ArrowRight', false)).toBe(1)
    expect(resolveMarkdownTabMove('ArrowRight', true)).toBe(-1)
    expect(resolveMarkdownTabMove('ArrowLeft', true)).toBe(1)
    expect(resolveMarkdownTabMove('Home', false)).toBe('start')
    expect(resolveMarkdownTabMove('Enter', false)).toBeNull()
    expect(applyMarkdownTabMove('edit', 1)).toBe('preview')
    expect(applyMarkdownTabMove('edit', -1)).toBe('split')
    expect(applyMarkdownTabMove('preview', 'end')).toBe('split')
    expect(resolveMarkdownEditorTheme('dark', null)).toBe('dark')
    expect(resolveMarkdownEditorTheme('auto', null)).toBe('auto')
    expect(resolveMarkdownEditorTheme('auto', 'dark')).toBe('dark')

    const island = document.createElement('div')
    island.setAttribute('data-rs-theme', 'dark')
    const child = document.createElement('div')
    island.append(child)
    document.body.append(island)
    expect(nearestMarkdownThemeHost(child)).toBe(island)
    expect(nearestMarkdownThemeHost(document.body)).toBeNull()
    island.remove()
  })
})

describe('RsMarkdown', () => {
  it('registers the public name and does not import reka-ui', () => {
    const source = readFileSync('src/components/markdown/src/RsMarkdown.vue', 'utf8')
    const utils = readFileSync('src/components/markdown/src/markdown-utils.ts', 'utf8')
    expect(source).not.toContain('reka-ui')
    expect(utils).not.toContain('reka-ui')
    expect(source).toContain("name: 'RsMarkdown'")
    expect(source).toContain('clearTimeout')
    expect(source).toContain('observer.disconnect')
    expect(source).not.toContain('setInterval')
    expect(source).not.toContain('addEventListener')
  })

  it('renders mode toggle and editor by default', async () => {
    const wrapper = mount(RsMarkdown, {
      props: { modelValue: '# hi', height: 200 },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.find('.rs-markdown__toolbar').exists()).toBe(true)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(wrapper.find('.rs-markdown__editor').exists()).toBe(true)
    expect(wrapper.find('.rs-markdown__prose').exists()).toBe(false)
    expect(wrapper.classes()).toContain('rs-markdown--edit')
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeTruthy()
    wrapper.unmount()
  })

  it('switches to preview and renders HTML', async () => {
    const wrapper = mount(RsMarkdown, {
      props: {
        modelValue: '## Title\n\nHello',
        mode: 'preview',
        height: 180,
      },
    })
    expect(wrapper.classes()).toContain('rs-markdown--preview')
    expect(wrapper.find('.rs-markdown__prose').html()).toContain('<h2')
    expect(wrapper.find('.rs-markdown__prose').text()).toContain('Hello')
  })

  it('supports split mode with editor and preview', async () => {
    const wrapper = mount(RsMarkdown, {
      props: {
        modelValue: '**bold**',
        mode: 'split',
        height: 220,
      },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.classes()).toContain('rs-markdown--split')
    expect(wrapper.find('.rs-markdown__editor').exists()).toBe(true)
    expect(wrapper.find('.rs-markdown__preview').exists()).toBe(true)
    wrapper.unmount()
  })

  it('forces preview and hides toggle when readonly', () => {
    const wrapper = mount(RsMarkdown, {
      props: {
        modelValue: 'note',
        mode: 'edit',
        readonly: true,
      },
    })
    expect(wrapper.classes()).toContain('rs-markdown--preview')
    expect(wrapper.find('.rs-markdown__toolbar').exists()).toBe(false)
    expect(wrapper.find('.rs-markdown__editor').exists()).toBe(false)
  })

  it('shows empty state when preview has no content', () => {
    const wrapper = mount(RsMarkdown, {
      props: {
        modelValue: '   ',
        mode: 'preview',
      },
    })
    expect(wrapper.find('.rs-markdown__empty').exists()).toBe(true)
  })

  it('emits mode updates from toolbar', async () => {
    const wrapper = mount(RsMarkdown, {
      props: {
        modelValue: 'x',
        mode: 'edit',
      },
    })
    const buttons = wrapper.findAll('.rs-markdown__toolbar button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    expect(buttons[0]!.attributes('role')).toBe('tab')
    expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    expect(buttons[0]!.attributes('tabindex')).toBe('0')
    expect(buttons[1]!.attributes('tabindex')).toBe('-1')
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:mode')?.[0]).toEqual(['preview'])
    wrapper.unmount()
  })

  it('moves the mode from the tablist keyboard', async () => {
    const wrapper = mount(RsMarkdown, {
      props: { modelValue: 'x', mode: 'edit', height: 160 },
      attachTo: document.body,
    })
    await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:mode')?.[0]).toEqual(['preview'])
    await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:mode')?.at(-1)).toEqual(['split'])
    wrapper.unmount()
  })

  it('paints an explicit dark island and focuses the preview', () => {
    const wrapper = mount(RsMarkdown, {
      props: { modelValue: 'Hello', mode: 'preview', theme: 'dark' },
      attachTo: document.body,
    })
    expect(wrapper.attributes('data-rs-theme')).toBe('dark')
    wrapper.vm.focus()
    expect(document.activeElement).toBe(wrapper.get('.rs-markdown__body').element)
    wrapper.unmount()
  })

  it('does not focus while disabled', () => {
    const wrapper = mount(RsMarkdown, {
      props: { modelValue: 'Hello', mode: 'preview', disabled: true },
      attachTo: document.body,
    })
    wrapper.vm.focus()
    expect(document.activeElement).not.toBe(wrapper.get('.rs-markdown__body').element)
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    wrapper.unmount()
  })

  it('debounces preview updates and drops them after unmount', async () => {
    const wrapper = mount(RsMarkdown, {
      props: { modelValue: 'Hello', mode: 'preview' },
    })
    expect(wrapper.get('.rs-markdown__prose').text()).toContain('Hello')
    await wrapper.setProps({ modelValue: 'Next' })
    expect(wrapper.get('.rs-markdown__prose').text()).toContain('Hello')
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(wrapper.get('.rs-markdown__prose').text()).toContain('Next')
    await wrapper.setProps({ modelValue: 'Later' })
    wrapper.unmount()
    await new Promise((resolve) => setTimeout(resolve, 80))
  })
})
