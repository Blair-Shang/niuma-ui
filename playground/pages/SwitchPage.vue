<script setup lang="ts">
import { ref } from 'vue'
import { RsSwitch } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref(false)
const labeled = ref(true)
const sizeDemo = ref(true)
</script>

<template>
  <DemoPage title="RsSwitch" test-file="RsSwitch.spec.ts">
    <DemoBlock title="基础">
      <div class="row">
        <RsSwitch v-model="basic" />
        <RsSwitch :model-value="true" disabled />
        <RsSwitch :model-value="false" disabled />
      </div>
    </DemoBlock>

    <DemoBlock title="带文案">
      <div class="row">
        <RsSwitch v-model="labeled">启用通知</RsSwitch>
        <RsSwitch :model-value="false" disabled>已禁用</RsSwitch>
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸">
      <div class="row">
        <RsSwitch v-model="sizeDemo" size="ssm">ssm</RsSwitch>
        <RsSwitch v-model="sizeDemo" size="sm">sm</RsSwitch>
        <RsSwitch v-model="sizeDemo" size="md">md</RsSwitch>
        <RsSwitch v-model="sizeDemo" size="lg">lg</RsSwitch>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}
</style>
