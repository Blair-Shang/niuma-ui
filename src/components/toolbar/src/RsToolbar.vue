<script setup lang="ts">
import { computed, nextTick, onMounted, onUpdated, ref, useSlots } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import type { RsComponentSize } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import {
  applyToolbarRovingTabindex,
  collectToolbarCommands,
  isToolbarTextField,
  nextToolbarIndex,
  resolveToolbarKeyboardDelta,
  type RsToolbarBorder,
  type RsToolbarExpose,
  type RsToolbarOrientation,
} from './toolbar-utils'

defineOptions({ name: 'RsToolbar' })

export type { RsToolbarBorder, RsToolbarExpose, RsToolbarOrientation }
export type { RsToolbarSize } from './toolbar-utils'

const props = withDefaults(
  defineProps<{
    /** 根元素标签名。 */
    tag?: string
    /** 高度密度。未传跟 ConfigProvider，再回退 md。 */
    size?: RsComponentSize
    /** 分割线位置。竖排时映射到逻辑 inline 边。 */
    border?: RsToolbarBorder
    orientation?: RsToolbarOrientation
    /** 使用抬升底色（`--rs-toolbar-bg` → `--rs-surface-elevated`）。 */
    elevated?: boolean
    /** 收紧水平内边距。 */
    compact?: boolean
    /** 允许换行，不再裁切 start 区。 */
    wrap?: boolean
    /** sticky 吸附。偏移写入 `--rs-toolbar-sticky-offset`。 */
    sticky?: boolean
    stickyOffset?: number
    disabled?: boolean
    /**
     * APG 键盘：方向键 / Home / End 在命令控件间移动。
     * 输入框不拦截。false 时不改 tabindex，每项仍是独立 Tab 停。
     */
    keyboard?: boolean
    /** 方向键在首尾循环。 */
    loop?: boolean
    ariaLabel?: string
    /** 兼容旧名，等同 ariaLabel。 */
    label?: string
    id?: string
  }>(),
  {
    tag: 'header',
    border: 'bottom',
    orientation: 'horizontal',
    elevated: false,
    compact: false,
    wrap: false,
    sticky: false,
    disabled: false,
    keyboard: true,
    loop: true,
  },
)

const slots = useSlots()
const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const rootRef = ref<HTMLElement | null>(null)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const writingDir = computed(() => resolveDirMode(config?.dir.value ?? 'auto', locale.value))

const toolbarLabel = computed(() => props.ariaLabel || props.label || t('toolbar.label'))
const hasStart = computed(() => Boolean(slots.start || slots.left || slots.default))
const hasCenter = computed(() => Boolean(slots.center))
const hasEnd = computed(() => Boolean(slots.end || slots.right))

const rootClass = computed(() => [
  'rs-toolbar',
  `rs-toolbar--${resolvedSize.value}`,
  `rs-toolbar--border-${props.border}`,
  `rs-toolbar--${props.orientation}`,
  {
    'rs-toolbar--elevated': props.elevated,
    'rs-toolbar--compact': props.compact,
    'rs-toolbar--wrap': props.wrap,
    'rs-toolbar--sticky': props.sticky,
    'rs-toolbar--disabled': props.disabled,
    'rs-toolbar--has-start': hasStart.value,
    'rs-toolbar--has-center': hasCenter.value,
    'rs-toolbar--has-end': hasEnd.value,
  },
])

const rootStyle = computed(() => {
  if (props.stickyOffset == null) return undefined
  return { '--rs-toolbar-sticky-offset': `${props.stickyOffset}px` }
})

function commands(): HTMLElement[] {
  return collectToolbarCommands(rootRef.value)
}

function syncRoving(preferred?: HTMLElement | null) {
  if (!props.keyboard || props.disabled) return
  applyToolbarRovingTabindex(commands(), preferred)
}

function focus() {
  if (props.disabled) return
  const items = commands()
  const current = applyToolbarRovingTabindex(items) ?? items[0]
  current?.focus()
}

function blur() {
  const root = rootRef.value
  const active = typeof document === 'undefined' ? null : document.activeElement
  if (root && active instanceof HTMLElement && root.contains(active)) {
    active.blur()
  }
}

function onFocusIn(event: FocusEvent) {
  if (!props.keyboard || props.disabled) return
  const target = event.target
  if (!(target instanceof HTMLElement) || !rootRef.value?.contains(target)) return
  if (isToolbarTextField(target)) return
  if (commands().includes(target)) syncRoving(target)
}

function onKeydown(event: KeyboardEvent) {
  if (!props.keyboard || props.disabled) return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (isToolbarTextField(event.target)) return
  const move = resolveToolbarKeyboardDelta(
    event.key,
    props.orientation,
    writingDir.value === 'rtl',
  )
  if (move == null) return
  const items = commands()
  if (!items.length) return
  const target = event.target
  const current = target instanceof HTMLElement ? items.indexOf(target) : -1
  if (current < 0) return
  event.preventDefault()
  let next = nextToolbarIndex(current, items.length, typeof move === 'number' ? move : 0, props.loop)
  if (move === 'start') next = 0
  if (move === 'end') next = items.length - 1
  const el = items[next]
  if (!el) return
  syncRoving(el)
  el.focus()
}

