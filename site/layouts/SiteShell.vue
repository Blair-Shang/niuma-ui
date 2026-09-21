<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { RsAnchor, useRsConfig, type RsAnchorItem } from 'niuma-ui'
import { componentDocs } from '../catalog/components'
import { guideDocs } from '../catalog/guides'
import type { ComponentGroup } from '../catalog/types'
import SiteFooter from '../components/SiteFooter.vue'
import SiteHeader from '../components/SiteHeader.vue'
import { provideDocToc, type DocTocItem } from '../composables/doc-toc'
import { siteText, type SiteLocale } from '../i18n'

const { locale } = useRsConfig()
const route = useRoute()
const tocItems = provideDocToc()
const menuOpen = ref(false)
const mainRef = ref<HTMLElement | null>(null)

const copy = computed(() => siteText(locale.value as SiteLocale))
const isEn = computed(() => locale.value === 'en-US')
const isHome = computed(() => route.path === '/')
const isDocs = computed(() => !isHome.value)

const groupOrder: ComponentGroup[] = ['basic', 'form', 'nav', 'feedback', 'data', 'editor']

const filteredComponents = computed(() => componentDocs)

function toAnchorItems(items: DocTocItem[]): RsAnchorItem[] {
  return items.map((item) => ({
    href: `#${item.id}`,
    title: item.title,
    children: item.children?.length ? toAnchorItems(item.children) : undefined,
  }))
}

const anchorItems = computed<RsAnchorItem[]>(() => toAnchorItems(tocItems.value))

function docsContainer() {
  return mainRef.value
}

const groupedComponents = computed(() => {
  return groupOrder
    .map((key) => ({
      key,
      title: copy.value.groups[key],
      items: filteredComponents.value.filter((item) => item.group === key),
    }))
    .filter((group) => group.items.length > 0)
})

watch(
  () => route.path,
  () => {
    menuOpen.value = false
    mainRef.value?.scrollTo({ top: 0 })
  },
)
</script>

<template>
  <div class="shell" :class="{ 'shell--home': isHome, 'shell--docs': isDocs }">
    <SiteHeader v-model:menu-open="menuOpen" />

    <div v-if="isHome" class="shell__home">
      <RouterView />
      <SiteFooter />
    </div>

    <div v-else class="shell__docs">
      <div v-if="menuOpen" class="shell__backdrop" @click="menuOpen = false" />
      <aside class="shell__aside" :class="{ 'shell__aside--open': menuOpen }">
        <nav class="shell__nav">
          <section class="shell__group">
            <p class="shell__group-title">{{ copy.groups.guide }}</p>
            <RouterLink
              v-for="guide in guideDocs"
              :key="guide.slug"
              :to="`/guide/${guide.slug}`"
              class="shell__link"
              active-class="shell__link--on"
            >
              {{ isEn ? guide.titleEn : guide.title }}
            </RouterLink>
          </section>
          <section v-for="group in groupedComponents" :key="group.key" class="shell__group">
            <p class="shell__group-title">{{ group.title }}</p>
            <RouterLink
              v-for="item in group.items"
              :key="item.slug"
              :to="`/components/${item.slug}`"
              class="shell__link"
              active-class="shell__link--on"
            >
              <span class="shell__en">{{ item.title }}</span>
              <span v-if="!isEn" class="shell__zh">{{ item.titleZh }}</span>
            </RouterLink>
          </section>
          <p v-if="groupedComponents.length === 0" class="shell__empty">{{ copy.nav.empty }}</p>
        </nav>
      </aside>
      <div ref="mainRef" class="shell__main">
        <div class="shell__article">
          <RouterView />
        </div>
        <aside v-if="anchorItems.length" class="shell__toc">
          <div class="shell__toc-sticky">
            <p class="shell__toc-title">{{ copy.doc.toc }}</p>
            <RsAnchor
              :items="anchorItems"
              :affix="false"
              :get-container="docsContainer"
              :change-hash="false"
              :offset="20"
              :target-offset="20"
            />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--site-canvas, var(--rs-bg));
  color: var(--rs-text);
}

.shell__home {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background:
    radial-gradient(920px 460px at 8% -12%, color-mix(in srgb, var(--rs-primary) 20%, transparent), transparent 58%),
    radial-gradient(720px 380px at 96% 4%, color-mix(in srgb, var(--rs-primary) 12%, transparent), transparent 52%),
    linear-gradient(color-mix(in srgb, var(--site-line) 80%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--site-line) 80%, transparent) 1px, transparent 1px),
    var(--site-canvas);
  background-size: auto, auto, 56px 56px, 56px 56px, auto;
}

.shell__docs {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
  background: var(--site-canvas);
}

.shell__aside {
  width: 15.25rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--site-line);
  background: var(--site-aside-bg);
  z-index: 30;
}

.shell__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem 0.55rem 1.5rem;
}

.shell__group + .shell__group {
  margin-top: 1.1rem;
}

.shell__group-title {
  margin: 0 0 0.3rem;
  padding: 0 0.65rem;
  color: var(--rs-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.shell__link {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-height: 2rem;
  padding: 0.2rem 0.65rem;
  border-radius: 0.45rem;
  color: var(--rs-text);
  font-size: 0.8125rem;
  text-decoration: none;
}

.shell__zh {
  color: var(--rs-muted);
  font-size: 0.75rem;
}

.shell__link:hover {
  background: var(--rs-item-hover);
}

.shell__link--on {
  background: color-mix(in srgb, var(--rs-primary) 14%, var(--site-article-bg));
  color: var(--rs-primary);
  font-weight: 600;
  box-shadow: inset 2px 0 0 var(--rs-primary);
}

.shell__link--on .shell__zh {
  color: color-mix(in srgb, var(--rs-primary) 72%, var(--rs-muted));
}

.shell__empty {
  margin: 0.75rem;
  color: var(--rs-muted);
  font-size: 0.8125rem;
}

.shell__main {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow: auto;
  background: var(--site-canvas);
}

.shell__article {
  flex: 1;
  min-width: 0;
  max-width: 52rem;
  margin: 1rem 0 1.5rem 1rem;
  padding: 2rem 2.4rem 3.5rem;
  border: 1px solid var(--site-line);
  border-radius: 0.9rem;
  background: var(--site-article-bg);
  box-shadow: 0 1px 0 rgb(255 255 255 / 60%) inset;
}

.shell__toc {
  width: 13rem;
  flex-shrink: 0;
  padding: 1.35rem 1.1rem 2rem 0.85rem;
}

.shell__toc-sticky {
  position: sticky;
  top: 1.25rem;
}

.shell__toc-title {
  margin: 0 0 0.7rem;
  color: var(--rs-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.shell__backdrop {
  display: none;
}

@media (width < 72rem) {
  .shell__toc {
    display: none;
  }
}

@media (width < 56rem) {
  .shell__aside {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    height: 100%;
    transform: translateX(-105%);
    transition: transform 0.18s ease;
    box-shadow: 0 16px 40px rgb(0 0 0 / 16%);
  }

  .shell__aside--open {
    transform: translateX(0);
  }

  .shell__backdrop {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 25;
    background: rgb(0 0 0 / 35%);
  }

  .shell__article {
    margin: 0.75rem 0.75rem 1rem;
    padding: 1.15rem 1rem 2.5rem;
  }
}
</style>
