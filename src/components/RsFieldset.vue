<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { RsFontWeight } from '../theme/types'
import { useRsI18n } from '../composables/useRsI18n'
import { useRsFormContext } from './form-utils'
import RsTooltip from './RsTooltip.vue'
import {
  resolveFieldsetTitleSize,
  resolveFieldsetTitleWeight,
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
    borderStyle: 'solid',
    borderTone: 'default',
    titleWeight: 'semibold',
    titleTone: 'default',
    titleSize: 'sm',
  },
)

const slots = useSlots()
const { t } = useRsI18n()
const form = useRsFormContext()
const isDisabled = computed(() => Boolean(props.disabled || form?.disabled.value))
const resolvedTooltip = computed(() => (props.tooltip || props.description || '').trim())
const hasTooltip = computed(() => Boolean(resolvedTooltip.value || slots.tooltip))
const hasLegend = computed(() => Boolean(props.legend || slots.legend || slots.extra || hasTooltip.value))
const helpLabel = computed(() => t('fieldset.help', 'Group help'))
const rootStyle = computed(() => ({
  '--rs-fieldset-title-size': resolveFieldsetTitleSize(props.titleSize),
  '--rs-fieldset-title-weight': resolveFieldsetTitleWeight(props.titleWeight),
}))
</script>

<template>
  <fieldset
    class="rs-fieldset"
    :class="[
      `rs-fieldset--${size}`,
      `rs-fieldset--${borderStyle}`,
      `rs-fieldset--tone-${borderTone}`,
      `rs-fieldset--title-${titleTone}`,
      { 'rs-fieldset--disabled': isDisabled },
    ]"
    :style="rootStyle"
    :name="name"
    :disabled="isDisabled"
  >
    <legend v-if="hasLegend" class="rs-fieldset__legend">
      <span class="rs-fieldset__heading">
        <slot name="legend">
          <span class="rs-fieldset__title">{{ legend }}</span>
        </slot>
        <RsTooltip
          v-if="hasTooltip"
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
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.rs-fieldset {
  display: flex;
  flex-direction: column;
  gap: var(--rs-fieldset-gap, var(--rs-space-md));
  box-sizing: border-box;
  min-width: 0;
  min-inline-size: 0;
  margin: 0;
  padding: var(--rs-space-md) var(--rs-space-lg) var(--rs-space-lg);
  border-width: 1px;
  border-style: solid;
  border-color: var(--rs-fieldset-border, var(--rs-border));
  border-radius: var(--rs-fieldset-radius, var(--rs-radius-sm));
  background: transparent;
}

.rs-fieldset--sm {
  gap: var(--rs-space-sm);
  padding: var(--rs-space-sm) var(--rs-space-md) var(--rs-space-md);
}

.rs-fieldset--dashed {
  border-style: dashed;
}

.rs-fieldset--dotted {
  border-style: dotted;
}

.rs-fieldset--tone-subtle {
  border-color: var(--rs-fieldset-border, var(--rs-border-subtle));
}

.rs-fieldset--tone-faded {
  border-color: color-mix(
    in srgb,
    var(--rs-fieldset-border, var(--rs-border)) 42%,
    transparent
  );
}

.rs-fieldset__legend {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  float: none;
  padding: 0 var(--rs-space-xs);
  margin: 0;
  font-size: var(--rs-fieldset-title-size, var(--rs-font-size-sm));
  font-weight: var(--rs-fieldset-title-weight, var(--rs-font-weight-semibold));
  line-height: var(--rs-line-height-tight);
  color: var(--rs-text);
  background: var(--rs-fieldset-legend-bg, var(--rs-surface));
}

.rs-fieldset__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  min-width: 0;
}

.rs-fieldset__title {
  min-width: 0;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

.rs-fieldset--title-strong .rs-fieldset__legend {
  color: var(--rs-text);
}

.rs-fieldset--title-default .rs-fieldset__legend {
  color: var(--rs-text);
}

.rs-fieldset--title-muted .rs-fieldset__legend {
  color: var(--rs-muted);
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
  min-width: 0;
  gap: inherit;
}

.rs-fieldset:disabled,
.rs-fieldset--disabled {
  border-color: var(--rs-border-subtle);
}

.rs-fieldset:disabled .rs-fieldset__legend,
.rs-fieldset--disabled .rs-fieldset__legend {
  color: var(--rs-muted);
}
</style>
