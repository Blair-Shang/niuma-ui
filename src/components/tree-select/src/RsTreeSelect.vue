<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { placeAnchoredPopup, type RsOverlayBox } from '../../_shared/src/overlay-utils'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import { useRsFormContext } from '../../form/src/form-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import RsTree from '../../tree/src/RsTree.vue'
import type { RsTreeFieldNames, RsTreeNode } from '../../tree/src/tree-utils'
import {
  buildTreeSelectIndex,
  emptyTreeSelectValue,
  formatTreeSelectDisplay,
  isTreeSelectMultiValue,
  normalizeTreeSelectKeys,
  packTreeSelectValue,
  resolveTreeSelectDisplayKeys,
  resolveTreeSelectLabels,
  resolveTreeSelectPortalTarget,
  treeSelectHasValue,
  type RsTreeSelectGetPopupContainer,
  type RsTreeSelectModelValue,
  type RsTreeSelectShowCheckedStrategy,
} from './tree-select-utils'

export interface RsTreeSelectExpose {
  focus: () => void
  blur: () => void
}

export type RsTreeSelectInstance = RsTreeSelectExpose & { $el: HTMLElement }

defineOptions({ name: 'RsTreeSelect' })

const model = defineModel<RsTreeSelectModelValue>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    treeData: RsTreeNode[]
    fieldNames?: RsTreeFieldNames
    placeholder?: string
    disabled?: boolean
    allowClear?: boolean
    multiple?: boolean
    checkable?: boolean
    searchable?: boolean
    size?: RsComponentSize
    radius?: RsRadius
    checkStrictly?: boolean
    onlyCheckLeaf?: boolean
    checkOnClickNode?: boolean
    defaultExpandAll?: boolean
    showLine?: boolean
    filterNode?: (node: RsTreeNode, keyword: string) => boolean
    highlight?: boolean
    lazy?: boolean
    loadData?: (node: RsTreeNode, key: string) => void | Promise<void>
    virtual?: boolean
    virtualThreshold?: number
    listHeight?: number
    showCheckedStrategy?: RsTreeSelectShowCheckedStrategy
    maxTagCount?: number
    getPopupContainer?: RsTreeSelectGetPopupContainer
    matchTriggerWidth?: boolean
    name?: string
    id?: string
    ariaLabel?: string
    searchPlaceholder?: string
  }>(),
  {
    disabled: false,
    allowClear: false,
    multiple: false,
    checkable: false,
    searchable: false,
    checkStrictly: false,
    onlyCheckLeaf: false,
    checkOnClickNode: true,
    defaultExpandAll: true,
    showLine: false,
    highlight: true,
    lazy: false,
    virtual: false,
    virtualThreshold: 100,
    listHeight: 256,
    showCheckedStrategy: 'SHOW_ALL',
    matchTriggerWidth: false,
  },
)

const emit = defineEmits<{
  change: [value: RsTreeSelectModelValue]
  select: [key: string, node?: RsTreeNode]
  search: [query: string]
  clear: []
  dropdownVisibleChange: [open: boolean]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const { t } = useRsI18n()
const formContext = useRsFormContext()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const isMulti = computed(() => isTreeSelectMultiValue(props.multiple, props.checkable))
const panelId = useId()
const triggerId = computed(() => props.id || panelId)
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')
const panelRef = useTemplateRef<HTMLElement>('panelRef')
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef')
const filter = ref('')
const panelTheme = ref<string | undefined>()
const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })
const chevronSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const clearIconSize = RS_COMPONENT_SIZE_ICON_PX.ssm

