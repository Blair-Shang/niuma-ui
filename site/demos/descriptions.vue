<script setup lang="ts">
import { RsDescriptions, RsDescriptionsItem, RsTag } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const items = [
  { key: 'name', label: '名称', value: 'niuma-ui' },
  { key: 'version', label: '版本', value: '1.1.0' },
  { key: 'license', label: '协议', value: 'Apache-2.0' },
]
</script>

<template>
  <DocDemo id="demo-items" title="数据驱动" description="传入 items 即可。columns 控制列数，label-placement 可置顶。">
    <RsDescriptions title="组件信息" :items="items" :columns="3" />
  </DocDemo>

  <DocDemo id="demo-slot" title="插槽" description="需要自定义内容时用 RsDescriptionsItem。">
    <RsDescriptions title="运行状态" :columns="2">
      <RsDescriptionsItem label="环境">生产</RsDescriptionsItem>
      <RsDescriptionsItem label="状态">
        <RsTag variant="success" size="sm">Healthy</RsTag>
      </RsDescriptionsItem>
    </RsDescriptions>
  </DocDemo>
</template>
