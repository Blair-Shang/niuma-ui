<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'

import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize, RsRadius } from '../theme/types'
import { RS_COMPONENT_SIZE_ICON_PX } from '../theme/types'

import RsIcon from './RsIcon.vue'
import {
  isRsFormItemBoundControl,
  useRsFormContext,
  useRsFormField,
  useRsFormItemContext,
} from './form-utils'
import {
  buildLocalInputRules,
  runFormFieldRules,
  type RsFormRuleTrigger,
} from './form-rules'
import { useResolvedRsComponentSize } from './resolve-size'
import { rsRadiusCss, useResolvedRsRadius } from './resolve-radius'
import {
  isSelectOptionGroup,
  toComboboxValue,
  type RsSelectFieldNames,
  type RsSelectFilterOption,
  type RsSelectFilterSort,
  type RsSelectGetPopupContainer,
  type RsSelectModelValue,
  type RsSelectOption,
  type RsSelectOptionFilterProp,
  type RsSelectOptionsInput,
  type RsSelectPlacement,
  type RsSelectStatus,
  type RsSelectValue,
} from './select-utils'
import { useRsSelect } from './use-rs-select'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
  ComboboxVirtualizer,
} from './reka'

defineOptions({ inheritAttrs: false })

const model = defineModel<RsSelectModelValue>({ default: '' })
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
    filterOption?: RsSelectFilterOption | boolean
    optionFilterProp?: RsSelectOptionFilterProp
    maxTagCount?: number
    maxTagPlaceholder?: string | ((omitted: number) => string)
    multipleLimit?: number
    labelInValue?: boolean
    filterSort?: RsSelectFilterSort
    maxTagTextLength?: number
    maxTagTooltip?: boolean
    tokenSeparators?: string[]
    autoClearSearchValue?: boolean
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
    multiple: false,
    required: false,
    clearable: false,
    virtual: false,
    virtualThreshold: 50,
    remote: false,
    loading: false,
    matchTriggerWidth: false,
    block: false,
    optionFilterProp: 'label',
    optionLabelProp: 'label',
    labelInValue: false,
    maxTagTooltip: true,
    autoClearSearchValue: true,
    showArrow: true,
    listHeight: 256,
    placement: 'bottom',
    status: '',
  },
)

const emit = defineEmits<{
  search: [query: string]
  select: [value: RsSelectValue, option?: RsSelectOption]
  deselect: [value: RsSelectValue, option?: RsSelectOption]
  clear: []
}>()

const { t } = useRsI18n()
const attrs = useAttrs()
const formContext = useRsFormContext()
const formItem = useRsFormItemContext()
const boundToItem = computed(() =>
  isRsFormItemBoundControl(formItem, { id: props.id, name: props.name }),
)
const anchorRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null)

