import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RsCard from '../components/RsCard.vue'

describe('RsCard', () => {
  it('renders default slot in body', () => {
    const wrapper = mount(RsCard, {
      slots: { default: '<p>正文</p>' },
    })
    expect(wrapper.find('.rs-card__body').html()).toContain('正文')
  })

  it('renders as section by default', () => {
    const wrapper = mount(RsCard, { slots: { default: '内容' } })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.classes()).toContain('rs-card')
  })

  it('renders custom as element', () => {
    const wrapper = mount(RsCard, {
      props: { as: 'article' },
      slots: { default: '内容' },
    })
    expect(wrapper.element.tagName).toBe('ARTICLE')
  })

  it('renders title and description in header', () => {
    const wrapper = mount(RsCard, {
      props: { title: '标题', description: '描述文字' },
      slots: { default: '正文' },
    })
    expect(wrapper.find('.rs-card__title').text()).toBe('标题')
    expect(wrapper.find('.rs-card__description').text()).toBe('描述文字')
    expect(wrapper.find('header.rs-card__header').exists()).toBe(true)
  })

  it('omits header when no title, description, header, or actions slot', () => {
    const wrapper = mount(RsCard, { slots: { default: '仅正文' } })
    expect(wrapper.find('header').exists()).toBe(false)
  })

  it('renders header when only actions slot is provided', () => {
    const wrapper = mount(RsCard, {
      slots: {
        actions: '<button type="button">操作</button>',
        default: '正文',
      },
    })
    expect(wrapper.find('header.rs-card__header').exists()).toBe(true)
    expect(wrapper.find('.rs-card__actions button').text()).toBe('操作')
  })

  it('renders header slot instead of default heading', () => {
    const wrapper = mount(RsCard, {
      slots: {
        header: '<div class="custom-h">自定义</div>',
        default: '正文',
      },
    })
    expect(wrapper.find('.custom-h').text()).toBe('自定义')
    expect(wrapper.find('.rs-card__title').exists()).toBe(false)
  })

  it('renders actions slot in header', () => {
    const wrapper = mount(RsCard, {
      props: { title: '卡片' },
      slots: {
        actions: '<button type="button">操作</button>',
        default: '正文',
      },
    })
    expect(wrapper.find('.rs-card__actions button').text()).toBe('操作')
  })

  it('renders cover slot before header', () => {
    const wrapper = mount(RsCard, {
      props: { title: '封面卡' },
      slots: {
        cover: '<div class="cover-el">封面</div>',
        default: '正文',
      },
    })
    const cover = wrapper.find('.rs-card__cover')
    expect(cover.exists()).toBe(true)
    expect(cover.text()).toBe('封面')
    const rootHtml = wrapper.html()
    expect(rootHtml.indexOf('rs-card__cover')).toBeLessThan(rootHtml.indexOf('rs-card__header'))
  })

  it('renders footer slot', () => {
    const wrapper = mount(RsCard, {
      props: { title: '带底部' },
      slots: {
        default: '正文',
        footer: '<button type="button">保存</button>',
      },
    })
    expect(wrapper.find('footer.rs-card__footer button').text()).toBe('保存')
  })

  it('omits footer when footer slot is absent', () => {
    const wrapper = mount(RsCard, {
      props: { title: '无底部' },
      slots: { default: '正文' },
    })
    expect(wrapper.find('footer').exists()).toBe(false)
  })

  it('applies padded body class by default', () => {
    const wrapper = mount(RsCard, { slots: { default: '内容' } })
    expect(wrapper.find('.rs-card__body').classes()).toContain('rs-card__body--padded')
  })

  it('omits padded class when padding is false', () => {
    const wrapper = mount(RsCard, {
      props: { padding: false },
      slots: { default: '内容' },
    })
    expect(wrapper.find('.rs-card__body').classes()).not.toContain('rs-card__body--padded')
  })

  it('applies elevated class when elevated is true', () => {
    const wrapper = mount(RsCard, {
      props: { elevated: true },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain('rs-card--elevated')
  })

  it('applies hoverable class', () => {
    const wrapper = mount(RsCard, {
      props: { hoverable: true },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain('rs-card--hoverable')
  })

  it('applies clip class for overflow hidden', () => {
    const wrapper = mount(RsCard, {
      props: { clip: true },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain('rs-card--clip')
  })

  it('applies fill class for pane layouts', () => {
    const wrapper = mount(RsCard, {
      props: { fill: true },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain('rs-card--fill')
  })

  it('applies variant class', () => {
    const wrapper = mount(RsCard, {
      props: { variant: 'plain' },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain('rs-card--plain')
  })

  it('defaults to grouped variant', () => {
    const wrapper = mount(RsCard, { slots: { default: '内容' } })
    expect(wrapper.classes()).toContain('rs-card--grouped')
  })

  it('defaults to md size', () => {
    const wrapper = mount(RsCard, { slots: { default: '内容' } })
    expect(wrapper.classes()).toContain('rs-card--md')
  })

  it.each(['sm', 'md', 'lg'] as const)('applies size=%s class', (size) => {
    const wrapper = mount(RsCard, {
      props: { size },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain(`rs-card--${size}`)
  })

  it('defaults radius css var to md token', () => {
    const wrapper = mount(RsCard, { slots: { default: '内容' } })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('--rs-card-radius')
    expect(style).toMatch(/var\(--rs-radius\)|--rs-radius[^-]/)
  })

  it('applies explicit radius css var', () => {
    const wrapper = mount(RsCard, {
      props: { radius: 'lg' },
      slots: { default: '内容' },
    })
    expect(wrapper.attributes('style')).toContain('var(--rs-radius-lg)')
  })

  it('applies none radius as 0', () => {
    const wrapper = mount(RsCard, {
      props: { radius: 'none' },
      slots: { default: '内容' },
    })
    expect(wrapper.attributes('style')).toMatch(/--rs-card-radius:\s*0/)
  })

  it('applies borderless class when borderless is true', () => {
    const wrapper = mount(RsCard, {
      props: { borderless: true },
      slots: { default: '内容' },
    })
    expect(wrapper.classes()).toContain('rs-card--borderless')
  })

  it('supports admin outlined preset combination', () => {
    const wrapper = mount(RsCard, {
      props: {
        variant: 'outlined',
        size: 'md',
        radius: 'md',
        title: '节点列表',
      },
      slots: { default: '表格' },
    })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['rs-card--outlined', 'rs-card--md']),
    )
    expect(wrapper.find('.rs-card__title').text()).toBe('节点列表')
  })

  it('supports frontend marketing preset combination', () => {
    const wrapper = mount(RsCard, {
      props: {
        variant: 'filled',
        size: 'lg',
        radius: 'lg',
        elevated: true,
        hoverable: true,
        clip: true,
        title: '产品亮点',
      },
      slots: {
        cover: '<img alt="" src="about:blank" />',
        default: '介绍',
        footer: '<button type="button">了解更多</button>',
      },
    })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'rs-card--filled',
        'rs-card--lg',
        'rs-card--elevated',
        'rs-card--hoverable',
        'rs-card--clip',
      ]),
    )
    expect(wrapper.find('.rs-card__cover img').exists()).toBe(true)
    expect(wrapper.find('.rs-card__footer').exists()).toBe(true)
  })
})
