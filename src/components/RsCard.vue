<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { RsRadius } from '../theme/types'
import { Primitive } from './reka'
import { rsRadiusCss } from './resolve-radius'

/**
 * 卡片表面风格。
 * - grouped / plain / glass：偏 macOS 分层与仪表盘
 * - outlined / filled：偏 Material 3，后台信息面板常用 outlined
 */
export type RsCardVariant = 'grouped' | 'plain' | 'outlined' | 'filled' | 'glass'

/**
 * 卡片密度（疏密），映射 header/body padding 与标题字号。
 * 与控件 `RsComponentSize`（高度）无关，勿混用。
 */
export type RsCardSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    as?: string
    title?: string
    description?: string
    /** body 是否使用密度对应的内边距；false 时贴边，适合表格/图表 */
    padding?: boolean
    elevated?: boolean
    /**
     * 无外框：去掉边框、阴影与标题底部分隔，背景透明。
     * 适合嵌在页面内容区、业务无需 :deep 清边框的场景。
     */
    borderless?: boolean
    /** grouped=mac 分组；plain=KPI；outlined/filled=MD3；glass=毛玻璃 */
    variant?: RsCardVariant
    /**
     * 密度：sm 后台紧凑 / md 默认（后台面板） / lg 前台宽松。
     * @default md
     */
    size?: RsCardSize
    /**
     * 圆角档位。卡片表面独立于 ConfigProvider.controlRadius，
     * 避免表单全局 sm 圆角把面板一并压扁。
     * @default md
     */
    radius?: RsRadius
    /** hover 时轻微抬升阴影，适合可点击/可选中卡片 */
    hoverable?: boolean
    /**
     * 裁切溢出（封面圆角、内部绝对定位）。
     * 默认 false，避免表格/下拉被 overflow:hidden 裁切。
     */
    clip?: boolean
    /** 占满父级高度，body 纵向伸展；适合后台 Pane 内嵌 */
    fill?: boolean
  }>(),
  {
    as: 'section',
    padding: true,
    elevated: false,
    borderless: false,
    variant: 'grouped',
    size: 'md',
    hoverable: false,
    clip: false,
    fill: false,
  },
)

const slots = useSlots()
const hasHeader = computed(() =>
  Boolean(props.title || props.description || slots.header || slots.actions),
)
const hasFooter = computed(() => Boolean(slots.footer))
/** 卡片圆角只认 props，不跟 controlRadius 走 */
const resolvedRadius = computed(() => props.radius ?? 'md')
const rootStyle = computed(() => ({
  '--rs-card-radius': rsRadiusCss(resolvedRadius.value),
}))
</script>

<template>
  <Primitive
    :as="as"
    class="rs-card"
    :class="[
      `rs-card--${variant}`,
      `rs-card--${size}`,
      {
        'rs-card--elevated': elevated,
        'rs-card--borderless': borderless,
        'rs-card--hoverable': hoverable,
        'rs-card--clip': clip,
        'rs-card--fill': fill,
      },
    ]"
    :style="rootStyle"
  >
    <div v-if="$slots.cover" class="rs-card__cover">
      <slot name="cover" />
    </div>
    <header v-if="hasHeader" class="rs-card__header">
      <div class="rs-card__heading">
        <slot name="header">
          <h3 v-if="title" class="rs-card__title">{{ title }}</h3>
          <p v-if="description" class="rs-card__description">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="rs-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="rs-card__body" :class="{ 'rs-card__body--padded': padding }">
      <slot />
    </div>
    <footer v-if="hasFooter" class="rs-card__footer">
      <slot name="footer" />
    </footer>
  </Primitive>
</template>

<style>
.rs-card {
  --rs-card-header-padding-y: 0.75rem;
  --rs-card-header-padding-x: 1rem;
  --rs-card-body-padding: 1rem;
  --rs-card-footer-padding-y: 0.625rem;
  --rs-card-footer-padding-x: 1rem;
  --rs-card-title-size: var(--rs-font-size-sm);
  --rs-card-desc-size: var(--rs-font-size-xs);

  position: relative;
  overflow: visible;
  border-radius: var(--rs-card-radius, var(--rs-radius));
  border: 1px solid var(--rs-card-border);
  background: var(--rs-card-body-bg);
  box-shadow: var(--rs-card-shadow);
  isolation: isolate;
}

