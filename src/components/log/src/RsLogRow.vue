<script setup lang="ts">
import { computed } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { splitLogHighlight, type RsNormalizedLogLine } from './log-utils'

defineOptions({ name: 'RsLogRow' })

const props = defineProps<{
  item: RsNormalizedLogLine
  index: number
  active: boolean
  zebra: boolean
  wrap: boolean
  fill: boolean
  showLineNo: boolean
  showTime: boolean
  showLevel: boolean
  search: string
}>()

const emit = defineEmits<{ select: [] }>()

const { t } = useRsI18n()

const visible = computed(() => props.item.plain || props.item.text)
const parts = computed(() => splitLogHighlight(visible.value, props.search))
const levelLabel = computed(() => t(`log.level.${props.item.level}`, props.item.level))
const rowLabel = computed(() => {
  const bits = [levelLabel.value]
  if (props.showLineNo) bits.push(t('log.lineNo', 'Line {n}', { n: props.item.seq }))
  if (props.item.time) bits.push(props.item.time)
  bits.push(visible.value)
  return bits.filter(Boolean).join(', ')
})
</script>

<template>
  <div
    class="rs-log__row"
    :class="[
      `rs-log__row--${item.level}`,
      {
        'rs-log__row--odd': index % 2 === 1,
        'rs-log__row--zebra': zebra,
        'rs-log__row--active': active,
        'rs-log__row--wrap': wrap,
        'rs-log__row--fill': fill,
      },
    ]"
    role="listitem"
    :aria-label="rowLabel"
    :data-log-index="index"
    @click="emit('select')"
  >
    <span class="rs-log__marker" aria-hidden="true" />
    <span v-if="showLineNo" class="rs-log__no">{{ item.seq }}</span>
    <span v-if="showTime && item.time" class="rs-log__time">{{ item.time }}</span>
    <span v-if="showLevel && item.level !== 'plain'" class="rs-log__level">{{ levelLabel }}</span>
    <span v-else class="rs-log__sr-only">{{ levelLabel }}</span>
    <slot :item="item" :index="index" :level-label="levelLabel" :parts="parts">
      <span class="rs-log__text">
        <template v-for="(part, partIndex) in parts" :key="partIndex">
          <mark v-if="part.hit" class="rs-log__hit">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
    </slot>
  </div>
</template>

<style scoped>
.rs-log__row {
  display: flex;
  align-items: flex-start;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  padding-inline: var(--rs-space-md);
  position: relative;
  white-space: nowrap;
  color: var(--rs-log-row-fg, var(--rs-log-fg, var(--rs-text-primary)));
}
.rs-log__row--fill {
  min-height: 100%;
}
.rs-log__row--wrap {
  height: auto;
  max-height: none;
  min-height: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  padding-block: var(--rs-space-xs);
}
.rs-log__row--zebra.rs-log__row--odd {
  background: var(--rs-log-stripe, transparent);
}
.rs-log__row.rs-log__row--active {
  background: var(--rs-log-active-bg, color-mix(in srgb, var(--rs-primary) 12%, var(--rs-log-bg, transparent)));
}
.rs-log__row--active::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block: 0;
  width: var(--rs-log-accent-width, 0.125rem);
  background: var(--rs-log-accent, var(--rs-primary));
  pointer-events: none;
}
.rs-log__marker {
  flex-shrink: 0;
  width: var(--rs-log-marker-width, 0.2rem);
  align-self: stretch;
  min-height: 0.9em;
  margin-block: 0.2rem;
  border-radius: var(--rs-radius-full);
  background: currentColor;
  user-select: none;
}
.rs-log__no,
.rs-log__time {
  flex-shrink: 0;
  color: var(--rs-log-muted, var(--rs-text-secondary));
  font-variant-numeric: tabular-nums;
  unicode-bidi: isolate;
  user-select: none;
}
.rs-log__level {
  flex-shrink: 0;
  min-inline-size: var(--rs-log-level-min, 3.6rem);
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: 0.02em;
  unicode-bidi: isolate;
  user-select: none;
}
.rs-log__text {
  min-width: 0;
  flex: 1;
  font-weight: inherit;
  unicode-bidi: plaintext;
  user-select: text;
}
.rs-log__row--wrap .rs-log__text {
  overflow: visible;
  height: auto;
  min-height: 0;
}
.rs-log__row:not(.rs-log__row--wrap) .rs-log__text {
  overflow: hidden;
  text-overflow: ellipsis;
}
.rs-log__hit {
  padding: 0 0.1em;
  background: var(--rs-log-hit-bg);
  color: var(--rs-log-hit-fg);
  font: inherit;
}
.rs-log__sr-only {
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
.rs-log__row--plain {
  --rs-log-row-fg: var(--rs-log-fg);
  font-weight: var(--rs-font-weight-regular);
}
.rs-log__row--trace {
  --rs-log-row-fg: var(--rs-log-trace);
  font-weight: var(--rs-font-weight-regular);
}
.rs-log__row--debug {
  --rs-log-row-fg: var(--rs-log-debug);
  font-weight: var(--rs-font-weight-regular);
}
.rs-log__row--info {
  --rs-log-row-fg: var(--rs-log-info);
  font-weight: var(--rs-font-weight-medium);
}
.rs-log__row--notice {
  --rs-log-row-fg: var(--rs-log-notice);
  font-weight: var(--rs-font-weight-medium);
}
.rs-log__row--success {
  --rs-log-row-fg: var(--rs-log-success);
  font-weight: var(--rs-font-weight-medium);
}
.rs-log__row--warn {
  --rs-log-row-fg: var(--rs-log-warn);
  font-weight: var(--rs-font-weight-semibold);
}
.rs-log__row--error {
  --rs-log-row-fg: var(--rs-log-error);
  font-weight: var(--rs-font-weight-bold);
}
.rs-log__row--fatal {
  --rs-log-row-fg: var(--rs-log-fatal);
  font-weight: var(--rs-font-weight-bold);
}
@media (forced-colors: active) {
  .rs-log__row {
    color: CanvasText;
  }
  .rs-log__marker {
    background: ButtonText;
  }
  .rs-log__hit {
    background: Highlight;
    color: HighlightText;
  }
  .rs-log__row--active {
    outline: var(--rs-focus-ring-width, 2px) solid Highlight;
    outline-offset: calc(var(--rs-focus-ring-width, 2px) * -1);
  }
  .rs-log__row--active::before {
    background: Highlight;
  }
}
</style>
