<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  provideRsFormListContext,
  useRsFormContext,
  useRsFormListContext,
  type RsFormListField,
  type RsFormListOperations,
} from './form-utils'
import { concatNamePath, type RsFormNamePath } from './form-path'

/**
 * 动态数组字段（对齐 Ant Design Form.List）。
 * 需要 Form.model；子 Item 的 name 为相对路径，会拼上 List 前缀。
 */
defineOptions({ name: 'RsFormList' })

const props = defineProps<{
  name: RsFormNamePath
}>()

const form = useRsFormContext()
const parentList = useRsFormListContext()

const prefix = computed(() => concatNamePath(parentList?.prefix.value, props.name))

provideRsFormListContext({ prefix })

const rowKeys = ref<number[]>([])
let keySeed = 0

function readList(): unknown[] {
  const raw = form?.getFieldValue(prefix.value)
  return Array.isArray(raw) ? raw : []
}

function writeList(next: unknown[]): void {
  form?.setFieldValue(prefix.value, next)
}

function syncKeys(length: number): void {
  const keys = rowKeys.value
  if (keys.length === length) return
  if (keys.length < length) {
    const next = keys.slice()
    while (next.length < length) {
      keySeed += 1
      next.push(keySeed)
    }
    rowKeys.value = next
    return
  }
  rowKeys.value = keys.slice(0, length)
}

watch(
  () => readList().length,
  (length) => {
    syncKeys(length)
  },
  { immediate: true },
)

const fields = computed<RsFormListField[]>(() =>
  readList().map((_, index) => ({
    key: rowKeys.value[index] ?? index,
    name: index,
    index,
  })),
)

const add: RsFormListOperations['add'] = (defaultValue = {}) => {
  const current = readList()
  keySeed += 1
  rowKeys.value = [...rowKeys.value, keySeed]
  writeList([...current, defaultValue])
}

const remove: RsFormListOperations['remove'] = (index) => {
  const current = readList()
  if (index < 0 || index >= current.length) return
  rowKeys.value = rowKeys.value.filter((_, i) => i !== index)
  writeList(current.filter((_, i) => i !== index))
}

const move: RsFormListOperations['move'] = (from, to) => {
  const current = readList()
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= current.length ||
    to >= current.length
  ) {
    return
  }
  const next = current.slice()
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row)
  const keys = rowKeys.value.slice()
  const [key] = keys.splice(from, 1)
  keys.splice(to, 0, key!)
  rowKeys.value = keys
  writeList(next)
}
</script>

<template>
  <div class="rs-form-list">
    <slot
      :fields="fields"
      :add="add"
      :remove="remove"
      :move="move"
    />
  </div>
</template>
