<script setup lang="ts">
import { RsButton, useRsToast } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const toast = useRsToast()
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="轻量反馈"
    description="站点根已挂 RsToaster。业务只调 useRsToast()。页面内持久提示用 Alert。"
  >
    <div class="row">
      <RsButton size="sm" @click="toast.success('操作已完成')">成功</RsButton>
      <RsButton size="sm" variant="default" @click="toast.info('新版本可用')">信息</RsButton>
      <RsButton size="sm" variant="default" @click="toast.warning('配额即将用尽')">警告</RsButton>
      <RsButton size="sm" variant="danger" @click="toast.error('提交失败，请重试')">错误</RsButton>
    </div>
  </DocDemo>

  <DocDemo id="demo-desc" title="标题与描述" description="传入对象可带 title / description / duration。">
    <RsButton
      size="sm"
      variant="default"
      @click="
        toast.success({
          title: '成员已邀请',
          description: '邀请邮件 24 小时内有效。',
        })
      "
    >
      带描述
    </RsButton>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
