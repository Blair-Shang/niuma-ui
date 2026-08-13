<script setup lang="ts">
import { computed, nextTick, ref, useSlots } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from './reka'
import { useRsI18n } from '../composables/useRsI18n'
import { useRsTabsNav } from '../composables/useRsTabsNav'
import RsContextMenu from './RsContextMenu.vue'
import RsIcon from './RsIcon.vue'
import {
  buildTabContextMenuItems,
  getNextTabAfterBatchClose,
  getNextTabAfterClose,
  isTabClosable,
  isTabFixed,
  isTabRenamable,
  resolveTabsToClose,
  type RsTabItem,
  type RsTabsCloseAction,
  type RsTabsContentGap,
  type RsTabsJustify,
  type RsTabsOverflow,
  type RsTabsSize,
  type RsTabsVariant,
} from './tabs-utils'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    items: RsTabItem[]
    size?: RsTabsSize
    variant?: RsTabsVariant
    /**
     * 仅渲染导航栏，不渲染内容面板；内容由业务自行根据 v-model 切换。
     * 需要内容插槽且无外框时，用 borderless 替代（保留具名内容插槽）。
     */
    panelless?: boolean
    /**
     * 无外框：去掉 body/nav 边框与底色，内容区默认无内边距。
     * 适合嵌在 Card 内的登录 Tab 等，业务无需 :deep 清边框。
     */
    borderless?: boolean
    /**
     * 标题栏与内容区间距（borderless 下控制 panel 上边距）。
     * 也可用样式覆盖 --rs-tabs-content-gap。
     */
    contentGap?: RsTabsContentGap
    /**
     * 标签栏对齐方式；stretch/evenly 用于等分铺满，避免业务 :deep 改 list。
     */
    justify?: RsTabsJustify
    closable?: boolean
    addable?: boolean
    maxCount?: number
    /** 双击标签重命名 */
    renamable?: boolean
    /** 按住标签拖动排序（整项可拖，不展示手柄） */
    draggable?: boolean
    /** 标签过多：scroll 横向滚动 · dropdown 折叠到「更多」 */
    overflow?: RsTabsOverflow | false
    /**
     * 顶栏导航右键菜单：关闭 / 关闭其他 / 关闭左侧 / 关闭右侧 / 关闭全部
     *（对齐 GTabs / Chrome / VS Code 多页签）
     */
    contextMenu?: boolean
    /**
     * 切换前校验（对齐 Ant Design Tabs beforeLeave）。
     * 返回 false 时阻止切换；支持异步。
     */
    beforeLeave?: (to: string, from: string) => boolean | void | Promise<boolean | void>
  }>(),
  {
    size: 'md',
    variant: 'line',
    panelless: false,
    borderless: false,
    contentGap: 'none',
    justify: 'start',
    closable: false,
    addable: false,
    renamable: false,
    draggable: false,
    overflow: false,
    contextMenu: false,
  },
)

const emit = defineEmits<{
  close: [value: string]
  /** 批量关闭（右键菜单 / 中键以外的批量动作），values 为待移除的标签 value */
  closeBatch: [values: string[], action: RsTabsCloseAction, anchor?: string]
  add: []
  rename: [value: string, label: string]
  reorder: [dragValue: string, dropValue: string]
  /** 右键菜单选中动作 */
  contextMenu: [action: RsTabsCloseAction, value: string]
}>()

const slots = useSlots()
const { t } = useRsI18n()
const itemsRef = computed(() => props.items)
const overflowMode = computed(() => props.overflow)
const hasExtra = computed(() => Boolean(slots.extra))
const canAdd = computed(() => {
  if (!props.addable) return false
  if (props.maxCount == null) return true
  return props.items.length < props.maxCount
})

const navRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const overflowWrapRef = ref<HTMLElement | null>(null)
const extraRef = ref<HTMLElement | null>(null)

