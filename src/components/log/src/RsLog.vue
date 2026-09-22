<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, useSlots, watch } from 'vue'
import type { RsRadius } from '../../../theme/types'
import { useRsI18n } from '../../../composables/useRsI18n'
import { copyTextToClipboard } from '../../../utils/rs-clipboard'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import RsButton from '../../button/src/RsButton.vue'
import RsEmpty from '../../empty/src/RsEmpty.vue'
import RsInput from '../../input/src/RsInput.vue'
import RsVirtualList from '../../virtual-list/src/RsVirtualList.vue'
import RsLogRow from './RsLogRow.vue'
import {
  asLogLineInputs,
  clampLogCount,
  countDroppedLines,
  filterLogLines,
  normalizeLogLines,
  resolveLogCopyText,
  resolveLogLive,
  RS_LOG_FILTER_LEVELS,
  RS_LOG_LEVELS,
  splitLogText,
  toLogLineInput,
  type RsLogCopySource,
  type RsLogInferMarkers,
  type RsLogLevel,
  type RsLogLine,
  type RsLogLineInput,
  type RsLogSeverityScale,
  type RsNormalizedLogLine,
} from './log-utils'

export type { RsLogLevel, RsLogLine, RsLogLineInput, RsNormalizedLogLine }

export interface RsLogExpose {
  append: (input: string | RsLogLineInput | RsLogLineInput[]) => void
  clear: () => void
  scrollToBottom: () => void
  scrollToTop: () => void
  copy: () => Promise<boolean>
  copyAll: () => Promise<boolean>
  getLines: () => RsNormalizedLogLine[]
  getVisibleLines: () => RsNormalizedLogLine[]
  focus: () => void
  focusSearch: () => void
}

export type RsLogLive = boolean | 'off' | 'polite' | 'assertive'

defineOptions({ name: 'RsLog' })

const emit = defineEmits<{
  followChange: [following: boolean]
  overflow: [payload: { dropped: number; kept: number }]
  copy: [payload: { text: string; source: RsLogCopySource }]
}>()

const { t, locale } = useRsI18n()
const slots = useSlots()
const matchId = useId()

const lines = defineModel<string | RsLogLineInput[]>('lines', { default: '' })
const search = defineModel<string>('search', { default: '' })
const filterLevels = defineModel<RsLogLevel[]>('levels', { default: () => [] })

const props = withDefaults(
  defineProps<{
    text?: string
    height?: number | string
    itemSize?: number
    overscan?: number
    follow?: boolean
    wrap?: boolean
    showTime?: boolean
    showLevel?: boolean
    inferLevel?: boolean
    /** 未写 level 时，在内置扫描之后匹配这些成功 / 失败标识。 */
    inferMarkers?: RsLogInferMarkers
    maxLines?: number
    zebra?: boolean
    emptyText?: string
    radius?: RsRadius
    ariaLabel?: string
    /** 默认 off：虚拟回收不要当 live region 播报。true 视为 polite。 */
    live?: RsLogLive
    busy?: boolean
    showSearch?: boolean
    showCopy?: boolean
    showFilter?: boolean
    showLineNo?: boolean
    /** auto：折行关虚拟，单行开虚拟。折行没有变高虚拟。 */
    virtual?: boolean | 'auto'
    dir?: 'ltr' | 'rtl' | 'auto'
    severityScale?: RsLogSeverityScale
    timeFormat?: Intl.DateTimeFormatOptions
    id?: string
  }>(),
  {
    height: 280,
    itemSize: 0,
    overscan: 8,
    follow: true,
    wrap: false,
    showTime: false,
    showLevel: true,
    inferLevel: true,
    zebra: true,
    live: 'off',
    busy: false,
    showSearch: true,
    showCopy: true,
    showFilter: false,
    showLineNo: false,
    dir: 'ltr',
    severityScale: 'auto',
    virtual: 'auto',
  },
)

const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)
const plainRef = ref<HTMLElement | null>(null)
const copied = ref(false)
let copiedTimer = 0
const listRef = ref<{ scrollToIndex: (index: number, align?: 'nearest' | 'center' | 'start' | 'end') => void } | null>(
  null,
)
const stuckToBottom = ref(true)
const followAnchor = ref<number | null>(null)
const activeIndex = ref(-1)
const announcement = ref('')
let announceTick = 0
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')

const liveMode = computed(() => resolveLogLive(props.live))
const useVirtual = computed(() => {
  if (props.virtual === 'auto') return !props.wrap
  return props.virtual
})

const resolvedItemSize = computed(() => {
  if (props.itemSize > 0) return props.itemSize
  if (props.wrap) return 48
  return 24
})

