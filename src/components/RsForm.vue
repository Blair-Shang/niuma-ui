<script setup lang="ts">
import { computed, ref, toRef, useSlots } from 'vue'
import type {
  RsFormErrorRender,
  RsFormErrorRenderContext,
  RsFormFieldExpose,
  RsFormFieldValidationResult,
  RsFormGap,
  RsFormLabelAlign,
  RsFormLabelPosition,
  RsFormMaxWidth,
  RsFormSize,
  RsFormValidationResult,
} from './form-utils'
import { cloneFormFieldValue, provideRsFormContext, resolveFieldRules } from './form-utils'
import type { RsFormRuleTrigger, RsFormRules, RsFormValidateMessages } from './form-rules'
import {
  getByNamePath,
  namePathKey,
  setByNamePath,
  type RsFormNamePath,
} from './form-path'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    labelPosition?: RsFormLabelPosition
    labelWidth?: string
    labelAlign?: RsFormLabelAlign
    size?: RsFormSize
    gap?: RsFormGap
    maxWidth?: RsFormMaxWidth
    /**
     * 集中声明校验规则（按字段 name 匹配）。
     * 与字段自身 required/rule/validator 合并执行。
     */
    rules?: RsFormRules
    /**
     * 表单数据中枢（对齐 Ant Design Form.model）。
     * Form.Item 声明 name 后读写此对象；也可继续在控件上 v-model。
     */
    model?: Record<string, unknown>
    /** 覆盖默认校验文案模板，支持 `{label}` */
    validateMessages?: RsFormValidateMessages
    /** 原生 form 提交时自动跑一遍校验（默认 true） */
    validateOnSubmit?: boolean
    /**
     * 自定义错误渲染（函数式）。
     * 也可用 `#error="{ name, message, value }"` 插槽，插槽优先。
     */
    errorRender?: RsFormErrorRender
  }>(),
  {
    disabled: false,
    labelPosition: 'top',
    labelWidth: '6rem',
    labelAlign: 'start',
    size: 'md',
    gap: 'md',
    maxWidth: 'full',
    validateOnSubmit: true,
  },
)

const emit = defineEmits<{
  submit: [event: Event]
  validate: [result: RsFormValidationResult]
}>()

const slots = useSlots()
const fields = new Map<symbol, RsFormFieldExpose>()
const disabledRef = computed(() => props.disabled)
const labelPositionRef = computed(() => props.labelPosition)
const labelWidthRef = computed(() => props.labelWidth)
const labelAlignRef = computed(() => props.labelAlign)
const sizeRef = computed(() => props.size)
const rulesRef = toRef(props, 'rules')
const modelRef = toRef(props, 'model')
const validateMessagesRef = computed(() => props.validateMessages)
const initialValues = ref(new Map<symbol, unknown>())

function registerField(id: symbol, field: RsFormFieldExpose): void {
  fields.set(id, field)
  initialValues.value.set(id, cloneFormFieldValue(field.getValue()))
}

function unregisterField(id: symbol): void {
  fields.delete(id)
  initialValues.value.delete(id)
}

function getFieldRules(name?: string) {
  return resolveFieldRules(props.rules, name)
}

function getFieldValue(name: RsFormNamePath): unknown {
  if (modelRef.value) return getByNamePath(modelRef.value, name)
  const key = namePathKey(name)
  const field = Array.from(fields.values()).find((item) => item.name === key)
  return field?.getValue()
}

function setFieldValue(name: RsFormNamePath, value: unknown): void {
  if (modelRef.value) {
    setByNamePath(modelRef.value, name, value)
    return
  }
  const key = namePathKey(name)
  const field = Array.from(fields.values()).find((item) => item.name === key)
  field?.setValue(value)
}

function getFieldsValue(): Record<string, unknown> {
  if (modelRef.value) return { ...modelRef.value }
  const values: Record<string, unknown> = {}
  fields.forEach((field) => {
    if (!field.name) return
    values[field.name] = field.getValue()
  })
  return values
}

function setFieldsValue(values: Record<string, unknown>): void {
  Object.entries(values).forEach(([name, value]) => {
    setFieldValue(name, value)
  })
}