const {
  navViewportRef,
  useDropdownOverflow,
  useScrollOverflow,
  visibleTabItems,
  hiddenItems,
  overflowMenuItems,
  activeInHidden,
  showOverflowMenu,
  canScrollPrev,
  canScrollNext,
  scrollNav,
  onNavScroll,
  scheduleLayout,
} = useRsTabsNav({
  items: itemsRef,
  activeValue: model,
  overflow: overflowMode,
  canAdd,
  navRef,
  measureRef,
  overflowRef: overflowWrapRef,
  extraRef,
  addButtonWidth: 36,
})

const renamingValue = ref<string | null>(null)
const renameDraft = ref('')
const dragValue = ref<string | null>(null)
const dragOverValue = ref<string | null>(null)
let renameInputEl: HTMLInputElement | null = null
let leaveLock = false

function setRenameInputRef(el: unknown, item: RsTabItem) {
  if (!(el instanceof HTMLInputElement) || renamingValue.value !== item.value) return
  renameInputEl = el
  void nextTick(() => {
    renameInputEl?.focus()
    renameInputEl?.select()
  })
}

const tabBarItems = computed(() =>
  useDropdownOverflow.value ? visibleTabItems.value : props.items,
)
const moreLabel = computed(() => {
  if (activeInHidden.value) {
    return props.items.find((item) => item.value === model.value)?.label ?? t('tabs.more')
  }
  if (hiddenItems.value.length > 0) {
    return `${t('tabs.more')} (${hiddenItems.value.length})`
  }
  return t('tabs.more')
})

const contextMenuLabels = computed(() => ({
  close: t('tabs.closeTab'),
  closeOthers: t('tabs.closeOthers'),
  closeLeft: t('tabs.closeLeft'),
  closeRight: t('tabs.closeRight'),
  closeAll: t('tabs.closeAll'),
}))

function closeAriaLabel(item: RsTabItem): string {
  return t('tabs.close', 'Close {label}').replace('{label}', item.label)
}

function contextItemsFor(item: RsTabItem) {
  return buildTabContextMenuItems(
    props.items,
    item,
    props.closable,
    contextMenuLabels.value,
  )
}

function labelTitle(item: RsTabItem): string | undefined {
  return item.label.length > 12 ? item.label : undefined
}

async function onSelectTab(next: string | number): Promise<void> {
  const value = String(next)
  if (value === model.value || leaveLock) return
  if (props.beforeLeave) {
    leaveLock = true
    try {
      const ok = await props.beforeLeave(value, model.value)
      if (ok === false) return
    } finally {
      leaveLock = false
    }
  }
  model.value = value
}

function applyCloseValues(
  values: string[],
  action: RsTabsCloseAction,
  anchor?: string,
): void {
  if (!values.length) return
  if (action === 'close' && values.length === 1) {
    const closed = values[0]!
    const next = getNextTabAfterClose(props.items, closed, model.value)
    if (next && model.value === closed) model.value = next
    emit('close', closed)
    return
  }

  const remaining = props.items.filter((item) => !values.includes(item.value))
  const next = getNextTabAfterBatchClose(remaining, model.value, anchor)
  if (next !== undefined && next !== model.value) model.value = next
  else if (next === undefined) model.value = ''
  emit('closeBatch', values, action, anchor)
}

function onCloseTab(item: RsTabItem): void {
  if (item.disabled || !isTabClosable(item, props.closable)) return
  applyCloseValues([item.value], 'close', item.value)
}

function onContextSelect(actionKey: string, item: RsTabItem): void {
  const action = actionKey as RsTabsCloseAction
  if (!['close', 'others', 'left', 'right', 'all'].includes(action)) return
  const values = resolveTabsToClose(props.items, action, item.value, props.closable)
  emit('contextMenu', action, item.value)
  applyCloseValues(values, action, item.value)
}

function onAddTab(): void {
  if (!canAdd.value) return
  emit('add')
}

function onOverflowSelect(value: string): void {
  void onSelectTab(value)
}

/** 中键关闭（对齐浏览器 / VS Code 页签） */
function onTabAuxClick(item: RsTabItem, event: MouseEvent): void {
  if (event.button !== 1) return
  event.preventDefault()
  onCloseTab(item)
}

