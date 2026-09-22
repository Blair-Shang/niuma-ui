<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRsConfigOptional } from '../../../composables/useRsConfig'
import { useRsI18n } from '../../../composables/useRsI18n'
import { resolveDirMode } from '../../../locale/apply'
import { useResolvedRsComponentSize } from '../../_shared/src/resolve-size'
import RsInput from '../../input/src/RsInput.vue'
import RsSelect from '../../select/src/RsSelect.vue'
import {
  buildPaginationPagerItems,
  clampPage,
  DEFAULT_PAGE_SIZE_OPTIONS,
  getPageCount,
  getPaginationRange,
  paginationItemKey,
  resolveAdjacentPagerKey,
  resolveFocusablePagerKeys,
  resolvePaginationKeyboardMove,
  resolvePaginationSize,
  shouldHidePagination,
  type RsPaginationAlign,
  type RsPaginationItemSlot,
  type RsPaginationItemType,
  type RsPaginationPagerItem,
  type RsPaginationSize,
  type RsPaginationSummarySlot,
} from './pagination-utils'

defineOptions({ name: 'RsPagination' })

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 20 })

const props = withDefaults(
  defineProps<{
    total: number
    siblingCount?: number
    showSummary?: boolean
    showPageSize?: boolean
    showQuickJumper?: boolean
    /**
     * 是否显示跳转「确定」按钮。
     * 默认 false：回车 / 失焦跳转（对齐 Ant Design showQuickJumper 默认无 goButton）。
     */
    showJumpConfirm?: boolean
    /** 首页 / 末页按钮。默认关，避免改现有底栏密度。 */
    showFirstLast?: boolean
    /** 只显示上一页 / 当前页 / 下一页。 */
    simple?: boolean
    /** 只有一页时不渲染。 */
    hideOnSinglePage?: boolean
    pageSizeOptions?: readonly number[]
    disabled?: boolean
    size?: RsPaginationSize
    align?: RsPaginationAlign
    ariaLabel?: string
    id?: string
  }>(),
  {
    siblingCount: 1,
    showSummary: true,
    showPageSize: false,
    showQuickJumper: false,
    showJumpConfirm: false,
    showFirstLast: false,
    simple: false,
    hideOnSinglePage: false,
    pageSizeOptions: () => DEFAULT_PAGE_SIZE_OPTIONS,
    disabled: false,
    align: 'start',
  },
)

const emit = defineEmits<{
  change: [page: number, pageSize: number]
  pageSizeChange: [pageSize: number, page: number]
}>()

const { t, locale } = useRsI18n()
const config = useRsConfigOptional()
const rootRef = ref<HTMLElement | null>(null)
const jumpPageInput = ref(String(page.value))
const inheritedSize = useResolvedRsComponentSize(() => props.size)
const resolvedSize = computed(() => resolvePaginationSize(inheritedSize.value))
const writingDir = computed(() => resolveDirMode(config?.dir.value ?? 'auto', locale.value))
const pageCount = computed(() => getPageCount(props.total, pageSize.value))
const hidden = computed(() => shouldHidePagination(props.hideOnSinglePage, pageCount.value))
const range = computed(() => getPaginationRange(page.value, pageCount.value, props.siblingCount))
const pagerItems = computed(() =>
  buildPaginationPagerItems({
    page: page.value,
    pageCount: pageCount.value,
    range: range.value,
    simple: props.simple,
    showFirstLast: props.showFirstLast,
    disabled: props.disabled,
  }),
)
const focusableKeys = computed(() => resolveFocusablePagerKeys(pagerItems.value))
const summaryText = computed(() =>
  t('pagination.summary', '{total, plural, one {# item} other {# items}}', { total: props.total }),
)
const simpleText = computed(() =>
  t('pagination.simple', '{page} / {pageCount}', { page: page.value, pageCount: pageCount.value }),
)
const navLabel = computed(() => props.ariaLabel || t('pagination.label'))
const summarySlot = computed<RsPaginationSummarySlot>(() => ({
  total: props.total,
  page: page.value,
  pageSize: pageSize.value,
  pageCount: pageCount.value,
}))
const pageSizeSelectValue = computed({
  get: () => String(pageSize.value),
  set: (value: string) => {
    setPageSize(Number(value))
  },
})
const pageSizeSelectOptions = computed(() =>
  props.pageSizeOptions.map((option) => ({
    label: `${option} / ${t('pagination.page')}`,
    value: String(option),
  })),
)
const showJumper = computed(() => props.showQuickJumper && pageCount.value > 1)
const controlSize = computed(() => resolvedSize.value)
const controlRadius = 'sm' as const

