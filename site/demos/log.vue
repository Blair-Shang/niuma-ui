<script setup lang="ts">
import { RsLog, type RsLogLine } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const lines: RsLogLine[] = [
  { time: '12:00:01', level: 'info', text: 'sync workspace sources' },
  { time: '12:00:03', level: 'success', text: 'build ok: niuma-ui' },
  { time: '12:00:04', level: 'warn', text: 'skip tests' },
  { time: '12:00:05', level: 'error', text: 'ftp_push failed: connection refused' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="结构化日志"
    description=":lines 可为字符串或 RsLogLine[]。show-time / show-line-no 控制列。实时追加用 v-model:lines。"
  >
    <RsLog :lines="lines" :height="180" show-time show-line-no />
  </DocDemo>
</template>
