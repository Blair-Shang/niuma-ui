<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import {
  collectAnchorTops,
  computeScrollTopForTarget,
  flattenAnchorItems,
  hrefToAnchorId,
  isAnchorScrolledToEnd,
  isAnchorWindow,
  pickActiveAnchorHref,
  resolveAnchorContainer,
  scrollContainerTo,
  writeAnchorHash,
  type RsAnchorDirection,
  type RsAnchorExpose,
  type RsAnchorItem,
  type RsAnchorScrollBehavior,
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
    /** sticky 距滚动容器顶的距离（px），写入 --rs-anchor-affix-top */
    affixOffset?: number
    /** 无轨道墨点（仅文字高亮） */
    lineless?: boolean
    /**
     * 是否改写 location.hash。
     * Hash 路由（Vue Router createWebHashHistory）必须为 false，否则会丢掉当前路由。
     */
    changeHash?: boolean
    /** changeHash 时用 replaceState（默认）还是 pushState */
    replace?: boolean
    direction?: RsAnchorDirection
    /** 覆盖滚动行为；未传时减少动态用 auto，否则 smooth */
    scrollBehavior?: RsAnchorScrollBehavior
    /** 覆盖滚动判定后的激活 href */
    getCurrentAnchor?: (activeHref: string) => string
    getContainer?: () => HTMLElement | Window | null | undefined
    id?: string
    ariaLabel?: string
  }>(),
  {
    offset: 12,
    bounds: 8,
    affix: true,
    lineless: false,
    changeHash: true,
    replace: true,
    direction: 'vertical',
  },
)

const activeHref = defineModel<string>({ default: '' })

const emit = defineEmits<{
  change: [href: string]
  click: [href: string, event: MouseEvent]
}>()

const { t } = useRsI18n()
const rootRef = ref<HTMLElement | null>(null)
const railRef = ref<HTMLElement | null>(null)
const inkStyle = ref<Record<string, string>>({})
const linkRefs = new Map<string, HTMLElement>()

const flatItems = computed(() => flattenAnchorItems(props.items))
const resolvedTargetOffset = computed(() => props.targetOffset ?? props.offset)
const navLabel = computed(() => props.ariaLabel || t('anchor.label'))
const rootStyle = computed(() => {
  if (props.affixOffset == null) return undefined
  return { '--rs-anchor-affix-top': `${props.affixOffset}px` }
})

const targetCache = new Map<string, HTMLElement>()
let scrollTarget: HTMLElement | Window | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let clickLockHref = ''
let clickLockTimer = 0

const CLICK_LOCK_IDLE_MS = 120
const CLICK_LOCK_FALLBACK_MS = 360

function findTarget(href: string): HTMLElement | null {
  const cached = targetCache.get(href)
  if (cached?.isConnected) return cached
  const id = hrefToAnchorId(href)
  if (!id || typeof document === 'undefined') return null
  const el = document.getElementById(id)
  if (el) targetCache.set(href, el)
  else targetCache.delete(href)
  return el
}

function setLinkRef(href: string, el: unknown) {
  if (el instanceof HTMLElement) {
    linkRefs.set(href, el)
    return
  }
  linkRefs.delete(href)
}

function setActive(href: string) {
  const next = props.getCurrentAnchor?.(href) ?? href
  if (!next || next === activeHref.value) return
  activeHref.value = next
  emit('change', next)
}

function syncInk() {
  if (props.lineless) return
  const current = activeHref.value || flatItems.value.find((item) => !item.disabled)?.href
  if (!current) {
    inkStyle.value = { opacity: '0' }
    return
  }
  const link = linkRefs.get(current)
  const rail = railRef.value
  if (!link || !rail) {
    inkStyle.value = { opacity: '0' }
    return
  }
  const linkRect = link.getBoundingClientRect()
  const railRect = rail.getBoundingClientRect()
  if (props.direction === 'horizontal') {
    inkStyle.value = {
      opacity: '1',
      width: `${Math.max(0, linkRect.width)}px`,
      height: '100%',
      transform: `translate3d(${linkRect.left - railRect.left}px, 0, 0)`,
    }
    return
  }
  inkStyle.value = {
    opacity: '1',
    width: '100%',
    height: `${Math.max(0, linkRect.height)}px`,
    transform: `translate3d(0, ${linkRect.top - railRect.top}px, 0)`,
  }
}

