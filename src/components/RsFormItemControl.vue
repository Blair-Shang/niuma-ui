<script lang="ts">
import { defineComponent, type PropType, type VNode } from 'vue'
import { bindFormItemControl } from './form-item-control'

/**
 * 将 inject 合并到默认插槽第一个子节点，供 Form.Item 注入控件 props。
 */
export default defineComponent({
  name: 'RsFormItemControl',
  inheritAttrs: false,
  props: {
    inject: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
  },
  setup(props, { slots }) {
    return () => bindFormItemControl(slots.default?.() as VNode[] | undefined, props.inject)
  },
})
</script>
