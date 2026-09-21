<script setup lang="ts">
import { ref } from 'vue'
import { RsSteps, type RsStepItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const step = ref('profile')
const items: RsStepItem[] = [
  { value: 'account', title: '账号信息' },
  { value: 'profile', title: '个人资料', description: '头像与简介' },
  { value: 'done', title: '完成' },
]
const vertical = ref('mapping')
const verticalItems: RsStepItem[] = [
  { value: 'upload', title: '上传' },
  { value: 'mapping', title: '映射' },
  { value: 'import', title: '导入' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="水平步骤"
    description="v-model 绑定当前步骤 value。之前为 finish，当前 process，之后 wait。"
  >
    <RsSteps v-model="step" :items="items" clickable />
  </DocDemo>

  <DocDemo id="demo-vertical" title="纵向" description="orientation=&quot;vertical&quot; 适合向导侧栏。">
    <RsSteps v-model="vertical" :items="verticalItems" orientation="vertical" clickable />
  </DocDemo>
</template>
