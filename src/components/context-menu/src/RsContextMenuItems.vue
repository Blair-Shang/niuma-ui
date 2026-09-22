<script setup lang="ts">
import { ref, watch } from 'vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  RS_CONTEXT_MENU_ARROW_SIZE,
  contextMenuItemRole,
  hasContextMenuChildren,
  isContextMenuSeparator,
  resolveContextMenuRel,
  type RsContextMenuItem,
} from './context-menu-utils'

const props = defineProps<{
  items: RsContextMenuItem[]
  highlight: string
  openKey: string
  menuId: string
  layerId: string
  iconSize: number
}>()

const emit = defineEmits<{
  select: [item: RsContextMenuItem]
  hover: [item: RsContextMenuItem]
}>()

const current = ref(props.highlight)

watch(
  () => props.highlight,
  (key) => {
    current.value = key
  },
)

function onPointerEnter(item: RsContextMenuItem) {
  if (current.value !== item.key) current.value = item.key
  emit('hover', item)
}

defineExpose({
  getHighlight: () => current.value,
  setHighlight: (key: string) => {
    current.value = key
  },
})

function itemId(item: RsContextMenuItem, index: number): string {
  return `${props.menuId}-${props.layerId}-${index}`
}

function onClick(item: RsContextMenuItem, event: MouseEvent) {
  if (item.disabled || isContextMenuSeparator(item)) {
    event.preventDefault()
    return
  }
  if (event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    emit('select', item)
    return
  }
  emit('select', item)
}
</script>

<template>
  <template v-for="(item, index) in items" :key="item.key">
    <p v-if="isContextMenuSeparator(item) && item.label" class="rs-context-menu__group">
      {{ item.label }}
    </p>
    <hr v-else-if="isContextMenuSeparator(item)" class="rs-context-menu__separator" />
    <component
      :is="item.href && !item.disabled ? 'a' : 'button'"
      v-else
      :id="itemId(item, index)"
      :type="item.href && !item.disabled ? undefined : 'button'"
      :href="item.href && !item.disabled ? item.href : undefined"
      :target="item.href && !item.disabled ? item.target : undefined"
      :rel="item.href && !item.disabled ? resolveContextMenuRel(item) : undefined"
      class="rs-context-menu__item"
      :class="{ 'rs-context-menu__item--danger': item.danger }"
      :role="contextMenuItemRole(item)"
      :tabindex="item.key === current && !item.disabled ? 0 : -1"
      :data-ctx-key="item.key"
      :data-highlighted="item.key === current ? '' : undefined"
      :data-state="item.key === openKey ? 'open' : undefined"
      :data-disabled="item.disabled ? '' : undefined"
      :aria-disabled="item.disabled ? 'true' : undefined"
      :aria-checked="item.type === 'checkbox' || item.type === 'radio' ? Boolean(item.checked) : undefined"
      :aria-haspopup="hasContextMenuChildren(item) ? 'menu' : undefined"
      :aria-expanded="hasContextMenuChildren(item) ? item.key === openKey : undefined"
      @click="onClick(item, $event)"
      @pointerenter="onPointerEnter(item)"
    >
      <span class="rs-context-menu__icon-cell">
        <RsIcon
          v-if="(item.type === 'checkbox' || item.type === 'radio') && item.checked"
          name="check"
          :size="iconSize"
        />
        <RsIcon v-else-if="item.icon" :name="item.icon" :size="iconSize" />
      </span>
      <span class="rs-context-menu__text">
        <slot
          name="item"
          :item="item"
          :highlighted="item.key === current"
          :checked="Boolean(item.checked)"
        >
          <span class="rs-context-menu__label">{{ item.label }}</span>
          <span v-if="item.hint" class="rs-context-menu__hint">{{ item.hint }}</span>
        </slot>
      </span>
      <span v-if="item.shortcut" class="rs-context-menu__shortcut">{{ item.shortcut }}</span>
      <RsIcon
        v-if="hasContextMenuChildren(item)"
        name="chevron-right"
        :size="RS_CONTEXT_MENU_ARROW_SIZE"
        class="rs-context-menu__arrow"
      />
    </component>
  </template>
</template>
