<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { RsCodeBlock } from 'niuma-ui'
import { getGuide } from '../catalog/guides'
import DocPager from '../components/DocPager.vue'
import ThemeColorDemo from '../demos/theme-color.vue'
import { useDocToc } from '../composables/doc-toc'
import { useSiteI18n } from '../composables/use-site-i18n'

const route = useRoute()
const { chrome, pair, t } = useSiteI18n()
const toc = useDocToc()

const guide = computed(() => getGuide(String(route.params.slug)))

const heading = computed(() => {
  if (!guide.value) return ''
  return pair(guide.value.title, guide.value.titleEn)
})

const lead = computed(() => {
  if (!guide.value) return ''
  return pair(guide.value.description, guide.value.descriptionEn)
})

const missing = computed(() => t('doc.guideNotFound'))

watchEffect(() => {
  toc.value = (guide.value?.sections ?? []).map((section) => ({
    id: section.id,
    title: pair(section.title, section.titleEn),
  }))
})
</script>

<template>
  <article v-if="guide">
    <header class="site-doc__header">
      <p class="site-doc__kicker">{{ chrome.groups.guide }}</p>
      <h1 class="site-doc__title">{{ heading }}</h1>
      <p class="site-doc__lead">{{ lead }}</p>
    </header>

    <section v-for="section in guide.sections" :id="section.id" :key="section.id" class="site-doc__section">
      <h2 class="site-doc__h2">{{ pair(section.title, section.titleEn) }}</h2>
      <p v-if="pair(section.body, section.bodyEn)" class="site-doc__copy">{{ pair(section.body, section.bodyEn) }}</p>
      <ul v-if="pair(section.bullets, section.bulletsEn)?.length" class="site-doc__list">
        <li v-for="item in pair(section.bullets, section.bulletsEn)" :key="item">{{ item }}</li>
      </ul>
      <div v-if="section.demo === 'color-theme'" class="site-doc__panel">
        <ThemeColorDemo />
      </div>
      <div v-if="section.code" class="site-doc__code">
        <RsCodeBlock :code="section.code.content" :lang="section.code.lang" />
      </div>
    </section>
    <DocPager />
  </article>
  <article v-else>
    <h1 class="site-doc__title">{{ missing }}</h1>
  </article>
</template>
