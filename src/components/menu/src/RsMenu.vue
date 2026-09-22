<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import {
  findMenuParentKeys,
  mergeOpenKeysWithParents,
  partitionMenuEntries,
  toggleMenuOpenKeys,
  type RsMenuExpose,
  type RsMenuGetPopupContainer,
  type RsMenuItem,
  type RsMenuItems as RsMenuData,
  type RsMenuMode,
  type RsMenuTriggerAction,
} from './menu-utils'
import RsMenuItems from './RsMenuItems.vue'

defineOptions({ name: 'RsMenu' })

export type {
  RsMenuExpose,
  RsMenuGetPopupContainer,
  RsMenuItem,
  RsMenuItemGroup,
  RsMenuItemSlot,
  RsMenuItems,
  RsMenuInstance,
  RsMenuMode,
  RsMenuTriggerAction,
} from './menu-utils'

const model = defineModel<string>()
const openKeys = defineModel<string[]>('openKeys', { default: () => [] })

const props = withDefaults(
  defineProps<{
    items: RsMenuData
    mode?: RsMenuMode
    collapsed?: boolean
    /** 选中叶子时是否同时高亮祖先父级（仅字体色，无背景）；默认 false 只高亮叶子 */
    highlightParent?: boolean
    /** 同层只展开一个子菜单 */
    accordion?: boolean
    /** 水平子菜单展开方式；垂直内联仍是点击。默认 click，兼容原行为。 */
    triggerSubMenuAction?: RsMenuTriggerAction
    size?: RsComponentSize
    radius?: RsRadius
    /** 垂直缩进（px），写入 --rs-menu-indent。未传走 token。 */
    indent?: number
    ariaLabel?: string
    id?: string
    getPopupContainer?: RsMenuGetPopupContainer
  }>(),
  {
    mode: 'vertical',
    collapsed: false,
    highlightParent: false,
    accordion: false,
    triggerSubMenuAction: 'click',
  },
)

const emit = defineEmits<{
  select: [key: string]
  click: [item: RsMenuItem, event: MouseEvent]
  openChange: [keys: string[]]
}>()

const { t } = useRsI18n()
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const iconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])

/** collapsed 仅对垂直模式生效；水平模式忽略，避免空气泡子菜单 */
const isCollapsedVertical = computed(
  () => props.mode === 'vertical' && props.collapsed,
)

const navLabel = computed(() => props.ariaLabel || t('menu.label'))
const renderBlocks = computed(() => partitionMenuEntries(props.items))

const rootStyle = computed(() => ({
  '--rs-menu-item-radius': rsRadiusCss(resolvedRadius.value),
  ...(props.indent != null ? { '--rs-menu-indent': `${Math.max(0, props.indent)}px` } : {}),
}))

function onSelect(key: string) {
  model.value = key
  emit('select', key)
}

function onToggleOpen(key: string, open: boolean) {
  const next = toggleMenuOpenKeys(
    openKeys.value,
    key,
    open,
    props.items,
    props.accordion,
  )
  if (
    next.length === openKeys.value.length &&
    next.every((item, index) => item === openKeys.value[index])
  ) {
    return
  }
  openKeys.value = next
  emit('openChange', next)
}

watch(
  () => model.value,
  (key) => {
    if (!key) {
      return
    }
    const parents = findMenuParentKeys(props.items, key)
    const next = mergeOpenKeysWithParents(openKeys.value, parents)
    if (next === openKeys.value) {
      return
    }
    openKeys.value = next
  },
  { immediate: true },
)

const exposeApi: RsMenuExpose = {
  focus() {
    const first = rootRef.value?.querySelector<HTMLElement>(
      '.rs-menu__item:not(:disabled):not([aria-disabled="true"])',
    )
    first?.focus()
  },
  blur() {
    const active = rootRef.value?.querySelector<HTMLElement>('.rs-menu__item:focus')
    active?.blur()
  },
}

defineExpose(exposeApi)
</script>

