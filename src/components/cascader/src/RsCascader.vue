<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize } from '../../../theme/types'
import {
  placeAnchoredPopup,
  stepEnabledIndex,
  type RsOverlayBox,
} from '../../_shared/src/overlay-utils'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext } from '../../form/src/form-utils'
import RsButton from '../../button/src/RsButton.vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  cascaderColumns,
  cascaderDisplay,
  isCascaderLeaf,
  nextCascaderPath,
  popCascaderPath,
  type RsCascaderExpandTrigger,
  type RsCascaderOption,
  type RsCascaderPath,
} from './cascader-utils'

/**
 * RsCascader 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsCascader>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsCascaderExpose {
  focus: () => void
}

export type RsCascaderInstance = RsCascaderExpose & { $el: HTMLElement }

defineOptions({ name: 'RsCascader' })

const model = defineModel<RsCascaderPath>({ default: () => [] })
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    options: readonly RsCascaderOption[]
    placeholder?: string
    disabled?: boolean
    allowClear?: boolean
    changeOnSelect?: boolean
    expandTrigger?: RsCascaderExpandTrigger
    separator?: string
    size?: RsComponentSize
    ariaLabel?: string
    id?: string
  }>(),
  {
    disabled: false,
    allowClear: false,
    changeOnSelect: false,
    expandTrigger: 'click',
    separator: ' / ',
  },
)

const emit = defineEmits<{
  change: [path: RsCascaderPath]
}>()

const { t } = useRsI18n()
const formContext = useRsFormContext()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const panelId = useId()
const triggerId = computed(() => props.id || panelId)
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')
const panelRef = useTemplateRef<HTMLElement>('panelRef')
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const highlight = ref(0)
const panelTheme = ref<string | undefined>()
const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })
const chevronSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const clearIconSize = RS_COMPONENT_SIZE_ICON_PX.ssm

const columns = computed(() => cascaderColumns(props.options, model.value))
const display = computed(() => cascaderDisplay(props.options, model.value, props.separator))
const activeCol = computed(() => Math.max(0, columns.value.length - 1))
const activeOptions = computed(() => columns.value[activeCol.value] ?? [])
const highlighted = computed(() => activeOptions.value[highlight.value])

const itemIconSize = computed(() => {
  if (resolvedSize.value === 'lg') return 16
  if (resolvedSize.value === 'md') return 14
  return 12
})

const triggerClass = computed(() => [
  'rs-cascader',
  `rs-cascader--${resolvedSize.value}`,
  {
    'rs-cascader--disabled': resolvedDisabled.value,
    'rs-cascader--open': open.value,
  },
])

const panelClass = computed(() => [
  'rs-cascader__panel',
  `rs-cascader__panel--${resolvedSize.value}`,
])

const panelStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${popup.value.top}px`,
  left: `${popup.value.left}px`,
}))

function isActive(depth: number, value: string | number): boolean {
  return String(model.value[depth] ?? '') === String(value)
}

function pick(depth: number, option: RsCascaderOption): void {
  if (option.disabled || resolvedDisabled.value) return
  const next = nextCascaderPath(model.value, depth, option.value)
  model.value = next
  emit('change', next)
  if (isCascaderLeaf(option) || (props.changeOnSelect && props.expandTrigger === 'click')) {
    if (isCascaderLeaf(option)) open.value = false
  }
}

function onHover(depth: number, option: RsCascaderOption): void {
  if (props.expandTrigger !== 'hover' || option.disabled) return
  if (!isCascaderLeaf(option)) {
    model.value = nextCascaderPath(model.value, depth, option.value)
  }
}

function onClear(): void {
  if (resolvedDisabled.value) return
  model.value = []
  emit('change', [])
}

function focus(): void {
  triggerRef.value?.focus()
}

function toggleOpen(): void {
  if (resolvedDisabled.value) return
  open.value = !open.value
}

function syncHighlight(): void {
  const col = activeOptions.value
  const selected = model.value[activeCol.value]
  const idx = col.findIndex((item) => String(item.value) === String(selected ?? ''))
  highlight.value = idx >= 0 ? idx : stepEnabledIndex(col, -1, 1)
}

function syncPanelTheme(): void {
  const el = triggerRef.value
  if (!el) {
    panelTheme.value = undefined
    return
  }
  const themed = el.closest('[data-rs-theme]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
}

function placePopup(): void {
  const trigger = triggerRef.value
  const panel = panelRef.value
  if (!trigger || !open.value || typeof window === 'undefined') return
  const anchor = trigger.getBoundingClientRect()
  const measured = panel?.getBoundingClientRect()
  const prefWidth = Math.max(anchor.width, measured?.width || anchor.width)
  popup.value = placeAnchoredPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: prefWidth, height: measured?.height || 256 },
    { width: window.innerWidth, height: window.innerHeight },
  )
}

let frame = 0
function requestPlace(): void {
  if (typeof window === 'undefined') return
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function onDocPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!target) return
  if (rootRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  open.value = false
}

function onWindowChange(): void {
  if (open.value) requestPlace()
}

function detachOverlay(): void {
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
}

function moveHighlight(delta: 1 | -1): void {
  highlight.value = stepEnabledIndex(activeOptions.value, highlight.value, delta)
}

function handleClosedKeys(event: KeyboardEvent): boolean {
  if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return false
  event.preventDefault()
  open.value = true
  return true
}

function handleOpenKeys(event: KeyboardEvent): boolean {
  const col = activeOptions.value
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveHighlight(1)
    return true
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveHighlight(-1)
    return true
  }
  if (event.key === 'Home') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(col, -1, 1)
    return true
  }
  if (event.key === 'End') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(col, col.length, -1)
    return true
  }
  if (event.key === 'ArrowRight' && highlighted.value && !isCascaderLeaf(highlighted.value)) {
    event.preventDefault()
    pick(activeCol.value, highlighted.value)
    return true
  }
  if (event.key === 'ArrowLeft' && model.value.length) {
    event.preventDefault()
    model.value = popCascaderPath(model.value)
    return true
  }
  if (event.key === 'Enter' && highlighted.value) {
    event.preventDefault()
    pick(activeCol.value, highlighted.value)
    return true
  }
  return false
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (resolvedDisabled.value || event.isComposing) return
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    open.value = false
    return
  }
  if (!open.value) {
    handleClosedKeys(event)
    return
  }
  handleOpenKeys(event)
}

watch(open, (isOpen) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  if (isOpen) {
    if (resolvedDisabled.value) {
      open.value = false
      return
    }
    syncPanelTheme()
    syncHighlight()
    document.addEventListener('pointerdown', onDocPointerDown)
    window.addEventListener('resize', onWindowChange)
    window.addEventListener('scroll', onWindowChange, true)
    void nextTick(() => requestPlace())
    return
  }
  detachOverlay()
})

watch(columns, () => {
  if (!open.value) return
  syncHighlight()
  requestPlace()
})

onBeforeUnmount(detachOverlay)

defineExpose<RsCascaderExpose>({
  focus,
})
</script>

<template>
  <div
    ref="rootRef"
    class="rs-cascader-wrap"
    :class="{ 'rs-cascader-wrap--clearable': allowClear && display && !resolvedDisabled }"
  >
    <button
      :id="triggerId"
      ref="triggerRef"
      type="button"
      :class="triggerClass"
      :disabled="resolvedDisabled"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? panelId : undefined"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span v-if="display" class="rs-cascader__value">{{ display }}</span>
      <span v-else class="rs-cascader__placeholder">{{ placeholder ?? t('select.placeholder') }}</span>
      <RsIcon name="chevron-down" :size="chevronSize" class="rs-cascader__icon" aria-hidden="true" />
    </button>
    <RsButton
      v-if="allowClear && display && !resolvedDisabled"
      class="rs-cascader__clear"
      variant="text"
      :bordered="false"
      size="ssm"
      radius="full"
      icon="x"
      :icon-size="clearIconSize"
      icon-only
      :aria-label="t('select.clear')"
      @pointerdown.stop
      @click.stop="onClear"
    />

    <Teleport to="body">
      <div
        v-if="open && !resolvedDisabled"
        :id="panelId"
        ref="panelRef"
        :class="panelClass"
        :data-placement="popup.placement"
        :data-rs-theme="panelTheme"
        :style="panelStyle"
        @mousedown.prevent
      >
        <ul
          v-for="(col, depth) in columns"
          :key="depth"
          class="rs-cascader__col"
        >
          <li
            v-for="(opt, index) in col"
            :key="String(opt.value)"
            class="rs-cascader__item"
            :class="{
              'rs-cascader__item--active': isActive(depth, opt.value),
              'rs-cascader__item--highlight': depth === activeCol && index === highlight,
              'rs-cascader__item--disabled': opt.disabled,
            }"
            @click="pick(depth, opt)"
            @mouseenter="onHover(depth, opt)"
          >
            <span>{{ opt.label }}</span>
            <RsIcon
              v-if="!isCascaderLeaf(opt)"
              name="chevron-right"
              :size="itemIconSize"
              aria-hidden="true"
            />
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-cascader-wrap {
  --rs-cascader-min-width: 12rem;
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: var(--rs-cascader-min-width);
  color: var(--rs-text);
  color-scheme: inherit;
  vertical-align: middle;
}

.rs-cascader-wrap--clearable .rs-cascader {
  padding-inline-end: calc(var(--rs-space-md) + 2.25rem);
}

.rs-cascader-wrap--clearable .rs-cascader--ssm {
  padding-inline-end: calc(var(--rs-space-xs) + 2rem);
}

.rs-cascader-wrap--clearable .rs-cascader--sm {
  padding-inline-end: calc(var(--rs-space-sm) + 2rem);
}

.rs-cascader-wrap--clearable .rs-cascader--lg {
  padding-inline-end: calc(var(--rs-space-lg) + 2.25rem);
}

.rs-cascader {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  width: 100%;
  min-width: var(--rs-cascader-min-width);
  height: var(--rs-control-height-md);
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font-family: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  text-align: start;
  cursor: pointer;
  outline: none;
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-cascader--ssm {
  height: var(--rs-control-height-ssm);
  min-height: var(--rs-control-height-ssm);
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-cascader--sm {
  height: var(--rs-control-height-sm);
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-cascader--md {
  height: var(--rs-control-height-md);
  min-height: var(--rs-control-height-md);
}

.rs-cascader--lg {
  height: var(--rs-control-height-lg);
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-cascader:hover:not(:disabled) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}

.rs-cascader--open:not(:disabled),
.rs-cascader:focus-visible {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-input-bg);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-cascader--disabled,
.rs-cascader:disabled {
  color: var(--rs-text-disabled);
  cursor: not-allowed;
  background: var(--rs-surface-hover);
  opacity: 0.38;
}

.rs-cascader__placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--rs-placeholder);
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-cascader__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-cascader__icon {
  flex-shrink: 0;
  color: var(--rs-muted);
  transition: transform var(--rs-transition-fast);
}

.rs-cascader--open .rs-cascader__icon {
  transform: rotate(180deg);
}

.rs-cascader__clear {
  position: absolute;
  inset-inline-end: calc(var(--rs-space-sm) + 1.125rem);
  inset-block-start: 50%;
  transform: translateY(-50%);
  color: var(--rs-muted);
}

.rs-cascader__panel {
  --rs-cascader-panel-min-h: 8rem;
  --rs-cascader-panel-max-h: 16rem;
  --rs-cascader-col-min-w: 8rem;
  z-index: calc(var(--rs-z-modal) + 2);
  display: flex;
  box-sizing: border-box;
  min-height: var(--rs-cascader-panel-min-h);
  max-height: var(--rs-cascader-panel-max-h);
  overflow: hidden;
  border: 1px solid var(--rs-dialog-border, var(--rs-border));
  border-radius: var(--rs-radius);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow-lg);
  color: var(--rs-text);
  color-scheme: inherit;
}

.rs-cascader__col {
  min-width: var(--rs-cascader-col-min-w);
  margin: 0;
  padding: var(--rs-space-xs);
  overflow: auto;
  border-inline-end: 1px solid var(--rs-border-subtle, var(--rs-border));
  list-style: none;
}

.rs-cascader__col:last-child {
  border-inline-end: 0;
}

.rs-cascader__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  min-height: var(--rs-control-height-md);
  padding: var(--rs-space-sm) var(--rs-space-md);
  border-radius: var(--rs-radius-sm);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  cursor: pointer;
  user-select: none;
  transition:
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-cascader__item > span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-cascader__item--highlight:not(.rs-cascader__item--active) {
  background: var(--rs-item-hover);
}

.rs-cascader__item--active {
  color: var(--rs-primary);
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
}

.rs-cascader__item--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.rs-cascader__panel--ssm .rs-cascader__item,
.rs-cascader__panel--sm .rs-cascader__item {
  gap: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.rs-cascader__panel--sm .rs-cascader__item {
  min-height: var(--rs-control-height-sm);
  padding: 0.25rem 0.5rem;
}

.rs-cascader__panel--ssm .rs-cascader__item {
  min-height: var(--rs-control-height-ssm);
  padding: 0.125rem 0.375rem;
}

.rs-cascader__panel--lg .rs-cascader__item {
  min-height: var(--rs-control-height-lg);
  padding: var(--rs-space-sm) var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

@media (hover: hover) {
  .rs-cascader__item:hover:not(.rs-cascader__item--disabled) {
    background: var(--rs-item-hover);
  }

  .rs-cascader__item--active:hover:not(.rs-cascader__item--disabled) {
    background: color-mix(in srgb, var(--rs-primary) 18%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-cascader,
  .rs-cascader__icon,
  .rs-cascader__item {
    transition: none;
  }

  .rs-cascader--open .rs-cascader__icon {
    transform: none;
  }
}
</style>
