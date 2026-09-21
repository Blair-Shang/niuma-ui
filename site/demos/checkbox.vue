<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsCheckbox } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const a = ref(true)
const b = ref(false)
const all = computed({
  get: () => a.value && b.value,
  set: (value: boolean) => {
    a.value = value
    b.value = value
  },
})
const half = computed(() => a.value !== b.value)
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法">
    <div class="stack">
      <RsCheckbox v-model="a">读取</RsCheckbox>
      <RsCheckbox v-model="b">写入</RsCheckbox>
      <RsCheckbox disabled :model-value="true">已禁用</RsCheckbox>
    </div>
  </DocDemo>
  <DocDemo id="demo-half" title="半选" description="indeterminate 只影响视觉，点击仍按 v-model 取反。常用于「全选」与部分子项。">
    <div class="stack">
      <RsCheckbox v-model="all" :indeterminate="half">全选</RsCheckbox>
      <RsCheckbox v-model="a">子项 A</RsCheckbox>
      <RsCheckbox v-model="b">子项 B</RsCheckbox>
    </div>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
</style>
