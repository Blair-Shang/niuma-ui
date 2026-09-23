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
    <header class="site-doc__header">
      <p class="site-doc__kicker">{{ doc.name }}</p>
      <h1 id="overview" class="site-doc__title">{{ heading }}</h1>
      <p class="site-doc__lead">{{ lead }}</p>
    </header>

    <section id="import" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.import }}</h2>
      <div class="site-doc__code">
        <RsCodeBlock :code="importCode" lang="ts" />
      </div>
    </section>

    <section v-if="whenToUse.length" id="when-to-use" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.whenToUse }}</h2>
      <ul class="site-doc__list">
        <li v-for="item in whenToUse" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section id="demos" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.demos }}</h2>
      <div class="doc-page__demos">
        <slot />
      </div>
    </section>

    <section id="api" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.api }}</h2>
      <ApiTable :title="`${doc.name} ${copy.props}`" :rows="doc.props" />
      <ApiTable v-if="doc.events?.length" :title="copy.events" :rows="doc.events" />
      <ApiTable v-if="doc.slots?.length" :title="copy.slots" :rows="doc.slots" />
      <ApiTable v-if="doc.methods?.length" :title="copy.methods" :rows="doc.methods" />
    </section>

    <section v-if="doc.tokens?.length" id="token" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.tokens }}</h2>
      <p class="doc-page__hint">{{ copy.tokenHint }}</p>
      <TokenTable :rows="doc.tokens" />
    </section>

    <section v-if="doc.faq?.length" id="faq" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.faq }}</h2>
      <FaqList :items="doc.faq" />
    </section>

    <section v-if="doc.related?.length" id="related" class="site-doc__section">
      <h2 class="site-doc__h2">{{ copy.related }}</h2>
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
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 999px;
  background: var(--site-panel-bg);
  color: var(--rs-muted);
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
}

.doc-page__related-link:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 45%, var(--rs-border-subtle));
  color: var(--rs-primary);
}
</style>
