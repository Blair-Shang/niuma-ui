<script setup lang="ts" generic="Value extends string | number = string, Multiple extends boolean = false, LabelInValue extends boolean = false">
import { computed, nextTick, onMounted, onUnmounted, ref, useAttrs, useId, useTemplateRef, watch } from 'vue'

import { useRsI18n } from '../../../composables/useRsI18n'
import type { RsComponentSize, RsRadius } from '../../../theme/types'
import { RS_COMPONENT_SIZE_ICON_PX } from '../../../theme/types'

import RsIcon from '../../icon/src/RsIcon.vue'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
} from '../../form/src/form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from '../../form/src/form-rules'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from '../../_shared/src/resolve-radius'
import {
  placeAnchoredPopup,
  stepEnabledIndex,
} from '../../_shared/src/overlay-utils'
import {
  isSelectOptionGroup,
  toComboboxValue,
  type RsSelectFieldNames,
  type RsSelectFilterOption,
  type RsSelectFilterSort,
  type RsSelectGetPopupContainer,
  type RsSelectMaxTagCount,
  type RsSelectModelValue,
  type RsSelectOption,
  type RsSelectOptionFilterProp,
  type RsSelectOptionsInput,
  type RsSelectPlacement,
  type RsSelectStatus,
  type RsSelectVariant,
  splitSelectLabelHighlight,
  type RsSelectValue,
} from './select-utils'
import { useRsSelect } from './use-rs-select'

export interface RsSelectExpose {
  setValue: (value: unknown) => void
  clearValidation: () => void
  validate: (trigger?: RsFormRuleTrigger) => Promise<{
    valid: boolean
    message?: string
    name?: string
  }>
  focus: () => void
  blur: () => void
}

/** 模板 ref 实例：expose + 根节点 */
export type RsSelectInstance = RsSelectExpose & { $el: HTMLElement }

defineOptions({ name: 'RsSelect', inheritAttrs: false })

/**
 * multiple / labelInValue 是运行时 boolean，不能从 prop 推断字面量。
 * v-model 收完整联合，模板传入 string / number / 数组 / labeled 即可。
 */
const model = defineModel<RsSelectModelValue>({
  default: '',
})
const open = defineModel<boolean>('open', { default: false })
const searchQuery = defineModel<string>('searchValue', { default: '' })

const props = withDefaults(
  defineProps<{
    options: RsSelectOptionsInput
    placeholder?: string
    disabled?: boolean
    id?: string
    searchable?: boolean
    /**
     * 允许把搜索框内容作为自定义值提交（Enter 或点「使用 xxx」）。
     * 开启后若未显式关 searchable，将自动启用搜索框。
     */
    creatable?: boolean
    /** 运行时必须是 boolean；写成泛型 Multiple 时 :multiple="true" 可能进 attrs。 */
    multiple?: boolean
    required?: boolean
    name?: string
    clearable?: boolean
    virtual?: boolean
    virtualThreshold?: number
    remote?: boolean
    loading?: boolean
    searchPlaceholder?: string
    emptyText?: string
    loadingText?: string
    size?: RsComponentSize
    radius?: RsRadius
    /**
     * 下拉面板是否与触发器等宽。
     * 默认 false：面板可随文案变宽；true：与触发器同宽。
     */
    matchTriggerWidth?: boolean
    block?: boolean
    invalid?: boolean
    showValidateMessage?: boolean
    /**
     * 自定义过滤；`false` 关闭。默认 `true`（必须显式默认，否则 Vue 会把 boolean 联合类型当成 Boolean prop，未传入即 `false`，可搜索列表永远不过滤）。
     */
    filterOption?: RsSelectFilterOption | boolean
    optionFilterProp?: RsSelectOptionFilterProp
    maxTagCount?: RsSelectMaxTagCount
    /** 远程 @search 防抖毫秒 */
    debounce?: number
    /** 对齐 Ant 5；不影响面板内搜索 / 创建 */
    variant?: RsSelectVariant
    autoFocus?: boolean
    dropdownStyle?: Record<string, string>
    classNames?: { popup?: string; trigger?: string }
    maxTagPlaceholder?: string | ((omitted: number) => string)
    multipleLimit?: number
    /** 与 multiple 相同：不能写成泛型 LabelInValue，否则 withDefaults 的 false 过不了 InferDefault。 */
    labelInValue?: boolean
    filterSort?: RsSelectFilterSort
    maxTagTextLength?: number
    maxTagTooltip?: boolean
    tokenSeparators?: string[]
    autoClearSearchValue?: boolean
    /**
     * 打开下拉时把当前选中项写入搜索框并参与过滤。
     * 默认 false：搜索框保持空白。
     */
    fillSearchWithValue?: boolean
    showArrow?: boolean
    listHeight?: number
    placement?: RsSelectPlacement
    popupClassName?: string
    status?: RsSelectStatus
    /** 把业务字段映射为 label / value / options，对齐 Ant fieldNames */
    fieldNames?: RsSelectFieldNames
    /** 触发器展示用的选项字段，默认 label。对齐 Ant optionLabelProp */
    optionLabelProp?: string
    /** 下拉挂载容器，对齐 Ant getPopupContainer */
    getPopupContainer?: RsSelectGetPopupContainer
  }>(),
  {
    disabled: false,
    searchable: false,
    creatable: false,
    required: false,
    clearable: false,
    virtual: false,
    virtualThreshold: 50,
    remote: false,
    loading: false,
    matchTriggerWidth: false,
    block: false,
    multiple: false,
    labelInValue: false,
    filterOption: true,
    optionFilterProp: 'label',
    optionLabelProp: 'label',
    maxTagTooltip: true,
    autoClearSearchValue: true,
    fillSearchWithValue: false,
    showArrow: true,
    listHeight: 256,
    placement: 'bottom',
    status: '',
    debounce: 0,
    variant: 'outlined',
    autoFocus: false,
  },
)

