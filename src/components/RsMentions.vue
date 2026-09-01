<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize } from '../theme/types'
import { useResolvedRsComponentSize } from './resolve-size'
import {
  applyMention,
  createTextareaCaretMeter,
  filterMentionOptions,
  findActiveMention,
  placeMentionPopup,
  stepMentionIndex,
  resolveMentionPrefixes,
  type RsMentionOption,
  type RsMentionPopupBox,
} from './mentions-utils'

defineOptions({ name: 'RsMentions' })

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    options?: readonly RsMentionOption[]
    prefix?: string | string[]
    split?: string
    rows?: number
    placeholder?: string
    disabled?: boolean
    size?: RsComponentSize
  }>(),
  {
    options: () => [],
    prefix: '@',
    split: ' ',
    rows: 3,
    disabled: false,
  },
)

const emit = defineEmits<{
  select: [value: string]
  search: [query: string]
}>()

const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const listId = useId()
const areaRef = ref<HTMLTextAreaElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const cursor = ref(0)
const popup = ref<RsMentionPopupBox>({ top: 0, left: 0, placement: 'bottom' })
const highlight = ref(0)
const dismissed = ref(false)
const lastSearch = ref<string | null>(null)
const prefixes = computed(() => resolveMentionPrefixes(props.prefix))
const meter = createTextareaCaretMeter()

const active = computed(() =>
  dismissed.value
    ? null
    : findActiveMention(model.value, cursor.value, prefixes.value, props.split),
)
const suggestions = computed(() =>
  active.value ? filterMentionOptions(props.options, active.value.query) : [],
)
const open = computed(() => Boolean(active.value && suggestions.value.length))
const activeOption = computed(() => suggestions.value[highlight.value])
const activeOptionId = computed(() =>
  open.value && activeOption.value ? `${listId}-${activeOption.value.value}` : undefined,
)

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
      height: list?.height || Math.min(192, suggestions.value.length * 32),
    },
    { width: window.innerWidth, height: window.innerHeight },
  )
}

let frame = 0
function requestPlace(): void {
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function syncCursor(emitSearch: boolean, keepDismissed = false): void {
  const el = areaRef.value
  cursor.value = el?.selectionStart ?? model.value.length
  if (!keepDismissed) dismissed.value = false
  const mention = findActiveMention(model.value, cursor.value, prefixes.value, props.split)
  if (!mention) {
    lastSearch.value = null
    return
  }
  if (emitSearch && mention.query !== lastSearch.value) {
    lastSearch.value = mention.query
    emit('search', mention.query)
  }
  requestPlace()
}

function pick(option: RsMentionOption): void {
  if (!active.value || option.disabled) return
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
    event.preventDefault()
    if (activeOption.value) pick(activeOption.value)
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

watch(suggestions, (list) => {
  highlight.value = list.findIndex((item) => !item.disabled)
  if (highlight.value < 0) highlight.value = 0
  requestPlace()
})

watch(open, (isOpen) => {
  if (isOpen) void nextTick(() => requestPlace())
})

function onWindowChange(): void {
  if (open.value) requestPlace()
}

onMounted(() => {
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
})
onUnmounted(() => {
  if (frame) window.cancelAnimationFrame(frame)
  meter.dispose()
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})
</script>

<template>
  <div class="rs-mentions" :class="`rs-mentions--${resolvedSize}`">
    <textarea
      ref="areaRef"
      v-model="model"
      class="rs-mentions__input"
      :rows="rows"
      :placeholder="placeholder ?? t('mentions.placeholder')"
      :disabled="disabled"
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
    />
    <Teleport to="body">
      <ul
        v-if="open"
        :id="listId"
        ref="listRef"
        class="rs-mentions__list"
        role="listbox"
        :aria-label="t('mentions.suggestions')"
        :style="{ top: `${popup.top}px`, left: `${popup.left}px` }"
      >
        <li
          v-for="(opt, index) in suggestions"
          :id="`${listId}-${opt.value}`"
          :key="opt.value"
          role="option"
          class="rs-mentions__item"
          :class="{
            'rs-mentions__item--disabled': opt.disabled,
            'rs-mentions__item--active': index === highlight,
          }"
          :aria-selected="index === highlight"
          :aria-disabled="opt.disabled ? 'true' : undefined"
          @mousedown.prevent="pick(opt)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-mentions {
  position: relative;
  width: 100%;
}
.rs-mentions__input {
  box-sizing: border-box;
  width: 100%;
  min-height: calc(var(--rs-control-height-md) * 2);
  padding: var(--rs-space-sm) var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font-family: inherit;
  font-size: var(--rs-font-size-sm);
  resize: vertical;
  outline: none;
}
</style>

<style>
.rs-mentions__list {
  position: fixed;
  z-index: var(--rs-z-dropdown, 80);
  box-sizing: border-box;
  min-width: 10rem;
  max-height: 12rem;
  margin: 0;
  padding: var(--rs-space-xs);
  overflow: auto;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
  background: var(--rs-surface);
  box-shadow: var(--rs-shadow-md);
  list-style: none;
}
.rs-mentions__item {
  padding: var(--rs-space-xs) var(--rs-space-sm);
  border-radius: var(--rs-radius-xs);
  cursor: pointer;
}
.rs-mentions__item--active,
.rs-mentions__item:hover:not(.rs-mentions__item--disabled) {
  background: var(--rs-surface-hover);
}
.rs-mentions__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
