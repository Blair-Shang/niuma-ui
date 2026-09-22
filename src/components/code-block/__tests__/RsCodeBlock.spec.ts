import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsCodeBlock from '../src/RsCodeBlock.vue'
import {
  isCodeBlockDarkTheme,
  mimeForDownloadFilename,
  normalizeHighlightLines,
  readCodeBlockSelection,
  sanitizeDownloadFilename,
  subscribeCodeBlockTheme,
} from '../src/code-block-utils'
import { copyTextToClipboard } from '../../../utils/rs-clipboard'

vi.mock('../../../utils/rs-clipboard', () => ({
  copyTextToClipboard: vi.fn(async () => true),
}))

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

afterEach(() => {
  delete document.documentElement.dataset.rsTheme
  document.documentElement.removeAttribute('data-rs-theme')
})

describe('RsCodeBlock', () => {
  it('registers the public name and does not import reka-ui', () => {
    const source = readFileSync('src/components/code-block/src/RsCodeBlock.vue', 'utf8')
    const utils = readFileSync('src/components/code-block/src/code-block-utils.ts', 'utf8')
    const highlight = readFileSync('src/components/code-block/src/code-block-highlight.ts', 'utf8')
    expect(source).not.toContain('reka-ui')
    expect(utils).not.toContain('reka-ui')
    expect(highlight).not.toContain('reka-ui')
    expect(source).not.toContain('setInterval')
    expect(source).toContain('clearTimeout')
    expect(source).toContain("name: 'RsCodeBlock'")
  })

  it('renders a native figure, language, and copy button', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsCodeBlock, { code: 'const n = 1', lang: 'ts', filename: 'main.ts' }),
      },
    })
    const block = wrapper.find('.rs-code-block')
    expect(block.element.tagName).toBe('FIGURE')
    expect(wrapper.getCurrentComponent().type.name).not.toBe('RsCodeBlock')
    expect(wrapper.findComponent(RsCodeBlock).getCurrentComponent().type.name).toBe('RsCodeBlock')
    expect(block.find('.rs-code-block__lang').text()).toBe('ts')
    expect(block.find('.rs-code-block__file').text()).toBe('main.ts')
    expect(block.find('[role="toolbar"]').attributes('aria-label')).toBe('Code actions')
    expect(block.find('.rs-code-block__editor').attributes('dir')).toBe('ltr')
    wrapper.unmount()
  })

  it('hides the bar and names the figure when showBar is false', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsCodeBlock, { code: 'x', showBar: false, ariaLabel: 'Snippet' }),
      },
    })
    const block = wrapper.find('.rs-code-block')
    expect(block.classes()).toContain('rs-code-block--plain')
    expect(block.find('.rs-code-block__bar').exists()).toBe(false)
    expect(block.attributes('aria-label')).toBe('Snippet')
    wrapper.unmount()
  })

  it('shows a download button and renders the actions slot', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: {
        default: () =>
          h(RsCodeBlock, { code: '<p>hi</p>', downloadFilename: 'page.html' }, {
            actions: () => h('button', { type: 'button', class: 'extra' }, 'Run'),
          }),
      },
    })
    expect(wrapper.find('.extra').text()).toBe('Run')
    expect(wrapper.find('.rs-code-block__actions').text()).toContain('下载')
    expect(wrapper.find('.rs-code-block__actions').text()).toContain('复制')
    wrapper.unmount()
  })

  it('emits copy when the clipboard write succeeds and announces failure otherwise', async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValueOnce(true)
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsCodeBlock, { code: 'hello', lang: 'text' }),
      },
    })
    const block = wrapper.findComponent(RsCodeBlock)
    await block.findAll('button').at(-1)!.trigger('click')
    await flushPromises()
    expect(copyTextToClipboard).toHaveBeenCalledWith('hello')
    expect(block.emitted('copy')?.[0]).toEqual(['hello'])
    expect(block.find('[role="status"]').text()).toBe('Copied!')

    vi.mocked(copyTextToClipboard).mockResolvedValueOnce(false)
    await block.findAll('button').at(-1)!.trigger('click')
    await flushPromises()
    expect(block.emitted('copy')).toHaveLength(1)
    expect(block.find('[role="status"]').text()).toBe('Copy failed')
    wrapper.unmount()
  })

  it('toggles line-number and wrap classes without a second editor', async () => {
    const wrapper = mount(RsCodeBlock, {
      props: { code: 'keep-me', lang: 'text', lineNumbers: false, wordWrap: false },
      attachTo: document.body,
    })
    expect(wrapper.classes()).toContain('rs-code-block--no-lines')
    expect(wrapper.classes()).toContain('rs-code-block--nowrap')
    await wait(60)
    expect(wrapper.findAll('.cm-editor')).toHaveLength(1)
    await wrapper.setProps({ lineNumbers: true, wordWrap: true, editable: true })
    await wait(40)
    expect(wrapper.findAll('.cm-editor')).toHaveLength(1)
    expect(wrapper.classes()).toContain('rs-code-block--editable')
    expect(wrapper.classes()).not.toContain('rs-code-block--no-lines')
    wrapper.unmount()
  })

  it('keeps one editor and the document when lang or theme changes', async () => {
    document.documentElement.dataset.rsTheme = 'dark'
    const wrapper = mount(RsCodeBlock, {
      props: { code: 'keep-me', lang: 'text', editable: true },
      attachTo: document.body,
    })
    await wait(60)
    expect(wrapper.find('.cm-content').text()).toContain('keep-me')
    document.documentElement.dataset.rsTheme = 'light'
    await wait(40)
    expect(wrapper.findAll('.cm-editor')).toHaveLength(1)
    expect(wrapper.find('.cm-content').text()).toContain('keep-me')
    await wrapper.setProps({ lang: 'json', code: 'two' })
    await wait(80)
    expect(wrapper.findAll('.cm-editor')).toHaveLength(1)
    expect(wrapper.find('.cm-content').text()).toContain('two')
    expect(wrapper.emitted('update:code')).toBeUndefined()
    wrapper.unmount()
  })

  it('highlights a line and returns null for an empty selection', async () => {
    const wrapper = mount(RsCodeBlock, {
      props: { code: 'alpha\nbeta\ngamma', lang: 'text', highlightLines: [2, 2, 0] },
      attachTo: document.body,
    })
    await wait(60)
    expect(wrapper.findAll('.cm-rs-code-line--highlight')).toHaveLength(1)
    expect(wrapper.vm.getSelection()).toBeNull()
    wrapper.vm.focus()
    wrapper.unmount()
  })

  it('does not attach an editor after unmount', async () => {
    const wrapper = mount(RsCodeBlock, {
      props: { code: 'x', lang: 'typescript' },
      attachTo: document.body,
    })
    wrapper.unmount()
    await wait(150)
    expect(document.body.querySelector('.cm-editor')).toBeNull()
  })
})

