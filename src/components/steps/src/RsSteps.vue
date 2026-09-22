<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import RsIcon from '../../icon/src/RsIcon.vue'
import type {
  RsStepItem,
  RsStepStatus,
  RsStepsItemSlot,
  RsStepsLabelPlacement,
  RsStepsOrientation,
  RsStepsSize,
  RsStepsType,
} from './steps-utils'
import {
  buildStepRenderItems,
  clampStepPercent,
  resolveActiveStepIndex,
  resolveAdjacentStepValue,
  resolveSelectableStepValues,
  resolveStepKeyboardMove,
} from './steps-utils'

defineOptions({ name: 'RsSteps' })

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    items: RsStepItem[]
    orientation?: RsStepsOrientation
    size?: RsStepsSize
    clickable?: boolean
    /** 标题在指示器旁（end）或下方（bottom）。竖排时仍在旁。 */
    labelPlacement?: RsStepsLabelPlacement
    /** default 数字/图标；dot 圆点。 */
    type?: RsStepsType
    /** 覆盖当前步状态（单项 status 仍优先）。 */
    status?: RsStepStatus
    /** 当前步完成百分比 0–100。只影响 default + process 指示器。 */
    percent?: number
    ariaLabel?: string
    id?: string
  }>(),
  {
    orientation: 'horizontal',
    clickable: false,
    labelPlacement: 'end',
    type: 'default',
  },
)

const emit = defineEmits<{
  change: [value: string, item: RsStepItem]
  click: [item: RsStepItem, event: MouseEvent]
}>()

const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const rootRef = ref<HTMLElement | null>(null)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const writingDir = computed(() => resolveDirMode(config?.dir.value ?? 'auto', locale.value))

const activeIndex = computed(() => resolveActiveStepIndex(props.items, model.value))
const rows = computed(() =>
  buildStepRenderItems(props.items, activeIndex.value, props.type, props.status),
)
const selectableValues = computed(() => resolveSelectableStepValues(props.items))
const resolvedPercent = computed(() => clampStepPercent(props.percent))
const navLabel = computed(() => props.ariaLabel || t('steps.label'))
const currentValue = computed(() => props.items[activeIndex.value]?.value)

function statusLabel(status: RsStepStatus): string {
  return t(`steps.${status}`)
}

function slotProps(row: (typeof rows.value)[number]): RsStepsItemSlot {
  return {
    item: row.item,
    index: row.index,
    status: row.status,
    active: row.active,
    disabled: row.disabled,
  }
}

function showPercent(row: (typeof rows.value)[number]): boolean {
  return (
    props.type === 'default' &&
    row.status === 'process' &&
    resolvedPercent.value != null
  )
}

function findTrigger(value: string): HTMLElement | null {
  const root = rootRef.value
  if (!root) return null
  const nodes = root.querySelectorAll<HTMLElement>('[data-rs-step]')
  for (const node of nodes) {
    if (node.dataset.rsStep === value) return node
  }
  return null
}

function goTo(value: string): boolean {
  const item = props.items.find((entry) => entry.value === value)
  if (!item || item.disabled) return false
  if (model.value === value) return true
  model.value = value
  emit('change', value, item)
  return true
}

function next(): string | undefined {
  const value = resolveAdjacentStepValue(selectableValues.value, currentValue.value, 1)
  return value && goTo(value) ? value : undefined
}

function prev(): string | undefined {
  const value = resolveAdjacentStepValue(selectableValues.value, currentValue.value, -1)
  return value && goTo(value) ? value : undefined
}

function focus(value?: string): void {
  const target = value || currentValue.value || selectableValues.value[0]
  if (!target) return
  findTrigger(target)?.focus()
}

function selectStep(item: RsStepItem, event: MouseEvent): void {
  emit('click', item, event)
  if (!props.clickable || item.disabled) return
  goTo(item.value)
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.clickable) return
  const target = event.target
  if (!(target instanceof HTMLElement) || !target.closest('[data-rs-step]')) return
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return
  const move = resolveStepKeyboardMove(event.key, props.orientation, writingDir.value === 'rtl')
  if (move == null) return
  const values = selectableValues.value
  if (values.length === 0) return
  event.preventDefault()
  const focused = target.closest<HTMLElement>('[data-rs-step]')?.dataset.rsStep
  let nextValue: string | undefined
  if (move === 'start') nextValue = values[0]
  else if (move === 'end') nextValue = values[values.length - 1]
  else nextValue = resolveAdjacentStepValue(values, focused, move)
  if (nextValue) focus(nextValue)
}

