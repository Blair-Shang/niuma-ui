<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RsButton, useRsConfig } from 'niuma-ui'
import { playgroundRoutes } from '../routes'

const { t } = useRsConfig()

const featured = computed(() => playgroundRoutes.filter((route) => route.featured))

const docsUrl = 'https://blair-shang.github.io/niuma-ui/'
</script>

<template>
  <article class="index-page">
    <header class="index-page__hero">
      <p class="index-page__eyebrow">playground</p>
      <h1 class="index-page__title">{{ t('playground.index.title') }}</h1>
      <p class="index-page__intro">{{ t('playground.index.intro') }}</p>
      <div class="index-page__actions">
        <a :href="docsUrl" class="index-page__action-link" target="_blank" rel="noreferrer">
          <RsButton variant="primary">
            {{ t('playground.index.cta.site') }}
          </RsButton>
        </a>
        <RouterLink to="/button" class="index-page__action-link">
          <RsButton variant="default">
            {{ t('playground.index.cta.browse') }}
          </RsButton>
        </RouterLink>
      </div>
    </header>

    <section class="index-page__section">
      <h2 class="index-page__h2">{{ t('playground.index.docs') }}</h2>
      <p class="index-page__text">{{ t('playground.index.docsHint') }}</p>
      <p class="index-page__text">
        <a :href="docsUrl" target="_blank" rel="noreferrer">{{ docsUrl }}</a>
        ·
        <code>pnpm dev:site</code>
      </p>
    </section>

    <section class="index-page__section">
      <h2 class="index-page__h2">{{ t('playground.index.featured') }}</h2>
      <p class="index-page__text">{{ t('playground.index.featuredHint') }}</p>
      <div class="index-page__cards">
        <RouterLink
          v-for="item in featured"
          :key="item.path"
          :to="item.path"
          class="index-page__card"
        >
          <span class="index-page__card-title">{{ item.title }}</span>
          <span class="index-page__card-desc">{{ item.description }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="index-page__section index-page__section--dev">
      <h2 class="index-page__h2">{{ t('playground.index.dev') }}</h2>
      <p class="index-page__text">{{ t('playground.index.devHint') }}</p>
      <div class="index-page__table-wrap">
        <table class="index-page__table">
          <thead>
            <tr>
              <th>{{ t('playground.index.column.component') }}</th>
              <th>{{ t('playground.index.column.demo') }}</th>
              <th>{{ t('playground.index.column.test') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in playgroundRoutes" :key="item.path">
              <td>{{ item.title }}</td>
              <td>
                <RouterLink :to="item.path">{{ item.path }}</RouterLink>
              </td>
              <td>
                <code v-if="item.testFile !== '—'">pnpm test -- {{ item.testFile }}</code>
                <span v-else class="index-page__muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="index-page__hint">
        {{ t('playground.index.hint') }}：<code>pnpm dev</code>
      </p>
    </section>
  </article>
</template>

<style scoped>
.index-page__hero {
  margin-bottom: var(--rs-space-2xl, 2.5rem);
  padding-bottom: var(--rs-space-xl);
  border-bottom: 1px solid var(--rs-border-subtle);
}

.index-page__eyebrow {
  margin: 0 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rs-primary);
}

.index-page__title {
  margin: 0 0 var(--rs-space-sm);
  font-size: clamp(1.75rem, 2.5vw, 2.25rem);
  font-weight: 650;
  line-height: var(--rs-line-height-tight);
  letter-spacing: -0.02em;
  color: var(--rs-text);
}

.index-page__intro {
  margin: 0 0 var(--rs-space-lg);
  max-width: 40rem;
  font-size: var(--rs-font-size-base);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.index-page__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--rs-space-sm);
}

.index-page__action-link {
  display: inline-flex;
  text-decoration: none;
  color: inherit;
}

.index-page__section {
  margin-bottom: var(--rs-space-2xl, 2.5rem);
}

.index-page__section--dev {
  padding-top: var(--rs-space-xl);
  border-top: 1px solid var(--rs-border-subtle);
}

.index-page__h2 {
  margin: 0 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-base);
  font-weight: 600;
  color: var(--rs-text);
}

.index-page__text {
  margin: 0 0 var(--rs-space-md);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.index-page__text a {
  color: var(--rs-primary);
}

.index-page__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--rs-space-md);
}

.index-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-xs);
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
  text-decoration: none;
  color: inherit;
  transition:
    border-color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.index-page__card:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 45%, var(--rs-border-subtle));
  background: color-mix(in srgb, var(--rs-primary) 6%, var(--rs-surface));
}

.index-page__card-title {
  font-size: var(--rs-font-size-sm);
  font-weight: 600;
  color: var(--rs-text);
}

.index-page__card-desc {
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.index-page__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

:global([data-rs-theme='dark']) .index-page__table-wrap,
:global([data-rs-theme='dark']) .index-page__card {
  background: var(--rs-surface-elevated);
}

.index-page__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--rs-font-size-sm);
}

.index-page__table th,
.index-page__table td {
  padding: var(--rs-space-sm) var(--rs-space-md);
  border-bottom: 1px solid var(--rs-border-subtle);
  text-align: left;
}

.index-page__table th {
  font-weight: 600;
  color: var(--rs-muted);
}

.index-page__table tbody tr:last-child td {
  border-bottom: 0;
}

.index-page__table tbody tr:hover td {
  background: var(--rs-item-hover);
}

.index-page__muted {
  color: var(--rs-placeholder);
}

.index-page__hint {
  margin: var(--rs-space-md) 0 0;
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

code {
  color: var(--rs-primary);
  font-size: var(--rs-font-size-xs);
}
</style>
