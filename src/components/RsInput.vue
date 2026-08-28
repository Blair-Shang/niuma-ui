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
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
  type RsFormLabelPosition,
} from './form-utils'

import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from './form-rules'

import RsVNodeHost from './RsVNodeHost.vue'

import RsIcon from './RsIcon.vue'

/**
 * RsInput 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsInput>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsInputExpose {
  validate: (trigger?: RsFormRuleTrigger) => Promise<boolean>
  clearValidation: () => void
  setValue: (value: unknown) => void
  setError: (message: string) => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsInputInstance = RsInputExpose & { $el: HTMLElement }

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

    /** 文本后缀（也可用 suffix 插槽）；框内，排在清除 / 显隐之后 */

    suffix?: string

    /**
     * 框外前置 addon（对齐 Ant addonBefore）。
     * 与 prefix 不同：连体在输入框外侧，用于单位、协议等。
     */
    addonBefore?: string

    /**
     * 框外后置 addon（对齐 Ant addonAfter）。
     * 文本单位、协议等；也可配合 addonAfterIcon 做选择器按钮。
     */
    addonAfter?: string

    /**
     * 框外后置图标按钮（Lucide 名，如 ellipsis）。
     * 由组件自绘，走连体 addonAfter；无 #addonAfter / addonAfter 文本时生效。
     */
    addonAfterIcon?: string

    /** addonAfterIcon 的无障碍文案 / title */
    addonAfterIconLabel?: string

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

  /** 点击 addonAfterIcon 时触发 */
  addonAfterClick: [event: MouseEvent]

}>()



const attrs = useAttrs()

const slots = useSlots()

const formContext = useRsFormContext()
const formItem = useRsFormItemContext()
const boundToItem = computed(() =>
  isRsFormItemBoundControl(formItem, { id: props.id, name: props.name }),
)

const fieldId = useId()



const touched = ref(false)

const autoInvalid = ref(false)

const autoMessage = ref('')

const passwordVisible = ref(false)

/** 中文等 IME 合成中：仍写入 model，但不触发校验 / pressEnter */
const composing = ref(false)

const hasPrefix = computed(() => Boolean(props.prefix || slots.prefix))

const hasCustomSuffix = computed(() => Boolean(props.suffix || slots.suffix))

const hasAddonBefore = computed(() => Boolean(props.addonBefore || slots.addonBefore))

/** 插槽或文本 addonAfter 内容（优先于图标按钮） */
const hasAddonAfterContent = computed(
  () => Boolean(slots.addonAfter) || (props.addonAfter != null && props.addonAfter !== ''),
)

const hasAddonAfter = computed(
  () => hasAddonAfterContent.value || Boolean(props.addonAfterIcon),
)

const hasAddon = computed(() => hasAddonBefore.value || hasAddonAfter.value)



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
  if (boundToItem.value) return ''
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

const isInvalid = computed(() => {
  if (boundToItem.value) return Boolean(formItem?.invalid.value || props.invalid)
  return props.invalid || autoInvalid.value
})

const describedBy = computed(() => {
  if (boundToItem.value) return formItem?.describedBy.value
  return displayMessage.value ? errorId.value : undefined
})

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

/** 无 addonAfter 内容时用组件自绘的后置图标按钮 */
const showAddonAfterIcon = computed(
  () => Boolean(props.addonAfterIcon) && !hasAddonAfterContent.value,
)

const hasSuffix = computed(

  () =>

    Boolean(

      hasCustomSuffix.value ||

        showClearButton.value ||

        showPasswordToggle.value ||

        showCountDisplay.value,

    ),

)

/**
 * 点击框外后置图标按钮
 */
function onAddonAfterIconClick(event: MouseEvent): void {
  if (resolvedDisabled.value || resolvedReadonly.value) return
  emit('addonAfterClick', event)
}



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
  if (composing.value) return
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

function onCompositionStart() {
  composing.value = true
}

