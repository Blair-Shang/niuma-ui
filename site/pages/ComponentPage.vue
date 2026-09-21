<script setup lang="ts">
import { computed, defineAsyncComponent, type Component, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useRsConfig } from 'niuma-ui'
import { getComponent } from '../catalog/components'
import DocPage from '../components/DocPage.vue'
import { useDocToc } from '../composables/doc-toc'
import { siteText, type SiteLocale } from '../i18n'

const demoLoaders = import.meta.glob('../demos/*.vue')

const route = useRoute()
const { locale } = useRsConfig()
const toc = useDocToc()
const copy = computed(() => siteText(locale.value as SiteLocale).doc)

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
  const items = [
    { id: 'overview', title: current.titleZh },
    { id: 'import', title: copy.value.import },
    { id: 'when-to-use', title: copy.value.whenToUse },
    { id: 'demos', title: copy.value.demos },
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
    <p v-else class="missing">该组件的交互示例正在补充，请先查阅下方 API。</p>
  </DocPage>
  <article v-else>
    <h1>未找到该组件</h1>
  </article>
</template>

<style scoped>
.missing {
  margin: 0;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
}
</style>