<template>
  <nav
    :id="id"
    ref="rootRef"
    class="rs-menu"
    :class="[
      `rs-menu--${mode}`,
      `rs-menu--${resolvedSize}`,
      { 'rs-menu--collapsed': isCollapsedVertical },
    ]"
    :style="rootStyle"
    :aria-label="navLabel"
  >
    <ul class="rs-menu__root-list">
      <li
        v-for="block in renderBlocks"
        :key="block.key"
        class="rs-menu__group"
        :class="{ 'rs-menu__group--plain': block.type === 'items' }"
      >
        <span
          v-if="block.type === 'group' && !isCollapsedVertical"
          class="rs-menu__group-label"
        >{{ block.entry.label }}</span>
        <RsMenuItems
          :items="block.type === 'group' ? block.entry.children : block.items"
          :active-key="model"
          :open-keys="openKeys"
          :collapsed="isCollapsedVertical"
          :mode="mode"
          :highlight-parent="highlightParent"
          :trigger-sub-menu-action="triggerSubMenuAction"
          :icon-size="iconSize"
          :get-popup-container="getPopupContainer"
          @select="onSelect"
          @click="(item, event) => emit('click', item, event)"
          @toggle-open="onToggleOpen"
        >
          <template v-if="$slots.item" #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
          <template v-if="$slots.icon" #icon="slotProps">
            <slot name="icon" v-bind="slotProps" />
          </template>
          <template v-if="$slots.extra" #extra="slotProps">
            <slot name="extra" v-bind="slotProps" />
          </template>
        </RsMenuItems>
      </li>
    </ul>
  </nav>
</template>

