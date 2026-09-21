<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
import type { RsFontWeight } from '../../../theme/types'
import { useRsI18n } from '../../../composables/useRsI18n'
import { useRsFormContext } from '../../form/src/form-utils'
import RsTooltip from '../../tooltip/src/RsTooltip.vue'
import {
  resolveFieldsetInvalid,
  resolveFieldsetTitleSize,
  resolveFieldsetTitleWeight,
  resolveFieldsetTooltip,
  type RsFieldsetBorderStyle,
  type RsFieldsetBorderTone,
  type RsFieldsetSize,
  type RsFieldsetTitleSize,
  type RsFieldsetTitleTone,
} from './fieldset-utils'

defineOptions({ name: 'RsFieldset' })

const props = withDefaults(
  defineProps<{
    /** 分组标题，渲染为原生 legend（WHATWG / WCAG 1.3.1 组名） */
    legend?: string
    /**
     * 分组说明。标题旁帮助图标，悬停出 tip（对齐 Ant Form.Item tooltip）。
     * 不进 legend，避免读屏把长文案当组名。
     */
    tooltip?: string
    /**
     * @deprecated 请用 tooltip。仍接受，映射到同一 tip。
     */
    description?: string
    /** 禁用整组原生控件（input / select / textarea / button） */
    disabled?: boolean
    /**
     * 密度：sm 对话框紧凑 / md 设置页默认。
     * @default md
     */
    size?: RsFieldsetSize
    /** 原生 fieldset name */
    name?: string
    /** 关联外部 form id（分组不嵌在 form 内时） */
    form?: string
    /** 根 fieldset id */
    id?: string
    /**
     * 组必填标记。只画星号；真正 required 仍在字段上。
     * 没有 HTML fieldset.required。
     */
    required?: boolean
    /** 组级校验失败（描边走 danger） */
    invalid?: boolean
    /** 组级错误文案；有文案或 #error 时也视为 invalid */
    error?: string
    /** 边框线型 */
    borderStyle?: RsFieldsetBorderStyle
    /** 边框浓度；faded 为虚化 */
    borderTone?: RsFieldsetBorderTone
    /** 标题字重（清晰度） */
    titleWeight?: RsFontWeight
    /** 标题对比（清晰度） */
    titleTone?: RsFieldsetTitleTone
    /** 标题字号 */
    titleSize?: RsFieldsetTitleSize
  }>(),
  {
    disabled: false,
    size: 'md',
    required: false,
    invalid: false,
    borderStyle: 'solid',
    borderTone: 'default',
    titleWeight: 'semibold',
    titleTone: 'default',
    titleSize: 'sm',
  },
)

const slots = useSlots()
const { t } = useRsI18n()
const formContext = useRsFormContext()
const autoErrorId = useId()
const autoHintId = useId()

