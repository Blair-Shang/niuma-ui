<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  isRsSidebarTypingTarget,
  matchesRsSidebarHotkey,
  resolveRsSidebarCollapseIcon,
  resolveRsSidebarOrientation,
  resolveRsSidebarPlacement,
  resolveRsSidebarWidth,
  RS_SIDEBAR_KEY,
  type RsSidebarExpose,
  type RsSidebarOrientation,
  type RsSidebarPlacement,
  type RsSidebarWidth,
} from './sidebar-utils'

defineOptions({ name: 'RsSidebar' })

const collapsed = defineModel<boolean>('collapsed', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    collapsible?: boolean
    width?: RsSidebarWidth
    orientation?: RsSidebarOrientation
    placement?: RsSidebarPlacement
    /**
     * Ctrl/Cmd + 该键切换折叠。未传不监听。
     * 输入框 / 可编辑节点内不触发。
     */
    hotkey?: string
    id?: string
    ariaLabel?: string
  }>(),
  {
    collapsible: false,
    width: 'md',
    orientation: 'vertical',
    placement: 'left',
  },
)

const emit = defineEmits<{
  change: [collapsed: boolean]
}>()

const { t } = useRsI18n()
const rootRef = ref<HTMLElement | null>(null)
const collapseRef = ref<HTMLButtonElement | null>(null)
const bodyId = useId()

const resolvedWidth = computed(() => resolveRsSidebarWidth(props.width))
const resolvedOrientation = computed(() => resolveRsSidebarOrientation(props.orientation))
const resolvedPlacement = computed(() => resolveRsSidebarPlacement(props.placement))
const asideLabel = computed(() => props.ariaLabel || props.title || t('sidebar.label'))
const collapseLabel = computed(() =>
  collapsed.value ? t('sidebar.expand') : t('sidebar.collapse'),
)
const collapseIcon = computed(() =>
  resolveRsSidebarCollapseIcon(
    resolvedOrientation.value,
    resolvedPlacement.value,
    collapsed.value,
  ),
)

provide(RS_SIDEBAR_KEY, {
  collapsed: computed(() => collapsed.value),
  orientation: resolvedOrientation,
  placement: resolvedPlacement,
})

function setCollapsed(next: boolean) {
  if (collapsed.value === next) return
  collapsed.value = next
  emit('change', next)
}

function expand() {
  setCollapsed(false)
}

function collapseSidebar() {
  setCollapsed(true)
}

function toggle() {
  setCollapsed(!collapsed.value)
}

function focus() {
  if (collapseRef.value) {
    collapseRef.value.focus()
    return
  }
  rootRef.value?.focus()
}

function onHotkey(event: KeyboardEvent) {
  if (!props.hotkey) return
  if (isRsSidebarTypingTarget(event.target)) return
  if (!matchesRsSidebarHotkey(event, props.hotkey)) return
  event.preventDefault()
  toggle()
}

function attachHotkey() {
  if (typeof document === 'undefined' || !props.hotkey) return
  document.addEventListener('keydown', onHotkey)
}

function detachHotkey() {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onHotkey)
}

watch(
  () => props.hotkey,
  (next, prev) => {
    if (prev) detachHotkey()
    if (next) attachHotkey()
  },
)

onMounted(() => {
  if (props.hotkey) attachHotkey()
})

onUnmounted(() => {
  detachHotkey()
})

defineExpose<RsSidebarExpose>({
  expand,
  collapse: collapseSidebar,
  toggle,
  focus,
})
</script>

