<script setup lang="ts">
import { ref } from 'vue'
import { RsCodeEditor } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const json = ref('{\n  "name": "niuma-ui",\n  "version": "1.0.0"\n}')
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="轻量编辑"
    description="CodeMirror 内核。v-model 绑定源码，language 决定高亮。重型 IDE 能力用 MonacoEditor。"
  >
    <RsCodeEditor v-model="json" language="json" :height="160" />
  </DocDemo>
</template>