const emit = defineEmits<{
  search: [query: string]
  select: [value: RsSelectValue, option?: RsSelectOption]
  deselect: [value: RsSelectValue, option?: RsSelectOption]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  dropdownVisibleChange: [open: boolean]
  popupScroll: [event: Event]
}>()

const ITEM_ESTIMATE = 36
const VIRTUAL_OVERSCAN = 6

const { t } = useRsI18n()
const attrs = useAttrs()
const listId = useId()
const formContext = useRsFormContext()
const formItem = useRsFormItemContext()
const boundToItem = computed(() =>
  isRsFormItemBoundControl(formItem, { id: props.id, name: props.name }),
)
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef')
const viewportRef = useTemplateRef<HTMLElement>('viewportRef')

const {
  resolvedPlaceholder,
  resolvedSearchPlaceholder,
  resolvedEmptyText,
  resolvedLoadingText,
  isMultiple,
  isSearchable,
  labelMap,
  useVirtual,
  displayOptions,
  createValue,
  canCreate,
  createOptionLabel,
  virtualValues,
  selectedValues,
  hasValue,
  visibleTagTokens,
  omittedTagCount,
  omittedTagLabel,
  omittedTagTitle,
  singleDisplayLabel,
  pickToken,
  tokenLabel,
  truncateTagLabel,
  optionFromToken,
  optionOrCreate,
  isOptionLimited,
  isTokenDisabled,
  restoreTokenValue,
  onSearchKeydown,
  onClear,
  removeTag,
  setValue,
  resetSearch,
} = useRsSelect(props, model, open, searchQuery, emit, t)

const resolvedDisabled = computed(() => props.disabled || formContext?.disabled.value || false)
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const resolvedRadius = useResolvedRsRadius(() => props.radius, 'sm')
const triggerIconSize = computed(() => RS_COMPONENT_SIZE_ICON_PX[resolvedSize.value])
const rootStyle = computed(() => ({
  '--rs-select-radius': rsRadiusCss(resolvedRadius.value),
  '--rs-select-list-height': `${props.listHeight}px`,
}))

const portalTo = computed(() => {
  if (!props.getPopupContainer) return 'body'
  const el = triggerRef.value ?? undefined
  return props.getPopupContainer(el) ?? 'body'
})

const autoMessage = ref('')
const isInvalid = computed(() =>
  Boolean(
    props.invalid ||
      props.status === 'error' ||
      (boundToItem.value && formItem?.invalid.value) ||
      autoMessage.value,
  ),
)
const isWarning = computed(() => props.status === 'warning' && !isInvalid.value)

function clearValidation(): void {
  resetSearch()
  autoMessage.value = ''
}

async function runValidate(trigger: RsFormRuleTrigger = 'submit') {
  const formRules = formContext?.getFieldRules(props.name) ?? []
  const localRules = buildLocalInputRules({ required: props.required })
  const rules = [...formRules, ...localRules]
  if (!rules.length) {
    autoMessage.value = ''
    return { valid: true as const, name: props.name }
  }
  const result = await runFormFieldRules(model.value, rules, { trigger })
  autoMessage.value = result.message ?? ''
  return { valid: result.valid, message: result.message, name: props.name }
}

useRsFormField(() => ({
  get name() {
    return props.name
  },
  getValue: () => model.value,
  setValue,
  validate: (trigger) => runValidate(trigger ?? 'submit'),
  clearValidation,
  setError: (message: string) => {
    autoMessage.value = message
  },
}))

function focus(): void {
  triggerRef.value?.focus()
}

function blur(): void {
  triggerRef.value?.blur()
  searchInputRef.value?.blur()
}

