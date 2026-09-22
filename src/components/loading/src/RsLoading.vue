<script setup lang="ts">
import { computed, onScopeDispose, ref, useSlots, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import LoadingStatus from './loading-status.vue'
import {
  acquireRsLoadingScrollLock,
  planRsLoadingVisibility,
  resolveRsLoadingSize,
  resolveRsLoadingSkeletonCount,
  resolveRsLoadingTeleportTarget,
  resolveRsLoadingTone,
  resolveRsLoadingVariant,
  type RsLoadingSize,
  type RsLoadingTone,
  type RsLoadingVariant,
} from './loading-utils'

defineOptions({ name: 'RsLoading' })

const props = withDefaults(
  defineProps<{
    /** 为 false 时不渲染指示器。有默认插槽时内容仍留下。 */
    loading?: boolean
    variant?: RsLoadingVariant
    /** sm / md / lg。不跟 Form / ConfigProvider。 */
    size?: RsLoadingSize
    /** 色相。default 与 neutral 同色。 */
    tone?: RsLoadingTone
    /** 可见文案，也是默认可访问名称。未传走 loading.label。 */
    label?: string
    /** 覆盖可访问名称。可见文案仍走 label。 */
    ariaLabel?: string
    showLabel?: boolean
    block?: boolean
    /**
     * 无默认插槽时绝对铺满父级（父级需 position: relative）。
     * 有默认插槽时指示器始终盖在内容上。
     */
    overlay?: boolean
    /** 固定铺满视口，传送到 getContainer 或 body。 */
    fullscreen?: boolean
    /** 仅 fullscreen 时锁 body 滚动，卸载或关闭后恢复。 */
    lock?: boolean
    /** 进入加载后延迟这么多毫秒再出现，避免快请求闪一下。 */
    delay?: number
    /** 一旦出现，至少显示这么多毫秒。 */
    minDuration?: number
    /** 盖住内容时模糊底层。默认关，滤镜会多一层合成。 */
    blur?: boolean
    skeletonLines?: number
    /** 全屏传送目标。返回空或抛错时用 body。非全屏不调用。 */
    getContainer?: () => HTMLElement | string | null
    id?: string
  }>(),
  {
    loading: true,
    variant: 'spinner',
    size: 'md',
    tone: 'primary',
    showLabel: false,
    block: false,
    overlay: false,
    fullscreen: false,
    lock: false,
    delay: 0,
    minDuration: 0,
    blur: false,
    skeletonLines: 4,
  },
)

const slots = useSlots()
const { t } = useRsI18n()

const shown = ref(false)
const shownAt = ref<number | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let releaseLock: (() => void) | null = null
let disposed = false

const hasContent = computed(() => Boolean(slots.default))
const hasIndicator = computed(() => Boolean(slots.indicator))
const hasLabelSlot = computed(() => Boolean(slots.label))
const resolvedSize = computed(() => resolveRsLoadingSize(props.size))
const resolvedTone = computed(() => resolveRsLoadingTone(props.tone))
const resolvedVariant = computed(() => resolveRsLoadingVariant(props.variant))
const skeletonCount = computed(() => resolveRsLoadingSkeletonCount(props.skeletonLines))
const resolvedLabel = computed(() => props.label ?? t('loading.label'))
const accessibleName = computed(() => props.ariaLabel?.trim() || resolvedLabel.value)
const showText = computed(() => props.showLabel || hasLabelSlot.value)
const cover = computed(() => props.overlay || hasContent.value || props.fullscreen)
const teleportTarget = computed(() =>
  resolveRsLoadingTeleportTarget(props.fullscreen, props.getContainer),
)

const hostClass = computed(() => [
  'rs-loading-host',
  {
    'rs-loading-host--block': props.block,
    'rs-loading-host--blur': props.blur && shown.value,
  },
])

function clearTimer(): void {
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
}

function syncLock(active: boolean): void {
  if (typeof window === 'undefined') return
  if (active) {
    if (!releaseLock) releaseLock = acquireRsLoadingScrollLock()
    return
  }
  releaseLock?.()
  releaseLock = null
}

function applyPlan(): void {
  clearTimer()
  if (disposed) return
  const plan = planRsLoadingVisibility({
    loading: props.loading,
    visible: shown.value,
    delayMs: props.delay,
    minDurationMs: props.minDuration,
    shownAt: shownAt.value,
    now: Date.now(),
  })
  if (plan.action === 'show') {
    shown.value = true
    shownAt.value = plan.shownAt
    return
  }
  if (plan.action === 'hide') {
    shown.value = false
    shownAt.value = null
    return
  }
  if (plan.action !== 'wait') return
  if (typeof window === 'undefined') return
  const then = plan.then
  timer = setTimeout(() => {
    timer = undefined
    if (disposed) return
    if (then === 'show') {
      if (!props.loading) return
      shown.value = true
      shownAt.value = Date.now()
      return
    }
    if (props.loading) return
    shown.value = false
    shownAt.value = null
  }, plan.ms)
}

watch(
  () => [props.loading, props.delay, props.minDuration] as const,
  () => applyPlan(),
  { immediate: true },
)

watch(
  () => shown.value && props.fullscreen && props.lock,
  (active) => syncLock(active),
  { immediate: true },
)

onScopeDispose(() => {
  disposed = true
  clearTimer()
  syncLock(false)
})
</script>

<template>
  <LoadingStatus
    v-if="!hasContent && shown && !fullscreen"
    :id="id"
    :variant="resolvedVariant"
    :size="resolvedSize"
    :tone="resolvedTone"
    :label="resolvedLabel"
    :ariaLabel="accessibleName"
    :show-text="showText"
    :block="block"
    :overlay="cover"
    :fullscreen="false"
    :skeleton-count="skeletonCount"
  >
    <template v-if="hasIndicator" #indicator>
      <slot name="indicator" />
    </template>
    <template v-if="hasLabelSlot" #label>
      <slot name="label" />
    </template>
  </LoadingStatus>

  <div
    v-else-if="hasContent"
    :id="id"
    :class="hostClass"
    :aria-busy="shown ? 'true' : 'false'"
  >
    <div class="rs-loading-host__content" :inert="shown ? true : undefined">
      <slot />
    </div>
    <Teleport :to="teleportTarget" :disabled="!fullscreen">
      <LoadingStatus
        v-if="shown"
        :variant="resolvedVariant"
        :size="resolvedSize"
        :tone="resolvedTone"
        :label="resolvedLabel"
        :ariaLabel="accessibleName"
        :show-text="showText"
        :block="block"
        :overlay="cover"
        :fullscreen="fullscreen"
        :skeleton-count="skeletonCount"
      >
        <template v-if="hasIndicator" #indicator>
          <slot name="indicator" />
        </template>
        <template v-if="hasLabelSlot" #label>
          <slot name="label" />
        </template>
      </LoadingStatus>
    </Teleport>
  </div>

  <div v-else-if="fullscreen && shown" hidden class="rs-loading-anchor">
    <Teleport :to="teleportTarget">
      <LoadingStatus
        :id="id"
        :variant="resolvedVariant"
        :size="resolvedSize"
        :tone="resolvedTone"
        :label="resolvedLabel"
        :ariaLabel="accessibleName"
        :show-text="showText"
        :block="block"
        :overlay="true"
        :fullscreen="true"
        :skeleton-count="skeletonCount"
      >
        <template v-if="hasIndicator" #indicator>
          <slot name="indicator" />
        </template>
        <template v-if="hasLabelSlot" #label>
          <slot name="label" />
        </template>
      </LoadingStatus>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-loading-host {
  position: relative;
  display: block;
  inline-size: 100%;
  min-inline-size: 0;
}

.rs-loading-host--block {
  display: flex;
  justify-content: center;
}

.rs-loading-host__content {
  min-inline-size: 0;
}

.rs-loading-host--blur > .rs-loading-host__content {
  filter: blur(var(--rs-loading-blur, 0.125rem));
}

@media (prefers-reduced-motion: reduce) {
  .rs-loading-host--blur > .rs-loading-host__content {
    filter: none;
  }
}
</style>
