<script setup lang="ts">
import { ref } from 'vue'
import { RsSelect, type RsSelectOption } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const model = ref('gpt-4o')
const roles = ref<string[]>(['member'])
const options: RsSelectOption[] = [
  { label: '弱水 GPT-4o', value: 'gpt-4o' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Claude', value: 'claude' },
]
const roleOptions: RsSelectOption[] = [
  { label: '管理员', value: 'admin' },
  { label: '成员', value: 'member' },
  { label: '访客', value: 'guest' },
]

const basicCode = `<RsSelect v-model="model" :options="options" />`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="从列表中选择一项。选项很多、需要搜索或远程加载时用 Select，而不是 Radio。"
    :code="basicCode"
  >
    <div class="field">
      <RsSelect v-model="model" :options="options" />
    </div>
  </DocDemo>
  <DocDemo id="demo-search" title="搜索与多选">
    <div class="stack">
      <RsSelect v-model="model" :options="options" searchable clearable placeholder="搜索模型" />
      <RsSelect v-model="roles" :options="roleOptions" multiple clearable placeholder="选择角色" />
    </div>
  </DocDemo>
</template>

<style scoped>
.field,
.stack {
  max-width: 20rem;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
