<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
import { type RsDividerOrientation } from './divider-utils'

defineOptions({ name: 'RsDivider' })

export type { RsDividerOrientation }

const props = withDefaults(
  defineProps<{
    orientation?: RsDividerOrientation
    dashed?: boolean
  }>(),
  {
    orientation: 'horizontal',
    dashed: false,
  },
)

const slots = useSlots()
const labelId = useId()
const hasSlot = computed(() => Boolean(slots.default))
const showLabel = computed(() => hasSlot.value && props.orientation === 'horizontal')

const rootClass = computed(() => [
  'rs-divider',
  `rs-divider--${props.orientation}`,
  {
    'rs-divider--dashed': props.dashed,
    'rs-divider--with-label': hasSlot.value,
  },
])
</script>

<template>
  <hr
    v-if="!showLabel"
    :class="rootClass"
    :aria-orientation="orientation"
  />
  <div v-else :class="rootClass">
    <span :id="labelId" class="rs-divider__label">
      <slot />
    </span>
  </div>
</template>

<style scoped>
.rs-divider {
  --rs-divider-color: var(--rs-border);
  --rs-divider-width: 1px;
  --rs-divider-gap: var(--rs-space-md);
  flex-shrink: 0;
  box-sizing: border-box;
  border: 0;
  background: transparent;
}

.rs-divider--horizontal {
  display: flex;
  align-items: center;
  width: 100%;
  margin-block: var(--rs-divider-gap);
  margin-inline: 0;
}

hr.rs-divider--horizontal {
  display: block;
  height: 0;
  border-block-start: var(--rs-divider-width) solid var(--rs-divider-color);
}

hr.rs-divider--horizontal.rs-divider--dashed {
  border-block-start-style: dashed;
}

.rs-divider--horizontal.rs-divider--with-label::before,
.rs-divider--horizontal.rs-divider--with-label::after {
  content: '';
  flex: 1 1 auto;
  border-block-start: var(--rs-divider-width) solid var(--rs-divider-color);
}

.rs-divider--horizontal.rs-divider--dashed.rs-divider--with-label::before,
.rs-divider--horizontal.rs-divider--dashed.rs-divider--with-label::after {
  border-block-start-style: dashed;
}

.rs-divider__label {
  flex-shrink: 0;
  padding-block: 0;
  padding-inline: var(--rs-divider-gap);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
  white-space: nowrap;
}

.rs-divider--vertical {
  display: inline-block;
  align-self: stretch;
  width: 0;
  min-height: 1em;
  margin-block: 0;
  margin-inline: var(--rs-divider-gap);
  border-inline-start: var(--rs-divider-width) solid var(--rs-divider-color);
  vertical-align: middle;
}

.rs-divider--vertical.rs-divider--dashed {
  border-inline-start-style: dashed;
}

@media (forced-colors: active) {
  hr.rs-divider--horizontal,
  .rs-divider--horizontal.rs-divider--with-label::before,
  .rs-divider--horizontal.rs-divider--with-label::after {
    border-block-start-color: CanvasText;
  }

  .rs-divider--vertical {
    border-inline-start-color: CanvasText;
  }
}
</style>
