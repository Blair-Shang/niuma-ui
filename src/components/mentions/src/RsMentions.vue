<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useAttrs, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import type { RsComponentSize } from '../../../theme/types'
import { RS_COMPONENT_SIZE_ICON_PX } from '../../../theme/types'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext, useRsFormField } from '../../form/src/form-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  applyMention,
  createTextareaCaretMeter,
  filterMentionOptions,
  findActiveMention,
  normalizeRsMentionOptions,
  placeMentionPopup,
  stepMentionIndex,
  resolveMentionPrefixes,
  type RsMentionFilterOption,
  type RsMentionOption,
  type RsMentionOptionInput,
  type RsMentionPopupBox,
} from './mentions-utils'

/**
 * RsMentions 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsMentions>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsMentionsExpose {
  focus: () => void
  blur: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsMentionsInstance = RsMentionsExpose & { $el: HTMLElement }

export type { RsMentionFilterOption, RsMentionOption, RsMentionOptionInput }

defineOptions({ name: 'RsMentions', inheritAttrs: false })

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    options?: ReadonlyArray<RsMentionOptionInput>
    prefix?: string | string[]
    split?: string
    rows?: number
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    size?: RsComponentSize
    allowClear?: boolean
    filterOption?: RsMentionFilterOption
    debounce?: number
    emptyText?: string
    /** 远程搜索进行中。列表空时显示 loadingText。 */
    loading?: boolean
    loadingText?: string
    id?: string
    name?: string
    /** 无障碍名称。旁边已有可见 label 时可省略。 */
    ariaLabel?: string
  }>(),
  {
    options: () => [],
    prefix: '@',
    split: ' ',
    rows: 3,
    disabled: false,
    readonly: false,
    allowClear: false,
    filterOption: true,
    debounce: 0,
    emptyText: '',
    loading: false,
  },
)

