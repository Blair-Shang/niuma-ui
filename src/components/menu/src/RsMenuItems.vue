<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { placeSidePopup, type RsSideOverlayBox } from '../../_shared/src/overlay-utils'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  isMenuDivider,
  menuArrowKeys,
  menuItemContainsKey,
  mergeMenuLinkRel,
  resolveMenuItemHref,
  resolveMenuPortalTarget,
  type RsMenuGetPopupContainer,
  type RsMenuItem,
  type RsMenuItemSlot,
  type RsMenuMode,
  type RsMenuTriggerAction,
} from './menu-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import RsMenuItems from './RsMenuItems.vue'

defineOptions({ name: 'RsMenuItems' })

const props = withDefaults(
  defineProps<{
    items: RsMenuItem[]
    activeKey?: string
    openKeys: string[]
    collapsed?: boolean
    mode?: RsMenuMode
    depth?: number
    highlightParent?: boolean
    triggerSubMenuAction?: RsMenuTriggerAction
    iconSize?: number
    getPopupContainer?: RsMenuGetPopupContainer
  }>(),
  {
    collapsed: false,
    mode: 'vertical',
    depth: 0,
    highlightParent: false,
    triggerSubMenuAction: 'click',
    iconSize: 16,
  },
)

const emit = defineEmits<{
  select: [key: string]
  click: [item: RsMenuItem, event: MouseEvent]
  'toggle-open': [key: string, open: boolean]
}>()

defineSlots<{
  item?: (props: RsMenuItemSlot) => unknown
  icon?: (props: RsMenuItemSlot) => unknown
  extra?: (props: RsMenuItemSlot) => unknown
}>()

const { t } = useRsI18n()
const isCollapsedVertical = computed(() => props.mode === 'vertical' && props.collapsed)
const canExpandSubmenu = computed(() => !isCollapsedVertical.value)
const hoverExpand = computed(
  () => props.triggerSubMenuAction === 'hover' && canExpandSubmenu.value,
)

/** 垂直折叠态：当前悬停展开的子菜单 key */
const flyoutKey = ref<string | null>(null)
const flyoutTheme = ref<string | undefined>()
const flyoutBox = ref<RsSideOverlayBox>({ top: 0, left: 0, width: 160, placement: 'right' })
const flyoutEl = ref<HTMLElement | null>(null)
const triggerEls = new Map<string, HTMLElement>()

let flyoutCloseTimer: ReturnType<typeof setTimeout> | undefined
let hoverCloseTimer: ReturnType<typeof setTimeout> | undefined
let placeFrame = 0
let overlayBound = false
let panelResize: ResizeObserver | undefined

function isOpen(key: string) {
  return props.openKeys.includes(key)
}

function isExactActive(key: string) {
  return props.activeKey === key
}

function isParentActive(item: RsMenuItem) {
  if (!props.highlightParent || !props.activeKey || !item.children?.length) {
    return false
  }
  if (item.key === props.activeKey) {
    return false
  }
  return menuItemContainsKey(item, props.activeKey)
}

function isActiveItem(item: RsMenuItem) {
  return isExactActive(item.key) || isParentActive(item)
}

function itemHref(item: RsMenuItem) {
  return resolveMenuItemHref(item)
}

function itemRel(item: RsMenuItem) {
  return mergeMenuLinkRel(item.rel, item.target)
}

function itemSlot(item: RsMenuItem): RsMenuItemSlot {
  return {
    item,
    active: isExactActive(item.key),
    parentActive: isParentActive(item),
    open: isOpen(item.key) || flyoutKey.value === item.key,
    collapsed: isCollapsedVertical.value,
    depth: props.depth,
  }
}

function selectLeaf(item: RsMenuItem, event: MouseEvent) {
  emit('click', item, event)
  if (item.disabled) {
    event.preventDefault()
    return
  }
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

function clearHoverCloseTimer() {
  if (hoverCloseTimer !== undefined) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = undefined
  }
}

function preferredFlyoutSide(el: HTMLElement | null): 'left' | 'right' {
  if (!el) return 'right'
  const rtl =
    el.closest('[dir="rtl"]') != null || el.closest('[data-rs-dir="rtl"]') != null
  return rtl ? 'left' : 'right'
}

function syncFlyoutTheme(el: HTMLElement | null) {
  if (!el) {
    flyoutTheme.value = undefined
    return
  }
  const themed = el.closest('[data-rs-theme]')
  flyoutTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
}

