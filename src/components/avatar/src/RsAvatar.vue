<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  getAvatarInitials,
  resolveRsAvatarShape,
  resolveRsAvatarSize,
  resolveRsAvatarTone,
  RS_AVATAR_ICON_PX,
  type RsAvatarShape,
  type RsAvatarSize,
  type RsAvatarTone,
} from './avatar-utils'

defineOptions({ name: 'RsAvatar' })

export type { RsAvatarShape, RsAvatarSize, RsAvatarTone }

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    name?: string
    fallback?: string
    icon?: string
    size?: RsAvatarSize
    shape?: RsAvatarShape
    tone?: RsAvatarTone
    label?: string
  }>(),
  {
    src: undefined,
    alt: undefined,
    name: undefined,
    fallback: undefined,
    size: 'md',
    shape: 'circle',
    tone: 'primary',
    icon: 'user',
    label: undefined,
  },
)

const imageLoaded = ref(false)
const imageFailed = ref(false)

watch(
  () => props.src,
  () => {
    imageLoaded.value = false
    imageFailed.value = false
  },
)

const resolvedSize = computed(() => resolveRsAvatarSize(props.size))
const resolvedShape = computed(() => resolveRsAvatarShape(props.shape))
const resolvedTone = computed(() => resolveRsAvatarTone(props.tone))
const iconPx = computed(() => RS_AVATAR_ICON_PX[resolvedSize.value])

const fallbackText = computed(() => {
  if (props.fallback?.trim()) return props.fallback.trim()
  if (props.name?.trim()) return getAvatarInitials(props.name)
  return ''
})

const showIconFallback = computed(() => !fallbackText.value)
const showImage = computed(() => Boolean(props.src) && !imageFailed.value)
const showFallback = computed(() => !showImage.value || !imageLoaded.value)
const pictureReady = computed(() => showImage.value && imageLoaded.value)
const imageAlt = computed(() => props.alt ?? props.name ?? '')
const ariaLabel = computed(() => props.label ?? props.alt ?? props.name ?? undefined)
const rootRole = computed(() => {
  if (pictureReady.value || !ariaLabel.value) return undefined
  return 'img'
})
const rootLabel = computed(() => (pictureReady.value ? undefined : ariaLabel.value))

function onLoad() {
  imageLoaded.value = true
  imageFailed.value = false
}

function onError() {
  imageLoaded.value = false
  imageFailed.value = true
}
</script>

<template>
  <span
    class="rs-avatar"
    :class="[`rs-avatar--${resolvedSize}`, `rs-avatar--${resolvedShape}`]"
    :role="rootRole"
    :aria-label="rootLabel"
  >
    <img
      v-if="showImage"
      class="rs-avatar__image"
      :class="{ 'rs-avatar__image--ready': imageLoaded }"
      :src="src"
      :alt="imageAlt"
      @load="onLoad"
      @error="onError"
    />
    <span
      v-if="showFallback"
      class="rs-avatar__fallback"
      :class="`rs-avatar__fallback--${resolvedTone}`"
      aria-hidden="true"
    >
      <slot name="fallback">
        <RsIcon v-if="showIconFallback" :name="icon" :size="iconPx" />
        <span v-else>{{ fallbackText }}</span>
      </slot>
    </span>
  </span>
</template>

<style scoped>
.rs-avatar {
  --rs-avatar-size-sm: 1.75rem;
  --rs-avatar-size-md: 2.25rem;
  --rs-avatar-size-lg: 3rem;
  --rs-avatar-size: var(--rs-avatar-size-md);
  position: relative;
  display: inline-flex;
  overflow: hidden;
  flex-shrink: 0;
  width: var(--rs-avatar-size);
  height: var(--rs-avatar-size);
  border: 1px solid var(--rs-border);
  background: var(--rs-surface);
  vertical-align: middle;
}
.rs-avatar--circle {
  border-radius: var(--rs-radius-full);
}
.rs-avatar--square {
  border-radius: var(--rs-radius-sm);
}
.rs-avatar--sm {
  --rs-avatar-size: var(--rs-avatar-size-sm);
}
.rs-avatar--md {
  --rs-avatar-size: var(--rs-avatar-size-md);
}
.rs-avatar--lg {
  --rs-avatar-size: var(--rs-avatar-size-lg);
}
.rs-avatar__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}
.rs-avatar__image--ready {
  opacity: 1;
}
.rs-avatar__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-semibold);
}
.rs-avatar__fallback--default {
  background: var(--rs-surface-hover);
  color: var(--rs-muted);
}
.rs-avatar__fallback--primary {
  background: var(--rs-primary-container);
  color: var(--rs-on-primary-container);
}
.rs-avatar__fallback--success {
  background: var(--rs-success-container);
  color: var(--rs-on-success-container);
}
.rs-avatar__fallback--warning {
  background: var(--rs-warning-container);
  color: var(--rs-on-warning-container);
}
.rs-avatar__fallback--danger {
  background: var(--rs-danger-container);
  color: var(--rs-on-danger-container);
}
@media (forced-colors: active) {
  .rs-avatar {
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }
}
</style>
