<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useAttrs, useId, watch } from 'vue'
import { useRsI18n } from '../../../composables/useRsI18n'
import type { RsComponentSize } from '../../../theme/types'
import { RS_COMPONENT_SIZE_ICON_PX } from '../../../theme/types'
import {
  placeAnchoredPopup,
  stepEnabledIndex,
  type RsOverlayBox,
} from '../../_shared/src/overlay-utils'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { useRsFormContext, useRsFormField } from '../../form/src/form-utils'
import RsIcon from '../../icon/src/RsIcon.vue'
import {
  filterRsAutoCompleteOptions,
  normalizeRsAutoCompleteOptions,
  type RsAutoCompleteFilterOption,
  type RsAutoCompleteOption,
  type RsAutoCompleteOptionInput,
} from './auto-complete-utils'

/**
 * RsAutoComplete 模板 ref 请用此类型。
 * 不要写 `InstanceType<typeof RsAutoComplete>`：组件实例类型过深，vue-tsc 会报 Excessive stack depth。
 */
export interface RsAutoCompleteExpose {
  focus: () => void
  blur: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsAutoCompleteInstance = RsAutoCompleteExpose & { $el: HTMLElement }

export type { RsAutoCompleteFilterOption, RsAutoCompleteOption, RsAutoCompleteOptionInput }

defineOptions({ name: 'RsAutoComplete', inheritAttrs: false })

const model = defineModel<string>({ default: '' })
const openModel = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    options?: ReadonlyArray<RsAutoCompleteOptionInput>
    placeholder?: string
    disabled?: boolean
    size?: RsComponentSize
    allowClear?: boolean
    filterOption?: RsAutoCompleteFilterOption | boolean
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
    disabled: false,
    allowClear: false,
    filterOption: true,
    debounce: 0,
    emptyText: '',
    loading: false,
  },
)

