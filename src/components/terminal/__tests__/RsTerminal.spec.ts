import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import RsTerminal from '../src/RsTerminal.vue'
import { buildAnsiColorDemo, normalizeTerminalHexColor, resolveTerminalTheme } from '../src/terminal-utils'
import { readDocumentTheme } from '../../code-editor/src/code-editor-utils'

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
    }
    onSelectionChange(handler: () => void) {
      onSelectionHandlers.push(handler)
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

  it('resolves document theme', () => {
    document.documentElement.dataset.rsTheme = 'light'
    expect(resolveTerminalTheme('auto')).toBe('light')
    document.documentElement.dataset.rsTheme = 'dark'
    expect(resolveTerminalTheme('auto')).toBe('dark')
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
    keyEventHandler = null
    lastTerminalOptions = {}
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