onMounted(() => {
  void nextTick(() => syncRoving())
})

onUpdated(() => {
  void nextTick(() => syncRoving())
})

defineExpose<RsToolbarExpose>({
  focus,
  blur,
})
</script>

<template>
  <component
    :is="tag"
    :id="id"
    ref="rootRef"
    :class="rootClass"
    :style="rootStyle"
    role="toolbar"
    :aria-label="toolbarLabel"
    :aria-orientation="orientation"
    :aria-disabled="disabled ? 'true' : undefined"
    :inert="disabled || undefined"
    @focusin="onFocusIn"
    @keydown="onKeydown"
  >
    <div v-if="hasStart" class="rs-toolbar__start">
      <slot name="start" />
      <slot name="left" />
      <slot />
    </div>
    <div v-if="hasCenter" class="rs-toolbar__center">
      <slot name="center" />
    </div>
    <div v-if="hasEnd" class="rs-toolbar__end">
      <slot name="end" />
      <slot name="right" />
    </div>
  </component>
</template>

<style scoped>
.rs-toolbar {
  --rs-toolbar-bg: var(--rs-surface);
  --rs-toolbar-fg: var(--rs-text-primary);
  --rs-toolbar-border: var(--rs-border-subtle);
  --rs-toolbar-gap: var(--rs-space-md);
  --rs-toolbar-item-gap: var(--rs-space-xs);
  --rs-toolbar-pad-block: 0px;
  --rs-toolbar-pad-inline: var(--rs-space-md);
  --rs-toolbar-height: var(--rs-control-height-lg);
  --rs-toolbar-font-size: var(--rs-font-size-sm);
  --rs-toolbar-rail-min: 0px;
  --rs-toolbar-blur: 16px;
  --rs-toolbar-sticky-offset: 0px;
  --rs-toolbar-disabled-opacity: 0.5;
  --rs-toolbar-z: 1;
  display: flex;
  align-items: center;
  gap: var(--rs-toolbar-gap);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
  padding-block: var(--rs-toolbar-pad-block);
  padding-inline: var(--rs-toolbar-pad-inline);
  min-height: var(--rs-toolbar-height);
  background: var(--rs-toolbar-bg);
  color: var(--rs-toolbar-fg);
  font-size: var(--rs-toolbar-font-size);
  font-weight: var(--rs-font-weight-regular);
  line-height: var(--rs-line-height-tight);
}

.rs-toolbar--has-center:not(.rs-toolbar--wrap):not(.rs-toolbar--vertical) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
}

.rs-toolbar--compact {
  --rs-toolbar-pad-inline: var(--rs-space-sm);
  --rs-toolbar-gap: var(--rs-space-sm);
}

.rs-toolbar--elevated {
  --rs-toolbar-bg: var(--rs-surface-elevated);
}

.rs-toolbar--ssm {
  --rs-toolbar-height: calc(var(--rs-control-height-sm) + var(--rs-space-xs));
  --rs-toolbar-font-size: var(--rs-font-size-xs);
  --rs-toolbar-pad-inline: var(--rs-space-sm);
  --rs-toolbar-gap: var(--rs-space-sm);
}

.rs-toolbar--sm {
  --rs-toolbar-height: var(--rs-control-height-md);
  --rs-toolbar-font-size: var(--rs-font-size-xs);
}

.rs-toolbar--md {
  --rs-toolbar-height: var(--rs-control-height-lg);
}

.rs-toolbar--lg {
  --rs-toolbar-height: calc(var(--rs-control-height-lg) + var(--rs-space-sm));
  --rs-toolbar-pad-inline: var(--rs-space-lg);
}

.rs-toolbar--border-bottom {
  border-block-end: 1px solid var(--rs-toolbar-border);
}

.rs-toolbar--border-top {
  border-block-start: 1px solid var(--rs-toolbar-border);
}

.rs-toolbar--border-both {
  border-block-start: 1px solid var(--rs-toolbar-border);
  border-block-end: 1px solid var(--rs-toolbar-border);
}

.rs-toolbar--border-none {
  border: none;
}

.rs-toolbar--vertical {
  flex-direction: column;
  align-items: stretch;
  align-self: stretch;
  width: max-content;
  max-width: 100%;
  min-width: var(--rs-toolbar-rail-min);
  min-height: 0;
  height: auto;
  padding-block: var(--rs-toolbar-pad-inline);
  padding-inline: var(--rs-toolbar-pad-block);
}

.rs-toolbar--vertical.rs-toolbar--has-center:not(.rs-toolbar--wrap) {
  display: grid;
  grid-template-columns: minmax(0, max-content);
  grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
  justify-items: stretch;
}

