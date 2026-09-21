<script setup lang="ts">
import { computed } from 'vue'
import { useRsConfig } from 'niuma-ui'
import { siteText, type SiteLocale } from '../i18n'
import type { ApiRow } from '../catalog/types'

const props = defineProps<{
  title: string
  rows: ApiRow[]
}>()

const { locale } = useRsConfig()
const copy = computed(() => siteText(locale.value as SiteLocale).doc)
</script>

<template>
  <section v-if="rows.length" class="api-table">
    <h3 class="api-table__title">{{ title }}</h3>
    <div class="api-table__wrap">
      <table>
        <thead>
          <tr>
            <th>{{ copy.name }}</th>
            <th>{{ copy.desc }}</th>
            <th>{{ copy.type }}</th>
            <th>{{ copy.default }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in props.rows" :key="row.name">
            <td><code>{{ row.name }}</code></td>
            <td>{{ row.description }}</td>
            <td><code>{{ row.type }}</code></td>
            <td>
              <code v-if="row.default">{{ row.default }}</code>
              <span v-else class="api-table__muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.api-table + .api-table {
  margin-top: var(--rs-space-xl);
}

.api-table__title {
  margin: 0 0 var(--rs-space-md);
  font-size: var(--rs-font-size-base);
  font-weight: 600;
  color: var(--rs-text);
}

.api-table__wrap {
  overflow-x: auto;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

:global([data-rs-theme='dark']) .api-table__wrap {
  background: var(--rs-surface-elevated);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--rs-font-size-sm);
}

th,
td {
  padding: var(--rs-space-sm) var(--rs-space-md);
  border-bottom: 1px solid var(--rs-border-subtle);
  text-align: left;
  vertical-align: top;
}

th {
  font-weight: 600;
  color: var(--rs-muted);
  white-space: nowrap;
}

tbody tr:last-child td {
  border-bottom: 0;
}

code {
  font-size: var(--rs-font-size-xs);
  color: var(--rs-primary);
  word-break: break-word;
}

.api-table__muted {
  color: var(--rs-placeholder);
}
</style>
