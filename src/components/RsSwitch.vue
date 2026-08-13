<script setup lang="ts">
import { computed, useId } from 'vue'
import type { RsComponentSize } from '../theme/types'
import { SwitchRoot, SwitchThumb } from './reka'
import { useResolvedRsComponentSize } from './resolve-size'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    size?: RsComponentSize
    /** 无障碍名称；有默认插槽文案时可省略 */
    ariaLabel?: string
    id?: string
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  change: [value: boolean]
}>()

const autoId = useId()
const inputId = computed(() => props.id || autoId)
const resolvedSize = useResolvedRsComponentSize(() => props.size)

const rootClass = computed(() => [
  'rs-switch',
  `rs-switch--${resolvedSize.value}`,
  {
    'rs-switch--checked': model.value,
    'rs-switch--disabled': props.disabled,
  },
])

function onUpdate(value: boolean): void {
  model.value = value
  emit('change', value)
}
</script>

<template>
  <div :class="rootClass">
    <SwitchRoot
      :id="inputId"
      class="rs-switch__root"
      :model-value="model"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @update:model-value="onUpdate"
    >
      <SwitchThumb class="rs-switch__thumb" />
    </SwitchRoot>
    <label v-if="$slots.default" class="rs-switch__label" :for="inputId">
      <slot />
    </label>
  </div>
</template>

<style>
/**
 * 轨道高度 = control-height * 2/3（对齐 Ant：Input SM 24 / Switch SM 16）。
 * 宽高、内边距、滑块均由 token / calc 推导，不写死档位 px。
 * 外层 min-height = control-height，保证与同排输入垂直居中对齐。
 */
.rs-switch {
  --rs-switch-pad: calc(var(--rs-switch-track-h) * 0.12);
  --rs-switch-track-w: calc(var(--rs-switch-track-h) * 1.75);
  --rs-switch-thumb: calc(var(--rs-switch-track-h) - var(--rs-switch-pad) * 2 - 2px);
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  vertical-align: middle;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  color: var(--rs-text);
}

.rs-switch--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.rs-switch__root {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  box-sizing: border-box;
  width: var(--rs-switch-track-w);
  height: var(--rs-switch-track-h);
  padding: var(--rs-switch-pad);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-full);
  background: var(--rs-surface-hover);
  outline: none;
  cursor: pointer;
  transition:
    background-color var(--rs-transition-fast),
    border-color var(--rs-transition-fast);
}

.rs-switch--disabled .rs-switch__root {
  cursor: not-allowed;
}

.rs-switch:hover:not(.rs-switch--disabled):not(.rs-switch--checked) .rs-switch__root {
  border-color: var(--rs-primary);
}

.rs-switch__root:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-switch--checked .rs-switch__root {
  background: var(--rs-primary);
  border-color: var(--rs-primary);
}

.rs-switch--ssm {
  --rs-switch-track-h: calc(var(--rs-control-height-ssm) * 2 / 3);
  min-height: var(--rs-control-height-ssm);
}

.rs-switch--sm {
  --rs-switch-track-h: calc(var(--rs-control-height-sm) * 2 / 3);
  min-height: var(--rs-control-height-sm);
}

.rs-switch--md {
  --rs-switch-track-h: calc(var(--rs-control-height-md) * 2 / 3);
  min-height: var(--rs-control-height-md);
}

.rs-switch--lg {
  --rs-switch-track-h: calc(var(--rs-control-height-lg) * 2 / 3);
  min-height: var(--rs-control-height-lg);
}

.rs-switch__thumb {
  position: absolute;
  top: 50%;
  left: var(--rs-switch-pad);
  display: block;
  width: var(--rs-switch-thumb);
  height: var(--rs-switch-thumb);
  border-radius: var(--rs-radius-full);
  background: var(--rs-surface);
  box-shadow: var(--rs-shadow-sm);
  transform: translateY(-50%);
  transition:
    left var(--rs-transition-fast),
    right var(--rs-transition-fast);
}

.rs-switch--checked .rs-switch__thumb {
  left: auto;
  right: var(--rs-switch-pad);
}

.rs-switch__label {
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  cursor: pointer;
}

.rs-switch--disabled .rs-switch__label {
  cursor: not-allowed;
}

.rs-switch--ssm .rs-switch__label,
.rs-switch--sm .rs-switch__label {
  font-size: var(--rs-font-size-xs);
}
</style>
