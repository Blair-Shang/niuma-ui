<script setup lang="ts">
/**
 * RsInputNumber — 对齐 Ant Design InputNumber / Element Plus InputNumber。
 *
 * 契约：
 * - 默认 modelValue 为 `number | null`
 * - `stringMode` 时为 `string | null`（高精度 / 表格草稿场景）
 * - 输入过程用文本草稿，允许中间态；blur / step / Enter 再规范化
 */
import { computed, ref, useId, watch } from 'vue'
import type { RsComponentSize, RsRadius } from '../theme/types'
import { useRsI18n } from '../composables/useRsI18n'
import { useResolvedRsComponentSize } from './resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'
import {
  useRsFormContext,
  useRsFormField,
  type RsFormLabelPosition,
} from './form-utils'
import RsIcon from './RsIcon.vue'
import {
  formatNumberValue,
  fromModelValue,
  isNumberInputInterim,
  normalizeCommittedNumber,
  stepNumberValue,
  toModelValue,
  type RsInputNumberValue,
} from './input-number-utils'

defineOptions({ inheritAttrs: false })

const { t } = useRsI18n()

const model = defineModel<RsInputNumberValue>({ default: null })

const props = withDefaults(
  defineProps<{
    id?: string
    min?: number
    max?: number
    step?: number | string
    /** 小数位；未设时按 step 推断 */
    precision?: number
    /**
     * true：modelValue 为 string | null（对齐 Ant stringMode）
     * false：modelValue 为 number | null
     */
    stringMode?: boolean
    /** 是否展示步进按钮（对齐 Ant controls） */
    controls?: boolean
    /** 是否响应键盘上下键（对齐 Ant keyboard） */
    keyboard?: boolean
    /** 是否响应滚轮改值（默认关，避免误触） */
    changeOnWheel?: boolean
    disabled?: boolean
    readonly?: boolean
    placeholder?: string
    size?: RsComponentSize
    radius?: RsRadius
    invalid?: boolean
    errorMessage?: string
    label?: string
    hint?: string
    required?: boolean
    labelPosition?: RsFormLabelPosition
    /** 展示格式化（对齐 Ant formatter） */
    formatter?: (value: number, info: { userTyping: boolean; input: string }) => string
    /** 解析展示值（对齐 Ant parser） */
    parser?: (display: string) => string
  }>(),
  {
    step: 1,
    stringMode: false,
    controls: true,
    keyboard: true,
    changeOnWheel: false,
    disabled: false,
    readonly: false,
    required: false,
  },
)

