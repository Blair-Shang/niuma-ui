<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, useSlots, useTemplateRef, watch } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize, type RsRadius } from '../../../theme/types'
import { placeSidePopup, stepEnabledIndex, type RsOverlayBox, type RsSideOverlayBox } from '../../_shared/src/overlay-utils'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  escapeDropdownSelector,
  flattenDropdownItems,
  hasDropdownChildren,
  listDropdownLayerItems,
  matchDropdownTypeahead,
  normalizeDropdownTriggers,
  placeDropdownPopup,
  resolveDropdownMenuKeys,
  resolveDropdownPortalTarget,
  type RsDropdownContentWidth,
  type RsDropdownExpose,
  type RsDropdownGetPopupContainer,
  type RsDropdownItem,
  type RsDropdownItems as RsDropdownData,
  type RsDropdownPlacement,
  type RsDropdownTrigger,
} from './dropdown-utils'
import RsDropdownItems from './RsDropdownItems.vue'

defineOptions({ name: 'RsDropdown' })

export type {
  RsDropdownContentWidth,
  RsDropdownExpose,
  RsDropdownGetPopupContainer,
  RsDropdownInstance,
  RsDropdownItem,
  RsDropdownItemGroup,
  RsDropdownItemSlot,
  RsDropdownItems,
  RsDropdownPlacement,
  RsDropdownTone,
  RsDropdownTrigger,
} from './dropdown-utils'

const model = defineModel<string>()
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    items: RsDropdownData
    placeholder?: string
    disabled?: boolean
    /** 选中后是否在触发器回显选项 label；false 时固定显示 placeholder（操作菜单） */
    showSelected?: boolean
    /** 菜单项密度，与控件 size 对齐 */
    size?: RsComponentSize
    radius?: RsRadius
    /** 菜单宽度；工具条图标按钮用 fit，避免被触发器宽度压扁 */
    contentWidth?: RsDropdownContentWidth
    trigger?: RsDropdownTrigger | RsDropdownTrigger[]
    placement?: RsDropdownPlacement
    hideOnClick?: boolean
    getPopupContainer?: RsDropdownGetPopupContainer
    popupClassName?: string
    maxHeight?: number
    ariaLabel?: string
    id?: string
    destroyOnHide?: boolean
  }>(),
  {
    disabled: false,
    showSelected: true,
    contentWidth: 'trigger',
    trigger: 'click',
    placement: 'bottom',
    hideOnClick: true,
    destroyOnHide: true,
  },
)

const emit = defineEmits<{
  select: [value: string]
  change: [value: string]
  openChange: [open: boolean]
}>()

const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const menuId = useId()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const resolvedPlaceholder = computed(() => props.placeholder ?? t('dropdown.placeholder'))
const menuLabel = computed(() => props.ariaLabel || t('dropdown.menu'))
const isRtl = computed(() =>
  resolveDirMode(config?.dir.value ?? 'auto', config?.locale.value ?? locale.value) === 'rtl',
)
const triggers = computed(() => normalizeDropdownTriggers(props.trigger))
const hasClick = computed(() => triggers.value.includes('click'))
const hasHover = computed(() => triggers.value.includes('hover'))
const hasContext = computed(() => triggers.value.includes('contextmenu'))
const iconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const triggerRef = useTemplateRef<HTMLElement>('triggerRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
const submenuRef = useTemplateRef<HTMLElement>('submenuRef')

const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })
const submenuBox = ref<RsSideOverlayBox>({
  top: 0,
  left: 0,
  width: 0,
  placement: 'right',
})
const panelTheme = ref<string | undefined>()
const highlightedValue = ref('')
const openSubmenuValue = ref('')
const submenuHighlight = ref('')

