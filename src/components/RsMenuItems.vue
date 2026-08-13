<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from './reka'
import { useRsI18n } from '../composables/useRsI18n'
import { menuItemContainsKey, type RsMenuItem } from './menu-utils'
import RsIcon from './RsIcon.vue'
import RsMenuItems from './RsMenuItems.vue'

const props = withDefaults(
  defineProps<{
    items: RsMenuItem[]
    activeKey?: string
    openKeys: string[]
    collapsed?: boolean
    mode?: 'vertical' | 'horizontal'
    depth?: number
    /** 选中叶子时是否同时高亮祖先父级（仅字体色，无背景） */
    highlightParent?: boolean
  }>(),
  {
    collapsed: false,
    mode: 'vertical',
    depth: 0,
    highlightParent: false,
  },
)

const emit = defineEmits<{
  select: [key: string]
  'toggle-open': [key: string, open: boolean]
}>()

const { t } = useRsI18n()
const isCollapsedVertical = computed(() => props.mode === 'vertical' && props.collapsed)
const canExpandSubmenu = computed(() => !isCollapsedVertical.value)

/** 垂直折叠态：当前悬停展开的子菜单 key */
const flyoutKey = ref<string | null>(null)
let flyoutCloseTimer: ReturnType<typeof setTimeout> | undefined

function isOpen(key: string) {
  return props.openKeys.includes(key)
}

function isExactActive(key: string) {
  return props.activeKey === key
}

/** 开启 highlightParent 时：当前项是选中叶子的祖先（不含自身精确选中） */
function isParentActive(item: RsMenuItem) {
  if (!props.highlightParent || !props.activeKey || !item.children?.length) {
    return false
  }
  if (item.key === props.activeKey) {
    return false
  }
  return menuItemContainsKey(item, props.activeKey)
}

/** 叶子精确选中，或开启 highlightParent 时祖先也视为高亮 */
function isActiveItem(item: RsMenuItem) {
  return isExactActive(item.key) || isParentActive(item)
}

function selectLeaf(item: RsMenuItem) {
  if (item.disabled) return
  emit('select', item.key)
}

function toggleOpen(key: string, open: boolean) {
  if (!canExpandSubmenu.value) return
  emit('toggle-open', key, open)
}

function clearFlyoutCloseTimer() {
  if (flyoutCloseTimer !== undefined) {
    clearTimeout(flyoutCloseTimer)
    flyoutCloseTimer = undefined
  }
}

function openFlyout(key: string) {
  clearFlyoutCloseTimer()
  flyoutKey.value = key
}

function scheduleCloseFlyout() {
  clearFlyoutCloseTimer()
  // 短延迟以便指针从触发器移入浮层时不闪断
  flyoutCloseTimer = setTimeout(() => {
    flyoutKey.value = null
    flyoutCloseTimer = undefined
  }, 120)
}

function closeFlyout() {
  clearFlyoutCloseTimer()
  flyoutKey.value = null
}

function onFlyoutTriggerClick(item: RsMenuItem) {
  if (item.disabled) return
  if (flyoutKey.value === item.key) {
    closeFlyout()
    return
  }
  openFlyout(item.key)
}

function onFlyoutOpenChange(open: boolean) {
  // 仅同步关闭；打开由 mouseenter / click 驱动，避免关闭后焦点回写再次打开
  if (!open) {
    closeFlyout()
  }
}

function onFlyoutSelect(key: string) {
  closeFlyout()
  emit('select', key)
}

onBeforeUnmount(() => {
  clearFlyoutCloseTimer()
})
</script>

