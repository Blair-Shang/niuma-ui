<script setup lang="ts">
import { RsButton, RsEmpty, RsIcon } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法" description="description 由业务传入。默认插槽放下一步操作。">
    <RsEmpty title="还没有项目" description="创建第一个项目，开始协作与发布。">
      <template #icon>
        <RsIcon name="folder-open" :size="22" />
      </template>
      <RsButton variant="primary" size="sm">新建项目</RsButton>
    </RsEmpty>
  </DocDemo>
</template>