function scrollToField(name: RsFormNamePath): void {
  if (typeof document === 'undefined') return
  const key = namePathKey(name)
  const el = document.querySelector(`[data-rs-form-item="${CSS.escape(key)}"]`)
  if (el instanceof HTMLElement) {
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

function renderError(ctx: RsFormErrorRenderContext) {
  if (slots.error) return slots.error(ctx)
  return props.errorRender?.(ctx)
}

provideRsFormContext({
  disabled: disabledRef,
  labelPosition: labelPositionRef,
  labelWidth: labelWidthRef,
  labelAlign: labelAlignRef,
  size: sizeRef,
  rules: rulesRef,
  getFieldRules,
  renderError,
  registerField,
  unregisterField,
  model: modelRef,
  validateMessages: validateMessagesRef,
  getFieldValue,
  setFieldValue,
  getFieldsValue,
})

function collectResult(
  results: RsFormFieldValidationResult[],
): RsFormValidationResult {
  const errors: Record<string, string> = {}
  for (const result of results) {
    if (!result.valid && result.name && result.message && !errors[result.name]) {
      errors[result.name] = result.message
    }
  }
  return {
    valid: results.every((result) => result.valid),
    errors,
  }
}

/** 校验全部字段；可传 trigger 过滤规则 */
async function validate(trigger: RsFormRuleTrigger = 'submit'): Promise<RsFormValidationResult> {
  const results = await Promise.all(
    Array.from(fields.values()).map(
      (field) => field.validate?.(trigger) ?? { valid: true, name: field.name },
    ),
  )
  const aggregated = collectResult(results)
  emit('validate', aggregated)
  return aggregated
}

/** 按 name 校验单个字段 */
async function validateField(
  name: string,
  trigger: RsFormRuleTrigger = 'submit',
): Promise<RsFormFieldValidationResult> {
  const field = Array.from(fields.values()).find((item) => item.name === name)
  if (!field) return { valid: true, name }
  const result = (await field.validate?.(trigger)) ?? { valid: true, name }
  return { ...result, name }
}

function clearValidation(names?: string | string[]): void {
  const nameSet = names
    ? new Set(Array.isArray(names) ? names : [names])
    : null
  fields.forEach((field) => {
    if (nameSet && (!field.name || !nameSet.has(field.name))) return
    field.clearValidation?.()
  })
}

function resetFields(names?: string | string[]): void {
  const nameSet = names
    ? new Set(Array.isArray(names) ? names : [names])
    : null
  fields.forEach((field, id) => {
    if (nameSet && (!field.name || !nameSet.has(field.name))) return
    field.setValue(cloneFormFieldValue(initialValues.value.get(id)))
    field.clearValidation?.()
  })
}

async function onSubmit(event: Event): Promise<void> {
  if (props.validateOnSubmit) {
    event.preventDefault()
    const result = await validate('submit')
    if (!result.valid) return
  }
  emit('submit', event)
}

defineExpose({
  validate,
  validateField,
  clearValidation,
  resetFields,
  getFieldsValue,
  setFieldsValue,
  getFieldValue,
  setFieldValue,
  scrollToField,
})
</script>

<template>
  <form
    class="rs-form"
    :class="[
      `rs-form--gap-${gap}`,
      `rs-form--max-${maxWidth}`,
      `rs-form--label-${labelPosition}`,
    ]"
    @submit="onSubmit"
  >
    <!-- 默认插槽：表单字段；#error 不在此渲染，经 Context 注入到字段错误区 -->
    <slot />
  </form>
</template>

<style scoped>
.rs-form {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.rs-form--gap-sm {
  gap: var(--rs-space-sm);
}
.rs-form--gap-md {
  gap: var(--rs-space-md);
}
.rs-form--gap-lg {
  gap: var(--rs-space-lg);
}
.rs-form--max-sm {
  max-width: 24rem;
}
.rs-form--max-md {
  max-width: 32rem;
}
.rs-form--max-lg {
  max-width: 48rem;
}
.rs-form--max-full {
  max-width: 100%;
}
.rs-form--max-none {
  max-width: none;
}
</style>