const {
  resolvedPlaceholder,
  resolvedSearchPlaceholder,
  resolvedEmptyText,
  resolvedLoadingText,
  isSearchable,
  labelMap,
  useVirtual,
  useManualFilter,
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
  comboboxModel,
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
  if (!props.getPopupContainer) return undefined
  const raw = anchorRef.value
  const el = raw instanceof HTMLElement ? raw : raw?.$el
  return props.getPopupContainer(el instanceof HTMLElement ? el : undefined)
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

defineExpose({
  setValue,
  clearValidation,
  validate: runValidate,
})
</script>

<template>
  <ComboboxRoot
    v-model="comboboxModel"
    v-model:open="open"
    class="rs-select"
    :class="{
      'rs-select--multiple': multiple,
      'rs-select--searchable': isSearchable,
      'rs-select--creatable': creatable,
      'rs-select--block': block,
      [`rs-select--${resolvedSize}`]: true,
    }"
    :style="rootStyle"
    :multiple="multiple"
    :disabled="resolvedDisabled"
    :ignore-filter="useManualFilter"
    :reset-search-term-on-select="autoClearSearchValue"
    open-on-click
  >
    <ComboboxAnchor ref="anchorRef" as-child>
      <ComboboxTrigger
        v-bind="attrs"
        :id="id"
        class="rs-select__trigger"
        :class="{
          'rs-select__trigger--invalid': isInvalid,
          'rs-select__trigger--warning': isWarning,
        }"
        :aria-invalid="isInvalid || undefined"
      >
        <span v-if="$slots.prefix" class="rs-select__prefix">
          <slot name="prefix" />
        </span>

        <span v-if="multiple" class="rs-select__value rs-select__value--multiple">
          <template v-if="hasValue">
            <span
              v-for="value in visibleTagTokens"
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
              v-if="omittedTagCount > 0"
              class="rs-select__tag rs-select__tag--rest"
              :title="omittedTagTitle"
            >
              <slot name="maxTagPlaceholder" :omitted="omittedTagCount">
                {{ omittedTagLabel }}
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
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal :to="portalTo">
      <ComboboxContent
        class="rs-select__content"
        :class="[
          popupClassName,
          { 'rs-select__content--match-trigger': matchTriggerWidth },
        ]"
        :style="{ '--rs-select-list-height': `${listHeight}px` }"
        align="start"
        :side="placement"
        :side-offset="4"
        position="popper"
      >
        <slot name="dropdownRender">
          <div v-if="$slots.header" class="rs-select__panel-header" @mousedown.prevent>
            <slot name="header" />
          </div>

          <div v-if="isSearchable" class="rs-select__search-bar">
            <div class="rs-select__search-wrap">
              <RsIcon name="search" :size="14" class="rs-select__search-icon" aria-hidden="true" />
              <ComboboxInput
                v-model="searchQuery"
                class="rs-select__search"
                :placeholder="resolvedSearchPlaceholder"
                auto-focus
                @keydown="onSearchKeydown"
              />
            </div>
          </div>

          <div v-if="loading" class="rs-select__status">
            <slot name="loading">{{ resolvedLoadingText }}</slot>
          </div>

          <ComboboxEmpty v-if="!loading && !canCreate" class="rs-select__empty">
            <slot name="empty">{{ resolvedEmptyText }}</slot>
          </ComboboxEmpty>

          <ComboboxViewport class="rs-select__viewport">
            <ComboboxVirtualizer
              v-if="useVirtual"
              v-slot="{ option }"
              :options="virtualValues"
              :text-content="(value) => labelMap.get(String(value)) ?? String(value)"
              :estimate-size="36"
            >
              <ComboboxItem
                :value="option"
                :disabled="isTokenDisabled(String(option))"
                :text-value="labelMap.get(String(option)) ?? String(option)"
                class="rs-select__item"
                :class="{ 'rs-select__item--create': canCreate && String(option) === createValue }"
                :title="optionFromToken(String(option))?.title"
              >
                <span class="rs-select__item-label">
                  <slot
                    name="option"
                    :option="optionOrCreate(String(option))"
                    :selected="selectedValues.includes(String(option))"
                  >
                    {{
                      canCreate && String(option) === createValue
                        ? createOptionLabel
                        : (labelMap.get(String(option)) ?? String(option))
                    }}
                  </slot>
                </span>
                <ComboboxItemIndicator class="rs-select__item-check">
                  <RsIcon name="check" :size="14" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxVirtualizer>

            <template v-else>
              <ComboboxItem
                v-if="canCreate"
                :value="createValue"
                :text-value="createValue"
                class="rs-select__item rs-select__item--create"
              >
                <span class="rs-select__item-label">{{ createOptionLabel }}</span>
                <ComboboxItemIndicator class="rs-select__item-check">
                  <RsIcon name="check" :size="14" />
                </ComboboxItemIndicator>
              </ComboboxItem>

              <template v-for="(entry, index) in displayOptions" :key="index">
                <ComboboxGroup v-if="isSelectOptionGroup(entry)" class="rs-select__group">
                  <ComboboxLabel class="rs-select__group-label">
                    {{ entry.label }}
                  </ComboboxLabel>
                  <ComboboxItem
                    v-for="opt in entry.options"
                    :key="toComboboxValue(opt.value)"
                    :value="toComboboxValue(opt.value)"
                    :disabled="opt.disabled || isOptionLimited(opt)"
                    :text-value="opt.label"
                    class="rs-select__item"
                    :title="opt.title"
                  >
                    <span class="rs-select__item-label">
                      <slot
                        name="option"
                        :option="opt"
                        :selected="selectedValues.includes(toComboboxValue(opt.value))"
                      >
                        {{ opt.label }}
                      </slot>
                    </span>
                    <ComboboxItemIndicator class="rs-select__item-check">
                      <RsIcon name="check" :size="14" />
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                </ComboboxGroup>

                <ComboboxItem
                  v-else
                  :key="toComboboxValue(entry.value)"
                  :value="toComboboxValue(entry.value)"
                  :disabled="entry.disabled || isOptionLimited(entry)"
                  :text-value="entry.label"
                  class="rs-select__item"
                  :title="entry.title"
                >
                  <span class="rs-select__item-label">
                    <slot
                      name="option"
                      :option="entry"
                      :selected="selectedValues.includes(toComboboxValue(entry.value))"
                    >
                      {{ entry.label }}
                    </slot>
                  </span>
                  <ComboboxItemIndicator class="rs-select__item-check">
                    <RsIcon name="check" :size="14" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </template>
            </template>
          </ComboboxViewport>

          <div v-if="$slots.footer" class="rs-select__panel-footer" @mousedown.prevent>
            <slot name="footer" />
          </div>
        </slot>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
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
  text-align: left;
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

.rs-select__trigger:hover:not([data-disabled]) {
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

.rs-select__trigger[data-disabled] {
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
  border-color: var(--rs-warning, #d97706);
}

.rs-select__trigger--warning:focus-visible {
  border-color: var(--rs-warning, #d97706);
  box-shadow:
    var(--rs-input-shadow, none),
    0 0 0 var(--rs-focus-ring-width, 2px)
      color-mix(in srgb, var(--rs-warning, #d97706) 14%, transparent);
}

.rs-select__value {
  flex: 1;
  min-width: 0;
  text-align: left;
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
  padding-right: 0.5rem;
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
</style>
