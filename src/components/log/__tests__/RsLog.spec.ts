import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RsLog from '../src/RsLog.vue'
import type { RsLogExpose, RsLogLine } from '../src/RsLog.vue'
import { copyTextToClipboard } from '../../../utils/rs-clipboard'

vi.mock('../../../utils/rs-clipboard', () => ({
  copyTextToClipboard: vi.fn().mockResolvedValue(true),
}))

function expose(wrapper: ReturnType<typeof mount>): RsLogExpose {
  return wrapper.vm as unknown as RsLogExpose
}

describe('RsLog', () => {
  it('renders inferred levels from text', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: '[INFO] start\n[ERROR] boom\nhello',
        height: 160,
        itemSize: 24,
      },
    })
    expect(wrapper.findAll('.rs-log__row').length).toBeGreaterThan(0)
    expect(wrapper.find('.rs-log__row--error').exists()).toBe(true)
    expect(wrapper.find('.rs-log__row--info').exists()).toBe(true)
    expect(wrapper.text()).toContain('[ERROR] boom')
    wrapper.unmount()
  })

  it('colors caller markers after built-in scan', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: '制品上传成功\n构建失败：timeout',
        inferMarkers: { success: ['成功'], error: ['失败'] },
        height: 160,
        itemSize: 24,
      },
    })
    expect(wrapper.find('.rs-log__row--success').exists()).toBe(true)
    expect(wrapper.find('.rs-log__row--error').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders structured lines with time and localized level', () => {
    const lines: RsLogLine[] = [
      { id: 1, time: '12:00:01', level: 'success', text: 'uploaded app.jar' },
    ]
    const wrapper = mount(RsLog, {
      props: { lines, showTime: true, height: 120, itemSize: 24 },
    })
    expect(wrapper.find('.rs-log__time').text()).toBe('12:00:01')
    expect(wrapper.find('.rs-log__level').text()).toBe('Success')
    expect(wrapper.find('.rs-log__row--success').exists()).toBe(true)
    expect(wrapper.find('.rs-log__marker').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows empty state when there is no log', () => {
    const wrapper = mount(RsLog, {
      props: { lines: '', emptyText: '暂无日志' },
    })
    expect(wrapper.text()).toContain('暂无日志')
    expect(wrapper.find('.rs-log__row').exists()).toBe(false)
    wrapper.unmount()
  })

  it('appends string lines onto a string model', async () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'first', height: 120, itemSize: 24 },
    })
    expose(wrapper).append('[WARN] second')
    await nextTick()
    expect(wrapper.emitted('update:lines')?.[0]?.[0]).toBe('first\n[WARN] second')
    wrapper.unmount()
  })

  it('append onto array model keeps objects', async () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: [{ text: 'a', level: 'info' }] satisfies RsLogLine[],
        height: 120,
        itemSize: 24,
      },
    })
    expose(wrapper).append({ text: 'b', level: 'error' })
    await nextTick()
    const next = wrapper.emitted('update:lines')?.[0]?.[0] as RsLogLine[]
    expect(next).toEqual([
      { text: 'a', level: 'info' },
      { text: 'b', level: 'error' },
    ])
    wrapper.unmount()
  })

  it('clear emits an empty string for string models', async () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'keep', height: 120 },
    })
    expose(wrapper).clear()
    await nextTick()
    expect(wrapper.emitted('update:lines')?.[0]?.[0]).toBe('')
    wrapper.unmount()
  })

  it('getLines returns normalized rows with severity maps', () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'failed to start', inferLevel: true, height: 120, itemSize: 24 },
    })
    const rows = expose(wrapper).getLines()
    expect(rows[0]?.level).toBe('error')
    expect(rows[0]?.text).toBe('failed to start')
    expect(rows[0]?.syslog).toBe(3)
    expect(rows[0]?.otel).toBe(17)
    wrapper.unmount()
  })

  it('applies wrap class and turns off virtualization when virtual is auto', () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'long line', wrap: true, height: 80 },
    })
    expect(wrapper.find('.rs-log').classes()).toContain('rs-log--wrap')
    expect(wrapper.find('.rs-log__plain').exists()).toBe(true)
    expect(wrapper.find('.rs-log__plain').exists()).toBe(true)
    expect(wrapper.find('.rs-virtual-list').exists()).toBe(false)
    wrapper.unmount()
  })

  it('reads the text prop when lines is empty', () => {
    const wrapper = mount(RsLog, {
      props: { text: '[ERROR] from text prop', height: 120, itemSize: 24 },
    })
    expect(wrapper.find('.rs-log__row--error').exists()).toBe(true)
    expect(wrapper.text()).toContain('[ERROR] from text prop')
    wrapper.unmount()
  })

  it('keeps only the newest maxLines rows', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: 'one\ntwo\nthree\nfour',
        maxLines: 2,
        height: 120,
        itemSize: 24,
      },
    })
    expect(wrapper.text()).not.toContain('one')
    expect(wrapper.text()).toContain('three')
    expect(wrapper.text()).toContain('four')
    wrapper.unmount()
  })

  it('keeps a level marker and sr-only label when showLevel is false', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: [{ text: 'uploaded', level: 'success' }],
        showLevel: false,
        height: 120,
        itemSize: 24,
      },
    })
    expect(wrapper.find('.rs-log__level').exists()).toBe(false)
    expect(wrapper.find('.rs-log__marker').exists()).toBe(true)
    expect(wrapper.find('.rs-log__sr-only').text()).toContain('Success')
    expect(wrapper.find('.rs-log__row--success').exists()).toBe(true)
    wrapper.unmount()
  })

  it('filters visible lines by search', async () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: 'alpha info\nbeta error',
        search: 'beta',
        height: 160,
        itemSize: 24,
      },
    })
    expect(wrapper.text()).toContain('beta error')
    expect(wrapper.text()).not.toContain('alpha info')
    expect(expose(wrapper).getVisibleLines()).toHaveLength(1)
    wrapper.unmount()
  })

  it('shows search and copy by default', () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'hello search copy', height: 120, itemSize: 24 },
    })
    expect(wrapper.find('.rs-log__search').exists()).toBe(true)
    expect(wrapper.find('.rs-log__copy').exists()).toBe(true)
    wrapper.unmount()
  })

  it('copies the full log, not the filtered or active line', async () => {
    const copyMock = vi.mocked(copyTextToClipboard)
    copyMock.mockClear()
    const wrapper = mount(RsLog, {
      props: {
        lines: 'alpha info\nbeta error',
        search: 'beta',
        height: 160,
        itemSize: 24,
      },
    })
    await expose(wrapper).copy()
    expect(copyMock).toHaveBeenCalledWith('alpha info\nbeta error')
    expect(wrapper.emitted('copy')?.[0]?.[0]).toEqual({ text: 'alpha info\nbeta error', source: 'all' })
    wrapper.unmount()
  })

  it('focuses the search box on Ctrl+F', async () => {
    const wrapper = mount(RsLog, {
      props: { lines: 'hello', height: 120, itemSize: 24 },
      attachTo: document.body,
    })
    const input = wrapper.find('.rs-log__search input').element as HTMLInputElement
    const focus = vi.spyOn(input, 'focus')
    await wrapper.find('.rs-log').trigger('keydown', { key: 'f', ctrlKey: true })
    expect(focus).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('wrap uses a plain list so rows can grow with the text', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: '[2026/9/10 17:02:58] 预同步 Git（2/43）：flux-collaboration-adapterexpress',
        wrap: true,
        height: 160,
      },
    })
    expect(wrapper.find('.rs-log--wrap').exists()).toBe(true)
    expect(wrapper.find('.rs-log__plain').exists()).toBe(true)
    expect(wrapper.find('.rs-log__list').exists()).toBe(false)
    expect(wrapper.findAll('.rs-log__row')).toHaveLength(1)
    wrapper.unmount()
  })

  it('wrap fill-height still renders one row per line', () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: 'alpha\nbeta\ngamma',
        wrap: true,
        height: '100%',
        follow: true,
        showSearch: false,
        showCopy: false,
      },
    })
    expect(wrapper.find('.rs-log--wrap').exists()).toBe(true)
    expect(wrapper.findAll('.rs-log__row')).toHaveLength(3)
    expect(wrapper.find('.rs-virtual-list').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits overflow when maxLines drops old rows', async () => {
    const wrapper = mount(RsLog, {
      props: {
        lines: 'a\nb',
        maxLines: 2,
        height: 120,
        itemSize: 24,
      },
    })
    await wrapper.setProps({ lines: 'a\nb\nc' })
    await nextTick()
    expect(wrapper.emitted('overflow')?.[0]?.[0]).toEqual({ dropped: 1, kept: 2 })
    wrapper.unmount()
  })
})
