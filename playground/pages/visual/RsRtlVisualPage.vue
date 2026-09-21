<script setup lang="ts">
/**
 * Playwright RTL 像素回归：逻辑属性（padding-inline / text-align:start）在 dir=rtl 下镜像。
 * 非演示页，不进入侧栏目录。
 */
import {
  RsConfigProvider,
  RsInput,
  RsMenu,
  RsPagination,
  RsTable,
  type RsMenuItems,
  type RsTableColumn,
} from 'niuma-ui'

interface Row {
  id: string
  name: string
  count: number
}

const menuItems: RsMenuItems = [
  {
    key: 'files',
    label: 'Files',
    children: [
      { key: 'docs', label: 'Documents' },
      { key: 'images', label: 'Images' },
    ],
  },
]

const columns: RsTableColumn<Row>[] = [
  { key: 'name', title: 'Name', width: 160 },
  { key: 'count', title: 'Count', width: 88, align: 'right' },
]

const rows: Row[] = [
  { id: '1', name: 'Alpha', count: 1 },
  { id: '2', name: 'Beta', count: 12 },
]
</script>

<template>
  <RsConfigProvider locale="en-US" dir="rtl" theme="light" theme-scope="local">
    <div class="rs-rtl-visual" data-testid="rs-rtl-visual-root" dir="rtl">
      <RsInput
        class="rs-rtl-visual__input"
        model-value="Query"
        prefix="ID"
        addon-after=".sql"
        :clearable="false"
      />
      <RsMenu class="rs-rtl-visual__menu" :items="menuItems" model-value="docs" />
      <RsTable
        class="rs-rtl-visual__table"
        :columns="columns"
        :data="rows"
        row-key="id"
        :virtual="false"
        :editable="false"
        :context-menu="false"
        :cell-tooltip="false"
        bordered
        size="md"
        aria-label="RTL visual table"
      />
      <RsPagination :total="1" :page="1" :page-size="10" />
    </div>
  </RsConfigProvider>
</template>

<style scoped>
.rs-rtl-visual {
  box-sizing: border-box;
  width: 520px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  font-family: Arial, Helvetica, sans-serif;
}
.rs-rtl-visual :deep(*),
.rs-rtl-visual :deep(*::before),
.rs-rtl-visual :deep(*::after) {
  animation: none !important;
  transition: none !important;
}
.rs-rtl-visual__menu {
  width: 220px;
  border: 1px solid var(--rs-border);
  border-radius: var(--rs-radius-sm);
}
.rs-rtl-visual__table :deep(.rs-table-shell) {
  width: 100%;
}
</style>
