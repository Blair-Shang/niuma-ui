<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { RsAnchor, type RsAnchorItem } from 'niuma-ui'
import { componentDocs } from '../catalog/components'
import { guideDocs } from '../catalog/guides'
import SiteFooter from '../components/SiteFooter.vue'
import SiteHeader from '../components/SiteHeader.vue'
import { componentGroupOrder } from '../composables/doc-nav'
import { provideDocToc, type DocTocItem } from '../composables/doc-toc'
import { isZhSiteLocale, pickSitePair } from '../i18n'
import { useSiteI18n } from '../composables/use-site-i18n'

const { locale, chrome: copy } = useSiteI18n()
const route = useRoute()
const tocItems = provideDocToc()
const menuOpen = ref(false)

const showZhTitle = computed(() => isZhSiteLocale(locale.value))
const isHome = computed(() => route.path === '/')
const isDocs = computed(() => !isHome.value)

const groupedComponents = computed(() => {
  return componentGroupOrder
    .map((key) => ({
      key,
      title: copy.value.groups[key],
      items: componentDocs.filter((item) => item.group === key),
    }))
    .filter((group) => group.items.length > 0)
})

function toAnchorItems(items: DocTocItem[]): RsAnchorItem[] {
  return items.map((item) => ({
    href: `#${item.id}`,
    title: item.title,
    children: item.children?.length ? toAnchorItems(item.children) : undefined,
  }))
}

const anchorItems = computed<RsAnchorItem[]>(() => toAnchorItems(tocItems.value))

watch(
  () => route.path,
  () => {
    menuOpen.value = false
    window.scrollTo({ top: 0, left: 0 })
  },
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
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
              {{ pickSitePair(locale, guide.title, guide.titleEn) }}
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
              <span v-if="showZhTitle" class="shell__zh">{{ item.titleZh }}</span>
            </RouterLink>
          </section>
          <p v-if="groupedComponents.length === 0" class="shell__empty">{{ copy.nav.empty }}</p>
        </nav>
      </aside>
      <div class="shell__article">
        <RouterView />
      </div>
      <aside v-if="anchorItems.length" class="shell__toc">
        <p class="shell__toc-title">{{ copy.doc.toc }}</p>
        <RsAnchor
          :items="anchorItems"
          :affix="false"
          :change-hash="false"
          :offset="80"
          :target-offset="80"
        />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--site-home-canvas, var(--site-canvas));
  color: var(--rs-text);
}

.shell__home {
  background:
    radial-gradient(920px 460px at 8% -12%, color-mix(in srgb, var(--rs-primary) 20%, transparent), transparent 58%),
    radial-gradient(720px 380px at 96% 4%, color-mix(in srgb, var(--rs-primary) 12%, transparent), transparent 52%),
    linear-gradient(var(--site-home-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--site-home-grid) 1px, transparent 1px),
    var(--site-home-canvas, var(--site-canvas));
  background-size: auto, auto, 56px 56px, 56px 56px, auto;
}

.shell__docs {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  align-items: start;
  min-height: calc(100vh - var(--site-header-h));
  background:
    radial-gradient(920px 460px at 8% -12%, color-mix(in srgb, var(--rs-primary) 20%, transparent), transparent 58%),
    radial-gradient(720px 380px at 96% 4%, color-mix(in srgb, var(--rs-primary) 12%, transparent), transparent 52%),
    var(--site-home-canvas, var(--site-canvas));
}

.shell__docs:has(.shell__toc) {
  grid-template-columns: 16rem minmax(0, 1fr) 14rem;
}

.shell__aside {
  position: sticky;
  top: var(--site-header-h);
  z-index: 30;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--site-header-h));
  border-right: 1px solid var(--site-line);
  background: var(--site-aside-bg);
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
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
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

.shell__article {
  min-width: 0;
  width: 100%;
  max-width: 54rem;
  margin: 0 auto;
  padding: 2.25rem 2.75rem 4.5rem;
}

.shell__toc {
  position: sticky;
  top: var(--site-header-h);
  height: calc(100vh - var(--site-header-h));
  overflow-y: auto;
  padding: 1.5rem 1.15rem 2rem 0.75rem;
  border-left: 1px solid var(--site-line);
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
  .shell__docs,
  .shell__docs:has(.shell__toc) {
    grid-template-columns: 16rem minmax(0, 1fr);
  }

  .shell__toc {
    display: none;
  }
}

@media (width < 56rem) {
  .shell__docs,
  .shell__docs:has(.shell__toc) {
    grid-template-columns: minmax(0, 1fr);
  }

  .shell__aside {
    position: fixed;
    inset-block: var(--site-header-h) 0;
    inset-inline-start: 0;
    width: 16rem;
    height: auto;
    transform: translateX(-105%);
    transition: transform 0.18s ease;
    box-shadow: 0 16px 40px rgb(0 0 0 / 16%);
  }

  .shell__aside--open {
    transform: translateX(0);
  }

  .shell__backdrop {
    display: block;
    position: fixed;
    inset: var(--site-header-h) 0 0;
    z-index: 25;
    background: rgb(0 0 0 / 35%);
  }

  .shell__article {
    padding: 1.25rem 1.1rem 3rem;
  }
}
</style>