const emit = defineEmits<{
  pressEnter: [event: KeyboardEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  step: [value: RsInputNumberValue, info: { offset: number }]
}>()

const formContext = useRsFormContext()
const autoId = useId()
const resolvedId = computed(() => props.id || `rs-input-number-${autoId}`)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const radiusStyle = computed(() => ({
  '--rs-input-radius': rsRadiusCss(resolvedRadius.value),
}))

const resolvedLabelPosition = computed(
  () => props.labelPosition ?? formContext?.labelPosition.value ?? 'top',
)
const resolvedLabelAlign = computed(() => formContext?.labelAlign.value ?? 'start')
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const resolvedReadonly = computed(() => props.readonly)

const fieldStyle = computed(() => {
  if (resolvedLabelPosition.value !== 'left') return undefined
  const labelWidth = formContext?.labelWidth.value
  if (!labelWidth) return undefined
  return { '--rs-field-label-width': labelWidth }
})

const errorId = computed(() => `${resolvedId.value}-error`)
const isInvalid = computed(() => Boolean(props.invalid || props.errorMessage))
const displayMessage = computed(() => props.errorMessage || '')

/** 输入框文本草稿（允许中间态） */
const draft = ref('')
const focused = ref(false)
const userTyping = ref(false)

function syncDraftFromModel(value: RsInputNumberValue = model.value): void {
  const num = fromModelValue(value)
  draft.value = formatNumberValue(num, {
    precision: props.precision,
    formatter: props.formatter,
    userTyping: false,
    input: num == null ? '' : String(num),
  })
}

watch(
  () => model.value,
  (value) => {
    if (focused.value && userTyping.value) return
    syncDraftFromModel(value)
  },
  { immediate: true },
)

watch(
  () => [props.precision, props.formatter] as const,
  () => {
    if (!focused.value) syncDraftFromModel()
  },
)

const numericValue = computed(() => fromModelValue(model.value))

const canIncrease = computed(() => {
  if (resolvedDisabled.value || resolvedReadonly.value) return false
  if (props.max == null || !Number.isFinite(props.max)) return true
  const current = numericValue.value
  if (current == null) return true
  return current < props.max
})

const canDecrease = computed(() => {
  if (resolvedDisabled.value || resolvedReadonly.value) return false
  if (props.min == null || !Number.isFinite(props.min)) return true
  const current = numericValue.value
  if (current == null) return true
  return current > props.min
})

function commitDraft(raw = draft.value): void {
  const next = normalizeCommittedNumber(raw, {
    min: props.min,
    max: props.max,
    precision: props.precision,
    step: props.step,
    parser: props.parser,
  })
  model.value = toModelValue(next, props.stringMode)
  syncDraftFromModel(model.value)
  userTyping.value = false
}

function applyStep(direction: 1 | -1): void {
  if (resolvedDisabled.value || resolvedReadonly.value) return
  // 先提交中间态，再步进（对齐 Ant：基于合法值步进）
  if (userTyping.value) commitDraft()
  const next = stepNumberValue(numericValue.value, direction, {
    step: props.step,
    min: props.min,
    max: props.max,
    precision: props.precision,
  })
  model.value = toModelValue(next, props.stringMode)
  syncDraftFromModel(model.value)
  emit('step', model.value, { offset: direction * Number(props.step || 1) })
}

function onNativeInput(event: Event): void {
  const el = event.target as HTMLInputElement
  const text = el.value
  userTyping.value = true
  draft.value = text

  // 合法完整数字可即时同步（仍保留中间态文本）
  if (!isNumberInputInterim(text) && text.trim() !== '') {
    const next = normalizeCommittedNumber(text, {
      min: props.min,
      max: props.max,
      precision: props.precision,
      step: props.step,
      parser: props.parser,
    })
    if (next != null) {
      model.value = toModelValue(next, props.stringMode)
    }
  } else if (text.trim() === '') {
    model.value = null
  }
}

function onFocus(event: FocusEvent): void {
  focused.value = true
  emit('focus', event)
}

function onBlur(event: FocusEvent): void {
  focused.value = false
  commitDraft()
  emit('blur', event)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    commitDraft()
    emit('pressEnter', event)
    return
  }
  if (!props.keyboard || resolvedDisabled.value || resolvedReadonly.value) return
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    applyStep(1)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    applyStep(-1)
  }
}

function onWheel(event: WheelEvent): void {
  if (!props.changeOnWheel || !focused.value) return
  if (resolvedDisabled.value || resolvedReadonly.value) return
  event.preventDefault()
  applyStep(event.deltaY < 0 ? 1 : -1)
}

function setValue(value: unknown): void {
  if (value == null || value === '') {
    model.value = null
    syncDraftFromModel(null)
    return
  }
  const num = fromModelValue(
    typeof value === 'number' || typeof value === 'string' ? value : String(value),
  )
  model.value = toModelValue(num, props.stringMode)
  syncDraftFromModel(model.value)
}

useRsFormField(() => ({
  getValue: () => model.value,
  setValue,
  validate: () => {
    if (props.required && model.value == null) {
      return { valid: false }
    }
    return { valid: true }
  },
  clearValidation: () => undefined,
}))