/** 纵向滚轮转为横向滚动（scroll 溢出模式） */
function onNavWheel(event: WheelEvent): void {
  if (!useScrollOverflow.value) return
  const viewport = navViewportRef.value
  if (!viewport) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  if (viewport.scrollWidth <= viewport.clientWidth) return
  event.preventDefault()
  viewport.scrollLeft += event.deltaY
  onNavScroll()
}

async function startRename(item: RsTabItem): Promise<void> {
  if (!isTabRenamable(item, props.renamable) || item.disabled) return
  renamingValue.value = item.value
  renameDraft.value = item.label
}

function cancelRename(): void {
  renamingValue.value = null
  renameDraft.value = ''
  renameInputEl = null
}

function commitRename(item: RsTabItem): void {
  if (renamingValue.value !== item.value) return
  const label = renameDraft.value.trim()
  if (label && label !== item.label) {
    emit('rename', item.value, label)
  }
  cancelRename()
}

function canDragItem(item: RsTabItem): boolean {
  return props.draggable && !item.disabled && !isTabFixed(item)
}

function onDragStart(item: RsTabItem, event: DragEvent): void {
  if (!canDragItem(item)) {
    event.preventDefault()
    return
  }
  // 关闭 / 重命名控件上不启动拖拽，避免误触
  const target = event.target
  if (
    target instanceof Element &&
    target.closest('.rs-tabs__close, .rs-tabs__rename-input')
  ) {
    event.preventDefault()
    return
  }
  dragValue.value = item.value
  event.dataTransfer?.setData('text/plain', item.value)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(item: RsTabItem, event: DragEvent): void {
  if (!props.draggable || !dragValue.value || dragValue.value === item.value) return
  if (isTabFixed(item)) return
  event.preventDefault()
  dragOverValue.value = item.value
}

function onDragLeave(item: RsTabItem): void {
  if (dragOverValue.value === item.value) dragOverValue.value = null
}

function onDrop(item: RsTabItem, event: DragEvent): void {
  if (!props.draggable || !dragValue.value) return
  event.preventDefault()
  if (dragValue.value !== item.value && !isTabFixed(item)) {
    emit('reorder', dragValue.value, item.value)
  }
  dragValue.value = null
  dragOverValue.value = null
  scheduleLayout()
}

function onDragEnd(): void {
  dragValue.value = null
  dragOverValue.value = null
}
</script>

<template>
  <TabsRoot
    :model-value="model"
    class="rs-tabs"
    :class="[
      `rs-tabs--${variant}`,
      `rs-tabs--${size}`,
      `rs-tabs--justify-${justify}`,
      `rs-tabs--content-gap-${contentGap}`,
      {
        'rs-tabs--panelless': panelless,
        'rs-tabs--borderless': borderless,
        'rs-tabs--scrollable': useScrollOverflow,
        'rs-tabs--dropdown-overflow': useDropdownOverflow,
        'rs-tabs--has-extra': hasExtra,
        'rs-tabs--draggable': draggable,
      },
    ]"
    :aria-label="t('tabs.label')"
    @update:model-value="onSelectTab"
  >
    <div :class="panelless ? 'rs-tabs__shell' : 'rs-tabs__body'">
      <div
        v-if="useDropdownOverflow"
        ref="measureRef"
        class="rs-tabs__measure"
        aria-hidden="true"
      >
        <button
          v-for="item in items"
          :key="`measure-${item.value}`"
          type="button"
          class="rs-tabs__trigger rs-tabs__measure-trigger"
          :class="`rs-tabs__trigger--${size}`"
          :data-tab-value="item.value"
          tabindex="-1"
        >
          <RsIcon v-if="item.icon" :name="item.icon" :size="14" class="rs-tabs__icon" />
          <span class="rs-tabs__label">{{ item.label }}</span>
          <span v-if="item.badge != null && item.badge !== ''" class="rs-tabs__badge">
            {{ item.badge }}
          </span>
        </button>
      </div>

      <div ref="navRef" class="rs-tabs__nav">
        <button
          v-if="useScrollOverflow && canScrollPrev"
          type="button"
          class="rs-tabs__scroll-btn rs-tabs__scroll-btn--prev"
          :aria-label="t('tabs.scrollPrev')"
          @click="scrollNav(-1)"
        >
          <RsIcon name="chevron-left" :size="14" />
        </button>

        <div
          ref="navViewportRef"
          class="rs-tabs__nav-viewport"
          @scroll="onNavScroll"
          @wheel="onNavWheel"
        >
          <TabsList class="rs-tabs__list">
            <RsContextMenu
              v-for="item in tabBarItems"
              :key="item.value"
              :items="contextItemsFor(item)"
              :disabled="!contextMenu"
              @select="(key) => onContextSelect(key, item)"
            >
              <TabsTrigger
                :value="item.value"
                :disabled="item.disabled"
                class="rs-tabs__trigger"
                :class="{
                  'rs-tabs__trigger--dragging': dragValue === item.value,
                  'rs-tabs__trigger--drag-over': dragOverValue === item.value,
                  'rs-tabs__trigger--fixed': isTabFixed(item),
                  'rs-tabs__trigger--movable': canDragItem(item),
                }"
                :data-tab-value="item.value"
                :data-fixed="isTabFixed(item) ? 'true' : undefined"
                :draggable="canDragItem(item) || undefined"
                @dragstart="onDragStart(item, $event)"
                @dragover="onDragOver(item, $event)"
                @dragleave="onDragLeave(item)"
                @drop="onDrop(item, $event)"
                @dragend="onDragEnd"
                @auxclick="onTabAuxClick(item, $event)"
              >
                <RsIcon
                  v-if="isTabFixed(item)"
                  name="pin"
                  :size="12"
                  class="rs-tabs__pin"
                />
                <RsIcon v-if="item.icon" :name="item.icon" :size="14" class="rs-tabs__icon" />
                <input
                  v-if="renamingValue === item.value"
                  :ref="(el) => setRenameInputRef(el, item)"
                  v-model="renameDraft"
                  class="rs-tabs__rename-input"
                  :aria-label="t('tabs.rename')"
                  :placeholder="t('tabs.renamePlaceholder')"
                  draggable="false"
                  @keydown.enter.prevent="commitRename(item)"
                  @keydown.escape.prevent="cancelRename"
                  @blur="commitRename(item)"
                  @mousedown.stop
                  @click.stop
                  @dblclick.stop
                  @dragstart.stop.prevent
                />
                <span
                  v-else
                  class="rs-tabs__label"
                  :title="labelTitle(item)"
                  @dblclick.stop="startRename(item)"
                >
                  {{ item.label }}
                </span>
                <span v-if="item.badge != null && item.badge !== ''" class="rs-tabs__badge">
                  {{ item.badge }}
                </span>
                <button
                  v-if="isTabClosable(item, closable)"
                  type="button"
                  class="rs-tabs__close"
                  :aria-label="closeAriaLabel(item)"
                  :disabled="item.disabled"
                  draggable="false"
                  @mousedown.stop.prevent
                  @click.stop="onCloseTab(item)"
                  @auxclick.stop.prevent
                  @dragstart.stop.prevent
                >
                  <RsIcon name="x" :size="12" />
                </button>
              </TabsTrigger>
            </RsContextMenu>
          </TabsList>
        </div>

        <div
          v-if="showOverflowMenu"
          ref="overflowWrapRef"
          class="rs-tabs__overflow-wrap"
        >
          <DropdownMenuRoot>
            <DropdownMenuTrigger
              class="rs-tabs__more"
              :class="{ 'rs-tabs__more--active': activeInHidden }"
            >
              <span class="rs-tabs__more-label">{{ moreLabel }}</span>
              <RsIcon name="chevron-down" :size="14" class="rs-tabs__more-icon" />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                class="rs-tabs__more-menu"
                :side-offset="4"
                align="end"
              >
                <DropdownMenuItem
                  v-for="item in overflowMenuItems"
                  :key="item.value"
                  class="rs-tabs__more-item"
                  :class="{ 'rs-tabs__more-item--active': model === item.value }"
                  @select="onOverflowSelect(item.value)"
                >
                  {{ item.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>

        <button
          v-if="canAdd"
          type="button"
          class="rs-tabs__add"
          :aria-label="t('tabs.add')"
          @click="onAddTab"
        >
          <RsIcon name="plus" :size="14" />
        </button>

        <button
          v-if="useScrollOverflow && canScrollNext"
          type="button"
          class="rs-tabs__scroll-btn rs-tabs__scroll-btn--next"
          :aria-label="t('tabs.scrollNext')"
          @click="scrollNav(1)"
        >
          <RsIcon name="chevron-right" :size="14" />
        </button>

        <div v-if="hasExtra" ref="extraRef" class="rs-tabs__extra">
          <slot name="extra" />
        </div>
      </div>

      <template v-if="!panelless">
        <TabsContent
          v-for="item in items"
          :key="`panel-${item.value}`"
          :value="item.value"
          class="rs-tabs__panel"
        >
          <div class="rs-tabs__panel-inner">
            <slot :name="item.value" />
          </div>
        </TabsContent>
      </template>
    </div>
  </TabsRoot>
</template>

<style>
.rs-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  /* 标题与内容间距；可由 contentGap 或样式覆盖 */
  --rs-tabs-content-gap: 0px;
}

/* 非激活面板必须彻底隐藏，避免多页内容叠层 */
.rs-tabs__panel[data-state='inactive'],
.rs-tabs__panel[hidden] {
  display: none !important;
}

.rs-tabs__shell,
.rs-tabs__body {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.rs-tabs__nav {
  display: flex;
  align-items: stretch;
  min-width: 0;
  width: 100%;
}

.rs-tabs__nav-viewport {
  flex: 1;
  min-width: 0;
}

.rs-tabs--dropdown-overflow .rs-tabs__nav-viewport {
  overflow: hidden;
}

.rs-tabs__measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
  white-space: nowrap;
}

.rs-tabs__measure-trigger {
  pointer-events: none;
}

.rs-tabs--scrollable .rs-tabs__nav-viewport {
  overflow-x: auto;
  scrollbar-width: none;
}

.rs-tabs--scrollable .rs-tabs__nav-viewport::-webkit-scrollbar {
  display: none;
}

.rs-tabs__list {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-tabs--scrollable .rs-tabs__list,
.rs-tabs--dropdown-overflow .rs-tabs__list {
  flex-wrap: nowrap;
}

.rs-tabs__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: none;
  background: transparent;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    background var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast);
}

