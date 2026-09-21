<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { RsCodeBlock, useRsConfig } from 'niuma-ui'
import { getGuide } from '../catalog/guides'
import { useDocToc } from '../composables/doc-toc'

const route = useRoute()
const { locale } = useRsConfig()
const toc = useDocToc()

const guide = computed(() => getGuide(String(route.params.slug)))
const isEn = computed(() => locale.value === 'en-US')

const heading = computed(() => {
  if (!guide.value) return ''
  return isEn.value ? guide.value.titleEn : guide.value.title
})

const lead = computed(() => {
  if (!guide.value) return ''
  return isEn.value ? guide.value.descriptionEn : guide.value.description
})

watchEffect(() => {
  toc.value = (guide.value?.sections ?? []).map((section) => ({
    id: section.id,
    title: isEn.value ? section.titleEn : section.title,
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
      <h2>{{ isEn ? section.titleEn : section.title }}</h2>
      <p v-if="isEn ? section.bodyEn : section.body">{{ isEn ? section.bodyEn : section.body }}</p>
      <ul v-if="(isEn ? section.bulletsEn : section.bullets)?.length">
        <li v-for="item in (isEn ? section.bulletsEn : section.bullets)" :key="item">{{ item }}</li>
      </ul>
      <RsCodeBlock v-if="section.code" :code="section.code.content" :lang="section.code.lang" />
    </section>
  </article>
  <article v-else class="guide">
    <h1>{{ isEn ? 'Guide not found' : '未找到该指南' }}</h1>
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
  font-size: clamp(1.85rem, 2.6vw, 2.35rem);
  font-weight: 680;
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
  font-size: var(--rs-font-size-lg);
}

.guide__section ul {
  margin: 0 0 var(--rs-space-md);
  padding-inline-start: 1.2rem;
  font-size: var(--rs-font-size-sm);
  line-height: 1.8;
}
</style>
