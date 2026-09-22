import { readFileSync } from 'node:fs'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import RsTerminal from '../src/RsTerminal.vue'
import {
  buildAnsiColorDemo,
  findTerminalHttpLinks,
  isSafeTerminalLink,
  normalizeTerminalHexColor,
  resolveTerminalTheme,
  terminalCellIndexForString,
  terminalLinkCellRange,
  terminalThemeSubscriptionCount,
} from '../src/terminal-utils'

vi.mock('../../../utils/rs-clipboard', () => ({
  beginClipboardPrefetch: vi.fn(),
  copyTextToClipboard: vi.fn().mockResolvedValue(true),
  readClipboardText: vi.fn().mockResolvedValue('pasted'),
}))

const fitMock = vi.fn()
const writeMock = vi.fn()
const clearMock = vi.fn()
const focusMock = vi.fn()
const disposeMock = vi.fn()
const selectAllMock = vi.fn()
const clearSelectionMock = vi.fn()
const hasSelectionMock = vi.fn(() => false)
const getSelectionMock = vi.fn(() => '')
const onDataHandlers: Array<(data: string) => void> = []
const onSelectionHandlers: Array<() => void> = []
const onRenderHandlers: Array<() => void> = []
const onScrollHandlers: Array<() => void> = []
let pasteMock = vi.fn()
let keyEventHandler: ((event: KeyboardEvent) => boolean) | null = null
let lastTerminalOptions: Record<string, unknown> = {}

const bufferMock = {
  baseY: 0,
  cursorY: 0,
  viewportY: 0,
  length: 1,
}

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit = fitMock
    proposeDimensions = () => ({ cols: 80, rows: 24 })
  },
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    cols = 80
    rows = 24
    options: Record<string, unknown> = {}
    constructor(options: Record<string, unknown> = {}) {
      lastTerminalOptions = options
      this.options = { ...options }
    }
    buffer = {
      active: bufferMock,
    }
    loadAddon() {
      return undefined
    }
    open() {
      return undefined
    }
    onData(handler: (data: string) => void) {
      onDataHandlers.push(handler)
      return { dispose: vi.fn() }
    }
    onSelectionChange(handler: () => void) {
      onSelectionHandlers.push(handler)
      return { dispose: vi.fn() }
    }
    onTitleChange() {
      return { dispose: vi.fn() }
    }
    onBell() {
      return { dispose: vi.fn() }
    }
    registerLinkProvider() {
      return { dispose: vi.fn() }
    }
    onRender(handler: () => void) {
      onRenderHandlers.push(handler)
      return { dispose: vi.fn() }
    }
    onScroll(handler: () => void) {
      onScrollHandlers.push(handler)
      return { dispose: vi.fn() }
    }
    registerMarker() {
      return { dispose: vi.fn() }
    }
    registerDecoration() {
      return { dispose: vi.fn() }
    }
    attachCustomKeyEventHandler(handler: (event: KeyboardEvent) => boolean) {
      keyEventHandler = handler
    }
    hasSelection = hasSelectionMock
    getSelection = getSelectionMock
    selectAll = selectAllMock
    clearSelection = clearSelectionMock
    paste = pasteMock
    element = document.createElement('div')
    write = writeMock
    clear = clearMock
    focus = focusMock
    dispose = disposeMock
  },
}))

