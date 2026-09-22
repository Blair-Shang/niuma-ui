import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import RsConfigProvider from '../../config-provider/src/RsConfigProvider.vue'
import RsEmpty from '../src/RsEmpty.vue'
import {
  resolveRsEmptyDescription,
  resolveRsEmptyImageSizeCss,
  resolveRsEmptyLocaleKey,
  resolveRsEmptyPreset,
  resolveRsEmptySize,
  shouldShowRsEmptyDescription,
  shouldShowRsEmptyIllustration,
  shouldShowRsEmptyRemoteImage,
  shouldShowRsEmptyTitle,
  shouldUseRsEmptyBadgeChrome,
} from '../src/empty-utils'

describe('RsEmpty', () => {
  it('registers the public component name', () => {
    expect(RsEmpty.name).toBe('RsEmpty')
  })

  it('does not import or render reka-ui', () => {
    const wrapper = mount(RsEmpty)
    expect(wrapper.html().toLowerCase()).not.toContain('reka')
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('uses locale description when description is omitted', () => {
    const wrapper = mount(RsEmpty)
    expect(wrapper.find('.rs-empty__description').text()).toBe('No data')
  })

  it('uses zh-CN copy inside RsConfigProvider', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'zh-CN' },
      slots: {
        default: () => h(RsEmpty),
      },
    })
    expect(wrapper.find('.rs-empty__description').text()).toBe('暂无数据')
  })

  it('uses en-US copy inside RsConfigProvider', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsEmpty),
      },
    })
    expect(wrapper.find('.rs-empty__description').text()).toBe('No data')
  })

  it('uses search locale copy for the search preset', () => {
    const wrapper = mount(RsConfigProvider, {
      props: { locale: 'en-US' },
      slots: {
        default: () => h(RsEmpty, { preset: 'search' }),
      },
    })
    expect(wrapper.find('.rs-empty__description').text()).toBe('No matching results')
    expect(wrapper.find('.rs-empty__svg').exists()).toBe(true)
  })

  it('renders required-style description when provided', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '暂无数据' },
    })
    expect(wrapper.find('.rs-empty__description').text()).toBe('暂无数据')
  })

  it('hides description when an empty string is passed', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '' },
    })
    expect(wrapper.find('.rs-empty__description').exists()).toBe(false)
  })

  it('renders title when provided', () => {
    const wrapper = mount(RsEmpty, {
      props: { title: '还没有项目', description: '创建第一个项目。' },
    })
    expect(wrapper.find('.rs-empty__title').text()).toBe('还没有项目')
  })

  it('omits title element when title is not provided', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '暂无数据' },
    })
    expect(wrapper.find('.rs-empty__title').exists()).toBe(false)
  })

  it('applies description offset class when title is present', () => {
    const wrapper = mount(RsEmpty, {
      props: { title: '标题', description: '描述' },
    })
    expect(wrapper.find('.rs-empty__description').classes()).toContain('rs-empty__description--offset')
  })

  it('does not apply description offset class without title', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '描述' },
    })
    expect(wrapper.find('.rs-empty__description').classes()).not.toContain('rs-empty__description--offset')
  })

  it('renders icon slot with badge chrome', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态' },
      slots: { icon: '<span class="custom-icon">icon</span>' },
    })
    expect(wrapper.find('.rs-empty__icon .custom-icon').text()).toBe('icon')
    expect(wrapper.find('.rs-empty__icon').classes()).toContain('rs-empty__icon--badge')
  })

  it('renders image slot without badge chrome', () => {
    const wrapper = mount(RsEmpty, {
      slots: { image: '<span class="custom-image">art</span>' },
    })
    expect(wrapper.find('.rs-empty__icon .custom-image').text()).toBe('art')
    expect(wrapper.find('.rs-empty__icon').classes()).toContain('rs-empty__icon--figure')
    expect(wrapper.find('.rs-empty__icon').classes()).not.toContain('rs-empty__icon--badge')
  })

  it('prefers image slot over icon slot', () => {
    const wrapper = mount(RsEmpty, {
      slots: {
        image: '<span class="custom-image">art</span>',
        icon: '<span class="custom-icon">icon</span>',
      },
    })
    expect(wrapper.find('.custom-image').exists()).toBe(true)
    expect(wrapper.find('.custom-icon').exists()).toBe(false)
  })

  it('renders title and description slots', () => {
    const wrapper = mount(RsEmpty, {
      slots: {
        title: '<span class="custom-title">标题槽</span>',
        description: '<span class="custom-desc">描述槽</span>',
      },
    })
    expect(wrapper.find('.custom-title').text()).toBe('标题槽')
    expect(wrapper.find('.custom-desc').text()).toBe('描述槽')
  })

  it('renders default slot for actions', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态' },
      slots: { default: '<button type="button" class="action-btn">新建</button>' },
    })
    expect(wrapper.find('.rs-empty__actions .action-btn').text()).toBe('新建')
  })

  it('renders a remote image and falls back after error', async () => {
    const wrapper = mount(RsEmpty, {
      props: { image: 'https://example.test/empty.png', description: '远程图' },
    })
    expect(wrapper.find('.rs-empty__remote').exists()).toBe(true)
    await wrapper.find('.rs-empty__remote').trigger('error')
    expect(wrapper.find('.rs-empty__remote').exists()).toBe(false)
    expect(wrapper.find('.rs-empty__svg').exists()).toBe(true)
  })

  it('applies imageSize to the illustration box', () => {
    const wrapper = mount(RsEmpty, {
      props: { imageSize: 80 },
    })
    const style = wrapper.find('.rs-empty__icon').attributes('style') ?? ''
    expect(style).toContain('width: 80px')
    expect(style).toContain('height: 80px')
  })

  it('hides the illustration when showImage is false', () => {
    const wrapper = mount(RsEmpty, {
      props: { showImage: false, description: '无图' },
    })
    expect(wrapper.find('.rs-empty__icon').exists()).toBe(false)
  })

  it('keeps the illustration when showImage is false but icon is slotted', () => {
    const wrapper = mount(RsEmpty, {
      props: { showImage: false, description: '有图标' },
      slots: { icon: '<span class="keep-icon">i</span>' },
    })
    expect(wrapper.find('.keep-icon').exists()).toBe(true)
  })

  it('renders root container with base class', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态' },
    })
    expect(wrapper.classes()).toContain('rs-empty')
    expect(wrapper.classes()).toContain('rs-empty--md')
    expect(wrapper.classes()).not.toContain('rs-empty--fill')
    expect(wrapper.find('.rs-empty__text').exists()).toBe(true)
    expect(wrapper.find('.rs-empty__icon').exists()).toBe(true)
  })

  it('applies size class', () => {
    const wrapper = mount(RsEmpty, {
      props: { size: 'sm' },
    })
    expect(wrapper.classes()).toContain('rs-empty--sm')
  })

  it('applies fill class for flush square layout', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态', fill: true },
    })
    expect(wrapper.classes()).toContain('rs-empty--fill')
  })

  it('applies icon radius via CSS variable', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态', iconRadius: 'none' },
    })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('--rs-empty-icon-radius')
    expect(style).toMatch(/--rs-empty-icon-radius:\s*0/)
  })

  it('applies outer radius via CSS variable', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态', radius: 'sm' },
    })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('--rs-empty-radius')
    expect(style).toContain('--rs-radius-sm')
  })

  it('forces outer radius to 0 when fill is true', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '空状态', fill: true, radius: 'lg' },
    })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toMatch(/--rs-empty-radius:\s*0/)
  })

  it('forwards id and aria-label', () => {
    const wrapper = mount(RsEmpty, {
      props: { id: 'inbox-empty', ariaLabel: 'Inbox is empty' },
    })
    expect(wrapper.attributes('id')).toBe('inbox-empty')
    expect(wrapper.attributes('aria-label')).toBe('Inbox is empty')
  })

  it('uses locale label when there is no visible text', () => {
    const wrapper = mount(RsEmpty, {
      props: { description: '', showImage: true },
    })
    expect(wrapper.find('.rs-empty__text').exists()).toBe(false)
    expect(wrapper.attributes('aria-label')).toBe('Empty')
  })

  it('unmounts without leftover image error state', async () => {
    const wrapper = mount(RsEmpty, {
      props: { image: 'https://example.test/empty.png' },
    })
    await wrapper.find('.rs-empty__remote').trigger('error')
    wrapper.unmount()
    expect(wrapper.exists()).toBe(false)
  })
})

