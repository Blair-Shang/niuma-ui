<script setup lang="ts">
import { computed } from 'vue'
import type { TokenRow } from '../catalog/types'
import { useSiteI18n } from '../composables/use-site-i18n'

const props = defineProps<{
  rows: TokenRow[]
}>()

const { chrome, pair } = useSiteI18n()
const copy = computed(() => chrome.value.doc)

function rowDesc(row: TokenRow) {
  return pair(row.description, row.descriptionEn)
}
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
            <td>{{ rowDesc(row) }}</td>
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
