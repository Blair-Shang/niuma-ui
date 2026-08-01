import { defineComponent, h, useId, type PropType } from 'vue'

/**
 * 达梦官方品牌 mark：倾斜蓝椭圆 + 三条红色波浪带（不含「达梦数据库」字样）。
 * 按官网 header logo 左侧图形归一到 24×24。
 * 来源：https://www.dameng.com/static/cn/images/dm_cn/logo.png
 * 品牌色取样：蓝 #0000D2、红 #EC1B34。
 */

/** 椭圆内三条平行 S 形波浪带（局部坐标：中心 0,0，长轴水平） */
const DAMENG_WAVE_PATHS = [
  'M -10.2 -2.7 C -6.5 -4.2 -3.5 -1.4 0 -2.4 C 3.5 -3.4 6.5 -1 10.2 -2.3 L 10.2 -0.9 C 6.5 0.4 3.5 -2 0 -1 C -3.5 0 -6.5 -2.8 -10.2 -1.3 Z',
  'M -10.2 -0.4 C -6.5 -1.9 -3.5 0.9 0 -0.1 C 3.5 -1.1 6.5 1.3 10.2 0 L 10.2 1.4 C 6.5 2.7 3.5 0.3 0 1.3 C -3.5 2.3 -6.5 -0.5 -10.2 1 Z',
  'M -10.2 1.9 C -6.5 0.4 -3.5 3.2 0 2.2 C 3.5 1.2 6.5 3.6 10.2 2.3 L 10.2 3.7 C 6.5 5 3.5 2.6 0 3.6 C -3.5 4.6 -6.5 1.8 -10.2 3.3 Z',
] as const

/**
 * NiuMa Dameng —— 官方品牌 mark，双色填充，默认走官网蓝/红并随主题明暗调整。
 */
export const DamengIcon = defineComponent({
  name: 'DamengIcon',
  inheritAttrs: false,
  props: {
    size: { type: [Number, String] as PropType<number | string>, default: 24 },
    strokeWidth: { type: [Number, String] as PropType<number | string>, default: 2 },
    color: { type: String, default: 'currentColor' },
  },
  setup(props, { attrs }) {
    const clipId = useId()

    return () => {
      const size = Number(props.size) || 24
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs
      const accent = props.color && props.color !== 'currentColor' ? props.color : undefined
      const style: Record<string, string> = {
        ...(typeof attrStyle === 'object' && attrStyle && !Array.isArray(attrStyle)
          ? (attrStyle as Record<string, string>)
          : {}),
        ...(accent ? { '--rs-icon-dameng-accent': accent } : {}),
      }

      return h(
        'svg',
        {
          ...restAttrs,
          xmlns: 'http://www.w3.org/2000/svg',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          overflow: 'visible',
          style: Object.keys(style).length > 0 ? style : undefined,
          class: ['lucide', 'lucide-dameng-icon', attrClass].filter(Boolean),
        },
        [
          h('defs', [
            h('clipPath', { id: clipId }, [
              h('ellipse', { cx: 0, cy: 0, rx: 10.2, ry: 6.55 }),
            ]),
          ]),
          h(
            'g',
            { transform: 'translate(12 12) rotate(-42)' },
            [
              h('ellipse', {
                class: 'dameng-icon__oval',
                cx: 0,
                cy: 0,
                rx: 10.2,
                ry: 6.55,
              }),
              h(
                'g',
                { class: 'dameng-icon__waves', 'clip-path': `url(#${clipId})` },
                DAMENG_WAVE_PATHS.map((d) => h('path', { class: 'dameng-icon__wave', d })),
              ),
            ],
          ),
        ],
      )
    }
  },
})
