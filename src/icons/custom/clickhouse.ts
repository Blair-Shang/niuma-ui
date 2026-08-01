import { defineComponent, h, type PropType } from 'vue'

/**
 * ClickHouse 官方品牌 mark（竖条 barcode 形，不含 ClickHouse 字样）。
 * 来自 Simple Icons clickhouse.svg（CC0 1.0），已归一到 24×24。
 * 来源：https://github.com/simple-icons/simple-icons/blob/develop/icons/clickhouse.svg
 * 品牌色：ClickHouse 黄 #FFCC01。
 */
const CLICKHOUSE_MARK_PATH =
  'M21.333 10H24v4h-2.667ZM16 1.335h2.667v21.33H16Zm-5.333 0h2.666v21.33h-2.666ZM0 22.665V1.335h2.667v21.33zm5.333-21.33H8v21.33H5.333Z'

/**
 * NiuMa ClickHouse —— 官方品牌 mark，单色填充，默认走 ClickHouse 黄并随主题明暗自动调整对比度。
 */
export const ClickhouseIcon = defineComponent({
  name: 'ClickhouseIcon',
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
        ...(accent ? { '--rs-icon-clickhouse-accent': accent } : {}),
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
          class: ['lucide', 'lucide-clickhouse-icon', attrClass].filter(Boolean),
        },
        [h('path', { class: 'clickhouse-icon__mark', d: CLICKHOUSE_MARK_PATH })],
      )
    }
  },
})
