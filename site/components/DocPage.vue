<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RsCodeBlock } from 'niuma-ui'
import type { ComponentDoc } from '../catalog/types'
import { relatedComponentLabel } from '../composables/doc-nav'
import { useSiteI18n } from '../composables/use-site-i18n'
import ApiTable from './ApiTable.vue'
import DocPager from './DocPager.vue'
import TokenTable from './TokenTable.vue'
import FaqList from './FaqList.vue'

const props = defineProps<{
  doc: ComponentDoc
}>()

const { locale, chrome, pair } = useSiteI18n()
const copy = computed(() => chrome.value.doc)

const importCode = computed(
  () => `import { ${props.doc.name} } from 'niuma-ui'`,
)

const heading = computed(() =>
  pair(`${props.doc.title} ${props.doc.titleZh}`, props.doc.title),
)

const lead = computed(() => pair(props.doc.description, props.doc.descriptionEn))

const whenToUse = computed(() =>
  pair(props.doc.whenToUse, props.doc.whenToUseEn?.length ? props.doc.whenToUseEn : undefined),
)
</script>

<template>
  <article class="doc-page">
    <header class="doc-page__header">
      <p class="doc-page__name">{{ doc.name }}</p>
      <h1 id="overview" class="doc-page__title">{{ heading }}</h1>
      <p class="doc-page__lead">{{ lead }}</p>
    </header>

    <section id="import" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.import }}</h2>
      <RsCodeBlock :code="importCode" lang="ts" />
    </section>

    <section v-if="whenToUse.length" id="when-to-use" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.whenToUse }}</h2>
      <ul class="doc-page__list">
        <li v-for="item in whenToUse" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section id="demos" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.demos }}</h2>
      <div class="doc-page__demos">
        <slot />
      </div>
    </section>

    <section id="api" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.api }}</h2>
      <ApiTable :title="`${doc.name} ${copy.props}`" :rows="doc.props" />
      <ApiTable v-if="doc.events?.length" :title="copy.events" :rows="doc.events" />
      <ApiTable v-if="doc.slots?.length" :title="copy.slots" :rows="doc.slots" />
      <ApiTable v-if="doc.methods?.length" :title="copy.methods" :rows="doc.methods" />
    </section>

    <section v-if="doc.tokens?.length" id="token" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.tokens }}</h2>
      <p class="doc-page__hint">{{ copy.tokenHint }}</p>
      <TokenTable :rows="doc.tokens" />
    </section>

    <section v-if="doc.faq?.length" id="faq" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.faq }}</h2>
      <FaqList :items="doc.faq" />
    </section>

    <section v-if="doc.related?.length" id="related" class="doc-page__section">
      <h2 class="doc-page__h2">{{ copy.related }}</h2>
      <div class="doc-page__related">
        <RouterLink
          v-for="slug in doc.related"
          :key="slug"
          :to="`/components/${slug}`"
          class="doc-page__related-link"
        >
          {{ relatedComponentLabel(slug, locale) }}
        </RouterLink>
      </div>
    </section>

    <DocPager />
  </article>
</template>

<style scoped>
.doc-page__header {
  margin-bottom: var(--rs-space-2xl, 2.5rem);
  padding-bottom: var(--rs-space-xl);
  border-bottom: 1px solid var(--rs-border-subtle);
}

.doc-page__name {
  margin: 0 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rs-primary);
}

.doc-page__title {
  margin: 0 0 var(--rs-space-sm);
  scroll-margin-top: calc(var(--site-header-h) + 1rem);
  font-size: clamp(1.85rem, 2.6vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: var(--rs-line-height-tight);
  color: var(--rs-text);
}

.doc-page__lead {
  margin: 0;
  max-width: 46rem;
  font-size: var(--rs-font-size-base);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.doc-page__section {
  margin-bottom: var(--rs-space-2xl, 2.5rem);
}

.doc-page__h2 {
  margin: 0 0 var(--rs-space-md);
  scroll-margin-top: calc(var(--site-header-h) + 1rem);
  font-size: var(--rs-font-size-lg);
  font-weight: 600;
  color: var(--rs-text);
}

.doc-page__list {
  margin: 0;
  padding-inline-start: 1.2rem;
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: 1.8;
}

.doc-page__demos {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-2xl, 2.5rem);
}

.doc-page__hint {
  margin: 0 0 var(--rs-space-md);
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
}

.doc-page__hint code {
  color: var(--rs-primary);
  font-size: var(--rs-font-size-xs);
}

.doc-page__related {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
}

.doc-page__related-link {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius-sm);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  text-decoration: none;
}

.doc-page__related-link:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 45%, var(--rs-border-subtle));
  color: var(--rs-primary);
}
</style>
