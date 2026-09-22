<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import type { RsRadius } from '../../../theme/types'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import {
  resolveRsEmptyDescription,
  resolveRsEmptyImageSizeCss,
  resolveRsEmptyLocaleKey,
  resolveRsEmptyPreset,
  resolveRsEmptySize,
  shouldShowRsEmptyDescription,
  shouldShowRsEmptyIllustration,
  shouldShowRsEmptyRemoteImage,
  shouldShowRsEmptyTitle,
  shouldUseRsEmptyBadgeChrome,
  type RsEmptyPreset,
  type RsEmptySize,
} from './empty-utils'

defineOptions({ name: 'RsEmpty' })

const props = withDefaults(
  defineProps<{
    title?: string
    /** 未传走 locale；显式空字符串隐藏描述。 */
    description?: string
    /**
     * 占满父级可用空间，并去除外层虚线框 / 背景。
     * 适合嵌在面板、列表、结果区内的空态。
     * 开启后外层强制直角；图标圆角仍由 `iconRadius` 控制。
     */
    fill?: boolean
    /** 外层容器圆角（fill 时忽略，恒为直角）。默认 md。 */
    radius?: RsRadius
    /** 图标区圆角。默认 full（圆形）；直角 UI 传 `none`。 */
    iconRadius?: RsRadius
    /** 内置插图。`#image` / `#icon` / `image` 优先。 */
    preset?: RsEmptyPreset
    /** 密度：sm 表格内 / md 默认 / lg 整页。不是控件四档，没有 ssm。 */
    size?: RsEmptySize
    /** 自定义插图 URL。失败时回退 preset。不要传入 object URL 除非调用方自己 revoke。 */
    image?: string
    /** 插图替代文本。装饰图请留空。 */
    imageAlt?: string
    /** 覆盖插图边长。数字按 px。 */
    imageSize?: number | string
    /** 无插槽且无 image 时是否画内置插图。 */
    showImage?: boolean
    id?: string
    ariaLabel?: string
  }>(),
  {
    fill: false,
    showImage: true,
  },
)

const slots = useSlots()
const { t } = useRsI18n()
const failedImageSrc = ref<string | null>(null)

const resolvedPreset = computed(() => resolveRsEmptyPreset(props.preset))
const resolvedSize = computed(() => resolveRsEmptySize(props.size))
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'md')
const resolvedIconRadius = useResolvedRsRadius(() => props.iconRadius, 'full')

const hasIconSlot = computed(() => Boolean(slots.icon))
const hasImageSlot = computed(() => Boolean(slots.image))
const hasTitleSlot = computed(() => Boolean(slots.title))
const hasDescriptionSlot = computed(() => Boolean(slots.description))

const localeDescription = computed(() => t(resolveRsEmptyLocaleKey(resolvedPreset.value)))
const resolvedDescription = computed(() =>
  resolveRsEmptyDescription(props.description, localeDescription.value),
)
const showTitle = computed(() => shouldShowRsEmptyTitle(props.title, hasTitleSlot.value))
const showDescription = computed(() =>
  shouldShowRsEmptyDescription(resolvedDescription.value, hasDescriptionSlot.value),
)
const showText = computed(() => showTitle.value || showDescription.value)
const showIllustration = computed(() =>
  shouldShowRsEmptyIllustration({
    showImage: props.showImage,
    hasIconSlot: hasIconSlot.value,
    hasImageSlot: hasImageSlot.value,
  }),
)
const useBadgeChrome = computed(() =>
  shouldUseRsEmptyBadgeChrome(hasIconSlot.value, hasImageSlot.value),
)
const showRemoteImage = computed(() =>
  shouldShowRsEmptyRemoteImage({
    image: props.image,
    failedSrc: failedImageSrc.value,
    hasIconSlot: hasIconSlot.value,
    hasImageSlot: hasImageSlot.value,
  }),
)

const rootClass = computed(() => [
  'rs-empty',
  `rs-empty--${resolvedSize.value}`,
  {
    'rs-empty--fill': props.fill,
  },
])

const iconClass = computed(() => ({
  'rs-empty__icon--badge': useBadgeChrome.value,
  'rs-empty__icon--figure': !useBadgeChrome.value,
}))

const figureStyle = computed(() => {
  const size = resolveRsEmptyImageSizeCss(props.imageSize)
  return size ? { width: size, height: size } : undefined
})

const rootStyle = computed(() => ({
  '--rs-empty-radius': props.fill ? '0' : rsRadiusCss(resolvedRadius.value),
  '--rs-empty-icon-radius': rsRadiusCss(resolvedIconRadius.value),
}))

const rootAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (!showText.value) return t('empty.label')
  return undefined
})

const remoteAlt = computed(() => props.imageAlt ?? '')

watch(
  () => props.image,
  () => {
    failedImageSrc.value = null
  },
)

function onImageError(): void {
  failedImageSrc.value = props.image?.trim() || null
}
</script>

