<script setup lang="ts">
withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
    dashed?: boolean
  }>(),
  {
    orientation: 'horizontal',
    dashed: false,
  },
)
</script>

<template>
  <div
    class="rs-divider"
    :class="[
      `rs-divider--${orientation}`,
      { 'rs-divider--dashed': dashed, 'rs-divider--with-label': $slots.default },
    ]"
    role="separator"
    :aria-orientation="orientation"
  >
    <span v-if="$slots.default && orientation === 'horizontal'" class="rs-divider__label">
      <slot />
    </span>
  </div>
</template>

<style scoped>
.rs-divider {
  flex-shrink: 0;
  box-sizing: border-box;
  border: 0;
  background: transparent;
}

.rs-divider--horizontal {
  display: flex;
  align-items: center;
  width: 100%;
  margin: var(--rs-space-md) 0;
}

.rs-divider--horizontal:not(.rs-divider--with-label)::before {
  content: '';
  display: block;
  width: 100%;
  border-top: 1px solid var(--rs-border);
}

.rs-divider--horizontal.rs-divider--dashed:not(.rs-divider--with-label)::before {
  border-top-style: dashed;
}

.rs-divider--horizontal.rs-divider--with-label::before,
.rs-divider--horizontal.rs-divider--with-label::after {
  content: '';
  flex: 1 1 auto;
  border-top: 1px solid var(--rs-border);
}

.rs-divider--horizontal.rs-divider--dashed.rs-divider--with-label::before,
.rs-divider--horizontal.rs-divider--dashed.rs-divider--with-label::after {
  border-top-style: dashed;
}

.rs-divider__label {
  flex-shrink: 0;
  padding: 0 var(--rs-space-md);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
  white-space: nowrap;
}

.rs-divider--vertical {
  display: inline-block;
  align-self: stretch;
  width: 0;
  min-height: 1em;
  margin: 0 var(--rs-space-md);
  border-left: 1px solid var(--rs-border);
  vertical-align: middle;
}

.rs-divider--vertical.rs-divider--dashed {
  border-left-style: dashed;
}
</style>
