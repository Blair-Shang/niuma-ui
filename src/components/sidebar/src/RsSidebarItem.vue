<script setup lang="ts">
import { computed, inject } from 'vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  hasRsSidebarBadge,
  mergeRsSidebarLinkRel,
  resolveRsSidebarCollapsed,
  resolveRsSidebarItemHref,
  resolveRsSidebarItemTag,
  RS_SIDEBAR_KEY,
} from './sidebar-utils'

defineOptions({ name: 'RsSidebarItem' })

const props = withDefaults(
  defineProps<{
    label: string
    icon?: string
    active?: boolean
    disabled?: boolean
    collapsed?: boolean
    href?: string
    to?: string
    target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})
    rel?: string
    badge?: string | number
  }>(),
  {
    collapsed: undefined,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const ctx = inject(RS_SIDEBAR_KEY, null)
const isCollapsed = computed(() => resolveRsSidebarCollapsed(props.collapsed, ctx?.collapsed.value))
const orientation = computed(() => ctx?.orientation.value ?? 'vertical')
const itemHref = computed(() => resolveRsSidebarItemHref(props.href, props.to))
const itemTag = computed(() => resolveRsSidebarItemTag(itemHref.value))
const itemRel = computed(() => mergeRsSidebarLinkRel(props.rel, props.target))
const showBadge = computed(() => hasRsSidebarBadge(props.badge))
const tooltip = computed(() => (isCollapsed.value ? props.label : undefined))

function onClick(event: MouseEvent) {
  emit('click', event)
  if (props.disabled) event.preventDefault()
}
</script>

<template>
  <component
    :is="itemTag"
    class="rs-sidebar-item rs-motion-reduce"
    :class="{
      'rs-sidebar-item--active': active,
      'rs-sidebar-item--collapsed': isCollapsed,
      [`rs-sidebar-item--${orientation}`]: true,
    }"
    :href="itemTag === 'a' ? itemHref : undefined"
    :target="itemTag === 'a' ? target : undefined"
    :rel="itemTag === 'a' ? itemRel : undefined"
    :type="itemTag === 'button' ? 'button' : undefined"
    :disabled="itemTag === 'button' ? disabled : undefined"
    :aria-disabled="itemTag === 'a' && disabled ? 'true' : undefined"
    :aria-current="active ? 'page' : undefined"
    :title="tooltip"
    @click="onClick"
  >
    <RsIcon v-if="icon" :name="icon" class="rs-sidebar-item__icon" />
    <span v-if="!isCollapsed" class="rs-sidebar-item__label">{{ label }}</span>
    <span
      v-if="showBadge"
      class="rs-sidebar-item__badge"
      :class="{ 'rs-sidebar-item__badge--dot': isCollapsed }"
    >
      <slot name="badge" :collapsed="isCollapsed" :badge="badge">
        <template v-if="!isCollapsed">{{ badge }}</template>
      </slot>
    </span>
    <slot :collapsed="isCollapsed" />
  </component>
</template>

<style scoped>
.rs-sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--rs-sidebar-gap);
  inline-size: 100%;
  min-block-size: var(--rs-control-height-md);
  box-sizing: border-box;
  padding-block: 0;
  padding-inline: var(--rs-space-sm);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-sidebar-item);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--rs-transition-fast),
    border-color var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.rs-sidebar-item--horizontal {
  inline-size: auto;
}

.rs-sidebar-item:hover:not(:disabled):not([aria-disabled='true']) {
  background: var(--rs-sidebar-item-hover-bg);
  color: var(--rs-sidebar-item-hover);
}

.rs-sidebar-item--active {
  background: var(--rs-sidebar-item-active-bg);
  color: var(--rs-sidebar-item-active);
}

.rs-sidebar-item--collapsed {
  justify-content: center;
  padding-inline: 0;
}

.rs-sidebar-item:disabled,
.rs-sidebar-item[aria-disabled='true'] {
  opacity: var(--rs-sidebar-disabled-opacity);
  cursor: not-allowed;
}

.rs-sidebar-item:focus {
  outline: none;
}

.rs-sidebar-item:focus-visible {
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-sidebar-item__icon {
  flex: 0 0 auto;
}

.rs-sidebar-item__label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-sidebar-item__badge {
  margin-inline-start: auto;
  min-inline-size: 1.1em;
  padding-block: 0;
  padding-inline: var(--rs-space-xs);
  border-radius: var(--rs-radius-full);
  background: var(--rs-sidebar-badge-bg);
  color: var(--rs-sidebar-badge);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  text-align: center;
}

.rs-sidebar-item__badge--dot {
  min-inline-size: 0.45rem;
  block-size: 0.45rem;
  padding: 0;
  margin-inline-start: 0;
}
</style>
