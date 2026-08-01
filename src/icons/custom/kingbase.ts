import { defineComponent, h, type PropType } from 'vue'

/**
 * 人大金仓 / KINGBASE 官方品牌 lettermark（stylized「K」：竖干中段向左尖角箭头）。
 * 路径从官网 LOGO 组合包 AI 源文件（英文横排红标）中拆出 K 字形并归一到 24×24。
 * 来源：https://www.kingbase.com.cn/about/about.html → LOGO组合包下载
 * 品牌色取样官网 header logo：#C9151E（政务红）。
 */
const KINGBASE_MARK_PATH =
  'M22.5 6.301L22.5 1.973L10.629 7.641L10.629 1.973L6.374 1.973L6.374 9.673L1.5 12L6.374 14.32L6.374 22.027L10.629 22.027L10.629 16.344L22.5 21.994L22.5 17.665L10.629 12.003L10.629 11.997Z'

/**
 * NiuMa Kingbase —— 官方品牌 mark，单色填充，默认走政务红并随主题明暗自动调整对比度。
 */
export const KingbaseIcon = defineComponent({
  name: 'KingbaseIcon',
  inheritAttrs: false,
  props: {
    size: { type: [Number, String] as PropType<number | string>, default: 24 },
    strokeWidth: { type: [Number, String] as PropType<number | string>, default: 2 },
    color: { type: String, default: 'currentColor' },
  },
  setup(props, { attrs }) {
    return () => {
      const size = Number(props.size) || 24
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs
      const accent = props.color && props.color !== 'currentColor' ? props.color : undefined
      const style: Record<string, string> = {
        ...(typeof attrStyle === 'object' && attrStyle && !Array.isArray(attrStyle)
          ? (attrStyle as Record<string, string>)
          : {}),
        ...(accent ? { '--rs-icon-kingbase-accent': accent } : {}),
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
          class: ['lucide', 'lucide-kingbase-icon', attrClass].filter(Boolean),
        },
        [h('path', { class: 'kingbase-icon__mark', d: KINGBASE_MARK_PATH })],
      )
    }
  },
})
