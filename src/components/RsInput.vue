<script setup lang="ts">

import { computed, ref, useAttrs, useId, useSlots } from 'vue'

import { useRsI18n } from '../composables/useRsI18n'

import type { RsComponentSize, RsRadius } from '../theme/types'
import { useResolvedRsComponentSize } from './resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'

import {
  type RsInputRule,
  type RsInputValidateTrigger,
} from './input-rules'

import {
  useRsFormContext,
  useRsFormField,
  type RsFormLabelPosition,
} from './form-utils'

import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from './form-rules'

import RsVNodeHost from './RsVNodeHost.vue'

import RsIcon from './RsIcon.vue'



const { t } = useRsI18n()



defineOptions({ inheritAttrs: false })



/**
 * modelValue 契约恒为 string（对齐 Ant Input / 原生 input.value）。
 * get/set 变换兜住外部误传 number；原生控件用 :value + el.value，避免 type=number 的类型漂移。
 */
const model = defineModel<string>({
  default: '',
  get(value) {
    return value == null ? '' : String(value)
  },
  set(value) {
    return value == null ? '' : String(value)
  },
})



const props = withDefaults(

  defineProps<{

    id?: string

    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number' | 'date' | 'datetime-local'

    placeholder?: string

    disabled?: boolean

    readonly?: boolean

    /** 手动标记错误（优先级高于自动校验） */

    invalid?: boolean

    errorMessage?: string

    size?: RsComponentSize

    /** 圆角档位；默认 sm。直角 UI 传 `none`。 */

    radius?: RsRadius

    /** 预设格式规则 */

    rule?: RsInputRule

    /** 自定义校验，返回 true / false / 错误文案 */

    validator?: (value: string) => boolean | string

    required?: boolean

    validateTrigger?: RsInputValidateTrigger

    /** 字段名：匹配 RsForm.rules[name]，并对齐大厂 Form.Item name */
    name?: string

    /** 文本前缀（也可用 prefix 插槽） */

    prefix?: string

    /** 文本后缀（也可用 suffix 插槽） */

    suffix?: string

    /** 有值时展示清除按钮（对齐 Ant allowClear / Element clearable） */

    clearable?: boolean

    /** 最大字符数，配合 showCount 展示字数统计 */

    maxlength?: number

    /** 展示字数统计，需配合 maxlength */

    showCount?: boolean

    /** 密码框显隐按钮；password 类型默认展示 */

    visibilityToggle?: boolean

    /** 为 false 时不展示自动校验错误 */

    showValidateMessage?: boolean

    /** 字段标签（与 RsDatePicker / RsTimePicker 一致） */

    label?: string

    /** 辅助说明，展示在控件下方 */

    hint?: string

    labelPosition?: RsFormLabelPosition

    /**
     * 浏览器自动填充。
     * 默认：普通输入 off；password 用 new-password（off 常被浏览器忽略）。
     * 需要记住时可显式传 on / username / current-password 等。
     */
    autocomplete?: string

  }>(),

  {

    type: 'text',

    disabled: false,

    readonly: false,

    invalid: false,

    required: false,

    validateTrigger: 'blur',

    clearable: false,

    showCount: false,

    visibilityToggle: true,

    showValidateMessage: true,

  },

)



const emit = defineEmits<{

  validate: [payload: { valid: boolean; message?: string }]

  blur: [event: FocusEvent]

  focus: [event: FocusEvent]

  pressEnter: [event: KeyboardEvent]

  clear: []

}>()



const attrs = useAttrs()

const slots = useSlots()

const formContext = useRsFormContext()

const fieldId = useId()



const touched = ref(false)

const autoInvalid = ref(false)

const autoMessage = ref('')

const passwordVisible = ref(false)



const hasPrefix = computed(() => Boolean(props.prefix || slots.prefix))



const resolvedId = computed(() => props.id ?? fieldId)

/** 未显式传 autocomplete 时关闭快捷填充；密码框用 new-password 更稳 */
const resolvedAutocomplete = computed(() => {
  if (props.autocomplete != null && props.autocomplete !== '') return props.autocomplete
  return props.type === 'password' ? 'new-password' : 'off'
})

const resolvedLabelPosition = computed(

  () => props.labelPosition ?? formContext?.labelPosition.value ?? 'top',

)

const resolvedLabelAlign = computed(() => formContext?.labelAlign.value ?? 'start')

const errorId = computed(() => `${resolvedId.value}-error`)



const displayMessage = computed(() => {
  if (props.errorMessage) return props.errorMessage
  if (props.showValidateMessage && autoInvalid.value) return autoMessage.value
  return ''
})

