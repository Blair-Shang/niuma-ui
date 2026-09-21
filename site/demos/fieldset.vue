<script setup lang="ts">
import { reactive } from 'vue'
import { RsFieldset, RsForm, RsFormItem, RsInput, RsSelect } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const model = reactive({
  name: '弱水工作室',
  env: 'prod',
})

const envs = [
  { label: '生产', value: 'prod' },
  { label: '预发', value: 'stage' },
]
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="表单分区"
    description="Fieldset 是原生 fieldset / legend 分组，不是卡片。说明走标题旁 tooltip。"
  >
    <RsForm :model="model" max-width="md">
      <RsFieldset legend="账号" tooltip="登录与显示名称" size="sm">
        <RsFormItem name="name" label="显示名称" required>
          <RsInput v-model="model.name" />
        </RsFormItem>
      </RsFieldset>
      <RsFieldset legend="推送" tooltip="写入远程目录" size="sm" border-tone="subtle">
        <RsFormItem name="env" label="环境">
          <RsSelect v-model="model.env" :options="envs" />
        </RsFormItem>
      </RsFieldset>
    </RsForm>
  </DocDemo>
</template>
