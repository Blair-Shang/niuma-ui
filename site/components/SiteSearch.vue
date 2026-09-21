<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RsIcon, RsInput, useRsConfig } from 'niuma-ui'
import { searchDocs, type SiteSearchHit } from '../composables/doc-search'
import { siteText, type SiteLocale } from '../i18n'

const { locale } = useRsConfig()
const router = useRouter()
const copy = computed(() => siteText(locale.value as SiteLocale))

const query = ref('')
const open = ref(false)
const active = ref(0)
const rootRef = ref<HTMLElement | null>(null)

const shortcut = computed(() =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K',
)

const hits = computed(() => searchDocs(query.value, locale.value as SiteLocale))

const groups = computed(() => {
  const map = new Map<string, SiteSearchHit[]>()
  for (const hit of hits.value) {
    const list = map.get(hit.group) ?? []
    list.push(hit)
    map.set(hit.group, list)
  }
  return [...map.entries()].map(([title, items]) => ({ title, items }))
})

watch(hits, () => {
  active.value = 0
})

function focusInput() {
  rootRef.value?.querySelector('input')?.focus()
}

function close() {
  open.value = false
  active.value = 0
}

function go(hit: SiteSearchHit) {
  void router.push(hit.to)
  query.value = ''
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value && event.key !== 'ArrowDown') return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    open.value = true
    active.value = Math.min(active.value + 1, Math.max(hits.value.length - 1, 0))
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = Math.max(active.value - 1, 0)
    return
  }
  if (event.key === 'Enter') {
    const hit = hits.value[active.value]
    if (hit) {
      event.preventDefault()
      go(hit)
    }
  }
}

function onGlobalKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = true
    void nextTick(focusInput)
  }
}

function onPointerDown(event: PointerEvent) {
  if (!rootRef.value?.contains(event.target as Node)) close()
}

function hitIndex(hit: SiteSearchHit): number {
  return hits.value.findIndex((item) => item.to === hit.to)
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey)
  window.addEventListener('pointerdown', onPointerDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKey)
  window.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
  <div ref="rootRef" class="site-search">
    <RsInput
      v-model="query"
      type="search"
      size="sm"
      clearable
      :placeholder="copy.nav.searchPlaceholder"
      @focus="open = true"
      @keydown="onKeydown"
    >
      <template #prefix>
        <RsIcon name="search" :size="15" />
      </template>
      <template #suffix>
        <kbd class="site-search__kbd">{{ shortcut }}</kbd>
      </template>
    </RsInput>

    <div v-if="open" class="site-search__panel">
      <p v-if="hits.length === 0" class="site-search__empty">{{ copy.nav.empty }}</p>
      <section v-for="group in groups" :key="group.title" class="site-search__group">
        <p class="site-search__group-title">{{ group.title }}</p>
        <button
          v-for="hit in group.items"
          :key="hit.to"
          type="button"
          class="site-search__hit"
          :class="{ 'site-search__hit--on': hitIndex(hit) === active }"
          @mouseenter="active = hitIndex(hit)"
          @click="go(hit)"
        >
          <strong>{{ hit.title }}</strong>
          <span>{{ hit.hint }}</span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.site-search {
  position: relative;
  width: min(28rem, 100%);
}

.site-search__kbd {
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 0.3rem;
  background: var(--rs-bg);
  color: var(--rs-muted);
  font-size: 0.68rem;
  font-family: inherit;
  line-height: 1.4;
}

.site-search__panel {
  position: absolute;
  z-index: 50;
  inset-inline: 0;
  top: calc(100% + 0.4rem);
  max-height: 22rem;
  overflow: auto;
  padding: 0.45rem 0.4rem 0.55rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 0.85rem;
  background: var(--rs-surface-elevated, var(--rs-surface));
  box-shadow: 0 18px 40px rgb(15 23 42 / 12%);
}

.site-search__empty {
  margin: 0;
  padding: 0.85rem 0.7rem;
  color: var(--rs-muted);
  font-size: 0.8125rem;
}

.site-search__group + .site-search__group {
  margin-top: 0.35rem;
}

.site-search__group-title {
  margin: 0;
  padding: 0.35rem 0.65rem 0.2rem;
  color: var(--rs-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.site-search__hit {
  display: grid;
  gap: 0.12rem;
  width: 100%;
  padding: 0.45rem 0.65rem;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.site-search__hit strong {
  font-size: 0.84rem;
  font-weight: 600;
}

.site-search__hit span {
  overflow: hidden;
  color: var(--rs-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-search__hit--on {
  background: color-mix(in srgb, var(--rs-primary) 10%, transparent);
}

.site-search__hit--on strong {
  color: var(--rs-primary);
}
</style>