defineExpose({
  setValue,
  clearValidation,
  validate: runValidate,
  focus,
  blur,
})

type SelectRow = {
  token: string
  label: string
  disabled: boolean
  isCreate: boolean
  option?: RsSelectOption
  title?: string
}

const listRows = computed((): SelectRow[] => {
  const rows: SelectRow[] = []
  if (canCreate.value) {
    rows.push({
      token: createValue.value,
      label: createOptionLabel.value,
      disabled: false,
      isCreate: true,
    })
  }
  for (const entry of displayOptions.value) {
    if (isSelectOptionGroup(entry)) {
      for (const opt of entry.options) {
        rows.push({
          token: toComboboxValue(opt.value),
          label: opt.label,
          disabled: Boolean(opt.disabled || isOptionLimited(opt)),
          isCreate: false,
          option: opt,
          title: opt.title,
        })
      }
    } else {
      rows.push({
        token: toComboboxValue(entry.value),
        label: entry.label,
        disabled: Boolean(entry.disabled || isOptionLimited(entry)),
        isCreate: false,
        option: entry,
        title: entry.title,
      })
    }
  }
  return rows
})

const highlight = ref(0)
const virtualStart = ref(0)
const popup = ref<{
  top: number
  left: number
  width: number
  minWidth: number
  placement: RsSelectPlacement
}>({
  top: 0,
  left: 0,
  width: 0,
  minWidth: 0,
  placement: 'bottom',
})

/** 面板挂到 body 后仍跟触发器最近的 data-rs-theme（深色岛 / 混主题页）。 */
const panelTheme = ref<string | undefined>()

function syncPanelTheme(): void {
  const el = triggerRef.value ?? rootRef.value
  if (!el) {
    panelTheme.value = undefined
    return
  }
  panelTheme.value = el.closest('[data-rs-theme]')?.getAttribute('data-rs-theme') ?? undefined
}

const highlightedToken = computed(() => listRows.value[highlight.value]?.token)
const activeOptionId = computed(() =>
  open.value && highlightedToken.value ? `${listId}-${highlightedToken.value}` : undefined,
)

const virtualSlice = computed(() => {
  const all = virtualValues.value
  if (!useVirtual.value) {
    return { items: all, padTop: 0, padBottom: 0, totalH: all.length * ITEM_ESTIMATE }
  }
  const start = Math.max(0, virtualStart.value - VIRTUAL_OVERSCAN)
  const viewCount = Math.ceil(props.listHeight / ITEM_ESTIMATE) + VIRTUAL_OVERSCAN * 2
  const items = all.slice(start, start + viewCount)
  return {
    items,
    padTop: start * ITEM_ESTIMATE,
    padBottom: Math.max(0, (all.length - start - items.length) * ITEM_ESTIMATE),
    totalH: all.length * ITEM_ESTIMATE,
  }
})

const emptyVisible = computed(
  () => !props.loading && !canCreate.value && displayOptions.value.length === 0,
)

function placePopup(): void {
  const trigger = triggerRef.value
  const content = contentRef.value
  if (!trigger || !open.value) return
  const anchor = trigger.getBoundingClientRect()
  const measured = content?.getBoundingClientRect()
  const height = measured?.height || Math.min(props.listHeight, 320)
  const prefWidth = props.matchTriggerWidth
    ? anchor.width
    : Math.max(anchor.width, measured?.width || anchor.width)
  const gap = 4
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (props.placement === 'left' || props.placement === 'right') {
    const width = Math.min(prefWidth, Math.max(0, vw - gap * 2))
    const leftPos = anchor.left - width - gap
    const rightPos = anchor.right + gap
    let side: 'left' | 'right' = props.placement
    let left = side === 'left' ? leftPos : rightPos
    if (side === 'left' && leftPos < gap && rightPos + width <= vw - gap) {
      side = 'right'
      left = rightPos
    } else if (side === 'right' && rightPos + width > vw - gap && leftPos >= gap) {
      side = 'left'
      left = leftPos
    }
    left = Math.min(Math.max(gap, left), Math.max(gap, vw - width - gap))
    const top = Math.min(Math.max(gap, anchor.top), Math.max(gap, vh - height - gap))
    popup.value = { top, left, width, minWidth: anchor.width, placement: side }
    return
  }

  const box = placeAnchoredPopup(
    { top: anchor.top, left: anchor.left, height: anchor.height, width: anchor.width },
    { width: prefWidth, height },
    { width: vw, height: vh },
    gap,
  )
  if (props.placement === 'top') {
    const above = anchor.top - height - gap
    if (above >= gap) {
      popup.value = { ...box, top: above, minWidth: anchor.width, placement: 'top' }
      return
    }
  }
  popup.value = { ...box, minWidth: anchor.width }
}

let frame = 0
let overlayBound = false