function placeFlyout() {
  if (typeof window === 'undefined' || !flyoutKey.value) return
  const trigger = triggerEls.get(flyoutKey.value)
  if (!trigger) return
  const anchor = trigger.getBoundingClientRect()
  const measured = flyoutEl.value?.getBoundingClientRect()
  flyoutBox.value = placeSidePopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    {
      width: measured?.width || Math.min(16 * 16, window.innerWidth - 16),
      height: measured?.height || 160,
    },
    { width: window.innerWidth, height: window.innerHeight },
    8,
    preferredFlyoutSide(trigger),
  )
}

function requestPlace() {
  if (typeof window === 'undefined') return
  if (placeFrame) return
  placeFrame = window.requestAnimationFrame(() => {
    placeFrame = 0
    placeFlyout()
  })
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  const trigger = flyoutKey.value ? triggerEls.get(flyoutKey.value) : null
  if (trigger?.contains(target)) return
  if (flyoutEl.value?.contains(target)) return
  closeFlyout()
}

function onDocKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !flyoutKey.value) return
  event.preventDefault()
  closeFlyout(true)
}

function onWindowChange() {
  if (!flyoutKey.value) return
  requestPlace()
}

function attachOverlay() {
  if (overlayBound || typeof window === 'undefined') return
  overlayBound = true
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onDocKeydown)
  }
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachOverlay() {
  if (placeFrame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(placeFrame)
    placeFrame = 0
  }
  panelResize?.disconnect()
  panelResize = undefined
  if (!overlayBound) return
  overlayBound = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown)
    document.removeEventListener('keydown', onDocKeydown)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
}

function openFlyout(key: string) {
  clearFlyoutCloseTimer()
  flyoutKey.value = key
  const trigger = triggerEls.get(key) ?? null
  syncFlyoutTheme(trigger)
  attachOverlay()
  void nextTick(() => {
    if (flyoutEl.value && typeof ResizeObserver !== 'undefined') {
      panelResize?.disconnect()
      panelResize = new ResizeObserver(() => requestPlace())
      panelResize.observe(flyoutEl.value)
    }
    requestPlace()
  })
}

function closeFlyout(restoreFocus = false) {
  const key = flyoutKey.value
  clearFlyoutCloseTimer()
  flyoutKey.value = null
  flyoutTheme.value = undefined
  detachOverlay()
  if (restoreFocus && key) {
    triggerEls.get(key)?.focus()
  }
}

function scheduleCloseFlyout() {
  clearFlyoutCloseTimer()
  flyoutCloseTimer = setTimeout(() => {
    flyoutKey.value = null
    flyoutTheme.value = undefined
    detachOverlay()
    flyoutCloseTimer = undefined
  }, 120)
}

function onFlyoutTriggerClick(item: RsMenuItem, event: MouseEvent) {
  emit('click', item, event)
  if (item.disabled) return
  if (flyoutKey.value === item.key) {
    closeFlyout()
    return
  }
  openFlyout(item.key)
}

function onFlyoutSelect(key: string) {
  closeFlyout(true)
  emit('select', key)
}

function onSubmenuTriggerClick(item: RsMenuItem, event: MouseEvent) {
  emit('click', item, event)
  if (item.disabled) return
  toggleOpen(item.key, !isOpen(item.key))
}

function onEntryMouseEnter(item: RsMenuItem) {
  if (item.disabled || !item.children?.length) return
  if (isCollapsedVertical.value) {
    openFlyout(item.key)
    return
  }
  if (!hoverExpand.value) return
  clearHoverCloseTimer()
  toggleOpen(item.key, true)
}

function onEntryMouseLeave(item: RsMenuItem) {
  if (!item.children?.length) return
  if (isCollapsedVertical.value) {
    scheduleCloseFlyout()
    return
  }
  if (!hoverExpand.value) return
  clearHoverCloseTimer()
  hoverCloseTimer = setTimeout(() => {
    toggleOpen(item.key, false)
    hoverCloseTimer = undefined
  }, 120)
}

function setTriggerEl(key: string, el: unknown) {
  if (el instanceof HTMLElement) triggerEls.set(key, el)
  else triggerEls.delete(key)
}

function isRtlFromEl(el: HTMLElement | null) {
  if (!el) return false
  return el.closest('[dir="rtl"]') != null || el.closest('[data-rs-dir="rtl"]') != null
}

