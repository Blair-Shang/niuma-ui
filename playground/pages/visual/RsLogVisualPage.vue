<script setup lang="ts">
/**
 * Playwright 折行布局夹具：复现作业/发版日志「height: 100% 撑满栏 + wrap」。
 * 非演示页，不进入侧栏目录。
 */
import { onMounted } from 'vue'
import { RsLog, useRsConfig } from 'niuma-ui'

const wrapLines = [
  '[2026/9/10 17:02:58] 预同步 Git（2/43）：flux-collaboration-adapterexpress  pull origin release/V9.0.0-P08-03 --ff-only',
  '[INFO] clone https://git.example.com/group/very-long-repo-name-flux-collaboration-adapterexpress.git into /data/autopack/workspaces/ws-001/src/flux-collaboration-adapterexpress',
  'done.',
].join('\n')

const { setTheme, setLocale } = useRsConfig()

onMounted(() => {
  setTheme('light')
  setLocale('zh-CN')
})
</script>

<template>
  <div class="rs-log-visual" data-testid="rs-log-visual-root">
    <section class="rs-log-visual__fill" data-testid="rs-log-wrap-fill">
      <RsLog
        :lines="wrapLines"
        wrap
        follow
        height="100%"
        :show-search="false"
        :show-copy="false"
        aria-label="Wrap fill height log"
      />
    </section>
    <section class="rs-log-visual__narrow" data-testid="rs-log-wrap-narrow">
      <RsLog
        :lines="wrapLines"
        wrap
        :follow="false"
        :height="160"
        :show-search="false"
        :show-copy="false"
        aria-label="Wrap narrow log"
      />
    </section>
  </div>
</template>

<style scoped>
.rs-log-visual {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  font-family: Arial, Helvetica, sans-serif;
}
.rs-log-visual :deep(*),
.rs-log-visual :deep(*::before),
.rs-log-visual :deep(*::after) {
  animation: none !important;
  transition: none !important;
}
.rs-log-visual__fill {
  width: 360px;
  height: 360px;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}
.rs-log-visual__fill :deep(.rs-log) {
  flex: 1;
  min-height: 0;
  width: 100%;
}
.rs-log-visual__narrow {
  width: 240px;
}
</style>
