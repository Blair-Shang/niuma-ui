<script setup lang="ts">
import { ref } from 'vue'
import { RsInput, RsLabel } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const email = ref('')
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="关联输入框"
    description="新表单优先用 RsInput 内置 label。独立 RsLabel 适合 Select 或自定义排版；for-id 点击即可聚焦。"
  >
    <div class="field">
      <RsLabel for-id="doc-email" required hint="用于登录与通知">邮箱地址</RsLabel>
      <RsInput id="doc-email" v-model="email" type="email" placeholder="you@example.com" />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-width: 20rem;
}
</style>