function focusSibling(current: HTMLElement, delta: 1 | -1 | 'first' | 'last') {
  const list = current.closest('ul.rs-menu__list')
  if (!list) return
  const items = Array.from(
    list.querySelectorAll<HTMLElement>(':scope > li > .rs-menu__entry .rs-menu__item'),
  ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true')
  if (!items.length) return
  if (delta === 'first') {
    items[0]?.focus()
    return
  }
  if (delta === 'last') {
    items[items.length - 1]?.focus()
    return
  }
  const index = items.indexOf(current)
  if (index < 0) return
  const next = items[(index + delta + items.length) % items.length]
  next?.focus()
}

function onItemKeydown(event: KeyboardEvent, item: RsMenuItem) {
  const current = event.currentTarget
  if (!(current instanceof HTMLElement)) return
  const rtl = isRtlFromEl(current)
  const vertical = props.mode === 'vertical' || props.depth > 0
  const { next: nextKey, prev: prevKey, open: openKey } = menuArrowKeys(vertical, rtl)

  if (event.key === 'Escape') {
    if (flyoutKey.value) {
      event.preventDefault()
      closeFlyout(true)
    }
    return
  }
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusSibling(current, event.key === 'Home' ? 'first' : 'last')
    return
  }
  if (event.key === nextKey || event.key === prevKey) {
    event.preventDefault()
    focusSibling(current, event.key === nextKey ? 1 : -1)
    return
  }
  if (item.children?.length && event.key === openKey && !item.disabled) {
    event.preventDefault()
    if (isCollapsedVertical.value) openFlyout(item.key)
    else toggleOpen(item.key, true)
  }
}

const portalTarget = computed(() => resolveMenuPortalTarget(props.getPopupContainer))

const flyoutStyle = computed(() => ({
  top: `${flyoutBox.value.top}px`,
  left: `${flyoutBox.value.left}px`,
  width: flyoutBox.value.width ? `${flyoutBox.value.width}px` : undefined,
}))

watch(flyoutKey, (key) => {
  if (!key) detachOverlay()
})

onBeforeUnmount(() => {
  clearFlyoutCloseTimer()
  clearHoverCloseTimer()
  detachOverlay()
  triggerEls.clear()
})
</script>

