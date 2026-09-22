<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, useSlots, watch } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { useRsTabsNav } from '../../../composables/useRsTabsNav'
import { resolveDirMode } from '../../../locale/apply'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import RsContextMenu from '../../context-menu/src/RsContextMenu.vue'
import RsDropdown from '../../dropdown/src/RsDropdown.vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  buildTabContextMenuItems,
  getAdjacentTabValue,
  getEdgeTabValue,
  getNextTabAfterBatchClose,
  getNextTabAfterClose,
  isTabClosable,
  isTabFixed,
  isTabRenamable,
  isVerticalTabsPosition,
  resolveTabKeyboardMove,
  resolveTabsSize,
  resolveTabsToClose,
  shouldRenderTabPanel,
  tabPanelId,
  tabTriggerId,
  type RsTabItem,
  type RsTabsActivation,
  type RsTabsCloseAction,
  type RsTabsContentGap,
  type RsTabsExpose,
  type RsTabsJustify,
  type RsTabsOverflow,
  type RsTabsPosition,
  type RsTabsSize,
  type RsTabsVariant,
} from './tabs-utils'

defineOptions({ name: 'RsTabs' })

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
    /** 标签栏位置。竖排时 overflow=scroll 改为纵向滚动。 */
    tabPosition?: RsTabsPosition
    /**
     * 键盘激活（APG）。automatic 方向键即切换；manual 只移焦点，Enter / Space 才切换。
     */
    activation?: RsTabsActivation
    closable?: boolean
    addable?: boolean
    maxCount?: number
    /** 双击标签重命名 */
    renamable?: boolean
    /** 按住标签拖动排序（整项可拖） */
    draggable?: boolean
    /** 可拖时是否画左侧六点 grip。false 仍可整项拖，只是不显示图标。 */
    showDragHandle?: boolean
    /** 标签过多：scroll 横向/纵向滚动 · dropdown 折叠到「更多」 */
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
    /** 首次激活才挂载面板；已访问过的会保留。destroyInactive 优先。 */
    lazy?: boolean
    /**
     * 离开即卸载面板（默认 true，与原先 Reka TabsContent 一致）。
     * 需要保留表单状态时传 false。
     */
    destroyInactive?: boolean
    id?: string
    ariaLabel?: string
  }>(),
  {
    variant: 'line',
    panelless: false,
    borderless: false,
    contentGap: 'none',
    justify: 'start',
    tabPosition: 'top',
    activation: 'automatic',
    closable: false,
    addable: false,
    renamable: false,
    draggable: false,
    showDragHandle: true,
    overflow: false,
    contextMenu: false,
    lazy: false,
    destroyInactive: true,
  },
)

const emit = defineEmits<{
  change: [value: string]
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
const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const autoId = useId()
const itemsRef = computed(() => props.items)
const overflowMode = computed(() => props.overflow)
const positionRef = computed(() => props.tabPosition)
const hasExtra = computed(() => Boolean(slots.extra))
const canAdd = computed(() => {
  if (!props.addable) return false
  if (props.maxCount == null) return true
  return props.items.length < props.maxCount
})
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const tabSize = computed(() => resolveTabsSize(resolvedSize.value))
const writingDir = computed(() => resolveDirMode(config?.dir.value ?? 'auto', locale.value))
const vertical = computed(() => isVerticalTabsPosition(props.tabPosition))
const rootId = computed(() => props.id || `rs-tabs${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`)
const navLabel = computed(() => props.ariaLabel || t('tabs.label'))
const tabIconPx = computed(() => {
  if (tabSize.value === 'sm') return 12
  if (tabSize.value === 'lg') return 16
  return 14
})
const chromeIconPx = computed(() => (tabSize.value === 'lg' ? 14 : 12))

const navRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const overflowWrapRef = ref<HTMLElement | null>(null)
const extraRef = ref<HTMLElement | null>(null)
const triggerEls = new Map<string, HTMLButtonElement>()

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
  position: positionRef,
})

const renamingValue = ref<string | null>(null)
const renameDraft = ref('')
const dragValue = ref<string | null>(null)
const dragOverValue = ref<string | null>(null)
const focusedValue = ref(model.value)
const visited = ref(new Set<string>(model.value ? [model.value] : []))
let renameInputEl: HTMLInputElement | null = null
let leaveLock = false

watch(model, (value) => {
  focusedValue.value = value
  if (!value || visited.value.has(value)) return
  const next = new Set(visited.value)
  next.add(value)
  visited.value = next
})

