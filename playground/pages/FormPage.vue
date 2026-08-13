<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  RsButton,
  RsForm,
  RsInput,
  RsLabel,
  RsSelect,
  type RsFormRules,
  type RsSelectOption,
} from 'niuma-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basicName = ref('弱水工作室')
const basicEmail = ref('team@ruoshui.app')

const validateFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const validateName = ref('')
const validateEmail = ref('')
const validateResult = ref('（尚未校验）')

const resetFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const resetName = ref('默认名称')
const resetRole = ref('member')

const mixedFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const mixedName = ref('')
const mixedRole = ref('')
const mixedResult = ref('')

const disabledName = ref('只读名称')
const disabledEmail = ref('readonly@ruoshui.app')

const sizePreset = ref<'sm' | 'md' | 'lg'>('md')
const sizeName = ref('')
const sizeEmail = ref('')

const leftName = ref('')
const leftEmail = ref('')
const alignName = ref('')
const alignEmail = ref('')
const overrideName = ref('')
const overrideEmail = ref('')
const topName = ref('')
const topEmail = ref('')

const roleOptions: RsSelectOption[] = [
  { label: '管理员', value: 'admin' },
  { label: '成员', value: 'member' },
  { label: '访客', value: 'guest' },
]

/* —— rules 集中声明（对标 Ant Design Form） —— */
const rulesFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const rulesModel = reactive({
  userId: '',
  password: '',
  email: '',
  role: '',
})
const rulesErrors = ref<Record<string, string>>({})
const rulesResult = ref('')

