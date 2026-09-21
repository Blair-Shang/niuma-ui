<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { useRsFormContext } from '../../form/src/form-utils'
import { resolveRsLabelFor, resolveRsLabelHintId, showRsLabelOptional } from './label-utils'

defineOptions({ name: 'RsLabel' })

const props = withDefaults(
  defineProps<{
    /** 关联控件 id。国际用法也可写 htmlFor / for。 */
    forId?: string
    /** forId 别名（React / 国际文档常见）。 */
    htmlFor?: string
    /** 原生 HTML for。forId / htmlFor 的别名。 */
    for?: string
    /** 标签自身 id，供 aria-labelledby。 */
    id?: string
    required?: boolean
    /** 非必填标记。与 required 同时传时只显示必填。 */
    optional?: boolean
    hint?: string
    /** hint 节点 id。未传且有说明时自动生成。 */
    hintId?: string
    disabled?: boolean
    /** 文案单行不换行（表单左侧标签等场景） */
    nowrap?: boolean
    /** 在文案后追加本地化冒号。默认关闭，避免改变旧版式。 */
    colon?: boolean
  }>(),
  {
    required: false,
    optional: false,
    disabled: false,
    nowrap: false,
    colon: false,
  },
)

const slots = useSlots()
const { t } = useRsI18n()
const formContext = useRsFormContext()
const autoHintId = useId()

const controlId = computed(() => resolveRsLabelFor(props.htmlFor, props.forId, props.for))
const resolvedDisabled = computed(() => props.disabled || Boolean(formContext?.disabled.value))
const hasHint = computed(() => Boolean(slots.hint || props.hint))
const resolvedHintId = computed(() =>
  resolveRsLabelHintId(props.hintId, autoHintId, hasHint.value),
)
const showOptional = computed(() => showRsLabelOptional(props.required, props.optional))

const rootClass = computed(() => [
  'rs-label',
  {
    'rs-label--disabled': resolvedDisabled.value,
    'rs-label--nowrap': props.nowrap,
  },
])
</script>

<template>
  <label
    :id="id"
    :class="rootClass"
    :for="controlId"
    :aria-disabled="resolvedDisabled ? 'true' : undefined"
  >
    <span class="rs-label__text">
      <slot />
      <span v-if="required" class="rs-label__required" aria-hidden="true">*</span>
      <span v-if="required" class="rs-label__sr">{{ t('label.required') }}</span>
      <span v-if="showOptional" class="rs-label__optional">{{ t('label.optional') }}</span>
      <span v-if="colon" class="rs-label__colon" aria-hidden="true">{{ t('label.colon') }}</span>
    </span>
    <span v-if="hasHint" :id="resolvedHintId" class="rs-label__hint">
      <slot name="hint">{{ hint }}</slot>
    </span>
  </label>
</template>

<style scoped>
/*
 * 消费全局 token（styles.css）：
 * --rs-label-font-size / font-weight / color / line-height / gap / mark-gap / disabled-opacity
 * 与 .rs-field__label 共用；父级覆盖即可，无需 :deep。
 */
.rs-label {
  display: flex;
  flex-direction: column;
  gap: var(--rs-label-gap);
  font-size: var(--rs-label-font-size);
  line-height: var(--rs-label-line-height);
  color: var(--rs-label-color);
}

.rs-label--disabled {
  opacity: var(--rs-label-disabled-opacity);
  cursor: not-allowed;
}

.rs-label--nowrap .rs-label__text {
  white-space: nowrap;
}

.rs-label__text {
  font-weight: var(--rs-label-font-weight);
}

.rs-label__required {
  margin-inline-start: var(--rs-label-mark-gap);
  color: var(--rs-danger);
}

.rs-label__optional {
  margin-inline-start: var(--rs-label-mark-gap);
  font-weight: var(--rs-font-weight-regular);
  color: var(--rs-text-secondary);
}

.rs-label__colon {
  margin-inline-start: var(--rs-label-mark-gap);
}

.rs-label__hint {
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  color: var(--rs-text-secondary);
}

.rs-label__sr {
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
</style>