function releaseClickLock() {
  clickLockHref = ''
  if (clickLockTimer) {
    window.clearTimeout(clickLockTimer)
    clickLockTimer = 0
  }
  syncFromScroll()
}

function armClickLock(href: string) {
  clickLockHref = href
  if (clickLockTimer) window.clearTimeout(clickLockTimer)
  if (typeof window === 'undefined') return
  clickLockTimer = window.setTimeout(releaseClickLock, CLICK_LOCK_FALLBACK_MS)
}

function bumpClickLock() {
  if (!clickLockHref || typeof window === 'undefined') return
  if (clickLockTimer) window.clearTimeout(clickLockTimer)
  clickLockTimer = window.setTimeout(releaseClickLock, CLICK_LOCK_IDLE_MS)
}

function syncFromScroll() {
  if (!scrollTarget || clickLockHref) return
  const tops = collectAnchorTops(flatItems.value, scrollTarget, findTarget)
  const next = pickActiveAnchorHref(tops, props.offset + props.bounds, {
    atEnd: isAnchorScrolledToEnd(scrollTarget),
  })
  if (next) setActive(next)
}

function cancelScrollFrame() {
  if (!rafId) return
  cancelAnimationFrame(rafId)
  rafId = 0
}

function onScroll() {
  if (clickLockHref) {
    bumpClickLock()
    return
  }
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    syncFromScroll()
  })
}

function unbindContainer() {
  cancelScrollFrame()
  clickLockHref = ''
  if (clickLockTimer) {
    window.clearTimeout(clickLockTimer)
    clickLockTimer = 0
  }
  scrollTarget?.removeEventListener('scroll', onScroll)
  scrollTarget = null
  resizeObserver?.disconnect()
  resizeObserver = null
}

function bindContainer() {
  const next = resolveAnchorContainer(props.getContainer)
  if (next === scrollTarget && scrollTarget) {
    syncFromScroll()
    return
  }
  unbindContainer()
  scrollTarget = next
  if (!scrollTarget) return
  scrollTarget.addEventListener('scroll', onScroll, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (clickLockHref) return
      onScroll()
      void nextTick(syncInk)
    })
    if (!isAnchorWindow(scrollTarget)) resizeObserver.observe(scrollTarget)
    if (rootRef.value) resizeObserver.observe(rootRef.value)
  }
  syncFromScroll()
}

function scrollToHref(href: string) {
  const item = flatItems.value.find((entry) => entry.href === href)
  if (item?.disabled) return
  const target = findTarget(href)
  const container = scrollTarget ?? resolveAnchorContainer(props.getContainer)
  if (target && container) {
    scrollContainerTo(
      container,
      computeScrollTopForTarget(target, container, resolvedTargetOffset.value),
      props.scrollBehavior,
    )
  }
  setActive(href)
  armClickLock(href)
  if (props.changeHash) writeAnchorHash(href, props.replace)
  void nextTick(syncInk)
}

function onSelect(href: string, event: MouseEvent, disabled?: boolean) {
  event.preventDefault()
  emit('click', href, event)
  if (disabled) return
  scrollToHref(href)
}

function onWindowResize() {
  if (clickLockHref) bumpClickLock()
  else onScroll()
  void nextTick(syncInk)
}

onMounted(() => {
  bindContainer()
  void nextTick(bindContainer)
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowResize, { passive: true })
  }
})

onUnmounted(() => {
  unbindContainer()
  targetCache.clear()
  linkRefs.clear()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowResize)
  }
})

watch(
  () => props.getContainer?.() ?? null,
  (next, prev) => {
    if (next === prev) return
    void nextTick(bindContainer)
  },
)

watch(
  () =>
    flatItems.value
      .map((item) => `${item.href}\0${item.title}\0${item.depth}\0${item.disabled ? 1 : 0}`)
      .join('\n'),
  (signature) => {
    targetCache.clear()
    if (!signature) {
      unbindContainer()
      return
    }
    void nextTick(bindContainer)
  },
)

watch(
  () => [props.offset, props.bounds, props.direction, props.lineless] as const,
  () => {
    void nextTick(syncFromScroll)
  },
)

