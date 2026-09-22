<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { createRsConfigState, provideRsConfig } from '../../../composables/useRsConfig'
import { applyLocale } from '../../../locale/apply'
import { resolveHostLocale } from '../../../locale/resolve-host'
import { type RsDirMode, type RsLocale } from '../../../locale/types'
import { applyTheme, subscribePreferredColorScheme } from '../../../theme/apply'
import type { RsComponentSize, RsRadius, RsThemeMode } from '../../../theme/types'

defineOptions({ name: 'RsConfigProvider' })

const props = withDefaults(
  defineProps<{
    theme?: RsThemeMode
    locale?: RsLocale
    /** auto：跟 locale（ar / he 等为 rtl）；也可强制 ltr / rtl */
    dir?: RsDirMode
    /** 全局默认控件尺寸：ssm 极小 / sm 小号 / md 中号 / lg 大号 */
    controlSize?: RsComponentSize
    /**
     * 全局默认圆角：none 直角 / xs~lg / full。
     * 未传时各组件保留自身默认；传入后覆盖未显式指定 radius 的控件。
     */
    controlRadius?: RsRadius
    /**
     * global：主题与 dir 写到 document（默认，Portal 弹出层同步）
     * local：写到 Provider 根节点
     */
    themeScope?: 'global' | 'local'
  }>(),
  {
    theme: 'light',
    dir: 'auto',
    controlSize: 'md',
    themeScope: 'global',
  },
)

const rootEl = ref<HTMLElement | null>(null)
const config = createRsConfigState(
  props.theme,
  props.locale ?? resolveHostLocale(),
  props.controlSize,
  props.controlRadius,
  props.dir,
)
provideRsConfig(config)

let stopPreferred: (() => void) | undefined

function chromeTarget(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined
  if (props.themeScope === 'local' && rootEl.value) {
    return rootEl.value
  }
  return document.documentElement
}

function syncTheme() {
  const el = chromeTarget()
  if (!el) return
  applyTheme(config.theme.value, el)
  config.syncResolvedTheme()
}

function syncLocale() {
  const el = chromeTarget()
  if (!el) return
  applyLocale(config.locale.value, config.dir.value, el)
}

function bindPreferredListener(mode: RsThemeMode) {
  stopPreferred?.()
  stopPreferred = undefined
  if (mode !== 'system') return
  stopPreferred = subscribePreferredColorScheme(syncTheme)
}

watch(
  () => props.theme,
  (value) => {
    if (value !== config.theme.value) config.setTheme(value)
  },
)
watch(
  () => props.locale,
  (value) => {
    if (value != null && value !== config.locale.value) config.setLocale(value)
  },
)
watch(
  () => props.dir,
  (value) => {
    if (value !== config.dir.value) config.setDir(value)
  },
)
watch(
  () => props.controlSize,
  (value) => {
    if (value && value !== config.controlSize.value) config.setControlSize(value)
  },
)
watch(
  () => props.controlRadius,
  (value) => {
    if (value !== config.controlRadius.value) config.setControlRadius(value)
  },
)
watch(
  () => config.theme.value,
  (mode) => {
    syncTheme()
    bindPreferredListener(mode)
  },
  { immediate: true },
)
watch([() => config.locale.value, () => config.dir.value], syncLocale, { immediate: true })
watch(() => props.themeScope, () => {
  syncTheme()
  syncLocale()
})
watch(rootEl, () => {
  if (props.themeScope === 'local') {
    syncTheme()
    syncLocale()
  }
})

onBeforeUnmount(() => {
  stopPreferred?.()
})
</script>

<template>
  <div ref="rootEl" class="rs-config-provider">
    <slot />
  </div>
</template>

<style scoped>
.rs-config-provider {
  color: var(--rs-text-primary);
  background: var(--rs-bg);
  height: 100%;
  min-height: 0;
}
</style>