const emit = defineEmits<{
  select: [value: string]
  search: [query: string]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const { t } = useRsI18n()
const attrs = useAttrs()
const formContext = useRsFormContext()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const listId = useId()
const autoId = useId()
const inputId = computed(() => props.id || autoId)
const areaRef = ref<HTMLTextAreaElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const cursor = ref(0)
const popup = ref<RsMentionPopupBox>({ top: 0, left: 0, placement: 'bottom' })
const highlight = ref(0)
const dismissed = ref(false)
const lastSearch = ref<string | null>(null)
const composing = ref(false)
const searchTimer = ref<ReturnType<typeof setTimeout>>()
const prefixes = computed(() => resolveMentionPrefixes(props.prefix))
const meter = createTextareaCaretMeter()
/** 面板挂到 body 后仍跟输入框最近的 data-rs-theme（深色岛 / 混主题页）。 */
const panelTheme = ref<string | undefined>()

function syncPanelTheme(): void {
  const el = areaRef.value
  if (!el) {
    panelTheme.value = undefined
    return
  }
  const themed = el.closest('[data-rs-theme]')
  panelTheme.value = themed instanceof HTMLElement ? themed.dataset.rsTheme : undefined
}

const resolvedDisabled = computed(
  () => props.disabled || Boolean(formContext?.disabled.value),
)
const iconPx = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const normalized = computed(() => normalizeRsMentionOptions(props.options))
const active = computed(() =>
  dismissed.value || resolvedDisabled.value || props.readonly
    ? null
    : findActiveMention(model.value, cursor.value, prefixes.value, props.split),
)
const suggestions = computed(() =>
  active.value
    ? filterMentionOptions(normalized.value, active.value.query, props.filterOption)
    : [],
)
const suggestionViews = computed(() =>
  suggestions.value.map((option, index) => ({
    option,
    index,
    optionId: `${listId}-${index}-${String(option.value)}`,
  })),
)
const open = computed(() => Boolean(active.value))
const activeOption = computed(() => {
  const option = suggestions.value[highlight.value]
  return option && !option.disabled ? option : undefined
})
const activeOptionId = computed(() => {
  if (!open.value || !activeOption.value) return undefined
  return suggestionViews.value[highlight.value]?.optionId
})
const showClear = computed(
  () => Boolean(props.allowClear && model.value && !resolvedDisabled.value && !props.readonly),
)
const listStatusText = computed(() => {
  if (props.loading && !suggestions.value.length) {
    return props.loadingText || t('select.loading')
  }
  return props.emptyText || t('select.empty')
})

function viewportCaret() {
  const el = areaRef.value
  const mention = active.value
  if (!el || !mention) return null
  const local = meter.measure(el, mention.start)
  const box = el.getBoundingClientRect()
  return {
    top: box.top + local.top,
    left: box.left + local.left,
    height: local.height,
  }
}

function placePopup(): void {
  const caret = viewportCaret()
  if (!caret) return
  const list = listRef.value?.getBoundingClientRect()
  popup.value = placeMentionPopup(
    caret,
    {
      width: list?.width || 160,
      height: list?.height || Math.min(192, Math.max(1, suggestions.value.length) * 32),
    },
    { width: window.innerWidth, height: window.innerHeight },
  )
}

let frame = 0
function requestPlace(): void {
  if (typeof window === 'undefined') return
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function emitSearch(query: string): void {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  const wait = props.debounce ?? 0
  if (wait <= 0) {
    emit('search', query)
    return
  }
  searchTimer.value = setTimeout(() => emit('search', query), wait)
}

function syncCursor(emitSearchEvent: boolean, keepDismissed = false): void {
  const el = areaRef.value
  cursor.value = el?.selectionStart ?? model.value.length
  if (!keepDismissed) dismissed.value = false
  const mention = findActiveMention(model.value, cursor.value, prefixes.value, props.split)
  if (!mention) {
    lastSearch.value = null
    return
  }
  if (emitSearchEvent && mention.query !== lastSearch.value) {
    lastSearch.value = mention.query
    emitSearch(mention.query)
  }
  if (!keepDismissed) requestPlace()
}

function pick(option: RsMentionOption): void {
  if (!active.value || option.disabled || resolvedDisabled.value || props.readonly) return
  const next = applyMention(model.value, active.value, option.value, props.split)
  model.value = next.text
  emit('select', option.value)
  dismissed.value = true
  void nextTick(() => {
    const el = areaRef.value
    if (!el) return
    el.focus()
    el.setSelectionRange(next.cursor, next.cursor)
    cursor.value = next.cursor
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing || composing.value || resolvedDisabled.value || props.readonly) return
  if (!open.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlight.value = stepMentionIndex(suggestions.value, highlight.value, 1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlight.value = stepMentionIndex(suggestions.value, highlight.value, -1)
    return
  }
  if (event.key === 'Enter') {
    if (!activeOption.value) return
    event.preventDefault()
    pick(activeOption.value)
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    dismissed.value = true
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    highlight.value = stepMentionIndex(suggestions.value, -1, 1)
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    highlight.value = stepMentionIndex(suggestions.value, suggestions.value.length, -1)
    return
  }
  if (event.key === 'Tab' && activeOption.value) {
    event.preventDefault()
    pick(activeOption.value)
  }
}

function onCompositionStart(): void {
  composing.value = true
}

function onCompositionEnd(): void {
  composing.value = false
  syncCursor(true)
}

function onClear(): void {
  model.value = ''
  emit('clear')
  dismissed.value = true
  void nextTick(() => areaRef.value?.focus())
}

function onFocus(event: FocusEvent): void {
  emit('focus', event)
  syncCursor(true)
}

let blurTimer = 0
function onBlur(event: FocusEvent): void {
  emit('blur', event)
  if (typeof window === 'undefined') return
  if (blurTimer) window.clearTimeout(blurTimer)
  blurTimer = window.setTimeout(() => {
    blurTimer = 0
    if (document.activeElement === areaRef.value) return
    dismissed.value = true
  }, 0)
}

function onDocPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!target) return
  if (areaRef.value?.contains(target)) return
  if (listRef.value?.contains(target)) return
  dismissed.value = true
}

function scrollActiveIntoView(): void {
  if (!open.value || !activeOptionId.value) return
  document.getElementById(activeOptionId.value)?.scrollIntoView({ block: 'nearest' })
}

watch(suggestions, (list) => {
  highlight.value = list.findIndex((item) => !item.disabled)
  if (highlight.value < 0) highlight.value = 0
  if (open.value) requestPlace()
})

watch(highlight, () => {
  void nextTick(scrollActiveIntoView)
})

let overlayBound = false
function attachOverlay(): void {
  if (overlayBound || typeof window === 'undefined' || typeof document === 'undefined') return
  overlayBound = true
  document.addEventListener('pointerdown', onDocPointerDown)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachOverlay(): void {
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (!overlayBound) return
  overlayBound = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  }
}

watch(
  open,
  (isOpen) => {
    if (isOpen) {
      attachOverlay()
      void nextTick(() => {
        syncPanelTheme()
        requestPlace()
      })
      return
    }
    detachOverlay()
  },
)

function onWindowChange(): void {
  if (open.value) requestPlace()
}

function setFieldValue(value: unknown): void {
  model.value = value == null ? '' : String(value)
}

useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue: setFieldValue,
}))

function focus(): void {
  areaRef.value?.focus()
}

function blur(): void {
  areaRef.value?.blur()
}

defineExpose<RsMentionsExpose>({
  focus,
  blur,
})

onUnmounted(() => {
  detachOverlay()
  if (searchTimer.value) clearTimeout(searchTimer.value)
  if (blurTimer && typeof window !== 'undefined') window.clearTimeout(blurTimer)
  meter.dispose()
})
</script>

