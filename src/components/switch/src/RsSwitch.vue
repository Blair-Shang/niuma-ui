<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'
import type { RsComponentSize } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext } from '../../form/src/form-utils'
import {
  resolveRsSwitchChecked,
  resolveRsSwitchNext,
  type RsSwitchValue,
} from './switch-utils'

export type { RsSwitchValue }

/**
 * RsSwitch 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsSwitch>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsSwitchExpose {
  focus: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsSwitchInstance = RsSwitchExpose & { $el: HTMLElement }

defineOptions({ name: 'RsSwitch' })

const model = defineModel<RsSwitchValue>({ default: false })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    size?: RsComponentSize
    /** 无障碍名称；有默认插槽文案时可省略 */
    ariaLabel?: string
    id?: string
    /** 原生 name，供表单提交 */
    name?: string
    /** 打开时写入 v-model 的值，默认 true */
    checkedValue?: RsSwitchValue
    /** 关闭时写入 v-model 的值，默认 false */
    uncheckedValue?: RsSwitchValue
  }>(),
  {
    disabled: false,
    checkedValue: true,
    uncheckedValue: false,
  },
)

const emit = defineEmits<{
  change: [value: RsSwitchValue]
}>()

const formContext = useRsFormContext()
const autoId = useId()
const inputId = computed(() => props.id || autoId)
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const isChecked = computed(() => resolveRsSwitchChecked(model.value, props.checkedValue))

const rootClass = computed(() => [
  'rs-switch',
  `rs-switch--${resolvedSize.value}`,
  {
    'rs-switch--checked': isChecked.value,
    'rs-switch--disabled': resolvedDisabled.value,
  },
])

function writeChecked(checked: boolean): void {
  const next = resolveRsSwitchNext(checked, props.checkedValue, props.uncheckedValue)
  if (Object.is(model.value, next)) return
  model.value = next
  emit('change', next)
}

function onNativeChange(event: Event): void {
  if (resolvedDisabled.value) return
  writeChecked((event.target as HTMLInputElement).checked)
}

function onTrackClick(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  if (resolvedDisabled.value) return
  writeChecked(!isChecked.value)
}

defineExpose<RsSwitchExpose>({
  focus: () => {
    inputRef.value?.focus()
  },
})
</script>

<template>
  <label :class="rootClass">
    <input
      :id="inputId"
      ref="inputRef"
      class="rs-switch__input"
      type="checkbox"
      role="switch"
      :name="name"
      :checked="isChecked"
      :disabled="resolvedDisabled"
      :aria-checked="isChecked ? 'true' : 'false'"
      :aria-label="ariaLabel"
      @change="onNativeChange"
      @click.stop
    >
    <span class="rs-switch__root" aria-hidden="true" @click="onTrackClick">
      <span class="rs-switch__thumb" />
    </span>
    <span v-if="$slots.default" class="rs-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped>
/**
 * 轨道高度 = control-height * 2/3（与 Input SM 24 / Switch SM 16 同比例）。
 * 宽高、内边距、滑块均由 token / calc 推导，不写死档位 px。
 * 外层 min-height = control-height，保证与同排输入垂直居中对齐。
 */
.rs-switch {
  --rs-switch-pad: calc(var(--rs-switch-track-h) * 0.12);
  --rs-switch-track-w: calc(var(--rs-switch-track-h) * 1.75);
  --rs-switch-thumb: calc(var(--rs-switch-track-h) - var(--rs-switch-pad) * 2 - 2px);
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

.rs-switch--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.rs-switch__input {
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

.rs-switch__input:focus-visible + .rs-switch__root {
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
  inset-inline-start: var(--rs-switch-pad);
  display: block;
  width: var(--rs-switch-thumb);
  height: var(--rs-switch-thumb);
  border-radius: var(--rs-radius-full);
  background: var(--rs-surface);
  box-shadow: var(--rs-shadow-sm);
  transform: translateY(-50%);
  transition: inset-inline var(--rs-transition-fast);
}

.rs-switch--checked .rs-switch__thumb {
  inset-inline-start: auto;
  inset-inline-end: var(--rs-switch-pad);
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

@media (prefers-reduced-motion: reduce) {
  .rs-switch__root,
  .rs-switch__thumb {
    transition: none;
  }
}
</style>
