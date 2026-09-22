<script setup lang="ts">
import { computed, type Component } from 'vue'
import { isRsBrandIconName, resolveLucideIcon } from '../../../icons/registry'
import type { RsComponentSize } from '../../../theme/types'
import {
  buildRsIconStyle,
  resolveRsIconPixelSize,
  type RsIconFlip,
} from './icon-utils'

defineOptions({ name: 'RsIcon' })

const props = withDefaults(
  defineProps<{
    /** Lucide kebab-case（如 `house`）、内置品牌 mark，或 `registerRsIcon` 登记的名字 */
    name: string
    /** 数字 px、CSS 长度，或与控件同一套 ssm / sm / md / lg */
    size?: number | string | RsComponentSize
    /** 无障碍名称；有值时作为语义图标，无值时为装饰性图标 */
    label?: string
    strokeWidth?: number | string
    /** 覆盖颜色，默认继承 currentColor */
    color?: string
    /** 水平 / 垂直 / 双向翻转 */
    flip?: RsIconFlip
    /** 旋转角度（度），与 spin 不宜同时使用 */
    rotate?: number
    /** 旋转动画，适合 loader 等加载态 */
    spin?: boolean
  }>(),
  {
    size: 'md',
    strokeWidth: 1.75,
  },
)

const iconComponent = computed<Component | undefined>(() => resolveLucideIcon(props.name))

const lucideSize = computed(() => resolveRsIconPixelSize(props.size))

const isBrand = computed(() => isRsBrandIconName(props.name))

const iconStyle = computed(() =>
  buildRsIconStyle({
    color: props.color,
    flip: props.flip,
    rotate: props.rotate,
    size: props.size,
  }),
)

const isSemantic = computed(() => Boolean(props.label))
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    class="rs-icon"
    :class="{ 'rs-icon--spin': spin, 'rs-icon--brand': isBrand }"
    :style="iconStyle"
    :size="lucideSize"
    :stroke-width="strokeWidth"
    :color="color"
    :aria-hidden="isSemantic ? undefined : true"
    :aria-label="label"
    :role="isSemantic ? 'img' : undefined"
  />
</template>

<style scoped>
.rs-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
.rs-icon--spin {
  animation: rs-icon-spin 0.8s linear infinite;
}
@keyframes rs-icon-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rs-icon--spin {
    animation: none;
  }
}
</style>
