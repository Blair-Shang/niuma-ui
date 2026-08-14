<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RsButton from './RsButton.vue'
import RsInput from './RsInput.vue'
import RsSelect from './RsSelect.vue'
import { clampPage, DEFAULT_PAGE_SIZE_OPTIONS, getPageCount, getPaginationRange } from './pagination-utils'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize } from '../theme/types'

/**
 * 分页尺寸（对齐 Ant Design Pagination：small / medium / large）。
 * 不提供 ssm：页码按钮过小不利于点击。
 */
export type RsPaginationSize = Extract<RsComponentSize, 'sm' | 'md' | 'lg'>

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
    pageSizeOptions?: readonly number[]
    disabled?: boolean
    size?: RsPaginationSize
  }>(),
  {
    siblingCount: 1,
    showSummary: true,
    showPageSize: false,
    showQuickJumper: false,
    showJumpConfirm: false,
    pageSizeOptions: () => DEFAULT_PAGE_SIZE_OPTIONS,
    disabled: false,
    size: 'md',
  },
)

const { t } = useRsI18n()
const jumpPageInput = ref(String(page.value))
const pageCount = computed(() => getPageCount(props.total, pageSize.value))
const range = computed(() => getPaginationRange(page.value, pageCount.value, props.siblingCount))
const summaryText = computed(() => t('pagination.summary', 'Total {total} items').replace('{total}', String(props.total)))
const pageSizeSelectValue = computed({
  get: () => String(pageSize.value),
  set: (value: string) => {
    pageSize.value = Number(value)
  },
})
const pageSizeSelectOptions = computed(() =>
  props.pageSizeOptions.map((option) => ({
    label: `${option} / ${t('pagination.page')}`,
    value: String(option),
  })),
)
const showJumper = computed(() => props.showQuickJumper && pageCount.value > 1)
/** 页码按钮用 sm 圆角，避免 Button 默认 full 胶囊 */
const controlRadius = 'sm' as const
const controlSize = computed(() => props.size)

watch(pageCount, (count) => {
  page.value = clampPage(page.value, count)
})

watch(page, (value) => {
  jumpPageInput.value = String(value)
})

function go(next: number): void {
  if (props.disabled) return
  page.value = clampPage(next, pageCount.value)
}

function confirmJump(): void {
  if (props.disabled) return
  const parsed = Number.parseInt(jumpPageInput.value.trim(), 10)
  if (Number.isNaN(parsed)) {
    jumpPageInput.value = String(page.value)
    return
  }
  go(parsed)
  jumpPageInput.value = String(page.value)
}
</script>

<template>
  <nav
    class="rs-pagination"
    :class="[`rs-pagination--${size}`, { 'rs-pagination--no-jump-confirm': !showJumpConfirm }]"
    :aria-label="t('pagination.label')"
  >
    <span v-if="showSummary" class="rs-pagination__summary">
      {{ summaryText }}
    </span>
    <div class="rs-pagination__buttons">
      <RsButton
        variant="ghost"
        :size="controlSize"
        :radius="controlRadius"
        :disabled="disabled || page <= 1"
        @click="go(page - 1)"
      >
        {{ t('pagination.prev') }}
      </RsButton>
      <template v-for="(item, index) in range" :key="`${item}-${index}`">
        <span v-if="item === 'ellipsis'" class="rs-pagination__ellipsis">...</span>
        <RsButton
          v-else
          variant="text"
          :tone="item === page ? 'primary' : 'neutral'"
          :size="controlSize"
          :radius="controlRadius"
          class="rs-pagination__page"
          :class="{ 'rs-pagination__page--active': item === page }"
          :disabled="disabled"
          @click="go(item)"
        >
          {{ item }}
        </RsButton>
      </template>
      <RsButton
        variant="ghost"
        :size="controlSize"
        :radius="controlRadius"
        :disabled="disabled || page >= pageCount"
        @click="go(page + 1)"
      >
        {{ t('pagination.next') }}
      </RsButton>
    </div>
    <div v-if="showJumper" class="rs-pagination__jumper">
      <span class="rs-pagination__jumper-label">{{ t('pagination.jumpTo') }}</span>
      <div class="rs-pagination__jumper-input">
        <RsInput
          v-model="jumpPageInput"
          :size="controlSize"
          :radius="controlRadius"
          :disabled="disabled"
          @press-enter="confirmJump"
          @blur="confirmJump"
        />
      </div>
      <span v-if="t('pagination.jumpPageSuffix')" class="rs-pagination__jumper-suffix">
        {{ t('pagination.jumpPageSuffix') }}
      </span>
      <RsButton
        v-if="showJumpConfirm"
        variant="ghost"
        :size="controlSize"
        :radius="controlRadius"
        class="rs-pagination__jumper-btn"
        :disabled="disabled"
        @click="confirmJump"
      >
        {{ t('pagination.jumpConfirm') }}
      </RsButton>
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
  gap: var(--rs-space-sm);
  color: var(--rs-muted);
  font-size: var(--rs-font-size-sm);
  /*
   * 跳转输入 / 每页条数与页码按钮同档高度（随 size）。
   * 高度走 token；仅用属性选择器对齐外壳，避免业务 :deep 改控件内部。
   */
  --rs-pagination-control-height: var(--rs-control-height-md);
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
.rs-pagination__summary {
  flex-shrink: 0;
  line-height: var(--rs-pagination-control-height);
}
.rs-pagination__buttons {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
}
/* 当前页：仅主色文字高亮，无填充底（对齐部分 Ant / Element 轻量分页） */
.rs-pagination__buttons :deep(.rs-pagination__page--active) {
  font-weight: var(--rs-font-weight-semibold);
  background: transparent !important;
  box-shadow: none;
}
.rs-pagination__buttons :deep(.rs-pagination__page--active:hover:not(:disabled)),
.rs-pagination__buttons :deep(.rs-pagination__page--active:active:not(:disabled)) {
  background: transparent !important;
}
.rs-pagination__ellipsis {
  padding: 0 var(--rs-space-xs);
  font-size: var(--rs-font-size-xs);
  line-height: var(--rs-pagination-control-height);
}
.rs-pagination__jumper {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-xs);
}
.rs-pagination__jumper-label,
.rs-pagination__jumper-suffix {
  flex-shrink: 0;
  color: var(--rs-muted);
  font-size: inherit;
  line-height: var(--rs-line-height-tight);
}
.rs-pagination__jumper-input {
  width: 3rem;
}
.rs-pagination__jumper-input :deep(.rs-input-group) {
  width: 100%;
  height: var(--rs-pagination-control-height);
  min-height: var(--rs-pagination-control-height);
  box-sizing: border-box;
}
.rs-pagination__jumper-btn {
  flex-shrink: 0;
}
.rs-pagination__size {
  width: 7.25rem;
  min-width: 7.25rem;
}
.rs-pagination__size :deep(.rs-select__trigger) {
  width: 100%;
  height: var(--rs-pagination-control-height);
  min-height: var(--rs-pagination-control-height);
  box-sizing: border-box;
}
</style>
