<script setup lang="ts">
import { computed, defineAsyncComponent, type Component, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { getComponent } from '../catalog/components'
import DocPage from '../components/DocPage.vue'
import { useDocToc } from '../composables/doc-toc'
import { useSiteI18n } from '../composables/use-site-i18n'

const demoLoaders = import.meta.glob('../demos/*.vue')

const route = useRoute()
const { chrome, pair } = useSiteI18n()
const toc = useDocToc()
const copy = computed(() => chrome.value.doc)

const doc = computed(() => getComponent(String(route.params.slug)))

const Demo = computed<Component | null>(() => {
  const slug = doc.value?.slug
  if (!slug) return null
  const loader = demoLoaders[`../demos/${slug}.vue`]
  if (!loader) return null
  return defineAsyncComponent(loader as () => Promise<{ default: Component }>)
})

watchEffect(() => {
  const current = doc.value
  if (!current) {
    toc.value = []
    return
  }
  const demoChildren = (current.demos ?? []).map((demo) => ({
    id: demo.id,
    title: pair(demo.title, demo.titleEn),
  }))
  const items = [
    { id: 'overview', title: copy.value.overview },
    { id: 'import', title: copy.value.import },
    { id: 'when-to-use', title: copy.value.whenToUse },
    {
      id: 'demos',
      title: copy.value.demos,
      children: demoChildren.length ? demoChildren : undefined,
    },
    { id: 'api', title: copy.value.api },
  ]
  if (current.tokens?.length) items.push({ id: 'token', title: copy.value.tokens })
  if (current.faq?.length) items.push({ id: 'faq', title: copy.value.faq })
  if (current.related?.length) items.push({ id: 'related', title: copy.value.related })
  toc.value = items
})
</script>

<template>
  <DocPage v-if="doc" :doc="doc">
    <component :is="Demo" v-if="Demo" />
    <p v-else class="missing">{{ copy.missingDemo }}</p>
  </DocPage>
  <article v-else>
    <h1>{{ copy.notFound }}</h1>
  </article>
</template>

<style scoped>
.missing {
  margin: 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
</style>