function onCompositionEnd(event: CompositionEvent) {
  composing.value = false
  onNativeInput(event)
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
  if (event.key !== 'Enter') return
  if (composing.value || event.isComposing) return
  emit('pressEnter', event)
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

defineExpose<RsInputExpose>({
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

        class="rs-input-shell"

        :class="[

          `rs-input-shell--${resolvedSize}`,

          {

            'rs-input-shell--combined': hasAddon,

            'rs-input-shell--invalid': isInvalid,

            'rs-input-shell--disabled': resolvedDisabled,

          },

        ]"

      >

        <span

          v-if="hasAddonBefore"

          class="rs-input-addon rs-input-addon--before"

        >

          <slot name="addonBefore">{{ addonBefore }}</slot>

        </span>

      <div

        class="rs-input-group"

        :class="{

          'rs-input-group--invalid': isInvalid,

          'rs-input-group--disabled': resolvedDisabled,

          'rs-input-group--readonly': resolvedReadonly,

          [`rs-input-group--${resolvedSize}`]: true,

          'rs-input-group--has-prefix': hasPrefix,

          'rs-input-group--has-suffix': hasSuffix,

          'rs-input-group--combined-before': hasAddonBefore,

          'rs-input-group--combined-after': hasAddonAfter,

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

          :aria-describedby="describedBy"

          @input="onNativeInput"

          @compositionstart="onCompositionStart"

          @compositionend="onCompositionEnd"

          @blur="onBlur"

          @focus="onFocus"

          @keydown="onKeydown"

        />

        <span

          v-if="hasSuffix"

          class="rs-input-group__affix rs-input-group__affix--suffix"

        >

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

            tabindex="-1"

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

            tabindex="-1"

            :aria-label="passwordVisible ? t('input.hidePassword') : t('input.showPassword')"

            :aria-pressed="passwordVisible"

            @pointerdown.prevent

            @click="togglePasswordVisible"

          >

            <RsIcon :name="passwordVisible ? 'eye-off' : 'eye'" :size="14" />

          </button>

          <span v-if="hasCustomSuffix" class="rs-input-group__custom-suffix">

            <slot name="suffix">{{ suffix }}</slot>

          </span>

        </span>

      </div>

        <span

          v-if="hasAddonAfter"

          class="rs-input-addon rs-input-addon--after"

          :class="{ 'rs-input-addon--icon': showAddonAfterIcon }"

        >

          <template v-if="hasAddonAfterContent">

            <slot name="addonAfter">{{ addonAfter }}</slot>

          </template>

          <button

            v-else-if="showAddonAfterIcon"

            type="button"

            class="rs-input-addon__button"

            :aria-label="addonAfterIconLabel || undefined"

            :title="addonAfterIconLabel || undefined"

            :disabled="resolvedDisabled || resolvedReadonly"

            @click="onAddonAfterIconClick"

          >

            <RsIcon :name="addonAfterIcon!" :size="14" />

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

.rs-input-shell {

  width: 100%;

}

/* 连体外壳统一外边框，避免 input/addon 各自圆角造成拼缝 */
.rs-input-shell--combined {

  display: flex;

  align-items: stretch;

  box-sizing: border-box;

  width: 100%;

  border: 1px solid var(--rs-input-border, var(--rs-border));

  border-radius: var(--rs-input-radius, var(--rs-radius-sm));

  background: var(--rs-input-bg);

  box-shadow: var(--rs-input-shadow, none);

  overflow: hidden;

  transition:

    border-color var(--rs-transition-fast),

    box-shadow var(--rs-transition-fast),

    background var(--rs-transition-fast);

}

.rs-input-shell--combined:hover:not(:focus-within):not(:has(.rs-input-group--disabled)):not(
    :has(.rs-input-group--readonly)
  ) {

  border-color: var(--rs-input-border-hover, var(--rs-border));

}

.rs-input-shell--combined:focus-within {

  border-color: var(--rs-focus-border, var(--rs-primary));

  box-shadow:

    var(--rs-input-shadow, none),

    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);

}

.rs-input-shell--combined:has(.rs-input-group--invalid) {

  border-color: var(--rs-danger);

}

.rs-input-shell--combined:has(.rs-input-group--invalid):focus-within {

  border-color: var(--rs-danger);

  box-shadow:

    var(--rs-input-shadow, none),

    0 0 0 var(--rs-focus-ring-width, 2px)

      color-mix(in srgb, var(--rs-danger) 14%, transparent);

}

.rs-input-shell--combined .rs-input-group {

  flex: 1;

  min-width: 0;

  width: auto;

  border: none;

  border-radius: 0;

  box-shadow: none;

  background: transparent;

}

.rs-input-shell--combined .rs-input-group:hover:not(.rs-input-group--disabled):not(
    .rs-input-group--readonly
  ):not(:focus-within),
.rs-input-shell--combined .rs-input-group:focus-within,
.rs-input-shell--combined .rs-input-group--invalid,
.rs-input-shell--combined .rs-input-group--invalid:focus-within {

  border-color: transparent;

  box-shadow: none;

}

.rs-input-addon {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  box-sizing: border-box;

  flex-shrink: 0;

  min-width: var(--rs-control-height-md);

  padding: 0 var(--rs-space-sm);

  border: none;

  border-left: 1px solid var(--rs-input-border, var(--rs-border));

  border-radius: 0;

  background: var(--rs-surface-hover);

  color: var(--rs-muted);

  font-size: var(--rs-font-size-sm);

  white-space: nowrap;

}

.rs-input-addon--before {

  border-left: none;

  border-right: 1px solid var(--rs-input-border, var(--rs-border));

}

.rs-input-shell--ssm .rs-input-addon {

  min-width: var(--rs-control-height-ssm);

  padding: 0 var(--rs-space-xs);

}

.rs-input-shell--sm .rs-input-addon {

  min-width: var(--rs-control-height-sm);

  padding: 0 var(--rs-space-xs);

}

.rs-input-shell--lg .rs-input-addon {

  min-width: var(--rs-control-height-lg);

  padding: 0 var(--rs-space-md);

}

.rs-input-addon--icon {
  padding: 0;
  /* 图标选择器与输入区同底，整块一致，避免灰底 + 按钮再叠一层 hover */
  background: transparent;
  color: var(--rs-muted);
  transition: color var(--rs-transition-fast), background var(--rs-transition-fast);
}

.rs-input-addon--icon:hover {
  color: var(--rs-primary);
  background: color-mix(in srgb, var(--rs-primary) 8%, transparent);
}

.rs-input-addon__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: inherit;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.rs-input-addon__button:hover:not(:disabled) {
  /* 悬浮样式交给整块 .rs-input-addon--icon，按钮不再单独变色/铺底 */
  color: inherit;
  background: transparent;
}

.rs-input-addon__button:focus-visible {
  outline: none;
  color: var(--rs-primary);
  box-shadow: inset 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-input-addon__button:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.rs-input-shell--disabled .rs-input-addon,
.rs-input-shell--combined:has(.rs-input-group--disabled) .rs-input-addon {

  opacity: 0.38;

  cursor: not-allowed;

}

.rs-input-group__custom-suffix {

  display: inline-flex;

  align-items: center;

  gap: var(--rs-space-xs);

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