<style>
.rs-menu {
  display: block;
}
.rs-menu__root-list,
.rs-menu__list {
  display: flex;
  flex-direction: column;
  gap: var(--rs-menu-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}
.rs-menu--horizontal > .rs-menu__root-list {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
}
.rs-menu--ssm {
  --rs-menu-item-height: var(--rs-control-height-ssm);
  --rs-menu-item-font-size: var(--rs-font-size-xs);
}
.rs-menu--sm {
  --rs-menu-item-height: var(--rs-control-height-sm);
  --rs-menu-item-font-size: var(--rs-font-size-xs);
}
.rs-menu--lg {
  --rs-menu-item-height: var(--rs-control-height-lg);
  --rs-menu-item-font-size: var(--rs-font-size-base);
}
.rs-menu__group-label {
  display: block;
  padding: var(--rs-space-sm) var(--rs-menu-item-pad-inline) var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-menu-group-label-fg);
  letter-spacing: 0.04em;
  line-height: var(--rs-line-height-tight);
  user-select: none;
}
.rs-menu--collapsed .rs-menu__group-label {
  display: none;
}
.rs-menu__group {
  list-style: none;
}
.rs-menu__group--plain > .rs-menu__list {
  margin: 0;
}
.rs-menu__entry {
  list-style: none;
}
.rs-menu__node {
  list-style: none;
}
.rs-menu__divider {
  display: block;
  height: 0;
  border: none;
  border-block-start: 1px solid var(--rs-border);
  margin-block: var(--rs-space-xs);
  margin-inline: var(--rs-menu-item-pad-inline);
}
.rs-menu--horizontal > .rs-menu__root-list > .rs-menu__group {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
}
.rs-menu__collapsible {
  display: block;
}
.rs-menu__item {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  width: 100%;
  min-height: var(--rs-menu-item-height);
  padding-block: 0;
  padding-inline-end: var(--rs-menu-item-pad-inline);
  padding-inline-start: calc(
    var(--rs-menu-item-pad-inline) + var(--rs-menu-depth, 0) * var(--rs-menu-indent)
  );
  border: none;
  border-radius: var(--rs-menu-item-radius);
  background: transparent;
  color: var(--rs-menu-item-fg);
  font-size: var(--rs-menu-item-font-size);
  text-align: start;
  text-decoration: none;
  box-sizing: border-box;
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}
.rs-menu--horizontal .rs-menu__item {
  width: auto;
  min-width: 0;
  padding-inline: var(--rs-menu-item-pad-inline);
}
.rs-menu--collapsed .rs-menu__item {
  justify-content: center;
  padding: 0;
  width: var(--rs-menu-item-height);
  margin-inline: auto;
}
.rs-menu--collapsed .rs-menu__list--nested {
  display: none;
}
.rs-menu__flyout {
  position: fixed;
  z-index: var(--rs-z-dropdown);
  min-width: var(--rs-menu-flyout-min-width);
  max-width: min(var(--rs-menu-flyout-max-width), 90vw);
  padding: var(--rs-menu-flyout-pad);
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow);
  outline: none;
  box-sizing: border-box;
}
.rs-menu__flyout-title {
  display: block;
  padding: var(--rs-space-xs) var(--rs-menu-item-pad-inline);
  margin-bottom: calc(var(--rs-space-xs) / 2);
  border-bottom: 1px solid var(--rs-border);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-menu-group-label-fg);
  letter-spacing: 0.04em;
  line-height: var(--rs-line-height-tight);
  user-select: none;
}
.rs-menu__flyout .rs-menu__list--nested {
  display: flex;
}
.rs-menu__item:hover:not(:disabled):not([aria-disabled='true']):not(.rs-menu__item--active) {
  color: var(--rs-menu-item-fg-hover);
  background: var(--rs-menu-item-bg-hover);
}
.rs-menu__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
.rs-menu__item--active {
  color: var(--rs-menu-item-active-fg);
  background: var(--rs-menu-item-active-bg);
  font-weight: var(--rs-menu-item-active-weight);
}
.rs-menu__item--active-parent {
  color: var(--rs-menu-item-active-parent-fg);
  background: var(--rs-menu-item-active-parent-bg);
  font-weight: var(--rs-menu-item-active-weight);
}
.rs-menu__item--active-parent:hover:not(:disabled) {
  color: var(--rs-menu-item-active-parent-fg);
  background: var(--rs-menu-item-bg-hover);
}
.rs-menu__item:disabled,
.rs-menu__item[aria-disabled='true'] {
  opacity: var(--rs-menu-disabled-opacity);
  cursor: not-allowed;
}
.rs-menu__icon-slot {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}
.rs-menu__icon {
  display: block;
}
.rs-menu__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rs-menu__extra {
  flex-shrink: 0;
  margin-inline-start: auto;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-tertiary);
}
.rs-menu__submenu-arrow {
  flex-shrink: 0;
  color: var(--rs-menu-arrow-fg);
  transition: transform var(--rs-transition-fast);
}
.rs-menu__item--submenu-trigger[data-state='open'] .rs-menu__submenu-arrow {
  transform: rotate(180deg);
}
.rs-menu__submenu {
  overflow: hidden;
}
.rs-menu__list--nested {
  margin-top: calc(var(--rs-space-xs) / 2);
}
.rs-menu--horizontal > .rs-menu__root-list > .rs-menu__group > .rs-menu__group-label {
  display: none;
}
.rs-menu--horizontal > .rs-menu__root-list > .rs-menu__group > .rs-menu__list {
  margin-top: 0;
  flex-direction: row;
  align-items: center;
  gap: var(--rs-space-xs);
}
.rs-menu--horizontal .rs-menu__entry--submenu .rs-menu__submenu {
  position: absolute;
  top: calc(100% + var(--rs-space-xs));
  inset-inline-start: 0;
  z-index: var(--rs-z-dropdown);
  min-width: var(--rs-menu-flyout-min-width);
  padding: var(--rs-menu-flyout-pad);
  border-radius: var(--rs-radius-sm);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow);
}
.rs-menu--horizontal .rs-menu__entry--submenu .rs-menu__list--nested {
  flex-direction: column;
  align-items: stretch;
  flex-wrap: nowrap;
  margin-top: 0;
}
[data-rs-dir='rtl'] .rs-menu__item--submenu-trigger[data-state='open'] .rs-menu__submenu-arrow,
[dir='rtl'] .rs-menu__item--submenu-trigger[data-state='open'] .rs-menu__submenu-arrow {
  transform: rotate(-180deg);
}
@media (prefers-reduced-motion: reduce) {
  .rs-menu__item,
  .rs-menu__submenu-arrow {
    transition: none;
  }
}
</style>
