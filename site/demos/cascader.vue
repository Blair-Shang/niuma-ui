<script setup lang="ts">
import { ref } from 'vue'
import { RsCascader, type RsCascaderOption } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

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
  <DocDemo id="demo-basic" title="多列选择" description="v-model 为路径数组。从左到右逐级展开。">
    <div class="field">
      <RsCascader v-model="path" allow-clear :options="options" placeholder="选择地区" />
    </div>
  </DocDemo>
</template>

<style scoped>
.field {
  max-width: 20rem;
}
</style>
