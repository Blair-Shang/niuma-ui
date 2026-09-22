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
const { pair, t } = useSiteI18n()
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
  <article v-if="guide" class="guide">
    <header class="guide__header">
      <h1>{{ heading }}</h1>
      <p>{{ lead }}</p>
    </header>

    <section v-for="section in guide.sections" :id="section.id" :key="section.id" class="guide__section">
      <h2>{{ pair(section.title, section.titleEn) }}</h2>
      <p v-if="pair(section.body, section.bodyEn)">{{ pair(section.body, section.bodyEn) }}</p>
      <ul v-if="pair(section.bullets, section.bulletsEn)?.length">
        <li v-for="item in pair(section.bullets, section.bulletsEn)" :key="item">{{ item }}</li>
      </ul>
      <ThemeColorDemo v-if="section.demo === 'color-theme'" />
      <RsCodeBlock v-if="section.code" :code="section.code.content" :lang="section.code.lang" />
    </section>
    <DocPager />
  </article>
  <article v-else class="guide">
    <h1>{{ missing }}</h1>
  </article>
</template>

<style scoped>
.guide__header {
  margin-bottom: 2.25rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--rs-border-subtle);
}

.guide__header h1 {
  margin: 0 0 var(--rs-space-sm);
  scroll-margin-top: calc(var(--site-header-h) + 1rem);
  font-size: clamp(1.85rem, 2.6vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.035em;
}

.guide__header p,
.guide__section p {
  margin: 0 0 var(--rs-space-md);
  max-width: 46rem;
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
  line-height: 1.75;
}

.guide__section {
  margin-bottom: 2.25rem;
}

.guide__section h2 {
  margin: 0 0 var(--rs-space-md);
  scroll-margin-top: calc(var(--site-header-h) + 1rem);
  font-size: var(--rs-font-size-lg);
}

.guide__section ul {
  margin: 0 0 var(--rs-space-md);
  padding-inline-start: 1.2rem;
  font-size: var(--rs-font-size-sm);
  line-height: 1.8;
}
</style>