const flatItems = computed(() => flattenDropdownItems(props.items))
const layerItems = computed(() => listDropdownLayerItems(props.items))
const submenuItem = computed(
  () => layerItems.value.find((item) => item.value === openSubmenuValue.value && hasDropdownChildren(item)),
)
const submenuItems = computed(() => submenuItem.value?.children ?? [])
const activeLayerItems = computed(() =>
  openSubmenuValue.value ? listDropdownLayerItems(submenuItems.value) : layerItems.value,
)
const activeHighlight = computed(() =>
  openSubmenuValue.value ? submenuHighlight.value : highlightedValue.value,
)

const selectedItem = computed(() =>
  flatItems.value.find((item) => item.value === model.value),
)

const displayLabel = computed(() => {
  if (!props.showSelected) return resolvedPlaceholder.value
  return selectedItem.value?.label ?? resolvedPlaceholder.value
})

const isPlaceholderDisplay = computed(() => {
  if (!props.showSelected) return false
  return !selectedItem.value
})

const showPanel = computed(() => open.value || !props.destroyOnHide)
const portalTarget = computed(() =>
  resolveDropdownPortalTarget(props.getPopupContainer, triggerRef.value),
)

const slots = useSlots()
const hasTriggerSlot = computed(() => Boolean(slots.trigger))

const rootClass = computed(() => ({
  'rs-dropdown--action': !props.showSelected || hasTriggerSlot.value,
  [`rs-dropdown--${resolvedSize.value}`]: true,
}))

const rootStyle = computed(() => ({
  '--rs-dropdown-item-radius': rsRadiusCss(resolvedRadius.value),
}))

const panelStyle = computed(() => ({
  top: `${popup.value.top}px`,
  left: `${popup.value.left}px`,
  width: props.contentWidth === 'trigger' ? `${popup.value.width}px` : undefined,
  maxHeight: props.maxHeight != null ? `${Math.max(0, props.maxHeight)}px` : undefined,
  '--rs-dropdown-item-radius': rsRadiusCss(resolvedRadius.value),
  '--rs-dropdown-trigger-width': `${popup.value.width}px`,
}))

const submenuStyle = computed(() => ({
  top: `${submenuBox.value.top}px`,
  left: `${submenuBox.value.left}px`,
  '--rs-dropdown-item-radius': rsRadiusCss(resolvedRadius.value),
}))

function setOpen(next: boolean) {
  if (props.disabled && next) return
  if (open.value === next) return
  open.value = next
}

function pickInitialHighlight(): string {
  const selected = props.showSelected ? selectedItem.value?.value : undefined
  if (selected && layerItems.value.some((item) => item.value === selected && !item.disabled)) {
    return selected
  }
  return layerItems.value.find((item) => !item.disabled)?.value ?? ''
}

function commitSelect(value: string) {
  const prev = model.value
  model.value = value
  emit('select', value)
  if (props.showSelected && prev !== value) emit('change', value)
  if (props.hideOnClick) setOpen(false)
}

function onItemSelect(value: string) {
  commitSelect(value)
}

function onHighlight(value: string) {
  if (openSubmenuValue.value) {
    submenuHighlight.value = value
    return
  }
  highlightedValue.value = value
}

function onOpenSubmenu(value: string) {
  openSubmenuValue.value = value
  highlightedValue.value = value
  const children = layerItems.value.find((item) => item.value === value)?.children ?? []
  submenuHighlight.value = listDropdownLayerItems(children).find((item) => !item.disabled)?.value ?? ''
  void nextTick(() => placeSubmenu())
}

function onItemEnter(item: RsDropdownItem) {
  if (openSubmenuValue.value) {
    submenuHighlight.value = item.value
    return
  }
  highlightedValue.value = item.value
  if (hasDropdownChildren(item)) {
    clearSubmenuCloseTimer()
    scheduleSubmenuOpen(item.value)
    return
  }
  scheduleSubmenuClose()
}

function exposeOpen() {
  if (props.disabled) return
  setOpen(true)
}

function exposeClose() {
  setOpen(false)
}

function focus() {
  const native = resolveTriggerControl()
  native?.focus()
}

