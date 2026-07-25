import { defineComponent, type PropType, type VNodeChild } from 'vue'

/**
 * 渲染单元格 `VNodeChild`（string / number / VNode / 数组等）。
 * 模板插值会对对象走 String()，VNode 必须经渲染函数输出。
 */
export default defineComponent({
  name: 'RsTableCellContent',
  props: {
    content: {
      type: [String, Number, Boolean, Object, Array, Function] as PropType<VNodeChild>,
      default: null,
    },
  },
  setup(props) {
    return () => props.content as VNodeChild
  },
})