watch(pageCount, (count) => {
  const next = clampPage(page.value, count)
  if (next === page.value) return
  page.value = next
  emit('change', next, pageSize.value)
})

watch(page, (value) => {
  jumpPageInput.value = String(value)
})

function setPage(next: number): boolean {
  if (props.disabled) return false
  const clamped = clampPage(next, pageCount.value)
  if (clamped === page.value) {
    jumpPageInput.value = String(clamped)
    return false
  }
  page.value = clamped
  emit('change', clamped, pageSize.value)
  return true
}

function setPageSize(next: number): boolean {
  if (props.disabled) return false
  const size = Number.isFinite(next) && next > 0 ? Math.floor(next) : pageSize.value
  const sizeChanged = size !== pageSize.value
  if (sizeChanged) pageSize.value = size
  const nextPage = clampPage(page.value, getPageCount(props.total, size))
  const pageChanged = nextPage !== page.value
  if (pageChanged) page.value = nextPage
  if (sizeChanged) emit('pageSizeChange', size, nextPage)
  if (sizeChanged || pageChanged) emit('change', nextPage, size)
  return sizeChanged
}

function goTo(next: number): boolean {
  return setPage(next)
}

function prev(): number | undefined {
  if (page.value <= 1) return undefined
  return setPage(page.value - 1) ? page.value : undefined
}

function next(): number | undefined {
  if (page.value >= pageCount.value) return undefined
  return setPage(page.value + 1) ? page.value : undefined
}

function first(): number | undefined {
  if (page.value <= 1) return undefined
  return setPage(1) ? page.value : undefined
}

function last(): number | undefined {
  if (page.value >= pageCount.value) return undefined
  return setPage(pageCount.value) ? page.value : undefined
}

function findPager(key: string): HTMLElement | null {
  return rootRef.value?.querySelector<HTMLElement>(`[data-rs-pagination="${key}"]`) ?? null
}

function focus(targetPage?: number): void {
  const key =
    targetPage != null
      ? paginationItemKey('page', clampPage(targetPage, pageCount.value))
      : paginationItemKey('page', page.value)
  const node = findPager(key) ?? findPager(focusableKeys.value[0] ?? '')
  node?.focus()
}

function activate(item: RsPaginationPagerItem): void {
  if (item.disabled || item.type === 'ellipsis' || item.type === 'simple') return
  setPage(item.page)
}

function confirmJump(): void {
  if (props.disabled) return
  const parsed = Number.parseInt(jumpPageInput.value.trim(), 10)
  if (Number.isNaN(parsed)) {
    jumpPageInput.value = String(page.value)
    return
  }
  setPage(parsed)
  jumpPageInput.value = String(page.value)
}

function itemAriaLabel(item: RsPaginationPagerItem): string | undefined {
  if (item.type === 'page') {
    return item.active
      ? t('pagination.current', 'Page {page}, current', { page: item.page })
      : t('pagination.pageN', 'Page {page}', { page: item.page })
  }
  if (item.type === 'first') return t('pagination.first')
  if (item.type === 'last') return t('pagination.last')
  if (item.type === 'prev') return t('pagination.prev')
  if (item.type === 'next') return t('pagination.next')
  return undefined
}

function defaultItemLabel(item: RsPaginationPagerItem): string {
  if (item.type === 'page') return String(item.page)
  if (item.type === 'first') return t('pagination.first')
  if (item.type === 'last') return t('pagination.last')
  if (item.type === 'prev') return t('pagination.prev')
  if (item.type === 'next') return t('pagination.next')
  if (item.type === 'simple') return simpleText.value
  return '…'
}

