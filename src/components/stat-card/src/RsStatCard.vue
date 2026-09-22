<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  formatRsStatValue,
  hasRsStatDelta,
  resolveRsStatAccent,
  resolveRsStatSize,
  resolveRsStatTrend,
  resolveRsStatTrendTone,
  rsStatTrendMark,
  rsStatTrendMessageKey,
  type RsStatAccent,
  type RsStatFormat,
  type RsStatSize,
  type RsStatTrend,
  type RsStatTrendTone,
} from './stat-card-utils'

defineOptions({ name: 'RsStatCard' })

export type { RsStatAccent, RsStatFormat, RsStatSize, RsStatTrend, RsStatTrendTone }

const props = withDefaults(
  defineProps<{
    /** 指标名。不是标题层级，避免一排 KPI 污染大纲。 */
    label: string
    value?: string | number
    description?: string
    accent?: RsStatAccent
    loading?: boolean
    /** 数值前的单位或符号。货币符号优先用 format.style=currency，由 locale 决定位置。 */
    prefix?: string
    /** 数值后的单位，例如 ms、req/s。 */
    suffix?: string
    /** 涨跌方向。不表示好坏，好坏用 trendTone。 */
    trend?: RsStatTrend
    /** 变化量。字符串原样显示；数字跟随 format / precision。 */
    delta?: string | number
    trendTone?: RsStatTrendTone
    /**
     * 仅对有限数字生效。默认 false，12480 仍显示 12480。
     * true 使用当前 locale 分组；对象传给 Intl.NumberFormat。
     */
    format?: RsStatFormat
    /** 打开定点小数。未传 format 时也会格式化数字。字符串 value 仍原样。 */
    precision?: number
    /** 疏密。不是控件 size，没有 ssm。 */
    size?: RsStatSize
    id?: string
    /** 需要把整张卡标成命名区域时再传。默认不设，避免一排 KPI 变成一排 landmark。 */
    ariaLabel?: string
  }>(),
  {
    accent: 'primary',
    loading: false,
    trendTone: 'neutral',
    format: false,
    size: 'md',
  },
)

const slots = useSlots()
const { t, locale } = useRsI18n()

const accentName = computed(() => resolveRsStatAccent(props.accent))
const sizeName = computed(() => resolveRsStatSize(props.size))
const trendKind = computed(() => resolveRsStatTrend(props.trend))
const rootClass = computed(() => [
  'rs-stat-card',
  `rs-stat-card--${accentName.value}`,
  `rs-stat-card--${sizeName.value}`,
])
const trendClass = computed(
  () => `rs-stat-card__trend--${resolveRsStatTrendTone(props.trendTone)}`,
)
const showTrend = computed(
  () => Boolean(slots.trend) || trendKind.value != null || hasRsStatDelta(props.delta),
)
const displayValue = computed(() =>
  formatRsStatValue(props.value, {
    format: props.format,
    precision: props.precision,
    locale: locale.value,
  }),
)
const displayDelta = computed(() =>
  formatRsStatValue(props.delta, {
    format: props.format,
    precision: props.precision,
    locale: locale.value,
  }),
)
const trendMark = computed(() => (trendKind.value ? rsStatTrendMark(trendKind.value) : ''))
const trendText = computed(() =>
  trendKind.value ? t(rsStatTrendMessageKey(trendKind.value)) : '',
)
</script>