const formRules = computed<RsFormRules>(() => ({
  userId: [
    { required: true, message: '请输入用户 ID', trigger: 'blur' },
    { min: 3, max: 20, message: '用户 ID 长度为 3–20', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] },
    { min: 6, max: 32, message: '密码长度为 6–32', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
  role: [{ required: true, message: '请选择角色' }],
}))

const asyncFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const asyncUsername = ref('')
const asyncResult = ref('')

const asyncRules = computed<RsFormRules>(() => ({
  username: [
    { required: true, message: '请输入用户名' },
    {
      trigger: 'blur',
      async validator(value) {
        const name = String(value ?? '').trim()
        await new Promise((r) => setTimeout(r, 400))
        if (name === 'admin' || name === 'root') {
          return '用户名已被占用'
        }
        return true
      },
    },
  ],
}))

const loginFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const loginModel = reactive({
  userId: '',
  password: '',
  captcha: '',
})
const loginResult = ref('')

const loginRules = computed<RsFormRules>(() => ({
  userId: [
    { required: true, message: '请输入用户 ID' },
    { min: 3, max: 20, message: '用户 ID 长度为 3–20' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少 6 位' },
  ],
  captcha: [
    { required: true, message: '请输入验证码' },
    { len: 4, message: '验证码为 4 位' },
  ],
}))

async function runValidate(): Promise<void> {
  const result = await validateFormRef.value?.validate()
  validateResult.value = result?.valid ? '校验通过' : '存在未通过的字段'
}

async function runMixedValidate(): Promise<void> {
  const result = await mixedFormRef.value?.validate()
  mixedResult.value = result?.valid ? '可提交' : '请补全必填项'
}

function runReset(): void {
  resetFormRef.value?.resetFields()
}

function runClearValidation(): void {
  resetFormRef.value?.clearValidation()
}

async function runRulesValidate(): Promise<void> {
  const result = await rulesFormRef.value?.validate()
  rulesErrors.value = result?.errors ?? {}
  rulesResult.value = result?.valid
    ? '校验通过'
    : `失败字段：${Object.keys(result?.errors ?? {}).join(', ') || '—'}`
}

async function runRulesValidateField(name: string): Promise<void> {
  const result = await rulesFormRef.value?.validateField(name)
  if (!result) return
  if (result.valid) {
    const next = { ...rulesErrors.value }
    delete next[name]
    rulesErrors.value = next
  } else if (result.message) {
    rulesErrors.value = { ...rulesErrors.value, [name]: result.message }
  }
}

async function runAsyncValidate(): Promise<void> {
  asyncResult.value = '校验中…'
  const result = await asyncFormRef.value?.validate()
  asyncResult.value = result?.valid
    ? '可用'
    : result?.errors.username ?? '校验失败'
}

async function runLoginValidate(): Promise<void> {
  const result = await loginFormRef.value?.validate()
  loginResult.value = result?.valid
    ? '可以登录'
    : JSON.stringify(result?.errors ?? {}, null, 0)
}

/* —— 自定义错误渲染 —— */
const customRenderFormRef = ref<InstanceType<typeof RsForm> | null>(null)
const customNick = ref('')
const customEmail = ref('')

const customRenderRules = computed<RsFormRules>(() => ({
  nick: [
    { required: true, message: '请填写昵称' },
    {
      min: 2,
      message: ({ value }) => `「${String(value)}」太短，至少 2 个字`,
    },
  ],
  email: [{ required: true, type: 'email', message: '邮箱不正确' }],
}))

async function runCustomRenderValidate(): Promise<void> {
  await customRenderFormRef.value?.validate()
}
</script>

<template>
  <DemoPage
    title="RsForm"
    description="专业表单容器：集中 rules、字段 name、validate / validateField / reset，对标 Ant Design Form。"
    test-file="RsForm.spec.ts"
  >
    <DemoBlock title="集中 rules（推荐）">
      <p class="hint">
        <code>:rules</code> 按字段 <code>name</code> 匹配；与字段自身
        <code>required</code> / <code>rule</code> / <code>validator</code> 合并执行。
        <code>validate()</code> 返回 <code>{ valid, errors }</code>。
      </p>
      <RsForm ref="rulesFormRef" :rules="formRules" max-width="md" gap="md">
        <RsInput
          v-model="rulesModel.userId"
          name="userId"
          label="用户 ID"
          placeholder="至少 3 位"
        />
        <RsInput
          v-model="rulesModel.password"
          name="password"
          type="password"
          label="密码"
          placeholder="至少 6 位"
        />
        <RsInput
          v-model="rulesModel.email"
          name="email"
          label="邮箱"
          placeholder="you@example.com"
        />
        <div class="field">
          <RsLabel for-id="form-rules-role" required>角色</RsLabel>
          <RsSelect
            id="form-rules-role"
            v-model="rulesModel.role"
            name="role"
            :options="roleOptions"
            placeholder="选择角色"
          />
        </div>
        <div class="row">
          <RsButton @click="runRulesValidate">整表校验</RsButton>
          <RsButton variant="default" @click="runRulesValidateField('email')">
            仅校验邮箱
          </RsButton>
          <RsButton
            variant="default"
            @click="
              rulesFormRef?.clearValidation();
              rulesErrors = {};
              rulesResult = ''
            "
          >
            清除错误
          </RsButton>
        </div>
        <p v-if="rulesResult" class="result">
          结果：<code>{{ rulesResult }}</code>
        </p>
        <pre v-if="Object.keys(rulesErrors).length" class="errors">{{ rulesErrors }}</pre>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="登录场景（rules + name）">
      <p class="hint">模拟登录页：业务只维护一份 rules，字段挂 name，无需手写多个 validator 函数。</p>
      <RsForm ref="loginFormRef" :rules="loginRules" max-width="sm" gap="md">
        <RsInput
          v-model="loginModel.userId"
          name="userId"
          label="账号"
          placeholder="userId"
        />
        <RsInput
          v-model="loginModel.password"
          name="password"
          type="password"
          label="密码"
          placeholder="password"
        />
        <RsInput
          v-model="loginModel.captcha"
          name="captcha"
          label="验证码"
          placeholder="4 位"
        />
        <RsButton class="block-btn" @click="runLoginValidate">登录校验</RsButton>
        <p v-if="loginResult" class="result"><code>{{ loginResult }}</code></p>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="异步校验（async validator）">
      <p class="hint">模拟远端查重：输入 <code>admin</code> / <code>root</code> 会失败。</p>
      <RsForm ref="asyncFormRef" :rules="asyncRules" max-width="md">
        <RsInput
          v-model="asyncUsername"
          name="username"
          label="用户名"
          placeholder="试试 admin"
        />
        <div class="row">
          <RsButton @click="runAsyncValidate">检查可用性</RsButton>
          <span class="result"><code>{{ asyncResult || '—' }}</code></span>
        </div>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="自定义错误渲染（message 函数 / #error / errorRender）">
      <p class="hint">
        1) 规则 <code>message</code> 可为函数；2) Form
        <code>#error</code> 或 <code>:error-render</code>（二选一，插槽优先）；3) 字段
        <code>#error</code> 优先于 Form。
      </p>
      <RsForm
        ref="customRenderFormRef"
        :rules="customRenderRules"
        max-width="md"
        gap="md"
      >
        <template #error="{ name, message }">
          <span class="custom-error-slot">
            <i class="custom-error-slot__icon" aria-hidden="true">!</i>
            <span>[{{ name }}] {{ message }}</span>
          </span>
        </template>

        <RsInput v-model="customNick" name="nick" label="昵称" placeholder="输入 1 个字再校验" />

        <RsInput v-model="customEmail" name="email" label="邮箱（字段级 #error）" placeholder="bad">
          <template #error="{ message }">
            <span class="custom-error-field">字段插槽：{{ message }}</span>
          </template>
        </RsInput>

        <RsButton @click="runCustomRenderValidate">触发校验</RsButton>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="基础表单（字段级 required / rule）">
      <p class="hint">
        无 <code>rules</code> 时，仍可用字段级 <code>required</code> +
        <code>rule</code>，适合简单页。
      </p>
      <RsForm max-width="md">
        <RsInput v-model="basicName" label="名称" required placeholder="工作区名称" />
        <RsInput
          v-model="basicEmail"
          label="邮箱"
          hint="用于登录与通知"
          type="email"
          rule="email"
          required
          placeholder="you@example.com"
        />
      </RsForm>
    </DemoBlock>

    <DemoBlock title="校验与提交（validate）">
      <RsForm ref="validateFormRef" max-width="md">
        <RsInput v-model="validateName" label="名称" required placeholder="必填" />
        <RsInput
          v-model="validateEmail"
          label="邮箱"
          type="email"
          rule="email"
          required
          placeholder="you@example.com"
        />
        <div class="row">
          <RsButton @click="runValidate">校验表单</RsButton>
          <span class="result">结果：<code>{{ validateResult }}</code></span>
        </div>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="重置与清除校验">
      <RsForm ref="resetFormRef" max-width="md">
        <RsInput v-model="resetName" label="名称" required />
        <div class="field">
          <RsLabel for-id="form-reset-role">角色</RsLabel>
          <RsSelect
            id="form-reset-role"
            v-model="resetRole"
            :options="roleOptions"
            placeholder="选择角色"
          />
        </div>
        <div class="row">
          <RsButton variant="default" @click="runReset">重置字段</RsButton>
          <RsButton variant="default" @click="runClearValidation">清除校验</RsButton>
        </div>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="混合字段（Input + Select）">
      <RsForm ref="mixedFormRef" max-width="md">
        <RsInput v-model="mixedName" label="成员名称" required placeholder="姓名" />
        <div class="field">
          <RsLabel for-id="form-mixed-role" required>角色</RsLabel>
          <RsSelect
            id="form-mixed-role"
            v-model="mixedRole"
            :options="roleOptions"
            required
            placeholder="选择角色"
          />
        </div>
        <div class="row">
          <RsButton @click="runMixedValidate">提交</RsButton>
          <span v-if="mixedResult" class="result"><code>{{ mixedResult }}</code></span>
        </div>
      </RsForm>
    </DemoBlock>

    <DemoBlock title="整表禁用">
      <RsForm disabled max-width="md">
        <RsInput v-model="disabledName" label="名称" />
        <RsInput v-model="disabledEmail" label="邮箱" type="email" />
      </RsForm>
    </DemoBlock>

    <DemoBlock title="表单级尺寸 size">
      <div class="row row--mb">
        <RsButton
          v-for="s in (['sm', 'md', 'lg'] as const)"
          :key="s"
          size="sm"
          :variant="sizePreset === s ? 'primary' : 'default'"
          @click="sizePreset = s"
        >
          {{ s }}
        </RsButton>
      </div>
      <RsForm :size="sizePreset" max-width="md">
        <RsInput v-model="sizeName" label="名称" :placeholder="`size: ${sizePreset}`" />
        <RsInput v-model="sizeEmail" label="邮箱" type="email" placeholder="you@example.com" />
      </RsForm>
    </DemoBlock>

    <DemoBlock title="间距 gap 与最大宽度 maxWidth">
      <div class="grid-compare">
        <div class="panel">
          <p class="panel-label">gap: sm · maxWidth: sm</p>
          <RsForm gap="sm" max-width="sm">
            <RsInput placeholder="字段 A" />
            <RsInput placeholder="字段 B" />
          </RsForm>
        </div>
        <div class="panel">
          <p class="panel-label">gap: lg · maxWidth: lg</p>
          <RsForm gap="lg" max-width="lg">
            <RsInput placeholder="字段 A" />
            <RsInput placeholder="字段 B" />
          </RsForm>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="标签位置 labelPosition · top / left">
      <p class="hint">
        Form 级 <code>label-position</code> 会下发给子字段；默认 <code>top</code>，左标签时配合
        <code>label-width</code> 对齐列宽。
      </p>
      <div class="grid-compare">
        <div class="panel">
          <p class="panel-label">label-position: top（默认）</p>
          <RsForm max-width="lg">
            <RsInput v-model="topName" label="名称" placeholder="工作区名称" />
            <RsInput
              v-model="topEmail"
              label="邮箱"
              type="email"
              placeholder="you@example.com"
            />
          </RsForm>
        </div>
        <div class="panel">
          <p class="panel-label">label-position: left · label-width: 5rem</p>
          <RsForm label-position="left" label-width="5rem" max-width="lg">
            <RsInput v-model="leftName" label="名称" placeholder="工作区名称" />
            <RsInput
              v-model="leftEmail"
              label="邮箱"
              type="email"
              rule="email"
              required
              placeholder="失焦校验，错误时 label 不跳动"
            />
          </RsForm>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="左标签对齐 labelAlign · start / end">
      <p class="hint">
        仅在 <code>label-position="left"</code> 时生效：<code>start</code> 左对齐（默认），
        <code>end</code> 贴控件右对齐。
      </p>
      <div class="grid-compare">
        <div class="panel">
          <p class="panel-label">label-align: start</p>
          <RsForm
            label-position="left"
            label-align="start"
            label-width="6rem"
            max-width="lg"
          >
            <RsInput v-model="alignName" label="名称" placeholder="start 对齐" />
            <RsInput v-model="alignEmail" label="邮箱地址" placeholder="较长标签" />
          </RsForm>
        </div>
        <div class="panel">
          <p class="panel-label">label-align: end</p>
          <RsForm
            label-position="left"
            label-align="end"
            label-width="6rem"
            max-width="lg"
          >
            <RsInput v-model="alignName" label="名称" placeholder="end 对齐" />
            <RsInput v-model="alignEmail" label="邮箱地址" placeholder="较长标签" />
          </RsForm>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="字段级覆盖 Form labelPosition">
      <p class="hint">
        Form 为 <code>left</code> 时，单个字段仍可用 <code>label-position="top"</code> 覆盖。
      </p>
      <RsForm label-position="left" label-width="5rem" max-width="lg" gap="md">
        <RsInput v-model="overrideName" label="名称" placeholder="继承 Form · left" />
        <RsInput
          v-model="overrideEmail"
          label="备注"
          label-position="top"
          placeholder="字段级覆盖为 top"
        />
      </RsForm>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  line-height: var(--rs-line-height-normal);
}
.hint code {
  font-size: 0.85em;
  color: var(--rs-text);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.row--mb {
  margin-bottom: 0.75rem;
}
.result {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}
.result code {
  color: var(--rs-text);
}
.errors {
  margin: 0.5rem 0 0;
  padding: 0.75rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-hover);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-danger, #c0392b);
  overflow: auto;
}
.block-btn {
  width: 100%;
}
.custom-error-slot,
.custom-error-field {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-danger, #c0392b);
}
.custom-error-slot__icon {
  display: inline-flex;
  width: 1rem;
  height: 1rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rs-danger, #c0392b) 18%, transparent);
  font-style: normal;
  font-weight: 700;
  font-size: 0.7rem;
}
.custom-error-field {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.grid-compare {
  display: grid;
  gap: 1rem;
}
@media (min-width: 48rem) {
  .grid-compare {
    grid-template-columns: 1fr 1fr;
  }
}
.panel {
  padding: 0.75rem;
  border-radius: var(--rs-radius);
  border: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
}
.panel-label {
  margin: 0 0 0.75rem;
  font-size: var(--rs-font-size-xs);
  font-weight: 500;
  color: var(--rs-muted);
}
</style>
