<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize } from '../theme/types'
import { useResolvedRsComponentSize } from './resolve-size'
import {
  formatTimeFromParts,
  getTimeMinuteOptions,
  parseTimeValue,
  scheduleAfterPaint,
  scrollTimeColumnToValue,
  TIME_HOUR_OPTIONS,
  TIME_SECOND_OPTIONS,
  type RsTimeUnit,
} from './time-picker-utils'

defineOptions({ name: 'RsTimePickerColumns' })

const model = defineModel<string>({ default: '00:00' })

const props = withDefaults(
  defineProps<{
    minuteStep?: number
    second?: boolean
    disabled?: boolean
    size?: RsComponentSize
    isUnitDisabled?: (unit: RsTimeUnit, value: number) => boolean
  }>(),
  {
    minuteStep: 1,
    second: false,
    disabled: false,
  },
)

const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)

const hourListRef = useTemplateRef<HTMLDivElement>('hourListRef')
const minuteListRef = useTemplateRef<HTMLDivElement>('minuteListRef')
const secondListRef = useTemplateRef<HTMLDivElement>('secondListRef')

let cancelScheduledScroll: (() => void) | undefined

const hourOptions = TIME_HOUR_OPTIONS
const secondOptions = TIME_SECOND_OPTIONS
const minuteOptions = computed(() => getTimeMinuteOptions(props.minuteStep))

const parts = computed(() => {
  const parsed = parseTimeValue(model.value, props.second)
  if (parsed) {
    return { hour: parsed.hour, minute: parsed.minute, second: parsed.second }
  }
  return { hour: 0, minute: 0, second: 0 }
})

function isDisabled(unit: RsTimeUnit, value: number): boolean {
  return props.disabled || (props.isUnitDisabled?.(unit, value) ?? false)
}

function scrollColumn(container: HTMLDivElement | null, value: number): void {
  scrollTimeColumnToValue(container, value)
}

function scrollToSelection(): void {
  scrollColumn(hourListRef.value, parts.value.hour)
  scrollColumn(minuteListRef.value, parts.value.minute)
  if (props.second) {
    scrollColumn(secondListRef.value, parts.value.second)
  }
}

function scrollToSelectionAfterPaint(): void {
  cancelScheduledScroll?.()
  cancelScheduledScroll = scheduleAfterPaint(scrollToSelection)
}

function selectUnit(unit: RsTimeUnit, value: number): void {
  if (isDisabled(unit, value)) return
  const next = { ...parts.value, [unit]: value }
  model.value = formatTimeFromParts(next.hour, next.minute, next.second, props.second)
}

watch(
  () => [parts.value.hour, parts.value.minute, parts.value.second, props.second] as const,
  () => {
    nextTick(scrollToSelection)
  },
  { flush: 'post' },
)

onMounted(() => {
  scrollToSelectionAfterPaint()
})

onUnmounted(() => {
  cancelScheduledScroll?.()
})

defineExpose({
  scrollToSelection,
  scrollToSelectionAfterPaint,
  resolvedSize,
})
</script>

