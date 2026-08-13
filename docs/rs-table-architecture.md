# RsTable 架构 / 兼容矩阵 / 多表隔离

## 分层

```
RsTableApi + FeatureHost + ModuleRegistry
        ↓
useRsTableCore（数据 / 行虚拟 / analytics / features）
        ↓
useRsTableShell（列几何 / 交互 / 右键）
        ↓
useRsTableEditLayer（编辑状态机）
        ↓
ViewContext provide（实例级）
        ↓
ColGroup / Header / Body / BodyRow（纯视图 inject）
```

无头入口：`useRsTableHeadless`（只有 Core + Api + Features，无 DOM）。

## 同页多表会不会互相影响？

| 机制 | 作用域 | 多表是否串扰 |
|---|---|---|
| `provide(RS_TABLE_VIEW_KEY)` | 组件实例子树 | **否** — inject 最近祖先 |
| `provide(RS_TABLE_API_KEY)` | 组件实例子树 | **否** |
| `createRsTableFeatureHost` | 每表一个 | **否** — 贡献袋实例私有 |
| `useRsTableCore` / Shell / Edit | 每表 setup | **否** |
| `RsTableModuleRegistry` | **进程全局** | **会** — 同 AG Grid ModuleRegistry |

结论：

- 默认两个 `<RsTable>` 并排：**状态、选中、编辑、ViewContext、实例 features 完全隔离**。
- 只有调用 `RsTableModuleRegistry.register(...)` 的模块会对**所有**表生效；实例差异请用 `props.features`（同 id 覆盖全局）。

## Feature 贡献点（实例级）

- `contributeContextMenuItems`
- `contributeToolbarItems`
- `contributeOverlay`

工厂：`createContextMenuTableFeature` / `createToolbarTableFeature` / `createOverlayTableFeature` / `createAnalyticsTableFeature` / `createChartSeriesTableFeature`。

## 公开 API 兼容（`RS_TABLE_API_VERSION`）

| 版本 | 承诺 |
|---|---|
| `1.0.0` | 已有 `get*` / `set*` / 编辑命令签名不加性破坏 |
| 同主版本 | 不删除、不改语义；新增字段为可选 |
| 跨主版本 | 允许 breaking，需 bump `RS_TABLE_API_VERSION` |

加性兼容的 props/emits 继续保留；内部 composable 路径可能变，第三方勿依赖未导出的私有符号。

**自动化矩阵**（真源：`src/components/table/rs-table-compat-matrix.ts`）：

- 必选 Api 方法列表 + inline snapshot  
- `RS_TABLE_PROP_DEFAULTS` 键锁定  
- 稳定 emit 名  
- CI：`pnpm test:compat`

## 无头用法

```ts
const { api, getToolbarItems } = useRsTableHeadless({
  columns: () => columns,
  data: () => rows,
  rowKey: 'id',
  features: () => [createAnalyticsTableFeature({ onSnapshot })],
})
api.getAnalyticsSnapshot()
```

## 性能约定（不破）

- `data` / `columns` 浅层引用失效，无 deep watch  
- Feature 按 id + setup 引用签名重绑  
- 列宽拖拽 DOM 直写  
- 行 `v-memo` 保留在 Body  

门槛：`src/__tests__/perf-budgets.ts`；CI 跑 `pnpm test:perf`（`CI=true` 时预算更紧）。

## 无障碍

- 壳：`role="region"` + `aria-label`（`ariaLabel` prop / i18n `table.a11yLabel`）+ loading 时 `aria-busy`
- 表：`role="grid"` + `tabindex="0"`（复合控件聚焦）+ `aria-rowcount` / `aria-colcount`
- 行 / 格：`role="row"` / `role="columnheader"` / `role="gridcell"`；焦点格 `tabindex="0"` + `aria-selected`
- 键盘漫游（`useRsTableGridKeyboard`，只读表可用）：箭头、Home/End、Ctrl+Home/End、PageUp/PageDown  
  移动后 `scrollIntoView({ block/inline: 'nearest' })`  
  编辑快捷键仍由 `editKeyboard` 管（F2 / Enter / Tab 可编辑链 / Undo）

## 世界级差距清单

| 项 | 状态 |
|---|---|
| 分层 + Api + Feature + 无头 | 已有 |
| ViewContext 减 props / 多表隔离 | 已有 |
| a11y 基线 + Grid 键盘漫游 + 焦点滚入视口 | 已有 |
| 库无关 Chart Feature（`createChartSeriesTableFeature`） | 已有 |
| ECharts 纯映射（`mapRsTableSeriesToEChartsOption`，不拖 echarts） | 已有 |
| CI 压测门槛（`pnpm test:perf` + `perf-budgets`） | 已有 |
| 壳编排下沉（props / ShellChrome / ScrollHost / ViewBind / ApiAssemble） | 已有 |
| 兼容矩阵自动化（`pnpm test:compat`） | 已有 |
| SSR 指南 + `pnpm test:ssr` | 已有（见 [rs-table-ssr.md](./rs-table-ssr.md)） |
| DOM 结构基线（轻量视觉回归，`pnpm test:dom-baseline`） | 已有 |
| Playwright 像素回归（`pnpm test:visual`） | 已有（见 [rs-table-visual.md](./rs-table-visual.md)） |
| 图表适配说明 | 已有（见 [rs-table-chart-adapter.md](./rs-table-chart-adapter.md)） |
