import { defineComponent, h, type PropType } from 'vue'

/**
 * Activity Bar「API」字标 — 粗圆角字重，随 currentColor 着色。
 */
export const ApiIcon = defineComponent({
  name: 'ApiIcon',
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
      const style: Record<string, string | number> = {
        ...(typeof attrStyle === 'object' && attrStyle && !Array.isArray(attrStyle)
          ? (attrStyle as Record<string, string | number>)
          : {}),
        color: props.color || 'currentColor',
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
          style,
          class: ['lucide', 'lucide-api-icon', attrClass].filter(Boolean),
        },
        [
          h(
            'text',
            {
              class: 'api-icon__label',
              x: 12,
              y: 12,
              textAnchor: 'middle',
              dy: '0.35em',
            },
            'API',
          ),
        ],
      )
    }
  },
})
