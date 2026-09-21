<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RsTerminal } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const terminalRef = ref<InstanceType<typeof RsTerminal> | null>(null)

onMounted(() => {
  terminalRef.value?.write('\x1b[1;36mniuma-ui\x1b[0m terminal\r\n$ echo hello\r\nhello\r\n$ ')
})

function onData(data: string): void {
  if (data === '\r') {
    terminalRef.value?.write('\r\n$ ')
    return
  }
  terminalRef.value?.write(data)
}
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="嵌入终端"
    description="xterm 外壳。演示只回显输入。真实 PTY / WebSocket 由业务接到 @data 与 write()。"
  >
    <div class="wrap">
      <RsTerminal ref="terminalRef" :zebra-stripes="true" @data="onData" />
    </div>
  </DocDemo>
</template>

<style scoped>
.wrap {
  height: 12rem;
}
</style>
