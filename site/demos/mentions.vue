<script setup lang="ts">
import { ref } from 'vue'
import { RsMentions } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const text = ref('你好 @')
const options = [
  { label: 'Alice', value: 'alice' },
  { label: 'Bob', value: 'bob' },
]
</script>

<template>
  <DocDemo id="demo-basic" title="@ 提及" description="输入 @ 弹出候选。选项为 label / value。">
    <RsMentions v-model="text" :options="options" />
  </DocDemo>
</template>