function requestPlace(): void {
  if (typeof window === 'undefined') return
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    placePopup()
  })
}

function syncHighlight(): void {
  const rows = listRows.value
  const selected = rows.findIndex(
    (row) => selectedValues.value.includes(row.token) && !row.disabled,
  )
  highlight.value = selected >= 0 ? selected : stepEnabledIndex(rows, -1, 1)
}

function escapeToken(token: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(token)
  return token.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function scrollHighlightIntoView(): void {
  const token = highlightedToken.value
  if (!token) return
  const root = contentRef.value
  const el = root?.querySelector(`[data-value="${escapeToken(token)}"]`)
  if (el && 'scrollIntoView' in el) {
    ;(el as HTMLElement).scrollIntoView({ block: 'nearest' })
  }
}

function toggleOpen(): void {
  if (resolvedDisabled.value) return
  open.value = !open.value
}

function onDocPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!target) return
  if (rootRef.value?.contains(target)) return
  if (contentRef.value?.contains(target)) return
  open.value = false
}

function onWindowChange(): void {
  if (open.value) requestPlace()
}

function attachOverlay(): void {
  if (overlayBound || typeof window === 'undefined') return
  overlayBound = true
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', onDocPointerDown)
  }
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

function moveHighlight(delta: 1 | -1): void {
  highlight.value = stepEnabledIndex(listRows.value, highlight.value, delta)
  scrollHighlightIntoView()
}

function commitHighlight(): void {
  const row = listRows.value[highlight.value]
  if (!row || row.disabled) return
  pickToken(row.token)
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (resolvedDisabled.value || event.isComposing) return
  if (event.key === 'Escape') {
    if (!open.value) return
    event.preventDefault()
    open.value = false
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    moveHighlight(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    moveHighlight(-1)
    return
  }
  if (event.key === 'Home' && open.value) {
    event.preventDefault()
    highlight.value = stepEnabledIndex(listRows.value, -1, 1)
    scrollHighlightIntoView()
    return
  }
  if (event.key === 'End' && open.value) {
    event.preventDefault()
    highlight.value = stepEnabledIndex(listRows.value, listRows.value.length, -1)
    scrollHighlightIntoView()
    return
  }
  if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    commitHighlight()
    return
  }
  if (isSearchable.value) return
  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
  onTypeahead(event.key)
}

function onPanelSearchKeydown(event: KeyboardEvent): void {
  if (event.isComposing) return
  if (event.key === 'Escape') {
    event.preventDefault()
    open.value = false
    triggerRef.value?.focus()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveHighlight(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveHighlight(-1)
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(listRows.value, -1, 1)
    scrollHighlightIntoView()
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    highlight.value = stepEnabledIndex(listRows.value, listRows.value.length, -1)
    scrollHighlightIntoView()
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    if (canCreate.value) {
      onSearchKeydown(event)
      return
    }
    commitHighlight()
  }
}

let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined

function onTypeahead(key: string): void {
  typeahead += key.toLowerCase()
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => {
    typeahead = ''
    typeaheadTimer = undefined
  }, 500)
  if (!open.value) open.value = true
  const idx = listRows.value.findIndex(
    (row) => !row.disabled && row.label.toLowerCase().startsWith(typeahead),
  )
  if (idx >= 0) highlight.value = idx
}

function onViewportScroll(event: Event): void {
  emit('popupScroll', event)
  if (!useVirtual.value) return
  const el = event.target as HTMLElement
  virtualStart.value = Math.floor(el.scrollTop / ITEM_ESTIMATE)
}

function onViewportPointerOver(event: PointerEvent): void {
  const raw = event.target
  if (!(raw instanceof Element)) return
  const item = raw.closest('.rs-select__item')
  if (!item || !viewportRef.value?.contains(item)) return
  if (item.hasAttribute('data-disabled')) return
  const token = item.getAttribute('data-value')
  if (!token) return
  const idx = listRows.value.findIndex((row) => row.token === token)
  if (idx >= 0) highlight.value = idx
}

function itemState(token: string): 'checked' | undefined {
  return selectedValues.value.includes(token) ? 'checked' : undefined
}

watch(open, (isOpen) => {
  emit('dropdownVisibleChange', isOpen)
  if (isOpen) {
    virtualStart.value = 0
    syncPanelTheme()
    syncHighlight()
    attachOverlay()
    void nextTick(() => {
      requestPlace()
      if (isSearchable.value) searchInputRef.value?.focus()
      else scrollHighlightIntoView()
    })
    return
  }
  detachOverlay()
})

watch(listRows, () => {
  if (!open.value) return
  syncHighlight()
  requestPlace()
})

onMounted(() => {
  if (props.autoFocus) triggerRef.value?.focus()
})

