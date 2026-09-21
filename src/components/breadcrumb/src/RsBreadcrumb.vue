<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  buildBreadcrumbRenderItems,
  type RsBreadcrumbItem,
} from './breadcrumb-utils'

defineOptions({ name: 'RsBreadcrumb' })

const props = withDefaults(
  defineProps<{
    items: RsBreadcrumbItem[]
    /** 文字分隔符。未传时用 separatorIcon。 */
    separator?: string
    /** Lucide kebab-case。有 separator 文字时不渲染图标。 */
    separatorIcon?: string
    /** 超过该数量时中间收成省略号。省略号算一项。 */
    maxItems?: number
    itemsBeforeCollapse?: number
    itemsAfterCollapse?: number
    ariaLabel?: string
    id?: string
  }>(),
  {
    separatorIcon: 'chevron-right',
    itemsBeforeCollapse: 1,
    itemsAfterCollapse: 1,
  },
)

const emit = defineEmits<{
  click: [item: RsBreadcrumbItem, event: MouseEvent]
}>()

const { t } = useRsI18n()
const expanded = ref(false)

watch(
  () =>
    [
      props.maxItems ?? '',
      props.itemsBeforeCollapse,
      props.itemsAfterCollapse,
      props.items.length,
      props.items.map((item, index) => item.key ?? item.label ?? index).join('\0'),
    ].join('\n'),
  () => {
    expanded.value = false
  },
)

const renderItems = computed(() =>
  buildBreadcrumbRenderItems(props.items, {
    maxItems: props.maxItems,
    itemsBeforeCollapse: props.itemsBeforeCollapse,
    itemsAfterCollapse: props.itemsAfterCollapse,
    expanded: expanded.value,
  }),
)

const navLabel = computed(() => props.ariaLabel || t('breadcrumb.label'))
const separatorLabel = computed(() => t('breadcrumb.separator'))
const moreLabel = computed(() => t('breadcrumb.more'))

function expand() {
  expanded.value = true
}

function onItemClick(item: RsBreadcrumbItem, event: MouseEvent, disabled: boolean) {
  emit('click', item, event)
  if (disabled) event.preventDefault()
}
</script>

<template>
  <nav :id="id" class="rs-breadcrumb" :aria-label="navLabel">
    <ol class="rs-breadcrumb__list">
      <li
        v-for="(item, index) in renderItems"
        :key="item.key"
        class="rs-breadcrumb__item"
        :class="{ 'rs-breadcrumb__item--ellipsis': item.isEllipsis }"
      >
        <button
          v-if="item.isEllipsis"
          type="button"
          class="rs-breadcrumb__more"
          :aria-label="moreLabel"
          @click="expand"
        >
          <slot name="more" :hidden-items="item.hiddenItems ?? []" :expand="expand">
            <RsIcon name="ellipsis" size="sm" />
          </slot>
        </button>
        <component
          v-else
          :is="item.isLink ? 'a' : 'span'"
          :href="item.isLink ? item.href : undefined"
          :target="item.isLink ? item.target : undefined"
          :rel="item.isLink ? item.rel : undefined"
          class="rs-breadcrumb__link"
          :class="{
            'rs-breadcrumb__link--current': item.isCurrent,
            'rs-breadcrumb__link--disabled': item.isDisabled,
          }"
          :aria-current="item.isCurrent ? 'page' : undefined"
          :aria-disabled="item.isDisabled ? 'true' : undefined"
          @click="item.source ? onItemClick(item.source, $event, item.isDisabled) : undefined"
        >
          <slot
            name="item"
            :item="item.source!"
            :index="item.sourceIndex"
            :is-current="item.isCurrent"
            :href="item.href"
          >
            <RsIcon v-if="item.icon" :name="item.icon" size="sm" class="rs-breadcrumb__icon" />
            <span class="rs-breadcrumb__label">{{ item.label }}</span>
          </slot>
        </component>
        <template v-if="index < renderItems.length - 1">
          <slot name="separator" :index="index">
            <span v-if="separator" class="rs-breadcrumb__sep" aria-hidden="true">{{ separator }}</span>
            <RsIcon
              v-else
              :name="separatorIcon"
              size="sm"
              class="rs-breadcrumb__sep"
              :label="separatorLabel"
            />
          </slot>
        </template>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.rs-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-breadcrumb-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-breadcrumb-item-gap);
}

.rs-breadcrumb__link,
.rs-breadcrumb__more {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-breadcrumb-item-gap);
  font-size: var(--rs-breadcrumb-font-size);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-breadcrumb-link);
  text-decoration: none;
  padding-block: var(--rs-breadcrumb-link-pad-block);
  padding-inline: var(--rs-breadcrumb-link-pad-inline);
  border: 0;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    background-color var(--rs-transition-fast);
}

.rs-breadcrumb__link:hover:not(.rs-breadcrumb__link--current):not(.rs-breadcrumb__link--disabled),
.rs-breadcrumb__more:hover {
  color: var(--rs-breadcrumb-link-hover);
  background: var(--rs-breadcrumb-link-hover-bg);
}

.rs-breadcrumb__link:focus-visible,
.rs-breadcrumb__more:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: 2px;
}

.rs-breadcrumb__link--current {
  color: var(--rs-breadcrumb-current);
  font-weight: var(--rs-breadcrumb-current-weight);
  pointer-events: none;
  cursor: default;
}

.rs-breadcrumb__link--disabled {
  opacity: var(--rs-breadcrumb-disabled-opacity);
  cursor: not-allowed;
}

.rs-breadcrumb__sep {
  color: var(--rs-breadcrumb-sep);
  flex-shrink: 0;
}

.rs-breadcrumb__icon {
  color: inherit;
}

.rs-breadcrumb__sep:dir(rtl) {
  transform: scaleX(-1);
}

@media (prefers-reduced-motion: reduce) {
  .rs-breadcrumb__link,
  .rs-breadcrumb__more {
    transition: none;
  }
}
</style>
