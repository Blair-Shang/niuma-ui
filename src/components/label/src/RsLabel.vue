<script setup lang="ts">
withDefaults(
  defineProps<{
    forId?: string
    required?: boolean
    hint?: string
    disabled?: boolean
    /** 文案单行不换行（表单左侧标签等场景） */
    nowrap?: boolean
  }>(),
  {
    required: false,
    disabled: false,
    nowrap: false,
  },
)
</script>

<template>
  <label
    class="rs-label"
    :class="{
      'rs-label--disabled': disabled,
      'rs-label--nowrap': nowrap,
    }"
    :for="forId"
  >
    <span class="rs-label__text">
      <slot />
      <span v-if="required" class="rs-label__required" aria-hidden="true">*</span>
    </span>
    <span v-if="hint" class="rs-label__hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
/*
 * 消费全局 token（styles.css）：
 * --rs-label-font-size / --rs-label-font-weight / --rs-label-color / --rs-label-line-height
 * 与 .rs-field__label 共用；父级覆盖即可，无需 :deep。
 */
.rs-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: var(--rs-label-font-size);
  line-height: var(--rs-label-line-height);
  color: var(--rs-label-color);
}
.rs-label--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rs-label--nowrap .rs-label__text {
  white-space: nowrap;
}
.rs-label__text {
  font-weight: var(--rs-label-font-weight);
}
.rs-label__required {
  margin-left: 0.125rem;
  color: var(--rs-danger);
}
.rs-label__hint {
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  color: var(--rs-muted);
}
</style>
