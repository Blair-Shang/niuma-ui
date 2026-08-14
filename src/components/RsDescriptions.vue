<script setup lang="ts">
import { computed, provide } from 'vue'
import type { RsRadius } from '../theme/types'
import {
  RS_DESCRIPTIONS_KEY,
  type RsDescriptionsItem,
  type RsDescriptionsLabelPlacement,
  type RsDescriptionsSize,
} from './descriptions-utils'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'
import { useResolvedRsComponentSize } from './resolve-size'

const props = withDefaults(
  defineProps<{
    title?: string
    items?: RsDescriptionsItem[]
    columns?: number
    labelPlacement?: RsDescriptionsLabelPlacement
    bordered?: boolean
    /** 未传时优先 Form / RsConfigProvider.controlSize，再回退 md */
    size?: RsDescriptionsSize
    radius?: RsRadius
  }>(),
  {
    items: () => [],
    columns: 3,
    labelPlacement: 'left',
    bordered: true,
  },
)

const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'md')

provide(RS_DESCRIPTIONS_KEY, {
  get labelPlacement() {
    return props.labelPlacement
  },
  get bordered() {
    return props.bordered
  },
  get size() {
    return resolvedSize.value
  },
  get columns() {
    return props.columns
  },
})

const rootClass = computed(() => [
  'rs-descriptions',
  `rs-descriptions--${resolvedSize.value}`,
  `rs-descriptions--${props.labelPlacement}`,
  { 'rs-descriptions--bordered': props.bordered },
])

const gridStyle = computed(() => ({
  '--rs-descriptions-columns': String(props.columns),
  '--rs-descriptions-radius-local': rsRadiusCss(resolvedRadius.value),
}))
</script>

<template>
  <div :class="rootClass">
    <div v-if="title || $slots.title" class="rs-descriptions__header">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="rs-descriptions__body" :style="gridStyle">
      <slot>
        <div
          v-for="(item, index) in items"
          :key="item.key ?? index"
          class="rs-descriptions__item"
          :style="{ gridColumn: `span ${Math.min(item.span ?? 1, columns)}` }"
        >
          <div class="rs-descriptions__label">{{ item.label }}</div>
          <div class="rs-descriptions__value">
            <slot :name="`item-${item.key ?? index}`">
              {{ item.value ?? '—' }}
            </slot>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<style>
.rs-descriptions {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
  color: var(--rs-text);
}

.rs-descriptions__header {
  font-size: var(--rs-font-size-base);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
}

.rs-descriptions__body {
  display: grid;
  grid-template-columns: repeat(var(--rs-descriptions-columns, 3), minmax(0, 1fr));
  gap: 0;
}

.rs-descriptions--ssm .rs-descriptions__label,
.rs-descriptions--ssm .rs-descriptions__value {
  font-size: var(--rs-font-size-xs);
  padding: var(--rs-space-xs) var(--rs-space-sm);
}

.rs-descriptions--sm .rs-descriptions__label,
.rs-descriptions--sm .rs-descriptions__value {
  font-size: var(--rs-font-size-xs);
  padding: var(--rs-space-sm) var(--rs-space-md);
}

.rs-descriptions--md .rs-descriptions__label,
.rs-descriptions--md .rs-descriptions__value {
  font-size: var(--rs-font-size-sm);
  padding: var(--rs-space-md) var(--rs-space-lg);
}

.rs-descriptions--lg .rs-descriptions__label,
.rs-descriptions--lg .rs-descriptions__value {
  font-size: var(--rs-font-size-base);
  padding: var(--rs-space-lg) var(--rs-space-xl);
}

.rs-descriptions__item {
  display: grid;
  min-width: 0;
}

/* 固定标签列宽，多列时左右项标签竖向对齐（百分比会随列宽漂移） */
.rs-descriptions--left .rs-descriptions__item {
  grid-template-columns: var(--rs-descriptions-label-width, 7.5rem) minmax(0, 1fr);
}

.rs-descriptions--top .rs-descriptions__item {
  grid-template-columns: 1fr;
}

.rs-descriptions__label {
  color: var(--rs-descriptions-label-fg, var(--rs-muted));
  font-weight: var(--rs-font-weight-medium);
  word-break: break-word;
}

.rs-descriptions__value {
  color: var(--rs-descriptions-value-fg, var(--rs-text));
  word-break: break-word;
}

/*
 * 表格外框：四边完整描边 + 圆角；单元格右边/下边内部分隔。
 * 用 -1px 外边距压到外框下，避免双边框加粗，并保证圆角弧不被裁断。
 */
.rs-descriptions--bordered .rs-descriptions__body {
  border: 1px solid var(--rs-descriptions-border, var(--rs-border));
  border-radius: var(
    --rs-descriptions-radius-local,
    var(--rs-descriptions-radius, var(--rs-radius))
  );
  overflow: hidden;
  background: var(--rs-surface, transparent);
}

.rs-descriptions--bordered .rs-descriptions__item {
  border-block-end: 1px solid var(--rs-descriptions-border, var(--rs-border));
  border-inline-end: 1px solid var(--rs-descriptions-border, var(--rs-border));
  margin-block-end: -1px;
  margin-inline-end: -1px;
}

.rs-descriptions--bordered .rs-descriptions__label {
  background: var(--rs-descriptions-label-bg);
}

/* 左标签：标签/值之间竖线，形成表格单元格感 */
.rs-descriptions--bordered.rs-descriptions--left .rs-descriptions__label {
  border-inline-end: 1px solid var(--rs-descriptions-border, var(--rs-border));
}
</style>
