import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsMarkdown from '../components/RsMarkdown.vue'
import {
  escapeHtml,
  isSafeHref,
  isSafeImageSrc,
  renderMarkdown,
  resolveMarkdownHeight,
  resolveMarkdownMode,
} from '../components/markdown-utils'

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

  it('opens http links in a new tab with noopener', () => {
    const html = renderMarkdown('[docs](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
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
})

describe('RsMarkdown', () => {
  it('renders mode toggle and editor by default', async () => {
    const wrapper = mount(RsMarkdown, {
      props: { modelValue: '# hi', height: 200 },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.find('.rs-markdown__toolbar').exists()).toBe(true)
    expect(wrapper.find('.rs-markdown__editor').exists()).toBe(true)
    expect(wrapper.classes()).toContain('rs-markdown--edit')
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
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:mode')?.[0]).toEqual(['preview'])
  })
})
