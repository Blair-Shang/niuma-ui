<script setup lang="ts">
import { ref } from 'vue'
import { RsRadio, RsRadioItem } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const fruit = ref('apple')
const sizeValue = ref('md')
const plan = ref('pro')
</script>

<template>
  <DemoPage title="RsRadio" test-file="—">
    <DemoBlock title="水平">
      <RsRadio v-model="fruit">
        <RsRadioItem value="apple">苹果</RsRadioItem>
        <RsRadioItem value="banana">香蕉</RsRadioItem>
        <RsRadioItem value="orange">橙子</RsRadioItem>
      </RsRadio>
      <p class="hint">当前：{{ fruit }}</p>
    </DemoBlock>

    <DemoBlock title="垂直">
      <RsRadio v-model="plan" orientation="vertical">
        <RsRadioItem value="free">Free</RsRadioItem>
        <RsRadioItem value="pro">Pro</RsRadioItem>
        <RsRadioItem value="enterprise">Enterprise</RsRadioItem>
      </RsRadio>
    </DemoBlock>

    <DemoBlock title="尺寸">
      <div class="stack">
        <RsRadio v-model="sizeValue" size="sm">
          <RsRadioItem value="sm">sm</RsRadioItem>
          <RsRadioItem value="md">md</RsRadioItem>
          <RsRadioItem value="lg">lg</RsRadioItem>
        </RsRadio>
        <RsRadio v-model="sizeValue" size="lg">
          <RsRadioItem value="sm">sm</RsRadioItem>
          <RsRadioItem value="md">md</RsRadioItem>
          <RsRadioItem value="lg">lg</RsRadioItem>
        </RsRadio>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用">
      <RsRadio model-value="a" disabled>
        <RsRadioItem value="a">选项 A</RsRadioItem>
        <RsRadioItem value="b">选项 B</RsRadioItem>
      </RsRadio>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.hint {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
</style>
