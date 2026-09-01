<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize } from '../theme/types'
import {
  placeAnchoredPopup,
  stepEnabledIndex,
  type RsOverlayBox,
} from './overlay-utils'
import { useResolvedRsComponentSize } from './resolve-size'
import RsIcon from './RsIcon.vue'
import {
  filterSelectOptions,
  splitSelectLabelHighlight,
  type RsSelectFilterOption,
  type RsSelectOption,
} from './select-utils'

defineOptions({ name: 'RsAutoComplete', inheritAttrs: false })

const model = defineModel<string>({ default: '' })
const openModel = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    options?: ReadonlyArray<string | RsSelectOption>
    placeholder?: string
    disabled?: boolean
    size?: RsComponentSize
    allowClear?: boolean
    filterOption?: RsSelectFilterOption | boolean
    debounce?: number
    emptyText?: string
  }>(),
  {
    options: () => [],
    disabled: false,
    allowClear: false,
    filterOption: true,
    debounce: 0,
    emptyText: '',
  },
)

const emit = defineEmits<{
  search: [query: string]
  select: [value: string]
  clear: []
}>()

const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const listId = useId()
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const highlight = ref(0)
const dismissed = ref(false)
const searchTimer = ref<ReturnType<typeof setTimeout>>()
const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })

const normalized = computed((): RsSelectOption[] =>
  props.options.map((item) =>
    typeof item === 'string' ? { label: item, value: item } : item,
  ),
)

const suggestions = computed(() => {
  if (props.filterOption === false) return normalized.value
  return filterSelectOptions(
    normalized.value,
    model.value,
    (text, q) => text.toLowerCase().includes(q.toLowerCase()),
    props.filterOption,
  ) as RsSelectOption[]
})

const open = computed(
  () => Boolean(openModel.value && !props.disabled && !dismissed.value),
)
const activeOption = computed(() => suggestions.value[highlight.value])
const activeOptionId = computed(() =>
  open.value && activeOption.value ? `${listId}-${String(activeOption.value.value)}` : undefined,
)

watch(model, (query) => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  const wait = props.debounce ?? 0
  if (wait <= 0) {
    emit('search', query)
    return
  }
  searchTimer.value = setTimeout(() => emit('search', query), wait)
})

function placePopup(): void {
  const input = inputRef.value
  if (!input || !open.value) return
  const anchor = input.getBoundingClientRect()
  const list = listRef.value?.getBoundingClientRect()
  popup.value = placeAnchoredPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    {
      width: anchor.width,
      height: list?.height || Math.min(256, Math.max(1, suggestions.value.length) * 36),
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

function showList(): void {
  if (props.disabled) return
  dismissed.value = false
  openModel.value = true
  requestPlace()
}

function hideList(): void {
  openModel.value = false
}

function onPick(option: RsSelectOption): void {
  if (option.disabled) return
  model.value = String(option.value)
  emit('select', String(option.value))
  dismissed.value = true
  hideList()
  void nextTick(() => inputRef.value?.focus())
}

function onClear(): void {
  model.value = ''
  emit('clear')
  showList()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (!open.value) return
    event.preventDefault()
    dismissed.value = true
    hideList()
    return
  }
  if (!open.value) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      showList()
    }
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(suggestions.value, highlight.value, 1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(suggestions.value, highlight.value, -1)
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(suggestions.value, -1, 1)
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(suggestions.value, suggestions.value.length, -1)
    return
  }
  if (event.key === 'Enter' && activeOption.value) {
    event.preventDefault()
    onPick(activeOption.value)
    return
  }
  if (event.key === 'Tab' && activeOption.value) {
    onPick(activeOption.value)
  }
}

function onInput(): void {
  showList()
}

function onFocus(): void {
  showList()
}

function onBlur(): void {
  window.setTimeout(() => {
    if (document.activeElement === inputRef.value) return
    hideList()
  }, 0)
}

watch(suggestions, (list) => {
  highlight.value = list.findIndex((item) => !item.disabled)
  if (highlight.value < 0) highlight.value = 0
  requestPlace()
})

watch(
  open,
  (isOpen) => {
    if (isOpen) void nextTick(() => requestPlace())
  },
  { immediate: true },
)

function onWindowChange(): void {
  if (open.value) requestPlace()
}

onMounted(() => {
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
})
onUnmounted(() => {
  if (frame) window.cancelAnimationFrame(frame)
  if (searchTimer.value) clearTimeout(searchTimer.value)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})

function parts(label: string) {
  return splitSelectLabelHighlight(label, model.value)
}
</script>

<template>
  <div
    class="rs-auto-complete"
    :class="[
      `rs-auto-complete--${resolvedSize}`,
      { 'rs-auto-complete--clearable': allowClear && model && !disabled },
    ]"
  >
    <input
      ref="inputRef"
      v-model="model"
      class="rs-auto-complete__input"
      :placeholder="placeholder ?? t('select.placeholder')"
      :disabled="disabled"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="activeOptionId"
      @keydown="onKeydown"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <button
      v-if="allowClear && model && !disabled"
      type="button"
      class="rs-auto-complete__clear"
      :aria-label="t('select.clear')"
      @pointerdown.prevent
      @click="onClear"
    >
      <RsIcon name="x" :size="14" />
    </button>
    <Teleport to="body">
      <ul
        v-if="open"
        :id="listId"
        ref="listRef"
        class="rs-auto-complete__list"
        role="listbox"
        :aria-label="t('autocomplete.suggestions')"
        :data-placement="popup.placement"
        :style="{
          position: 'fixed',
          top: `${popup.top}px`,
          left: `${popup.left}px`,
          width: `${popup.width}px`,
        }"
      >
        <li v-if="!suggestions.length" class="rs-auto-complete__empty" role="presentation">
          {{ emptyText || t('select.empty') }}
        </li>
        <li
          v-for="(opt, index) in suggestions"
          :id="`${listId}-${String(opt.value)}`"
          :key="String(opt.value)"
          role="option"
          class="rs-auto-complete__item"
          :class="{
            'rs-auto-complete__item--disabled': opt.disabled,
            'rs-auto-complete__item--active': index === highlight,
          }"
          :aria-selected="index === highlight"
          :aria-disabled="opt.disabled ? 'true' : undefined"
          @mousedown.prevent="onPick(opt)"
        >
          <span class="rs-auto-complete__label">
            <template v-for="(part, i) in parts(opt.label)" :key="i">
              <span v-if="part.highlight" class="rs-auto-complete__mark">{{ part.text }}</span>
              <template v-else>{{ part.text }}</template>
            </template>
          </span>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

