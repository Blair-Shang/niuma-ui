<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRsConfig } from 'niuma-ui'
import { siteConfig } from '../config'
import { siteText, type SiteLocale } from '../i18n'

const { locale } = useRsConfig()
const copy = computed(() => siteText(locale.value as SiteLocale).footer)
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <img class="site-footer__mark" src="/favicon.svg" width="28" height="28" alt="" />
        <strong class="site-footer__name">{{ siteConfig.name }}</strong>
        <p class="site-footer__license">{{ siteConfig.license }}</p>
      </div>
      <div class="site-footer__cols">
        <div>
          <h2>{{ copy.product }}</h2>
          <RouterLink to="/guide/introduce">{{ copy.guide }}</RouterLink>
          <RouterLink to="/components/button">{{ copy.components }}</RouterLink>
        </div>
        <div>
          <h2>{{ copy.resources }}</h2>
          <a :href="`${siteConfig.github}/blob/main/CHANGELOG.md`" target="_blank" rel="noreferrer">
            {{ copy.changelog }}
          </a>
          <a :href="`${siteConfig.github}/blob/main/LICENSE`" target="_blank" rel="noreferrer">
            {{ copy.license }}
          </a>
        </div>
        <div>
          <h2>{{ copy.community }}</h2>
          <a :href="siteConfig.github" target="_blank" rel="noreferrer">GitHub</a>
          <a :href="`${siteConfig.github}/issues`" target="_blank" rel="noreferrer">Issues</a>
        </div>
      </div>
    </div>
    <p class="site-footer__copy">© {{ new Date().getFullYear() }} {{ copy.copyright }}</p>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--site-line, var(--rs-border-subtle));
  background: var(--site-footer-bg, var(--rs-surface));
  padding: 3rem 1.5rem 1.6rem;
}

.site-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  max-width: 70rem;
  margin: 0 auto 1.75rem;
}

.site-footer__brand {
  display: grid;
  grid-template-columns: 28px auto;
  column-gap: 0.55rem;
  align-items: center;
}

.site-footer__mark {
  grid-column: 1;
  grid-row: 1;
  display: block;
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

.site-footer__name {
  grid-column: 2;
  grid-row: 1;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.site-footer__license {
  grid-column: 2;
  grid-row: 2;
  margin: 0;
  color: var(--rs-muted);
  font-size: 0.75rem;
}

.site-footer__cols {
  display: flex;
  flex-wrap: wrap;
  gap: 2.5rem;
}

.site-footer__cols h2 {
  margin: 0 0 0.65rem;
  color: var(--rs-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.site-footer__cols a {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--rs-text);
  font-size: 0.875rem;
  text-decoration: none;
}

.site-footer__cols a:hover {
  color: var(--rs-primary);
}

.site-footer__copy {
  max-width: 70rem;
  margin: 0 auto;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rs-border-subtle);
  color: var(--rs-muted);
  font-size: 0.75rem;
}
</style>
