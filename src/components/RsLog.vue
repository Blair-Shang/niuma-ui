<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useSlots, watch } from 'vue'
import type { RsRadius } from '../theme/types'
import { useRsI18n } from '../composables/useRsI18n'
import { copyTextToClipboard } from '../utils/rs-clipboard'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'
import RsButton from './RsButton.vue'
import RsEmpty from './RsEmpty.vue'
import RsInput from './RsInput.vue'
import RsVirtualList from './RsVirtualList.vue'
import {
  asLogLineInputs,
  clampLogCount,
  countDroppedLines,
  filterLogLines,
  joinLogLines,
  normalizeLogLines,
  resolveLogCopyText,
  resolveLogLive,
  RS_LOG_FILTER_LEVELS,
  splitLogHighlight,
  splitLogText,
  toLogLineInput,
  type RsLogCopySource,
  type RsLogHighlightPart,
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

const emit = defineEmits<{
  followChange: [following: boolean]
  overflow: [payload: { dropped: number; kept: number }]
  copy: [payload: { text: string; source: RsLogCopySource }]
}>()

const { t, locale } = useRsI18n()
const slots = useSlots()

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
const activeIndex = ref(-1)
const announcement = ref('')
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

const displayLines = computed(() =>
  filterLogLines(resolvedLines.value, {
    levels: filterLevels.value,
    search: search.value,
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
  return t(`log.level.${level}`, level)
}

function rowLabel(item: RsNormalizedLogLine): string {
  const parts = [levelLabel(item.level)]
  if (props.showLineNo) parts.push(t('log.lineNo', 'Line {n}', { n: item.seq }))
  if (item.time) parts.push(item.time)
  parts.push(item.text)
  return parts.filter(Boolean).join(', ')
}

function highlightParts(text: string): RsLogHighlightPart[] {
  return splitLogHighlight(text, search.value)
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
    const normalized = normalizeLogLines(merged, { inferLevel: false, maxLines: props.maxLines })
    writeLines(joinLogLines(normalized))
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

function markCopied(): void {
  copied.value = true
  copyFailed.value = false
  if (copiedTimer) window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copied.value = false
    copiedTimer = 0
  }, 1500)
}

function markCopyFailed(): void {
  copyFailed.value = true
  copied.value = false
  if (copiedTimer) window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copyFailed.value = false
    copiedTimer = 0
  }, 2500)
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
    visibleTexts: displayLines.value.map((line) => line.text),
    allTexts: resolvedLines.value.map((line) => line.text),
  })
  return writeCopy(resolved.text, resolved.source)
}

async function copyAll(): Promise<boolean> {
  return writeCopy(joinLogLines(resolvedLines.value), 'all')
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
  emit('followChange', next)
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
      announcement.value = t('log.newLines', '{count} new lines', { count: delta })
    }
    if (!props.follow || delta <= 0 || !stuckToBottom.value) return
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

