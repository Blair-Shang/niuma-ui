# RsTable SSR 指南

面向 Nuxt / Vite SSR / 自定义 `renderToString` 宿主。目标：首屏可出 HTML，水合不炸，重交互仍在客户端。

## 推荐分层

| 层 | SSR | 说明 |
|---|---|---|
| `useRsTableHeadless` | **优先** | 无 DOM；排序/筛选/选中/analytics/features 可在服务端跑 |
| `<RsTable>` 轻量只读 | 可用 | 关虚拟滚动与编辑；用于首屏表格骨架 |
| 虚拟滚动 / 行内编辑 / 右键 / Teleport tooltip | **客户端** | 依赖视口测量与浏览器 API |

```ts
// 服务端或通用逻辑
const { api } = useRsTableHeadless({
  columns: () => columns,
  data: () => rows,
  rowKey: 'id',
})
const viewRows = api.getViewRows()
```

## 组件侧建议

```vue
<RsTable
  :columns="columns"
  :data="rows"
  row-key="id"
  :virtual="false"
  :editable="false"
  :context-menu="false"
  :cell-tooltip="false"
  aria-label="订单列表"
/>
```

- `virtual` / 列虚拟：依赖 `ResizeObserver` 与容器高度，SSR 阶段请关闭或仅 CSR。  
- `editable` / `editKeyboard`：编辑器与焦点模型为客户端能力。  
- `contextMenu`：依赖指针与浮层，SSR 可关。  
- `cellTooltip`：Teleport 到 `body`，SSR 可关以免水合节点漂移。  
- 始终提供 `ariaLabel`（或依赖 i18n 默认），保证首屏 a11y 名称稳定。

## Nuxt 示例

```vue
<script setup lang="ts">
const columns = [/* ... */]
const rows = await fetchOrders() // 服务端可 await
</script>

<template>
  <ClientOnly>
    <RsTable
      :columns="columns"
      :data="rows"
      row-key="id"
      virtual
      height="480"
    />
    <template #fallback>
      <RsTable
        :columns="columns"
        :data="rows.slice(0, 20)"
        row-key="id"
        :virtual="false"
        aria-label="订单列表"
      />
    </template>
  </ClientOnly>
</template>
```

大表：fallback 渲染前 N 行只读表；`ClientOnly` 内再开虚拟滚动。

## 水合注意

1. 服务端与客户端 **同一份 `columns` / `data` 引用语义**（至少同序同 key）。  
2. 不要用仅客户端随机 `rowKey`。  
3. `layoutActive` / `viewKey` 在 keep-alive 场景由客户端驱动即可。  
4. 主题：`RsConfigProvider` 的 `theme` 应在 SSR HTML 上已写入 `data-rs-theme`，避免闪烁。

## 验证

仓库提供 SSR 冒烟：`src/__tests__/RsTable.ssr.spec.ts`（`renderToString`）。  
CI：`pnpm test:ssr`。
