<script setup lang="ts">
import { computed } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize } from '../theme/types'
import { useResolvedRsComponentSize } from './resolve-size'
import RsIcon from './RsIcon.vue'
import RsPopover from './RsPopover.vue'
import {
  cascaderColumns,
  cascaderDisplay,
  isCascaderLeaf,
  type RsCascaderExpandTrigger,
  type RsCascaderOption,
  type RsCascaderPath,
} from './cascader-utils'

defineOptions({ name: 'RsCascader' })

const model = defineModel<RsCascaderPath>({ default: () => [] })
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    options: readonly RsCascaderOption[]
    placeholder?: string
    disabled?: boolean
    allowClear?: boolean
    changeOnSelect?: boolean
    expandTrigger?: RsCascaderExpandTrigger
    separator?: string
    size?: RsComponentSize
  }>(),
  {
    disabled: false,
    allowClear: false,
    changeOnSelect: false,
    expandTrigger: 'click',
    separator: ' / ',
  },
)

const emit = defineEmits<{
  change: [path: RsCascaderPath]
}>()

const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const columns = computed(() => cascaderColumns(props.options, model.value))
const display = computed(() => cascaderDisplay(props.options, model.value, props.separator))

function isActive(depth: number, value: string | number): boolean {
  return String(model.value[depth] ?? '') === String(value)
}

function pick(depth: number, option: RsCascaderOption): void {
  if (option.disabled) return
  const next = [...model.value.slice(0, depth), option.value]
  model.value = next
  emit('change', next)
  if (isCascaderLeaf(option) || (props.changeOnSelect && props.expandTrigger === 'click')) {
    if (isCascaderLeaf(option)) open.value = false
  }
}

function onHover(depth: number, option: RsCascaderOption): void {
  if (props.expandTrigger !== 'hover' || option.disabled) return
  if (!isCascaderLeaf(option)) {
    model.value = [...model.value.slice(0, depth), option.value]
  }
}

function onClear(): void {
  model.value = []
  emit('change', [])
}
</script>

<template>
  <RsPopover v-model:open="open" side="bottom" align="start" width="auto">
    <button
      type="button"
      class="rs-cascader"
      :class="[`rs-cascader--${resolvedSize}`, { 'rs-cascader--disabled': disabled }]"
      :disabled="disabled"
    >
      <span v-if="display" class="rs-cascader__value">{{ display }}</span>
      <span v-else class="rs-cascader__placeholder">{{ placeholder ?? t('select.placeholder') }}</span>
      <button
        v-if="allowClear && display && !disabled"
        type="button"
        class="rs-cascader__clear"
        :aria-label="t('select.clear')"
        @click.stop="onClear"
      >
        <RsIcon name="x" :size="12" />
      </button>
      <RsIcon name="chevron-down" :size="14" class="rs-cascader__icon" />
    </button>
    <template #content>
      <div class="rs-cascader__panel" @mousedown.prevent>
        <ul v-for="(col, depth) in columns" :key="depth" class="rs-cascader__col">
          <li
            v-for="opt in col"
            :key="String(opt.value)"
            class="rs-cascader__item"
            :class="{
              'rs-cascader__item--active': isActive(depth, opt.value),
              'rs-cascader__item--disabled': opt.disabled,
            }"
            @click="pick(depth, opt)"
            @mouseenter="onHover(depth, opt)"
          >
            <span>{{ opt.label }}</span>
            <RsIcon v-if="!isCascaderLeaf(opt)" name="chevron-right" :size="12" />
          </li>
        </ul>
      </div>
    </template>
  </RsPopover>
</template>

<style scoped>
.rs-cascader {
  display: inline-flex;
  align-items: center;
  gap: var(--rs-space-sm);
  box-sizing: border-box;
  width: 100%;
  min-width: 12rem;
  height: var(--rs-control-height-md);
  padding: 0 var(--rs-space-md);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-radius-sm);
  background: var(--rs-input-bg);
  color: var(--rs-text);
  font-size: var(--rs-font-size-sm);
  cursor: pointer;
}
.rs-cascader--sm {
  height: var(--rs-control-height-sm);
}
.rs-cascader--lg {
  height: var(--rs-control-height-lg);
}
.rs-cascader--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.rs-cascader__placeholder {
  flex: 1;
  color: var(--rs-muted);
  text-align: left;
}
.rs-cascader__value {
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rs-cascader__clear,
.rs-cascader__icon {
  color: var(--rs-muted);
}
.rs-cascader__clear {
  border: 0;
  background: transparent;
  cursor: pointer;
}
.rs-cascader__panel {
  display: flex;
  min-height: 8rem;
  max-height: 16rem;
}
.rs-cascader__col {
  min-width: 8rem;
  margin: 0;
  padding: var(--rs-space-xs);
  overflow: auto;
  border-right: 1px solid var(--rs-border);
  list-style: none;
}
.rs-cascader__col:last-child {
  border-right: 0;
}
.rs-cascader__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rs-space-sm);
  padding: var(--rs-space-xs) var(--rs-space-sm);
  border-radius: var(--rs-radius-xs);
  cursor: pointer;
}
.rs-cascader__item--active,
.rs-cascader__item:hover:not(.rs-cascader__item--disabled) {
  background: var(--rs-surface-hover);
}
.rs-cascader__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
