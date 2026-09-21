<script setup lang="ts">
import { ref } from 'vue'
import { RsAutoComplete } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const value = ref('')
const options = ['GPT-4o', 'Claude', 'DeepSeek', 'Gemini']
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="输入即建议"
    description="与 Select 不同：在触发器里打字过滤。Select 的搜索仍在面板内。"
  >
    <div class="field">
      <RsAutoComplete v-model="value" allow-clear :options="options" placeholder="输入模型名" />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 20rem;
}
</style>
