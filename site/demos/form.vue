<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RsButton, RsForm, RsFormItem, RsInput } from 'niuma-ui'
import DocDemo from '../components/DocDemo.vue'

const model = reactive({
  username: '',
  password: '',
})
const result = ref('')

const loginCode = `<RsForm :model="model">
  <RsFormItem name="username" label="账号" required>
    <RsInput v-model="model.username" />
  </RsFormItem>
</RsForm>`

async function onSubmit() {
  result.value = `已提交 ${model.username}`
}
</script>

<template>
  <DocDemo
    id="demo-login"
    title="登录表单"
    description="model + Form.Item name 读写字段。rules 可集中声明，也可写在控件上。"
    :code="loginCode"
  >
    <RsForm :model="model" style="max-width: 22rem" @submit.prevent="onSubmit">
      <RsFormItem name="username" label="账号" required>
        <RsInput v-model="model.username" placeholder="邮箱或用户名" />
      </RsFormItem>
      <RsFormItem name="password" label="密码" required>
        <RsInput v-model="model.password" type="password" />
      </RsFormItem>
      <RsButton type="submit" variant="primary">登录</RsButton>
      <p v-if="result" class="hint">{{ result }}</p>
    </RsForm>
  </DocDemo>
</template>

<style scoped>
.hint {
  margin: 0.75rem 0 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
}
</style>
