<script setup lang="ts">
import { ref } from 'vue'
import { RsTag } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const tags = ref(['可关闭', '前端', '设计'])

const api: DemoApiRow[] = [
  { name: 'variant', type: "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: '语义色变体' },
  { name: 'size', type: "'ssm' | 'sm' | 'md' | 'lg'", default: 'ConfigProvider', description: '尺寸档位' },
  { name: 'radius', type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'full'", default: "'sm'", description: '圆角档位' },
  { name: 'round', type: 'boolean', default: 'false', description: '胶囊圆角快捷开关' },
  { name: 'closable', type: 'boolean', default: 'false', description: '显示关闭按钮' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '禁用交互' },
]

function removeTag(index: number): void {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<template>
  <DemoPage title="RsTag" test-file="—" :api="api">
    <DemoBlock title="变体一览">
      <div class="row">
        <RsTag>默认</RsTag>
        <RsTag variant="primary">主色</RsTag>
        <RsTag variant="success">成功</RsTag>
        <RsTag variant="warning">警告</RsTag>
        <RsTag variant="danger">危险</RsTag>
        <RsTag variant="info">信息</RsTag>
      </div>
    </DemoBlock>

    <DemoBlock title="可关闭">
      <div class="row">
        <RsTag
          v-for="(tag, index) in tags"
          :key="tag"
          closable
          variant="primary"
          @close="removeTag(index)"
        >
          {{ tag }}
        </RsTag>
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸与圆角">
      <div class="row">
        <RsTag size="ssm">ssm</RsTag>
        <RsTag size="sm">sm</RsTag>
        <RsTag size="md">md</RsTag>
        <RsTag size="lg">lg</RsTag>
        <RsTag round variant="info">round</RsTag>
        <RsTag radius="none" variant="warning">radius none</RsTag>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用">
      <div class="row">
        <RsTag disabled>禁用</RsTag>
        <RsTag disabled closable variant="danger">不可关闭</RsTag>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
</style>
