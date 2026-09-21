<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { RsButton, RsIcon, useRsConfig } from 'niuma-ui'
import { siteConfig } from '../config'
import { siteText, type SiteLocale } from '../i18n'
import SiteSearch from './SiteSearch.vue'

defineProps<{
  menuOpen: boolean
}>()

const emit = defineEmits<{
  'update:menuOpen': [value: boolean]
}>()

const { resolvedTheme, locale, setTheme, setLocale } = useRsConfig()
const route = useRoute()
const copy = computed(() => siteText(locale.value as SiteLocale))
const isDocs = computed(() => route.path.startsWith('/guide') || route.path.startsWith('/components'))
const section = computed(() => {
  if (route.path.startsWith('/guide')) return 'guide'
  if (route.path.startsWith('/components')) return 'components'
  return 'home'
})

function toggleTheme() {
  setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark')
}

function toggleLocale() {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <div class="site-header__left">
        <RsButton
          v-if="isDocs"
          class="site-header__menu"
          size="sm"
          variant="ghost"
          icon="menu"
          icon-only
          :tooltip="copy.nav.menu"
          @click="emit('update:menuOpen', !menuOpen)"
        />
        <RouterLink to="/" class="site-header__brand">
          <img class="site-header__mark" src="/favicon.svg" width="28" height="28" alt="" />
          <span class="site-header__name">{{ siteConfig.name }}</span>
          <span class="site-header__ver">{{ siteConfig.version }}</span>
        </RouterLink>
        <nav class="site-header__nav" :aria-label="copy.nav.guide">
          <RouterLink
            to="/guide/introduce"
            class="site-header__link"
            :class="{ 'site-header__link--on': section === 'guide' }"
          >
            {{ copy.nav.guide }}
          </RouterLink>
          <RouterLink
            to="/components/button"
            class="site-header__link"
            :class="{ 'site-header__link--on': section === 'components' }"
          >
            {{ copy.nav.components }}
          </RouterLink>
        </nav>
      </div>

      <div class="site-header__search">
        <SiteSearch />
      </div>

      <div class="site-header__right">
        <a class="site-header__ext" :href="siteConfig.github" target="_blank" rel="noreferrer">
          <RsIcon name="github" :size="15" />
          GitHub
        </a>
        <RsButton
          size="sm"
          variant="ghost"
          :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
          icon-only
          :tooltip="copy.nav.theme"
          @click="toggleTheme"
        />
        <button type="button" class="site-header__lang" :title="copy.nav.locale" @click="toggleLocale">
          {{ locale === 'zh-CN' ? 'EN' : '中' }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  flex-shrink: 0;
  z-index: 40;
  border-bottom: 1px solid var(--site-line);
  background: var(--site-header-bg);
  backdrop-filter: blur(18px);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 3.75rem;
  padding: 0 1.25rem 0 1rem;
}

.site-header__left,
.site-header__right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.site-header__left {
  min-width: 0;
  gap: 0.85rem;
}

.site-header__search {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.site-header__menu {
  display: none;
}

.site-header__brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: inherit;
  text-decoration: none;
}

.site-header__mark {
  display: block;
  border-radius: 7px;
}

.site-header__name {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.site-header__ver {
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
  color: var(--rs-primary);
  font-size: 0.66rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.site-header__nav {
  display: flex;
  align-items: stretch;
  height: 3.75rem;
  margin-inline-start: 0.35rem;
}

.site-header__link {
  display: inline-flex;
  align-items: center;
  padding: 0 0.85rem;
  border-bottom: 2px solid transparent;
  color: var(--rs-muted);
  font-size: 0.875rem;
  font-weight: 560;
  text-decoration: none;
}

.site-header__link:hover {
  color: var(--rs-text);
}

.site-header__link--on {
  color: var(--rs-primary);
  border-bottom-color: var(--rs-primary);
}

.site-header__ext {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  color: var(--rs-muted);
  font-size: 0.8125rem;
  font-weight: 550;
  text-decoration: none;
}

.site-header__ext:hover {
  color: var(--rs-text);
}

.site-header__lang {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.45rem;
  border: 0;
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-muted);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
}

.site-header__lang:hover {
  color: var(--rs-text);
  background: var(--rs-item-hover);
}

@media (width < 56rem) {
  .site-header__menu {
    display: inline-flex;
  }

  .site-header__ver,
  .site-header__ext,
  .site-header__nav {
    display: none;
  }
}
</style>
