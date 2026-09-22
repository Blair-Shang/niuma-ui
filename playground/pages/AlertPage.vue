<script setup lang="ts">
import { ref } from 'vue'
import { RsAlert, RsButton, RsIcon, type RsAlertExpose } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const showClosable = ref(true)
const alertRef = ref<RsAlertExpose | null>(null)
</script>

<template>
  <DemoPage title="RsAlert" test-file="src/components/alert/__tests__/RsAlert.spec.ts">
    <DemoBlock title="类型一览">
      <div class="stack">
        <RsAlert type="default" title="默认提示">用于中性说明信息。</RsAlert>
        <RsAlert type="info" title="信息">配置已同步到所有环境。</RsAlert>
        <RsAlert type="success" title="成功">部署完成，服务已就绪。</RsAlert>
        <RsAlert type="warning" title="警告">配额即将用尽，请及时扩容。</RsAlert>
        <RsAlert type="danger" title="错误">请求失败，请稍后重试。</RsAlert>
      </div>
    </DemoBlock>

    <DemoBlock title="形态 / 横幅 / 密度">
      <div class="stack">
        <RsAlert tone="info" variant="outline" title="描边" />
        <RsAlert tone="success" variant="solid" title="实心">Deploy finished.</RsAlert>
        <RsAlert banner tone="warning" title="通栏">banner 强制直角。</RsAlert>
        <RsAlert size="sm" radius="sm" tone="info" title="sm" />
      </div>
    </DemoBlock>

    <DemoBlock title="可关闭">
      <RsAlert
        v-if="showClosable"
        ref="alertRef"
        type="info"
        title="可关闭提示"
        closable
        @close="showClosable = false"
      >
        点击右上角关闭；关闭后需刷新页面再次查看。
      </RsAlert>
      <div v-else class="row">
        <RsAlert type="default" title="已关闭">
          <button type="button" class="linkish" @click="showClosable = true">重新显示</button>
        </RsAlert>
      </div>
      <RsButton v-if="showClosable" variant="default" @click="alertRef?.focus()">focus()</RsButton>
    </DemoBlock>

    <DemoBlock title="自定义图标 / 无边框 / 操作">
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
        <RsAlert tone="danger" title="带操作" closable close-text="隐藏">
          支付失败。
          <template #action>
            <RsButton size="sm" variant="default">重试</RsButton>
          </template>
        </RsAlert>
        <RsAlert :show-icon="false" title="无图标" description="description prop 与默认插槽等价。" />
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
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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
