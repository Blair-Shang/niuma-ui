<script setup lang="ts">
import { ref } from 'vue'
import { RsAlert } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const visible = ref(true)

const typeCode = `<RsAlert type="success" title="部署完成">服务已就绪。</RsAlert>
<RsAlert type="warning" title="配额即将用尽" closable />`
</script>

<template>
  <DocDemo
    id="demo-type"
    title="四种语义"
    description="Alert 留在页面上下文中，不会自动消失。短暂结果用 Toast。"
    :code="typeCode"
  >
    <div class="stack">
      <RsAlert type="info" title="信息">配置已同步到所有环境。</RsAlert>
      <RsAlert type="success" title="成功">部署完成，服务已就绪。</RsAlert>
      <RsAlert type="warning" title="警告">配额即将用尽，请及时扩容。</RsAlert>
      <RsAlert type="danger" title="错误">请求失败，请稍后重试。</RsAlert>
    </div>
  </DocDemo>

  <DocDemo id="demo-close" title="可关闭">
    <RsAlert v-if="visible" type="info" title="可关闭" closable @close="visible = false">
      点击右上角关闭。刷新或重新打开页面后可再次展示。
    </RsAlert>
    <RsAlert v-else type="default" title="已关闭">提示已关闭。</RsAlert>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