watch(
  () => props.items.map((item) => item.value).join('\0'),
  () => {
    const values = new Set(props.items.map((item) => item.value))
    visited.value = new Set([...visited.value].filter((value) => values.has(value)))
  },
)

function setTriggerRef(value: string, el: unknown) {
  if (el instanceof HTMLButtonElement) {
    triggerEls.set(value, el)
    return
  }
  triggerEls.delete(value)
}

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
    return t('tabs.moreCount', { count: hiddenItems.value.length })
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

const contextMenuMap = computed(() => {
  if (!props.contextMenu) return new Map<string, ReturnType<typeof buildTabContextMenuItems>>()
  const map = new Map<string, ReturnType<typeof buildTabContextMenuItems>>()
  for (const item of props.items) {
    map.set(
      item.value,
      buildTabContextMenuItems(props.items, item, props.closable, contextMenuLabels.value),
    )
  }
  return map
})

function closeAriaLabel(item: RsTabItem): string {
  return t('tabs.close', { label: item.label })
}

function contextItemsFor(item: RsTabItem) {
  return contextMenuMap.value.get(item.value) ?? []
}

function labelTitle(item: RsTabItem): string | undefined {
  return item.label.length > 12 ? item.label : undefined
}

function panelVisible(value: string): boolean {
  return shouldRenderTabPanel(
    value,
    model.value,
    visited.value,
    props.lazy,
    props.destroyInactive,
  )
}

function setActive(value: string): void {
  if (model.value === value) return
  model.value = value
  focusedValue.value = value
  emit('change', value)
}

async function onSelectTab(next: string): Promise<boolean> {
  const value = String(next)
  if (value === model.value || leaveLock) return value === model.value
  const target = props.items.find((item) => item.value === value)
  if (target?.disabled) return false
  if (props.beforeLeave) {
    leaveLock = true
    try {
      const ok = await props.beforeLeave(value, model.value)
      if (ok === false) return false
    } finally {
      leaveLock = false
    }
  }
  setActive(value)
  return true
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
    if (next && model.value === closed) setActive(next)
    emit('close', closed)
    return
  }

  const remaining = props.items.filter((item) => !values.includes(item.value))
  const next = getNextTabAfterBatchClose(remaining, model.value, anchor)
  if (next !== undefined && next !== model.value) setActive(next)
  else if (next === undefined && model.value !== '') setActive('')
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

async function moveFocus(value: string): Promise<void> {
  focusedValue.value = value
  await nextTick()
  triggerEls.get(value)?.focus()
  if (props.activation === 'automatic') {
    void onSelectTab(value)
  }
}

function onTabListKeydown(event: KeyboardEvent): void {
  if (renamingValue.value) return
  const move = resolveTabKeyboardMove(event.key, props.tabPosition, writingDir.value === 'rtl')
  if (move === 'start' || move === 'end') {
    const next = getEdgeTabValue(tabBarItems.value, move)
    if (!next) return
    event.preventDefault()
    void moveFocus(next)
    return
  }
  if (typeof move === 'number') {
    const next = getAdjacentTabValue(tabBarItems.value, focusedValue.value || model.value, move)
    if (!next) return
    event.preventDefault()
    void moveFocus(next)
    return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    if (!focusedValue.value) return
    event.preventDefault()
    void onSelectTab(focusedValue.value)
  }
}

function focus(value?: string): void {
  const target = value ?? model.value
  if (!target) return
  focusedValue.value = target
  triggerEls.get(target)?.focus()
}

async function selectTab(value: string): Promise<boolean> {
  return onSelectTab(value)
}

onUnmounted(() => {
  triggerEls.clear()
  renameInputEl = null
  leaveLock = false
})

defineExpose<RsTabsExpose>({
  focus,
  selectTab,
})
</script>