.rs-tabs__trigger:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
  border-radius: var(--rs-radius-xs);
}

.rs-tabs__trigger:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.rs-tabs__trigger--dragging {
  opacity: 0.45;
}

.rs-tabs__trigger--drag-over {
  box-shadow: inset 0 -2px 0 0 var(--rs-primary);
}

.rs-tabs__trigger--fixed {
  font-weight: 500;
}

.rs-tabs--draggable .rs-tabs__trigger--movable {
  cursor: grab;
}

.rs-tabs--draggable .rs-tabs__trigger--movable:active,
.rs-tabs--draggable .rs-tabs__trigger--dragging {
  cursor: grabbing;
}

.rs-tabs__pin {
  flex: 0 0 auto;
  color: var(--rs-placeholder);
  opacity: 0.85;
}

.rs-tabs__icon {
  flex: 0 0 auto;
  color: currentColor;
}

.rs-tabs__label {
  min-width: 0;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rs-tabs__rename-input {
  width: 6.5rem;
  max-width: 12rem;
  min-height: 1.5rem;
  padding: 0 0.375rem;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-xs);
  background: var(--rs-bg);
  color: var(--rs-text);
  font: inherit;
}

.rs-tabs__rename-input:focus {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tabs__badge {
  padding: 0 0.375rem;
  border-radius: var(--rs-radius-full);
  background: var(--rs-surface-hover);
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.rs-tabs__trigger[data-state='active'] .rs-tabs__badge {
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
  color: var(--rs-primary);
}

.rs-tabs__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  margin-inline-start: 0.125rem;
  padding: 0;
  border: none;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  /* 非激活：默认隐藏，悬停标签时再显示；占位保留避免宽度跳动 */
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--rs-transition-fast),
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-tabs__trigger:hover .rs-tabs__close,
.rs-tabs__trigger:focus-within .rs-tabs__close,
.rs-tabs__trigger[data-state='active'] .rs-tabs__close {
  opacity: 1;
  pointer-events: auto;
}

.rs-tabs__close:hover:not(:disabled) {
  background: var(--rs-surface-hover);
  color: var(--rs-text);
}

.rs-tabs__close:focus-visible {
  outline: none;
  opacity: 1;
  pointer-events: auto;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tabs__close:disabled {
  cursor: not-allowed;
}

.rs-tabs__trigger:hover .rs-tabs__close:disabled,
.rs-tabs__trigger:focus-within .rs-tabs__close:disabled,
.rs-tabs__trigger[data-state='active'] .rs-tabs__close:disabled {
  opacity: 0.38;
  pointer-events: none;
}

/* 触摸设备无悬停：可关闭标签始终显示关闭按钮 */
@media (hover: none) {
  .rs-tabs__close {
    opacity: 0.85;
    pointer-events: auto;
  }

  .rs-tabs__trigger[data-state='active'] .rs-tabs__close {
    opacity: 1;
  }

  .rs-tabs__close:disabled,
  .rs-tabs__trigger[data-state='active'] .rs-tabs__close:disabled {
    opacity: 0.38;
    pointer-events: none;
  }
}

.rs-tabs__add,
.rs-tabs__scroll-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  margin: 0;
  padding: 0 var(--rs-space-sm);
  border: none;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-tabs__add:focus-visible,
.rs-tabs__scroll-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-tabs__add:hover,
.rs-tabs__scroll-btn:hover {
  color: var(--rs-primary);
  background: var(--rs-surface-hover);
}

.rs-tabs__extra {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: stretch;
  gap: var(--rs-space-xs);
  margin-inline-start: auto;
  padding-inline: var(--rs-space-sm);
  border-inline-start: 1px solid var(--rs-border-subtle);
}

.rs-tabs__overflow-wrap {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  align-self: stretch;
  margin-inline-start: var(--rs-space-xs);
  padding-inline-start: var(--rs-space-sm);
  border-inline-start: 1px solid var(--rs-border-subtle);
}

.rs-tabs__more {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  white-space: nowrap;
  cursor: pointer;
  position: relative;
  transition:
    color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-tabs__more:hover {
  color: var(--rs-text);
}

.rs-tabs__more:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
  border-radius: var(--rs-radius-xs);
}

.rs-tabs__more-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 7rem;
}

.rs-tabs__more-icon {
  flex-shrink: 0;
  color: currentColor;
  opacity: 0.72;
}

.rs-tabs__more--active {
  color: var(--rs-primary);
  font-weight: 500;
}

.rs-tabs__more-menu {
  z-index: var(--rs-z-dropdown);
  min-width: 8rem;
  max-width: 14rem;
  padding: var(--rs-space-xs);
  border-radius: var(--rs-radius);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow);
  outline: none;
}

