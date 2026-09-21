<script setup lang="ts">
import { ref } from 'vue'
import { RsDynamicTags } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const tags = ref(['Vue', 'TypeScript'])
const always = ref(['设计', '研发'])
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="触发式创建"
    description="默认 input-mode=&quot;trigger&quot;：点击 + 再输入。Enter 添加，Esc 取消。"
  >
    <RsDynamicTags v-model="tags" />
  </DocDemo>

  <DocDemo id="demo-always" title="常驻输入" description="input-mode=&quot;always&quot; 始终显示输入框。max 限制数量。">
    <RsDynamicTags v-model="always" input-mode="always" :max="6" tag-variant="primary" />
  </DocDemo>
</template>
