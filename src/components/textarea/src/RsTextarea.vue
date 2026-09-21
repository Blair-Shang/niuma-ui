<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import type { RsComponentSize, RsRadius } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { normalizeRsInputValue } from '../../input/src/input-utils'
import type { RsInputRule, RsInputValidateTrigger } from '../../input/src/input-rules'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
  type RsFormLabelPosition,
} from '../../form/src/form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from '../../form/src/form-rules'
import RsVNodeHost from '../../vnode-host/src/RsVNodeHost.vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  applyTextareaAutosize,
  resolveRsTextareaAutosizeSpec,
  resolveRsTextareaDisplayRows,
  resolveRsTextareaResize,
  isRsTextareaAutosizeEnabled,
  type RsTextareaAutosize,
  type RsTextareaResize,
} from './textarea-utils'

/**
 * RsTextarea 模板 ref 请用此类型。
 * 不要写 InstanceType<typeof RsTextarea>：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsTextareaExpose {
  validate: (trigger?: RsFormRuleTrigger) => Promise<boolean>
  clearValidation: () => void
  setValue: (value: unknown) => void
  setError: (message: string) => void
  focus: () => void
  blur: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsTextareaInstance = RsTextareaExpose & { $el: HTMLElement }

export type { RsTextareaAutosize, RsTextareaResize }

defineOptions({ name: 'RsTextarea', inheritAttrs: false })

const { t } = useRsI18n()

const model = defineModel<string>({
  default: '',
  get(value) {
    return normalizeRsInputValue(value)
  },
  set(value) {
    return normalizeRsInputValue(value)
  },
})

const props = withDefaults(
  defineProps<{
    id?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    invalid?: boolean
    errorMessage?: string
    size?: RsComponentSize
    radius?: RsRadius
    rows?: number
    resize?: RsTextareaResize
    /** true 或 { minRows, maxRows }；开启后不可拖拽改高 */
    autosize?: RsTextareaAutosize
    rule?: RsInputRule
    validator?: (value: string) => boolean | string
    required?: boolean
    validateTrigger?: RsInputValidateTrigger
    name?: string
    minlength?: number
    maxlength?: number
    showCount?: boolean
    clearable?: boolean
    showValidateMessage?: boolean
    label?: string
    hint?: string
    labelPosition?: RsFormLabelPosition
  }>(),
  {
    disabled: false,
    readonly: false,
    invalid: false,
    required: false,
    validateTrigger: 'blur',
    showCount: false,
    clearable: false,
    showValidateMessage: true,
    rows: 3,
    resize: 'vertical',
    autosize: false,
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
const formContext = useRsFormContext()
const formItem = useRsFormItemContext()
const boundToItem = computed(() =>
  isRsFormItemBoundControl(formItem, { id: props.id, name: props.name }),
)
const fieldId = useId()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const touched = ref(false)
const autoInvalid = ref(false)
const autoMessage = ref('')
const composing = ref(false)

const resolvedId = computed(() => props.id ?? fieldId)
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
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const radiusStyle = computed(() => ({
  '--rs-input-radius': rsRadiusCss(resolvedRadius.value),
}))
const fieldStyle = computed(() => {
  if (resolvedLabelPosition.value !== 'left') return undefined
  const labelWidth = formContext?.labelWidth.value
  if (!labelWidth) return undefined
  return { '--rs-field-label-width': labelWidth } as Record<string, string>
})

const autosizeEnabled = computed(() => isRsTextareaAutosizeEnabled(props.autosize))
const autosizeSpec = computed(() => resolveRsTextareaAutosizeSpec(props.autosize))
const displayRows = computed(() => resolveRsTextareaDisplayRows(props.autosize, props.rows))
const resolvedResize = computed(() => resolveRsTextareaResize(props.resize, props.autosize))

const countText = computed(() => {
  const n = model.value.length
  return props.maxlength != null ? `${n} / ${props.maxlength}` : String(n)
})
const countLimitReached = computed(
  () => props.maxlength != null && model.value.length >= props.maxlength,
)
const showClearButton = computed(
  () =>
    props.clearable && !resolvedDisabled.value && !props.readonly && model.value.length > 0,
)

function adjustHeight(): void {
  applyTextareaAutosize(textareaRef.value, {
    enabled: autosizeEnabled.value,
    minRows: autosizeSpec.value.minRows ?? props.rows,
    maxRows: autosizeSpec.value.maxRows,
  })
}

function scheduleAdjustHeight(): void {
  const el = textareaRef.value
  if (!autosizeEnabled.value && !el?.style.height) return
  void nextTick(adjustHeight)
}

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

function setValue(value: unknown): void {
  model.value = normalizeRsInputValue(value)
  scheduleAdjustHeight()
}

function clearValidation(): void {
  touched.value = false
  autoInvalid.value = false
  autoMessage.value = ''
}

function focus(): void {
  textareaRef.value?.focus()
}

function blur(): void {
  textareaRef.value?.blur()
}

function onNativeInput(event: Event): void {
  const el = event.target as HTMLTextAreaElement | null
  model.value = el?.value ?? ''
  scheduleAdjustHeight()
  if (composing.value) return
  if (touched.value && (props.validateTrigger === 'input' || props.validateTrigger === 'both')) {
    void runValidate('change')
  }
}

function onCompositionStart(): void {
  composing.value = true
}

function onCompositionEnd(event: CompositionEvent): void {
  composing.value = false
  onNativeInput(event)
}

function onBlur(event: FocusEvent): void {
  touched.value = true
  if (props.validateTrigger === 'blur' || props.validateTrigger === 'both') {
    void runValidate('blur')
  }
  emit('blur', event)
}

function onFocus(event: FocusEvent): void {
  emit('focus', event)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || composing.value) return
  emit('pressEnter', event)
}

