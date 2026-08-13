<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue'
import { RS_LOADING_BAR_KEY, type RsLoadingBarApi } from '../composables/useRsLoadingBar'

const props = withDefaults(
  defineProps<{
    /** 受控进度 0-100；未传时由 start/finish/error 驱动 */
    progress?: number
    height?: number
    color?: string
    errorColor?: string
  }>(),
  {
    height: 2,
    color: 'var(--rs-primary)',
    errorColor: 'var(--rs-danger)',
  },
)

const internalProgress = ref(0)
const visible = ref(false)
const errored = ref(false)
let trickleTimer: ReturnType<typeof setInterval> | null = null

const displayProgress = computed(() =>
  props.progress !== undefined ? Math.min(100, Math.max(0, props.progress)) : internalProgress.value,
)

const isVisible = computed(
  () => visible.value || (props.progress !== undefined && props.progress > 0),
)

const barStyle = computed(() => ({
  height: `${props.height}px`,
  width: `${displayProgress.value}%`,
  background: errored.value ? props.errorColor : props.color,
}))

function clearTrickle(): void {
  if (trickleTimer) {
    clearInterval(trickleTimer)
    trickleTimer = null
  }
}

function start(): void {
  clearTrickle()
  errored.value = false
  visible.value = true
  internalProgress.value = 8
  trickleTimer = setInterval(() => {
    if (internalProgress.value >= 92) return
    const step = Math.max(0.5, (92 - internalProgress.value) * 0.08)
    internalProgress.value = Math.min(92, internalProgress.value + step)
  }, 200)
}

function finish(): void {
  clearTrickle()
  errored.value = false
  visible.value = true
  internalProgress.value = 100
  window.setTimeout(() => {
    visible.value = false
    internalProgress.value = 0
  }, 280)
}

function error(): void {
  clearTrickle()
  errored.value = true
  visible.value = true
  internalProgress.value = 100
  window.setTimeout(() => {
    visible.value = false
    errored.value = false
    internalProgress.value = 0
  }, 400)
}

const api = shallowRef<RsLoadingBarApi | null>({ start, finish, error })
provide(RS_LOADING_BAR_KEY, api)

watch(
  () => props.progress,
  (value) => {
    if (value === undefined) return
    visible.value = value > 0 && value < 100
    if (value >= 100) {
      visible.value = true
      window.setTimeout(() => {
        visible.value = false
      }, 280)
    }
  },
)

onBeforeUnmount(() => {
  clearTrickle()
  api.value = null
})

defineExpose({
  start,
  finish,
  error,
})
</script>

<template>
  <!--
    默认插槽内的后代可通过 useRsLoadingBar() 获取 API。
    进度条本身 fixed 定位，不参与布局。
  -->
  <div
    class="rs-loading-bar"
    :class="{ 'rs-loading-bar--visible': isVisible }"
    :role="isVisible ? 'progressbar' : undefined"
    :aria-hidden="isVisible ? undefined : 'true'"
    :aria-valuenow="isVisible ? Math.round(displayProgress) : undefined"
    :aria-valuemin="isVisible ? 0 : undefined"
    :aria-valuemax="isVisible ? 100 : undefined"
  >
    <div class="rs-loading-bar__peg" :style="barStyle" />
  </div>
  <slot />
</template>

<style scoped>
.rs-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--rs-z-loading-bar);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.rs-loading-bar--visible {
  opacity: 1;
}

.rs-loading-bar__peg {
  height: 2px;
  transition:
    width 0.2s ease,
    background-color 0.2s ease;
}
</style>
