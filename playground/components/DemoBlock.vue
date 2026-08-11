<script setup lang="ts">
import { computed, ref } from 'vue'
import { RsButton, RsCodeBlock, useRsConfig } from 'niuma-ui'

const props = defineProps<{
  title?: string
  /** 可复制示例源码；有值时展示「代码」折叠区 */
  code?: string
  /** 代码语言，默认 vue */
  lang?: string
}>()

const { t } = useRsConfig()
const showCode = ref(false)

const codeLang = computed(() => props.lang || 'vue')
</script>

<template>
  <section class="demo-block">
    <header v-if="title || code" class="demo-block__header">
      <h2 v-if="title" class="demo-block__title">{{ title }}</h2>
      <RsButton
        v-if="code"
        class="demo-block__toggle"
        size="sm"
        variant="ghost"
        :icon="showCode ? 'eye-off' : 'code-2'"
        @click="showCode = !showCode"
      >
        {{ showCode ? t('playground.demo.hideCode') : t('playground.demo.showCode') }}
      </RsButton>
    </header>

    <div class="demo-block__panel">
      <slot />
    </div>

    <div v-if="code && showCode" class="demo-block__code">
      <RsCodeBlock :code="code" :lang="codeLang" />
    </div>
  </section>
</template>

<style scoped>
.demo-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  margin-bottom: var(--rs-space-sm);
  min-height: 1.75rem;
}

.demo-block__title {
  margin: 0;
  padding-inline: var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  font-weight: 600;
  line-height: var(--rs-line-height-normal);
  letter-spacing: 0.02em;
  color: var(--rs-muted);
}

.demo-block__toggle {
  flex-shrink: 0;
}

.demo-block__panel {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
  padding: var(--rs-space-lg);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

:global([data-rs-theme='dark']) .demo-block__panel {
  background: var(--rs-surface-elevated);
  border-color: var(--rs-border-subtle);
}

.demo-block__code {
  margin-top: var(--rs-space-sm);
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  overflow: hidden;
}

.demo-block__code :deep(.rs-code-block) {
  border: 0;
  border-radius: 0;
}
</style>
