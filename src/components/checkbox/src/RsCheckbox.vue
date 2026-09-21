<script setup lang="ts">
import { computed, onMounted, useId, useTemplateRef, watch } from 'vue'
import type { RsComponentSize } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext } from '../../form/src/form-utils'
import {
  applyRsCheckboxIndeterminate,
  resolveRsCheckboxAriaChecked,
} from './checkbox-utils'

export interface RsCheckboxExpose {
  focus: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsCheckboxInstance = RsCheckboxExpose & { $el: HTMLElement }

defineOptions({ name: 'RsCheckbox' })

const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    /** 半选（仅视觉；点击仍按 model 取反） */
    indeterminate?: boolean
    disabled?: boolean
    size?: RsComponentSize
    /** 无障碍名称；有默认插槽文案时可省略 */
    ariaLabel?: string
    id?: string
    name?: string
    required?: boolean
  }>(),
  {
    indeterminate: false,
    disabled: false,
    required: false,
  },
)

const emit = defineEmits<{
  change: [value: boolean]
}>()

const formContext = useRsFormContext()
const autoId = useId()
const inputId = computed(() => props.id || autoId)
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const ariaChecked = computed(() =>
  resolveRsCheckboxAriaChecked(model.value, props.indeterminate),
)

const rootClass = computed(() => [
  'rs-checkbox',
  `rs-checkbox--${resolvedSize.value}`,
  {
    'rs-checkbox--checked': model.value && !props.indeterminate,
    'rs-checkbox--indeterminate': props.indeterminate,
    'rs-checkbox--disabled': resolvedDisabled.value,
  },
])

function syncIndeterminate(): void {
  applyRsCheckboxIndeterminate(inputRef.value, props.indeterminate)
}

function onChange(event: Event): void {
  if (resolvedDisabled.value) return
  const checked = (event.target as HTMLInputElement).checked
  model.value = checked
  emit('change', checked)
}

onMounted(syncIndeterminate)
watch(() => props.indeterminate, syncIndeterminate)

defineExpose<RsCheckboxExpose>({
  focus: () => {
    inputRef.value?.focus()
  },
})
</script>

<template>
  <label :class="rootClass" :for="inputId">
    <input
      :id="inputId"
      ref="inputRef"
      class="rs-checkbox__input"
      type="checkbox"
      :name="name"
      :checked="model"
      :disabled="resolvedDisabled"
      :required="required || undefined"
      :aria-checked="ariaChecked"
      :aria-label="ariaLabel"
      :aria-required="required || undefined"
      @change="onChange"
      @click.stop
    >
    <span class="rs-checkbox__box" aria-hidden="true" />
    <span v-if="$slots.default" class="rs-checkbox__label">
      <slot />
    </span>
  </label>
</template>

<style scoped>
.rs-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  vertical-align: middle;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  color: var(--rs-text);
}

.rs-checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.rs-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rs-checkbox__box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-xs);
  background: var(--rs-surface);
  transition:
    border-color var(--rs-transition-fast),
    background-color var(--rs-transition-fast);
}

.rs-checkbox--ssm .rs-checkbox__box {
  width: 0.75rem;
  height: 0.75rem;
}

.rs-checkbox--sm .rs-checkbox__box {
  width: 0.875rem;
  height: 0.875rem;
}

.rs-checkbox--md .rs-checkbox__box {
  width: 1rem;
  height: 1rem;
}

.rs-checkbox--lg .rs-checkbox__box {
  width: 1.125rem;
  height: 1.125rem;
}

.rs-checkbox:hover:not(.rs-checkbox--disabled) .rs-checkbox__box {
  border-color: var(--rs-primary);
}

.rs-checkbox--checked .rs-checkbox__box,
.rs-checkbox--indeterminate .rs-checkbox__box {
  border-color: var(--rs-primary);
  background: var(--rs-primary);
}

.rs-checkbox--checked .rs-checkbox__box::after {
  content: '';
  position: absolute;
  top: 42%;
  left: 50%;
  width: 0.28rem;
  height: 0.5rem;
  border: solid var(--rs-primary-foreground);
  border-width: 0 2px 2px 0;
  transform: translate(-50%, -50%) rotate(45deg);
}

.rs-checkbox--ssm.rs-checkbox--checked .rs-checkbox__box::after {
  width: 0.2rem;
  height: 0.36rem;
}

.rs-checkbox--sm.rs-checkbox--checked .rs-checkbox__box::after {
  width: 0.24rem;
  height: 0.42rem;
}

.rs-checkbox--indeterminate .rs-checkbox__box::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5rem;
  height: 2px;
  border: 0;
  border-radius: 1px;
  background: var(--rs-primary-foreground);
  transform: translate(-50%, -50%);
}

.rs-checkbox__label {
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.rs-checkbox--ssm .rs-checkbox__label,
.rs-checkbox--sm .rs-checkbox__label {
  font-size: var(--rs-font-size-xs);
}

@media (prefers-reduced-motion: reduce) {
  .rs-checkbox__box {
    transition: none;
  }
}

@media (forced-colors: active) {
  .rs-checkbox__box {
    border-color: ButtonText;
    background: Field;
    forced-color-adjust: none;
  }

  .rs-checkbox--checked .rs-checkbox__box,
  .rs-checkbox--indeterminate .rs-checkbox__box {
    border-color: Highlight;
    background: Highlight;
  }

  .rs-checkbox--checked .rs-checkbox__box::after {
    border-color: HighlightText;
  }

  .rs-checkbox--indeterminate .rs-checkbox__box::after {
    background: HighlightText;
  }
}
</style>