function blur() {
  resolveTriggerControl()?.blur()
}

const exposeApi: RsDropdownExpose = {
  open: exposeOpen,
  close: exposeClose,
  focus,
  blur,
}

defineExpose(exposeApi)

function resolveTriggerControl(): HTMLElement | null {
  const host = triggerRef.value
  if (!host) return null
  if (host.matches('button, [href], [role="button"]')) return host
  return host.querySelector<HTMLElement>('button, [href], [role="button"]') ?? host
}

function syncTriggerAria() {
  const host = triggerRef.value
  if (!host) return
  if (!hasTriggerSlot.value) return
  const control = resolveTriggerControl()
  if (!control) return
  control.setAttribute('aria-haspopup', 'menu')
  control.setAttribute('aria-expanded', open.value ? 'true' : 'false')
  control.setAttribute('aria-controls', menuId)
  if (props.disabled) control.setAttribute('aria-disabled', 'true')
  else control.removeAttribute('aria-disabled')
}

function onTriggerClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  if (!hasClick.value) return
  if (hasHover.value && open.value) return
  setOpen(!open.value)
}

function onTriggerContextMenu(event: MouseEvent) {
  if (props.disabled || !hasContext.value) return
  event.preventDefault()
  setOpen(true)
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled || event.isComposing) return
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    setOpen(false)
    return
  }
  if (open.value) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    setOpen(true)
  }
}

function onTriggerEnter() {
  if (props.disabled || !hasHover.value) return
  clearHoverCloseTimer()
  scheduleHoverOpen()
}

function onTriggerLeave() {
  if (!hasHover.value) return
  scheduleHoverClose()
}

function onPanelEnter() {
  if (hasHover.value) clearHoverCloseTimer()
  clearSubmenuCloseTimer()
}

function onPanelLeave() {
  if (hasHover.value) scheduleHoverClose()
  scheduleSubmenuClose()
}

function syncPanelTheme() {
  const el = triggerRef.value ?? rootRef.value
  if (!el) {
    panelTheme.value = undefined
    return
  }
  const themed = el.closest('[data-rs-theme]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
}

function placePopup() {
  const trigger = triggerRef.value
  const content = contentRef.value
  if (!trigger || !open.value || typeof window === 'undefined') return
  const anchor = trigger.getBoundingClientRect()
  const measured = content?.getBoundingClientRect()
  const minFit = 10.5 * 16
  const prefWidth =
    props.contentWidth === 'trigger'
      ? Math.max(anchor.width, measured?.width || anchor.width)
      : Math.max(measured?.width || minFit, minFit)
  popup.value = placeDropdownPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: prefWidth, height: measured?.height || 0 },
    { width: window.innerWidth, height: window.innerHeight },
    props.placement,
    isRtl.value,
    4,
  )
  if (openSubmenuValue.value) placeSubmenu()
}

function placeSubmenu() {
  const parent = contentRef.value?.querySelector<HTMLElement>(
    `.rs-dropdown__item[data-dropdown-value="${escapeDropdownSelector(openSubmenuValue.value)}"]`,
  )
  const flyout = submenuRef.value
  if (!parent || !flyout || typeof window === 'undefined') return
  const anchor = parent.getBoundingClientRect()
  const measured = flyout.getBoundingClientRect()
  submenuBox.value = placeSidePopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: measured.width || 168, height: measured.height || 80 },
    { width: window.innerWidth, height: window.innerHeight },
    4,
    isRtl.value ? 'left' : 'right',
  )
}

let frame = 0
let overlayBound = false
let openWatchReady = false
let panelResize: ResizeObserver | undefined
let hoverOpenTimer: ReturnType<typeof setTimeout> | undefined
let hoverCloseTimer: ReturnType<typeof setTimeout> | undefined
let submenuOpenTimer: ReturnType<typeof setTimeout> | undefined
let submenuCloseTimer: ReturnType<typeof setTimeout> | undefined
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined
let typeaheadQuery = ''
let restoreFocus = false

