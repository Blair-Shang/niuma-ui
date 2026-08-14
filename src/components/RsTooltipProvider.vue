<script setup lang="ts">
import { TooltipProvider } from './reka'

withDefaults(
  defineProps<{
    delayDuration?: number
    skipDelayDuration?: number
    /**
     * 仅键盘 focus-visible 时因焦点打开 tip。
     * 默认 true：避免 Dialog/Popover 关闭回焦、切页签等非键盘焦点误开（对齐 Reka 推荐与 RsButton tooltip）。
     */
    ignoreNonKeyboardFocus?: boolean
  }>(),
  {
    delayDuration: 300,
    skipDelayDuration: 0,
    ignoreNonKeyboardFocus: true,
  },
)
</script>

<template>
  <TooltipProvider
    :delay-duration="delayDuration"
    :skip-delay-duration="skipDelayDuration"
    :ignore-non-keyboard-focus="ignoreNonKeyboardFocus"
  >
    <slot />
  </TooltipProvider>
</template>
