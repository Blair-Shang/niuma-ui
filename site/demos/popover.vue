<script setup lang="ts">
import { RsButton, RsPopover } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="默认插槽是触发器，#content 是浮层。短提示用 Tooltip；长说明或操作放这里。"
  >
    <RsPopover>
      <RsButton variant="default">打开说明</RsButton>
      <template #content>
        <p class="text">连接成功后会写入会话。可在此放快捷操作或短表单。</p>
      </template>
    </RsPopover>
  </DocDemo>
</template>

<style scoped>
.text {
  margin: 0;
  max-width: 16rem;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}
</style>
