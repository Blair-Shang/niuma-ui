<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsDrawer, RsInput } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const open = ref(false)
const name = ref('Alice')
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="侧滑抽屉"
    description="默认 side=&quot;right&quot;、size=&quot;md&quot;。适合筛选、详情。表单窗请用 Dialog。"
  >
    <RsButton @click="open = true">编辑资料</RsButton>
    <RsDrawer v-model:open="open" title="个人资料" description="更新显示名称。">
      <RsInput v-model="name" label="名称" />
      <template #footer>
        <RsButton variant="default" @click="open = false">取消</RsButton>
        <RsButton @click="open = false">保存</RsButton>
      </template>
    </RsDrawer>
  </DocDemo>
</template>