<template>
  <div
    :id="id"
    :class="rootClass"
    :style="rootStyle"
    role="status"
    :aria-label="rootAriaLabel"
  >
    <div
      v-if="showIllustration"
      class="rs-empty__icon"
      :class="iconClass"
      :style="figureStyle"
      aria-hidden="true"
    >
      <slot name="image">
        <slot name="icon">
          <img
            v-if="showRemoteImage"
            class="rs-empty__remote"
            :src="image"
            :alt="remoteAlt"
            @error="onImageError"
          />
          <svg
            v-else-if="resolvedPreset === 'simple'"
            class="rs-empty__svg"
            viewBox="0 0 64 64"
            fill="none"
          >
            <rect
              x="14"
              y="18"
              width="36"
              height="28"
              rx="4"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-dasharray="3.5 2.5"
            />
          </svg>
          <svg
            v-else-if="resolvedPreset === 'search'"
            class="rs-empty__svg"
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle cx="28" cy="28" r="12" stroke="currentColor" stroke-width="1.75" />
            <path
              d="M37 37 48 48"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </svg>
          <svg v-else class="rs-empty__svg" viewBox="0 0 64 64" fill="none">
            <rect
              x="13"
              y="16"
              width="38"
              height="32"
              rx="5"
              stroke="currentColor"
              stroke-width="1.75"
            />
            <path
              d="M22 28h20M22 36h14"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </svg>
        </slot>
      </slot>
    </div>
    <div v-if="showText" class="rs-empty__text">
      <p v-if="showTitle" class="rs-empty__title">
        <slot name="title">{{ title }}</slot>
      </p>
      <p
        v-if="showDescription"
        class="rs-empty__description"
        :class="{ 'rs-empty__description--offset': showTitle }"
      >
        <slot name="description">{{ resolvedDescription }}</slot>
      </p>
    </div>
    <div v-if="$slots.default" class="rs-empty__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.rs-empty {
  --rs-empty-pad-block: calc(var(--rs-space-xl) + var(--rs-space-xl) + var(--rs-space-sm));
  --rs-empty-pad-inline: var(--rs-space-xl);
  --rs-empty-gap: var(--rs-space-md);
  --rs-empty-border: var(--rs-border);
  --rs-empty-bg: color-mix(in srgb, var(--rs-surface) 80%, var(--rs-bg));
  --rs-empty-title: var(--rs-text-primary);
  --rs-empty-description: var(--rs-text-secondary);
  --rs-empty-icon-border: var(--rs-border);
  --rs-empty-icon-bg: var(--rs-surface);
  --rs-empty-icon-fg: var(--rs-text-secondary);
  --rs-empty-icon-shadow: var(--rs-shadow-sm);
  --rs-empty-icon-size: 3.5rem;
  --rs-empty-figure-size: 5rem;
  --rs-empty-title-size: var(--rs-font-size-sm);
  --rs-empty-title-weight: var(--rs-font-weight-medium);
  --rs-empty-desc-size: var(--rs-font-size-sm);
  --rs-empty-illustration: var(--rs-text-tertiary);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--rs-empty-gap);
  padding-block: var(--rs-empty-pad-block);
  padding-inline: var(--rs-empty-pad-inline);
  border-radius: var(--rs-empty-radius, var(--rs-radius));
  border: 1px dashed var(--rs-empty-border);
  background: var(--rs-empty-bg);
  color: var(--rs-empty-description);
  text-align: center;
}

.rs-empty--sm {
  --rs-empty-pad-block: var(--rs-space-xl);
  --rs-empty-gap: var(--rs-space-sm);
  --rs-empty-icon-size: 2.5rem;
  --rs-empty-figure-size: 3.5rem;
  --rs-empty-title-size: var(--rs-font-size-xs);
  --rs-empty-desc-size: var(--rs-font-size-xs);
}

.rs-empty--lg {
  --rs-empty-pad-block: calc(var(--rs-space-xl) * 3);
  --rs-empty-gap: var(--rs-space-lg);
  --rs-empty-icon-size: 4.5rem;
  --rs-empty-figure-size: 6.5rem;
  --rs-empty-title-size: var(--rs-font-size-base);
  --rs-empty-desc-size: var(--rs-font-size-base);
}

.rs-empty--fill {
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 0;
  border-color: transparent;
  background: transparent;
}

.rs-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rs-empty-icon-fg);
}

.rs-empty__icon--badge {
  width: var(--rs-empty-icon-size);
  height: var(--rs-empty-icon-size);
  border-radius: var(--rs-empty-icon-radius, var(--rs-radius-full));
  border: 1px solid var(--rs-empty-icon-border);
  background: var(--rs-empty-icon-bg);
  box-shadow: var(--rs-empty-icon-shadow);
}

.rs-empty__icon--figure {
  width: var(--rs-empty-figure-size);
  height: var(--rs-empty-figure-size);
  color: var(--rs-empty-illustration);
}

.rs-empty__svg,
.rs-empty__remote {
  display: block;
  width: 100%;
  height: 100%;
}

.rs-empty__remote {
  object-fit: contain;
}

.rs-empty__text {
  max-width: 28rem;
}

.rs-empty__title {
  margin: 0;
  font-size: var(--rs-empty-title-size);
  font-weight: var(--rs-empty-title-weight);
  color: var(--rs-empty-title);
}

.rs-empty__description {
  margin: 0;
  font-size: var(--rs-empty-desc-size);
  color: var(--rs-empty-description);
  line-height: var(--rs-line-height-normal);
}

.rs-empty__description--offset {
  margin-block-start: var(--rs-space-xs);
}

.rs-empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--rs-space-sm);
}

@media (forced-colors: active) {
  .rs-empty {
    border-color: CanvasText;
    background: Canvas;
    color: CanvasText;
  }

  .rs-empty--fill {
    border-color: transparent;
    background: transparent;
  }

  .rs-empty__icon--badge {
    border-color: CanvasText;
    background: Canvas;
    box-shadow: none;
  }

  .rs-empty__title,
  .rs-empty__description,
  .rs-empty__icon {
    color: CanvasText;
  }
}
</style>