<template>
  <div
    :id="id"
    class="rs-tabs"
    :class="[
      `rs-tabs--${variant}`,
      `rs-tabs--${tabSize}`,
      `rs-tabs--justify-${justify}`,
      `rs-tabs--content-gap-${contentGap}`,
      `rs-tabs--position-${tabPosition}`,
      {
        'rs-tabs--panelless': panelless,
        'rs-tabs--borderless': borderless,
        'rs-tabs--scrollable': useScrollOverflow,
        'rs-tabs--dropdown-overflow': useDropdownOverflow,
        'rs-tabs--has-extra': hasExtra,
        'rs-tabs--draggable': draggable,
        'rs-tabs--vertical': vertical,
      },
    ]"
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
          :class="`rs-tabs__trigger--${tabSize}`"
          :data-tab-value="item.value"
          tabindex="-1"
        >
          <RsIcon v-if="item.icon" :name="item.icon" :size="tabIconPx" class="rs-tabs__icon" />
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
          tabindex="-1"
          @click="scrollNav(-1)"
        >
          <RsIcon name="chevron-left" :size="tabIconPx" />
        </button>

        <div
          ref="navViewportRef"
          class="rs-tabs__nav-viewport"
          @scroll.passive="onNavScroll"
        >
          <div
            class="rs-tabs__list"
            role="tablist"
            :aria-label="navLabel"
            :aria-orientation="vertical ? 'vertical' : 'horizontal'"
            @keydown="onTabListKeydown"
          >
            <RsContextMenu
              v-for="item in tabBarItems"
              :key="item.value"
              :items="contextItemsFor(item)"
              :disabled="!contextMenu"
              @select="(key) => onContextSelect(key, item)"
            >
              <button
                :id="tabTriggerId(rootId, item.value)"
                :ref="(el) => setTriggerRef(item.value, el)"
                type="button"
                role="tab"
                class="rs-tabs__trigger"
                :class="{
                  'rs-tabs__trigger--dragging': dragValue === item.value,
                  'rs-tabs__trigger--drag-over': dragOverValue === item.value,
                  'rs-tabs__trigger--fixed': isTabFixed(item),
                  'rs-tabs__trigger--movable': canDragItem(item),
                }"
                :aria-selected="model === item.value"
                :aria-controls="panelless ? undefined : tabPanelId(rootId, item.value)"
                :tabindex="(focusedValue || model) === item.value ? 0 : -1"
                :disabled="item.disabled"
                :data-state="model === item.value ? 'active' : 'inactive'"
                :data-tab-value="item.value"
                :data-fixed="isTabFixed(item) ? 'true' : undefined"
                :draggable="canDragItem(item) || undefined"
                @click="onSelectTab(item.value)"
                @dragstart="onDragStart(item, $event)"
                @dragover="onDragOver(item, $event)"
                @dragleave="onDragLeave(item)"
                @drop="onDrop(item, $event)"
                @dragend="onDragEnd"
                @auxclick="onTabAuxClick(item, $event)"
              >
                <slot
                  name="tab"
                  :item="item"
                  :active="model === item.value"
                  :disabled="Boolean(item.disabled)"
                >
                  <span
                    v-if="canDragItem(item) && showDragHandle"
                    class="rs-tabs__drag"
                    aria-hidden="true"
                  />
                  <RsIcon
                    v-if="isTabFixed(item)"
                    name="pin"
                    :size="chromeIconPx"
                    class="rs-tabs__pin"
                  />
                  <RsIcon v-if="item.icon" :name="item.icon" :size="tabIconPx" class="rs-tabs__icon" />
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
                    tabindex="-1"
                    draggable="false"
                    @mousedown.stop.prevent
                    @click.stop="onCloseTab(item)"
                    @auxclick.stop.prevent
                    @dragstart.stop.prevent
                  >
                    <RsIcon name="x" :size="chromeIconPx" />
                  </button>
                </slot>
              </button>
            </RsContextMenu>
          </div>
        </div>

        <div
          v-if="showOverflowMenu"
          ref="overflowWrapRef"
          class="rs-tabs__overflow-wrap"
        >
          <RsDropdown
            :items="overflowMenuItems"
            :show-selected="false"
            content-width="fit"
            @select="onOverflowSelect"
          >
            <template #trigger>
              <button
                type="button"
                class="rs-tabs__more"
                :class="{ 'rs-tabs__more--active': activeInHidden }"
                :aria-label="moreLabel"
              >
                <span class="rs-tabs__more-label">{{ moreLabel }}</span>
                <RsIcon name="chevron-down" :size="tabIconPx" class="rs-tabs__more-icon" />
              </button>
            </template>
          </RsDropdown>
        </div>

        <button
          v-if="canAdd"
          type="button"
          class="rs-tabs__add"
          :aria-label="t('tabs.add')"
          @click="onAddTab"
        >
          <RsIcon name="plus" :size="tabIconPx" />
        </button>

        <button
          v-if="useScrollOverflow && canScrollNext"
          type="button"
          class="rs-tabs__scroll-btn rs-tabs__scroll-btn--next"
          :aria-label="t('tabs.scrollNext')"
          tabindex="-1"
          @click="scrollNav(1)"
        >
          <RsIcon name="chevron-right" :size="tabIconPx" />
        </button>

        <div v-if="hasExtra" ref="extraRef" class="rs-tabs__extra">
          <slot name="extra" />
        </div>
      </div>

      <template v-if="!panelless">
        <template v-for="item in items" :key="`panel-${item.value}`">
          <div
            v-if="panelVisible(item.value)"
            :id="tabPanelId(rootId, item.value)"
            role="tabpanel"
            class="rs-tabs__panel"
            :hidden="item.value !== model"
            :data-state="item.value === model ? 'active' : 'inactive'"
            :aria-labelledby="tabTriggerId(rootId, item.value)"
            :tabindex="item.value === model ? 0 : undefined"
          >
            <div class="rs-tabs__panel-inner">
              <slot :name="item.value" />
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style>
.rs-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  --rs-tabs-content-gap: 0px;
}

