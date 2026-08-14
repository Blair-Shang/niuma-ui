<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize, RsRadius } from '../theme/types'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
} from './form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from './form-rules'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'
import { useResolvedRsComponentSize } from './resolve-size'
import type { RsTagVariant } from './RsTag.vue'
import RsIcon from './RsIcon.vue'
import RsTag from './RsTag.vue'

export type RsDynamicTagsInputMode = 'trigger' | 'always'
export type RsDynamicTagsRejectReason = 'duplicate' | 'max'

const model = defineModel<string[]>({ default: () => [] })

const props = withDefaults(
  defineProps<{
    /** 字段名：匹配 RsForm.rules[name] */
    name?: string
    id?: string
    invalid?: boolean
    placeholder?: string
    disabled?: boolean
    required?: boolean
    max?: number
    /** 输入内容最大长度 */
    maxlength?: number
    /** 允许重复标签 */
    allowDuplicate?: boolean
    /**
     * trigger：点击「+」后再输入（对齐 Naive DynamicTags）
     * always：始终显示输入框（对齐 InputTag 常驻输入）
     */
    inputMode?: RsDynamicTagsInputMode
    /** 失焦时是否提交当前输入 */
    commitOnBlur?: boolean
    size?: RsComponentSize
    radius?: RsRadius
    /** 标签视觉变体 */
    tagVariant?: RsTagVariant
    round?: boolean
  }>(),
  {
    disabled: false,
    required: false,
    allowDuplicate: false,
    inputMode: 'trigger',
    commitOnBlur: true,
    tagVariant: 'default',
    round: false,
  },
)

const emit = defineEmits<{
  create: [value: string]
  remove: [value: string, index: number]
  reject: [reason: RsDynamicTagsRejectReason, value: string]
}>()

const { t } = useRsI18n()
const formContext = useRsFormContext()
const formItem = useRsFormItemContext()
const boundToItem = computed(() =>
  isRsFormItemBoundControl(formItem, { id: props.id, name: props.name }),
)
const draft = ref('')
const editing = ref(props.inputMode === 'always')
const composing = ref(false)
const feedback = ref<RsDynamicTagsRejectReason | null>(null)
const autoMessage = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'md')
const resolvedPlaceholder = computed(
  () => props.placeholder ?? t('dynamicTags.placeholder'),
)

const canAddMore = computed(
  () => props.max === undefined || model.value.length < props.max,
)

const showInput = computed(
  () => !props.disabled && canAddMore.value && (props.inputMode === 'always' || editing.value),
)

const showTrigger = computed(
  () =>
    !props.disabled &&
    canAddMore.value &&
    props.inputMode === 'trigger' &&
    !editing.value,
)

const hasError = computed(() =>
  Boolean(props.invalid || (boundToItem.value && formItem?.invalid.value) || autoMessage.value),
)
const visibleMessage = computed(() => (boundToItem.value ? '' : autoMessage.value))

const rootClass = computed(() => [
  'rs-dynamic-tags',
  `rs-dynamic-tags--${resolvedSize.value}`,
  {
    'rs-dynamic-tags--disabled': props.disabled,
    'rs-dynamic-tags--editing': showInput.value,
    'rs-dynamic-tags--feedback': feedback.value != null,
    'rs-dynamic-tags--invalid': hasError.value,
  },
])

const rootStyle = computed(() => ({
  '--rs-dynamic-tags-radius-local': rsRadiusCss(resolvedRadius.value),
}))

function clearFeedbackTimer(): void {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
    feedbackTimer = null
  }
}

function flashFeedback(reason: RsDynamicTagsRejectReason, value: string): void {
  feedback.value = reason
  emit('reject', reason, value)
  clearFeedbackTimer()
  feedbackTimer = setTimeout(() => {
    feedback.value = null
    feedbackTimer = null
  }, 520)
}

async function focusInput(): Promise<void> {
  await nextTick()
  inputRef.value?.focus()
}

function startEdit(): void {
  if (props.disabled || !canAddMore.value) {
    if (!canAddMore.value) flashFeedback('max', draft.value)
    return
  }
  editing.value = true
  void focusInput()
}

function stopEdit(): void {
  draft.value = ''
  if (props.inputMode === 'trigger') editing.value = false
}