<template>
  <div
    class="rs-mentions"
    :class="[
      `rs-mentions--${resolvedSize}`,
      {
        'rs-mentions--clearable': showClear,
        'rs-mentions--disabled': resolvedDisabled,
        'rs-mentions--readonly': readonly,
      },
    ]"
  >
    <textarea
      :id="inputId"
      ref="areaRef"
      v-bind="attrs"
      v-model="model"
      class="rs-mentions__input"
      :name="name"
      :rows="rows"
      :placeholder="placeholder ?? t('mentions.placeholder')"
      :disabled="resolvedDisabled"
      :readonly="readonly"
      :aria-label="ariaLabel"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="activeOptionId"
      @keydown="onKeydown"
      @keyup="
        syncCursor(
          true,
          ['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
            $event.key,
          ),
        )
      "
      @click="syncCursor(true)"
      @input="syncCursor(true)"
      @scroll="syncCursor(false, true)"
      @focus="onFocus"
      @blur="onBlur"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
    />
    <button
      v-if="showClear"
      type="button"
      class="rs-mentions__clear"
      :aria-label="t('select.clear')"
      @pointerdown.prevent
      @click="onClear"
    >
      <RsIcon name="x" :size="iconPx" />
    </button>
    <Teleport to="body">
      <ul
        v-if="open"
        :id="listId"
        ref="listRef"
        class="rs-mentions__list"
        role="listbox"
        :aria-label="t('mentions.suggestions')"
        :aria-busy="loading ? 'true' : undefined"
        :data-rs-theme="panelTheme"
        :data-placement="popup.placement"
        :style="{ top: `${popup.top}px`, left: `${popup.left}px` }"
      >
        <li
          v-if="!suggestions.length"
          class="rs-mentions__item rs-mentions__item--empty"
          role="presentation"
        >
          <slot name="empty">{{ listStatusText }}</slot>
        </li>
        <li
          v-for="row in suggestionViews"
          :id="row.optionId"
          :key="row.optionId"
          role="option"
          class="rs-mentions__item"
          :class="{
            'rs-mentions__item--disabled': row.option.disabled,
            'rs-mentions__item--active': row.index === highlight,
          }"
          :aria-selected="row.index === highlight"
          :aria-disabled="row.option.disabled ? 'true' : undefined"
          :title="row.option.title"
          @mousedown.prevent="pick(row.option)"
        >
          <slot name="option" :option="row.option" :active="row.index === highlight">
            {{ row.option.label }}
          </slot>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-mentions {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  color-scheme: inherit;
}

.rs-mentions__input {
  box-sizing: border-box;
  width: 100%;
  min-height: calc(var(--rs-control-height-md) * 2);
  padding: var(--rs-space-sm) var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-select-radius, var(--rs-radius-sm));
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font-family: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  resize: vertical;
  outline: none;
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-mentions--ssm .rs-mentions__input {
  min-height: calc(var(--rs-control-height-ssm) * 2);
  padding: var(--rs-space-xs) var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-mentions--sm .rs-mentions__input {
  min-height: calc(var(--rs-control-height-sm) * 2);
  padding: var(--rs-space-xs) var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-mentions--lg .rs-mentions__input {
  min-height: calc(var(--rs-control-height-lg) * 2);
  padding: var(--rs-space-md) var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-mentions--clearable .rs-mentions__input {
  padding-inline-end: calc(var(--rs-space-md) + 1.25rem);
}

.rs-mentions__input::placeholder {
  color: var(--rs-placeholder);
}

.rs-mentions__input:hover:not(:disabled):not(:read-only) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}

.rs-mentions__input:focus {
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-input-bg);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-mentions__input:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  background: var(--rs-surface-hover);
  resize: none;
}

.rs-mentions__input:read-only:not(:disabled) {
  cursor: default;
}

.rs-mentions__clear {
  position: absolute;
  top: var(--rs-space-sm);
  inset-inline-end: var(--rs-space-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: 0;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
}

.rs-mentions__clear:hover {
  color: var(--rs-text);
  background: var(--rs-item-hover);
}

.rs-mentions__list {
  position: fixed;
  z-index: calc(var(--rs-z-modal) + 2);
  box-sizing: border-box;
  min-width: 10rem;
  max-width: min(24rem, calc(100vw - 1rem));
  max-height: 12rem;
  margin: 0;
  padding: var(--rs-space-xs);
  overflow: auto;
  border: 1px solid var(--rs-dialog-border, var(--rs-border));
  border-radius: var(--rs-radius);
  background: var(--rs-surface-elevated);
  box-shadow: var(--rs-shadow-lg);
  color: var(--rs-text);
  font: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  list-style: none;
  outline: none;
  color-scheme: inherit;
}

.rs-mentions__item {
  padding: var(--rs-space-xs) var(--rs-space-sm);
  border-radius: var(--rs-radius-sm);
  color: var(--rs-text);
  background: transparent;
  cursor: pointer;
}

.rs-mentions__item--active,
.rs-mentions__item:hover:not(.rs-mentions__item--disabled):not(.rs-mentions__item--empty) {
  background: var(--rs-item-hover);
}

.rs-mentions__item--disabled,
.rs-mentions__item--empty {
  color: var(--rs-muted);
  cursor: default;
}

.rs-mentions__item--disabled {
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .rs-mentions__input {
    transition: none;
  }
}
</style>