function requestPlace() {
  if (typeof window === 'undefined') return
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function clearHoverOpenTimer() {
  if (hoverOpenTimer) {
    clearTimeout(hoverOpenTimer)
    hoverOpenTimer = undefined
  }
}

function clearHoverCloseTimer() {
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = undefined
  }
}

function clearSubmenuOpenTimer() {
  if (submenuOpenTimer) {
    clearTimeout(submenuOpenTimer)
    submenuOpenTimer = undefined
  }
}

function clearSubmenuCloseTimer() {
  if (submenuCloseTimer) {
    clearTimeout(submenuCloseTimer)
    submenuCloseTimer = undefined
  }
}

function clearTypeahead() {
  typeaheadQuery = ''
  if (typeaheadTimer) {
    clearTimeout(typeaheadTimer)
    typeaheadTimer = undefined
  }
}

function scheduleHoverOpen() {
  clearHoverOpenTimer()
  hoverOpenTimer = setTimeout(() => {
    hoverOpenTimer = undefined
    setOpen(true)
  }, 100)
}

function scheduleHoverClose() {
  clearHoverCloseTimer()
  hoverCloseTimer = setTimeout(() => {
    hoverCloseTimer = undefined
    setOpen(false)
  }, 200)
}

function scheduleSubmenuOpen(value: string) {
  clearSubmenuOpenTimer()
  submenuOpenTimer = setTimeout(() => {
    submenuOpenTimer = undefined
    onOpenSubmenu(value)
  }, 150)
}

function scheduleSubmenuClose() {
  clearSubmenuOpenTimer()
  clearSubmenuCloseTimer()
  submenuCloseTimer = setTimeout(() => {
    submenuCloseTimer = undefined
    openSubmenuValue.value = ''
    submenuHighlight.value = ''
  }, 200)
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (rootRef.value?.contains(target)) return
  if (contentRef.value?.contains(target)) return
  if (submenuRef.value?.contains(target)) return
  setOpen(false)
}

function onWindowChange() {
  if (!open.value) return
  requestPlace()
}

function attachPanelObserver() {
  if (typeof ResizeObserver === 'undefined') return
  panelResize?.disconnect()
  if (!contentRef.value) return
  panelResize = new ResizeObserver(() => requestPlace())
  panelResize.observe(contentRef.value)
  if (submenuRef.value) panelResize.observe(submenuRef.value)
}

function attachOverlay() {
  if (overlayBound || typeof window === 'undefined') return
  overlayBound = true
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onDocTypeahead, true)
  }
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachOverlay() {
  panelResize?.disconnect()
  panelResize = undefined
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (!overlayBound) return
  overlayBound = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown)
    document.removeEventListener('keydown', onDocTypeahead, true)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
}

function focusHighlighted() {
  const root = openSubmenuValue.value ? submenuRef.value : contentRef.value
  const value = activeHighlight.value
  const node = value
    ? root?.querySelector<HTMLElement>(`.rs-dropdown__item[data-dropdown-value="${escapeDropdownSelector(value)}"]`)
    : root?.querySelector<HTMLElement>('.rs-dropdown__item:not([data-disabled])')
  node?.focus()
}

function moveHighlight(delta: 1 | -1) {
  const items = activeLayerItems.value
  if (!items.length) return
  const current = items.findIndex((item) => item.value === activeHighlight.value)
  const next = stepEnabledIndex(items, current, delta)
  const value = items[next]?.value
  if (!value) return
  if (openSubmenuValue.value) submenuHighlight.value = value
  else highlightedValue.value = value
  void nextTick(() => focusHighlighted())
}