beforeAll(() => {
  class ResizeObserverMock {
    observe() {
      return undefined
    }
    disconnect() {
      return undefined
    }
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
})

describe('terminal-utils', () => {
  it('builds ansi color demo text', () => {
    const demo = buildAnsiColorDemo()
    expect(demo).toContain('ANSI 16 colors')
    expect(demo).toContain('\x1b[31m')
    expect(demo).toContain('ls --color symlink')
    expect(demo).toContain('\x1b[01;36;40m')
    expect(demo).toContain('\x1b[40;31;01m')
  })

  it('resolves document theme and a nested theme island', () => {
    document.documentElement.dataset.rsTheme = 'light'
    expect(resolveTerminalTheme('auto')).toBe('light')
    document.documentElement.dataset.rsTheme = 'dark'
    expect(resolveTerminalTheme('auto')).toBe('dark')
    document.documentElement.dataset.rsTheme = 'light'
    const island = document.createElement('div')
    island.setAttribute('data-rs-theme', 'dark')
    const host = document.createElement('div')
    island.appendChild(host)
    expect(resolveTerminalTheme('auto', host)).toBe('dark')
    expect(resolveTerminalTheme('light', host)).toBe('light')
  })

  it('accepts only http(s) and mailto links', () => {
    expect(isSafeTerminalLink('https://example.com/a')).toBe(true)
    expect(isSafeTerminalLink('mailto:dev@example.com')).toBe(true)
    expect(isSafeTerminalLink('javascript:alert(1)')).toBe(false)
    expect(isSafeTerminalLink('data:text/html,hi')).toBe(false)
    const hits = findTerminalHttpLinks('see https://example.com/docs. and mailto:dev@example.com')
    expect(hits.map((hit) => hit.text)).toEqual(['https://example.com/docs', 'mailto:dev@example.com'])
    const cells = [
      { chars: '你', width: 2 },
      { chars: '', width: 0 },
      { chars: 'h', width: 1 },
    ]
    expect(terminalCellIndexForString(cells, 1)).toBe(3)
    expect(terminalLinkCellRange(cells, 1, 2)).toEqual({ startX: 3, endX: 3 })
  })

  it('normalizes terminal hex colors', () => {
    expect(normalizeTerminalHexColor('#181818')).toBe('#181818')
    expect(normalizeTerminalHexColor('#abc')).toBe('#aabbcc')
    expect(normalizeTerminalHexColor('rgb(246, 246, 246)')).toBe('#f6f6f6')
    expect(normalizeTerminalHexColor('rgb(248 248 248)')).toBe('#f8f8f8')
    expect(normalizeTerminalHexColor('rgb(0 0 0)')).toBe('#000000')
  })

  it('detects tui refresh sequences', async () => {
    const { containsTuiRefreshSequence } = await import('../src/terminal-utils')
    expect(containsTuiRefreshSequence('\x1b[2J')).toBe(true)
    expect(containsTuiRefreshSequence('\x1b[1;1H')).toBe(true)
    expect(containsTuiRefreshSequence('plain log line')).toBe(false)
  })

  it('detects full screen clear sequences', async () => {
    const { containsFullScreenClear, startsWithCursorHome } = await import('../src/terminal-utils')
    expect(containsFullScreenClear('\x1b[2J')).toBe(true)
    expect(containsFullScreenClear('\x1b[2;0H')).toBe(false)
    expect(startsWithCursorHome('\x1b[Hsummary')).toBe(true)
    expect(startsWithCursorHome(' \x1b[1;1H')).toBe(true)
    expect(startsWithCursorHome('process line')).toBe(false)
  })

  it('fits only rows that fully fit the host height', async () => {
    const { computeFittedTerminalRows, proposeTerminalGeometry } = await import(
      '../src/terminal-utils'
    )
    expect(computeFittedTerminalRows(720, 16.8)).toBe(42)
    expect(computeFittedTerminalRows(720, 17.5)).toBe(41)
    expect(computeFittedTerminalRows(0, 17)).toBeNull()
    expect(computeFittedTerminalRows(800, 2)).toBeNull()
    expect(proposeTerminalGeometry(1600, 720, 8, 16.8, 14)).toEqual({ cols: 198, rows: 42 })
    expect(proposeTerminalGeometry(0, 720, 8, 16.8)).toBeNull()
  })

  it('preps viewport for top clear, not for a lone cursor home on the normal buffer', async () => {
    const { needsPtyWriteViewportPrep, prepareTerminalForPtyWrite } = await import(
      '../src/terminal-utils'
    )
    const scrollToBottom = vi.fn()
    const write = vi.fn()
    const normal = {
      scrollToBottom,
      write,
      buffer: { active: { type: 'normal', viewportY: 0, baseY: 0 } },
    } as unknown as import('@xterm/xterm').Terminal
    expect(needsPtyWriteViewportPrep('\x1b[H', normal)).toBe(false)
    expect(needsPtyWriteViewportPrep('\x1b[2J', normal)).toBe(true)
    prepareTerminalForPtyWrite(normal, '\x1b[2J')
    expect(write).toHaveBeenCalledWith('\x1b[r')
    expect(scrollToBottom).toHaveBeenCalled()

    const alternate = {
      scrollToBottom,
      write,
      buffer: { active: { type: 'alternate', viewportY: 3, baseY: 10 } },
    } as unknown as import('@xterm/xterm').Terminal
    expect(needsPtyWriteViewportPrep('\x1b[H', alternate)).toBe(true)
  })
})

describe('RsTerminal', () => {
  beforeEach(() => {
    pasteMock.mockClear()
    selectAllMock.mockClear()
    disposeMock.mockClear()
    keyEventHandler = null
    lastTerminalOptions = {}
  })

  it('registers the public name and does not import reka-ui', () => {
    const source = readFileSync('src/components/terminal/src/RsTerminal.vue', 'utf8')
    const utils = readFileSync('src/components/terminal/src/terminal-utils.ts', 'utf8')
    const wheel = readFileSync('src/components/terminal/src/terminal-wheel.ts', 'utf8')
    expect(source).toContain("defineOptions({ name: 'RsTerminal', inheritAttrs: false })")
    expect(source).not.toContain('reka-ui')
    expect(utils).not.toContain('reka-ui')
    expect(wheel).not.toContain('reka-ui')
    expect(source).toContain('dir="ltr"')
    expect(source).toContain('subscribeTerminalTheme')
    expect(source).toContain('alive = false')
  })

  it('enables minimum contrast so ls symlink colors stay readable', async () => {
    mount(RsTerminal)
    await nextTick()
    expect(lastTerminalOptions.minimumContrastRatio).toBe(4.5)
  })

  it('forwards a custom minimum contrast ratio', async () => {
    const wrapper = mount(RsTerminal, { props: { minimumContrastRatio: 7 } })
    await nextTick()
    expect(lastTerminalOptions.minimumContrastRatio).toBe(7)
    await wrapper.setProps({ minimumContrastRatio: 1 })
    expect(wrapper.vm.getTerminal()?.options.minimumContrastRatio).toBe(1)
  })

  it('renders overlay text', () => {
    const wrapper = mount(RsTerminal, {
      props: {
        overlay: '连接中...',
      },
    })
    expect(wrapper.find('.rs-terminal__overlay').text()).toContain('连接中...')
  })

  it('emits terminal input data', async () => {
    const wrapper = mount(RsTerminal)
    await nextTick()
    onDataHandlers.at(-1)?.('ls\r')
    expect(wrapper.emitted('data')?.[0]).toEqual(['ls\r'])
    wrapper.unmount()
  })

  it('blocks input when inputEnabled is false', async () => {
    const wrapper = mount(RsTerminal, { props: { inputEnabled: false } })
    await nextTick()
    expect(lastTerminalOptions.disableStdin).toBe(true)
    expect(wrapper.find('.rs-terminal').attributes('aria-readonly')).toBe('true')
    onDataHandlers.at(-1)?.('ls')
    expect(wrapper.emitted('data')).toBeUndefined()
    wrapper.unmount()
  })

  it('drops the shared theme listener on unmount', async () => {
    const before = terminalThemeSubscriptionCount()
    const wrapper = mount(RsTerminal)
    await nextTick()
    await nextTick()
    expect(wrapper.find('.rs-terminal').attributes('dir')).toBe('ltr')
    expect(terminalThemeSubscriptionCount()).toBe(before + 1)
    wrapper.unmount()
    expect(terminalThemeSubscriptionCount()).toBe(before)
    expect(disposeMock).toHaveBeenCalled()
  })

  it('does not attach a resize observer after unmount during the first fit', async () => {
    let releaseFonts = (): void => undefined
    const fontsReady = new Promise<void>((resolve) => {
      releaseFonts = resolve
    })
    const previousFonts = document.fonts
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: fontsReady },
    })
    const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
    let observes = 0
    class TrackingResizeObserver {
      observe() {
        observes += 1
      }
      disconnect() {
        return undefined
      }
    }
    vi.stubGlobal('ResizeObserver', TrackingResizeObserver)
    const wrapper = mount(RsTerminal)
    await nextTick()
    await nextTick()
    wrapper.unmount()
    releaseFonts()
    await fontsReady
    await nextTick()
    expect(observes).toBe(0)
    expect(disposeMock).toHaveBeenCalled()
    vi.stubGlobal('ResizeObserver', class {
      observe() {
        return undefined
      }
      disconnect() {
        return undefined
      }
    })
    if (width) Object.defineProperty(HTMLElement.prototype, 'clientWidth', width)
    else delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
    if (height) Object.defineProperty(HTMLElement.prototype, 'clientHeight', height)
    else delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
    if (previousFonts) {
      Object.defineProperty(document, 'fonts', { configurable: true, value: previousFonts })
    }
  })

  it('exposes terminal helpers', async () => {
    const wrapper = mount(RsTerminal)
    await nextTick()
    wrapper.vm.write('pwd\r\n')
    wrapper.vm.clear()
    wrapper.vm.focus()
    wrapper.vm.selectAll()
    expect(writeMock).toHaveBeenCalledWith('pwd\r\n')
    expect(clearMock).toHaveBeenCalled()
    expect(focusMock).toHaveBeenCalled()
    expect(selectAllMock).toHaveBeenCalled()
  })

  it('handles select-all shortcut', async () => {
    mount(RsTerminal, { props: { shortcuts: true } })
    await nextTick()
    const handled = keyEventHandler?.({
      type: 'keydown',
      metaKey: true,
      ctrlKey: false,
      key: 'a',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent)
    expect(handled).toBe(false)
    expect(selectAllMock).toHaveBeenCalledTimes(1)
  })

  it('keeps an existing drag selection on right-click', async () => {
    hasSelectionMock.mockReturnValue(true)
    const wrapper = mount(RsTerminal, { attachTo: document.body })
    await nextTick()
    await nextTick()
    const options = wrapper.vm.getTerminal()?.options as { rightClickSelectsWord?: boolean }
    let value = options.rightClickSelectsWord
    let suspended = false
    Object.defineProperty(options, 'rightClickSelectsWord', {
      configurable: true,
      get: () => value,
      set: (next: boolean) => {
        if (next === false) suspended = true
        value = next
      },
    })
    await wrapper.find('.rs-terminal').trigger('contextmenu')
    expect(suspended).toBe(true)
    expect(value).toBe(true)
    wrapper.unmount()
    hasSelectionMock.mockReturnValue(false)
  })

  it('emits extraSelect for appended context menu items', async () => {
    const { flushPromises } = await import('@vue/test-utils')
    const wrapper = mount(RsTerminal, {
      props: {
        extraContextMenuItems: [{ key: 'sftpToCwd', label: 'SFTP 到当前路径', icon: 'folder-open' }],
      },
      attachTo: document.body,
    })
    await nextTick()
    await wrapper.find('.rs-terminal').trigger('contextmenu')
    await flushPromises()
    const extra = [...document.body.querySelectorAll('.rs-context-menu__item')].find((item) =>
      item.textContent?.includes('SFTP 到当前路径'),
    )
    expect(extra).toBeTruthy()
    ;(extra as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('extraSelect')?.[0]).toEqual(['sftpToCwd'])
    wrapper.unmount()
  })

  it('pastes once on ctrl+v keydown and ignores keyup', async () => {
    mount(RsTerminal, { props: { shortcuts: true } })
    await nextTick()
    const preventDefault = vi.fn()
    const stopPropagation = vi.fn()
    keyEventHandler?.({
      type: 'keydown',
      ctrlKey: true,
      key: 'v',
      preventDefault,
      stopPropagation,
    } as unknown as KeyboardEvent)
    keyEventHandler?.({
      type: 'keyup',
      ctrlKey: true,
      key: 'v',
    } as unknown as KeyboardEvent)
    await nextTick()
    expect(pasteMock).toHaveBeenCalledTimes(1)
    expect(preventDefault).toHaveBeenCalled()
    expect(stopPropagation).toHaveBeenCalled()
  })
})
