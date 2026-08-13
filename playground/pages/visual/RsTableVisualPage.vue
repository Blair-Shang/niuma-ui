<script setup lang="ts">
/**
 * Playwright 像素回归夹具：固定数据 / 固定尺寸 / 无动画干扰。
 * 非演示页，不进入侧栏目录。
 */
import { onMounted } from 'vue'
import { RsTable, useRsConfig, type RsTableColumn } from 'niuma-ui'

interface Row {
  id: string
  name: string
  status: string
  count: number
}

const columns: RsTableColumn<Row>[] = [
  { key: 'name', title: 'Name', width: 160 },
  { key: 'status', title: 'Status', width: 100 },
  { key: 'count', title: 'Count', width: 80, align: 'right' },
]

const rows: Row[] = [
  { id: '1', name: 'Alpha', status: 'ok', count: 12 },
  { id: '2', name: 'Beta', status: 'wait', count: 7 },
  { id: '3', name: 'Gamma', status: 'ok', count: 3 },
]

const { setTheme, setLocale } = useRsConfig()

onMounted(() => {
  setTheme('light')
  setLocale('en-US')
})
</script>

<template>
  <div class="rs-visual-fixture" data-testid="rs-table-visual-root">
    <RsTable
      class="rs-visual-fixture__table"
      :columns="columns"
      :data="rows"
      row-key="id"
      :virtual="false"
      :editable="false"
      :context-menu="false"
      :cell-tooltip="false"
      :striped="true"
      bordered
      size="md"
      aria-label="Visual regression table"
    />
  </div>
</template>

<style scoped>
.rs-visual-fixture {
  box-sizing: border-box;
  width: 480px;
  padding: 16px;
  /* 降低跨 OS 字体差异 */
  font-family: Arial, Helvetica, sans-serif;
}

.rs-visual-fixture :deep(*),
.rs-visual-fixture :deep(*::before),
.rs-visual-fixture :deep(*::after) {
  animation: none !important;
  transition: none !important;
}

.rs-visual-fixture :deep(.rs-table-shell) {
  width: 100%;
}
</style>