describe('code-block-utils', () => {
  it('sanitizes download names and picks a mime type', () => {
    expect(sanitizeDownloadFilename('..\\dir\\page.HTML')).toBe('page.HTML')
    expect(sanitizeDownloadFilename('../../etc/passwd')).toBe('passwd')
    expect(sanitizeDownloadFilename('')).toBe('download.html')
    expect(sanitizeDownloadFilename('\u0000')).toBe('download.html')
    expect(mimeForDownloadFilename('page.htm')).toBe('text/html;charset=utf-8')
    expect(mimeForDownloadFilename('main.ts')).toBe('text/plain;charset=utf-8')
  })

  it('drops empty selections and out-of-range highlight lines', () => {
    expect(readCodeBlockSelection(true, 'x', 1, 1)).toBeNull()
    expect(readCodeBlockSelection(false, '   ', 1, 1)).toBeNull()
    expect(readCodeBlockSelection(false, 'id', 2, 4)).toEqual({ text: 'id', startLine: 2, endLine: 4 })
    expect(normalizeHighlightLines(undefined, 3)).toEqual([])
    expect(normalizeHighlightLines([0, -1, 1.5, 3, 3, 9, 1], 4)).toEqual([1, 3])
  })

  it('reads the nearest data-rs-theme, including a dark island on a light page', () => {
    document.documentElement.setAttribute('data-rs-theme', 'light')
    const island = document.createElement('div')
    island.setAttribute('data-rs-theme', 'dark')
    const child = document.createElement('div')
    island.append(child)
    document.body.append(island)
    expect(isCodeBlockDarkTheme(child)).toBe(true)
    island.setAttribute('data-rs-theme', 'light')
    expect(isCodeBlockDarkTheme(child)).toBe(false)
    island.remove()
    expect(isCodeBlockDarkTheme(document.body)).toBe(false)
    document.documentElement.setAttribute('data-rs-theme', 'dark')
    expect(isCodeBlockDarkTheme(null)).toBe(true)
  })

  it('shares one theme observer and stops after the last unsubscribe', async () => {
    let calls = 0
    const stopA = subscribeCodeBlockTheme(() => { calls += 1 })
    const stopB = subscribeCodeBlockTheme(() => { calls += 1 })
    document.documentElement.setAttribute('data-rs-theme', 'dark')
    await wait(0)
    expect(calls).toBe(2)
    stopA()
    document.documentElement.setAttribute('data-rs-theme', 'light')
    await wait(0)
    expect(calls).toBe(3)
    stopB()
    document.documentElement.setAttribute('data-rs-theme', 'dark')
    await wait(0)
    expect(calls).toBe(3)
  })
})
