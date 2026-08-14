<script setup lang="ts">
import { computed, ref, useId, useSlots, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import RsVNodeHost from './RsVNodeHost.vue'
import RsFormItemControl from './RsFormItemControl.vue'
import {
  provideRsFormItemContext,
  useRsFormContext,
  useRsFormField,
  useRsFormListContext,
  type RsFormLabelAlign,
  type RsFormLabelPosition,
  type RsFormValidateStatus,
} from './form-utils'
import {
  buildLocalInputRules,
  normalizeFormRules,
  runFormFieldRules,
  type RsFormRuleItem,
  type RsFormRuleTrigger,
} from './form-rules'
import {
  concatNamePath,
  isIndexSegment,
  namePathKey,
  type RsFormNamePath,
} from './form-path'

/**
 * 表单项容器：包住任意自定义控件，负责 name / rules / 错误文案。
 * 对标 Ant Design Form.Item、Element Plus ElFormItem。
 * 内置 RsInput / RsSelect 已自行注册；放在已声明 name 的 Item 内时不再重复注册。
 */
defineOptions({ name: 'RsFormItem' })

const model = defineModel<unknown>()

const props = withDefaults(
  defineProps<{
    name?: RsFormNamePath
    label?: string
    required?: boolean
    rules?: RsFormRuleItem | RsFormRuleItem[]
    invalid?: boolean
    errorMessage?: string
    showMessage?: boolean
    hint?: string
    /** 始终展示的辅助说明（错误出现时仍保留） */
    extra?: string
    /** 无错误时的说明；出错时被错误文案替换 */
    help?: string
    validateStatus?: RsFormValidateStatus
    /** 不渲染标签与外壳，只保留控件与错误（schema 表单外置 label） */
    noStyle?: boolean
    /** 依赖字段变化时重新校验本字段（对齐 Ant Design dependencies） */
    dependencies?: RsFormNamePath[]
    labelPosition?: RsFormLabelPosition
  }>(),
  {
    showMessage: true,
    noStyle: false,
  },
)

const emit = defineEmits<{
  validate: [result: { valid: boolean; message?: string }]
}>()

const { t } = useRsI18n()
const slots = useSlots()
const formContext = useRsFormContext()
const listContext = useRsFormListContext()
const fieldId = useId()
const errorId = computed(() => `${fieldId}-error`)
const extraId = computed(() => `${fieldId}-extra`)

const touched = ref(false)
const autoInvalid = ref(false)
const autoMessage = ref('')

const resolvedNamePath = computed(() => {
  if (props.name == null) return undefined
  const own = concatNamePath(props.name)
  if (!listContext) return own
  return concatNamePath(listContext.prefix.value, own)
})
const nameKey = computed(() =>
  resolvedNamePath.value?.length ? namePathKey(resolvedNamePath.value) : undefined,
)
const ownsField = computed(() => Boolean(nameKey.value))

const resolvedLabelPosition = computed(
  () => props.labelPosition ?? formContext?.labelPosition.value ?? 'top',
)
const resolvedLabelAlign = computed<RsFormLabelAlign>(
  () => formContext?.labelAlign.value ?? 'start',
)
const resolvedSize = computed(() => formContext?.size.value ?? 'md')

function readValue(): unknown {
  const path = resolvedNamePath.value
  if (formContext && path?.length && formContext.model.value) {
    return formContext.getFieldValue(path)
  }
  return model.value
}

function writeValue(value: unknown): void {
  model.value = value
  const path = resolvedNamePath.value
  if (formContext?.model.value && path?.length) {
    formContext.setFieldValue(path, value)
  }
}

/**
 * 解析 dependencies / getFieldValue 路径。
 * List 内以数字下标开头的视为相对路径（[0, 'password'] → users.0.password）；
 * 其它视为表单根路径，便于 List 内依赖根字段。
 */
function resolveWatchName(name: RsFormNamePath): Array<string | number> {
  const segs = concatNamePath(name)
  const prefix = listContext?.prefix.value
  if (!prefix?.length || !segs.length) return segs
  const first = segs[0]
  if (first !== undefined && isIndexSegment(first)) {
    return concatNamePath(prefix, segs)
  }
  return segs
}

const showRequiredMark = computed(() => {
  if (props.required) return true
  const formRules = formContext?.getFieldRules(nameKey.value) ?? []
  const localRules = [
    ...buildLocalInputRules({ required: props.required }),
    ...normalizeFormRules(props.rules),
  ]
  return [...formRules, ...localRules].some((rule) => rule.required)
})

const displayMessage = computed(() => {
  if (props.errorMessage) return props.errorMessage
  if (props.showMessage && autoInvalid.value) return autoMessage.value
  return ''
})

const isInvalid = computed(() => {
  if (props.validateStatus === 'error') return true
  if (props.validateStatus) return false
  return props.invalid || autoInvalid.value
})

const mergedStatus = computed<RsFormValidateStatus>(() => {
  if (props.validateStatus) return props.validateStatus
  if (isInvalid.value) return 'error'
  return ''
})

const describedBy = computed(() => {
  const ids: string[] = []
  if (displayMessage.value || props.help) ids.push(errorId.value)
  if (props.extra) ids.push(extraId.value)
  return ids.length ? ids.join(' ') : undefined
})

const errorSlotProps = computed(() => ({
  name: nameKey.value,
  message: displayMessage.value,
  value: readValue(),
}))

const formErrorContent = computed(() => {
  if (!displayMessage.value || !formContext?.renderError) return null
  return formContext.renderError(errorSlotProps.value)
})

const fieldStyle = computed(() => {
  if (props.noStyle || resolvedLabelPosition.value !== 'left') return undefined
  const labelWidth = formContext?.labelWidth.value
  if (!labelWidth) return undefined
  return { '--rs-field-label-width': labelWidth } as Record<string, string>
})

const showLabel = computed(() => Boolean(props.label || slots.label) && !props.noStyle)

const controlInject = computed(() => ({
  id: fieldId,
  invalid: isInvalid.value,
  showValidateMessage: false,
  'aria-invalid': isInvalid.value || undefined,
  'aria-describedby': describedBy.value,
  modelValue: readValue(),
  'onUpdate:modelValue': writeValue,
}))

async function runValidate(trigger: RsFormRuleTrigger = 'submit'): Promise<boolean> {
  touched.value = true
  const formRules = formContext?.getFieldRules(nameKey.value) ?? []
  const localRules = [
    ...buildLocalInputRules({ required: props.required }),
    ...normalizeFormRules(props.rules),
  ]
  const rules = [...formRules, ...localRules]

  if (!rules.length) {
    autoInvalid.value = false
    autoMessage.value = ''
    emit('validate', { valid: true })
    return true
  }

  const result = await runFormFieldRules(readValue(), rules, {
    trigger,
    t,
    name: nameKey.value,
    label: typeof props.label === 'string' ? props.label : undefined,
    validateMessages: formContext?.validateMessages.value,
    getFieldValue: (name) => formContext?.getFieldValue(resolveWatchName(name)),
    getFieldsValue: () => formContext?.getFieldsValue() ?? {},
  })
  autoInvalid.value = !result.valid
  autoMessage.value = result.message ?? ''
  emit('validate', result)
  return result.valid
}

function setError(message: string): void {
  autoInvalid.value = true
  autoMessage.value = message
}

function setValue(value: unknown): void {
  writeValue(value)
}

function clearValidation(): void {
  touched.value = false
  autoInvalid.value = false
  autoMessage.value = ''
}

useRsFormField(() => {
  if (!nameKey.value) return undefined
  return {
    name: nameKey.value,
    getValue: () => readValue(),
    setValue,
    validate: async (trigger) => {
      const valid = await runValidate(trigger ?? 'submit')
      return { valid, message: autoMessage.value || undefined, name: nameKey.value }
    },
    clearValidation,
    setError,
  }
})

provideRsFormItemContext({
  name: nameKey,
  ownsField,
  invalid: isInvalid,
  message: displayMessage,
  status: mergedStatus,
  fieldId: computed(() => fieldId),
  errorId,
  describedBy,
})

watch(
  () => readValue(),
  () => {
    if (touched.value) void runValidate('change')
  },
)

watch(
  () =>
    JSON.stringify(
      (props.dependencies ?? []).map((name) =>
        formContext?.getFieldValue(resolveWatchName(name)),
      ),
    ),
  (_next, prev) => {
    if (prev === undefined) return
    const current = readValue()
    const hasValue =
      current != null && !(typeof current === 'string' && current.trim() === '')
    if (touched.value || autoInvalid.value || hasValue) {
      void runValidate('change')
    }
  },
)

defineExpose({
  validate: runValidate,
  clearValidation,
  setValue,
  setError,
})
</script>

<template>
  <div
    class="rs-form-item"
    :class="[
      !noStyle ? 'rs-field' : undefined,
      !noStyle ? `rs-field--label-${resolvedLabelPosition}` : undefined,
      !noStyle && resolvedLabelPosition === 'left' && resolvedLabelAlign === 'end'
        ? 'rs-field--label-align-end'
        : undefined,
      mergedStatus ? `rs-form-item--${mergedStatus}` : undefined,
      `rs-form-item--${resolvedSize}`,
    ]"
    :style="fieldStyle"
    :data-rs-form-item="nameKey"
  >
    <span v-if="showLabel" class="rs-field__label">
      <slot name="label">
        <label :for="fieldId">{{ label }}</label>
      </slot>
      <span v-if="showRequiredMark" class="rs-field__required" aria-hidden="true">*</span>
    </span>

    <div class="rs-form-item__control">
      <RsFormItemControl :inject="controlInject">
        <slot
          :id="fieldId"
          :invalid="isInvalid"
          :message="displayMessage"
          :field="nameKey"
          :status="mergedStatus"
        />
      </RsFormItemControl>
    </div>

    <p
      v-if="displayMessage"
      :id="errorId"
      class="rs-form-item__error"
      role="alert"
    >
      <slot name="error" v-bind="errorSlotProps">
        <RsVNodeHost
          v-if="formErrorContent !== null && formErrorContent !== undefined"
          :content="formErrorContent"
        />
        <template v-else>{{ displayMessage }}</template>
      </slot>
    </p>
    <p
      v-else-if="help"
      :id="errorId"
      class="rs-form-item__help"
    >
      {{ help }}
    </p>

    <span v-if="hint && !noStyle" class="rs-field__hint">{{ hint }}</span>
    <span v-if="extra" :id="extraId" class="rs-form-item__extra">{{ extra }}</span>
  </div>