const source = computed(() => {
  if (lines.value !== '' && lines.value != null) return lines.value
  return props.text ?? ''
})

const rawCount = computed(() => {
  const src = source.value
  return typeof src === 'string' ? splitLogText(src).length : src.length
})

const resolvedLines = computed(() =>
  normalizeLogLines(source.value, {
    inferLevel: props.inferLevel,
    inferMarkers: props.inferMarkers,
    maxLines: props.maxLines,
    severityScale: props.severityScale,
    locale: locale.value,
    timeFormat: props.timeFormat,
  }),
)

const levelNames = computed(() => {
  const names = new Map<RsLogLevel, string>()
  for (const level of RS_LOG_LEVELS) names.set(level, t(`log.level.${level}`, level))
  return names
})

const displayLines = computed(() =>
  filterLogLines(resolvedLines.value, {
    levels: filterLevels.value,
    search: search.value,
    locale: locale.value,
    levelText: (level) => levelNames.value.get(level) ?? level,
  }),
)

const emptyLabel = computed(() => props.emptyText || t('log.empty', 'No log output'))
const regionLabel = computed(() => props.ariaLabel || t('log.label', 'Log'))
const hasChrome = computed(
  () => props.showSearch || props.showCopy || props.showFilter || Boolean(slots.toolbar),
)
const copyFailed = ref(false)
const copyTip = computed(() => {
  if (copied.value) return t('log.copied', 'Copied')
  if (copyFailed.value) return t('log.copyFailed', 'Copy failed')
  return t('log.copy', 'Copy')
})

const rootStyle = computed(() => ({
  '--rs-log-radius': rsRadiusCss(resolvedRadius.value),
  '--rs-log-box-height': typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

function levelLabel(level: RsLogLevel): string {
  return levelNames.value.get(level) ?? level
}

function logItemKey(item: RsNormalizedLogLine): string {
  return item.key
}

function writeLines(next: string | RsLogLineInput[]): void {
  lines.value = typeof next === 'string' ? next : clampLogCount(next, props.maxLines)
}

function append(input: string | RsLogLineInput | RsLogLineInput[]): void {
  const added = asLogLineInputs(input).map(toLogLineInput)
  if (added.length === 0) return
  const current = lines.value
  if (typeof current === 'string' || current == null) {
    const chunk = added.map((item) => (typeof item === 'string' ? item : item.text)).join('\n')
    const base = typeof current === 'string' ? current : ''
    const merged = base ? `${base}\n${chunk}` : chunk
    const parts = splitLogText(merged)
    const kept =
      props.maxLines != null && props.maxLines > 0 && parts.length > props.maxLines
        ? parts.slice(parts.length - props.maxLines)
        : parts
    writeLines(kept.join('\n'))
    return
  }
  writeLines([...current, ...added])
}

function clear(): void {
  writeLines(typeof lines.value === 'string' ? '' : [])
  activeIndex.value = -1
}

function scrollPlain(top: number): void {
  const el = plainRef.value
  if (!el) return
  el.scrollTop = top
}

function scrollToBottom(): void {
  setStuck(true)
  const last = displayLines.value.length - 1
  if (last < 0) return
  activeIndex.value = last
  if (useVirtual.value) {
    listRef.value?.scrollToIndex(last, 'end')
    return
  }
  void nextTick(() => {
    const el = plainRef.value
    if (el) scrollPlain(el.scrollHeight)
  })
}

function scrollToTop(): void {
  setStuck(false)
  activeIndex.value = displayLines.value.length > 0 ? 0 : -1
  if (useVirtual.value) {
    listRef.value?.scrollToIndex(0, 'start')
    return
  }
  scrollPlain(0)
}

function readDomSelection(): string {
  const sel = typeof document === 'undefined' ? null : document.getSelection()
  if (!sel || sel.isCollapsed) return ''
  const text = sel.toString()
  if (!text.trim()) return ''
  const root = rootRef.value
  const node = sel.anchorNode
  if (root && node && !root.contains(node)) return ''
  return text
}

let alive = true

function armCopyTimer(delay: number, apply: () => void): void {
  if (!alive) return
  if (copiedTimer) window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copiedTimer = 0
    if (!alive) return
    apply()
  }, delay)
}

function markCopied(): void {
  if (!alive) return
  copied.value = true
  copyFailed.value = false
  armCopyTimer(1500, () => {
    copied.value = false
  })
}

function markCopyFailed(): void {
  if (!alive) return
  copyFailed.value = true
  copied.value = false
  armCopyTimer(2500, () => {
    copyFailed.value = false
  })
}

async function writeCopy(text: string, source: RsLogCopySource): Promise<boolean> {
  if (!text) return false
  const ok = await copyTextToClipboard(text)
  if (ok) {
    markCopied()
    emit('copy', { text, source })
  } else {
    markCopyFailed()
  }
  return ok
}

async function copy(): Promise<boolean> {
  const resolved = resolveLogCopyText({
    selection: readDomSelection(),
    visibleTexts: displayLines.value.map((line) => line.plain),
    allTexts: resolvedLines.value.map((line) => line.plain),
  })
  return writeCopy(resolved.text, resolved.source)
}

async function copyAll(): Promise<boolean> {
  return writeCopy(resolvedLines.value.map((line) => line.plain).join('\n'), 'all')
}

function focusSearch(): void {
  const input = searchRef.value?.querySelector('input')
  input?.focus()
  input?.select()
}

function getLines(): RsNormalizedLogLine[] {
  return resolvedLines.value
}

function getVisibleLines(): RsNormalizedLogLine[] {
  return displayLines.value
}

function focus(): void {
  viewportRef.value?.focus()
}

function setStuck(next: boolean): void {
  if (stuckToBottom.value === next) return
  stuckToBottom.value = next
  followAnchor.value = next ? null : displayLines.value.length
  emit('followChange', next)
}

function hasTextSelectionInside(): boolean {
  const sel = typeof document === 'undefined' ? null : document.getSelection()
  if (!sel || sel.isCollapsed) return false
  const root = rootRef.value
  const node = sel.anchorNode
  return Boolean(root && node && root.contains(node))
}

function onListScroll(event: Event): void {
  const el = event.target
  if (!(el instanceof HTMLElement)) return
  setStuck(el.scrollHeight - el.scrollTop - el.clientHeight < 28)
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function moveActive(delta: number): void {
  const max = displayLines.value.length - 1
  if (max < 0) return
  const current = activeIndex.value
  const next =
    current < 0 ? (delta >= 0 ? 0 : max) : Math.min(max, Math.max(0, current + delta))
  activeIndex.value = next
  setStuck(next >= max)
  if (useVirtual.value) {
    listRef.value?.scrollToIndex(next, 'nearest')
    return
  }
  const row = plainRef.value?.querySelector<HTMLElement>(`[data-log-index="${next}"]`)
  if (typeof row?.scrollIntoView === 'function') {
    row.scrollIntoView({ block: 'nearest' })
  }
}

function isSearchShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'f'
}

function isCopyShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'c'
}