const errorSlotProps = computed(() => ({
  name: props.name,
  message: displayMessage.value,
  value: model.value,
}))

/** Form 级 #error / errorRender；字段无 #error 时使用 */
const formErrorContent = computed(() => {
  if (!displayMessage.value || !formContext?.renderError) return null
  return formContext.renderError(errorSlotProps.value)
})



const isInvalid = computed(() => props.invalid || autoInvalid.value)

const resolvedDisabled = computed(() => props.disabled || formContext?.disabled.value || false)

const resolvedReadonly = computed(() => props.readonly)

const resolvedSize = useResolvedRsComponentSize(() => props.size)

const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')

const radiusStyle = computed(() => ({
  '--rs-input-radius': rsRadiusCss(resolvedRadius.value),
}))

const resolvedShowPassword = computed(

  () => props.type === 'password' && props.visibilityToggle,

)

const resolvedInputType = computed(() => {

  if (props.type === 'password' && passwordVisible.value) return 'text'

  return props.type

})



const hasValue = computed(() => model.value.length > 0)

const showClearButton = computed(

  () => props.clearable && hasValue.value && !resolvedDisabled.value && !resolvedReadonly.value,

)

const showPasswordToggle = computed(

  () => props.type === 'password' && resolvedShowPassword.value && !resolvedDisabled.value,

)

const showCountDisplay = computed(() => props.showCount && props.maxlength != null)

const countText = computed(() => `${model.value.length} / ${props.maxlength}`)



const hasSuffix = computed(

  () =>

    Boolean(

      props.suffix ||

        slots.suffix ||

        showClearButton.value ||

        showPasswordToggle.value ||

        showCountDisplay.value,

    ),

)



const fieldStyle = computed(() => {

  if (resolvedLabelPosition.value !== 'left') return undefined

  const labelWidth = formContext?.labelWidth.value

  if (!labelWidth) return undefined

  return { '--rs-field-label-width': labelWidth } as Record<string, string>

})



async function runValidate(trigger: RsFormRuleTrigger = 'submit') {
  const formRules = formContext?.getFieldRules(props.name) ?? []
  const localRules = buildLocalInputRules({
    required: props.required,
    rule: props.rule,
    validator: props.validator,
  })
  const rules = [...formRules, ...localRules]

  if (!rules.length) {
    autoInvalid.value = false
    autoMessage.value = ''
    emit('validate', { valid: true })
    return true
  }

  const result = await runFormFieldRules(model.value, rules, { trigger, t })

  autoInvalid.value = !result.valid
  autoMessage.value = result.message ?? ''
  emit('validate', result)
  return result.valid
}

function setError(message: string): void {
  autoInvalid.value = true
  autoMessage.value = message
}



function onInput() {
  if (
    touched.value &&
    (props.validateTrigger === 'input' || props.validateTrigger === 'both')
  ) {
    void runValidate('change')
  }
}

/** 受控写入：始终取 DOM string value，不依赖 v-model 对 type=number 的隐式行为。 */
function onNativeInput(event: Event) {
  const el = event.target as HTMLInputElement | null
  model.value = el?.value ?? ''
  onInput()
}



function onBlur(event: FocusEvent) {
  touched.value = true
  if (props.validateTrigger === 'blur' || props.validateTrigger === 'both') {
    void runValidate('blur')
  }
  emit('blur', event)
}



function onFocus(event: FocusEvent) {

  emit('focus', event)

}



function onKeydown(event: KeyboardEvent) {

  if (event.key === 'Enter') {

    emit('pressEnter', event)

  }

}



function onClear() {

  model.value = ''

  emit('clear')

  if (touched.value) void runValidate('change')
}



function togglePasswordVisible() {

  passwordVisible.value = !passwordVisible.value

}



function setValue(value: unknown): void {

  model.value = String(value ?? '')

}



function clearValidation(): void {

  touched.value = false

  autoInvalid.value = false

  autoMessage.value = ''

}



useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue,
  validate: async (trigger) => {
    const valid = await runValidate(trigger ?? 'submit')
    return { valid, message: autoMessage.value || undefined, name: props.name }
  },
  clearValidation,
  setError,
}))

defineExpose({
  validate: runValidate,
  clearValidation,
  setValue,
  setError,
})

</script>