describe('empty-utils', () => {
  it('resolves known and unknown presets', () => {
    expect(resolveRsEmptyPreset('search')).toBe('search')
    expect(resolveRsEmptyPreset(undefined)).toBe('default')
    expect(resolveRsEmptyPreset('nope' as never)).toBe('default')
  })

  it('resolves known and unknown sizes', () => {
    expect(resolveRsEmptySize('lg')).toBe('lg')
    expect(resolveRsEmptySize(undefined)).toBe('md')
    expect(resolveRsEmptySize('ssm' as never)).toBe('md')
  })

  it('picks locale keys from the preset', () => {
    expect(resolveRsEmptyLocaleKey('default')).toBe('empty.description')
    expect(resolveRsEmptyLocaleKey('simple')).toBe('empty.description')
    expect(resolveRsEmptyLocaleKey('search')).toBe('empty.search')
  })

  it('keeps an explicit empty description hidden', () => {
    expect(resolveRsEmptyDescription(undefined, 'No data')).toBe('No data')
    expect(resolveRsEmptyDescription('', 'No data')).toBe('')
    expect(resolveRsEmptyDescription('Custom', 'No data')).toBe('Custom')
    expect(shouldShowRsEmptyDescription('', false)).toBe(false)
    expect(shouldShowRsEmptyDescription('', true)).toBe(true)
  })

  it('shows title only when text or slot exists', () => {
    expect(shouldShowRsEmptyTitle(undefined, false)).toBe(false)
    expect(shouldShowRsEmptyTitle('', false)).toBe(false)
    expect(shouldShowRsEmptyTitle('Hi', false)).toBe(true)
    expect(shouldShowRsEmptyTitle(undefined, true)).toBe(true)
  })

  it('decides illustration and badge chrome', () => {
    expect(shouldShowRsEmptyIllustration({ showImage: false, hasIconSlot: false, hasImageSlot: false })).toBe(false)
    expect(shouldShowRsEmptyIllustration({ showImage: false, hasIconSlot: true, hasImageSlot: false })).toBe(true)
    expect(shouldUseRsEmptyBadgeChrome(true, false)).toBe(true)
    expect(shouldUseRsEmptyBadgeChrome(true, true)).toBe(false)
  })

  it('hides a failed remote image', () => {
    expect(
      shouldShowRsEmptyRemoteImage({
        image: 'https://example.test/a.png',
        failedSrc: null,
        hasIconSlot: false,
        hasImageSlot: false,
      }),
    ).toBe(true)
    expect(
      shouldShowRsEmptyRemoteImage({
        image: 'https://example.test/a.png',
        failedSrc: 'https://example.test/a.png',
        hasIconSlot: false,
        hasImageSlot: false,
      }),
    ).toBe(false)
    expect(
      shouldShowRsEmptyRemoteImage({
        image: 'https://example.test/a.png',
        failedSrc: null,
        hasIconSlot: true,
        hasImageSlot: false,
      }),
    ).toBe(false)
  })

  it('normalizes imageSize to CSS', () => {
    expect(resolveRsEmptyImageSizeCss(64)).toBe('64px')
    expect(resolveRsEmptyImageSizeCss('3rem')).toBe('3rem')
    expect(resolveRsEmptyImageSizeCss('')).toBeUndefined()
    expect(resolveRsEmptyImageSizeCss(undefined)).toBeUndefined()
  })
})
