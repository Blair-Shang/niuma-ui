<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import {
  computeScrollTopForTarget,
  flattenAnchorItems,
  hrefToAnchorId,
  pickActiveAnchorHref,
  resolveAnchorContainer,
  scrollContainerTo,
  targetTopInContainer,
  type RsAnchorItem,
} from './anchor-utils'

defineOptions({ name: 'RsAnchor' })

const props = withDefaults(
  defineProps<{
    items: RsAnchorItem[]
    /** 判定「已滚过」的顶部偏移（px） */
    offset?: number
    /** 点击滚动后标题距容器顶的距离 */
    targetOffset?: number
    /** 额外容差，避免刚贴顶就跳下一项 */
    bounds?: number
    /** sticky 吸附 */
    affix?: boolean
    /** 无轨道墨点（仅文字高亮） */
    lineless?: boolean
    /**
     * 是否改写 location.hash。
     * Hash 路由（Vue Router createWebHashHistory）必须为 false，否则会丢掉当前路由。
     */
    changeHash?: boolean
    getContainer?: () => HTMLElement | Window | null | undefined
  }>(),
  {
    offset: 12,
    bounds: 8,
    affix: true,
    lineless: false,
    changeHash: true,
  },
)

const activeHref = defineModel<string>({ default: '' })

const emit = defineEmits<{
  change: [href: string]
  click: [href: string, event: MouseEvent]
}>()

const { t } = useRsI18n()
const rootRef = ref<HTMLElement | null>(null)
const inkStyle = ref<Record<string, string>>({})

const flatItems = computed(() => flattenAnchorItems(props.items))
const resolvedTargetOffset = computed(() => props.targetOffset ?? props.offset)

let scrollTarget: HTMLElement | Window | null = null
let ticking = false

function findTarget(href: string): HTMLElement | null {
  const id = hrefToAnchorId(href)
  if (!id || typeof document === 'undefined') return null
  return document.getElementById(id)
}

function findLinkByHref(root: HTMLElement, href: string): HTMLElement | null {
  const links = root.querySelectorAll<HTMLElement>('[data-rs-anchor-href]')
  for (const link of links) {
    if (link.dataset.rsAnchorHref === href) return link
  }
  return null
}

function collectTops(container: HTMLElement | Window) {
  return flatItems.value
    .map((item) => {
      const el = findTarget(item.href)
      if (!el) return null
      return { href: item.href, top: targetTopInContainer(el, container) }
    })
    .filter((entry): entry is { href: string; top: number } => Boolean(entry))
}

function setActive(href: string) {
  if (!href || href === activeHref.value) return
  activeHref.value = href
  emit('change', href)
}

function syncInk() {
  const root = rootRef.value
  if (!root || props.lineless) return
  const current = activeHref.value || flatItems.value[0]?.href
  if (!current) {
    inkStyle.value = { opacity: '0' }
    return
  }
  const link = findLinkByHref(root, current)
  if (!link) {
    inkStyle.value = { opacity: '0' }
    return
  }
  inkStyle.value = {
    opacity: '1',
    transform: `translateY(${link.offsetTop}px)`,
    height: `${link.offsetHeight}px`,
  }
}

function syncFromScroll() {
  if (!scrollTarget) return
  const tops = collectTops(scrollTarget)
  const next = pickActiveAnchorHref(tops, props.offset + props.bounds)
  if (next) setActive(next)
  void nextTick(syncInk)
}

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    syncFromScroll()
  })
}

function bindContainer() {
  unbindContainer()
  try {
    scrollTarget = resolveAnchorContainer(props.getContainer)
  } catch {
    scrollTarget = null
    return
  }
  scrollTarget.addEventListener('scroll', onScroll, { passive: true })
  syncFromScroll()
}

function unbindContainer() {
  scrollTarget?.removeEventListener('scroll', onScroll)
  scrollTarget = null
}

function onSelect(href: string, event: MouseEvent) {
  event.preventDefault()
  emit('click', href, event)
  const target = findTarget(href)
  const container = scrollTarget ?? resolveAnchorContainer(props.getContainer)
  if (target) {
    scrollContainerTo(container, computeScrollTopForTarget(target, container, resolvedTargetOffset.value))
  }
  setActive(href)
  if (props.changeHash && typeof history !== 'undefined') {
    const id = hrefToAnchorId(href)
    const url = new URL(window.location.href)
    url.hash = id
    history.replaceState(history.state, '', `${url.pathname}${url.search}#${id}`)
  }
  void nextTick(syncInk)
}

onMounted(() => {
  bindContainer()
  window.addEventListener('resize', onScroll, { passive: true })
})

onUnmounted(() => {
  unbindContainer()
  window.removeEventListener('resize', onScroll)
})

watch(
  () => [props.items, props.getContainer, props.offset, props.bounds] as const,
  () => {
    void nextTick(bindContainer)
  },
  { deep: true },
)

watch(activeHref, () => {
  void nextTick(syncInk)
})
</script>

<template>
  <nav
    v-if="flatItems.length"
    ref="rootRef"
    class="rs-anchor"
    :class="{
      'rs-anchor--affix': affix,
      'rs-anchor--lineless': lineless,
    }"
    :aria-label="t('anchor.label')"
  >
    <div v-if="!lineless" class="rs-anchor__rail" aria-hidden="true">
      <span class="rs-anchor__ink" :style="inkStyle" />
    </div>
    <div class="rs-anchor__list">
      <a
        v-for="item in flatItems"
        :key="item.href"
        class="rs-anchor__link"
        :class="{
          'rs-anchor__link--active': item.href === activeHref,
        }"
        :style="{ paddingInlineStart: `${0.7 + item.depth * 0.75}rem` }"
        :href="item.href"
        :data-rs-anchor-href="item.href"
        @click="onSelect(item.href, $event)"
      >
        {{ item.title }}
      </a>
    </div>
  </nav>
</template>

<style scoped>
.rs-anchor {
  position: relative;
  display: flex;
  gap: 0.7rem;
  min-width: 8.5rem;
}

.rs-anchor--affix {
  position: sticky;
  top: var(--rs-space-lg);
}

.rs-anchor__rail {
  position: relative;
  flex-shrink: 0;
  width: 2px;
  border-radius: var(--rs-radius-full);
  background: color-mix(in srgb, var(--rs-border-subtle) 88%, var(--rs-muted));
}

.rs-anchor__ink {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  width: 2px;
  border-radius: inherit;
  background: var(--rs-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--rs-primary) 18%, transparent);
  opacity: 0;
  transition:
    transform 180ms ease,
    height 180ms ease,
    opacity 180ms ease;
}

.rs-anchor__list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.rs-anchor__link {
  display: block;
  padding-block: 0.28rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-xs);
  line-height: 1.55;
  text-decoration: none;
  border-radius: var(--rs-radius-xs);
  transition: color var(--rs-transition-fast);
}

.rs-anchor__link:hover {
  color: var(--rs-text);
}

.rs-anchor__link:focus-visible {
  outline: 2px solid var(--rs-primary);
  outline-offset: 2px;
}

.rs-anchor__link--active {
  color: var(--rs-primary);
  font-weight: 600;
}

.rs-anchor--lineless .rs-anchor__link {
  padding-inline: 0.45rem;
}

.rs-anchor--lineless .rs-anchor__link--active {
  background: color-mix(in srgb, var(--rs-primary) 10%, transparent);
}
</style>
