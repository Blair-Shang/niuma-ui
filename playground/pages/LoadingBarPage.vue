<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { RsButton, RsLoadingBar, useRsLoadingBar } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

/** 依赖 App 根部已挂载的 RsLoadingBar */
const loadingBar = useRsLoadingBar()
const controlled = ref(0)
let controlledTimer: ReturnType<typeof setInterval> | null = null

const api: DemoApiRow[] = [
  { name: 'progress', type: 'number', description: '受控进度 0–100；未传时由 API 驱动' },
  { name: 'height', type: 'number', default: '2', description: '条高度（px）' },
  { name: 'color', type: 'string', default: 'var(--rs-primary)', description: '进度色' },
  { name: 'errorColor', type: 'string', default: 'var(--rs-danger)', description: '错误色' },
]

function startDemo(): void {
  loadingBar.start()
}

function finishDemo(): void {
  loadingBar.finish()
}

function errorDemo(): void {
  loadingBar.error()
}

function runControlled(): void {
  if (controlledTimer) clearInterval(controlledTimer)
  controlled.value = 0
  controlledTimer = setInterval(() => {
    controlled.value = Math.min(100, controlled.value + 8)
    if (controlled.value >= 100 && controlledTimer) {
      clearInterval(controlledTimer)
      controlledTimer = null
    }
  }, 120)
}

onBeforeUnmount(() => {
  if (controlledTimer) clearInterval(controlledTimer)
})
</script>

<template>
  <DemoPage title="RsLoadingBar" test-file="—" :api="api">
    <DemoBlock title="命令式 API">
      <p class="hint">
        Playground 根部已挂载 <code>RsLoadingBar</code>，本页通过
        <code>useRsLoadingBar()</code> 调用 start / finish / error。进度条固定在视口顶部。
      </p>
      <div class="row">
        <RsButton size="sm" @click="startDemo">start</RsButton>
        <RsButton size="sm" variant="default" @click="finishDemo">finish</RsButton>
        <RsButton size="sm" variant="danger" @click="errorDemo">error</RsButton>
      </div>
    </DemoBlock>

    <DemoBlock title="受控 progress">
      <p class="hint">
        另挂一个受控实例演示 <code>:progress</code>（与根部命令式宿主互不影响）。当前 =
        {{ controlled }}
      </p>
      <div class="row">
        <RsButton size="sm" @click="runControlled">模拟加载到 100%</RsButton>
        <RsButton size="sm" variant="default" @click="controlled = 0">重置</RsButton>
      </div>
      <RsLoadingBar :progress="controlled" color="var(--rs-info)" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.hint {
  margin: 0 0 0.75rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
</style>