.rs-card--sm {
  --rs-card-header-padding-y: 0.5rem;
  --rs-card-header-padding-x: 0.75rem;
  --rs-card-body-padding: 0.75rem;
  --rs-card-footer-padding-y: 0.5rem;
  --rs-card-footer-padding-x: 0.75rem;
  --rs-card-title-size: var(--rs-font-size-xs);
}

.rs-card--md {
  --rs-card-header-padding-y: 0.75rem;
  --rs-card-header-padding-x: 1rem;
  --rs-card-body-padding: 1rem;
  --rs-card-footer-padding-y: 0.625rem;
  --rs-card-footer-padding-x: 1rem;
  --rs-card-title-size: var(--rs-font-size-sm);
}

.rs-card--lg {
  --rs-card-header-padding-y: 1rem;
  --rs-card-header-padding-x: 1.25rem;
  --rs-card-body-padding: 1.25rem;
  --rs-card-footer-padding-y: 0.75rem;
  --rs-card-footer-padding-x: 1.25rem;
  --rs-card-title-size: var(--rs-font-size-base);
}

.rs-card--clip {
  overflow: hidden;
}

.rs-card--fill {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.rs-card--fill .rs-card__body {
  flex: 1 1 auto;
  min-height: 0;
}

.rs-card--hoverable {
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  cursor: default;
}

.rs-card--hoverable:hover {
  box-shadow: var(--rs-card-shadow-elevated);
}

/* ── grouped：macOS 系统设置分组面板（header 微分层 + inset 高光）── */
/* overflow:hidden 必须：header 实色与 backdrop-filter 才能贴合圆角，否则弧边溢出成直角 */
.rs-card--grouped {
  overflow: hidden;
}
[data-rs-theme='light'] .rs-card--grouped {
  background: color-mix(in srgb, var(--rs-card-body-bg) 94%, transparent);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}
.rs-card--grouped .rs-card__header {
  background: var(--rs-card-header-bg);
  border-bottom: 1px solid var(--rs-card-separator);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}
[data-rs-theme='light'] .rs-card--grouped .rs-card__header {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.75);
}
.rs-card--grouped .rs-card__body {
  background: var(--rs-card-body-bg);
}
[data-rs-theme='light'] .rs-card--grouped .rs-card__body {
  background: transparent;
}
.rs-card--grouped.rs-card--elevated {
  box-shadow: var(--rs-card-shadow-elevated);
}

/* ── plain：macOS 小组件 / 仪表盘（单表面、弱分隔）── */
.rs-card--plain {
  border-color: var(--rs-card-separator);
  box-shadow: none;
}
.rs-card--plain .rs-card__header {
  background: transparent;
  border-bottom: 1px solid var(--rs-card-separator);
  box-shadow: none;
}
.rs-card--plain .rs-card__title {
  font-size: var(--rs-font-size-xs);
  font-weight: var(--rs-font-weight-medium);
  color: var(--rs-card-description-fg);
  letter-spacing: 0;
}
.rs-card--plain .rs-card__body {
  background: transparent;
}
.rs-card--plain.rs-card--elevated {
  box-shadow: var(--rs-card-shadow-elevated);
}

/* ── outlined：Material 3 Outlined Card（描边、无 header 底色）── */
.rs-card--outlined {
  border: 1px solid var(--rs-card-border);
  box-shadow: none;
  background: var(--rs-card-body-bg);
}
.rs-card--outlined .rs-card__header {
  background: transparent;
  border-bottom: 1px solid var(--rs-card-separator);
  box-shadow: none;
}
.rs-card--outlined .rs-card__title {
  font-weight: var(--rs-font-weight-medium);
  letter-spacing: 0;
}
.rs-card--outlined .rs-card__body {
  background: transparent;
}
.rs-card--outlined.rs-card--elevated {
  box-shadow: var(--rs-card-filled-elevated-shadow);
}