function slotProps(item: RsPaginationPagerItem): RsPaginationItemSlot {
  return {
    type: item.type,
    page: item.page,
    active: item.active,
    disabled: item.disabled,
  }
}

function isButton(type: RsPaginationItemType): boolean {
  return type !== 'ellipsis' && type !== 'simple'
}

function onKeydown(event: KeyboardEvent): void {
  if (props.disabled || hidden.value) return
  const target = event.target
  if (!(target instanceof HTMLElement) || !target.closest('[data-rs-pagination]')) return
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return
  if (target.closest('.rs-pagination__jumper, .rs-pagination__size')) return
  const move = resolvePaginationKeyboardMove(event.key, writingDir.value === 'rtl')
  if (move == null) return
  const nextKey = resolveAdjacentPagerKey(
    focusableKeys.value,
    target.closest<HTMLElement>('[data-rs-pagination]')?.dataset.rsPagination,
    move,
  )
  if (!nextKey) return
  event.preventDefault()
  findPager(nextKey)?.focus()
}

defineExpose({ goTo, prev, next, first, last, focus })
</script>

<template>
  <nav
    v-if="!hidden"
    :id="id"
    ref="rootRef"
    class="rs-pagination"
    :class="[
      `rs-pagination--${resolvedSize}`,
      `rs-pagination--align-${align}`,
      {
        'rs-pagination--no-jump-confirm': !showJumpConfirm,
        'rs-pagination--disabled': disabled,
        'rs-pagination--simple': simple,
      },
    ]"
    :aria-label="navLabel"
    @keydown="onKeydown"
  >
    <span v-if="showSummary" class="rs-pagination__summary">
      <slot name="summary" v-bind="summarySlot">{{ summaryText }}</slot>
    </span>
    <div class="rs-pagination__buttons">
      <template v-for="item in pagerItems" :key="item.key">
        <span
          v-if="item.type === 'ellipsis'"
          class="rs-pagination__ellipsis"
          aria-hidden="true"
        >
          <slot name="item" v-bind="slotProps(item)">…</slot>
        </span>
        <span
          v-else-if="item.type === 'simple'"
          class="rs-pagination__simple"
        >
          <slot name="item" v-bind="slotProps(item)">{{ simpleText }}</slot>
        </span>
        <button
          v-else-if="isButton(item.type)"
          type="button"
          class="rs-pagination__item"
          :class="{
            'rs-pagination__page': item.type === 'page',
            'rs-pagination__page--active': item.active,
            'rs-pagination__item--active': item.active,
          }"
          :data-rs-pagination="item.key"
          :disabled="item.disabled"
          :tabindex="item.disabled ? -1 : 0"
          :aria-current="item.active ? 'page' : undefined"
          :aria-label="itemAriaLabel(item)"
          @click="activate(item)"
        >
          <slot name="item" v-bind="slotProps(item)">{{ defaultItemLabel(item) }}</slot>
        </button>
      </template>
    </div>
    <div v-if="showJumper" class="rs-pagination__jumper">
      <span class="rs-pagination__jumper-label">{{ t('pagination.jumpTo') }}</span>
      <div class="rs-pagination__jumper-input">
        <RsInput
          v-model="jumpPageInput"
          :size="controlSize"
          :radius="controlRadius"
          :disabled="disabled"
          :show-validate-message="false"
          :aria-label="t('pagination.jumpTo')"
          @press-enter="confirmJump"
          @blur="confirmJump"
        />
      </div>
      <span v-if="t('pagination.jumpPageSuffix')" class="rs-pagination__jumper-suffix">
        {{ t('pagination.jumpPageSuffix') }}
      </span>
      <button
        v-if="showJumpConfirm"
        type="button"
        class="rs-pagination__item rs-pagination__jumper-btn"
        data-rs-pagination="confirm"
        :disabled="disabled"
        @click="confirmJump"
      >
        {{ t('pagination.jumpConfirm') }}
      </button>
    </div>
    <div v-if="showPageSize" class="rs-pagination__size">
      <RsSelect
        v-model="pageSizeSelectValue"
        :options="pageSizeSelectOptions"
        :size="controlSize"
        :radius="controlRadius"
        :disabled="disabled"
        :placeholder="t('select.placeholder')"
        block
      />
    </div>
  </nav>