.rs-tabs__more-item {
  display: flex;
  align-items: center;
  padding: var(--rs-space-sm) var(--rs-space-md);
  border-radius: var(--rs-radius-sm);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  color: var(--rs-text);
  cursor: pointer;
  outline: none;
}

.rs-tabs__more-item[data-highlighted] {
  background: var(--rs-item-hover);
  color: var(--rs-text);
}

.rs-tabs__more-item--active {
  color: var(--rs-primary);
  font-weight: 500;
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
}

/* —— line —— */
.rs-tabs--line .rs-tabs__body {
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  overflow: hidden;
}

.rs-tabs--line .rs-tabs__list {
  gap: 0;
  padding: 0 var(--rs-space-sm);
  border-bottom: 1px solid var(--rs-border-subtle);
}

.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__nav {
  align-items: stretch;
  padding-inline: 0;
  border-bottom: 1px solid var(--rs-border-subtle);
}

.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__list {
  flex: 1;
  min-width: 0;
  padding-inline: var(--rs-space-sm);
  border-bottom: none;
}

.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__body {
  padding-top: 0;
}

.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__more {
  margin-bottom: -1px;
}

.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__more--active::after {
  content: '';
  position: absolute;
  inset-inline: var(--rs-space-sm);
  bottom: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--rs-primary);
}

