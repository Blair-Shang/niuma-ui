<script setup lang="ts">
import { RsDescriptions, RsDescriptionsItem, RsTag } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const items = [
  { key: 'name', label: '名称', value: 'niuma-ui' },
  { key: 'version', label: '版本', value: '1.1.0' },
  { key: 'license', label: '协议', value: 'Apache-2.0' },
  { key: 'author', label: '作者', value: 'Blair Shang', span: 2 },
  { key: 'desc', label: '说明', value: 'Vue 3 组件库', span: 3 },
]

const api: DemoApiRow[] = [
  { name: 'title', type: 'string', description: '标题文案' },
  { name: 'items', type: 'RsDescriptionsItem[]', default: '[]', description: '数据驱动条目' },
  { name: 'columns', type: 'number', default: '3', description: '栅格列数' },
  { name: "labelPlacement", type: "'left' | 'top'", default: "'left'", description: '标签位置' },
  { name: 'bordered', type: 'boolean', default: 'true', description: '是否显示边框' },
  { name: 'size', type: "'ssm' | 'sm' | 'md' | 'lg'", default: 'ConfigProvider', description: '尺寸' },
  { name: 'radius', type: 'RsRadius', default: "'md'", description: '边框圆角' },
]
</script>

<template>
  <DemoPage title="RsDescriptions" test-file="RsDescriptions.spec.ts" :api="api">
    <DemoBlock title="数据驱动 items">
      <RsDescriptions title="组件信息" :items="items" />
    </DemoBlock>

    <DemoBlock title="标签置顶 / 无边框">
      <div class="stack">
        <RsDescriptions title="置顶标签" :items="items.slice(0, 3)" label-placement="top" :columns="3" />
        <RsDescriptions title="无边框" :items="items.slice(0, 3)" :bordered="false" />
      </div>
    </DemoBlock>

    <DemoBlock title="插槽自定义">
      <RsDescriptions title="运行状态" :columns="2">
        <RsDescriptionsItem label="环境">生产</RsDescriptionsItem>
        <RsDescriptionsItem label="状态">
          <RsTag variant="success" size="sm">Healthy</RsTag>
        </RsDescriptionsItem>
        <RsDescriptionsItem label="备注" :span="2">
          最近一次健康检查通过。
        </RsDescriptionsItem>
      </RsDescriptions>
    </DemoBlock>

    <DemoBlock title="尺寸">
      <div class="stack">
        <RsDescriptions size="sm" title="sm" :items="items.slice(0, 3)" :columns="3" />
        <RsDescriptions size="lg" title="lg" :items="items.slice(0, 3)" :columns="3" />
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
</style>
