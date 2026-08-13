<script setup lang="ts">
import { ref } from 'vue'
import { RsAlert, RsIcon } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const showClosable = ref(true)
</script>

<template>
  <DemoPage title="RsAlert" test-file="—">
    <DemoBlock title="类型一览">
      <div class="stack">
        <RsAlert type="default" title="默认提示">用于中性说明信息。</RsAlert>
        <RsAlert type="info" title="信息">配置已同步到所有环境。</RsAlert>
        <RsAlert type="success" title="成功">部署完成，服务已就绪。</RsAlert>
        <RsAlert type="warning" title="警告">配额即将用尽，请及时扩容。</RsAlert>
        <RsAlert type="danger" title="错误">请求失败，请稍后重试。</RsAlert>
      </div>
    </DemoBlock>

    <DemoBlock title="可关闭">
      <RsAlert
        v-if="showClosable"
        type="info"
        title="可关闭提示"
        closable
        @close="showClosable = false"
      >
        点击右上角关闭；关闭后需刷新页面再次查看。
      </RsAlert>
      <RsAlert v-else type="default" title="已关闭">
        <button type="button" class="linkish" @click="showClosable = true">重新显示</button>
      </RsAlert>
    </DemoBlock>

    <DemoBlock title="自定义图标 / 无边框">
      <div class="stack">
        <RsAlert type="success" title="自定义图标">
          <template #icon>
            <RsIcon name="star" :size="16" />
          </template>
          通过 #icon 插槽替换默认图标。
        </RsAlert>
        <RsAlert type="warning" title="无边框" :bordered="false">
          bordered=false 时不绘制描边。
        </RsAlert>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.linkish {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--rs-primary);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
}
</style>
