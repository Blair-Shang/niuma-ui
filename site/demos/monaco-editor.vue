<script setup lang="ts">
import { ref } from 'vue'
import { RsMonacoEditor } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const code = ref('{\n  "name": "niuma",\n  "active": true\n}')
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="VS Code 内核"
    description="最小 JSON 示例。首次加载会拉取 Monaco worker，适合需要格式化、查找替换、JSON Schema 的场景。"
  >
    <RsMonacoEditor v-model="code" language="json" :height="160" />
  </DocDemo>
</template>