defineExpose({ next, prev, goTo, focus })
</script>

<template>
  <nav
    :id="id"
    ref="rootRef"
    class="rs-steps"
    :class="[
      `rs-steps--${orientation}`,
      `rs-steps--${resolvedSize}`,
      `rs-steps--label-${labelPlacement}`,
      `rs-steps--${type}`,
      { 'rs-steps--clickable': clickable },
    ]"
    :aria-label="navLabel"
    @keydown="onKeydown"
  >
    <ol class="rs-steps__list">
      <li
        v-for="(row, index) in rows"
        :key="row.item.value"
        class="rs-steps__item"
        :class="[
          `rs-steps__item--${row.status}`,
          {
            'rs-steps__item--active': row.active,
            'rs-steps__item--disabled': row.disabled,
          },
        ]"
        :aria-current="row.active ? 'step' : undefined"
      >
        <component
          :is="clickable ? 'button' : 'div'"
          :type="clickable ? 'button' : undefined"
          class="rs-steps__trigger"
          :data-rs-step="row.item.value"
          :tabindex="clickable && !row.disabled ? 0 : -1"
          :aria-disabled="row.disabled ? 'true' : undefined"
          @click="selectStep(row.item, $event)"
        >
          <slot name="item" v-bind="slotProps(row)">
            <span
              class="rs-steps__indicator"
              :class="{ 'rs-steps__indicator--percent': showPercent(row) }"
              :style="
                showPercent(row)
                  ? { '--rs-steps-percent': String(resolvedPercent) }
                  : undefined
              "
            >
              <span class="rs-steps__mark">
                <slot name="icon" v-bind="slotProps(row)">
                  <RsIcon
                    v-if="row.indicator === 'icon' && row.item.icon"
                    :name="row.item.icon"
                    :size="resolvedSize"
                  />
                  <RsIcon v-else-if="row.indicator === 'check'" name="check" :size="resolvedSize" />
                  <RsIcon v-else-if="row.indicator === 'error'" name="x" :size="resolvedSize" />
                  <template v-else-if="row.indicator !== 'dot'">{{ row.index + 1 }}</template>
                </slot>
              </span>
            </span>
            <span class="rs-steps__body">
              <span class="rs-steps__title">
                <slot name="title" v-bind="slotProps(row)">{{ row.item.title }}</slot>
              </span>
              <span v-if="row.item.description || $slots.description" class="rs-steps__description">
                <slot name="description" v-bind="slotProps(row)">{{ row.item.description }}</slot>
              </span>
              <span class="rs-steps__status">{{ statusLabel(row.status) }}</span>
            </span>
          </slot>
        </component>
        <span
          v-if="index < rows.length - 1"
          class="rs-steps__separator"
          :class="{ 'rs-steps__separator--finish': row.completedSeparator }"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.rs-steps {
  --rs-steps-indicator-size: var(--rs-steps-indicator-size-md);
  min-width: 0;
}

.rs-steps--ssm {
  --rs-steps-indicator-size: var(--rs-steps-indicator-size-ssm);
}

.rs-steps--sm {
  --rs-steps-indicator-size: var(--rs-steps-indicator-size-sm);
}

.rs-steps--lg {
  --rs-steps-indicator-size: var(--rs-steps-indicator-size-lg);
}

.rs-steps__list {
  display: flex;
  gap: var(--rs-steps-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-steps--vertical .rs-steps__list {
  flex-direction: column;
}

.rs-steps__item {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--rs-steps-item-gap);
  min-width: 0;
}

.rs-steps--vertical .rs-steps__item {
  flex: none;
  flex-direction: column;
  align-items: stretch;
}

.rs-steps--label-bottom.rs-steps--horizontal .rs-steps__item {
  position: relative;
  flex-direction: column;
  align-items: center;
}

.rs-steps__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-steps-trigger-gap);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: default;
}

.rs-steps--clickable .rs-steps__trigger {
  cursor: pointer;
}

.rs-steps--label-bottom.rs-steps--horizontal .rs-steps__trigger {
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rs-steps__trigger:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: 2px;
  border-radius: var(--rs-radius-xs);
}