</template>

<style scoped>
.rs-form-item__control {
  width: 100%;
  min-height: var(--rs-control-height-md);
  min-width: 0;
}

/*
 * 左侧标签与控件行等高、文字垂直居中。
 * 网格仍是 align-items:start，错误文案在第 2 列，不会把 label 顶歪。
 */
.rs-field--label-left > .rs-field__label {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: var(--rs-control-height-md);
}

.rs-form-item--ssm.rs-field--label-left > .rs-field__label,
.rs-form-item--ssm .rs-form-item__control {
  min-height: var(--rs-control-height-ssm);
}

.rs-form-item--sm.rs-field--label-left > .rs-field__label,
.rs-form-item--sm .rs-form-item__control {
  min-height: var(--rs-control-height-sm);
}

.rs-form-item--lg.rs-field--label-left > .rs-field__label,
.rs-form-item--lg .rs-form-item__control {
  min-height: var(--rs-control-height-lg);
}

.rs-field--label-left .rs-form-item__control,
.rs-field--label-left .rs-form-item__error,
.rs-field--label-left .rs-form-item__help,
.rs-field--label-left .rs-form-item__extra {
  grid-column: 2;
}

.rs-form-item__error,
.rs-form-item__help,
.rs-form-item__extra {
  margin: 0.25rem 0 0;
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.rs-form-item__error {
  color: var(--rs-danger);
}

.rs-form-item__help,
.rs-form-item__extra {
  color: var(--rs-muted);
}

.rs-form-item--warning .rs-form-item__error {
  color: var(--rs-warning, #d48806);
}
</style>
