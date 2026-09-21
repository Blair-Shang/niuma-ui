<script setup lang="ts">
import { ref } from 'vue'
import { RsTabs, type RsTabItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const tab = ref('overview')
const items: RsTabItem[] = [
  { value: 'overview', label: '概览' },
  { value: 'analytics', label: '分析', badge: 3 },
  { value: 'settings', label: '设置', icon: 'settings' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基础标签页"
    description="默认 variant=&quot;line&quot;。面板内容用与 value 同名的插槽传入。"
  >
    <RsTabs v-model="tab" :items="items">
      <template #overview>应用运行正常，今日请求 12,480 次。</template>
      <template #analytics>近 7 日活跃用户 1,024。</template>
      <template #settings>模型参数与访问权限。</template>
    </RsTabs>
  </DocDemo>
</template>
