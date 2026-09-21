<script setup lang="ts">
import { RsBreadcrumb } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法">
    <RsBreadcrumb
      :items="[
        { label: '工作台', href: '#/' },
        { label: '数据库', href: '#/components/tree' },
        { label: 'orders' },
      ]"
    />
  </DocDemo>
</template>
