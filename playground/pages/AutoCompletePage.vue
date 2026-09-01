<script setup lang="ts">
import { ref } from 'vue'
import { RsAutoComplete } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const value = ref('')
const options = ['GPT-4o', 'Claude', 'DeepSeek', 'Gemini']
</script>

<template>
  <DemoPage title="RsAutoComplete" test-file="RsAutoComplete.spec.ts">
    <DemoBlock title="输入即建议">
      <p class="hint">和 RsSelect 不同：在触发器里打字。Select 的搜索 / 创建仍在面板内。</p>
      <RsAutoComplete v-model="value" allow-clear :options="options" placeholder="输入模型名" />
      <p>当前：{{ value || '—' }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  color: var(--rs-muted);
}
</style>
