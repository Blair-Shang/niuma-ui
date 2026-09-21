<script setup lang="ts">
import { computed } from 'vue'
import { useRsConfig } from 'niuma-ui'
import { siteText, type SiteLocale } from '../i18n'
import type { TokenRow } from '../catalog/types'

const props = defineProps<{
  rows: TokenRow[]
}>()

const { locale } = useRsConfig()
const copy = computed(() => siteText(locale.value as SiteLocale).doc)
</script>

<template>
  <div v-if="rows.length" class="token-table">
    <div class="token-table__wrap">
      <table>
        <thead>
          <tr>
            <th>{{ copy.tokenName }}</th>
            <th>{{ copy.desc }}</th>
            <th>{{ copy.tokenDefault }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in props.rows" :key="row.name">
            <td><code>{{ row.name }}</code></td>
            <td>{{ row.description }}</td>
            <td><code>{{ row.default }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.token-table__wrap {
  overflow-x: auto;
  border: 1px solid var(--rs-border-subtle);
  border-radius: var(--rs-radius);
  background: var(--rs-surface);
}

:global([data-rs-theme='dark']) .token-table__wrap {
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
</style>