<template>
  <div
    class="rs-time-columns"
    :class="[
      `rs-time-columns--${resolvedSize}`,
      { 'rs-time-columns--seconds': second },
    ]"
  >
    <div class="rs-time-columns__column">
      <span class="rs-time-columns__label">{{ t('timePicker.hour') }}</span>
      <!-- shell：overflow:hidden 裁剪滚动条，避免盖住圆角 -->
      <div class="rs-time-columns__list-shell">
        <div ref="hourListRef" class="rs-time-columns__list">
          <button
            v-for="option in hourOptions"
            :key="option.value"
            type="button"
            class="rs-time-columns__item"
            :class="{ 'rs-time-columns__item--active': parts.hour === option.value }"
            data-unit="hour"
            :data-value="option.value"
            :disabled="isDisabled('hour', option.value)"
            @click="selectUnit('hour', option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="rs-time-columns__column">
      <span class="rs-time-columns__label">{{ t('timePicker.minute') }}</span>
      <div class="rs-time-columns__list-shell">
        <div ref="minuteListRef" class="rs-time-columns__list">
          <button
            v-for="option in minuteOptions"
            :key="option.value"
            type="button"
            class="rs-time-columns__item"
            :class="{ 'rs-time-columns__item--active': parts.minute === option.value }"
            data-unit="minute"
            :data-value="option.value"
            :disabled="isDisabled('minute', option.value)"
            @click="selectUnit('minute', option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="second" class="rs-time-columns__column">
      <span class="rs-time-columns__label">{{ t('timePicker.second') }}</span>
      <div class="rs-time-columns__list-shell">
        <div ref="secondListRef" class="rs-time-columns__list">
          <button
            v-for="option in secondOptions"
            :key="option.value"
            type="button"
            class="rs-time-columns__item"
            :class="{ 'rs-time-columns__item--active': parts.second === option.value }"
            data-unit="second"
            :data-value="option.value"
            :disabled="isDisabled('second', option.value)"
            @click="selectUnit('second', option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rs-time-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--rs-space-sm);
  --rs-time-columns-list-max-height: 10rem;
  --rs-time-columns-item-padding-y: 0.375rem;
  --rs-time-columns-item-font-size: var(--rs-font-size-sm);
  --rs-time-columns-label-font-size: 0.6875rem;
}
.rs-time-columns--seconds {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.rs-time-columns--ssm {
  --rs-time-columns-list-max-height: 7.5rem;
  --rs-time-columns-item-padding-y: 0.2rem;
  --rs-time-columns-item-font-size: var(--rs-font-size-xs);
  --rs-time-columns-label-font-size: 0.625rem;
  gap: var(--rs-space-xs);
}
.rs-time-columns--sm {
  --rs-time-columns-list-max-height: 8.5rem;
  --rs-time-columns-item-padding-y: 0.28rem;
  --rs-time-columns-item-font-size: var(--rs-font-size-xs);
  --rs-time-columns-label-font-size: 0.625rem;
}
.rs-time-columns--lg {
  --rs-time-columns-list-max-height: 12rem;
  --rs-time-columns-item-padding-y: 0.5rem;
  --rs-time-columns-item-font-size: var(--rs-font-size-base);
  --rs-time-columns-label-font-size: var(--rs-font-size-xs);
}
.rs-time-columns__column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
}
.rs-time-columns__label {
  text-align: center;
  font-size: var(--rs-time-columns-label-font-size);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--rs-muted);
}
.rs-time-columns__list-shell {
  overflow: hidden;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  background: color-mix(in srgb, var(--rs-surface) 72%, transparent);
}
.rs-time-columns__list {
  position: relative;
  max-height: var(--rs-time-columns-list-max-height);
  overflow-y: auto;
  padding: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--rs-muted) 42%, transparent) transparent;
}
/* 去掉 Windows 原生滚动条上下三角，避免盖住圆角描边 */
.rs-time-columns__list::-webkit-scrollbar {
  width: 6px;
}
.rs-time-columns__list::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
.rs-time-columns__list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--rs-muted) 42%, transparent);
}
.rs-time-columns__list::-webkit-scrollbar-track {
  background: transparent;
}
.rs-time-columns__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--rs-radius-sm);
  padding: var(--rs-time-columns-item-padding-y) 0;
  background: transparent;
  color: var(--rs-text);
  font-size: var(--rs-time-columns-item-font-size);
  line-height: var(--rs-line-height-tight);
  cursor: pointer;
  transition: background var(--rs-transition-fast), color var(--rs-transition-fast);
}
.rs-time-columns__item:hover:not(:disabled) {
  background: var(--rs-surface-hover);
}
.rs-time-columns__item--active {
  background: var(--rs-primary);
  color: var(--rs-primary-foreground);
}
.rs-time-columns__item--active:hover:not(:disabled) {
  opacity: 0.92;
}
.rs-time-columns__item:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
</style>
