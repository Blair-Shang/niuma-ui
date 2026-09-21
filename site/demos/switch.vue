<script setup lang="ts">
import { ref } from 'vue'
import { RsSwitch } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const on = ref(true)
const flag = ref('Y')
</script>

<template>
  <DocDemo id="demo-basic" title="基本用法" description="默认 boolean。立即生效的设置用开关，需要提交再生效用 Checkbox。">
    <div class="row">
      <RsSwitch v-model="on">启用通知</RsSwitch>
      <RsSwitch disabled>已禁用</RsSwitch>
    </div>
  </DocDemo>
  <DocDemo id="demo-value" title="自定义取值" description="checkedValue / uncheckedValue 可映射业务码。">
    <RsSwitch v-model="flag" checked-value="Y" unchecked-value="N">
      当前值 {{ flag }}
    </RsSwitch>
  </DocDemo>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