.rs-tabs--line.rs-tabs--sm .rs-tabs__more {
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tabs--line .rs-tabs__trigger {
  position: relative;
  margin-bottom: -1px;
  border-radius: 0;
}

.rs-tabs--line.rs-tabs--sm .rs-tabs__trigger {
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tabs--line.rs-tabs--md .rs-tabs__trigger {
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
}

.rs-tabs--line .rs-tabs__add,
.rs-tabs--line .rs-tabs__scroll-btn,
.rs-tabs--line .rs-tabs__extra {
  min-height: var(--rs-control-height-md);
}

.rs-tabs--line.rs-tabs--sm .rs-tabs__add,
.rs-tabs--line.rs-tabs--sm .rs-tabs__scroll-btn,
.rs-tabs--line.rs-tabs--sm .rs-tabs__extra {
  min-height: var(--rs-control-height-sm);
}

.rs-tabs--line .rs-tabs__trigger:hover:not(:disabled):not([data-state='active']) {
  color: var(--rs-text);
}

.rs-tabs--line .rs-tabs__trigger[data-state='active'] {
  color: var(--rs-primary);
  font-weight: 500;
}

.rs-tabs--line .rs-tabs__trigger[data-state='active']::after {
  content: '';
  position: absolute;
  inset-inline: var(--rs-space-sm);
  bottom: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--rs-primary);
}

.rs-tabs--line .rs-tabs__panel-inner {
  padding: var(--rs-space-md) var(--rs-space-lg);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.rs-tabs--line.rs-tabs--sm .rs-tabs__panel-inner {
  padding: var(--rs-space-sm) var(--rs-space-md);
  font-size: var(--rs-font-size-xs);
}

.rs-tabs--line.rs-tabs--panelless .rs-tabs__nav {
  border-bottom: 1px solid var(--rs-border);
  background: var(--rs-surface);
}

.rs-tabs--line.rs-tabs--panelless .rs-tabs__list {
  border-bottom: none;
}

.rs-tabs--line.rs-tabs--panelless.rs-tabs--has-extra .rs-tabs__extra {
  background: transparent;
}

/* —— segmented —— */
.rs-tabs--segmented .rs-tabs__body {
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  overflow: hidden;
}

.rs-tabs--segmented .rs-tabs__list {
  gap: 0.25rem;
  width: fit-content;
  max-width: 100%;
  margin: var(--rs-space-sm);
  padding: 0.25rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface-hover);
}

.rs-tabs--segmented .rs-tabs__trigger {
  border-radius: var(--rs-radius-xs);
}

.rs-tabs--segmented.rs-tabs--sm .rs-tabs__trigger {
  min-height: var(--rs-control-height-sm);
  padding: 0 0.5rem;
  font-size: var(--rs-font-size-xs);
}

.rs-tabs--segmented.rs-tabs--md .rs-tabs__trigger {
  min-height: var(--rs-control-height-md);
  padding: 0 0.75rem;
}

.rs-tabs--segmented .rs-tabs__trigger:hover:not(:disabled):not([data-state='active']) {
  color: var(--rs-text);
  background: var(--rs-surface);
}

.rs-tabs--segmented .rs-tabs__trigger[data-state='active'] {
  color: var(--rs-primary);
  background: var(--rs-surface);
  font-weight: 500;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--rs-text) 8%, transparent);
}

