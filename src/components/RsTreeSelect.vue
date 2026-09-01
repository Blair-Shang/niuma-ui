<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRsI18n } from '../composables/useRsI18n'
import type { RsComponentSize } from '../theme/types'
import { useResolvedRsComponentSize } from './resolve-size'
import RsIcon from './RsIcon.vue'
import RsPopover from './RsPopover.vue'
import RsTree from './RsTree.vue'
import {
  buildTreeNodeIndex,
  getTreeLabel,
  resolveTreeFieldNames,
  type RsTreeFieldNames,
  type RsTreeNode,
} from './tree-utils'

defineOptions({ name: 'RsTreeSelect' })

const model = defineModel<string | string[]>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    treeData: RsTreeNode[]
    fieldNames?: RsTreeFieldNames
    placeholder?: string
    disabled?: boolean
    allowClear?: boolean
    multiple?: boolean
    checkable?: boolean
    searchable?: boolean
    size?: RsComponentSize
  }>(),
  {
    disabled: false,
    allowClear: false,
    multiple: false,
    checkable: false,
    searchable: false,
  },
)

const { t } = useRsI18n()
const resolvedSize = useResolvedRsComponentSize(() => props.size)
const filter = ref('')
const names = computed(() => resolveTreeFieldNames(props.fieldNames))
const index = computed(() => buildTreeNodeIndex(props.treeData, names.value))

const selectedKeys = computed(() => {
  if (Array.isArray(model.value)) return model.value.map(String)
  return model.value === '' || model.value == null ? [] : [String(model.value)]
})

const display = computed(() => {
  const labels = selectedKeys.value.map((key) => {
    const entry = index.value.get(key)
    return entry ? getTreeLabel(entry.node, names.value) : key
  })
  return labels.join(', ')
})

function onTreeUpdate(value: string | string[]): void {
  model.value = props.multiple || props.checkable ? value : value
  if (!props.multiple && !props.checkable) open.value = false
}

function onClear(): void {
  model.value = props.multiple || props.checkable ? [] : ''
}
</script>

<template>
  <RsPopover v-model:open="open" side="bottom" align="start" width="md">
    <button
      type="button"
      class="rs-tree-select"
      :class="[`rs-tree-select--${resolvedSize}`, { 'rs-tree-select--disabled': disabled }]"
      :disabled="disabled"
    >
      <span v-if="display" class="rs-tree-select__value">{{ display }}</span>
      <span v-else class="rs-tree-select__placeholder">{{ placeholder ?? t('select.placeholder') }}</span>
      <button
        v-if="allowClear && display && !disabled"
        type="button"
        class="rs-tree-select__clear"
        :aria-label="t('select.clear')"
        @click.stop="onClear"
      >
        <RsIcon name="x" :size="12" />
      </button>
      <RsIcon name="chevron-down" :size="14" />
    </button>
    <template #content>
      <div class="rs-tree-select__panel" @mousedown.prevent>
        <input
          v-if="searchable"
          v-model="filter"
          class="rs-tree-select__search"
          :placeholder="t('select.searchPlaceholder')"
        />
        <RsTree
          :model-value="multiple || checkable ? selectedKeys : (selectedKeys[0] ?? '')"
          :nodes="treeData"
          :field-names="fieldNames"
          :multiple="multiple"
          :checkable="checkable"
          :filter="filter"
          highlight
          default-expand-all
          @update:model-value="onTreeUpdate"
        />
      </div>
    </template>
  </RsPopover>
</template>

<style scoped>
.rs-tree-select {
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
.rs-tree-select--sm {
  height: var(--rs-control-height-sm);
}
.rs-tree-select--lg {
  height: var(--rs-control-height-lg);
}
.rs-tree-select--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.rs-tree-select__placeholder {
  flex: 1;
  color: var(--rs-muted);
  text-align: left;
}
.rs-tree-select__value {
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rs-tree-select__clear {
  border: 0;
  background: transparent;
  color: var(--rs-muted);
  cursor: pointer;
}
.rs-tree-select__panel {
  max-height: 18rem;
  padding: var(--rs-space-xs);
  overflow: auto;
}
.rs-tree-select__search {
  box-sizing: border-box;
  width: 100%;
  margin-bottom: var(--rs-space-xs);
  padding: var(--rs-space-xs) var(--rs-space-sm);
  border: 1px solid var(--rs-input-border, var(--rs-border));
  border-radius: var(--rs-radius-xs);
  background: var(--rs-input-bg);
  color: var(--rs-text);
}
</style>
