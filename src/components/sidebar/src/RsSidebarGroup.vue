<script setup lang="ts">
import { computed, inject } from 'vue'
import { resolveRsSidebarCollapsed, RS_SIDEBAR_KEY } from './sidebar-utils'

defineOptions({ name: 'RsSidebarGroup' })

const props = withDefaults(
  defineProps<{
    title?: string
    collapsed?: boolean
  }>(),
  {
    collapsed: undefined,
  },
)

const ctx = inject(RS_SIDEBAR_KEY, null)
const isCollapsed = computed(() => resolveRsSidebarCollapsed(props.collapsed, ctx?.collapsed.value))
const orientation = computed(() => ctx?.orientation.value ?? 'vertical')
</script>

<template>
  <section
    class="rs-sidebar-group"
    :class="[`rs-sidebar-group--${orientation}`, { 'rs-sidebar-group--collapsed': isCollapsed }]"
    :role="title ? 'group' : undefined"
    :aria-label="title || undefined"
  >
    <div v-if="title && !isCollapsed" class="rs-sidebar-group__title">{{ title }}</div>
    <div class="rs-sidebar-group__body">
      <slot :collapsed="isCollapsed" />
    </div>
  </section>
</template>

<style scoped>
.rs-sidebar-group + .rs-sidebar-group {
  margin-block-start: var(--rs-sidebar-group-gap);
}

.rs-sidebar-group--horizontal + .rs-sidebar-group--horizontal {
  margin-block-start: 0;
  margin-inline-start: var(--rs-sidebar-group-gap);
}

.rs-sidebar-group__title {
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  color: var(--rs-sidebar-subtitle);
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: 0.04em;
}

.rs-sidebar-group__body {
  display: grid;
  gap: var(--rs-space-xs);
}

.rs-sidebar-group--horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-inline-size: 0;
}

.rs-sidebar-group--horizontal .rs-sidebar-group__body {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}
</style>
