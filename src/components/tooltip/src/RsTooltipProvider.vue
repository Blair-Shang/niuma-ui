<script setup lang="ts">
import { onUnmounted, provide, ref } from 'vue'
import {
  RS_TOOLTIP_DEFAULT_DELAY,
  RS_TOOLTIP_DEFAULT_SKIP_DELAY,
  clampTooltipDelay,
  rsTooltipGroupKey,
  type RsTooltipGroup,
} from './tooltip-utils'

defineOptions({ name: 'RsTooltipProvider' })

const props = withDefaults(
  defineProps<{
    delayDuration?: number
    skipDelayDuration?: number
    /**
     * 仅键盘 :focus-visible 时因焦点打开。
     * 单条 RsTooltip 传了同名 prop 时以单条为准。
     */
    ignoreNonKeyboardFocus?: boolean
  }>(),
  {
    delayDuration: RS_TOOLTIP_DEFAULT_DELAY,
    skipDelayDuration: RS_TOOLTIP_DEFAULT_SKIP_DELAY,
    ignoreNonKeyboardFocus: true,
  },
)

const warm = ref(false)
let openCount = 0
let graceTimer: ReturnType<typeof setTimeout> | null = null

function clearGrace(): void {
  if (graceTimer == null) return
  clearTimeout(graceTimer)
  graceTimer = null
}

function notifyOpen(): void {
  openCount += 1
  clearGrace()
  warm.value = true
}

function notifyClose(): void {
  openCount = Math.max(0, openCount - 1)
  if (openCount > 0) return
  clearGrace()
  const wait = clampTooltipDelay(props.skipDelayDuration, RS_TOOLTIP_DEFAULT_SKIP_DELAY)
  if (wait <= 0) {
    warm.value = false
    return
  }
  graceTimer = setTimeout(() => {
    graceTimer = null
    if (openCount === 0) warm.value = false
  }, wait)
}

const group: RsTooltipGroup = {
  get delayDuration() {
    return clampTooltipDelay(props.delayDuration, RS_TOOLTIP_DEFAULT_DELAY)
  },
  get skipDelayDuration() {
    return clampTooltipDelay(props.skipDelayDuration, RS_TOOLTIP_DEFAULT_SKIP_DELAY)
  },
  get ignoreNonKeyboardFocus() {
    return props.ignoreNonKeyboardFocus
  },
  shouldSkipDelay: () => warm.value,
  notifyOpen,
  notifyClose,
}

provide(rsTooltipGroupKey, group)

onUnmounted(() => {
  clearGrace()
  openCount = 0
  warm.value = false
})
</script>

<template>
  <slot />
</template>