onUnmounted(() => {
  if (copiedTimer) window.clearTimeout(copiedTimer)
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
    :style="rootStyle"
    :dir="dir"
    @keydown="onRootKeydown"
  >
    <div v-if="hasChrome" class="rs-log__chrome">
      <slot name="toolbar">
        <div v-if="showSearch" ref="searchRef" class="rs-log__search">
          <RsInput
            v-model="search"
            type="search"
            size="sm"
            clearable
            :placeholder="t('log.searchPlaceholder', 'Filter lines…')"
            :aria-label="t('log.search', 'Search logs')"
          />
        </div>
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
        :item-size="resolvedItemSize"
        :height="0"
        :overscan="overscan"
        :active-index="activeIndex < 0 ? null : activeIndex"
        radius="none"
        @scroll="onListScroll"
      >
        <template #default="{ item, index }">
          <div
            class="rs-log__row"
            :class="[
              `rs-log__row--${item.level}`,
              {
                'rs-log__row--odd': index % 2 === 1,
                'rs-log__row--active': index === activeIndex,
              },
            ]"
            role="listitem"
            :aria-label="rowLabel(item)"
            :data-log-index="index"
            @click="onRowClick(index)"
          >
            <span class="rs-log__marker" aria-hidden="true" />
            <span v-if="showLineNo" class="rs-log__no">{{ item.seq }}</span>
            <span v-if="showTime && item.time" class="rs-log__time">{{ item.time }}</span>
            <span v-if="showLevel && item.level !== 'plain'" class="rs-log__level">{{ levelLabel(item.level) }}</span>
            <span v-else class="rs-log__sr-only">{{ levelLabel(item.level) }}</span>
            <slot name="row" :item="item" :index="index" :level-label="levelLabel(item.level)" :parts="highlightParts(item.text)">
              <span class="rs-log__text">
                <template v-for="(part, partIndex) in highlightParts(item.text)" :key="partIndex">
                  <mark v-if="part.hit" class="rs-log__hit">{{ part.text }}</mark>
                  <template v-else>{{ part.text }}</template>
                </template>
              </span>
            </slot>
          </div>
        </template>
      </RsVirtualList>
      <div
        v-else
        ref="plainRef"
        class="rs-log__plain"
        role="list"
        @scroll="onListScroll"
      >
        <div
          v-for="(item, index) in displayLines"
          :key="item.key"
          class="rs-log__row"
          :class="[
            `rs-log__row--${item.level}`,
            {
              'rs-log__row--odd': index % 2 === 1,
              'rs-log__row--active': index === activeIndex,
            },
          ]"
          role="listitem"
          :aria-label="rowLabel(item)"
          :data-log-index="index"
          @click="onRowClick(index)"
        >
          <span class="rs-log__marker" aria-hidden="true" />
          <span v-if="showLineNo" class="rs-log__no">{{ item.seq }}</span>
          <span v-if="showTime && item.time" class="rs-log__time">{{ item.time }}</span>
          <span v-if="showLevel && item.level !== 'plain'" class="rs-log__level">{{ levelLabel(item.level) }}</span>
          <span v-else class="rs-log__sr-only">{{ levelLabel(item.level) }}</span>
          <slot name="row" :item="item" :index="index" :level-label="levelLabel(item.level)" :parts="highlightParts(item.text)">
            <span class="rs-log__text">
              <template v-for="(part, partIndex) in highlightParts(item.text)" :key="partIndex">
                <mark v-if="part.hit" class="rs-log__hit">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </slot>
        </div>
      </div>
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
  color: var(--rs-log-fg, var(--rs-text));
  font-family: var(--rs-log-font-family, var(--rs-font-mono));
  font-size: var(--rs-log-font-size, var(--rs-font-size-xs));
  line-height: 1.45;
  height: var(--rs-log-box-height, 280px);
}
.rs-log__chrome {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  padding: 0.4rem 0.55rem;
  border-bottom: 1px solid var(--rs-log-border, var(--rs-border));
  background: color-mix(in srgb, var(--rs-log-bg, var(--rs-surface)) 88%, var(--rs-surface-hover));
}
.rs-log__search {
  min-width: 10rem;
  flex: 1 1 12rem;
}
.rs-log__copy {
  flex-shrink: 0;
  margin-inline-start: auto;
}
.rs-log__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  border: 0;
  min-inline-size: 0;
}
.rs-log__chip {
  margin: 0;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--rs-log-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: transparent;
  color: var(--rs-log-muted, var(--rs-text-muted));
  font: inherit;
  font-size: var(--rs-font-size-xs);
  cursor: pointer;
}
.rs-log__chip--on {
  color: var(--rs-log-fg, var(--rs-text));
  border-color: color-mix(in srgb, var(--rs-primary) 45%, var(--rs-log-border, var(--rs-border)));
  background: color-mix(in srgb, var(--rs-primary) 14%, transparent);
}
.rs-log__viewport {
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
.rs-log__row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  box-sizing: border-box;
  padding: 0 0.7rem;
  white-space: nowrap;
  color: var(--rs-log-row-fg, var(--rs-log-fg));
}
.rs-log:not(.rs-log--wrap) .rs-log__list .rs-log__row {
  min-height: 100%;
}
.rs-log--wrap .rs-log__plain {
  display: block;
}
.rs-log--wrap .rs-log__row {
  height: auto;
  max-height: none;
  min-height: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  padding-block: 0.25rem;
}
.rs-log--zebra .rs-log__row--odd {
  background: var(--rs-log-stripe, transparent);
}
.rs-log__row--active {
  background: color-mix(in srgb, var(--rs-primary) 12%, var(--rs-log-bg, transparent));
  box-shadow: inset 2px 0 0 var(--rs-primary);
}
.rs-log__marker {
  flex-shrink: 0;
  width: 0.2rem;
  align-self: stretch;
  min-height: 0.9em;
  margin-block: 0.2rem;
  border-radius: 99px;
  background: currentColor;
  user-select: none;
}
.rs-log__no,
.rs-log__time {
  flex-shrink: 0;
  color: var(--rs-log-muted, var(--rs-text-muted));
  font-variant-numeric: tabular-nums;
  unicode-bidi: isolate;
  user-select: none;
}
.rs-log__level {
  flex-shrink: 0;
  min-width: 3.6rem;
  font-weight: var(--rs-font-weight-semibold);
  letter-spacing: 0.02em;
  unicode-bidi: isolate;
  user-select: none;
}
.rs-log__text {
  min-width: 0;
  flex: 1;
  font-weight: inherit;
  unicode-bidi: plaintext;
  user-select: text;
}
.rs-log--wrap .rs-log__text {
  overflow: visible;
  height: auto;
  min-height: 0;
}
.rs-log:not(.rs-log--wrap) .rs-log__text {
  overflow: hidden;
  text-overflow: ellipsis;
}
.rs-log__hit {
  padding: 0 0.1em;
  background: var(--rs-log-hit-bg);
  color: var(--rs-log-hit-fg);
  font: inherit;
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
.rs-log__row--plain {
  --rs-log-row-fg: var(--rs-log-fg);
  font-weight: var(--rs-font-weight-regular);
}
.rs-log__row--trace {
  --rs-log-row-fg: var(--rs-log-trace);
  font-weight: var(--rs-font-weight-regular);
}
.rs-log__row--debug {
  --rs-log-row-fg: var(--rs-log-debug);
  font-weight: var(--rs-font-weight-regular);
}
.rs-log__row--info,
.rs-log__row--notice {
  --rs-log-row-fg: var(--rs-log-info);
  font-weight: var(--rs-font-weight-medium);
}
.rs-log__row--notice {
  --rs-log-row-fg: var(--rs-log-notice);
}
.rs-log__row--success {
  --rs-log-row-fg: var(--rs-log-success);
  font-weight: var(--rs-font-weight-medium);
}
.rs-log__row--warn {
  --rs-log-row-fg: var(--rs-log-warn);
  font-weight: var(--rs-font-weight-semibold);
}
.rs-log__row--error {
  --rs-log-row-fg: var(--rs-log-error);
  font-weight: var(--rs-font-weight-bold);
}
.rs-log__row--fatal {
  --rs-log-row-fg: var(--rs-log-fatal);
  font-weight: var(--rs-font-weight-bold);
}
@media (forced-colors: active) {
  .rs-log__marker {
    background: ButtonText;
  }
  .rs-log__row--active {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}
</style>
