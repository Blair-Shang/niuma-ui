<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { applyColorTheme, clearColorTheme, RsButton, RsInput, type RsColorTheme } from 'niuma-ui'
import { useSiteI18n } from '../composables/use-site-i18n'

const { pair } = useSiteI18n()

const ink: RsColorTheme = {
  id: 'example.ink',
  label: 'Ink',
  uiTheme: 'dark',
  colors: {
    primary: '#c45c26',
    primaryHover: '#e07a3d',
    primaryForeground: '#fff8f0',
    bg: '#1c1412',
    surface: '#2a211c',
    surfaceElevated: '#3a2e28',
    text: '#f3e6d8',
    muted: '#c4b2a4',
    border: '#6b5348',
    inputBg: '#241c18',
    inputBorder: '#8a6a58',
    danger: '#e15a4a',
  },
}

const paper: RsColorTheme = {
  id: 'example.paper',
  label: 'Paper',
  uiTheme: 'light',
  colors: {
    primary: '#1d4e89',
    primaryHover: '#163e6e',
    primaryForeground: '#f7f4ee',
    bg: '#f4efe6',
    surface: '#fffaf3',
    surfaceElevated: '#fffaf3',
    text: '#2c2416',
    muted: '#6b5e4e',
    border: '#c4b6a4',
    inputBg: '#fffaf3',
    inputBorder: '#b7a894',
    danger: '#a33b32',
  },
}

const stage = ref<HTMLElement | null>(null)
const appearance = ref<'light' | 'dark' | undefined>(undefined)
const active = ref<'builtin' | 'ink' | 'paper'>('builtin')
const name = ref('north-1')

const shown = {
  builtin: { id: '—', uiTheme: '—' },
  ink: { id: ink.id, uiTheme: ink.uiTheme },
  paper: { id: paper.id, uiTheme: paper.uiTheme },
}

function select(next: 'builtin' | 'ink' | 'paper') {
  const el = stage.value
  if (!el) return
  active.value = next
  if (next === 'builtin') {
    appearance.value = undefined
    el.removeAttribute('data-rs-theme')
    clearColorTheme(el)
    return
  }
  const theme = next === 'ink' ? ink : paper
  appearance.value = theme.uiTheme
  el.setAttribute('data-rs-theme', theme.uiTheme)
  applyColorTheme(theme, el)
}

onBeforeUnmount(() => {
  const el = stage.value
  if (!el) return
  el.removeAttribute('data-rs-theme')
  clearColorTheme(el)
})
</script>

<template>
  <div class="theme-demo">
    <div class="theme-demo__picks" role="group" :aria-label="pair('颜色主题', 'Color theme')">
      <RsButton size="sm" :variant="active === 'builtin' ? 'primary' : 'default'" @click="select('builtin')">
        {{ pair('内置', 'Built-in') }}
      </RsButton>
      <RsButton size="sm" :variant="active === 'ink' ? 'primary' : 'default'" @click="select('ink')">
        Ink
      </RsButton>
      <RsButton size="sm" :variant="active === 'paper' ? 'primary' : 'default'" @click="select('paper')">
        Paper
      </RsButton>
    </div>
    <div ref="stage" class="theme-stage" :data-rs-theme="appearance">
      <div class="theme-stage__meta">
        <span>{{ shown[active].id }}</span>
        <span>{{ shown[active].uiTheme }}</span>
      </div>
      <div class="theme-stage__card">
        <label class="theme-stage__label" for="theme-demo-name">{{ pair('连接名', 'Connection') }}</label>
        <RsInput id="theme-demo-name" v-model="name" size="sm" />
        <p class="theme-stage__hint">{{ pair('次要文字用 muted。', 'Secondary copy uses muted.') }}</p>
        <div class="theme-stage__actions">
          <RsButton variant="primary" size="sm">{{ pair('保存', 'Save') }}</RsButton>
          <RsButton variant="default" size="sm" bordered>{{ pair('取消', 'Cancel') }}</RsButton>
          <RsButton variant="default" size="sm" tone="danger">{{ pair('删除', 'Delete') }}</RsButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-demo {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
  margin-bottom: var(--rs-space-md);
}

.theme-demo__picks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
}

.theme-stage {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-md);
  padding: var(--rs-space-lg);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius);
  background: var(--rs-bg);
  color: var(--rs-text-primary);
}

.theme-stage__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  font-family: var(--rs-font-mono);
  font-size: var(--rs-font-size-xs);
  color: var(--rs-text-secondary);
}

.theme-stage__card {
  display: flex;
  flex-direction: column;
  gap: var(--rs-space-sm);
  max-width: 22rem;
  padding: var(--rs-space-md);
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
}

.theme-stage__label {
  font-size: var(--rs-font-size-sm);
  font-weight: var(--rs-font-weight-medium);
}

.theme-stage__hint {
  margin: 0;
  color: var(--rs-text-secondary);
  font-size: var(--rs-font-size-sm);
}

.theme-stage__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
}
</style>
