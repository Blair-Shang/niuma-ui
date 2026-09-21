<script setup lang="ts">
import { RsCodeBlock } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const sample = `import { RsButton } from 'niuma-ui'

export function save() {
  return RsButton
}`
</script>

<template>
  <DocDemo id="demo-basic" title="只读代码块" description="文档与响应展示。需要编辑请用 CodeEditor 或 Monaco。">
    <RsCodeBlock :code="sample" lang="ts" />
  </DocDemo>
</template>
