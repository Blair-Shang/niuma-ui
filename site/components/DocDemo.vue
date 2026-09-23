<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCodeBlock } from 'niuma-ui'
import { useSiteI18n } from '../composables/use-site-i18n'

const props = defineProps<{
  id: string
  title: string
  titleEn?: string
  description?: string
  descriptionEn?: string
  code?: string
  lang?: string
}>()

const { t, pair } = useSiteI18n()
const heading = computed(() => pair(props.title, props.titleEn))
const lead = computed(() =>
  props.description || props.descriptionEn
    ? pair(props.description ?? '', props.descriptionEn)
    : undefined,
)
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
        <h3 class="doc-demo__title">{{ heading }}</h3>
        <p v-if="lead" class="doc-demo__desc">{{ lead }}</p>
      </div>
      <div v-if="code" class="doc-demo__actions">
        <RsButton size="sm" variant="ghost" :icon="showCode ? 'eye-off' : 'code-2'" @click="showCode = !showCode">
          {{ showCode ? t('doc.hideCode') : t('doc.showCode') }}
        </RsButton>
        <RsButton size="sm" variant="ghost" :icon="copied ? 'check' : 'copy'" @click="copyCode">
          {{ copied ? t('doc.copied') : t('doc.copy') }}
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
  scroll-margin-top: calc(var(--site-header-h) + 1rem);
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
  border-radius: var(--site-panel-radius);
  background: var(--site-panel-bg);
}

.doc-demo__code {
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--site-panel-radius);
  overflow: hidden;
  background: var(--site-panel-bg);
}

.doc-demo__code :deep(.rs-code-block) {
  border: 0;
  border-radius: 0;
}
</style>
