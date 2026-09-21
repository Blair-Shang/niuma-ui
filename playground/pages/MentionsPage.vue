<script setup lang="ts">
import { ref } from 'vue'
import { RsMentions } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const text = ref('你好 @')
const options = [
  { label: 'Alice', value: 'alice' },
  { label: 'Bob', value: 'bob' },
  { label: 'Chris', value: 'chris', disabled: true },
]
</script>

<template>
  <DemoPage title="RsMentions" test-file="mentions-utils.spec.ts">
    <DemoBlock title="@ 提及">
      <RsMentions v-model="text" allow-clear :options="options" />
    </DemoBlock>
    <DemoBlock title="多触发符 / 只读">
      <RsMentions v-model="text" :prefix="['@', '#']" :options="options" />
      <RsMentions readonly model-value="Hello @alice" :options="options" />
    </DemoBlock>
  </DemoPage>
</template>
