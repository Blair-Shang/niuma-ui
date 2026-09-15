<script setup lang="ts">
/** 下拉项内容：图标 + 标题 + 可选说明，密度由 size 控制。 */
import { computed } from 'vue'
import RsIcon from './RsIcon.vue'
import type { RsDropdownItem } from './dropdown-utils'
import { RS_COMPONENT_SIZE_ICON_PX, type RsComponentSize } from '../theme/types'

const props = withDefaults(
  defineProps<{
    item: RsDropdownItem
    size?: RsComponentSize
  }>(),
  {
    size: 'md',
  },
)

const iconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[props.size])
</script>

<template>
  <RsIcon
    v-if="item.icon"
    :name="item.icon"
    :size="iconSize"
    class="rs-dropdown__item-icon"
  />
  <span class="rs-dropdown__item-copy">
    <span class="rs-dropdown__item-label">{{ item.label }}</span>
    <span v-if="item.hint" class="rs-dropdown__item-hint">{{ item.hint }}</span>
  </span>
</template>
