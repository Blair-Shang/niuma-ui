<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCodeBlock, useRsConfig } from 'niuma-ui'
import { siteText, type SiteLocale } from '../i18n'

const props = defineProps<{
  id: string
  title: string
  description?: string
  code?: string
  lang?: string
}>()

const { locale } = useRsConfig()
const copy = computed(() => siteText(locale.value as SiteLocale).doc)
const showCode = ref(false)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const codeLang = computed(() => props.lang || 'vue')

async function copyCode() {
  if (!props.code) return
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <section :id="id" class="doc-demo">
    <header class="doc-demo__head">
      <div class="doc-demo__titles">
        <h3 class="doc-demo__title">{{ title }}</h3>
        <p v-if="description" class="doc-demo__desc">{{ description }}</p>
      </div>
      <div v-if="code" class="doc-demo__actions">
        <RsButton size="sm" variant="ghost" :icon="showCode ? 'eye-off' : 'code-2'" @click="showCode = !showCode">
          {{ showCode ? copy.hideCode : copy.showCode }}
        </RsButton>
        <RsButton size="sm" variant="ghost" :icon="copied ? 'check' : 'copy'" @click="copyCode">
          {{ copied ? copy.copied : copy.copy }}
        </RsButton>
      </div>
    </header>
    <div class="doc-demo__preview">
      <slot />
    </div>
    <div v-if="code && showCode" class="doc-demo__code">
      <RsCodeBlock :code="code" :lang="codeLang" />
    </div>
  </section>
</template>

<style scoped>
.doc-demo {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
}

.doc-demo__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--rs-space-md);
}

.doc-demo__title {
  margin: 0;
  font-size: var(--rs-font-size-base);
  font-weight: 600;
  line-height: var(--rs-line-height-tight);
  color: var(--rs-text);
}

.doc-demo__desc {
  margin: var(--rs-space-xs) 0 0;
  max-width: 46rem;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.doc-demo__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--rs-space-xs);
}

.doc-demo__preview {
  padding: 1.5rem 1.4rem;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 0.9rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--rs-surface) 88%, #fff), var(--rs-surface));
}

:global([data-rs-theme='dark']) .doc-demo__preview {
  background: var(--rs-surface-elevated);
}

.doc-demo__code {
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
}

.doc-demo__code :deep(.rs-code-block) {
  border: 0;
  border-radius: 0;
}
</style>