<template>
  <ul class="rs-menu__list" :class="{ 'rs-menu__list--nested': depth > 0 }">
    <li v-for="item in items" :key="item.key" class="rs-menu__node">
      <div
        class="rs-menu__entry"
        :class="{
          'rs-menu__entry--submenu': !!item.children?.length,
          'rs-menu__entry--active': isActiveItem(item),
          'rs-menu__entry--disabled': item.disabled,
        }"
        :style="{
          '--rs-menu-depth': mode === 'vertical' && !collapsed ? depth : 0,
        }"
      >
        <CollapsibleRoot
          v-if="item.children?.length && canExpandSubmenu"
          :open="isOpen(item.key)"
          class="rs-menu__collapsible"
          @update:open="(open) => toggleOpen(item.key, open)"
        >
          <CollapsibleTrigger
            class="rs-menu__item rs-menu__item--submenu-trigger"
            :class="{
              'rs-menu__item--active': isExactActive(item.key),
              'rs-menu__item--active-parent': isParentActive(item),
            }"
            :disabled="item.disabled"
            :aria-label="collapsed ? item.label : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <span v-if="!collapsed || item.icon" class="rs-menu__icon-slot" aria-hidden="true">
              <RsIcon v-if="item.icon" :name="item.icon" :size="16" class="rs-menu__icon" />
            </span>
            <span v-if="!collapsed" class="rs-menu__label">{{ item.label }}</span>
            <RsIcon
              v-if="!collapsed"
              name="chevron-down"
              :size="14"
              class="rs-menu__submenu-arrow"
              :label="isOpen(item.key) ? t('menu.collapseSubmenu') : t('menu.expandSubmenu')"
            />
          </CollapsibleTrigger>
          <CollapsibleContent class="rs-menu__submenu">
            <RsMenuItems
              :items="item.children"
              :active-key="activeKey"
              :open-keys="openKeys"
              :collapsed="collapsed"
              :mode="mode"
              :depth="depth + 1"
              :highlight-parent="highlightParent"
              @select="emit('select', $event)"
              @toggle-open="(key, open) => emit('toggle-open', key, open)"
            />
          </CollapsibleContent>
        </CollapsibleRoot>

        <PopoverRoot
          v-else-if="item.children?.length && isCollapsedVertical"
          :open="flyoutKey === item.key"
          @update:open="onFlyoutOpenChange"
        >
          <PopoverTrigger as-child>
            <button
              type="button"
              class="rs-menu__item rs-menu__item--submenu-trigger"
              :class="{
                'rs-menu__item--active': isExactActive(item.key),
                'rs-menu__item--active-parent': isParentActive(item),
              }"
              :disabled="item.disabled"
              :aria-label="item.label"
              :aria-expanded="flyoutKey === item.key"
              :aria-haspopup="true"
              @mouseenter="!item.disabled && openFlyout(item.key)"
              @mouseleave="scheduleCloseFlyout"
              @click="onFlyoutTriggerClick(item)"
            >
              <RsIcon v-if="item.icon" :name="item.icon" :size="16" class="rs-menu__icon" />
            </button>
          </PopoverTrigger>
          <PopoverPortal v-if="flyoutKey === item.key">
            <PopoverContent
              class="rs-menu__flyout"
              side="right"
              align="start"
              :side-offset="8"
              :collision-padding="8"
              @mouseenter="openFlyout(item.key)"
              @mouseleave="scheduleCloseFlyout"
              @escape-key-down="closeFlyout"
              @pointer-down-outside="closeFlyout"
            >
              <div class="rs-menu__flyout-title">{{ item.label }}</div>
              <RsMenuItems
                :items="item.children"
                :active-key="activeKey"
                :open-keys="openKeys"
                :collapsed="false"
                mode="vertical"
                :depth="0"
                :highlight-parent="highlightParent"
                @select="onFlyoutSelect"
                @toggle-open="(key, open) => emit('toggle-open', key, open)"
              />
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>

        <button
          v-else
          type="button"
          class="rs-menu__item"
          :class="{ 'rs-menu__item--active': isExactActive(item.key) }"
          :disabled="item.disabled"
          :aria-current="isExactActive(item.key) ? 'page' : undefined"
          :aria-label="collapsed ? item.label : undefined"
          :title="collapsed ? item.label : undefined"
          @click="selectLeaf(item)"
        >
          <span v-if="!collapsed || item.icon" class="rs-menu__icon-slot" aria-hidden="true">
            <RsIcon v-if="item.icon" :name="item.icon" :size="16" class="rs-menu__icon" />
          </span>
          <span v-if="!collapsed" class="rs-menu__label">{{ item.label }}</span>
        </button>
      </div>
    </li>
  </ul>
</template>
