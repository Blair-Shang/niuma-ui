<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRsConfig } from 'niuma-ui'
import { getPlaygroundRoute } from '../routes'

export interface DemoApiRow {
  name: string
  type: string
  default?: string
  description: string
}

const props = defineProps<{
  title: string
  /** 组件简介；缺省时从 routes 元数据读取 */
  description?: string
  testFile?: string
  /** Props / 事件 / Slots 简表 */
  api?: DemoApiRow[]
}>()

const route = useRoute()
const { t } = useRsConfig()

const meta = computed(() => getPlaygroundRoute(route.path))

const resolvedDescription = computed(() => props.description || meta.value?.description || '')
const resolvedTestFile = computed(() => {
  if (props.testFile !== undefined) return props.testFile
  return meta.value?.testFile || ''
})
const hasApi = computed(() => (props.api?.length ?? 0) > 0)
</script>

<template>
  <article class="demo-page">
    <header class="demo-page__header">
      <h1 class="demo-page__title">{{ title }}</h1>
      <p v-if="resolvedDescription" class="demo-page__desc">{{ resolvedDescription }}</p>
      <p v-if="resolvedTestFile && resolvedTestFile !== '—'" class="demo-page__meta">
        {{ t('playground.demo.testFile') }}：
        <code>src/__tests__/{{ resolvedTestFile }}</code>
      </p>
    </header>

    <div class="demo-page__body">
      <slot />
    </div>

    <section v-if="hasApi" class="demo-page__api" aria-labelledby="demo-api-heading">
      <h2 id="demo-api-heading" class="demo-page__api-title">
        {{ t('playground.demo.api') }}
      </h2>
      <div class="demo-page__api-wrap">
        <table class="demo-page__api-table">
          <thead>
            <tr>
              <th>{{ t('playground.demo.api.name') }}</th>
              <th>{{ t('playground.demo.api.type') }}</th>
              <th>{{ t('playground.demo.api.default') }}</th>
              <th>{{ t('playground.demo.api.desc') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in api" :key="row.name">
              <td><code>{{ row.name }}</code></td>
              <td><code>{{ row.type }}</code></td>
              <td>
                <code v-if="row.default">{{ row.default }}</code>
                <span v-else class="demo-page__muted">—</span>
              </td>
              <td>{{ row.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>

<style scoped>
.demo-page__header {
  margin-bottom: var(--rs-space-xl);
}

.demo-page__title {
  margin: 0 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-lg);
  font-weight: 600;
  line-height: var(--rs-line-height-tight);
  letter-spacing: -0.01em;
  color: var(--rs-text);
}

.demo-page__desc {
  margin: 0 0 var(--rs-space-sm);
  max-width: 48rem;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-muted);
}

.demo-page__meta {
  margin: 0;
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-normal);
  color: var(--rs-placeholder);
}

.demo-page__meta code {
  color: var(--rs-primary);
  font-size: var(--rs-font-size-xs);
}

.demo-page__body {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-xl);
}

.demo-page__api {
  margin-top: var(--rs-space-2xl, 2.5rem);
  padding-top: var(--rs-space-xl);
  border-top: 1px solid var(--rs-border-subtle);
}

.demo-page__api-title {
  margin: 0 0 var(--rs-space-md);
  font-size: var(--rs-font-size-base);
  font-weight: 600;
  color: var(--rs-text);
}

.demo-page__api-wrap {
  overflow-x: auto;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

:global([data-rs-theme='dark']) .demo-page__api-wrap {
  background: var(--rs-surface-elevated);
}

.demo-page__api-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--rs-font-size-sm);
}

.demo-page__api-table th,
.demo-page__api-table td {
  padding: var(--rs-space-sm) var(--rs-space-md);
  border-bottom: 1px solid var(--rs-border-subtle);
  text-align: left;
  vertical-align: top;
}

.demo-page__api-table th {
  font-weight: 600;
  color: var(--rs-muted);
  white-space: nowrap;
}

.demo-page__api-table tbody tr:last-child td {
  border-bottom: 0;
}

.demo-page__api-table code {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-primary);
  word-break: break-word;
}

.demo-page__muted {
  color: var(--rs-placeholder);
}
</style>
