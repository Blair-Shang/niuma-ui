<script setup lang="ts">
import { ref } from 'vue'
import { RsInputNumber } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const port = ref(5432)
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法" description="约束为数字，支持步进与范围。">
    <RsInputNumber v-model="port" :min="1" :max="65535" label="端口" />
  </DocDemo>
</template>