function onRootKeydown(event: KeyboardEvent): void {
  if (isSearchShortcut(event) && props.showSearch) {
    event.preventDefault()
    focusSearch()
    return
  }
  if (isCopyShortcut(event) && !isTypingTarget(event.target)) {
    if (readDomSelection()) return
    event.preventDefault()
    void copy()
  }
}

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
  if (!search.value.trim() || displayLines.value.length === 0) return
  event.preventDefault()
  const max = displayLines.value.length - 1
  const current = activeIndex.value
  const delta = event.shiftKey ? -1 : 1
  const next = current < 0 ? (delta > 0 ? 0 : max) : (current + delta + displayLines.value.length) % displayLines.value.length
  activeIndex.value = next
  setStuck(next >= max)
  if (useVirtual.value) {
    listRef.value?.scrollToIndex(next, 'nearest')
    return
  }
  const row = plainRef.value?.querySelector<HTMLElement>(`[data-log-index="${next}"]`)
  if (typeof row?.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
}

function onViewportKeydown(event: KeyboardEvent): void {
  if (isSearchShortcut(event) || isCopyShortcut(event)) return
  if (isTypingTarget(event.target)) return
  const max = displayLines.value.length - 1
  if (max < 0) return
  const page = 10
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    moveActive(-displayLines.value.length)
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    moveActive(displayLines.value.length)
    return
  }
  if (event.key === 'PageDown') {
    event.preventDefault()
    moveActive(page)
    return
  }
  if (event.key === 'PageUp') {
    event.preventDefault()
    moveActive(-page)
    return
  }
}

function toggleLevel(level: RsLogLevel): void {
  const current = filterLevels.value ?? []
  filterLevels.value = current.includes(level) ? current.filter((item) => item !== level) : [...current, level]
}

function onRowClick(index: number): void {
  activeIndex.value = index
}