const responsiveTagCap = ref<number | null>(null)
let tagResize: ResizeObserver | undefined

function measureResponsiveTags(): void {
  if (props.maxTagCount !== 'responsive' || !isMultiple.value) {
    responsiveTagCap.value = null
    return
  }
  const trigger = triggerRef.value
  const row = trigger?.querySelector('.rs-select__value--multiple') as HTMLElement | null
  if (!row) return
  const budget = row.clientWidth - 48
  if (budget <= 0) return
  const tags = Array.from(row.querySelectorAll<HTMLElement>('.rs-select__tag'))
  if (!tags.length) {
    responsiveTagCap.value = selectedValues.value.length
    return
  }
  let used = 0
  let fit = 0
  for (const tag of tags) {
    if (tag.classList.contains('rs-select__tag--rest')) continue
    const next = used + tag.offsetWidth + 4
    if (next > budget && fit > 0) break
    used = next
    fit += 1
  }
  responsiveTagCap.value = Math.max(1, fit)
}

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  tagResize = new ResizeObserver(() => measureResponsiveTags())
  void nextTick(() => {
    if (triggerRef.value) tagResize?.observe(triggerRef.value)
    measureResponsiveTags()
  })
})

onUnmounted(() => {
  tagResize?.disconnect()
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  detachOverlay()
})

watch(
  () => [selectedValues.value.join('\0'), props.maxTagCount, isMultiple.value] as const,
  () => void nextTick(measureResponsiveTags),
)

const shownTagTokens = computed(() => {
  if (props.maxTagCount !== 'responsive' || responsiveTagCap.value == null) {
    return visibleTagTokens.value
  }
  return selectedValues.value.slice(0, responsiveTagCap.value)
})
const shownOmittedCount = computed(() =>
  props.maxTagCount === 'responsive'
    ? Math.max(0, selectedValues.value.length - shownTagTokens.value.length)
    : omittedTagCount.value,
)

function highlightParts(label: string) {
  return splitSelectLabelHighlight(label, isSearchable.value ? searchQuery.value : '')
}

const contentStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${popup.value.top}px`,
  left: `${popup.value.left}px`,
  '--rs-select-list-height': `${props.listHeight}px`,
  '--rs-select-trigger-width': `${popup.value.minWidth || popup.value.width}px`,
  ...(props.matchTriggerWidth ? { width: `${popup.value.width}px` } : {}),
  ...props.dropdownStyle,
}))
</script>

<template>
  <div
    ref="rootRef"
    class="rs-select"
    :class="{
      'rs-select--multiple': isMultiple,
      'rs-select--searchable': isSearchable,
      'rs-select--creatable': creatable,
      'rs-select--block': block,
      [`rs-select--${resolvedSize}`]: true,
      [`rs-select--${variant}`]: true,
    }"
    :style="rootStyle"
  >
    <template v-if="name">
      <template v-if="isMultiple">
        <input
          v-for="token in selectedValues"
          :key="token"
          type="hidden"
          :name="name"
          :value="String(restoreTokenValue(token))"
        />
      </template>
      <input
        v-else
        type="hidden"
        :name="name"
        :value="hasValue ? String(restoreTokenValue(selectedValues[0]!)) : ''"
      />
    </template>

    <button
      ref="triggerRef"
      v-bind="attrs"
      :id="id"
      type="button"
      class="rs-select__trigger"
      :class="[
        classNames?.trigger,
        {
          'rs-select__trigger--invalid': isInvalid,
          'rs-select__trigger--warning': isWarning,
        },
      ]"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="activeOptionId"
      :aria-invalid="isInvalid || undefined"
      :aria-disabled="resolvedDisabled ? 'true' : undefined"
      :disabled="resolvedDisabled"
      :data-disabled="resolvedDisabled ? '' : undefined"
      :data-state="open ? 'open' : 'closed'"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <span v-if="$slots.prefix" class="rs-select__prefix">
        <slot name="prefix" />
      </span>

      <span v-if="isMultiple" class="rs-select__value rs-select__value--multiple">
        <template v-if="hasValue">
          <span
            v-for="value in shownTagTokens"
            :key="value"
            class="rs-select__tag"
          >
            <slot
              name="tag"
              :value="restoreTokenValue(value)"
              :label="tokenLabel(value)"
              :closable="true"
            >
              <span class="rs-select__tag-label">{{ truncateTagLabel(tokenLabel(value)) }}</span>
              <button
                type="button"
                class="rs-select__tag-remove"
                :aria-label="t('select.clear')"
                @pointerdown.stop
                @click="removeTag(value, $event)"
              >
                <RsIcon name="x" :size="12" />
              </button>
            </slot>
          </span>
          <span
            v-if="shownOmittedCount > 0"
            class="rs-select__tag rs-select__tag--rest"
            :title="omittedTagTitle"
          >
            <slot name="maxTagPlaceholder" :omitted="shownOmittedCount">
              {{
                typeof maxTagPlaceholder === 'function'
                  ? maxTagPlaceholder(shownOmittedCount)
                  : omittedTagLabel
              }}
            </slot>
          </span>
        </template>
        <span v-else class="rs-select__placeholder">{{ resolvedPlaceholder }}</span>
      </span>

      <span v-else class="rs-select__value">
        <span v-if="hasValue" class="rs-select__single-label">{{ singleDisplayLabel }}</span>
        <span v-else class="rs-select__placeholder">{{ resolvedPlaceholder }}</span>
      </span>

      <span class="rs-select__actions">
        <button
          v-if="clearable && hasValue && !resolvedDisabled"
          type="button"
          class="rs-select__clear"
          :aria-label="t('select.clear')"
          @pointerdown.stop
          @click="onClear"
        >
          <slot name="clearIcon">
            <RsIcon name="x" :size="14" />
          </slot>
        </button>
        <span v-if="showArrow" class="rs-select__suffix">
          <slot name="suffixIcon">
            <RsIcon name="chevron-down" :size="triggerIconSize" class="rs-select__icon" />
          </slot>
        </span>
      </span>
    </button>

    <Teleport :to="portalTo" :disabled="!open">
      <div
        v-if="open"
        :id="listId"
        ref="contentRef"
        class="rs-select__content"
        :class="[
          `rs-select__content--${resolvedSize}`,
          popupClassName,
          classNames?.popup,
          { 'rs-select__content--match-trigger': matchTriggerWidth },
        ]"
        :data-placement="popup.placement"
        :data-rs-theme="panelTheme"
        :style="contentStyle"
      >
        <slot name="dropdownRender">
          <div v-if="$slots.header" class="rs-select__panel-header">
            <slot name="header" />
          </div>

          <div v-if="isSearchable" class="rs-select__search-bar">
            <div class="rs-select__search-wrap">
              <RsIcon name="search" :size="14" class="rs-select__search-icon" aria-hidden="true" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="rs-select__search"
                :placeholder="resolvedSearchPlaceholder"
                :aria-label="resolvedSearchPlaceholder"
                autocomplete="off"
                role="searchbox"
                :aria-controls="listId"
                :aria-activedescendant="activeOptionId"
                @keydown="onPanelSearchKeydown"
              />
            </div>
          </div>

          <div v-if="loading" class="rs-select__status">
            <slot name="loading">{{ resolvedLoadingText }}</slot>
          </div>

          <div v-else-if="emptyVisible" class="rs-select__empty" role="status">
            <slot name="empty">{{ resolvedEmptyText }}</slot>
          </div>

          <div
            v-if="!loading"
            ref="viewportRef"
            class="rs-select__viewport"
            role="listbox"
            :aria-multiselectable="isMultiple ? 'true' : undefined"
            :aria-label="t('select.listbox')"
            @scroll="onViewportScroll"
            @pointerover="onViewportPointerOver"
          >
            <div
              v-if="useVirtual"
              class="rs-select__virtual"
              :style="{ height: `${virtualSlice.totalH}px` }"
            >
              <div
                :style="{
                  transform: `translateY(${virtualSlice.padTop}px)`,
                  paddingBottom: `${virtualSlice.padBottom}px`,
                }"
              >
                <div
                  v-for="token in virtualSlice.items"
                  :id="`${listId}-${token}`"
                  :key="token"
                  role="option"
                  class="rs-select__item"
                  :class="{ 'rs-select__item--create': canCreate && token === createValue }"
                  :data-value="token"
                  :data-highlighted="highlightedToken === token ? '' : undefined"
                  :data-state="itemState(token)"
                  :data-disabled="isTokenDisabled(token) ? '' : undefined"
                  :aria-selected="selectedValues.includes(token) ? 'true' : 'false'"
                  :aria-disabled="isTokenDisabled(token) ? 'true' : undefined"
                  :title="optionFromToken(token)?.title"
                  @click="pickToken(token)"
                >
                  <span class="rs-select__item-label">
                    <slot
                      name="option"
                      :option="optionOrCreate(token)"
                      :selected="selectedValues.includes(token)"
                    >
                      <template
                        v-for="(part, i) in highlightParts(
                          canCreate && token === createValue
                            ? createOptionLabel
                            : (labelMap.get(token) ?? String(token)),
                        )"
                        :key="i"
                      >
                        <mark v-if="part.highlight" class="rs-select__mark">{{ part.text }}</mark>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </slot>
                  </span>
                  <span v-if="selectedValues.includes(token)" class="rs-select__item-check">
                    <RsIcon name="check" :size="14" />
                  </span>
                </div>
              </div>
            </div>

            <template v-else>
              <div
                v-if="canCreate"
                :id="`${listId}-${createValue}`"
                role="option"
                class="rs-select__item rs-select__item--create"
                :data-value="createValue"
                :data-highlighted="highlightedToken === createValue ? '' : undefined"
                :data-state="itemState(createValue)"
                :aria-selected="selectedValues.includes(createValue) ? 'true' : 'false'"
                @click="pickToken(createValue)"
              >
                <span class="rs-select__item-label">{{ createOptionLabel }}</span>
                <span v-if="selectedValues.includes(createValue)" class="rs-select__item-check">
                  <RsIcon name="check" :size="14" />
                </span>
              </div>

              <template v-for="(entry, index) in displayOptions" :key="index">
                <div v-if="isSelectOptionGroup(entry)" class="rs-select__group" role="group" :aria-label="entry.label">
                  <div class="rs-select__group-label">
                    {{ entry.label }}
                  </div>
                  <div
                    v-for="opt in entry.options"
                    :id="`${listId}-${toComboboxValue(opt.value)}`"
                    :key="toComboboxValue(opt.value)"
                    role="option"
                    class="rs-select__item"
                    :data-value="toComboboxValue(opt.value)"
                    :data-highlighted="highlightedToken === toComboboxValue(opt.value) ? '' : undefined"
                    :data-state="itemState(toComboboxValue(opt.value))"
                    :data-disabled="opt.disabled || isOptionLimited(opt) ? '' : undefined"
                    :aria-selected="selectedValues.includes(toComboboxValue(opt.value)) ? 'true' : 'false'"
                    :aria-disabled="opt.disabled || isOptionLimited(opt) ? 'true' : undefined"
                    :title="opt.title"
                    @click="pickToken(toComboboxValue(opt.value))"
                  >
                    <span class="rs-select__item-label">
                      <slot
                        name="option"
                        :option="opt"
                        :selected="selectedValues.includes(toComboboxValue(opt.value))"
                      >
                        <template v-for="(part, i) in highlightParts(opt.label)" :key="i">
                          <mark v-if="part.highlight" class="rs-select__mark">{{ part.text }}</mark>
                          <template v-else>{{ part.text }}</template>
                        </template>
                      </slot>
                    </span>
                    <span
                      v-if="selectedValues.includes(toComboboxValue(opt.value))"
                      class="rs-select__item-check"
                    >
                      <RsIcon name="check" :size="14" />
                    </span>
                  </div>
                </div>

                <div
                  v-else
                  :id="`${listId}-${toComboboxValue(entry.value)}`"
                  :key="toComboboxValue(entry.value)"
                  role="option"
                  class="rs-select__item"
                  :data-value="toComboboxValue(entry.value)"
                  :data-highlighted="highlightedToken === toComboboxValue(entry.value) ? '' : undefined"
                  :data-state="itemState(toComboboxValue(entry.value))"
                  :data-disabled="entry.disabled || isOptionLimited(entry) ? '' : undefined"
                  :aria-selected="selectedValues.includes(toComboboxValue(entry.value)) ? 'true' : 'false'"
                  :aria-disabled="entry.disabled || isOptionLimited(entry) ? 'true' : undefined"
                  :title="entry.title"
                  @click="pickToken(toComboboxValue(entry.value))"
                >
                  <span class="rs-select__item-label">
                    <slot
                      name="option"
                      :option="entry"
                      :selected="selectedValues.includes(toComboboxValue(entry.value))"
                    >
                      <template v-for="(part, i) in highlightParts(entry.label)" :key="i">
                        <mark v-if="part.highlight" class="rs-select__mark">{{ part.text }}</mark>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </slot>
                  </span>
                  <span
                    v-if="selectedValues.includes(toComboboxValue(entry.value))"
                    class="rs-select__item-check"
                  >
                    <RsIcon name="check" :size="14" />
                  </span>
                </div>
              </template>
            </template>
          </div>

          <div v-if="$slots.footer" class="rs-select__panel-footer">
            <slot name="footer" />
          </div>
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.rs-select {
  display: inline-flex;
  width: 100%;
  max-width: 100%;
  vertical-align: middle;
  box-sizing: border-box;
}

.rs-select__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  width: 100%;
  height: var(--rs-control-height-md);
  min-height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
  border-radius: var(--rs-select-radius, var(--rs-radius-sm));
  border: 1px solid var(--rs-input-border, var(--rs-border));
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  line-height: var(--rs-line-height-tight);
  text-align: start;
  cursor: pointer;
  outline: none;
  box-shadow: var(--rs-input-shadow, none);
  transition:
    border-color var(--rs-transition-fast),
    box-shadow var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-select--multiple .rs-select__trigger {
  min-height: var(--rs-control-height-md);
  height: auto;
  padding-top: var(--rs-space-xs);
  padding-bottom: var(--rs-space-xs);
}

.rs-select--block {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  min-width: 0;
  align-self: stretch;
  box-sizing: border-box;
}

.rs-select--block .rs-select__anchor,
.rs-select--block .rs-select__trigger {
  width: 100%;
}

.rs-select--ssm .rs-select__trigger {
  height: var(--rs-control-height-ssm);
  min-height: var(--rs-control-height-ssm);
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
}

.rs-select--ssm.rs-select--multiple .rs-select__trigger {
  min-height: var(--rs-control-height-ssm);
}

.rs-select--sm .rs-select__trigger {
  height: var(--rs-control-height-sm);
  min-height: var(--rs-control-height-sm);
  padding: 0 var(--rs-space-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-select--sm.rs-select--multiple .rs-select__trigger {
  min-height: var(--rs-control-height-sm);
}

.rs-select--lg .rs-select__trigger {
  height: var(--rs-control-height-lg);
  min-height: var(--rs-control-height-lg);
  padding: 0 var(--rs-space-lg);
  font-size: var(--rs-font-size-base);
}

.rs-select--lg.rs-select--multiple .rs-select__trigger {
  min-height: var(--rs-control-height-lg);
}

.rs-select--filled .rs-select__trigger {
  border-color: transparent;
  background: var(--rs-surface-hover);
}

.rs-select--borderless .rs-select__trigger {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.rs-select__mark {
  padding: 0;
  background: color-mix(in srgb, var(--rs-primary) 22%, transparent);
  color: inherit;
  font-weight: var(--rs-font-weight-medium);
}

.rs-select__trigger:hover:not([data-disabled]):not(:disabled) {
  border-color: var(--rs-input-border-hover, var(--rs-border));
}

.rs-select__trigger:focus-visible {
  outline: none;
  border-color: var(--rs-focus-border, var(--rs-primary));
  background: var(--rs-input-bg);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px) var(--rs-focus-ring);
}

.rs-select__trigger[data-disabled],
.rs-select__trigger:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  background: var(--rs-surface-hover);
}

.rs-select__trigger--invalid {
  border-color: var(--rs-danger);
}

.rs-select__trigger--invalid:focus-visible {
  border-color: var(--rs-danger);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px)
      color-mix(in srgb, var(--rs-danger) 14%, transparent);
}

.rs-select__trigger--warning {
  border-color: var(--rs-warning);
}

.rs-select__trigger--warning:focus-visible {
  border-color: var(--rs-warning);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px)
      color-mix(in srgb, var(--rs-warning) 14%, transparent);
}

.rs-select__value {
  flex: 1;
  min-width: 0;
  text-align: start;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-select__value--multiple {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--rs-space-xs);
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
}

.rs-select__prefix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  color: var(--rs-muted);
}

.rs-select__tag--rest {
  padding-inline-end: 0.5rem;
  color: var(--rs-muted);
  background: var(--rs-surface-hover);
  border-color: var(--rs-border);
}

.rs-select__placeholder {
  color: var(--rs-placeholder);
}

.rs-select__single-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  flex: 0 0 auto;
  max-width: 10rem;
  padding: 0.125rem 0.25rem 0.125rem 0.5rem;
  border-radius: var(--rs-radius-xs);
  border: 1px solid color-mix(in srgb, var(--rs-primary) 24%, transparent);
  background: var(--rs-primary-container);
  color: var(--rs-on-primary-container);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-line-height-tight);
}

.rs-select__tag-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-select__tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  padding: 0;
  border: none;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-select__tag-remove:hover {
  color: var(--rs-on-primary-container);
  background: color-mix(in srgb, var(--rs-primary) 16%, transparent);
}

.rs-select__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
  flex-shrink: 0;
}

.rs-select__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  border-radius: var(--rs-radius-xs);
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
  transition:
    color var(--rs-transition-fast),
    background var(--rs-transition-fast);
}

.rs-select__clear:hover {
  color: var(--rs-text);
  background: var(--rs-item-hover);
}

.rs-select__suffix {
  display: inline-flex;
  align-items: center;
}

.rs-select__icon {
  color: var(--rs-muted);
  flex-shrink: 0;
  transition: transform var(--rs-transition-fast);
}

.rs-select__trigger[data-state='open'] .rs-select__icon {
  transform: rotate(180deg);
}

.rs-select__item--create .rs-select__item-label {
  color: var(--rs-primary);
  font-weight: var(--rs-font-weight-medium);
}

@media (prefers-reduced-motion: reduce) {
  .rs-select__trigger,
  .rs-select__icon,
  .rs-select__clear,
  .rs-select__tag-remove {
    transition: none;
  }

  .rs-select__trigger[data-state='open'] .rs-select__icon {
    transform: none;
  }
}
</style>
