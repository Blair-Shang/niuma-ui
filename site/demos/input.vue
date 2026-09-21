<script setup lang="ts">
import { ref } from 'vue'
import { RsIcon, RsInput } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const name = ref('')
const amount = ref('')
const password = ref('')
const search = ref('')

const basicCode = `<RsInput v-model="name" label="项目名称" placeholder="请输入" required />`

const addonCode = `<RsInput v-model="amount" prefix="￥" suffix="CNY" />
<RsInput addon-before="https://" addon-after=".com" placeholder="api" />`
</script>

<template>
  <DocDemo
    id="demo-basic"
    title="基本用法"
    description="表单字段优先使用内置 label / hint / required，不必再包 RsLabel。"
    :code="basicCode"
  >
    <div class="stack">
      <RsInput v-model="name" label="项目名称" placeholder="请输入名称" required hint="将用于工作台标题" />
      <RsInput v-model="search" label="搜索" type="search" clearable placeholder="搜索实例…" />
    </div>
  </DocDemo>

  <DocDemo
    id="demo-addon"
    title="前缀、后缀与 Addon"
    description="prefix / suffix 在框内；单位与协议用框外连体 addonBefore / addonAfter。"
    :code="addonCode"
  >
    <div class="stack">
      <RsInput v-model="amount" prefix="￥" suffix="CNY" placeholder="0.00" />
      <RsInput addon-before="https://" addon-after=".com" placeholder="api" />
      <RsInput v-model="search" clearable placeholder="选择实例…">
        <template #prefix>
          <RsIcon name="search" :size="16" />
        </template>
      </RsInput>
    </div>
  </DocDemo>

  <DocDemo id="demo-password" title="密码与字数" description="password 默认提供显隐；showCount 需配合 maxlength。">
    <div class="stack">
      <RsInput v-model="password" type="password" label="密码" placeholder="至少 8 位" />
      <RsInput v-model="name" label="简介" :maxlength="40" show-count />
    </div>
  </DocDemo>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 22rem;
}
</style>