watch(
  () => displayLines.value.length,
  async (count, prev) => {
    const delta = count - (prev ?? 0)
    if (liveMode.value !== 'off' && delta > 0) {
      const message = t(
        'log.newLines',
        '{count, plural, one {# new line} other {# new lines}}',
        { count: delta },
      )
      announceTick += 1
      announcement.value = announceTick % 2 === 0 ? `${message}\u200b` : message
    }
    if (!props.follow || delta <= 0 || !stuckToBottom.value) return
    if (hasTextSelectionInside()) {
      setStuck(false)
      return
    }
    await nextTick()
    scrollToBottom()
  },
)

watch(
  () => countDroppedLines(rawCount.value, props.maxLines),
  (dropped, prev) => {
    if (dropped <= (prev ?? 0)) return
    emit('overflow', { dropped, kept: resolvedLines.value.length })
  },
)

const pendingLines = computed(() => {
  if (stuckToBottom.value || followAnchor.value == null) return 0
  return Math.max(0, displayLines.value.length - followAnchor.value)
})
const showJump = computed(() => props.follow && !stuckToBottom.value && displayLines.value.length > 0)
const jumpLabel = computed(() =>
  pendingLines.value > 0
    ? t('log.newLines', '{count, plural, one {# new line} other {# new lines}}', { count: pendingLines.value })
    : t('log.jump', 'Jump to latest'),
)
const matchCount = computed(() => (search.value.trim() ? displayLines.value.length : null))
const matchLabel = computed(() =>
  matchCount.value == null
    ? ''
    : t('log.matchCount', '{count, plural, one {# match} other {# matches}}', { count: matchCount.value }),
)

onUnmounted(() => {
  alive = false
  if (copiedTimer) window.clearTimeout(copiedTimer)
  copiedTimer = 0
})

defineExpose<RsLogExpose>({
  append,
  clear,
  scrollToBottom,
  scrollToTop,
  copy,
  copyAll,
  getLines,
  getVisibleLines,
  focus,
  focusSearch,
})
</script>

<template>
  <div
    ref="rootRef"
    class="rs-log"
    :class="{
      'rs-log--wrap': wrap,
      'rs-log--zebra': zebra,
      'rs-log--chrome': hasChrome,
    }"
    :id="id"
    :style="rootStyle"
    @keydown="onRootKeydown"
  >
    <div v-if="hasChrome" class="rs-log__chrome">
      <slot name="toolbar">
        <div v-if="showSearch" ref="searchRef" class="rs-log__search" @keydown="onSearchKeydown">
          <RsInput
            v-model="search"
            type="search"
            size="sm"
            clearable
            :placeholder="t('log.searchPlaceholder', 'Filter lines…')"
            :aria-label="t('log.search', 'Search logs')"
            :aria-describedby="matchCount != null ? matchId : undefined"
          />
        </div>
        <p v-if="matchCount != null" :id="matchId" class="rs-log__matches" role="status">{{ matchLabel }}</p>
        <fieldset v-if="showFilter" class="rs-log__filters">
          <legend class="rs-log__sr-only">{{ t('log.filter', 'Filter levels') }}</legend>
          <button
            v-for="level in RS_LOG_FILTER_LEVELS"
            :key="level"
            type="button"
            class="rs-log__chip"
            :class="[`rs-log__chip--${level}`, { 'rs-log__chip--on': filterLevels.includes(level) }]"
            :aria-pressed="filterLevels.includes(level)"
            @click="toggleLevel(level)"
          >
            {{ levelLabel(level) }}
          </button>
        </fieldset>
        <RsButton
          v-if="showCopy"
          class="rs-log__copy"
          variant="ghost"
          size="sm"
          icon="copy"
          icon-only
          :aria-label="copyTip"
          :tooltip="copyTip"
          :disabled="displayLines.length === 0"
          @click="void copy()"
        />
      </slot>
    </div>

    <div
      v-if="liveMode !== 'off'"
      class="rs-log__sr-only"
      :aria-live="liveMode"
      aria-atomic="true"
    >
      {{ announcement }}
    </div>

    <div
      ref="viewportRef"
      class="rs-log__viewport"
      role="region"
      tabindex="0"
      :dir="dir"
      :aria-label="regionLabel"
      :aria-busy="busy ? 'true' : undefined"
      @keydown="onViewportKeydown"
    >
      <slot v-if="displayLines.length === 0" name="empty">
        <RsEmpty fill :description="emptyLabel" />
      </slot>
      <RsVirtualList
        v-else-if="useVirtual"
        ref="listRef"
        class="rs-log__list"
        role="list"
        :items="displayLines"
        :item-key="logItemKey"
        :item-size="resolvedItemSize"
        :height="0"
        :overscan="overscan"
        :active-index="activeIndex < 0 ? null : activeIndex"
        radius="none"
        @scroll="onListScroll"
      >
        <template #default="{ item, index }">
          <RsLogRow
            :item="item"
            :index="index"
            :active="index === activeIndex"
            :zebra="zebra"
            :wrap="wrap"
            :fill="!wrap"
            :show-line-no="showLineNo"
            :show-time="showTime"
            :show-level="showLevel"
            :search="search"
            @select="onRowClick(index)"
          >
            <template v-if="slots.row" #default="slotProps">
              <slot name="row" v-bind="slotProps" />
            </template>
          </RsLogRow>
        </template>
      </RsVirtualList>
      <div
        v-else
        ref="plainRef"
        class="rs-log__plain"
        role="list"
        @scroll="onListScroll"
      >
        <RsLogRow
          v-for="(item, index) in displayLines"
          :key="item.key"
          :item="item"
          :index="index"
          :active="index === activeIndex"
          :zebra="zebra"
          :wrap="wrap"
          :fill="false"
          :show-line-no="showLineNo"
          :show-time="showTime"
          :show-level="showLevel"
          :search="search"
          @select="onRowClick(index)"
        >
          <template v-if="slots.row" #default="slotProps">
            <slot name="row" v-bind="slotProps" />
          </template>
        </RsLogRow>
      </div>
      <RsButton
        v-if="showJump"
        class="rs-log__jump"
        size="sm"
        variant="default"
        @click="scrollToBottom"
      >
        {{ jumpLabel }}
      </RsButton>
    </div>
  </div>