/* ── filled：Material 3 Filled Card（色调填充、无边框）── */
.rs-card--filled {
  border-color: transparent;
  background: var(--rs-card-filled-bg);
  box-shadow: none;
}
.rs-card--filled .rs-card__header {
  background: transparent;
  border-bottom: 1px solid var(--rs-card-separator);
  box-shadow: none;
}
.rs-card--filled .rs-card__title {
  font-weight: var(--rs-font-weight-medium);
  letter-spacing: 0;
}
.rs-card--filled .rs-card__body {
  background: transparent;
}
.rs-card--filled.rs-card--elevated {
  box-shadow: var(--rs-card-filled-elevated-shadow);
}

/* ── glass：macOS Vibrancy 毛玻璃（强模糊 + 半透明）── */
/* 同 grouped：毛玻璃与 header 分层依赖 overflow 裁切圆角 */
.rs-card--glass {
  overflow: hidden;
  border-color: var(--rs-card-glass-border);
  background: var(--rs-card-glass-bg);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  box-shadow:
    0 0 0 0.5px rgb(255 255 255 / 0.12),
    0 8px 24px rgb(0 0 0 / 0.12);
}
[data-rs-theme='light'] .rs-card--glass {
  box-shadow:
    0 0 0 0.5px rgb(255 255 255 / 0.6),
    0 8px 24px rgb(0 0 0 / 0.08);
}
.rs-card--glass .rs-card__header {
  background: rgb(255 255 255 / 0.04);
  border-bottom: 1px solid var(--rs-card-glass-border);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}
[data-rs-theme='light'] .rs-card--glass .rs-card__header {
  background: rgb(255 255 255 / 0.35);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.8);
}
.rs-card--glass .rs-card__body {
  background: transparent;
}
.rs-card--glass.rs-card--elevated {
  box-shadow:
    0 0 0 0.5px rgb(255 255 255 / 0.14),
    0 12px 32px rgb(0 0 0 / 0.18);
}

/* ── borderless：无外框（对齐 RsTabs borderless，业务无需 :deep）── */
.rs-card--borderless {
  border: none;
  box-shadow: none;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.rs-card--borderless .rs-card__header {
  background: transparent;
  border-bottom: none;
  box-shadow: none;
}
.rs-card--borderless .rs-card__body {
  background: transparent;
}
.rs-card--borderless .rs-card__footer {
  border-top: none;
}
.rs-card--borderless.rs-card--elevated {
  box-shadow: var(--rs-card-shadow-elevated);
}

/* ── 公共结构 ── */
/* 首尾区块跟卡片圆角对齐，避免 overflow:visible 时直角底色顶出弧边 */
.rs-card__cover:first-child,
.rs-card__header:first-child {
  border-top-left-radius: var(--rs-card-radius, var(--rs-radius));
  border-top-right-radius: var(--rs-card-radius, var(--rs-radius));
}

.rs-card__footer:last-child,
.rs-card__body:last-child {
  border-bottom-left-radius: var(--rs-card-radius, var(--rs-radius));
  border-bottom-right-radius: var(--rs-card-radius, var(--rs-radius));
}

.rs-card__cover {
  flex-shrink: 0;
  line-height: 0;
}

.rs-card__cover > * {
  display: block;
  width: 100%;
}

.rs-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--rs-space-md);
  flex-shrink: 0;
  padding: var(--rs-card-header-padding-y) var(--rs-card-header-padding-x);
}

.rs-card__heading {
  min-width: 0;
}

.rs-card__title {
  margin: 0;
  font-size: var(--rs-card-title-size);
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: -0.01em;
  color: var(--rs-card-title-fg);
}

.rs-card__description {
  margin: 0.2rem 0 0;
  font-size: var(--rs-card-desc-size);
  color: var(--rs-card-description-fg);
  line-height: var(--rs-line-height-normal);
}

.rs-card__actions {
  display: flex;
  align-items: center;
  gap: var(--rs-space-xs);
  flex-shrink: 0;
}

.rs-card__body--padded {
  padding: var(--rs-card-body-padding);
}

.rs-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  flex-shrink: 0;
  padding: var(--rs-card-footer-padding-y) var(--rs-card-footer-padding-x);
  border-top: 1px solid var(--rs-card-separator);
}
</style>
