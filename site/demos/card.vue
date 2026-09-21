<script setup lang="ts">
import { RsButton, RsCard } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法" description="标题、主体与页脚收在同一表面。表单分组请用 Fieldset。">
    <RsCard title="连接信息">
      主机 10.0.0.12 · 端口 5432
      <template #footer>
        <RsButton size="sm" variant="default">测试连接</RsButton>
      </template>
    </RsCard>
  </DocDemo>
</template>
