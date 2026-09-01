<script setup lang="ts">
import { ref } from 'vue'
import { RsCascader, type RsCascaderOption } from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const path = ref<(string | number)[]>([])
const options: RsCascaderOption[] = [
  {
    label: '华东',
    value: 'east',
    children: [
      { label: '上海', value: 'sh' },
      { label: '杭州', value: 'hz' },
    ],
  },
  {
    label: '华北',
    value: 'north',
    children: [
      { label: '北京', value: 'bj' },
      { label: '天津', value: 'tj' },
    ],
  },
]
</script>

<template>
  <DemoPage title="RsCascader" test-file="cascader-utils.spec.ts">
    <DemoBlock title="多列">
      <RsCascader v-model="path" allow-clear :options="options" placeholder="选择地区" />
      <p>路径：{{ path.join(' / ') || '—' }}</p>
    </DemoBlock>
  </DemoPage>
</template>