function jumpHighlight(edge: 'start' | 'end') {
  const items = activeLayerItems.value
  const enabled = items.filter((item) => !item.disabled)
  const target = edge === 'start' ? enabled[0] : enabled[enabled.length - 1]
  if (!target) return
  if (openSubmenuValue.value) submenuHighlight.value = target.value
  else highlightedValue.value = target.value
  void nextTick(() => focusHighlighted())
}

function activateHighlighted() {
  const items = activeLayerItems.value
  const current = items.find((item) => item.value === activeHighlight.value)
  if (!current || current.disabled) return
  if (hasDropdownChildren(current)) {
    onOpenSubmenu(current.value)
    void nextTick(() => focusHighlighted())
    return
  }
  commitSelect(current.value)
}

function closeSubmenuLayer() {
  openSubmenuValue.value = ''
  submenuHighlight.value = ''
  void nextTick(() => focusHighlighted())
}

function handleEscape() {
  if (openSubmenuValue.value) {
    closeSubmenuLayer()
    return
  }
  setOpen(false)
}

function handleOpenSubmenuKey() {
  const current = layerItems.value.find((item) => item.value === highlightedValue.value)
  if (!current || !hasDropdownChildren(current)) return
  onOpenSubmenu(current.value)
  void nextTick(() => focusHighlighted())
}

function onMenuKeydown(event: KeyboardEvent) {
  if (!open.value || event.isComposing) return
  const keys = resolveDropdownMenuKeys(isRtl.value)
  const actions = new Map<string, () => void>([
    ['Escape', handleEscape],
    ['Tab', () => setOpen(false)],
    [keys.next, () => moveHighlight(1)],
    [keys.prev, () => moveHighlight(-1)],
    ['Home', () => jumpHighlight('start')],
    ['End', () => jumpHighlight('end')],
    [keys.openSub, handleOpenSubmenuKey],
    [keys.closeSub, () => { if (openSubmenuValue.value) closeSubmenuLayer() }],
    ['Enter', activateHighlighted],
    [' ', activateHighlighted],
  ])
  const action = actions.get(event.key)
  if (!action) return
  if (event.key !== 'Tab') event.preventDefault()
  action()
}

function onDocTypeahead(event: KeyboardEvent) {
  if (!open.value || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key.length !== 1 || event.key === ' ') return
  const target = event.target
  if (target instanceof Node) {
    if (!contentRef.value?.contains(target) && !submenuRef.value?.contains(target)) return
  }
  typeaheadQuery += event.key
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => {
    typeaheadQuery = ''
    typeaheadTimer = undefined
  }, 500)
  const items = activeLayerItems.value
  const current = items.findIndex((item) => item.value === activeHighlight.value)
  const next = matchDropdownTypeahead(items, typeaheadQuery, current)
  if (next < 0) return
  const value = items[next]?.value
  if (!value) return
  if (openSubmenuValue.value) submenuHighlight.value = value
  else highlightedValue.value = value
  void nextTick(() => focusHighlighted())
}

function resetLayerState() {
  openSubmenuValue.value = ''
  submenuHighlight.value = ''
  highlightedValue.value = pickInitialHighlight()
  clearTypeahead()
}

watch(
  open,
  (isOpen) => {
    const skipEvent = !openWatchReady
    openWatchReady = true
    if (typeof document === 'undefined' || typeof window === 'undefined') return
    if (isOpen) {
      if (props.disabled) {
        open.value = false
        return
      }
      restoreFocus = document.activeElement instanceof HTMLElement
      syncPanelTheme()
      resetLayerState()
      attachOverlay()
      void nextTick(() => {
        placePopup()
        attachPanelObserver()
        focusHighlighted()
        syncTriggerAria()
      })
      if (!skipEvent) emit('openChange', true)
      return
    }
    detachOverlay()
    openSubmenuValue.value = ''
    submenuHighlight.value = ''
    clearHoverOpenTimer()
    clearSubmenuOpenTimer()
    clearSubmenuCloseTimer()
    clearTypeahead()
    syncTriggerAria()
    if (restoreFocus) {
      restoreFocus = false
      resolveTriggerControl()?.focus()
    }
    if (!skipEvent) emit('openChange', false)
  },
  { immediate: true },
)