.rs-tabs--segmented .rs-tabs__panel-inner {
  padding: var(--rs-space-md) var(--rs-space-lg);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.rs-tabs--segmented.rs-tabs--panelless .rs-tabs__list {
  margin: 0;
  background: var(--rs-surface-hover);
}

/* —— card（Ant editable-card） —— */
.rs-tabs--card .rs-tabs__body {
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  overflow: hidden;
}

.rs-tabs--card .rs-tabs__list {
  gap: 0.25rem;
  padding: var(--rs-space-sm) var(--rs-space-sm) 0;
}

.rs-tabs--card .rs-tabs__trigger {
  position: relative;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--rs-radius-sm) var(--rs-radius-sm) 0 0;
  background: var(--rs-surface-hover);
}

.rs-tabs--card.rs-tabs--sm .rs-tabs__trigger {
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tabs--card.rs-tabs--md .rs-tabs__trigger {
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
}

.rs-tabs--card .rs-tabs__trigger:hover:not(:disabled):not([data-state='active']) {
  color: var(--rs-text);
  background: var(--rs-surface);
  border-color: var(--rs-border-subtle);
}

.rs-tabs--card .rs-tabs__trigger[data-state='active'] {
  color: var(--rs-primary);
  font-weight: 500;
  background: var(--rs-surface);
  border-color: var(--rs-border);
  margin-bottom: -1px;
  z-index: 1;
}

.rs-tabs--card .rs-tabs__panel-inner {
  padding: var(--rs-space-md) var(--rs-space-lg);
  border-top: 1px solid var(--rs-border-subtle);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
}

.rs-tabs--card.rs-tabs--panelless .rs-tabs__list {
  padding-bottom: var(--rs-space-sm);
}

.rs-tabs--card .rs-tabs__extra {
  align-self: center;
  margin-bottom: 0;
  border-inline-start: none;
}

/* —— contentGap：标题与内容间距（borderless 默认 0，业务可设 sm/md/lg/xl） —— */
.rs-tabs--content-gap-sm {
  --rs-tabs-content-gap: var(--rs-space-sm);
}

.rs-tabs--content-gap-md {
  --rs-tabs-content-gap: var(--rs-space-md);
}

.rs-tabs--content-gap-lg {
  --rs-tabs-content-gap: var(--rs-space-lg);
}

.rs-tabs--content-gap-xl {
  --rs-tabs-content-gap: var(--rs-space-xl);
}

/* —— borderless：无外框 / 无导航底色（业务用具名插槽，无需 :deep） —— */
.rs-tabs--borderless.rs-tabs--line .rs-tabs__body,
.rs-tabs--borderless.rs-tabs--segmented .rs-tabs__body,
.rs-tabs--borderless.rs-tabs--card .rs-tabs__body {
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.rs-tabs--borderless .rs-tabs__shell,
.rs-tabs--borderless .rs-tabs__nav,
.rs-tabs--borderless .rs-tabs__list,
.rs-tabs--borderless .rs-tabs__nav-viewport {
  border: none;
  border-bottom: none;
  background: transparent;
  box-shadow: none;
}

.rs-tabs--borderless.rs-tabs--line .rs-tabs__list,
.rs-tabs--borderless.rs-tabs--line.rs-tabs--panelless .rs-tabs__nav,
.rs-tabs--borderless.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__nav {
  border-bottom: none;
  background: transparent;
  padding-inline: 0;
}

.rs-tabs--borderless .rs-tabs__panel,
.rs-tabs--borderless .rs-tabs__panel-inner {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.rs-tabs--borderless .rs-tabs__panel-inner {
  padding-top: var(--rs-tabs-content-gap);
}

.rs-tabs--borderless.rs-tabs--card .rs-tabs__panel-inner {
  border-top: none;
}

/* —— justify：标签栏对齐（stretch/evenly 铺满，免业务 :deep） —— */
.rs-tabs--justify-center .rs-tabs__list {
  justify-content: center;
}

.rs-tabs--justify-evenly .rs-tabs__list {
  width: 100%;
  justify-content: space-evenly;
}

.rs-tabs--justify-stretch .rs-tabs__list {
  display: flex;
  width: 100%;
  justify-content: stretch;
}

.rs-tabs--justify-stretch .rs-tabs__trigger {
  flex: 1 1 0;
  justify-content: center;
}

.rs-tabs--justify-stretch.rs-tabs--line .rs-tabs__trigger[data-state='active']::after {
  inset-inline: 18%;
}
</style>