<template>
  <aside
    :id="id"
    ref="rootRef"
    class="rs-sidebar rs-motion-reduce"
    :class="[
      `rs-sidebar--${resolvedWidth}`,
      `rs-sidebar--${resolvedOrientation}`,
      `rs-sidebar--${resolvedPlacement}`,
      { 'rs-sidebar--collapsed': collapsed },
    ]"
    :aria-label="asideLabel"
    tabindex="-1"
  >
    <header
      v-if="title || subtitle || collapsible || $slots.header"
      class="rs-sidebar__header"
    >
      <slot name="header">
        <div class="rs-sidebar__title-wrap">
          <strong v-if="title" class="rs-sidebar__title">{{ title }}</strong>
          <span v-if="subtitle && !collapsed" class="rs-sidebar__subtitle">{{ subtitle }}</span>
        </div>
        <button
          v-if="collapsible"
          ref="collapseRef"
          type="button"
          class="rs-sidebar__collapse"
          :aria-label="collapseLabel"
          :aria-expanded="!collapsed"
          :aria-controls="bodyId"
          @click="toggle"
        >
          <RsIcon :name="collapseIcon" size="sm" class="rs-sidebar__collapse-icon" />
        </button>
      </slot>
    </header>
    <nav :id="bodyId" class="rs-sidebar__body" :aria-label="t('sidebar.nav')">
      <slot :collapsed="collapsed" />
    </nav>
    <footer v-if="$slots.footer" class="rs-sidebar__footer">
      <slot name="footer" :collapsed="collapsed" />
    </footer>
  </aside>
</template>

<style scoped>
.rs-sidebar {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
  border: 1px solid var(--rs-sidebar-border);
  background: var(--rs-sidebar-bg);
  color: var(--rs-sidebar-title);
}

.rs-sidebar:focus {
  outline: none;
}

.rs-sidebar:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-sidebar--sm {
  inline-size: var(--rs-sidebar-width-sm);
}

.rs-sidebar--md {
  inline-size: var(--rs-sidebar-width-md);
}

.rs-sidebar--lg {
  inline-size: var(--rs-sidebar-width-lg);
}

.rs-sidebar--collapsed {
  inline-size: var(--rs-sidebar-width-collapsed);
}

.rs-sidebar--horizontal,
.rs-sidebar--horizontal.rs-sidebar--sm,
.rs-sidebar--horizontal.rs-sidebar--md,
.rs-sidebar--horizontal.rs-sidebar--lg,
.rs-sidebar--horizontal.rs-sidebar--collapsed {
  flex-direction: row;
  align-items: stretch;
  inline-size: 100%;
  min-block-size: var(--rs-control-height-lg);
}

.rs-sidebar__header,
.rs-sidebar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-sidebar-gap);
  padding: var(--rs-sidebar-pad);
  border-block-end: 1px solid var(--rs-sidebar-border);
}

.rs-sidebar__footer {
  border-block-start: 1px solid var(--rs-sidebar-border);
  border-block-end: 0;
}

.rs-sidebar--horizontal .rs-sidebar__header {
  border-block-end: 0;
  border-inline-end: 1px solid var(--rs-sidebar-border);
}

.rs-sidebar--horizontal .rs-sidebar__footer {
  border-block-start: 0;
  border-inline-start: 1px solid var(--rs-sidebar-border);
}

.rs-sidebar__body {
  flex: 1;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: auto;
  padding: var(--rs-sidebar-body-pad);
}

.rs-sidebar--horizontal .rs-sidebar__body {
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
}

.rs-sidebar__title-wrap {
  min-inline-size: 0;
}

.rs-sidebar__title,
.rs-sidebar__subtitle {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-sidebar__title {
  color: var(--rs-sidebar-title);
  font-weight: var(--rs-font-weight-semibold);
}

.rs-sidebar__subtitle {
  color: var(--rs-sidebar-subtitle);
  font-size: var(--rs-font-size-xs);
}

.rs-sidebar__collapse {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  inline-size: var(--rs-control-height-sm);
  block-size: var(--rs-control-height-sm);
  padding: 0;
  border: 1px solid var(--rs-sidebar-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  color: var(--rs-sidebar-subtitle);
  cursor: pointer;
  transition:
    background-color var(--rs-transition-fast),
    color var(--rs-transition-fast),
    border-color var(--rs-transition-fast);
}

.rs-sidebar__collapse:hover {
  background: var(--rs-surface-hover);
  color: var(--rs-sidebar-title);
}

.rs-sidebar__collapse:focus {
  outline: none;
}

.rs-sidebar__collapse:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}
</style>
