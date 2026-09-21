<script setup lang="ts">
import { RsButton, RsTooltip } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法" description="为图标或截断文本提供一句补充。长内容请用 Popover。">
    <RsTooltip content="复制连接字符串">
      <RsButton icon="copy" icon-only aria-label="复制" variant="ghost" />
    </RsTooltip>
  </DocDemo>
</template>