watch(activeHref, () => {
  void nextTick(syncInk)
})

defineExpose<RsAnchorExpose>({
  scrollTo: scrollToHref,
})
</script>

<template>
  <nav
    v-if="flatItems.length"
    :id="id"
    ref="rootRef"
    class="rs-anchor"
    :class="{
      'rs-anchor--affix': affix,
      'rs-anchor--lineless': lineless,
      'rs-anchor--horizontal': direction === 'horizontal',
    }"
    :style="rootStyle"
    :aria-label="navLabel"
  >
    <div v-if="!lineless" ref="railRef" class="rs-anchor__rail" aria-hidden="true">
      <span class="rs-anchor__ink" :style="inkStyle" />
    </div>
    <ul class="rs-anchor__list">
      <li v-for="item in flatItems" :key="item.href" class="rs-anchor__item">
        <a
          class="rs-anchor__link"
          :class="{
            'rs-anchor__link--active': item.href === activeHref,
            'rs-anchor__link--disabled': item.disabled,
          }"
          :style="
            direction === 'vertical'
              ? {
                  paddingInlineStart: `calc(var(--rs-anchor-link-pad-inline) + ${item.depth} * var(--rs-anchor-indent))`,
                }
              : undefined
          "
          :href="item.href"
          :ref="(el) => setLinkRef(item.href, el)"
          :data-rs-anchor-href="item.href"
          :aria-current="item.href === activeHref ? 'location' : undefined"
          :aria-disabled="item.disabled ? 'true' : undefined"
          @click="onSelect(item.href, $event, item.disabled)"
        >
          <slot name="item" :item="item" :active="item.href === activeHref" :href="item.href">
            {{ item.title }}
          </slot>
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.rs-anchor {
  position: relative;
  display: flex;
  gap: var(--rs-anchor-gap);
  min-width: var(--rs-anchor-min-width);
}

.rs-anchor--affix {
  position: sticky;
  top: var(--rs-anchor-affix-top);
}

.rs-anchor--horizontal {
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

.rs-anchor__rail {
  position: relative;
  flex-shrink: 0;
  width: var(--rs-anchor-rail-width);
  border-radius: var(--rs-radius-full);
  background: var(--rs-anchor-rail);
}

.rs-anchor--horizontal .rs-anchor__rail {
  width: 100%;
  height: var(--rs-anchor-rail-width);
}

.rs-anchor__ink {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  width: var(--rs-anchor-rail-width);
  border-radius: inherit;
  background: var(--rs-anchor-ink);
  box-shadow: 0 0 0 1px var(--rs-anchor-ink-ring);
  opacity: 0;
  pointer-events: none;
  transition:
    transform var(--rs-transition-fast),
    width var(--rs-transition-fast),
    height var(--rs-transition-fast),
    opacity var(--rs-transition-fast);
}

.rs-anchor__list,
.rs-anchor__item {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rs-anchor__list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.rs-anchor--horizontal .rs-anchor__list {
  flex-direction: row;
  flex-wrap: wrap;
  column-gap: var(--rs-space-sm);
}

.rs-anchor__link {
  display: block;
  padding-block: var(--rs-anchor-link-pad-block);
  padding-inline: var(--rs-anchor-link-pad-inline);
  color: var(--rs-anchor-link);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-relaxed);
  font-weight: var(--rs-font-weight-regular);
  text-decoration: none;
  border-radius: var(--rs-radius-xs);
  transition: color var(--rs-transition-fast), background-color var(--rs-transition-fast);
}

.rs-anchor__link:hover {
  color: var(--rs-anchor-link-hover);
}

.rs-anchor__link:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: 2px;
}

.rs-anchor__link--active {
  color: var(--rs-anchor-link-active);
  font-weight: var(--rs-anchor-link-active-weight);
}

.rs-anchor__link--disabled {
  opacity: var(--rs-anchor-disabled-opacity);
  cursor: not-allowed;
}

.rs-anchor--lineless .rs-anchor__link--active {
  background: var(--rs-anchor-link-active-bg);
}

@media (prefers-reduced-motion: reduce) {
  .rs-anchor__ink,
  .rs-anchor__link {
    transition: none;
  }
}
</style>
