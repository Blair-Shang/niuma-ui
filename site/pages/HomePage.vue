<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { RsButton, RsIcon } from 'niuma-ui'
import { componentDocs } from '../catalog/components'
import type { ComponentGroup } from '../catalog/types'
import HomeShowcase from '../components/HomeShowcase.vue'
import { siteConfig } from '../config'
import { useDocToc } from '../composables/doc-toc'
import { useSiteI18n } from '../composables/use-site-i18n'

const { chrome: copy, t } = useSiteI18n()
const toc = useDocToc()
const copied = ref(false)

const groups: { key: ComponentGroup; to: string; icon: string }[] = [
  { key: 'basic', to: '/components/button', icon: 'layers' },
  { key: 'form', to: '/components/form', icon: 'text-cursor-input' },
  { key: 'nav', to: '/components/anchor', icon: 'compass' },
  { key: 'feedback', to: '/components/dialog', icon: 'message-circle' },
  { key: 'data', to: '/components/table', icon: 'table-2' },
  { key: 'editor', to: '/components/code-editor', icon: 'code-2' },
]

const featureIcons = ['swatch-book', 'blend', 'accessibility', 'layout-dashboard', 'package', 'rocket'] as const

const featured = [
  { slug: 'button', title: 'Button' },
  { slug: 'anchor', title: 'Anchor' },
  { slug: 'table', title: 'Table' },
  { slug: 'form', title: 'Form' },
  { slug: 'dialog', title: 'Dialog' },
  { slug: 'code-editor', title: 'Editor' },
]

const counts = computed(() => {
  const map = Object.fromEntries(groups.map((item) => [item.key, 0])) as Record<ComponentGroup, number>
  for (const doc of componentDocs) {
    map[doc.group] += 1
  }
  return map
})

const stack = [
  { label: 'Vue', value: '3.5+' },
  { label: 'License', value: siteConfig.license },
  { label: 'npm', value: siteConfig.npm },
  { label: 'Components', value: String(componentDocs.length) },
]

async function copyInstall() {
  try {
    await navigator.clipboard.writeText(siteConfig.install)
    copied.value = true
    globalThis.setTimeout(() => {
      copied.value = false
    }, 1400)
  } catch {
    copied.value = false
  }
}

onMounted(() => {
  toc.value = []
})
</script>

<template>
  <div class="landing">
    <section class="hero">
      <div class="hero__copy">
        <p class="hero__kicker">{{ copy.home.kicker }}</p>
        <h1>{{ copy.home.title }}</h1>
        <p class="hero__slogan">{{ copy.home.slogan }}</p>
        <p class="hero__intro">{{ copy.home.intro }}</p>
        <div class="hero__actions">
          <RouterLink to="/guide/getting-started">
            <RsButton variant="primary" size="lg">{{ copy.home.ctaStart }}</RsButton>
          </RouterLink>
          <RouterLink to="/components/button">
            <RsButton variant="default" size="lg">{{ copy.home.ctaComponents }}</RsButton>
          </RouterLink>
        </div>
        <button type="button" class="hero__cmd" @click="copyInstall">
          <span class="hero__cmd-dot" />
          <code>{{ siteConfig.install }}</code>
          <span>{{ copied ? copy.doc.copied : copy.doc.copy }}</span>
        </button>
        <div class="hero__pills">
          <RouterLink v-for="item in featured" :key="item.slug" :to="`/components/${item.slug}`">
            {{ item.title }}
          </RouterLink>
        </div>
      </div>
      <HomeShowcase />
    </section>

    <section class="strip">
      <div v-for="item in stack" :key="item.label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="block">
      <div class="block__head">
        <h2>{{ copy.home.features }}</h2>
      </div>
      <div class="features">
        <article v-for="(item, index) in copy.features" :key="item.title">
          <span class="features__icon">
            <RsIcon :name="featureIcons[index] ?? 'sparkles'" :size="18" />
          </span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
    </section>

    <section class="block">
      <div class="block__head">
        <h2>{{ copy.home.featured }}</h2>
        <p>{{ copy.home.featuredHint }}</p>
      </div>
      <div class="cats">
        <RouterLink v-for="item in groups" :key="item.key" :to="item.to">
          <span class="cats__icon">
            <RsIcon :name="item.icon" :size="18" />
          </span>
          <strong>{{ copy.groups[item.key] }}</strong>
          <span>{{ t(`home.groupHint.${item.key}`) }}</span>
          <em>{{ counts[item.key] }}</em>
        </RouterLink>
      </div>
    </section>

    <section class="oss">
      <div>
        <h2>{{ copy.home.oss }}</h2>
        <p>{{ copy.home.ossBody }}</p>
      </div>
      <a :href="siteConfig.github" target="_blank" rel="noreferrer">
        <RsButton variant="primary" icon="github">{{ copy.home.ctaGithub }}</RsButton>
      </a>
    </section>
  </div>
</template>

