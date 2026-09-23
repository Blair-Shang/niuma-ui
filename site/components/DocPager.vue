<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getDocNeighbors } from '../composables/doc-nav'
import { useSiteI18n } from '../composables/use-site-i18n'

const { chrome, pair } = useSiteI18n()
const route = useRoute()
const copy = computed(() => chrome.value.doc)

const neighbors = computed(() => getDocNeighbors(route.path))

function label(item: { title: string; titleEn: string }) {
  return pair(item.title, item.titleEn)
}
</script>

<template>
  <nav v-if="neighbors.prev || neighbors.next" class="doc-pager" :aria-label="copy.pager">
    <RouterLink v-if="neighbors.prev" :to="neighbors.prev.to" class="doc-pager__link">
      <span>{{ copy.prev }}</span>
      <strong>{{ label(neighbors.prev) }}</strong>
    </RouterLink>
    <span v-else class="doc-pager__gap" />
    <RouterLink
      v-if="neighbors.next"
      :to="neighbors.next.to"
      class="doc-pager__link doc-pager__link--next"
    >
      <span>{{ copy.next }}</span>
      <strong>{{ label(neighbors.next) }}</strong>
    </RouterLink>
  </nav>
</template>

<style scoped>
.doc-pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin-top: 2.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--site-line, var(--rs-border-subtle));
}

.doc-pager__gap {
  display: block;
}

.doc-pager__link {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
  padding: 0.85rem 1rem;
  border: 1px solid var(--site-line, var(--rs-border-subtle));
  border-radius: var(--site-panel-radius, 1.05rem);
  background: var(--site-panel-bg);
  color: inherit;
  text-decoration: none;
}

.doc-pager__link:hover {
  border-color: color-mix(in srgb, var(--rs-primary) 42%, var(--site-line, var(--rs-border-subtle)));
}

.doc-pager__link span {
  color: var(--rs-muted);
  font-size: 0.72rem;
}

.doc-pager__link strong {
  overflow: hidden;
  font-size: 0.92rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-pager__link--next {
  align-items: flex-end;
  text-align: end;
}

@media (width < 40rem) {
  .doc-pager {
    grid-template-columns: 1fr;
  }

  .doc-pager__gap {
    display: none;
  }

  .doc-pager__link--next {
    align-items: flex-start;
    text-align: start;
  }
}
</style>