const isDisabled = computed(() => Boolean(props.disabled || formContext?.disabled.value))
const resolvedTooltip = computed(() => resolveFieldsetTooltip(props.tooltip, props.description))
const hasTooltip = computed(() => Boolean(resolvedTooltip.value || slots.tooltip))
const hasError = computed(() => Boolean(props.error?.trim() || slots.error))
const isInvalid = computed(() =>
  resolveFieldsetInvalid(props.invalid, props.error, Boolean(slots.error)),
)
const hasLegend = computed(() =>
  Boolean(props.legend || slots.legend || slots.extra || hasTooltip.value || props.required),
)
const showDisabledHint = computed(() => isDisabled.value && hasTooltip.value)
const helpLabel = computed(() => t('fieldset.help', 'Group help'))
const errorId = computed(() => (hasError.value ? autoErrorId : undefined))
const hintId = computed(() => (showDisabledHint.value ? autoHintId : undefined))
const describedBy = computed(() => {
  const ids = [errorId.value, hintId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const rootClass = computed(() => [
  'rs-fieldset',
  `rs-fieldset--${props.size}`,
  `rs-fieldset--${props.borderStyle}`,
  `rs-fieldset--tone-${props.borderTone}`,
  `rs-fieldset--title-${props.titleTone}`,
  {
    'rs-fieldset--disabled': isDisabled.value,
    'rs-fieldset--invalid': isInvalid.value,
  },
])
const rootStyle = computed(() => ({
  '--rs-fieldset-title-size': resolveFieldsetTitleSize(props.titleSize),
  '--rs-fieldset-title-weight': resolveFieldsetTitleWeight(props.titleWeight),
}))
</script>

<template>
  <fieldset
    :id="id"
    :class="rootClass"
    :style="rootStyle"
    :name="name"
    :form="form"
    :disabled="isDisabled"
    :aria-invalid="isInvalid ? 'true' : undefined"
    :aria-describedby="describedBy"
  >
    <legend v-if="hasLegend" class="rs-fieldset__legend">
      <span class="rs-fieldset__heading">
        <slot name="legend">
          <span class="rs-fieldset__title">{{ legend }}</span>
        </slot>
        <span v-if="required" class="rs-fieldset__required" aria-hidden="true">*</span>
        <span v-if="required" class="rs-fieldset__sr">{{ t('label.required') }}</span>
        <RsTooltip
          v-if="hasTooltip && !isDisabled"
          icon
          :content="resolvedTooltip"
          :aria-label="helpLabel"
        >
          <template v-if="$slots.tooltip" #content>
            <slot name="tooltip" />
          </template>
        </RsTooltip>
      </span>
      <span v-if="$slots.extra" class="rs-fieldset__extra">
        <slot name="extra" />
      </span>
    </legend>
    <div class="rs-fieldset__body">
      <div v-if="showDisabledHint" :id="hintId" class="rs-fieldset__hint">
        <slot name="tooltip">{{ resolvedTooltip }}</slot>
      </div>
      <slot />
      <p v-if="hasError" :id="errorId" class="rs-fieldset__error" role="alert">
        <slot name="error">{{ error }}</slot>
      </p>
    </div>
  </fieldset>
</template>

<style scoped>
.rs-fieldset {
  --rs-fieldset-line: var(--rs-fieldset-border);
  display: flex;
  flex-direction: column;
  gap: var(--rs-fieldset-gap);
  box-sizing: border-box;
  min-inline-size: 0;
  margin: 0;
  padding-block: var(--rs-space-md) var(--rs-space-lg);
  padding-inline: var(--rs-space-lg);
  border-width: 1px;
  border-style: solid;
  border-color: var(--rs-fieldset-line);
  border-radius: var(--rs-fieldset-radius);
  background: transparent;
}

.rs-fieldset--sm {
  gap: var(--rs-fieldset-gap-sm);
  padding-block: var(--rs-space-sm) var(--rs-space-md);
  padding-inline: var(--rs-space-md);
}

.rs-fieldset--dashed {
  border-style: dashed;
}

.rs-fieldset--dotted {
  border-style: dotted;
}

.rs-fieldset--tone-subtle {
  --rs-fieldset-line: var(--rs-fieldset-border-subtle);
}

.rs-fieldset--tone-faded {
  --rs-fieldset-line: var(--rs-fieldset-border-faded);
}

.rs-fieldset:disabled,
.rs-fieldset--disabled {
  --rs-fieldset-line: var(--rs-fieldset-border-subtle);
}

.rs-fieldset--invalid,
.rs-fieldset--invalid.rs-fieldset--disabled {
  --rs-fieldset-line: var(--rs-fieldset-border-invalid);
}

.rs-fieldset__legend {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  float: none;
  padding-inline: var(--rs-space-xs);
  margin: 0;
  font-size: var(--rs-fieldset-title-size, var(--rs-font-size-sm));
  font-weight: var(--rs-fieldset-title-weight, var(--rs-font-weight-semibold));
  line-height: var(--rs-line-height-tight);
  color: var(--rs-fieldset-title);
  background: var(--rs-fieldset-legend-bg);
}

.rs-fieldset__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  min-inline-size: 0;
}

.rs-fieldset__title {
  min-inline-size: 0;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

.rs-fieldset__required {
  margin-inline-start: var(--rs-label-mark-gap);
  color: var(--rs-danger);
}

.rs-fieldset--title-strong .rs-fieldset__legend {
  color: var(--rs-fieldset-title-strong);
}

.rs-fieldset--title-default .rs-fieldset__legend {
  color: var(--rs-fieldset-title);
}

.rs-fieldset--title-muted .rs-fieldset__legend {
  color: var(--rs-fieldset-title-muted);
}

.rs-fieldset__extra {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  color: var(--rs-muted);
}

.rs-fieldset__body {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  gap: inherit;
}

.rs-fieldset__hint {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-regular);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-fieldset-hint);
}

.rs-fieldset__error {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-fieldset-error);
}

.rs-fieldset:disabled .rs-fieldset__legend,
.rs-fieldset--disabled .rs-fieldset__legend {
  color: var(--rs-muted);
}

.rs-fieldset__sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
