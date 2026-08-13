<script lang="ts">
import { defineComponent, type PropType, type VNodeChild } from 'vue'

/**
 * 将 VNodeChild（含自定义错误渲染结果）挂到模板中。
 * Form errorRender / 字段自定义渲染共用。
 */
export default defineComponent({
  name: 'RsVNodeHost',
  props: {
    content: {
      type: null as unknown as PropType<VNodeChild>,
      required: true,
    },
  },
  setup(props) {
    return () => props.content
  },
})
</script>