watch(
  () => [props.items, model.value] as const,
  () => {
    if (!open.value) return
    if (!activeLayerItems.value.some((item) => item.value === activeHighlight.value)) {
      resetLayerState()
    }
  },
)

watch(
  () => [open.value, hasTriggerSlot.value, props.disabled] as const,
  () => syncTriggerAria(),
)

onUnmounted(() => {
  detachOverlay()
  clearHoverOpenTimer()
  clearHoverCloseTimer()
  clearSubmenuOpenTimer()
  clearSubmenuCloseTimer()
  clearTypeahead()
})
</script>

<template>
  <div
    :id="id"
    ref="rootRef"
    class="rs-dropdown"
    :class="rootClass"
    :style="rootStyle"
  >
    <span
      v-if="hasTriggerSlot"
      ref="triggerRef"
      class="rs-dropdown__trigger-slot"
      :data-disabled="disabled ? '' : undefined"
      @click="onTriggerClick"
      @contextmenu="onTriggerContextMenu"
      @keydown="onTriggerKeydown"
      @mouseenter="onTriggerEnter"
      @mouseleave="onTriggerLeave"
    >
      <slot name="trigger" />
    </span>
    <button
      v-else
      ref="triggerRef"
      type="button"
      class="rs-dropdown__trigger"
      :disabled="disabled"
      :aria-haspopup="'menu'"
      :aria-expanded="open"
      :aria-controls="menuId"
      :aria-label="showSelected ? undefined : resolvedPlaceholder"
      @click="onTriggerClick"
      @contextmenu="onTriggerContextMenu"
      @keydown="onTriggerKeydown"
      @mouseenter="onTriggerEnter"
      @mouseleave="onTriggerLeave"
    >
      <span class="rs-dropdown__value">
        <span
          class="rs-dropdown__label"
          :class="{ 'rs-dropdown__label--placeholder': isPlaceholderDisplay }"
        >
          {{ displayLabel }}
        </span>
      </span>
      <RsIcon
        name="chevron-down"
        :size="iconSize"
        class="rs-dropdown__icon"
        aria-hidden="true"
      />
    </button>

    <Teleport v-if="showPanel" :to="portalTarget">
      <div
        v-show="open"
        :id="menuId"
        ref="contentRef"
        class="rs-dropdown__content"
        :class="[
          `rs-dropdown__content--${resolvedSize}`,
          `rs-dropdown__content--${contentWidth}`,
          popupClassName,
        ]"
        :style="panelStyle"
        :data-rs-theme="panelTheme"
        :data-placement="popup.placement"
        role="menu"
        :aria-label="menuLabel"
        @keydown="onMenuKeydown"
        @mouseenter="onPanelEnter"
        @mouseleave="onPanelLeave"
      >
        <RsDropdownItems
          :items="items"
          :selectable="showSelected"
          :size="resolvedSize"
          :selected-value="model"
          :highlighted-value="highlightedValue"
          :open-submenu-value="openSubmenuValue"
          @select="onItemSelect"
          @highlight="onHighlight"
          @open-submenu="onOpenSubmenu"
          @item-enter="onItemEnter"
        >
          <template v-if="$slots.item" #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
        </RsDropdownItems>
      </div>
      <div
        v-if="open && submenuItem"
        ref="submenuRef"
        class="rs-dropdown__content rs-dropdown__submenu"
        :class="[
          `rs-dropdown__content--${resolvedSize}`,
          `rs-dropdown__content--fit`,
          popupClassName,
        ]"
        :style="submenuStyle"
        :data-rs-theme="panelTheme"
        :data-placement="submenuBox.placement"
        role="menu"
        :aria-label="submenuItem.label"
        @keydown="onMenuKeydown"
        @mouseenter="onPanelEnter"
        @mouseleave="onPanelLeave"
      >
        <RsDropdownItems
          :items="submenuItems"
          :selectable="showSelected"
          :size="resolvedSize"
          :selected-value="model"
          :highlighted-value="submenuHighlight"
          @select="onItemSelect"
          @highlight="onHighlight"
          @item-enter="onItemEnter"
        >
          <template v-if="$slots.item" #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
        </RsDropdownItems>
      </div>
    </Teleport>
  </div>