<template>

  <div

    class="rs-field"

    :class="[

      `rs-field--label-${resolvedLabelPosition}`,

      resolvedLabelPosition === 'left' && resolvedLabelAlign === 'end'

        ? 'rs-field--label-align-end'

        : undefined,

      `rs-input-field--${resolvedSize}`,

    ]"

    :style="[fieldStyle, radiusStyle]"

  >

    <span v-if="label" class="rs-field__label">

      <label :for="resolvedId">{{ label }}</label>

      <span v-if="required" class="rs-field__required" aria-hidden="true">*</span>

    </span>



    <div class="rs-input-field">

      <div

        class="rs-input-group"

        :class="{

          'rs-input-group--invalid': isInvalid,

          'rs-input-group--disabled': resolvedDisabled,

          'rs-input-group--readonly': resolvedReadonly,

          [`rs-input-group--${resolvedSize}`]: true,

          'rs-input-group--has-prefix': hasPrefix,

          'rs-input-group--has-suffix': hasSuffix,

        }"

      >

        <span

          v-if="hasPrefix"

          class="rs-input-group__affix rs-input-group__affix--prefix"

        >

          <slot name="prefix">{{ prefix }}</slot>

        </span>

        <input

          v-bind="attrs"

          :id="resolvedId"

          :value="model"

          class="rs-input-group__control"

          :class="`rs-input-group__control--${resolvedSize}`"

          :type="resolvedInputType"

          :placeholder="placeholder"

          :disabled="resolvedDisabled"

          :readonly="resolvedReadonly"

          :maxlength="maxlength"

          :autocomplete="resolvedAutocomplete"

          :aria-invalid="isInvalid || undefined"

          :aria-describedby="displayMessage ? errorId : undefined"

          @input="onNativeInput"

          @blur="onBlur"

          @focus="onFocus"

          @keydown="onKeydown"

        />

        <span

          v-if="hasSuffix"

          class="rs-input-group__affix rs-input-group__affix--suffix"

        >

          <slot name="suffix">{{ suffix }}</slot>

          <span

            v-if="showCountDisplay"

            class="rs-input-group__count"

            aria-hidden="true"

          >

            {{ countText }}

          </span>

          <button

            v-if="showClearButton"

            type="button"

            class="rs-input-group__action"

            :aria-label="t('input.clear')"

            @pointerdown.prevent

            @click="onClear"

          >

            <RsIcon name="x" :size="14" />

          </button>

          <button

            v-if="showPasswordToggle"

            type="button"

            class="rs-input-group__action"

            :aria-label="passwordVisible ? t('input.hidePassword') : t('input.showPassword')"

            :aria-pressed="passwordVisible"

            @pointerdown.prevent

            @click="togglePasswordVisible"

          >

            <RsIcon :name="passwordVisible ? 'eye-off' : 'eye'" :size="14" />

          </button>

        </span>

      </div>

    </div>



    <p
      v-if="displayMessage"
      :id="errorId"
      class="rs-input-field__error"
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



    <span v-if="hint" class="rs-field__hint">{{ hint }}</span>

  </div>

</template>



<style scoped>

.rs-input-field {

  width: 100%;

}

.rs-field--label-left .rs-input-field {

  grid-column: 2;

  min-width: 0;

}

.rs-field--label-left .rs-input-field__error {

  grid-column: 2;

}

.rs-field--label-left .rs-field__label {

  display: flex;

  align-items: center;

  min-height: var(--rs-control-height-md);

}

.rs-input-field--ssm.rs-field--label-left .rs-field__label {

  min-height: var(--rs-control-height-ssm);

}

.rs-input-field--sm.rs-field--label-left .rs-field__label {

  min-height: var(--rs-control-height-sm);

}

.rs-input-field--lg.rs-field--label-left .rs-field__label {

  min-height: var(--rs-control-height-lg);

}

.rs-input-group {

  display: flex;

  align-items: center;

  box-sizing: border-box;

  width: 100%;

  height: var(--rs-control-height-md);

  min-height: var(--rs-control-height-md);

  border-radius: var(--rs-input-radius, var(--rs-radius-sm));

  border: 1px solid var(--rs-input-border, var(--rs-border));

  background: var(--rs-input-bg);

  box-shadow: var(--rs-input-shadow, none);

  /* 裁切 autofill 矩形 inset，避免盖住圆角边框 */

  overflow: hidden;

  transition:

    border-color var(--rs-transition-fast),

    box-shadow var(--rs-transition-fast),

    background var(--rs-transition-fast);

}

.rs-input-group--ssm {

  height: var(--rs-control-height-ssm);

  min-height: var(--rs-control-height-ssm);

}

.rs-input-group--sm {

  height: var(--rs-control-height-sm);

  min-height: var(--rs-control-height-sm);

}

.rs-input-group--lg {

  height: var(--rs-control-height-lg);

  min-height: var(--rs-control-height-lg);

}

.rs-input-group:hover:not(.rs-input-group--disabled):not(.rs-input-group--readonly):not(:focus-within) {

  border-color: var(--rs-input-border-hover, var(--rs-border));

}

