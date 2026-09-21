<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import type { RsComponentSize, RsRadius } from '../../../theme/types'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
} from '../../form/src/form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from '../../form/src/form-rules'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import type { RsTagVariant } from '../../tag'
import RsIcon from '../../icon/src/RsIcon.vue'
import RsTag from '../../tag/src/RsTag.vue'
import {
  canAcceptRsDynamicTag,
  coerceRsDynamicTagsValue,
  draftHasRsDynamicTagsSeparator,
  normalizeRsDynamicTagsSeparators,
  parseRsDynamicTag,
  splitRsDynamicTagsDraft,
  type RsDynamicTagsParse,
  type RsDynamicTagsRejectReason,
} from './dynamic-tags-utils'

/**
 * RsDynamicTags 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsDynamicTags>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsDynamicTagsExpose {
  validate: (
    trigger?: RsFormRuleTrigger,
  ) => Promise<{ valid: boolean; message?: string; name?: string }>
  clearValidation: () => void
  setValue: (value: unknown) => void
  setError: (message: string) => void
  focus: () => void
  blur: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsDynamicTagsInstance = RsDynamicTagsExpose & { $el: HTMLElement }

export type RsDynamicTagsInputMode = 'trigger' | 'always'
export type { RsDynamicTagsParse, RsDynamicTagsRejectReason }

defineOptions({ name: 'RsDynamicTags' })

const model = defineModel<string[]>({ default: () => [] })

const props = withDefaults(
  defineProps<{
    /** 字段名：匹配 RsForm.rules[name] */
    name?: string
    id?: string
    invalid?: boolean
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
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
    /**
     * 分隔符。输入或粘贴遇到即切开成多个标签。
     * 例：',' 或 [',', ';']。空格作分隔时每敲一个空格就会提交。
     */
    separators?: string | string[]
    /** 提交前变换或拒绝。false 发 reject('invalid')。 */
    parse?: RsDynamicTagsParse
    /** 有标签且非禁用 / 只读时显示清空 */
    allowClear?: boolean
    size?: RsComponentSize
    radius?: RsRadius
    /** 标签视觉变体 */
    tagVariant?: RsTagVariant
    round?: boolean
    /** 无障碍名称。旁边已有可见 label 时可省略。 */
    ariaLabel?: string
  }>(),
  {
    disabled: false,
    readonly: false,
    required: false,
    allowDuplicate: false,
    inputMode: 'trigger',
    commitOnBlur: true,
    allowClear: false,
    tagVariant: 'default',
    round: false,
  },
)

const emit = defineEmits<{
  create: [value: string]
  remove: [value: string, index: number]
  reject: [reason: RsDynamicTagsRejectReason, value: string]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
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
const autoId = useId()
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

const inputId = computed(() => props.id || autoId)
const errorId = computed(() => `${inputId.value}-error`)
const feedbackId = computed(() => `${inputId.value}-feedback`)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'md')
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const resolvedReadonly = computed(() => props.readonly)
const isInteractive = computed(() => !resolvedDisabled.value && !resolvedReadonly.value)
const resolvedSeparators = computed(() =>
  normalizeRsDynamicTagsSeparators(props.separators),
)
const resolvedPlaceholder = computed(
  () => props.placeholder ?? t('dynamicTags.placeholder'),
)
const groupLabel = computed(() => props.ariaLabel || t('dynamicTags.label'))

const canAddMore = computed(
  () => props.max === undefined || model.value.length < props.max,
)

const showInput = computed(
  () => isInteractive.value && canAddMore.value && (props.inputMode === 'always' || editing.value),
)

const showTrigger = computed(
  () =>
    isInteractive.value &&
    canAddMore.value &&
    props.inputMode === 'trigger' &&
    !editing.value,
)

const showClear = computed(
  () => props.allowClear && model.value.length > 0 && isInteractive.value,
)

