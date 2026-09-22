<script setup lang="ts">
import { computed, provide, useId, useSlots } from 'vue'
import type { RsRadius } from '../../../theme/types'
import { useRsI18n } from '../../../composables/useRsI18n'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import {
  RS_DESCRIPTIONS_KEY,
  clampRsDescriptionsSpan,
  resolveRsDescriptionsColumns,
  resolveRsDescriptionsLabelAlign,
  resolveRsDescriptionsLabelWidth,
  resolveRsDescriptionsValue,
  type RsDescriptionsItem,
  type RsDescriptionsLabelAlign,
  type RsDescriptionsLabelPlacement,
  type RsDescriptionsSize,
} from './descriptions-utils'

defineOptions({ name: 'RsDescriptions' })

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
    /** 标签后追加本地化冒号。默认关闭，避免改变旧版式。 */
    colon?: boolean
    /** 左标签列宽。数字按 px，字符串按 CSS 长度。 */
    labelWidth?: number | string
    /** 标签在单元格内的对齐。start / end 跟书写方向。 */
    labelAlign?: RsDescriptionsLabelAlign
    /** 覆盖 null / undefined 的占位。未传走 descriptions.empty（默认 —）。空字符串隐藏占位。 */
    emptyText?: string
    id?: string
    /** 覆盖描述列表的可访问名称。未传且有标题时用标题。 */
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    columns: 3,
    labelPlacement: 'left',
    bordered: true,
    colon: false,
  },
)

const slots = useSlots()
const { t } = useRsI18n()
const titleId = useId()

const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'md')
const resolvedColumns = computed(() => resolveRsDescriptionsColumns(props.columns))
const resolvedAlign = computed(() => resolveRsDescriptionsLabelAlign(props.labelAlign))
const resolvedLabelWidth = computed(() => resolveRsDescriptionsLabelWidth(props.labelWidth))
const resolvedEmpty = computed(() => props.emptyText ?? t('descriptions.empty'))
const colonMark = computed(() => t('label.colon'))
const showTitle = computed(() => Boolean(props.title) || Boolean(slots.title))

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
    return resolvedColumns.value
  },
  get colon() {
    return props.colon
  },
  get colonMark() {
    return colonMark.value
  },
})

const rootClass = computed(() => [
  'rs-descriptions',
  `rs-descriptions--${resolvedSize.value}`,
  `rs-descriptions--${props.labelPlacement}`,
  `rs-descriptions--align-${resolvedAlign.value}`,
  {
    'rs-descriptions--bordered': props.bordered,
    'rs-descriptions--colon': props.colon,
  },
])

const gridStyle = computed(() => {
  const style: Record<string, string> = {
    '--rs-descriptions-columns': String(resolvedColumns.value),
    '--rs-descriptions-radius-local': rsRadiusCss(resolvedRadius.value),
  }
  if (resolvedLabelWidth.value) {
    style['--rs-descriptions-label-width'] = resolvedLabelWidth.value
  }
  return style
})

const rows = computed(() => {
  const columns = resolvedColumns.value
  const empty = resolvedEmpty.value
  return props.items.map((item, index) => {
    const key = item.key ?? index
    return {
      key,
      label: item.label,
      text: resolveRsDescriptionsValue(item.value, empty),
      spanStyle: { gridColumn: `span ${clampRsDescriptionsSpan(item.span, columns)}` },
      valueSlot: `item-${key}`,
      labelSlot: `label-${key}`,
    }
  })
})
</script>

<template>
  <div :id="id" :class="rootClass">
    <div v-if="showTitle || $slots.extra" class="rs-descriptions__header">
      <div v-if="showTitle" :id="titleId" class="rs-descriptions__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.extra" class="rs-descriptions__extra">
        <slot name="extra" />
      </div>
    </div>
    <dl
      class="rs-descriptions__body"
      :style="gridStyle"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="ariaLabel || !showTitle ? undefined : titleId"
    >
      <slot>
        <div
          v-for="row in rows"
          :key="row.key"
          class="rs-descriptions__item"
          :style="row.spanStyle"
        >
          <dt class="rs-descriptions__label">
            <slot :name="row.labelSlot">{{ row.label }}</slot>
            <span v-if="colon" class="rs-descriptions__colon" aria-hidden="true">{{ colonMark }}</span>
          </dt>
          <dd class="rs-descriptions__value">
            <slot :name="row.valueSlot">{{ row.text }}</slot>
          </dd>
        </div>
      </slot>
    </dl>
  </div>
</template>

<style>
.rs-descriptions {
  display: flex;
  flex-direction: column;
  gap: var(--rs-descriptions-gap, var(--rs-space-sm));
  color: var(--rs-descriptions-value-fg, var(--rs-text-primary));
}

.rs-descriptions__header {
  display: flex;
  align-items: center;
  gap: var(--rs-space-md);
}

.rs-descriptions__title {
  flex: 1;
  min-width: 0;
  color: var(--rs-descriptions-title, var(--rs-text-primary));
  font-size: var(--rs-font-size-base);
  font-weight: var(--rs-font-weight-semibold);
  line-height: var(--rs-line-height-tight);
}

.rs-descriptions__extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
  margin-inline-start: auto;
}

.rs-descriptions__body {
  display: grid;
  grid-template-columns: repeat(var(--rs-descriptions-columns, 3), minmax(0, 1fr));
  gap: 0;
  margin: 0;
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

.rs-descriptions--left .rs-descriptions__item {
  grid-template-columns: var(--rs-descriptions-label-width, 7.5rem) minmax(0, 1fr);
}

.rs-descriptions--top .rs-descriptions__item {
  grid-template-columns: minmax(0, 1fr);
}

.rs-descriptions__label,
.rs-descriptions__value {
  margin: 0;
  min-width: 0;
}

.rs-descriptions__label {
  color: var(--rs-descriptions-label-fg, var(--rs-text-secondary));
  font-weight: var(--rs-font-weight-medium);
  text-align: start;
  word-break: break-word;
}

.rs-descriptions--align-center .rs-descriptions__label {
  text-align: center;
}

.rs-descriptions--align-end .rs-descriptions__label {
  text-align: end;
}

.rs-descriptions__colon {
  padding-inline-start: 0.12em;
}

.rs-descriptions__value {
  color: var(--rs-descriptions-value-fg, var(--rs-text-primary));
  word-break: break-word;
}

/*
 * 表格外框：四边完整描边 + 圆角；单元格行末 / 块末内部分隔。
 * -1px 外边距压到外框下，避免双边框加粗。overflow 只裁圆角，单元格有内边距。
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

.rs-descriptions--bordered.rs-descriptions--left .rs-descriptions__label {
  border-inline-end: 1px solid var(--rs-descriptions-border, var(--rs-border));
}
</style>