</template>

<style>
.rs-dropdown {
  display: inline-block;
  min-width: var(--rs-dropdown-trigger-min-width);
}

.rs-dropdown--action {
  min-width: auto;
}

.rs-dropdown--ssm {
  --rs-dropdown-trigger-height: var(--rs-control-height-ssm);
  --rs-dropdown-item-font-size: var(--rs-font-size-xs);
}

.rs-dropdown--sm {
  --rs-dropdown-trigger-height: var(--rs-control-height-sm);
  --rs-dropdown-item-font-size: var(--rs-font-size-sm);
}

.rs-dropdown--md {
  --rs-dropdown-trigger-height: var(--rs-control-height-md);
  --rs-dropdown-item-font-size: var(--rs-font-size-sm);
}

.rs-dropdown--lg {
  --rs-dropdown-trigger-height: var(--rs-control-height-lg);
  --rs-dropdown-item-font-size: var(--rs-font-size-base);
}

.rs-dropdown__trigger-slot {
  display: inline-flex;
  max-width: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
  cursor: pointer;
}

.rs-dropdown__trigger-slot[data-disabled] {
  opacity: var(--rs-dropdown-disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}

.rs-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  width: 100%;
  min-height: var(--rs-dropdown-trigger-height);
  padding-block: 0;
  padding-inline: var(--rs-space-md);
  border-radius: var(--rs-dropdown-item-radius);
  border: 1px solid var(--rs-dropdown-trigger-border);
  background: var(--rs-dropdown-trigger-bg);
  color: var(--rs-dropdown-fg);
  font-size: var(--rs-dropdown-item-font-size);
  line-height: var(--rs-line-height-normal);
  cursor: pointer;
  box-shadow: var(--rs-dropdown-trigger-shadow);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-dropdown__trigger:hover:not(:disabled) {
  border-color: var(--rs-dropdown-trigger-border-hover);
}

.rs-dropdown__trigger:focus-visible {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-dropdown-trigger-bg);
  box-shadow:
    var(--rs-dropdown-trigger-shadow),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-dropdown__trigger:disabled {
  opacity: var(--rs-dropdown-disabled-opacity);
  cursor: not-allowed;
  background: var(--rs-surface-hover);
}

.rs-dropdown__value {
  flex: 1;
  min-width: 0;
  text-align: start;
}

.rs-dropdown__label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-dropdown__label--placeholder {
  color: var(--rs-dropdown-fg-placeholder);
}

.rs-dropdown__icon {
  flex-shrink: 0;
  color: var(--rs-dropdown-fg-muted);
}

.rs-dropdown__content {
  position: fixed;
  z-index: var(--rs-z-dropdown);
  min-width: var(--rs-dropdown-trigger-width, var(--rs-dropdown-trigger-min-width));
  max-height: var(--rs-dropdown-max-height);
  padding: var(--rs-dropdown-pad);
  border-radius: var(--rs-radius);
  border: 1px solid var(--rs-dropdown-border);
  background: var(--rs-dropdown-bg);
  box-shadow: var(--rs-shadow);
  outline: none;
  overflow: auto;
  overscroll-behavior: contain;
}

.rs-dropdown__content--fit {
  min-width: var(--rs-dropdown-fit-min-width);
  width: max-content;
}

.rs-dropdown__group + .rs-dropdown__group {
  margin-block-start: var(--rs-space-md);
  padding-block-start: 0;
  border-block-start: 1px solid var(--rs-dropdown-divider);
}

.rs-dropdown__group-label {
  display: block;
  padding-block: 0.375rem 0.125rem;
  padding-inline: var(--rs-space-md);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  color: var(--rs-dropdown-fg-muted);
  letter-spacing: 0.04em;
  line-height: var(--rs-line-height-tight);
  user-select: none;
}

.rs-dropdown__group + .rs-dropdown__group .rs-dropdown__group-label {
  position: relative;
  inset-block-start: -0.55em;
  margin-block-end: 0.125rem;
  padding-block: 0;
  padding-inline: 0.375rem;
  margin-inline-start: var(--rs-space-md);
  width: fit-content;
  max-width: calc(100% - var(--rs-space-md) * 2);
  background: var(--rs-dropdown-bg);
  line-height: 1;
}

.rs-dropdown__divider {
  display: block;
  height: 0;
  margin-block: var(--rs-space-xs);
  margin-inline: var(--rs-space-sm);
  border: 0;
  border-block-start: 1px solid var(--rs-dropdown-divider);
}

.rs-dropdown__item {
  display: flex;
  align-items: center;
  gap: var(--rs-dropdown-item-gap);
  width: 100%;
  min-height: var(--rs-dropdown-trigger-height);
  padding-block: var(--rs-dropdown-item-pad-block);
  padding-inline: var(--rs-dropdown-item-pad-inline);
  border: 0;
  border-radius: var(--rs-dropdown-item-radius);
  background: transparent;
  font: inherit;
  font-size: var(--rs-dropdown-item-font-size);
  line-height: var(--rs-line-height-tight);
  color: var(--rs-dropdown-fg);
  text-align: start;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  user-select: none;
  transition:
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-dropdown__item-icon {
  flex-shrink: 0;
  color: var(--rs-dropdown-fg-muted);
}

.rs-dropdown__item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-dropdown__item-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.rs-dropdown__item-hint {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-dropdown-fg-muted);
  line-height: var(--rs-line-height-tight);
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rs-dropdown__item-shortcut {
  flex-shrink: 0;
  margin-inline-start: auto;
  padding-block: 0;
  padding-inline: var(--rs-space-xs);
  border-radius: var(--rs-radius-xs);
  border: 1px solid var(--rs-dropdown-divider);
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
  color: var(--rs-dropdown-fg-muted);
}

.rs-dropdown__item-chevron {
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--rs-dropdown-fg-muted);
}

.rs-dropdown__item[data-highlighted] {
  background: var(--rs-dropdown-item-hover);
}

.rs-dropdown__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-dropdown__item[data-state='checked'] {
  color: var(--rs-dropdown-item-active-fg);
  background: var(--rs-dropdown-item-active-bg);
}

.rs-dropdown__item--danger {
  color: var(--rs-dropdown-danger-fg);
}

.rs-dropdown__item--danger[data-highlighted] {
  background: color-mix(in srgb, var(--rs-dropdown-danger-fg) 12%, transparent);
}

.rs-dropdown__item[data-disabled] {
  opacity: var(--rs-dropdown-disabled-opacity);
  cursor: not-allowed;
}

.rs-dropdown__content--ssm .rs-dropdown__item {
  min-height: var(--rs-control-height-ssm);
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  gap: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  align-items: flex-start;
}

.rs-dropdown__content--ssm .rs-dropdown__item-icon {
  margin-block-start: 2px;
}

.rs-dropdown__content--sm .rs-dropdown__item {
  min-height: var(--rs-control-height-sm);
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  font-size: var(--rs-font-size-sm);
}

@media (prefers-reduced-motion: reduce) {
  .rs-dropdown__trigger,
  .rs-dropdown__item {
    transition: none;
  }
}

@media (forced-colors: active) {
  .rs-dropdown__item[data-highlighted],
  .rs-dropdown__item[data-state='checked'] {
    outline: 2px solid Highlight;
  }
}
</style>