const hasError = computed(() =>
  Boolean(props.invalid || (boundToItem.value && formItem?.invalid.value) || autoMessage.value),
)
const visibleMessage = computed(() => (boundToItem.value ? '' : autoMessage.value))
const describedBy = computed(() => {
  if (boundToItem.value) return formItem?.describedBy.value
  const ids = [
    visibleMessage.value ? errorId.value : '',
    feedback.value ? feedbackId.value : '',
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const feedbackMessage = computed(() => {
  if (feedback.value === 'duplicate') return t('dynamicTags.duplicate')
  if (feedback.value === 'max') return t('dynamicTags.maxReached')
  if (feedback.value === 'invalid') return t('dynamicTags.invalid')
  return ''
})

const rootClass = computed(() => [
  'rs-dynamic-tags',
  `rs-dynamic-tags--${resolvedSize.value}`,
  {
    'rs-dynamic-tags--disabled': resolvedDisabled.value,
    'rs-dynamic-tags--readonly': resolvedReadonly.value && !resolvedDisabled.value,
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
  if (!isInteractive.value || !canAddMore.value) {
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

function addParsed(value: string): boolean {
  const parsed = parseRsDynamicTag(value, props.parse)
  if (parsed === false) {
    if (value.trim()) flashFeedback('invalid', value.trim())
    return false
  }
  const reason = canAcceptRsDynamicTag(model.value, parsed, {
    allowDuplicate: props.allowDuplicate,
    max: props.max,
  })
  if (reason !== 'ok') {
    flashFeedback(reason, parsed)
    return false
  }
  model.value = [...model.value, parsed]
  emit('create', parsed)
  return true
}

function addMany(values: readonly string[]): boolean {
  let added = false
  for (const value of values) {
    if (addParsed(value)) added = true
    else if (!canAddMore.value) break
  }
  if (added) void runValidate('change')
  return added
}

function commitDraft(raw: string, includeRest: boolean): boolean {
  if (!raw.trim()) return false
  if (resolvedSeparators.value.length && draftHasRsDynamicTagsSeparator(raw, resolvedSeparators.value)) {
    const { tokens, rest } = splitRsDynamicTagsDraft(raw, resolvedSeparators.value)
    const all = includeRest && rest.trim() ? [...tokens, rest.trim()] : tokens
    const added = addMany(all)
    draft.value = includeRest ? '' : rest
    return added
  }
  const ok = addParsed(raw)
  if (ok) {
    draft.value = ''
    void runValidate('change')
  }
  return ok
}

function commit(): void {
  if (composing.value) return
  const value = draft.value
  if (!value.trim()) {
    if (props.inputMode === 'trigger') stopEdit()
    return
  }
  commitDraft(value, true)
  if (props.inputMode === 'trigger' && !canAddMore.value) stopEdit()
  else void focusInput()
}

function onDraftInput(): void {
  if (composing.value) return
  if (!resolvedSeparators.value.length) return
  if (!draftHasRsDynamicTagsSeparator(draft.value, resolvedSeparators.value)) return
  const { tokens, rest } = splitRsDynamicTagsDraft(draft.value, resolvedSeparators.value)
  if (!tokens.length) return
  addMany(tokens)
  draft.value = rest
}

function onCompositionEnd(): void {
  composing.value = false
  onDraftInput()
}

function onPaste(event: ClipboardEvent): void {
  if (!isInteractive.value || composing.value) return
  if (!resolvedSeparators.value.length) return
  const text = event.clipboardData?.getData('text') ?? ''
  if (!text || !draftHasRsDynamicTagsSeparator(text, resolvedSeparators.value)) return
  event.preventDefault()
  const merged = `${draft.value}${text}`
  const { tokens, rest } = splitRsDynamicTagsDraft(merged, resolvedSeparators.value)
  const pasted = rest.trim() ? [...tokens, rest.trim()] : tokens
  if (pasted.length) addMany(pasted)
  draft.value = ''
}

function removeTag(index: number): void {
  if (!isInteractive.value) return
  const next = [...model.value]
  const [removed] = next.splice(index, 1)
  model.value = next
  if (removed !== undefined) emit('remove', removed, index)
  void runValidate('change')
}

function clearAll(): void {
  if (!isInteractive.value || !model.value.length) return
  model.value = []
  draft.value = ''
  emit('clear')
  void runValidate('change')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing || composing.value) return
  if (event.key === 'Enter') {
    event.preventDefault()
    commit()
    return
  }
  if (event.key === 'Tab' && draft.value.trim()) {
    event.preventDefault()
    commit()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    stopEdit()
    return
  }
  if (event.key === 'Backspace' && !draft.value && model.value.length > 0) {
    removeTag(model.value.length - 1)
  }
}

function onFocus(event: FocusEvent): void {
  emit('focus', event)
}

function onBlur(event: FocusEvent): void {
  if (composing.value) {
    emit('blur', event)
    return
  }
  if (props.commitOnBlur && draft.value.trim()) {
    commit()
  } else if (props.inputMode === 'trigger') {
    stopEdit()
  }
  void runValidate('blur')
  emit('blur', event)
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
  model.value = coerceRsDynamicTagsValue(value)
}

function setError(message: string): void {
  autoMessage.value = message
}

function clearValidation(): void {
  autoMessage.value = ''
}

function focus(): void {
  if (resolvedDisabled.value) return
  if (resolvedReadonly.value) return
  if (showInput.value) {
    void focusInput()
    return
  }
  if (showTrigger.value) startEdit()
}

function blur(): void {
  inputRef.value?.blur()
}

useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue,
  validate: (trigger) => runValidate(trigger ?? 'submit'),
  clearValidation,
  setError,
}))

watch(
  () => model.value,
  () => {
    if (autoMessage.value) void runValidate('change')
  },
)

watch(
  () => props.inputMode,
  (mode) => {
    editing.value = mode === 'always'
    if (mode === 'trigger') draft.value = ''
  },
)

defineExpose<RsDynamicTagsExpose>({
  validate: runValidate,
  clearValidation,
  setValue,
  setError,
  focus,
  blur,
})

function onRootPointerDown(event: MouseEvent): void {
  if (!isInteractive.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  if (
    target.closest(
      '.rs-tag__close, .rs-dynamic-tags__trigger, .rs-dynamic-tags__input, .rs-dynamic-tags__clear',
    )
  ) {
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
    <fieldset
      :class="rootClass"
      :style="rootStyle"
      :disabled="resolvedDisabled || undefined"
      :aria-readonly="resolvedReadonly || undefined"
      :aria-invalid="hasError || undefined"
      :aria-describedby="describedBy"
      @pointerdown="onRootPointerDown"
    >
      <legend class="rs-dynamic-tags-field__sr-only">{{ groupLabel }}</legend>
      <RsTag
        v-for="(tag, index) in model"
        :key="`${tag}-${index}`"
        :closable="isInteractive"
        :size="resolvedSize"
        :radius="resolvedRadius"
        :variant="tagVariant"
        :round="round"
        @close="removeTag(index)"
      >
        <slot name="tag" :tag="tag" :index="index">{{ tag }}</slot>
      </RsTag>

      <input
        v-if="showInput"
        :id="inputId"
        ref="inputRef"
        v-model="draft"
        class="rs-dynamic-tags__input"
        type="text"
        :placeholder="resolvedPlaceholder"
        :disabled="resolvedDisabled"
        :readonly="resolvedReadonly"
        :maxlength="maxlength"
        :aria-label="resolvedPlaceholder"
        :aria-invalid="hasError || undefined"
        :aria-describedby="describedBy"
        @input="onDraftInput"
        @paste="onPaste"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
        @compositionstart="composing = true"
        @compositionend="onCompositionEnd"
      >

      <button
        v-else-if="showTrigger"
        type="button"
        class="rs-dynamic-tags__trigger"
        :aria-label="t('dynamicTags.add')"
        @click.stop="startEdit"
      >
        <slot name="trigger">
          <RsIcon name="plus" :size="14" />
        </slot>
      </button>

      <button
        v-if="showClear"
        type="button"
        class="rs-dynamic-tags__clear"
        tabindex="-1"
        :aria-label="t('dynamicTags.clear')"
        @pointerdown.prevent
        @click.stop="clearAll"
      >
        <RsIcon name="x" :size="14" />
      </button>
    </fieldset>
    <p
      v-if="visibleMessage"
      :id="errorId"
      class="rs-dynamic-tags-field__error"
      role="alert"
    >
      {{ visibleMessage }}
    </p>
    <span
      v-if="feedbackMessage"
      :id="feedbackId"
      class="rs-dynamic-tags-field__sr-only"
      aria-live="polite"
    >
      {{ feedbackMessage }}
    </span>
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

.rs-dynamic-tags-field__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rs-dynamic-tags {
  --rs-dynamic-tags-box-height: var(--rs-control-height-md);
  --rs-dynamic-tags-border-width: 1px;
  --rs-dynamic-tags-chip-height: calc(
    var(--rs-dynamic-tags-box-height) - 2 * var(--rs-dynamic-tags-padding, var(--rs-space-xs)) - 2 *
      var(--rs-dynamic-tags-border-width)
  );
  position: relative;
  margin: 0;
  min-inline-size: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-dynamic-tags-gap, var(--rs-space-xs));
  min-height: var(--rs-dynamic-tags-box-height);
  padding: var(--rs-dynamic-tags-padding, var(--rs-space-xs));
  border: var(--rs-dynamic-tags-border-width) solid
    var(--rs-dynamic-tags-border, var(--rs-input-border, var(--rs-border)));
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

.rs-dynamic-tags:hover:not(.rs-dynamic-tags--disabled):not(.rs-dynamic-tags--readonly) {
  border-color: var(
    --rs-dynamic-tags-border-hover,
    var(--rs-input-border-hover, var(--rs-border))
  );
}

.rs-dynamic-tags--ssm {
  --rs-dynamic-tags-box-height: var(--rs-control-height-ssm);
  --rs-dynamic-tags-padding: 1px;
}

.rs-dynamic-tags--sm {
  --rs-dynamic-tags-box-height: var(--rs-control-height-sm);
}

.rs-dynamic-tags--md {
  --rs-dynamic-tags-box-height: var(--rs-control-height-md);
}

.rs-dynamic-tags--lg {
  --rs-dynamic-tags-box-height: var(--rs-control-height-lg);
}

.rs-dynamic-tags--editing:not(.rs-dynamic-tags--disabled):not(.rs-dynamic-tags--readonly),
.rs-dynamic-tags:focus-within:not(.rs-dynamic-tags--disabled):not(.rs-dynamic-tags--readonly) {
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow:
    var(--rs-dynamic-tags-shadow, var(--rs-input-shadow, none)),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-dynamic-tags--feedback,
.rs-dynamic-tags--invalid {
  border-color: var(--rs-danger);
}

.rs-dynamic-tags--invalid:focus-within:not(.rs-dynamic-tags--disabled) {
  border-color: var(--rs-danger);
  box-shadow:
    var(--rs-dynamic-tags-shadow, var(--rs-input-shadow, none)),
    0 0 0 var(--rs-focus-ring-width, 2px) color-mix(in srgb, var(--rs-danger) 14%, transparent);
}

.rs-dynamic-tags--feedback {
  animation: rs-dynamic-tags-shake 0.45s ease;
}

.rs-dynamic-tags--disabled {
  opacity: var(--rs-dynamic-tags-disabled-opacity, 0.38);
  cursor: not-allowed;
}

.rs-dynamic-tags--readonly {
  cursor: default;
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
  color: var(--rs-text-primary, var(--rs-text));
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
  color: var(--rs-text-tertiary, var(--rs-placeholder));
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
  color: var(--rs-text-secondary, var(--rs-muted));
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

.rs-dynamic-tags__clear {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--rs-dynamic-tags-chip-height);
  height: var(--rs-dynamic-tags-chip-height);
  padding: 0;
  border: 0;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-text-secondary, var(--rs-muted));
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition:
    color var(--rs-transition-fast),
    background-color var(--rs-transition-fast);
}

.rs-dynamic-tags__clear:hover {
  color: var(--rs-text-primary, var(--rs-text));
  background: var(--rs-item-hover);
}

.rs-dynamic-tags__clear:focus-visible {
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

@media (prefers-reduced-motion: reduce) {
  .rs-dynamic-tags {
    transition: none;
  }

  .rs-dynamic-tags--feedback {
    animation: none;
  }

  .rs-dynamic-tags__trigger,
  .rs-dynamic-tags__clear {
    transition: none;
  }
}

@media (forced-colors: active) {
  .rs-dynamic-tags {
    border: 1px solid ButtonText;
    background: Field;
    forced-color-adjust: none;
  }

  .rs-dynamic-tags:focus-within {
    border-color: Highlight;
  }

  .rs-dynamic-tags__input {
    color: FieldText;
  }
}
</style>