function addTag(): boolean {
  if (props.disabled) return false
  if (!canAddMore.value) {
    flashFeedback('max', draft.value)
    return false
  }
  const value = draft.value.trim()
  if (!value) return false
  if (!props.allowDuplicate && model.value.includes(value)) {
    flashFeedback('duplicate', value)
    draft.value = ''
    return false
  }
  model.value = [...model.value, value]
  emit('create', value)
  draft.value = ''
  void runValidate('change')
  return true
}

function commit(): void {
  if (composing.value) return
  const value = draft.value.trim()
  if (!value) {
    if (props.inputMode === 'trigger') stopEdit()
    return
  }
  const ok = addTag()
  if (ok) {
    if (props.inputMode === 'trigger' && !canAddMore.value) stopEdit()
    else void focusInput()
  }
}

function removeTag(index: number): void {
  if (props.disabled) return
  const next = [...model.value]
  const [removed] = next.splice(index, 1)
  model.value = next
  if (removed !== undefined) emit('remove', removed, index)
  void runValidate('change')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing || composing.value) return
  if (event.key === 'Enter') {
    event.preventDefault()
    commit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    stopEdit()
  } else if (event.key === 'Backspace' && !draft.value && model.value.length > 0) {
    removeTag(model.value.length - 1)
  }
}

function onBlur(): void {
  if (composing.value) return
  if (props.commitOnBlur && draft.value.trim()) {
    commit()
  } else if (props.inputMode === 'trigger') {
    stopEdit()
  }
  void runValidate('blur')
}

async function runValidate(trigger: RsFormRuleTrigger = 'submit') {
  const formRules = formContext?.getFieldRules(props.name) ?? []
  const localRules = buildLocalInputRules({ required: props.required })
  const rules = [...formRules, ...localRules]
  if (!rules.length) {
    autoMessage.value = ''
    return { valid: true as const, name: props.name }
  }
  const result = await runFormFieldRules(model.value, rules, { trigger })
  autoMessage.value = result.message ?? ''
  return { valid: result.valid, message: result.message, name: props.name }
}

function setValue(value: unknown): void {
  if (Array.isArray(value)) {
    model.value = value.map((item) => String(item ?? ''))
    return
  }
  if (value == null || value === '') {
    model.value = []
    return
  }
  model.value = [String(value)]
}

function clearValidation(): void {
  autoMessage.value = ''
}

useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue,
  validate: (trigger) => runValidate(trigger ?? 'submit'),
  clearValidation,
  setError: (message: string) => {
    autoMessage.value = message
  },
}))

watch(
  () => model.value,
  () => {
    if (autoMessage.value) void runValidate('change')
  },
)

defineExpose({
  validate: runValidate,
  clearValidation,
  setValue,
})

function onRootPointerDown(event: MouseEvent): void {
  if (props.disabled) return
  const target = event.target as HTMLElement | null
  if (!target) return
  // 关闭按钮、触发器、输入框自身不抢焦点逻辑
  if (target.closest('.rs-tag__close, .rs-dynamic-tags__trigger, .rs-dynamic-tags__input')) {
    return
  }
  if (showInput.value) {
    void focusInput()
  } else if (showTrigger.value) {
    startEdit()
  }
}

onBeforeUnmount(() => {
  clearFeedbackTimer()
})
</script>

<template>
  <div class="rs-dynamic-tags-field">
    <div
      :class="rootClass"
      :style="rootStyle"
      role="group"
      :aria-disabled="disabled || undefined"
      :aria-invalid="hasError || undefined"
      :aria-label="t('dynamicTags.label')"
      @pointerdown="onRootPointerDown"
    >
      <RsTag
        v-for="(tag, index) in model"
        :key="`${tag}-${index}`"
        closable
        :disabled="disabled"
        :size="resolvedSize"
        :radius="resolvedRadius"
        :variant="tagVariant"
        :round="round"
        @close="removeTag(index)"
      >
        {{ tag }}
      </RsTag>

      <input
        v-if="showInput"
        ref="inputRef"
        v-model="draft"
        class="rs-dynamic-tags__input"
        type="text"
        :placeholder="resolvedPlaceholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :aria-label="resolvedPlaceholder"
        @keydown="onKeydown"
        @blur="onBlur"
        @compositionstart="composing = true"
        @compositionend="composing = false"
      >

      <button
        v-else-if="showTrigger"
        type="button"
        class="rs-dynamic-tags__trigger"
        :aria-label="t('dynamicTags.add')"
        @click.stop="startEdit"
      >
        <RsIcon name="plus" :size="14" />
      </button>
    </div>
    <p
      v-if="visibleMessage"
      class="rs-dynamic-tags-field__error"
      role="alert"
    >
      {{ visibleMessage }}
    </p>
  </div>