</template>

<style scoped>
.rs-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: start;
  gap: var(--rs-pagination-gap);
  color: var(--rs-pagination-text);
  font-size: var(--rs-font-size-sm);
  --rs-pagination-control-height: var(--rs-control-height-md);
}

.rs-pagination--align-center {
  justify-content: center;
}

.rs-pagination--align-end {
  justify-content: end;
}

.rs-pagination--sm {
  --rs-pagination-control-height: var(--rs-control-height-sm);
  font-size: var(--rs-font-size-xs);
}

.rs-pagination--md {
  --rs-pagination-control-height: var(--rs-control-height-md);
}

.rs-pagination--lg {
  --rs-pagination-control-height: var(--rs-control-height-lg);
  font-size: var(--rs-font-size-base);
}

.rs-pagination--disabled {
  opacity: var(--rs-pagination-disabled-opacity);
}

.rs-pagination__summary,
.rs-pagination__simple {
  flex-shrink: 0;
  line-height: var(--rs-pagination-control-height);
}

.rs-pagination__buttons {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-pagination-item-gap);
}

.rs-pagination__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: var(--rs-pagination-control-height);
  height: var(--rs-pagination-control-height);
  margin: 0;
  padding-block: 0;
  padding-inline: var(--rs-pagination-item-pad-inline);
  border: 0;
  border-radius: var(--rs-pagination-radius);
  background: transparent;
  color: var(--rs-pagination-item);
  font: inherit;
  transition:
    background var(--rs-transition-fast),
    color var(--rs-transition-fast);
  line-height: 1;
  cursor: pointer;
}

.rs-pagination__item:hover:not(:disabled) {
  background: var(--rs-pagination-item-hover);
}

.rs-pagination__item:focus-visible {
  outline: var(--rs-focus-ring-width) solid var(--rs-focus-ring);
  outline-offset: 2px;
}

.rs-pagination__page--active,
.rs-pagination__item--active {
  color: var(--rs-pagination-item-active);
  font-weight: var(--rs-pagination-active-weight);
  background: transparent;
}

.rs-pagination__page--active:hover:not(:disabled),
.rs-pagination__item--active:hover:not(:disabled) {
  background: transparent;
}

.rs-pagination__item:disabled {
  cursor: not-allowed;
}

.rs-pagination__ellipsis {
  padding-inline: var(--rs-space-xs);
  color: var(--rs-pagination-ellipsis);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-pagination-control-height);
}

.rs-pagination__jumper {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-pagination-item-gap);
}

.rs-pagination__jumper-label,
.rs-pagination__jumper-suffix {
  flex-shrink: 0;
  color: var(--rs-pagination-text);
  font-size: inherit;
  line-height: var(--rs-line-height-tight);
}

.rs-pagination__jumper-input,
.rs-pagination__size {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  height: var(--rs-pagination-control-height);
  /*
   * Input / Select 按 size 读 --rs-control-height-*。
   * 四档都改写成分页控件高，跳转、每页条数与页码按钮同一条基线。
   */
  --rs-control-height-ssm: var(--rs-pagination-control-height);
  --rs-control-height-sm: var(--rs-pagination-control-height);
  --rs-control-height-md: var(--rs-pagination-control-height);
  --rs-control-height-lg: var(--rs-pagination-control-height);
}

.rs-pagination__jumper-input {
  width: var(--rs-pagination-jumper-width);
}

.rs-pagination__jumper-btn {
  flex-shrink: 0;
}

.rs-pagination__size {
  width: var(--rs-pagination-size-width);
  min-width: var(--rs-pagination-size-width);
}

@media (prefers-reduced-motion: reduce) {
  .rs-pagination__item {
    transition: none;
  }
}
</style>
