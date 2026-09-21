<script setup lang="ts">
import { ref } from 'vue'
import { RsAvatar, RsBadge, RsButton, RsIcon, RsInput, RsSwitch, RsTag } from 'niuma-ui'

const query = ref('')
const notify = ref(true)
const active = ref('jobs')

const nav = [
  { key: 'clusters', icon: 'server', label: 'Clusters' },
  { key: 'jobs', icon: 'workflow', label: 'Jobs' },
  { key: 'logs', icon: 'scroll-text', label: 'Logs' },
] as const

const rows = [
  { name: 'ingest-orders', status: 'Running', tone: 'success' as const, cpu: '32%' },
  { name: 'sync-catalog', status: 'Queued', tone: 'warning' as const, cpu: '—' },
  { name: 'vacuum-edge', status: 'Failed', tone: 'danger' as const, cpu: '8%' },
]
</script>

<template>
  <div class="stage">
    <div class="window">
      <div class="window__chrome">
        <span /><span /><span />
        <em>niuma.workbench</em>
      </div>
      <div class="window__body">
        <aside class="window__nav">
          <button
            v-for="item in nav"
            :key="item.key"
            type="button"
            class="window__nav-item"
            :class="{ 'window__nav-item--on': active === item.key }"
            @click="active = item.key"
          >
            <RsIcon :name="item.icon" :size="14" />
            {{ item.label }}
          </button>
        </aside>
        <div class="window__main">
          <div class="window__meta">
            <RsBadge variant="primary">Live</RsBadge>
            <RsTag variant="success" size="sm">Healthy</RsTag>
            <RsTag variant="warning" size="sm">Quota 82%</RsTag>
            <RsAvatar size="sm" fallback="NM" />
          </div>
          <div class="window__actions">
            <RsButton variant="primary" icon="plus" size="sm">New session</RsButton>
            <RsButton variant="default" size="sm">Reset</RsButton>
            <RsButton variant="ghost" icon="search" icon-only tooltip="Search" />
          </div>
          <RsInput v-model="query" size="sm" clearable placeholder="Search tables, jobs, hosts…">
            <template #prefix>⌘K</template>
          </RsInput>
          <table class="window__table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>CPU</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.name">
                <td><strong>{{ row.name }}</strong></td>
                <td><RsTag :variant="row.tone" size="sm">{{ row.status }}</RsTag></td>
                <td><em>{{ row.cpu }}</em></td>
              </tr>
            </tbody>
          </table>
          <RsSwitch v-model="notify" size="sm">Notifications</RsSwitch>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
}

.stage::before {
  content: '';
  position: absolute;
  inset: 12% -8% -18% 8%;
  border-radius: 50%;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--rs-primary) 28%, transparent), transparent 72%);
  filter: blur(8px);
  pointer-events: none;
}

.window {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--rs-border-subtle) 80%, var(--rs-primary));
  border-radius: 1.15rem;
  background: color-mix(in srgb, var(--rs-surface) 92%, transparent);
  backdrop-filter: blur(16px);
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 46%, transparent) inset,
    0 24px 60px rgb(15 23 42 / 14%),
    0 0 0 1px color-mix(in srgb, var(--rs-primary) 8%, transparent);
}

:global([data-rs-theme='dark']) .window {
  box-shadow:
    0 1px 0 rgb(255 255 255 / 6%) inset,
    0 28px 70px rgb(0 0 0 / 42%);
}

.window__chrome {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.72rem 0.95rem;
  border-bottom: 1px solid var(--rs-border-subtle);
  background: color-mix(in srgb, var(--rs-surface) 70%, var(--rs-bg));
}

.window__chrome span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #ff5f57;
}

.window__chrome span:nth-child(2) {
  background: #febc2e;
}

.window__chrome span:nth-child(3) {
  background: #28c840;
}

.window__chrome em {
  margin-inline-start: 0.45rem;
  color: var(--rs-muted);
  font-size: 0.72rem;
  font-style: normal;
  letter-spacing: 0.02em;
}

.window__body {
  display: grid;
  grid-template-columns: 8.4rem minmax(0, 1fr);
  min-height: 20rem;
}

.window__nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 0.55rem;
  border-inline-end: 1px solid var(--rs-border-subtle);
  background: color-mix(in srgb, var(--rs-bg) 55%, var(--rs-surface));
}

.window__nav-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.42rem 0.55rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--rs-muted);
  font: inherit;
  font-size: 0.75rem;
  text-align: start;
  cursor: pointer;
}

.window__nav-item--on,
.window__nav-item:hover {
  background: color-mix(in srgb, var(--rs-primary) 10%, transparent);
  color: var(--rs-text);
}

.window__main {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.05rem 1.1rem 1.15rem;
}

.window__meta,
.window__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.window__table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border: 1px solid var(--rs-border-subtle);
  border-radius: 0.7rem;
  font-size: 0.75rem;
}

.window__table th,
.window__table td {
  padding: 0.48rem 0.7rem;
  text-align: start;
}

.window__table thead {
  background: color-mix(in srgb, var(--rs-bg) 70%, var(--rs-surface));
  color: var(--rs-muted);
}

.window__table tbody tr + tr td {
  border-top: 1px solid var(--rs-border-subtle);
}

.window__table strong {
  font-weight: 500;
}

.window__table em {
  color: var(--rs-muted);
  font-style: normal;
  font-variant-numeric: tabular-nums;
}

@media (width < 40rem) {
  .window__body {
    grid-template-columns: 1fr;
  }

  .window__nav {
    flex-direction: row;
    border-inline-end: 0;
    border-bottom: 1px solid var(--rs-border-subtle);
  }
}
</style>