defineExpose({
  focus: () => {
    const el = document.getElementById(resolvedId.value) as HTMLInputElement | null
    el?.focus()
  },
  blur: () => {
    const el = document.getElementById(resolvedId.value) as HTMLInputElement | null
    el?.blur()
  },
  commit: commitDraft,
  setValue,
  step: applyStep,
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
      `rs-input-number-field--${resolvedSize}`,
    ]"
    :style="[fieldStyle, radiusStyle]"
  >
    <span v-if="label" class="rs-field__label">
      <label :for="resolvedId">{{ label }}</label>
      <span v-if="required" class="rs-field__required" aria-hidden="true">*</span>
    </span>

    <div class="rs-input-number-field">
      <div
        class="rs-input-number"
        :class="{
          'rs-input-number--invalid': isInvalid,
          'rs-input-number--disabled': resolvedDisabled,
          'rs-input-number--readonly': resolvedReadonly,
          'rs-input-number--controls': controls,
          [`rs-input-number--${resolvedSize}`]: true,
        }"
      >
        <input
          :id="resolvedId"
          class="rs-input-number__control"
          :class="`rs-input-number__control--${resolvedSize}`"
          type="text"
          inputmode="decimal"
          role="spinbutton"
          :value="draft"
          :placeholder="placeholder"
          :disabled="resolvedDisabled"
          :readonly="resolvedReadonly"
          :aria-invalid="isInvalid || undefined"
          :aria-describedby="displayMessage ? errorId : undefined"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="numericValue ?? undefined"
          :aria-valuetext="draft || undefined"
          @input="onNativeInput"
          @focus="onFocus"
          @blur="onBlur"
          @keydown="onKeydown"
          @wheel="onWheel"
        />

        <div v-if="controls" class="rs-input-number__handlers" aria-hidden="true">
          <button
            type="button"
            class="rs-input-number__handler rs-input-number__handler--up"
            tabindex="-1"
            :disabled="!canIncrease"
            :aria-label="t('inputNumber.increase')"
            @pointerdown.prevent
            @click="applyStep(1)"
          >
            <RsIcon name="chevron-up" :size="12" />
          </button>
          <button
            type="button"
            class="rs-input-number__handler rs-input-number__handler--down"
            tabindex="-1"
            :disabled="!canDecrease"
            :aria-label="t('inputNumber.decrease')"
            @pointerdown.prevent
            @click="applyStep(-1)"
          >
            <RsIcon name="chevron-down" :size="12" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="displayMessage" :id="errorId" class="rs-input-number-field__error" role="alert">
      {{ displayMessage }}
    </p>
    <span v-if="hint" class="rs-field__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.rs-input-number-field {
  width: 100%;
}
.rs-field--label-left .rs-input-number-field {
  grid-column: 2;
  min-width: 0;
}
.rs-field--label-left .rs-input-number-field__error {
  grid-column: 2;
}
.rs-field--label-left .rs-field__label {
  display: flex;
  align-items: center;
  min-height: var(--rs-control-height-md);
}
.rs-input-number-field--ssm.rs-field--label-left .rs-field__label {
  min-height: var(--rs-control-height-ssm);
}
.rs-input-number-field--sm.rs-field--label-left .rs-field__label {
  min-height: var(--rs-control-height-sm);
}
.rs-input-number-field--lg.rs-field--label-left .rs-field__label {
  min-height: var(--rs-control-height-lg);
}

.rs-input-number {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: var(--rs-control-height-md);
  border-radius: var(--rs-input-radius, var(--rs-radius-sm));
  border: 1px solid var(--rs-input-border, var(--rs-border));
  background: var(--rs-input-bg);
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
  overflow: hidden;
}
.rs-input-number--ssm {
  min-height: var(--rs-control-height-ssm);
}
.rs-input-number--sm {
  min-height: var(--rs-control-height-sm);
}
.rs-input-number--lg {
  min-height: var(--rs-control-height-lg);
}
.rs-input-number:hover:not(.rs-input-number--disabled):not(.rs-input-number--readonly):not(
    :focus-within
  ) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}
.rs-input-number:focus-within {
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
.rs-input-number--invalid {
  border-color: var(--rs-danger);
}
.rs-input-number--invalid:focus-within {
  border-color: var(--rs-danger);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) color-mix(in srgb, var(--rs-danger) 14%, transparent);
}
.rs-input-number--disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--rs-surface-muted, var(--rs-input-bg));
}

.rs-input-number__control {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--rs-fg);
  font: inherit;
  padding: 0 10px;
  height: 100%;
  appearance: textfield;
  -moz-appearance: textfield;
}
.rs-input-number__control--ssm {
  padding: 0 8px;
  font-size: 12px;
}
.rs-input-number__control--sm {
  padding: 0 8px;
  font-size: 12px;
}
.rs-input-number__control--lg {
  padding: 0 12px;
  font-size: 15px;
}
.rs-input-number__control:disabled {
  cursor: not-allowed;
}
.rs-input-number__control::-webkit-outer-spin-button,
.rs-input-number__control::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.rs-input-number__handlers {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 22px;
  border-left: 1px solid var(--rs-input-border, var(--rs-border));
}
.rs-input-number--ssm .rs-input-number__handlers,
.rs-input-number--sm .rs-input-number__handlers {
  width: 18px;
}
.rs-input-number__handler {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  color: var(--rs-fg-muted);
  cursor: pointer;
  line-height: 1;
}
.rs-input-number__handler:hover:not(:disabled) {
  color: var(--rs-fg);
  background: var(--rs-surface-muted, transparent);
}
.rs-input-number__handler:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.rs-input-number__handler--up {
  border-bottom: 1px solid var(--rs-input-border, var(--rs-border));
}

.rs-input-number-field__error {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--rs-danger);
  line-height: 1.4;
}
</style>