<template>
  <ul class="rs-menu__list" :class="{ 'rs-menu__list--nested': depth > 0 }">
    <li v-for="item in items" :key="item.key" class="rs-menu__node">
      <hr v-if="isMenuDivider(item)" class="rs-menu__divider" />

      <div
        v-else
        class="rs-menu__entry"
        :class="{
          'rs-menu__entry--submenu': !!item.children?.length,
          'rs-menu__entry--active': isActiveItem(item),
          'rs-menu__entry--disabled': item.disabled,
        }"
        :style="{
          '--rs-menu-depth': mode === 'vertical' && !collapsed ? depth : 0,
        }"
        @mouseenter="!isCollapsedVertical && onEntryMouseEnter(item)"
        @mouseleave="!isCollapsedVertical && onEntryMouseLeave(item)"
      >
        <div v-if="item.children?.length && canExpandSubmenu" class="rs-menu__collapsible">
          <button
            :ref="(el) => setTriggerEl(item.key, el)"
            type="button"
            class="rs-menu__item rs-menu__item--submenu-trigger"
            :class="{
              'rs-menu__item--active': isExactActive(item.key),
              'rs-menu__item--active-parent': isParentActive(item),
            }"
            :disabled="item.disabled"
            :data-state="isOpen(item.key) ? 'open' : 'closed'"
            :aria-expanded="isOpen(item.key)"
            :aria-haspopup="true"
            :aria-label="collapsed ? item.label : undefined"
            :title="collapsed ? item.label : undefined"
            @click="onSubmenuTriggerClick(item, $event)"
            @keydown="onItemKeydown($event, item)"
          >
            <slot name="item" v-bind="itemSlot(item)">
              <span v-if="!collapsed || item.icon" class="rs-menu__icon-slot" aria-hidden="true">
                <slot name="icon" v-bind="itemSlot(item)">
                  <RsIcon
                    v-if="item.icon"
                    :name="item.icon"
                    :size="iconSize"
                    class="rs-menu__icon"
                  />
                </slot>
              </span>
              <span v-if="!collapsed" class="rs-menu__label">{{ item.label }}</span>
              <span v-if="!collapsed && (item.extra || $slots.extra)" class="rs-menu__extra">
                <slot name="extra" v-bind="itemSlot(item)">{{ item.extra }}</slot>
              </span>
              <RsIcon
                v-if="!collapsed"
                name="chevron-down"
                :size="Math.max(12, iconSize - 2)"
                class="rs-menu__submenu-arrow"
                :label="isOpen(item.key) ? t('menu.collapseSubmenu') : t('menu.expandSubmenu')"
              />
            </slot>
          </button>
          <div v-if="isOpen(item.key)" class="rs-menu__submenu">
            <RsMenuItems
              :items="item.children"
              :active-key="activeKey"
              :open-keys="openKeys"
              :collapsed="collapsed"
              :mode="mode"
              :depth="depth + 1"
              :highlight-parent="highlightParent"
              :trigger-sub-menu-action="triggerSubMenuAction"
              :icon-size="iconSize"
              :get-popup-container="getPopupContainer"
              @select="emit('select', $event)"
              @click="(child, event) => emit('click', child, event)"
              @toggle-open="(key, open) => emit('toggle-open', key, open)"
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
          </div>
        </div>

        <template v-else-if="item.children?.length && isCollapsedVertical">
          <button
            :ref="(el) => setTriggerEl(item.key, el)"
            type="button"
            class="rs-menu__item rs-menu__item--submenu-trigger"
            :class="{
              'rs-menu__item--active': isExactActive(item.key),
              'rs-menu__item--active-parent': isParentActive(item),
            }"
            :disabled="item.disabled"
            :data-state="flyoutKey === item.key ? 'open' : 'closed'"
            :aria-label="item.label"
            :aria-expanded="flyoutKey === item.key"
            :aria-haspopup="true"
            @click="onFlyoutTriggerClick(item, $event)"
            @mouseenter="!item.disabled && openFlyout(item.key)"
            @mouseleave="scheduleCloseFlyout"
            @keydown="onItemKeydown($event, item)"
          >
            <slot name="item" v-bind="itemSlot(item)">
              <RsIcon v-if="item.icon" :name="item.icon" :size="iconSize" class="rs-menu__icon" />
            </slot>
          </button>
          <Teleport v-if="flyoutKey === item.key" :to="portalTarget">
            <section
              ref="flyoutEl"
              class="rs-menu__flyout"
              :aria-label="item.label"
              :data-rs-theme="flyoutTheme"
              :style="flyoutStyle"
              @mouseenter="openFlyout(item.key)"
              @mouseleave="scheduleCloseFlyout"
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
                :trigger-sub-menu-action="triggerSubMenuAction"
                :icon-size="iconSize"
                :get-popup-container="getPopupContainer"
                @select="onFlyoutSelect"
                @click="(child, event) => emit('click', child, event)"
                @toggle-open="(key, open) => emit('toggle-open', key, open)"
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
            </section>
          </Teleport>
        </template>

        <a
          v-else-if="itemHref(item) && !item.disabled"
          :href="itemHref(item)"
          :target="item.target"
          :rel="itemRel(item)"
          class="rs-menu__item"
          :class="{ 'rs-menu__item--active': isExactActive(item.key) }"
          :aria-current="isExactActive(item.key) ? 'page' : undefined"
          :aria-label="collapsed ? item.label : undefined"
          :title="collapsed ? item.label : undefined"
          @click="selectLeaf(item, $event)"
          @keydown="onItemKeydown($event, item)"
        >
          <slot name="item" v-bind="itemSlot(item)">
            <span v-if="!collapsed || item.icon" class="rs-menu__icon-slot" aria-hidden="true">
              <slot name="icon" v-bind="itemSlot(item)">
                <RsIcon
                  v-if="item.icon"
                  :name="item.icon"
                  :size="iconSize"
                  class="rs-menu__icon"
                />
              </slot>
            </span>
            <span v-if="!collapsed" class="rs-menu__label">{{ item.label }}</span>
            <span v-if="!collapsed && (item.extra || $slots.extra)" class="rs-menu__extra">
              <slot name="extra" v-bind="itemSlot(item)">{{ item.extra }}</slot>
            </span>
          </slot>
        </a>

        <button
          v-else
          type="button"
          class="rs-menu__item"
          :class="{ 'rs-menu__item--active': isExactActive(item.key) }"
          :disabled="item.disabled"
          :aria-current="isExactActive(item.key) ? 'page' : undefined"
          :aria-label="collapsed ? item.label : undefined"
          :title="collapsed ? item.label : undefined"
          @click="selectLeaf(item, $event)"
          @keydown="onItemKeydown($event, item)"
        >
          <slot name="item" v-bind="itemSlot(item)">
            <span v-if="!collapsed || item.icon" class="rs-menu__icon-slot" aria-hidden="true">
              <slot name="icon" v-bind="itemSlot(item)">
                <RsIcon
                  v-if="item.icon"
                  :name="item.icon"
                  :size="iconSize"
                  class="rs-menu__icon"
                />
              </slot>
            </span>
            <span v-if="!collapsed" class="rs-menu__label">{{ item.label }}</span>
            <span v-if="!collapsed && (item.extra || $slots.extra)" class="rs-menu__extra">
              <slot name="extra" v-bind="itemSlot(item)">{{ item.extra }}</slot>
            </span>
          </slot>
        </button>
      </div>
    </li>
  </ul>
</template>