.rs-input-group:focus-within {

  border-color: var(--rs-focus-border, var(--rs-primary));

  background: var(--rs-input-bg);

  box-shadow:

    var(--rs-input-shadow, none),

    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);

}

.rs-input-group--invalid {

  border-color: var(--rs-danger);

}

.rs-input-group--invalid:focus-within {

  border-color: var(--rs-danger);

  box-shadow:

    var(--rs-input-shadow, none),

    0 0 0 var(--rs-focus-ring-width, 2px)

      color-mix(in srgb, var(--rs-danger) 14%, transparent);

}

.rs-input-group--disabled {

  opacity: 0.38;

  cursor: not-allowed;

  background: var(--rs-surface-hover);

}

.rs-input-group--readonly {

  background: var(--rs-surface-hover);

  cursor: default;

}

.rs-input-group__affix {

  display: inline-flex;

  align-items: center;

  flex-shrink: 0;

  color: var(--rs-muted);

  font-size: var(--rs-font-size-sm);

  white-space: nowrap;

  user-select: none;

}

.rs-input-group__affix--prefix {

  padding-left: var(--rs-space-md);

}

.rs-input-group__affix--suffix {

  gap: var(--rs-space-xs);

  padding-right: var(--rs-space-sm);

}

.rs-input-group--ssm .rs-input-group__affix--prefix {

  padding-left: var(--rs-space-xs);

}

.rs-input-group--ssm .rs-input-group__affix--suffix {

  padding-right: var(--rs-space-xs);

}

.rs-input-group--sm .rs-input-group__affix--prefix {

  padding-left: var(--rs-space-sm);

}

.rs-input-group--sm .rs-input-group__affix--suffix {

  padding-right: var(--rs-space-xs);

}

.rs-input-group--lg .rs-input-group__affix--prefix {

  padding-left: var(--rs-space-lg);

}

.rs-input-group--lg .rs-input-group__affix--suffix {

  padding-right: var(--rs-space-md);

}

.rs-input-group__count {

  font-size: var(--rs-font-size-xs);

  color: var(--rs-muted);

  font-variant-numeric: tabular-nums;

}

.rs-input-group__action {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  width: 1.25rem;

  height: 1.25rem;

  padding: 0;

  border: none;

  border-radius: var(--rs-radius-xs);

  background: transparent;

  color: var(--rs-muted);

  cursor: pointer;

  transition:

    color var(--rs-transition-fast),

    background var(--rs-transition-fast);

}

.rs-input-group__action:hover {

  color: var(--rs-text);

  background: var(--rs-item-hover);

}

.rs-input-group__action:focus-visible {

  outline: none;

  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);

}

.rs-input-group__control {

  flex: 1;

  min-width: 0;

  width: 100%;

  min-height: inherit;

  padding: 0 var(--rs-space-md);

  border: none;

  outline: none;

  background: transparent;

  color: var(--rs-text);

  font-size: var(--rs-font-size-sm);

  line-height: var(--rs-line-height-tight);

}

.rs-input-group__control--ssm {

  padding: 0 var(--rs-space-xs);

  font-size: var(--rs-font-size-xs);

}

.rs-input-group__control--sm {

  padding: 0 var(--rs-space-sm);

  font-size: var(--rs-font-size-xs);

}

.rs-input-group__control--lg {

  padding: 0 var(--rs-space-lg);

  font-size: var(--rs-font-size-base);

}

.rs-input-group--has-prefix .rs-input-group__control {

  padding-left: var(--rs-space-sm);

}

.rs-input-group--has-suffix .rs-input-group__control {

  padding-right: var(--rs-space-xs);

}

.rs-input-group__control::placeholder {

  color: var(--rs-placeholder);

}

.rs-input-group__control:disabled {

  cursor: not-allowed;

}

.rs-input-group__control:read-only {

  cursor: default;

}

/* 浏览器 autofill 会给 input 注入独立背景色，与外层圆角容器不一致 */

.rs-input-group__control:-webkit-autofill,

.rs-input-group__control:-webkit-autofill:hover,

.rs-input-group__control:-webkit-autofill:focus,

.rs-input-group__control:-webkit-autofill:active {

  -webkit-box-shadow: 0 0 0 1000px var(--rs-input-bg) inset;

  box-shadow: 0 0 0 1000px var(--rs-input-bg) inset;

  -webkit-text-fill-color: var(--rs-text);

  caret-color: var(--rs-text);

  transition: background-color 99999s ease-out 0s;

}

.rs-input-field__error {

  margin: 0.25rem 0 0;

  font-size: var(--rs-font-size-xs);

  line-height: var(--rs-line-height-tight);

  color: var(--rs-danger);

}

</style>