.rs-steps__item--disabled .rs-steps__trigger {
  opacity: var(--rs-steps-disabled-opacity);
  cursor: not-allowed;
}

.rs-steps__indicator {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rs-steps-indicator-size);
  height: var(--rs-steps-indicator-size);
  flex: 0 0 auto;
  border-radius: var(--rs-radius-full);
  background: var(--rs-steps-wait-bg);
  color: var(--rs-steps-wait-fg);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-bold);
  line-height: 1;
  transition:
    background-color var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-steps--ssm .rs-steps__indicator,
.rs-steps--sm .rs-steps__indicator {
  font-size: var(--rs-font-size-xs);
}

.rs-steps--dot .rs-steps__indicator {
  width: var(--rs-steps-dot-size);
  height: var(--rs-steps-dot-size);
}

.rs-steps__item--finish .rs-steps__indicator,
.rs-steps__item--process .rs-steps__indicator {
  background: var(--rs-steps-process-bg);
  color: var(--rs-steps-process-fg);
}

.rs-steps__item--finish .rs-steps__indicator {
  background: var(--rs-steps-finish-bg);
  color: var(--rs-steps-finish-fg);
}

.rs-steps__item--error .rs-steps__indicator {
  background: var(--rs-steps-error-bg);
  color: var(--rs-steps-error-fg);
}

.rs-steps__indicator--percent {
  background: conic-gradient(
    var(--rs-steps-process-bg) calc(var(--rs-steps-percent, 0) * 1%),
    var(--rs-steps-wait-bg) 0
  );
}

.rs-steps__indicator--percent::before {
  content: '';
  position: absolute;
  inset: 0.125rem;
  border-radius: inherit;
  background: var(--rs-steps-process-bg);
}

.rs-steps__mark {
  position: relative;
  z-index: 1;
}

.rs-steps__body {
  display: grid;
  min-width: 0;
}

.rs-steps__title {
  overflow: hidden;
  color: var(--rs-steps-title);
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-steps-title-weight);
  line-height: var(--rs-line-height-normal);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-steps__item--process .rs-steps__title,
.rs-steps__item--finish .rs-steps__title {
  color: var(--rs-steps-title-active);
}

.rs-steps__item--error .rs-steps__title {
  color: var(--rs-steps-title-error);
}

.rs-steps__description {
  overflow: hidden;
  color: var(--rs-steps-description);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  text-overflow: ellipsis;
}

.rs-steps__status {
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

.rs-steps__separator {
  height: var(--rs-steps-separator-size);
  flex: 1;
  background: var(--rs-steps-separator);
  transition: background-color var(--rs-transition-fast);
}

.rs-steps__separator--finish {
  background: var(--rs-steps-separator-finish);
}

.rs-steps--vertical .rs-steps__separator {
  width: var(--rs-steps-separator-size);
  min-height: var(--rs-steps-separator-min);
  margin-inline-start: calc((var(--rs-steps-indicator-size) - var(--rs-steps-separator-size)) / 2);
  flex: none;
  height: auto;
}

.rs-steps--label-bottom.rs-steps--horizontal .rs-steps__separator {
  position: absolute;
  top: calc(var(--rs-steps-indicator-size) / 2);
  inset-inline-start: calc(50% + var(--rs-steps-indicator-size) / 2 + var(--rs-steps-gap) / 2);
  width: calc(100% - var(--rs-steps-indicator-size) - var(--rs-steps-gap));
  height: var(--rs-steps-separator-size);
  flex: none;
}

.rs-steps--dot.rs-steps--vertical .rs-steps__separator {
  margin-inline-start: calc((var(--rs-steps-dot-size) - var(--rs-steps-separator-size)) / 2);
}

.rs-steps--dot.rs-steps--label-bottom.rs-steps--horizontal .rs-steps__separator {
  top: calc(var(--rs-steps-dot-size) / 2);
  inset-inline-start: calc(50% + var(--rs-steps-dot-size) / 2 + var(--rs-steps-gap) / 2);
  width: calc(100% - var(--rs-steps-dot-size) - var(--rs-steps-gap));
}

@media (prefers-reduced-motion: reduce) {
  .rs-steps__indicator,
  .rs-steps__separator {
    transition: none;
  }
}
</style>