<template>
  <section
    :id="id"
    :class="rootClass"
    :aria-busy="loading ? true : undefined"
    :aria-label="ariaLabel"
  >
    <div class="rs-stat-card__accent" aria-hidden="true" />
    <div class="rs-stat-card__body">
      <div class="rs-stat-card__top">
        <p class="rs-stat-card__label">{{ label }}</p>
        <div v-if="$slots.icon" class="rs-stat-card__icon" aria-hidden="true">
          <slot name="icon" />
        </div>
      </div>
      <div v-if="loading" class="rs-stat-card__skeleton">
        <span class="rs-stat-card__sr">{{ t('statCard.loading') }}</span>
      </div>
      <div v-else class="rs-stat-card__value">
        <span v-if="prefix || $slots.prefix" class="rs-stat-card__affix">
          <slot name="prefix">{{ prefix }}</slot>
        </span>
        <slot name="value">{{ displayValue }}</slot>
        <span v-if="suffix || $slots.suffix" class="rs-stat-card__affix">
          <slot name="suffix">{{ suffix }}</slot>
        </span>
      </div>
      <p v-if="!loading && showTrend" class="rs-stat-card__trend" :class="trendClass">
        <slot name="trend">
          <span v-if="trendMark" class="rs-stat-card__mark" aria-hidden="true">{{ trendMark }}</span>
          <span v-if="trendText" class="rs-stat-card__sr">{{ trendText }}</span>
          <span v-if="displayDelta" class="rs-stat-card__delta">{{ displayDelta }}</span>
        </slot>
      </p>
      <p v-if="description || $slots.description" class="rs-stat-card__description">
        <slot name="description">{{ description }}</slot>
      </p>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.rs-stat-card {
  --rs-stat-accent: var(--rs-primary);
  position: relative;
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  overflow: hidden;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  box-shadow: var(--rs-shadow-sm);
  color: var(--rs-text-primary);
}

.rs-stat-card--success {
  --rs-stat-accent: var(--rs-success);
}
.rs-stat-card--warning {
  --rs-stat-accent: var(--rs-warning);
}
.rs-stat-card--danger {
  --rs-stat-accent: var(--rs-danger);
}
.rs-stat-card--info {
  --rs-stat-accent: var(--rs-info);
}

.rs-stat-card__accent {
  flex: none;
  block-size: calc(var(--rs-space-xs) * 0.75);
  background: var(--rs-stat-accent);
}

.rs-stat-card__body {
  padding: var(--rs-space-lg);
}

.rs-stat-card--sm .rs-stat-card__body {
  padding: var(--rs-space-md);
}

.rs-stat-card--lg .rs-stat-card__body {
  padding: var(--rs-space-xl);
}

.rs-stat-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--rs-space-sm);
}

.rs-stat-card__label {
  margin: 0;
  min-inline-size: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  line-height: var(--rs-line-height-normal);
}

.rs-stat-card__icon {
  display: inline-flex;
  flex: none;
  color: var(--rs-stat-accent);
}

.rs-stat-card__value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--rs-space-xs);
  margin-block-start: var(--rs-space-sm);
  color: var(--rs-text-primary);
  font-size: var(--rs-font-size-3xl);
  font-weight: var(--rs-font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: var(--rs-line-height-tight);
  overflow-wrap: anywhere;
}

.rs-stat-card--sm .rs-stat-card__value {
  font-size: var(--rs-font-size-2xl);
}

.rs-stat-card--lg .rs-stat-card__value {
  font-size: calc(var(--rs-font-size-3xl) + var(--rs-space-xs));
}

.rs-stat-card__affix {
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  line-height: var(--rs-line-height-normal);
  white-space: nowrap;
}

.rs-stat-card__trend {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--rs-space-xs);
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: var(--rs-line-height-normal);
}

.rs-stat-card__trend--primary {
  color: var(--rs-primary);
}
.rs-stat-card__trend--success {
  color: var(--rs-success);
}
.rs-stat-card__trend--warning {
  color: var(--rs-warning);
}
.rs-stat-card__trend--danger {
  color: var(--rs-danger);
}
.rs-stat-card__trend--info {
  color: var(--rs-info);
}

.rs-stat-card__description {
  margin: var(--rs-space-sm) 0 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.rs-stat-card__skeleton {
  position: relative;
  inline-size: calc(var(--rs-space-xl) * 5);
  block-size: var(--rs-font-size-3xl);
  margin-block-start: var(--rs-space-sm);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-hover);
  animation: rs-stat-card-pulse 1.4s ease-in-out infinite;
}

.rs-stat-card--sm .rs-stat-card__skeleton {
  inline-size: calc(var(--rs-space-xl) * 4);
  block-size: var(--rs-font-size-2xl);
}

.rs-stat-card--lg .rs-stat-card__skeleton {
  inline-size: calc(var(--rs-space-xl) * 6);
}

.rs-stat-card__sr {
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

@media (prefers-reduced-motion: reduce) {
  .rs-stat-card__skeleton {
    animation: none;
  }
}

@keyframes rs-stat-card-pulse {
  50% {
    opacity: 0.55;
  }
}
</style>