function onClear(): void {
  if (resolvedDisabled.value || props.readonly) return
  model.value = ''
  emit('clear')
  void nextTick(() => {
    textareaRef.value?.focus()
    adjustHeight()
    if (props.validateTrigger === 'input' || props.validateTrigger === 'both') {
      void runValidate('change')
    }
  })
}

watch(
  [model, () => props.autosize, () => props.rows, () => props.size, () => props.showCount],
  scheduleAdjustHeight,
)

onMounted(adjustHeight)

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

defineExpose<RsTextareaExpose>({
  validate: runValidate,
  clearValidation,
  setValue,
  setError,
  focus,
  blur,
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

    <div class="rs-textarea">
      <div
        class="rs-textarea__shell"
        :class="{
          'is-invalid': isInvalid,
          'is-disabled': resolvedDisabled,
          'is-readonly': readonly,
          'is-autosize': autosizeEnabled,
          'has-count': showCount,
          'has-clear': showClearButton,
        }"
      >
        <textarea
          ref="textareaRef"
          v-bind="attrs"
          :id="resolvedId"
          :value="model"
          class="rs-textarea__control"
          :rows="displayRows"
          :style="{ resize: resolvedResize }"
          :placeholder="placeholder"
          :disabled="resolvedDisabled"
          :readonly="readonly"
          :minlength="minlength"
          :maxlength="maxlength"
          :aria-invalid="isInvalid || undefined"
          :aria-describedby="describedBy"
          @input="onNativeInput"
          @compositionstart="onCompositionStart"
          @compositionend="onCompositionEnd"
          @keydown="onKeydown"
          @blur="onBlur"
          @focus="onFocus"
        />
        <button
          v-if="showClearButton"
          type="button"
          class="rs-textarea__clear"
          tabindex="-1"
          :aria-label="t('input.clear')"
          @pointerdown.prevent
          @click="onClear"
        >
          <RsIcon name="x" :size="14" />
        </button>
        <span
          v-if="showCount"
          class="rs-textarea__count"
          :class="{ 'is-limit': countLimitReached }"
          aria-hidden="true"
        >
          <slot name="count" :value="model" :count="model.length" :maxlength="maxlength">
            {{ countText }}
          </slot>
        </span>
      </div>
      <p v-if="displayMessage" :id="errorId" class="rs-field__error" role="alert">
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
  </div>
</template>

<style scoped>
.rs-textarea {
  width: 100%;
}

.rs-textarea__shell {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-input-radius, var(--rs-radius-sm));
  background: var(--rs-input-bg);
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-textarea__shell:hover:not(.is-disabled):not(.is-readonly):not(:focus-within) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}

.rs-textarea__shell:focus-within {
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-textarea__shell.is-invalid {
  border-color: var(--rs-danger);
}

.rs-textarea__shell.is-invalid:focus-within {
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) color-mix(in srgb, var(--rs-danger) 14%, transparent);
}

.rs-textarea__shell.is-disabled {
  opacity: 0.38;
  cursor: not-allowed;
  background: var(--rs-surface-hover);
}

.rs-textarea__shell.is-readonly {
  background: var(--rs-surface-hover);
}

.rs-textarea__control {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 4.5rem;
  padding: 0.55rem 0.75rem;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--rs-text);
  font: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: 1.5;
}

.rs-textarea__shell.is-autosize .rs-textarea__control {
  min-height: 0;
}

.rs-textarea__shell.has-count .rs-textarea__control {
  padding-bottom: 1.55rem;
}

.rs-textarea__shell.has-clear .rs-textarea__control {
  padding-inline-end: 1.85rem;
}

.rs-input-field--sm .rs-textarea__control {
  min-height: 3.5rem;
  padding: 0.4rem 0.6rem;
  font-size: var(--rs-font-size-xs);
}

.rs-input-field--sm .rs-textarea__shell.has-count .rs-textarea__control {
  padding-bottom: 1.4rem;
}

.rs-input-field--lg .rs-textarea__control {
  min-height: 5.5rem;
  padding: 0.7rem 0.9rem;
}

.rs-textarea__control::placeholder {
  color: var(--rs-placeholder);
}

.rs-textarea__control:disabled {
  cursor: not-allowed;
}

.rs-textarea__control:read-only {
  cursor: default;
}

.rs-textarea__clear {
  position: absolute;
  top: 0.45rem;
  inset-inline-end: 0.45rem;
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

.rs-textarea__clear:hover {
  color: var(--rs-text);
  background: var(--rs-item-hover);
}

.rs-textarea__count {
  position: absolute;
  inset-inline-end: 0.65rem;
  bottom: 0.3rem;
  margin: 0;
  pointer-events: none;
  font-size: var(--rs-font-size-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--rs-muted);
}

.rs-textarea__count.is-limit {
  color: var(--rs-danger);
}

.rs-field--label-left .rs-textarea {
  grid-column: 2;
  min-width: 0;
}
</style>