.rs-toolbar--vertical.rs-toolbar--border-bottom {
  border-block-end: none;
  border-inline-end: 1px solid var(--rs-toolbar-border);
}

.rs-toolbar--vertical.rs-toolbar--border-top {
  border-block-start: none;
  border-inline-start: 1px solid var(--rs-toolbar-border);
}

.rs-toolbar--vertical.rs-toolbar--border-both {
  border-block-start: none;
  border-block-end: none;
  border-inline-start: 1px solid var(--rs-toolbar-border);
  border-inline-end: 1px solid var(--rs-toolbar-border);
}

.rs-toolbar--wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  height: auto;
  white-space: normal;
  gap: var(--rs-toolbar-item-gap) var(--rs-toolbar-gap);
}

.rs-toolbar--sticky {
  position: sticky;
  inset-block-start: var(--rs-toolbar-sticky-offset);
  z-index: var(--rs-toolbar-z);
  background: color-mix(in srgb, var(--rs-toolbar-bg) 78%, transparent);
  backdrop-filter: saturate(1.2) blur(var(--rs-toolbar-blur));
  -webkit-backdrop-filter: saturate(1.2) blur(var(--rs-toolbar-blur));
}

.rs-toolbar--disabled {
  opacity: var(--rs-toolbar-disabled-opacity);
}

.rs-toolbar__start,
.rs-toolbar__center,
.rs-toolbar__end {
  display: flex;
  align-items: center;
  gap: var(--rs-toolbar-item-gap);
  min-width: 0;
  max-width: 100%;
}

.rs-toolbar__start {
  flex: 1 1 auto;
  justify-content: flex-start;
  overflow: clip;
  overflow-clip-margin: var(--rs-focus-ring-width, 2px);
}

.rs-toolbar__center {
  flex: 0 0 auto;
  justify-content: center;
  min-width: max-content;
}

.rs-toolbar__end {
  flex: 0 0 auto;
  justify-content: flex-end;
  margin-inline-start: auto;
}

.rs-toolbar--has-center:not(.rs-toolbar--wrap):not(.rs-toolbar--vertical) .rs-toolbar__start,
.rs-toolbar--has-center:not(.rs-toolbar--wrap):not(.rs-toolbar--vertical) .rs-toolbar__end {
  width: 100%;
  overflow: clip;
  overflow-clip-margin: var(--rs-focus-ring-width, 2px);
}

.rs-toolbar--has-center:not(.rs-toolbar--wrap):not(.rs-toolbar--vertical) .rs-toolbar__start {
  grid-column: 1;
  justify-self: stretch;
  margin-inline-start: 0;
}

.rs-toolbar--has-center:not(.rs-toolbar--wrap):not(.rs-toolbar--vertical) .rs-toolbar__center {
  grid-column: 2;
  justify-self: center;
}

.rs-toolbar--has-center:not(.rs-toolbar--wrap):not(.rs-toolbar--vertical) .rs-toolbar__end {
  grid-column: 3;
  justify-self: stretch;
  margin-inline-start: 0;
}

.rs-toolbar--vertical .rs-toolbar__start,
.rs-toolbar--vertical .rs-toolbar__center,
.rs-toolbar--vertical .rs-toolbar__end {
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: none;
  margin-inline-start: 0;
  overflow: visible;
}

.rs-toolbar--vertical .rs-toolbar__end {
  margin-block-start: auto;
}

.rs-toolbar--vertical.rs-toolbar--has-center:not(.rs-toolbar--wrap) .rs-toolbar__start {
  grid-column: 1;
  grid-row: 1;
  justify-self: stretch;
  align-self: start;
  margin: 0;
}

.rs-toolbar--vertical.rs-toolbar--has-center:not(.rs-toolbar--wrap) .rs-toolbar__center {
  grid-column: 1;
  grid-row: 2;
  justify-self: stretch;
  align-self: center;
  margin: 0;
}

.rs-toolbar--vertical.rs-toolbar--has-center:not(.rs-toolbar--wrap) .rs-toolbar__end {
  grid-column: 1;
  grid-row: 3;
  justify-self: stretch;
  align-self: end;
  margin: 0;
}

.rs-toolbar--wrap .rs-toolbar__start {
  flex-wrap: wrap;
  overflow: visible;
}

.rs-toolbar--wrap:not(.rs-toolbar--vertical) .rs-toolbar__end {
  margin-inline-start: auto;
}

@media (prefers-reduced-transparency: reduce) {
  .rs-toolbar--sticky {
    background: var(--rs-toolbar-bg);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

@media (forced-colors: active) {
  .rs-toolbar {
    --rs-toolbar-bg: Canvas;
    --rs-toolbar-fg: CanvasText;
    --rs-toolbar-border: CanvasText;
  }

  .rs-toolbar--elevated,
  .rs-toolbar--sticky {
    --rs-toolbar-bg: Canvas;
    background: Canvas;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>
