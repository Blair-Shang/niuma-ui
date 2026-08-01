import { defineComponent, h, type PropType } from 'vue'

/**
 * Oracle 官方品牌 oval mark（双环跑道形，不含 Oracle 字样）。
 * 路径来自 Simple Icons 历史收录的 oracle.svg（CC0 1.0），已归一到 24×24。
 * 来源：https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/oracle.svg
 * 品牌色：Oracle 红 #F80000。
 */
const ORACLE_MARK_PATH =
  'M16.412 4.412h-8.82a7.588 7.588 0 0 0-.008 15.176h8.828a7.588 7.588 0 0 0 0-15.176zm-.193 12.502H7.786a4.915 4.915 0 0 1 0-9.828h8.433a4.914 4.914 0 1 1 0 9.828z'

/**
 * NiuMa Oracle —— 官方品牌 mark，单色填充，默认走 Oracle 红并随主题明暗自动调整对比度。
 */
export const OracleIcon = defineComponent({
  name: 'OracleIcon',
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
        ...(accent ? { '--rs-icon-oracle-accent': accent } : {}),
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
          class: ['lucide', 'lucide-oracle-icon', attrClass].filter(Boolean),
        },
        [h('path', { class: 'oracle-icon__mark', d: ORACLE_MARK_PATH })],
      )
    }
  },
})
