<script setup lang="ts">
import { ref } from 'vue'
import { RsUpload } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const files = ref<File[]>([])
const images = ref<File[]>([])
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基础上传"
    description="默认单文件。点击选择或拖入虚线区域。v-model 绑定 File[]。"
  >
    <RsUpload v-model="files" label="上传附件" hint="支持拖拽，也可点击选择" />
  </DocDemo>

  <DocDemo
    id="demo-accept"
    title="类型与数量"
    description="accept / max-count / max-size 在选择时校验，违规触发 reject。"
  >
    <RsUpload
      v-model="images"
      multiple
      accept="image/*"
      :max-count="3"
      label="上传图片"
      hint="PNG / JPG · 最多 3 张"
    />
  </DocDemo>
</template>
