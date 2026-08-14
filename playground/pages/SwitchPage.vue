<script setup lang="ts">
import { ref } from 'vue'
import { RsSwitch } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage, { type DemoApiRow } from '../components/DemoPage.vue'

const basic = ref(false)
const labeled = ref(true)
const sizeDemo = ref(true)
const ynFlag = ref('N')

const switchApi: DemoApiRow[] = [
  { name: 'v-model', type: 'boolean | string | number', default: 'false', description: '开关值；配合 checkedValue / uncheckedValue 可写业务码' },
  { name: 'checkedValue', type: 'boolean | string | number', default: 'true', description: '打开时写入 v-model 的值' },
  { name: 'uncheckedValue', type: 'boolean | string | number', default: 'false', description: '关闭时写入 v-model 的值' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '禁用' },
  { name: 'size', type: "'ssm' | 'sm' | 'md' | 'lg'", default: "'md'", description: '控件尺寸' },
  { name: 'ariaLabel', type: 'string', description: '无障碍名称；有默认插槽文案时可省略' },
  { name: 'change', type: '(value) => void', description: '切换后回调，参数与 v-model 相同' },
]

const customValueCode = `<RsSwitch v-model="flag" checked-value="Y" unchecked-value="N" />`
</script>

<template>
  <DemoPage title="RsSwitch" test-file="RsSwitch.spec.ts" :api="switchApi">
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

    <DemoBlock title="自定义选中值" :code="customValueCode">
      <div class="row">
        <RsSwitch v-model="ynFlag" checked-value="Y" unchecked-value="N">
          部门管理员
        </RsSwitch>
        <code>v-model = {{ JSON.stringify(ynFlag) }}</code>
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
