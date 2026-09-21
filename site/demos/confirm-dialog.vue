<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsConfirmDialog } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const open = ref(false)
const infoOpen = ref(false)
</script>

<template>
  <DocDemo
    id="demo-delete"
    title="危险确认"
    description="删除、不可恢复操作用 ConfirmDialog，不要用普通 Dialog。命令式也可 rsConfirm()。"
  >
    <RsButton variant="danger" @click="open = true">删除资源</RsButton>
    <RsConfirmDialog
      v-model:open="open"
      title="确认删除"
      subtitle="此操作不可恢复"
      description="确定要删除选中的资源吗？"
      confirm-text="确定删除"
      confirm-variant="danger"
      tone="danger"
    />
  </DocDemo>

  <DocDemo id="demo-info" title="信息确认" description="非破坏操作用 tone=&quot;info&quot; 与 primary 按钮。">
    <RsButton variant="default" @click="infoOpen = true">发布</RsButton>
    <RsConfirmDialog
      v-model:open="infoOpen"
      title="确认发布"
      description="将把当前版本推送到生产环境。"
      confirm-text="发布"
      confirm-variant="primary"
      tone="info"
    />
  </DocDemo>
</template>