</template>

<style scoped>
.rs-dynamic-tags-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.rs-dynamic-tags-field__error {
  margin: 0.25rem 0 0;
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
  color: var(--rs-danger);
}

.rs-dynamic-tags {
  --rs-dynamic-tags-chip-height: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-dynamic-tags-gap, var(--rs-space-xs));
  /* padding + chip + 1px*2 边框，避免 trigger/input 切换或输入时高度跳动 */
  min-height: calc(
    var(--rs-dynamic-tags-chip-height) + 2 * var(--rs-dynamic-tags-padding, var(--rs-space-xs)) +
      2px
  );
  padding: var(--rs-dynamic-tags-padding, var(--rs-space-xs));
  border: 1px solid var(--rs-dynamic-tags-border, var(--rs-input-border, var(--rs-border)));
  border-radius: var(
    --rs-dynamic-tags-radius-local,
    var(--rs-dynamic-tags-radius, var(--rs-radius))
  );
  background: var(--rs-dynamic-tags-bg, var(--rs-input-bg, var(--rs-surface)));
  box-shadow: var(--rs-dynamic-tags-shadow, var(--rs-input-shadow, none));
  box-sizing: border-box;
  cursor: text;
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background-color var(--rs-transition-fast);
}

.rs-dynamic-tags:hover:not(.rs-dynamic-tags--disabled) {
  border-color: var(
    --rs-dynamic-tags-border-hover,
    var(--rs-input-border-hover, var(--rs-border))
  );
}

.rs-dynamic-tags--ssm {
  --rs-dynamic-tags-chip-height: 1.125rem;
}

.rs-dynamic-tags--sm {
  --rs-dynamic-tags-chip-height: 1.25rem;
}

.rs-dynamic-tags--md {
  --rs-dynamic-tags-chip-height: 1.5rem;
}

.rs-dynamic-tags--lg {
  --rs-dynamic-tags-chip-height: 1.75rem;
}

.rs-dynamic-tags--editing:not(.rs-dynamic-tags--disabled),
.rs-dynamic-tags:focus-within:not(.rs-dynamic-tags--disabled) {
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow:
    var(--rs-dynamic-tags-shadow, var(--rs-input-shadow, none)),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-dynamic-tags--feedback,
.rs-dynamic-tags--invalid {
  border-color: var(--rs-danger);
}

.rs-dynamic-tags--feedback {
  animation: rs-dynamic-tags-shake 0.45s ease;
}

.rs-dynamic-tags--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rs-dynamic-tags__input {
  flex: 1 1 6rem;
  min-width: 4rem;
  width: 0;
  height: var(--rs-dynamic-tags-chip-height);
  margin: 0;
  padding: 0 var(--rs-space-xs);
  border: 0;
  outline: none;
  background: transparent;
  color: var(--rs-text);
  font: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-dynamic-tags-chip-height);
  box-sizing: border-box;
  box-shadow: none;
  appearance: none;
}

.rs-dynamic-tags--ssm .rs-dynamic-tags__input,
.rs-dynamic-tags--sm .rs-dynamic-tags__input {
  font-size: var(--rs-font-size-xs);
}

.rs-dynamic-tags__input::placeholder {
  color: var(--rs-placeholder);
  line-height: var(--rs-dynamic-tags-chip-height);
}

.rs-dynamic-tags__trigger {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--rs-dynamic-tags-chip-height);
  height: var(--rs-dynamic-tags-chip-height);
  margin: 0;
  padding: 0;
  border: 1px dashed var(--rs-dynamic-tags-trigger-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition:
    color var(--rs-transition-fast),
    border-color var(--rs-transition-fast),
    background-color var(--rs-transition-fast);
}

.rs-dynamic-tags__trigger:hover {
  color: var(--rs-primary);
  border-color: var(--rs-primary);
  background: color-mix(in srgb, var(--rs-primary) 8%, transparent);
}

.rs-dynamic-tags__trigger:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

@keyframes rs-dynamic-tags-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
  }
  40% {
    transform: translateX(3px);
  }
  60% {
    transform: translateX(-2px);
  }
  80% {
    transform: translateX(2px);
  }
}
</style>
