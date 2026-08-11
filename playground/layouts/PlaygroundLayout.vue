<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { RsButton, RsContainer, RsInput, RsLabel, RsSelect, useRsConfig } from 'niuma-ui'
import {
  playgroundGroupOrder,
  playgroundRoutes,
  type PlaygroundGroup,
  type PlaygroundRoute,
} from '../routes'

const { theme, locale, setTheme, setLocale, t } = useRsConfig()
const route = useRoute()

const themeModel = ref(theme.value)
const localeModel = ref(locale.value)
const navQuery = ref('')
const mobileNavOpen = ref(false)

const themeOptions = computed(() => [
  { label: t('playground.theme.dark'), value: 'dark' },
  { label: t('playground.theme.light'), value: 'light' },
])

const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

const groupLabelKeys: Record<PlaygroundGroup, string> = {
  start: 'playground.nav.start',
  basic: 'playground.nav.basic',
  form: 'playground.nav.form',
  nav: 'playground.nav.navigation',
  feedback: 'playground.nav.feedback',
  data: 'playground.nav.data',
  editor: 'playground.nav.editor',
  lab: 'playground.nav.lab',
}

const filteredRoutes = computed(() => {
  const q = navQuery.value.trim().toLowerCase()
  if (!q) return playgroundRoutes
  return playgroundRoutes.filter((item) => {
    return (
      item.title.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q)
    )
  })
})

const groupedRoutes = computed(() => {
  const groups: { key: PlaygroundGroup; title: string; items: PlaygroundRoute[] }[] = []
  for (const key of playgroundGroupOrder) {
    const items = filteredRoutes.value.filter((item) => item.group === key)
    if (items.length === 0) continue
    groups.push({
      key,
      title: t(groupLabelKeys[key]),
      items,
    })
  }
  return groups
})

watch(themeModel, (value) => setTheme(value as 'dark' | 'light'))
watch(localeModel, (value) => setLocale(value as 'zh-CN' | 'en-US'))
watch(theme, (value) => {
  themeModel.value = value
})
watch(locale, (value) => {
  localeModel.value = value
})
watch(
  () => route.path,
  () => {
    mobileNavOpen.value = false
  },
)
</script>

<template>
  <div class="pg-shell">
    <header class="pg-shell__header">
      <div class="pg-shell__brand-row">
        <RsButton
          class="pg-shell__menu-btn"
          size="sm"
          variant="ghost"
          icon="menu"
          icon-only
          :tooltip="t('playground.nav.toggle')"
          @click="mobileNavOpen = !mobileNavOpen"
        />
        <RouterLink to="/" class="pg-shell__brand">
          <span class="pg-shell__brand-name">{{ t('playground.brand') }}</span>
          <span class="pg-shell__brand-sub">{{ t('playground.subtitle') }}</span>
        </RouterLink>
      </div>
      <div class="pg-shell__toolbar">
        <a
          class="pg-shell__repo"
          href="https://github.com/Blair-Shang/niuma-ui"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <div class="pg-shell__control">
          <RsLabel class="pg-shell__control-label">{{ t('playground.theme.label') }}</RsLabel>
          <RsSelect v-model="themeModel" :options="themeOptions" size="sm" />
        </div>
        <div class="pg-shell__control">
          <RsLabel class="pg-shell__control-label">{{ t('playground.locale.label') }}</RsLabel>
          <RsSelect v-model="localeModel" :options="localeOptions" size="sm" />
        </div>
      </div>
    </header>

    <div
      v-if="mobileNavOpen"
      class="pg-shell__backdrop"
      aria-hidden="true"
      @click="mobileNavOpen = false"
    />

    <div class="pg-shell__body">
      <aside class="pg-shell__aside" :class="{ 'pg-shell__aside--open': mobileNavOpen }">
        <div class="pg-shell__search">
          <RsInput
            v-model="navQuery"
            type="search"
            size="sm"
            clearable
            :placeholder="t('playground.nav.search')"
          />
        </div>
        <nav class="pg-shell__nav" :aria-label="t('playground.nav.label')">
          <section class="pg-shell__group">
            <h2 class="pg-shell__group-title">{{ t('playground.nav.start') }}</h2>
            <RouterLink to="/" class="pg-shell__link" active-class="pg-shell__link--active">
              {{ t('playground.nav.overview') }}
            </RouterLink>
          </section>

          <section v-for="group in groupedRoutes" :key="group.key" class="pg-shell__group">
            <h2 class="pg-shell__group-title">{{ group.title }}</h2>
            <RouterLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="pg-shell__link"
              active-class="pg-shell__link--active"
              :title="item.description"
            >
              {{ item.title }}
            </RouterLink>
          </section>

          <p v-if="groupedRoutes.length === 0" class="pg-shell__empty">
            {{ t('playground.nav.empty') }}
          </p>
        </nav>
      </aside>

      <main class="pg-shell__main">
        <RsContainer max-width="xl" padding="lg" :centered="true">
          <RouterView />
        </RsContainer>
      </main>
    </div>
  </div>
