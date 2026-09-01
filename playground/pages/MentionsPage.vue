<script setup lang="ts">
import { ref } from 'vue'
import { RsMentions } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const text = ref('你好 @')
const options = [
  { label: 'Alice', value: 'alice' },
  { label: 'Bob', value: 'bob' },
]
</script>

<template>
  <DemoPage title="RsMentions" test-file="mentions-utils.spec.ts">
    <DemoBlock title="@ 提及">
      <RsMentions v-model="text" :options="options" />
    </DemoBlock>
  </DemoPage>
</template>