const emit = defineEmits<{
  search: [query: string]
  select: [value: string]
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
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLSelectElement | null>(null)
const highlight = ref(0)
const dismissed = ref(false)
const searchTimer = ref<ReturnType<typeof setTimeout>>()
const popup = ref<RsOverlayBox>({ top: 0, left: 0, width: 0, placement: 'bottom' })
/** 面板挂到 body 后仍跟输入框最近的 data-rs-theme（深色岛 / 混主题页）。 */
const panelTheme = ref<string | undefined>()

function syncPanelTheme(): void {
  const el = inputRef.value
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
const normalized = computed(() => normalizeRsAutoCompleteOptions(props.options))
const suggestions = computed(() =>
  filterRsAutoCompleteOptions(normalized.value, model.value, props.filterOption),
)
const suggestionViews = computed(() =>
  suggestions.value.map((option, index) => ({
    option,
    index,
    optionId: `${listId}-${String(option.value)}`,
  })),
)
const listSize = computed(() => {
  const count = suggestions.value.length
  if (count === 0) return 2
  return Math.min(8, Math.max(2, count))
})
const open = computed(
  () => Boolean(openModel.value && !resolvedDisabled.value && !dismissed.value),
)
const activeOption = computed(() => suggestions.value[highlight.value])
const selectedValue = computed(() =>
  activeOption.value ? String(activeOption.value.value) : '',
)
const activeOptionId = computed(() => {
  if (!open.value || !activeOption.value) return undefined
  return `${listId}-${String(activeOption.value.value)}`
})
const showClear = computed(() => Boolean(props.allowClear && model.value && !resolvedDisabled.value))
const listStatusText = computed(() => {
  if (props.loading && !suggestions.value.length) {
    return props.loadingText || t('select.loading')
  }
  return props.emptyText || t('select.empty')
})

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
let overlayBound = false

function requestPlace(): void {
  if (typeof window === 'undefined' || frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function onWindowChange(): void {
  if (open.value) requestPlace()
}

function attachOverlay(): void {
  if (overlayBound || typeof window === 'undefined') return
  overlayBound = true
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachOverlay(): void {
  if (frame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (!overlayBound || typeof window === 'undefined') return
  overlayBound = false
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
}

function showList(): void {
  if (resolvedDisabled.value) return
  dismissed.value = false
  openModel.value = true
  requestPlace()
}

function hideList(): void {
  openModel.value = false
}

function onPick(option: RsAutoCompleteOption): void {
  if (option.disabled) return
  model.value = String(option.value)
  emit('select', String(option.value))
  dismissed.value = true
  hideList()
  void nextTick(() => inputRef.value?.focus())
}

function onNativeSelect(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const option = suggestions.value.find((item) => String(item.value) === value)
  if (option) onPick(option)
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

function onFocus(event: FocusEvent): void {
  emit('focus', event)
  showList()
}

let blurTimer = 0
function onBlur(event: FocusEvent): void {
  emit('blur', event)
  if (blurTimer) window.clearTimeout(blurTimer)
  blurTimer = window.setTimeout(() => {
    blurTimer = 0
    if (document.activeElement === inputRef.value) return
    hideList()
  }, 0)
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

watch(open, (isOpen) => {
  if (isOpen) {
    attachOverlay()
    void nextTick(() => {
      syncPanelTheme()
      requestPlace()
    })
    return
  }
  detachOverlay()
})

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
  inputRef.value?.focus()
}

function blur(): void {
  inputRef.value?.blur()
}

defineExpose<RsAutoCompleteExpose>({
  focus,
  blur,
})

onUnmounted(() => {
  detachOverlay()
  if (searchTimer.value) clearTimeout(searchTimer.value)
  if (blurTimer) window.clearTimeout(blurTimer)
})
</script>

<template>
  <div
    class="rs-auto-complete"
    :class="[
      `rs-auto-complete--${resolvedSize}`,
      {
        'rs-auto-complete--clearable': showClear,
        'rs-auto-complete--disabled': resolvedDisabled,
      },
    ]"
  >
    <input
      :id="inputId"
      ref="inputRef"
      v-bind="attrs"
      v-model="model"
      class="rs-auto-complete__input"
      :name="name"
      :placeholder="placeholder ?? t('autocomplete.placeholder')"
      :disabled="resolvedDisabled"
      :aria-label="ariaLabel"
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
      v-if="showClear"
      type="button"
      class="rs-auto-complete__clear"
      :aria-label="t('select.clear')"
      @pointerdown.prevent
      @click="onClear"
    >
      <RsIcon name="x" :size="iconPx" />
    </button>
    <Teleport to="body">
      <select
        v-if="open"
        :id="listId"
        ref="listRef"
        class="rs-auto-complete__list"
        :size="listSize"
        tabindex="-1"
        :aria-label="t('autocomplete.suggestions')"
        :aria-busy="loading ? 'true' : undefined"
        :data-rs-theme="panelTheme"
        :data-placement="popup.placement"
        :value="selectedValue"
        :style="{
          position: 'fixed',
          top: `${popup.top}px`,
          left: `${popup.left}px`,
          width: `${popup.width}px`,
        }"
        @mousedown.prevent
        @change="onNativeSelect"
      >
        <option v-if="!suggestions.length" disabled value="">
          <slot name="empty">{{ listStatusText }}</slot>
        </option>
        <option
          v-for="row in suggestionViews"
          :id="row.optionId"
          :key="String(row.option.value)"
          class="rs-auto-complete__item"
          :class="{ 'rs-auto-complete__item--active': row.index === highlight }"
          :value="String(row.option.value)"
          :disabled="row.option.disabled"
          :title="row.option.title"
        >
          <slot name="option" :option="row.option" :active="row.index === highlight">
            {{ row.option.label }}
          </slot>
        </option>
      </select>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-auto-complete {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  vertical-align: middle;
  color-scheme: inherit;
}

.rs-auto-complete__input {
  box-sizing: border-box;
  width: 100%;
  height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-select-radius, var(--rs-radius-sm));
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font-family: inherit;
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  outline: none;
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-auto-complete--ssm .rs-auto-complete__input {
  height: var(--rs-control-height-ssm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-auto-complete--sm .rs-auto-complete__input {
  height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-auto-complete--lg .rs-auto-complete__input {
  height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-auto-complete--clearable .rs-auto-complete__input {
  padding-inline-end: calc(var(--rs-space-md) + 1.25rem);
}

.rs-auto-complete__input::placeholder {
  color: var(--rs-placeholder);
}

.rs-auto-complete__input:hover:not(:disabled) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}

.rs-auto-complete__input:focus {
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-input-bg);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-auto-complete__input:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  background: var(--rs-surface-hover);
}

.rs-auto-complete__clear {
  position: absolute;
  top: 50%;
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
  transform: translateY(-50%);
  cursor: pointer;
}

.rs-auto-complete__clear:hover {
  color: var(--rs-text);
  background: var(--rs-item-hover);
}

.rs-auto-complete__list {
  appearance: none;
  color-scheme: inherit;
  z-index: calc(var(--rs-z-modal) + 2);
  box-sizing: border-box;
  min-width: 8rem;
  max-width: min(24rem, calc(100vw - 1rem));
  max-height: 16rem;
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
  outline: none;
}

.rs-auto-complete__item {
  padding: var(--rs-space-sm) var(--rs-space-md);
  border-radius: var(--rs-radius-sm);
  color: var(--rs-text);
  background: transparent;
}

.rs-auto-complete__item--active,
.rs-auto-complete__list option:checked,
.rs-auto-complete__list option:hover:not(:disabled) {
  background: var(--rs-item-hover);
}

.rs-auto-complete__list option:disabled {
  color: var(--rs-muted);
}
</style>