.rs-tabs__panel[data-state='inactive'],
.rs-tabs__panel[hidden] {
  display: none !important;
}

.rs-tabs__panel {
  outline: none;
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
  gap: var(--rs-tabs-trigger-gap);
  border: none;
  background: transparent;
  color: var(--rs-tabs-text);
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
  opacity: var(--rs-tabs-disabled-opacity);
  cursor: not-allowed;
}

.rs-tabs__trigger--dragging {
  opacity: 0.45;
}

.rs-tabs__trigger--drag-over {
  box-shadow: inset 0 -2px 0 0 var(--rs-tabs-ink);
}

.rs-tabs__trigger--fixed {
  font-weight: var(--rs-font-weight-medium);
}

.rs-tabs--draggable .rs-tabs__trigger--movable,
.rs-tabs--draggable .rs-tabs__trigger--movable:active,
.rs-tabs--draggable .rs-tabs__trigger--dragging {
  cursor: move;
}

.rs-tabs__drag {
  display: inline-flex;
  width: 0.5rem;
  height: 0.75rem;
  flex: 0 0 auto;
  color: var(--rs-tabs-text);
  opacity: 0.45;
  background-image: radial-gradient(circle, currentColor 1px, transparent 1.15px);
  background-size: 3px 3.333px;
  background-repeat: repeat;
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
  max-width: var(--rs-tabs-label-max);
  overflow: hidden;
  text-overflow: ellipsis;
}

.rs-tabs__rename-input {
  width: 6.5rem;
  max-width: var(--rs-tabs-label-max);
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
  background: var(--rs-tabs-badge-bg);
  color: var(--rs-tabs-text);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.rs-tabs__trigger[data-state='active'] .rs-tabs__badge {
  background: var(--rs-tabs-badge-active-bg);
  color: var(--rs-tabs-text-active);
}

.rs-tabs__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rs-tabs-close-size);
  height: var(--rs-tabs-close-size);
  flex: 0 0 auto;
  margin-inline-start: 0.125rem;
  padding: 0;
  border: none;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-tabs-text);
  cursor: pointer;
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
  opacity: var(--rs-tabs-disabled-opacity);
  pointer-events: none;
}

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
    opacity: var(--rs-tabs-disabled-opacity);
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
  color: var(--rs-tabs-text);
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
  color: var(--rs-tabs-text-active);
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
  border-inline-start: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs__overflow-wrap {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  align-self: stretch;
  margin-inline-start: var(--rs-space-xs);
  padding-inline-start: var(--rs-space-sm);
  border-inline-start: 1px solid var(--rs-tabs-border-subtle);
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
  color: var(--rs-tabs-text);
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
  color: var(--rs-tabs-text-hover);
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
  max-width: var(--rs-tabs-more-label-max);
}

.rs-tabs__more-icon {
  flex-shrink: 0;
  color: currentColor;
  opacity: 0.72;
}

.rs-tabs__more--active {
  color: var(--rs-tabs-text-active);
  font-weight: var(--rs-font-weight-medium);
}

/* —— line —— */
.rs-tabs--line .rs-tabs__body {
  border: 1px solid var(--rs-tabs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-tabs-surface);
  overflow: hidden;
}

