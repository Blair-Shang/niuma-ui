<script setup lang="ts">
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
} from '../../_shared/src/reka'
import {
  isDropdownItemGroup,
  type RsDropdownItem,
  type RsDropdownItems,
} from './dropdown-utils'
import RsDropdownItemView from './RsDropdownItemView.vue'
import type { RsComponentSize } from '../../../theme/types'

withDefaults(
  defineProps<{
    items: RsDropdownItems
    /** true：单选互斥；false：操作项 */
    selectable?: boolean
    size?: RsComponentSize
  }>(),
  {
    selectable: false,
    size: 'md',
  },
)

const emit = defineEmits<{
  select: [value: string]
}>()

function onActionSelect(item: RsDropdownItem) {
  if (item.disabled) return
  emit('select', item.value)
}
</script>

<template>
  <template v-for="(entry, index) in items" :key="index">
    <DropdownMenuGroup v-if="isDropdownItemGroup(entry)" :key="`group-${index}`" class="rs-dropdown__group">
      <DropdownMenuLabel class="rs-dropdown__group-label">
        {{ entry.label }}
      </DropdownMenuLabel>
      <template v-if="selectable">
        <DropdownMenuRadioItem
          v-for="item in entry.options"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
          class="rs-dropdown__item"
        >
          <RsDropdownItemView :item="item" :size="size" />
        </DropdownMenuRadioItem>
      </template>
      <template v-else>
        <DropdownMenuItem
          v-for="item in entry.options"
          :key="item.value"
          :disabled="item.disabled"
          class="rs-dropdown__item"
          @select="onActionSelect(item)"
        >
          <RsDropdownItemView :item="item" :size="size" />
        </DropdownMenuItem>
      </template>
    </DropdownMenuGroup>

    <DropdownMenuRadioItem
      v-else-if="selectable"
      :key="`radio-${entry.value}`"
      :value="entry.value"
      :disabled="entry.disabled"
      class="rs-dropdown__item"
    >
      <RsDropdownItemView :item="entry" :size="size" />
    </DropdownMenuRadioItem>

    <DropdownMenuItem
      v-else
      :key="`action-${entry.value}`"
      :disabled="entry.disabled"
      class="rs-dropdown__item"
      @select="onActionSelect(entry)"
    >
      <RsDropdownItemView :item="entry" :size="size" />
    </DropdownMenuItem>
  </template>
</template>
