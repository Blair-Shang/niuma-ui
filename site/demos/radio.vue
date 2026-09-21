<script setup lang="ts">
import { ref } from 'vue'
import { RsRadio, RsRadioItem } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const plan = ref('pro')
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="选项很少且需要同时可见时用单选；选项多或需搜索时用 Select。"
  >
    <RsRadio v-model="plan">
      <RsRadioItem value="free">Free</RsRadioItem>
      <RsRadioItem value="pro">Pro</RsRadioItem>
      <RsRadioItem value="enterprise">Enterprise</RsRadioItem>
    </RsRadio>
  </DocDemo>
  <DocDemo id="demo-vertical" title="垂直排列">
    <RsRadio v-model="plan" orientation="vertical">
      <RsRadioItem value="free">Free — 个人试用</RsRadioItem>
      <RsRadioItem value="pro">Pro — 团队协作</RsRadioItem>
      <RsRadioItem value="enterprise">Enterprise — 组织管控</RsRadioItem>
    </RsRadio>
  </DocDemo>
</template>