</template>

<style scoped>
.pg-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: var(--rs-bg);
  color: var(--rs-text);
}

.pg-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-lg);
  flex-shrink: 0;
  padding: var(--rs-space-md) var(--rs-space-xl);
  border-bottom: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
  z-index: 20;
}

.pg-shell__brand-row {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
  min-width: 0;
}

.pg-shell__menu-btn {
  display: none;
}

.pg-shell__brand {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-xs);
  min-width: 0;
  text-decoration: none;
  color: inherit;
}

.pg-shell__brand-name {
  font-size: var(--rs-font-size-base);
  font-weight: 600;
  line-height: var(--rs-line-height-tight);
  letter-spacing: -0.01em;
  color: var(--rs-text);
}

.pg-shell__brand-sub {
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.pg-shell__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--rs-space-md);
}

.pg-shell__repo {
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
  text-decoration: none;
}

.pg-shell__repo:hover {
  color: var(--rs-primary);
}

.pg-shell__control {
  display: flex;
  align-items: center;
  gap: var(--rs-space-sm);
}

.pg-shell__control-label {
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  font-size: var(--rs-font-size-xs);
  color: var(--rs-muted);
}

.pg-shell__control-label :deep(.rs-label__text) {
  font-size: inherit;
}

.pg-shell__body {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}

.pg-shell__aside {
  width: 17rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--rs-border-subtle);
  background: var(--rs-surface);
  z-index: 30;
}

.pg-shell__search {
  flex-shrink: 0;
  padding: var(--rs-space-sm);
  border-bottom: 1px solid var(--rs-border-subtle);
}

.pg-shell__nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--rs-space-sm);
}

.pg-shell__group + .pg-shell__group {
  margin-top: var(--rs-space-md);
}

.pg-shell__group-title {
  margin: 0;
  padding: var(--rs-space-xs) var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
  text-transform: uppercase;
}

.pg-shell__link {
  display: flex;
  align-items: center;
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-sm);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-sm);
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  text-decoration: none;
  transition:
    background var(--rs-transition-fast),
    border-color var(--rs-transition-fast),
    color var(--rs-transition-fast);
}

.pg-shell__link:hover {
  background: var(--rs-item-hover);
  color: var(--rs-text);
}

.pg-shell__link--active {
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
  color: var(--rs-primary);
  font-weight: 500;
}

.pg-shell__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.pg-shell__empty {
  margin: var(--rs-space-md) var(--rs-space-sm);
  font-size: var(--rs-font-size-sm);
  color: var(--rs-muted);
}

.pg-shell__main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: var(--rs-bg);
  padding-block: var(--rs-space-xl);
}

.pg-shell__backdrop {
  display: none;
}

@media (width < 56rem) {
  .pg-shell__menu-btn {
    display: inline-flex;
  }

  .pg-shell__aside {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    height: 100%;
    transform: translateX(-105%);
    transition: transform var(--rs-transition-fast);
    box-shadow: var(--rs-shadow-lg, 0 16px 40px rgb(0 0 0 / 18%));
  }

  .pg-shell__aside--open {
    transform: translateX(0);
  }

  .pg-shell__backdrop {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 25;
    background: rgb(0 0 0 / 35%);
  }

  .pg-shell__header {
    flex-wrap: wrap;
  }

  .pg-shell__toolbar {
    width: 100%;
    justify-content: stretch;
  }

  .pg-shell__control {
    flex: 1;
    min-width: 0;
  }
}
</style>