const selectedKeys = computed(() => normalizeTreeSelectKeys(model.value))
const nodeIndex = computed(() =>
  buildTreeSelectIndex(props.treeData, props.fieldNames, props.lazy),
)
const displayKeys = computed(() =>
  resolveTreeSelectDisplayKeys(
    selectedKeys.value,
    nodeIndex.value,
    props.showCheckedStrategy,
    props.checkStrictly,
  ),
)
const displayLabels = computed(() =>
  resolveTreeSelectLabels(displayKeys.value, nodeIndex.value, props.fieldNames),
)
const display = computed(() =>
  formatTreeSelectDisplay(
    displayLabels.value,
    props.maxTagCount,
    props.maxTagCount != null && displayLabels.value.length > props.maxTagCount
      ? t('select.maxTagPlaceholder', {
          count: displayLabels.value.length - props.maxTagCount,
        })
      : undefined,
  ),
)
const hasValue = computed(() => treeSelectHasValue(selectedKeys.value))
const treeModel = computed(() =>
  props.checkable ? '' : packTreeSelectValue(selectedKeys.value, props.multiple),
)
const portalTo = computed(() =>
  resolveTreeSelectPortalTarget(props.getPopupContainer, triggerRef.value),
)
const resolvedPlaceholder = computed(() => props.placeholder ?? t('select.placeholder'))
const resolvedSearchPlaceholder = computed(
  () => props.searchPlaceholder ?? t('select.searchPlaceholder'),
)

const triggerClass = computed(() => [
  'rs-tree-select',
  `rs-tree-select--${resolvedSize.value}`,
  {
    'rs-tree-select--disabled': resolvedDisabled.value,
    'rs-tree-select--open': open.value,
  },
])

const rootStyle = computed(() => ({
  '--rs-tree-select-radius': rsRadiusCss(resolvedRadius.value),
}))

const panelStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${popup.value.top}px`,
  left: `${popup.value.left}px`,
  '--rs-tree-select-radius': rsRadiusCss(resolvedRadius.value),
  '--rs-tree-select-list-height': `${props.listHeight}px`,
  '--rs-tree-select-trigger-width': `${popup.value.width}px`,
  minWidth: `${popup.value.width}px`,
  ...(props.matchTriggerWidth ? { width: `${popup.value.width}px` } : {}),
}))

function commit(
  keys: string[],
  closeSingle: boolean,
  selectedKey?: string,
  node?: RsTreeNode,
): void {
  if (resolvedDisabled.value) return
  const next = packTreeSelectValue(keys, isMulti.value)
  model.value = next
  emit('change', next)
  if (selectedKey) emit('select', selectedKey, node)
  if (closeSingle && !isMulti.value) open.value = false
}

function onTreeUpdate(value: string | string[]): void {
  if (props.checkable) return
  const keys = normalizeTreeSelectKeys(value)
  const prev = new Set(selectedKeys.value)
  const added = keys.find((key) => !prev.has(key))
  const picked = added ?? keys[keys.length - 1]
  commit(keys, true, picked, picked ? nodeIndex.value.get(picked)?.node : undefined)
}

function onCheck(keys: string[], _half: string[], node: RsTreeNode, key: string): void {
  commit(keys, false, key, node)
}

function onSearchInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  filter.value = value
  emit('search', value)
}

function onClear(): void {
  if (resolvedDisabled.value) return
  model.value = emptyTreeSelectValue(isMulti.value)
  emit('change', model.value)
  emit('clear')
}

function focus(): void {
  triggerRef.value?.focus()
}

function blur(): void {
  triggerRef.value?.blur()
  searchInputRef.value?.blur()
}

function toggleOpen(): void {
  if (resolvedDisabled.value) return
  open.value = !open.value
}

function syncPanelTheme(): void {
  const el = triggerRef.value ?? rootRef.value
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
  const prefWidth = props.matchTriggerWidth
    ? anchor.width
    : Math.max(anchor.width, measured?.width || anchor.width)
  popup.value = placeAnchoredPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: prefWidth, height: measured?.height || props.listHeight },
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

let panelResize: ResizeObserver | undefined

function attachPanelObserver(): void {
  if (typeof ResizeObserver === 'undefined') return
  panelResize?.disconnect()
  if (!panelRef.value) return
  panelResize = new ResizeObserver(() => requestPlace())
  panelResize.observe(panelRef.value)
}

function focusTree(): void {
  panelRef.value?.querySelector<HTMLElement>('.rs-tree')?.focus()
}

function detachOverlay(): void {
  panelResize?.disconnect()
  panelResize = undefined
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

function onTriggerKeydown(event: KeyboardEvent): void {
  if (resolvedDisabled.value || event.isComposing) return
  if (event.key === 'Escape') {
    if (!open.value) return
    event.preventDefault()
    open.value = false
    return
  }
  if (!open.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open.value = true
    }
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (props.searchable) searchInputRef.value?.focus()
    else focusTree()
  }
}

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.isComposing) return
  if (event.key === 'Escape') {
    event.preventDefault()
    open.value = false
    triggerRef.value?.focus()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusTree()
  }
}

watch(
  open,
  (isOpen, wasOpen) => {
    if (wasOpen !== undefined) emit('dropdownVisibleChange', isOpen)
    if (typeof document === 'undefined' || typeof window === 'undefined') return
    if (isOpen) {
      if (resolvedDisabled.value) {
        open.value = false
        return
      }
      syncPanelTheme()
      document.addEventListener('pointerdown', onDocPointerDown)
      window.addEventListener('resize', onWindowChange)
      window.addEventListener('scroll', onWindowChange, true)
      void nextTick(() => {
        requestPlace()
        attachPanelObserver()
        if (props.searchable) searchInputRef.value?.focus()
        else focusTree()
      })
      return
    }
    detachOverlay()
    filter.value = ''
  },
  { immediate: true },
)

watch(resolvedDisabled, (disabled) => {
  if (disabled && open.value) open.value = false
})

onBeforeUnmount(detachOverlay)

defineExpose<RsTreeSelectExpose>({
  focus,
  blur,
})
</script>

<template>
  <div
    ref="rootRef"
    class="rs-tree-select-wrap"
    :class="{ 'rs-tree-select-wrap--clearable': allowClear && hasValue && !resolvedDisabled }"
    :style="rootStyle"
  >
    <template v-if="name">
      <template v-if="isMulti">
        <input
          v-for="key in selectedKeys"
          :key="key"
          type="hidden"
          :name="name"
          :value="key"
        />
      </template>
      <input v-else type="hidden" :name="name" :value="selectedKeys[0] ?? ''" />
    </template>

    <button
      :id="triggerId"
      ref="triggerRef"
      type="button"
      :class="triggerClass"
      :disabled="resolvedDisabled"
      :aria-label="ariaLabel"
      aria-haspopup="tree"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? panelId : undefined"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <span v-if="$slots.prefix" class="rs-tree-select__prefix">
        <slot name="prefix" />
      </span>
      <span v-if="display" class="rs-tree-select__value">{{ display }}</span>
      <span v-else class="rs-tree-select__placeholder">{{ resolvedPlaceholder }}</span>
      <span class="rs-tree-select__icon">
        <slot name="suffixIcon">
          <RsIcon name="chevron-down" :size="chevronSize" aria-hidden="true" />
        </slot>
      </span>
    </button>
    <button
      v-if="allowClear && hasValue && !resolvedDisabled"
      type="button"
      class="rs-tree-select__clear"
      :aria-label="t('select.clear')"
      @pointerdown.stop
      @click.stop="onClear"
    >
      <slot name="clearIcon">
        <RsIcon name="x" :size="clearIconSize" aria-hidden="true" />
      </slot>
    </button>

    <Teleport :to="portalTo">
      <div
        v-if="open && !resolvedDisabled"
        :id="panelId"
        ref="panelRef"
        class="rs-tree-select__panel"
        :class="{
          'rs-tree-select__panel--virtual': virtual,
          'rs-tree-select__panel--match-trigger': matchTriggerWidth,
        }"
        :data-placement="popup.placement"
        :data-rs-theme="panelTheme"
        :style="panelStyle"
      >
        <div v-if="$slots.header" class="rs-tree-select__header">
          <slot name="header" />
        </div>
        <div v-if="searchable" class="rs-tree-select__search-wrap">
          <RsIcon name="search" :size="14" class="rs-tree-select__search-icon" aria-hidden="true" />
          <input
            ref="searchInputRef"
            :value="filter"
            type="text"
            class="rs-tree-select__search"
            :placeholder="resolvedSearchPlaceholder"
            :aria-label="resolvedSearchPlaceholder"
            autocomplete="off"
            @input="onSearchInput"
            @keydown="onSearchKeydown"
          />
        </div>
        <div
          class="rs-tree-select__tree"
          :class="{ 'rs-tree-select__tree--virtual': virtual }"
        >
          <RsTree
            :model-value="treeModel"
            :checked-keys="checkable ? selectedKeys : undefined"
            :nodes="treeData"
            :field-names="fieldNames"
            :size="resolvedSize"
            :multiple="multiple"
            :selectable="!checkable"
            :checkable="checkable"
            :check-strictly="checkStrictly"
            :only-check-leaf="onlyCheckLeaf"
            :check-on-click-node="checkable && checkOnClickNode"
            :default-expand-all="defaultExpandAll"
            :show-line="showLine"
            :filter="filter"
            :filter-node="filterNode"
            :highlight="highlight"
            :lazy="lazy"
            :load-data="loadData"
            :virtual="virtual"
            :virtual-threshold="virtualThreshold"
            :height="virtual ? listHeight : undefined"
            block-node
            @update:model-value="onTreeUpdate"
            @check="onCheck"
          >
            <template v-if="$slots.title" #title="slotProps">
              <slot name="title" v-bind="slotProps" />
            </template>
          </RsTree>
        </div>
        <div v-if="$slots.footer" class="rs-tree-select__footer">
          <slot name="footer" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-tree-select-wrap {
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  color-scheme: inherit;
  vertical-align: middle;
}

.rs-tree-select-wrap--clearable .rs-tree-select {
  padding-inline-end: calc(var(--rs-space-md) + 1.25rem);
}

.rs-tree-select {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  width: 100%;
  height: var(--rs-control-height-md);
  min-height: var(--rs-control-height-md);
  padding-block: 0;
  padding-inline: var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-tree-select-radius, var(--rs-radius-sm));
  background: var(--rs-input-bg);
  color: var(--rs-text);
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

.rs-tree-select--ssm {
  height: var(--rs-control-height-ssm);
  min-height: var(--rs-control-height-ssm);
  padding-inline: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-tree-select--sm {
  height: var(--rs-control-height-sm);
  min-height: var(--rs-control-height-sm);
  padding-inline: var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tree-select--md {
  height: var(--rs-control-height-md);
  min-height: var(--rs-control-height-md);
}

.rs-tree-select--lg {
  height: var(--rs-control-height-lg);
  min-height: var(--rs-control-height-lg);
  padding-inline: var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-tree-select:hover:not(:disabled) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}

.rs-tree-select:focus-visible {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-input-bg);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tree-select--disabled,
.rs-tree-select:disabled {
  color: var(--rs-text-disabled);
  cursor: not-allowed;
  background: var(--rs-surface-hover);
  opacity: 0.38;
}

.rs-tree-select__prefix,
.rs-tree-select__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--rs-muted);
}

.rs-tree-select--open .rs-tree-select__icon {
  transform: rotate(180deg);
  transition: transform var(--rs-transition-fast);
}

.rs-tree-select__placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--rs-placeholder);
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-tree-select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-tree-select__clear {
  position: absolute;
  inset-inline-end: var(--rs-space-sm);
  inset-block-start: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: 0;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  transform: translateY(-50%);
  cursor: pointer;
}

.rs-tree-select__clear:hover {
  color: var(--rs-text);
  background: var(--rs-item-hover);
}

@media (prefers-reduced-motion: reduce) {
  .rs-tree-select,
  .rs-tree-select__clear,
  .rs-tree-select--open .rs-tree-select__icon {
    transition: none;
    transform: none;
  }
}
</style>