.rs-tabs--line .rs-tabs__list {
  gap: 0;
  padding: 0 var(--rs-space-sm);
  border-bottom: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__nav {
  align-items: stretch;
  padding-inline: 0;
  border-bottom: 1px solid var(--rs-tabs-border-subtle);
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
  height: var(--rs-tabs-ink-size);
  border-radius: 2px 2px 0 0;
  background: var(--rs-tabs-ink);
}

.rs-tabs--line.rs-tabs--sm .rs-tabs__more {
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-tabs--line.rs-tabs--lg .rs-tabs__more {
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
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

.rs-tabs--line.rs-tabs--lg .rs-tabs__trigger {
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
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

.rs-tabs--line.rs-tabs--lg .rs-tabs__add,
.rs-tabs--line.rs-tabs--lg .rs-tabs__scroll-btn,
.rs-tabs--line.rs-tabs--lg .rs-tabs__extra {
  min-height: var(--rs-control-height-lg);
}

.rs-tabs--line .rs-tabs__trigger:hover:not(:disabled):not([data-state='active']) {
  color: var(--rs-tabs-text-hover);
}

.rs-tabs--line .rs-tabs__trigger[data-state='active'] {
  color: var(--rs-tabs-text-active);
  font-weight: var(--rs-font-weight-medium);
}

.rs-tabs--line .rs-tabs__trigger[data-state='active']::after {
  content: '';
  position: absolute;
  inset-inline: var(--rs-space-sm);
  bottom: 0;
  height: var(--rs-tabs-ink-size);
  border-radius: 2px 2px 0 0;
  background: var(--rs-tabs-ink);
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

.rs-tabs--line.rs-tabs--lg .rs-tabs__panel-inner {
  padding: var(--rs-space-lg) var(--rs-space-xl);
  font-size: var(--rs-font-size-base);
}

.rs-tabs--line.rs-tabs--panelless .rs-tabs__nav {
  border-bottom: 1px solid var(--rs-tabs-border);
  background: var(--rs-tabs-surface);
}

.rs-tabs--line.rs-tabs--panelless .rs-tabs__list {
  border-bottom: none;
}

.rs-tabs--line.rs-tabs--panelless.rs-tabs--has-extra .rs-tabs__extra {
  background: transparent;
}

/* —— segmented —— */
.rs-tabs--segmented .rs-tabs__body {
  border: 1px solid var(--rs-tabs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-tabs-surface);
  overflow: hidden;
}

.rs-tabs--segmented .rs-tabs__list {
  gap: 0.25rem;
  width: fit-content;
  max-width: 100%;
  margin: var(--rs-space-sm);
  padding: 0.25rem;
  border-radius: var(--rs-radius-sm);
  background: var(--rs-tabs-segmented-track);
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

.rs-tabs--segmented.rs-tabs--lg .rs-tabs__trigger {
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-tabs--segmented .rs-tabs__trigger:hover:not(:disabled):not([data-state='active']) {
  color: var(--rs-tabs-text-hover);
  background: var(--rs-tabs-surface);
}

.rs-tabs--segmented .rs-tabs__trigger[data-state='active'] {
  color: var(--rs-tabs-text-active);
  background: var(--rs-tabs-surface);
  font-weight: var(--rs-font-weight-medium);
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
  background: var(--rs-tabs-segmented-track);
}

/* —— card —— */
.rs-tabs--card .rs-tabs__body {
  border: 1px solid var(--rs-tabs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-tabs-surface);
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

.rs-tabs--card.rs-tabs--lg .rs-tabs__trigger {
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-tabs--card .rs-tabs__trigger:hover:not(:disabled):not([data-state='active']) {
  color: var(--rs-tabs-text-hover);
  background: var(--rs-tabs-surface);
  border-color: var(--rs-tabs-border-subtle);
}

.rs-tabs--card .rs-tabs__trigger[data-state='active'] {
  color: var(--rs-tabs-text-active);
  font-weight: var(--rs-font-weight-medium);
  background: var(--rs-tabs-surface);
  border-color: var(--rs-tabs-border);
  margin-bottom: -1px;
  z-index: 1;
}

.rs-tabs--card .rs-tabs__panel-inner {
  padding: var(--rs-space-md) var(--rs-space-lg);
  border-top: 1px solid var(--rs-tabs-border-subtle);
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
  padding-block-start: var(--rs-tabs-content-gap);
}

.rs-tabs--borderless.rs-tabs--card .rs-tabs__panel-inner {
  border-top: none;
}

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

/* —— position：底 / 左 / 右 —— */
.rs-tabs--position-bottom .rs-tabs__body,
.rs-tabs--position-bottom .rs-tabs__shell {
  flex-direction: column-reverse;
}

.rs-tabs--position-left .rs-tabs__body,
.rs-tabs--position-left .rs-tabs__shell,
.rs-tabs--position-right .rs-tabs__body,
.rs-tabs--position-right .rs-tabs__shell {
  flex-direction: row;
  align-items: stretch;
}

.rs-tabs--position-right .rs-tabs__body,
.rs-tabs--position-right .rs-tabs__shell {
  flex-direction: row-reverse;
}

.rs-tabs--vertical .rs-tabs__nav {
  flex-direction: column;
  width: auto;
  min-width: var(--rs-tabs-rail-min);
  max-width: var(--rs-tabs-rail-max);
}

.rs-tabs--vertical .rs-tabs__nav-viewport {
  min-height: 0;
}

.rs-tabs--vertical.rs-tabs--scrollable .rs-tabs__nav-viewport {
  overflow-x: hidden;
  overflow-y: auto;
}

.rs-tabs--vertical .rs-tabs__list {
  flex-direction: column;
  flex-wrap: nowrap;
  width: 100%;
}

.rs-tabs--vertical .rs-tabs__extra {
  margin-inline-start: 0;
  margin-block-start: auto;
  border-inline-start: none;
  border-block-start: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--vertical .rs-tabs__overflow-wrap {
  margin-inline-start: 0;
  padding-inline-start: 0;
  border-inline-start: none;
  border-block-start: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--position-left.rs-tabs--line .rs-tabs__list,
.rs-tabs--position-left.rs-tabs--line.rs-tabs--panelless .rs-tabs__nav,
.rs-tabs--position-left.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__nav {
  border-bottom: none;
  border-inline-end: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--position-right.rs-tabs--line .rs-tabs__list,
.rs-tabs--position-right.rs-tabs--line.rs-tabs--panelless .rs-tabs__nav,
.rs-tabs--position-right.rs-tabs--dropdown-overflow.rs-tabs--line .rs-tabs__nav {
  border-bottom: none;
  border-inline-start: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--position-bottom.rs-tabs--line .rs-tabs__list,
.rs-tabs--position-bottom.rs-tabs--line.rs-tabs--panelless .rs-tabs__nav {
  border-bottom: none;
  border-top: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--vertical.rs-tabs--line .rs-tabs__trigger {
  margin-bottom: 0;
  width: 100%;
}

.rs-tabs--position-left.rs-tabs--line .rs-tabs__trigger[data-state='active']::after {
  inset-inline: auto;
  inset-inline-end: 0;
  top: 18%;
  bottom: 18%;
  width: var(--rs-tabs-ink-size);
  height: auto;
  border-radius: 2px 0 0 2px;
}

.rs-tabs--position-right.rs-tabs--line .rs-tabs__trigger[data-state='active']::after {
  inset-inline: auto;
  inset-inline-start: 0;
  top: 18%;
  bottom: 18%;
  width: var(--rs-tabs-ink-size);
  height: auto;
  border-radius: 0 2px 2px 0;
}

.rs-tabs--position-bottom.rs-tabs--line .rs-tabs__trigger[data-state='active']::after {
  bottom: auto;
  top: 0;
  border-radius: 0 0 2px 2px;
}

.rs-tabs--vertical.rs-tabs--card .rs-tabs__list {
  padding: var(--rs-space-sm) 0 var(--rs-space-sm) var(--rs-space-sm);
}

.rs-tabs--position-right.rs-tabs--card .rs-tabs__list {
  padding: var(--rs-space-sm) var(--rs-space-sm) var(--rs-space-sm) 0;
}

.rs-tabs--vertical.rs-tabs--card .rs-tabs__trigger {
  border-bottom: 1px solid transparent;
  border-radius: var(--rs-radius-sm) 0 0 var(--rs-radius-sm);
  margin-inline-end: -1px;
}

.rs-tabs--position-right.rs-tabs--card .rs-tabs__trigger {
  border-radius: 0 var(--rs-radius-sm) var(--rs-radius-sm) 0;
  margin-inline-end: 0;
  margin-inline-start: -1px;
}

.rs-tabs--vertical.rs-tabs--card .rs-tabs__panel-inner {
  border-top: none;
  border-inline-start: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--position-right.rs-tabs--card .rs-tabs__panel-inner {
  border-inline-start: none;
  border-inline-end: 1px solid var(--rs-tabs-border-subtle);
}

.rs-tabs--vertical .rs-tabs__scroll-btn .rs-icon {
  transform: rotate(90deg);
}

@media (prefers-reduced-motion: reduce) {
  .rs-tabs__trigger,
  .rs-tabs__close,
  .rs-tabs__add,
  .rs-tabs__scroll-btn,
  .rs-tabs__more {
    transition: none;
  }
}
</style>
