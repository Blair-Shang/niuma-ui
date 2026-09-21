<script setup lang="ts">
import { ref } from 'vue'
import { RsButton, RsDialog, RsInput } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const formOpen = ref(false)
const windowOpen = ref(false)
const name = ref('')
</script>

<template>
  <DocDemo
    id="demo-form"
    title="居中表单窗"
    description="layout=&quot;form&quot; 适合短表单与说明。确认/删除请用 ConfirmDialog。"
  >
    <RsButton variant="default" @click="formOpen = true">打开表单窗</RsButton>
    <RsDialog v-model:open="formOpen" layout="form" title="新建连接" show-footer>
      <RsInput v-model="name" label="名称" placeholder="生产库" />
    </RsDialog>
  </DocDemo>

  <DocDemo
    id="demo-window"
    title="工作窗"
    description="layout=&quot;window&quot; 可拖拽与缩放，适合桌面工作台中的会话或编辑器。"
  >
    <RsButton @click="windowOpen = true">打开工作窗</RsButton>
    <RsDialog v-model:open="windowOpen" title="会话" width="lg">
      可拖拽标题栏、缩放边角。遮罩默认关闭，以免挡住背后工作区。
    </RsDialog>
  </DocDemo>
</template>
