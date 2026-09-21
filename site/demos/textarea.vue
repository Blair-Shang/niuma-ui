<script setup lang="ts">
import { ref } from 'vue'
import { RsTextarea } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const note = ref('')
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法" description="多行文本。autosize 随内容增高，Token 与 Input 对齐。">
    <RsTextarea
      v-model="note"
      label="备注"
      placeholder="补充说明"
      :autosize="{ minRows: 3, maxRows: 8 }"
      :maxlength="200"
      show-count
      style="max-width: 28rem"
    />
  </DocDemo>
</template>
