<script setup lang="ts">
import { computed } from 'vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  hasDropdownChildren,
  isDropdownDivider,
  isDropdownItemGroup,
  resolveDropdownExternalRel,
  type RsDropdownItem,
  type RsDropdownItems,
} from './dropdown-utils'
import RsDropdownItemView from './RsDropdownItemView.vue'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize } from '../../../theme/types'

defineOptions({ name: 'RsDropdownItems' })

const props = withDefaults(
  defineProps<{
    items: RsDropdownItems
    /** true：单选互斥；false：操作项 */
    selectable?: boolean
    size?: RsComponentSize
    selectedValue?: string
    highlightedValue?: string
    openSubmenuValue?: string
  }>(),
  {
    selectable: false,
    size: 'md',
  },
)

const emit = defineEmits<{
  select: [value: string]
  highlight: [value: string]
  openSubmenu: [value: string]
  itemEnter: [item: RsDropdownItem]
}>()

const chevronSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[props.size])

function itemRole(item: RsDropdownItem): 'menuitem' | 'menuitemradio' {
  if (props.selectable && !hasDropdownChildren(item)) return 'menuitemradio'
  return 'menuitem'
}

function isSelected(item: RsDropdownItem): boolean {
  return props.selectable && item.value === props.selectedValue && !hasDropdownChildren(item)
}

function isHighlighted(item: RsDropdownItem): boolean {
  return item.value === props.highlightedValue
}

function onActivate(item: RsDropdownItem, event: Event) {
  if (item.disabled) {
    event.preventDefault()
    return
  }
  emit('highlight', item.value)
  if (hasDropdownChildren(item)) {
    emit('openSubmenu', item.value)
    return
  }
  emit('select', item.value)
}

function onEnter(item: RsDropdownItem) {
  if (item.disabled) return
  emit('itemEnter', item)
}
</script>

<template>
  <template v-for="(entry, index) in items" :key="index">
    <div
      v-if="isDropdownItemGroup(entry)"
      class="rs-dropdown__group"
      role="group"
      :aria-label="entry.label"
    >
      <span class="rs-dropdown__group-label" aria-hidden="true">{{ entry.label }}</span>
      <template v-for="item in entry.options" :key="item.value">
        <hr
          v-if="isDropdownDivider(item)"
          class="rs-dropdown__divider"
        />
        <component
          :is="item.href && !hasDropdownChildren(item) ? 'a' : 'button'"
          v-else
          class="rs-dropdown__item"
          :data-dropdown-value="item.value"
          :class="{
            'rs-dropdown__item--danger': item.tone === 'danger',
            'rs-dropdown__item--submenu': hasDropdownChildren(item),
          }"
          :type="item.href && !hasDropdownChildren(item) ? undefined : 'button'"
          :href="item.href && !hasDropdownChildren(item) && !item.disabled ? item.href : undefined"
          :target="item.href && !hasDropdownChildren(item) ? item.target : undefined"
          :rel="item.href && !hasDropdownChildren(item) ? resolveDropdownExternalRel(item) : undefined"
          :role="itemRole(item)"
          :disabled="item.href ? undefined : item.disabled"
          :aria-disabled="item.disabled ? 'true' : undefined"
          :aria-checked="itemRole(item) === 'menuitemradio' ? isSelected(item) : undefined"
          :aria-haspopup="hasDropdownChildren(item) ? 'menu' : undefined"
          :aria-expanded="hasDropdownChildren(item) ? item.value === openSubmenuValue : undefined"
          :tabindex="isHighlighted(item) ? 0 : -1"
          :data-state="isSelected(item) ? 'checked' : undefined"
          :data-highlighted="isHighlighted(item) ? '' : undefined"
          :data-disabled="item.disabled ? '' : undefined"
          @click="onActivate(item, $event)"
          @mouseenter="onEnter(item)"
        >
          <slot name="item" v-bind="{ item, selected: isSelected(item), highlighted: isHighlighted(item) }">
            <RsDropdownItemView :item="item" :size="size" />
          </slot>
          <RsIcon
            v-if="hasDropdownChildren(item)"
            name="chevron-right"
            :size="chevronSize"
            class="rs-dropdown__item-chevron"
            aria-hidden="true"
          />
        </component>
      </template>
    </div>

    <hr
      v-else-if="isDropdownDivider(entry)"
      :key="`div-${index}`"
      class="rs-dropdown__divider"
    />

    <component
      :is="entry.href && !hasDropdownChildren(entry) ? 'a' : 'button'"
      v-else
      :key="`item-${entry.value}`"
      class="rs-dropdown__item"
      :data-dropdown-value="entry.value"
      :class="{
        'rs-dropdown__item--danger': entry.tone === 'danger',
        'rs-dropdown__item--submenu': hasDropdownChildren(entry),
      }"
      :type="entry.href && !hasDropdownChildren(entry) ? undefined : 'button'"
      :href="entry.href && !hasDropdownChildren(entry) && !entry.disabled ? entry.href : undefined"
      :target="entry.href && !hasDropdownChildren(entry) ? entry.target : undefined"
      :rel="entry.href && !hasDropdownChildren(entry) ? resolveDropdownExternalRel(entry) : undefined"
      :role="itemRole(entry)"
      :disabled="entry.href ? undefined : entry.disabled"
      :aria-disabled="entry.disabled ? 'true' : undefined"
      :aria-checked="itemRole(entry) === 'menuitemradio' ? isSelected(entry) : undefined"
      :aria-haspopup="hasDropdownChildren(entry) ? 'menu' : undefined"
      :aria-expanded="hasDropdownChildren(entry) ? entry.value === openSubmenuValue : undefined"
      :tabindex="isHighlighted(entry) ? 0 : -1"
      :data-state="isSelected(entry) ? 'checked' : undefined"
      :data-highlighted="isHighlighted(entry) ? '' : undefined"
      :data-disabled="entry.disabled ? '' : undefined"
      @click="onActivate(entry, $event)"
      @mouseenter="onEnter(entry)"
    >
      <slot name="item" v-bind="{ item: entry, selected: isSelected(entry), highlighted: isHighlighted(entry) }">
        <RsDropdownItemView :item="entry" :size="size" />
      </slot>
      <RsIcon
        v-if="hasDropdownChildren(entry)"
        name="chevron-right"
        :size="chevronSize"
        class="rs-dropdown__item-chevron"
        aria-hidden="true"
      />
    </component>
  </template>
</template>