<style scoped>
.landing {
  max-width: 70rem;
  margin: 0 auto;
  padding: 0 1.5rem 5.5rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(20rem, 0.98fr);
  gap: 3.5rem;
  align-items: center;
  padding: 5.4rem 0 4.4rem;
}

.hero__kicker,
.block__kicker {
  margin: 0 0 0.7rem;
  color: var(--rs-primary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(3rem, 6.4vw, 4.35rem);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.92;
}

.hero__slogan {
  margin: 0 0 0.95rem;
  max-width: 28rem;
  font-size: clamp(1.22rem, 2vw, 1.5rem);
  font-weight: 500;
  line-height: 1.38;
}

.hero__intro {
  margin: 0 0 1.7rem;
  max-width: 34rem;
  color: var(--rs-muted);
  font-size: 1.02rem;
  line-height: 1.75;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-bottom: 1.15rem;
}

.hero__actions a {
  text-decoration: none;
}

.hero__cmd {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.48rem 0.55rem 0.48rem 0.8rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--rs-surface) 78%, transparent);
  box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
  color: inherit;
  cursor: pointer;
}

.hero__cmd-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--rs-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--rs-primary) 16%, transparent);
}

.hero__cmd code {
  font-size: 0.86rem;
  color: var(--rs-text);
}

.hero__cmd span:last-child {
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
  color: var(--rs-primary);
  font-size: 0.72rem;
  font-weight: 600;
}

.hero__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 1.15rem;
}

.hero__pills a {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--rs-surface) 70%, transparent);
  color: var(--rs-muted);
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
}

.hero__pills a:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 40%, var(--rs-border-subtle));
  color: var(--rs-primary);
}

.strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 5rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 1.2rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--rs-surface) 86%, transparent);
  backdrop-filter: blur(10px);
}

.strip > div {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.2rem 1.25rem;
}

.strip > div + div {
  border-inline-start: 1px solid var(--rs-border-subtle);
}

.strip span {
  color: var(--rs-muted);
  font-size: 0.72rem;
}

.strip strong {
  font-size: 1.02rem;
  font-weight: 600;
}

.block {
  margin-bottom: 5rem;
}

.block__head {
  margin-bottom: 1.5rem;
}

.block__head h2,
.oss h2 {
  margin: 0;
  font-size: 1.65rem;
  letter-spacing: -0.035em;
}

.block__head p {
  margin: 0.45rem 0 0;
  color: var(--rs-muted);
  font-size: 0.92rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.features article {
  padding: 1.3rem 1.25rem 1.4rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 1.05rem;
  background: color-mix(in srgb, var(--rs-surface) 88%, transparent);
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.features article:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 36%, var(--rs-border-subtle));
  box-shadow: 0 16px 36px rgb(15 23 42 / 7%);
  transform: translateY(-2px);
}

.features__icon,
.cats__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  margin-bottom: 0.8rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--rs-primary) 12%, transparent);
  color: var(--rs-primary);
}

.features h3 {
  margin: 0 0 0.4rem;
  font-size: 0.98rem;
}

.features p {
  margin: 0;
  color: var(--rs-muted);
  font-size: 0.8125rem;
  line-height: 1.65;
}

.cats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.95rem;
}

.cats a {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 0.8rem;
  row-gap: 0.15rem;
  align-items: center;
  padding: 1.15rem 1.15rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 1.05rem;
  background: color-mix(in srgb, var(--rs-surface) 88%, transparent);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.cats a:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 42%, var(--rs-border-subtle));
  box-shadow: 0 16px 36px rgb(15 23 42 / 7%);
  transform: translateY(-2px);
}

.cats__icon {
  grid-row: 1 / span 2;
  margin: 0;
}

.cats strong {
  font-size: 1rem;
}

.cats span:not(.cats__icon) {
  grid-column: 2;
  color: var(--rs-muted);
  font-size: 0.78rem;
}

.cats em {
  grid-row: 1 / span 2;
  color: var(--rs-primary);
  font-style: normal;
  font-size: 0.92rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.oss {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.9rem 2rem;
  border: 1px solid color-mix(in srgb, var(--rs-primary) 22%, var(--rs-border-subtle));
  border-radius: 1.25rem;
  background:
    radial-gradient(520px 180px at 100% 0%, color-mix(in srgb, var(--rs-primary) 22%, transparent), transparent 60%),
    color-mix(in srgb, var(--rs-surface) 88%, transparent);
}

.oss p {
  margin: 0.45rem 0 0;
  color: var(--rs-muted);
  font-size: 0.92rem;
}

.oss a {
  text-decoration: none;
}

@media (width < 64rem) {
  .hero {
    grid-template-columns: 1fr;
    padding: 3.4rem 0 3.2rem;
    gap: 2.2rem;
  }

  .features,
  .cats,
  .strip {
    grid-template-columns: 1fr 1fr;
  }

  .strip > div + div {
    border-inline-start: 0;
    border-top: 1px solid var(--rs-border-subtle);
  }
}

@media (width < 40rem) {
  .features,
  .cats,
  .strip {
    grid-template-columns: 1fr;
  }

  .oss {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