</template>

<style scoped>
.rs-log {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--rs-log-border, var(--rs-border));
  border-radius: var(--rs-log-radius, var(--rs-radius-sm));
  background: var(--rs-log-bg, var(--rs-surface));
  color: var(--rs-log-fg, var(--rs-text-primary));
  font-family: var(--rs-log-font-family, var(--rs-font-mono));
  font-size: var(--rs-log-font-size, var(--rs-font-size-xs));
  line-height: var(--rs-log-line-height, 1.45);
  height: var(--rs-log-box-height);
}
.rs-log__chrome {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-sm);
  align-items: center;
  padding-block: var(--rs-space-xs);
  padding-inline: var(--rs-space-sm);
  border-bottom: 1px solid var(--rs-log-border, var(--rs-border));
  background: var(--rs-log-chrome-bg, color-mix(in srgb, var(--rs-log-bg, var(--rs-surface)) 88%, var(--rs-surface-hover)));
}
.rs-log__search {
  min-inline-size: 10rem;
  flex: 1 1 12rem;
}
.rs-log__matches {
  margin: 0;
  color: var(--rs-log-muted, var(--rs-text-secondary));
  font-size: var(--rs-font-size-xs);
  font-variant-numeric: tabular-nums;
}
.rs-log__copy {
  flex-shrink: 0;
  margin-inline-start: auto;
}
.rs-log__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rs-space-xs);
  margin: 0;
  padding: 0;
  border: 0;
  min-inline-size: 0;
}
.rs-log__chip {
  margin: 0;
  padding-block: 0.1rem;
  padding-inline: var(--rs-space-xs);
  border: 1px solid var(--rs-log-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-log-muted, var(--rs-text-secondary));
  font: inherit;
  font-size: var(--rs-font-size-xs);
  cursor: pointer;
}
.rs-log__chip:focus-visible {
  outline: var(--rs-focus-ring-width, 2px) solid var(--rs-focus-border);
  outline-offset: 1px;
}
.rs-log__chip--on {
  color: var(--rs-log-fg, var(--rs-text-primary));
  border-color: var(--rs-log-chip-on-border, color-mix(in srgb, var(--rs-primary) 45%, var(--rs-log-border, var(--rs-border))));
  background: var(--rs-log-chip-on-bg, color-mix(in srgb, var(--rs-primary) 14%, transparent));
}
.rs-log__viewport {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  outline: none;
}
.rs-log__viewport:focus-visible {
  box-shadow: inset 0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-border);
}
.rs-log__list,
.rs-log__plain {
  flex: 1;
  min-height: 0;
  border: 0;
  background: transparent;
}
.rs-log__plain {
  overflow: auto;
}
.rs-log--wrap .rs-log__plain {
  display: block;
}
.rs-log__jump {
  position: absolute;
  inset-inline-end: var(--rs-space-sm);
  inset-block-end: var(--rs-space-sm);
}
.rs-log__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (forced-colors: active) {
  .rs-log {
    background: Canvas;
    color: CanvasText;
    border-color: ButtonText;
  }
  .rs-log__viewport:focus-visible,
  .rs-log__chip:focus-visible {
    outline: var(--rs-focus-ring-width, 2px) solid Highlight;
  }
}
</style>
