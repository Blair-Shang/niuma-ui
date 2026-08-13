# 变更日志

本文件记录项目的重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [1.0.2] - 2026-08-13

### 新增

- `RsTable` 架构分层：`RsTableApi` / ModuleRegistry / FeatureHost、`useRsTable` 表面、`useRsTableCore` / Shell / EditLayer、ViewContext 子件与 `useRsTableHeadless`。
- `RsTable` 无障碍基线：`region` + `role=grid`、键盘漫游；`tabindex` 落在 grid 表上。
- 图表适配：`createChartSeriesTableFeature`、`mapRsTableSeriesToEChartsOption`（无 echarts 依赖）。
- CI 门禁：`test:perf` / `test:compat` / `test:ssr` / `test:dom-baseline`；Playwright 视觉回归 `test:visual`。
- 架构文档：`rs-table-architecture` / `ssr` / `chart-adapter` / `visual`。
- `RsMenu` 菜单项 token：在 `styles.css` 主题块维护默认值（`--rs-menu-item-active-fg|bg` 等），组件只消费变量；父级覆盖即可，无需 `:deep`。
- 排版 token：字号阶梯扩展至 `xl` / `2xl` / `3xl`；新增字重、字族、行高 `relaxed`。
- 文字语义 token：`--rs-text-primary|secondary|tertiary|disabled|inverse|link|link-hover`（兼容原 `--rs-text` / `--rs-muted`）。
- JS 导出：`RsFontSize` / `RsFontWeight` 与 `RS_FONT_SIZE_CSS` / `RS_FONT_WEIGHT_CSS`。
- `RsSwitch`：开关控件（Reka Switch）。
- `RsRadio` / `RsRadioItem`：单选分组。
- `RsTag` / `RsDynamicTags`：标签与可编辑标签组。
- `RsAlert`：反馈提示条。
- `RsDivider`：分隔线。
- `RsDescriptions` / `RsDescriptionsItem`：描述列表。
- `RsLoadingBar` + `useRsLoadingBar`：顶栏加载进度。

### 变更

- `RsPagination`：尺寸扩展为 `sm|md|lg`（对齐 Ant small/medium/large）；页码按钮圆角 `sm`；当前页改为文字主色高亮、无填充底；跳转输入与每页条数同档高度；`showJumpConfirm` 默认 `false`（回车/失焦跳转）。
- `RsTabs`：非激活 `TabsContent` 强制 `display: none`，避免多页内容叠层。
- 表单标签 token：`--rs-label-font-size|font-weight|line-height|color` 写入 `styles.css`（默认对齐 Ant 14px / medium / text）；`RsLabel` 与 `.rs-field__label` 共用，父级覆盖即可，无需 `:deep`。
- 表单控件高度对齐：`RsInput` / `RsSelect` / `RsInputNumber` / `RsDatePicker` 统一用 `--rs-control-height-*` 锁定 `height`，Select/DatePicker 行高改为 `tight`（与 Input 一致）。
- `RsDatePicker` 新增 `size` prop（ssm/sm/md/lg），可跟随 Form / ConfigProvider。
- `RsSwitch`：轨道高度用 `control-height * 2/3` 等 calc 推导（对齐 Ant 比例），随主题 token 缩放，不写死档位 px。
- `RsInputNumber`：恢复常规 `border` 描边（inset shadow 在部分主题下不可见）；内层仍填满外壳高度。
- `RsSelect`：默认去掉 `max-width: 20rem` 上限（改为 `max-width: 100%`），避免表单栅格里 Select 比同列 Input 窄；`block` 仍负责拉满宽度。

### 移除

- 公开组件 `RsTableHeaderRow` / `RsTableColgroup`（轻量辅助；正式路径为 `RsTableHeader` / `RsTableColGroup`）。

## [1.0.1] - 2026-08-11

### 变更

- 图标依赖由弃用的 `lucide-vue-next` 迁移为 `@lucide/vue`。
- 终端依赖由弃用的 `xterm` 迁移为 `@xterm/xterm`（配合现有 `@xterm/addon-fit`）。

### 说明

- 安装时仍可能看到 `antlr4ng-cli` 弃用提示：来自 `monaco-sql-languages` → `dt-sql-parser` 的传递依赖，待上游更新；不影响使用。

## [1.0.0] - 2026-08-11

### 新增

- 以 **Apache License 2.0** 开源发布 `niuma-ui`（npm 包名，无 scope）。
- 公开文档：中文 / 英文 README、贡献指南、行为准则、安全策略、组件清单与消费方指南。
- GitHub Issue / PR 模板、CI（`pnpm test`）与 Playground Pages 部署工作流。
- Playground 升级为对外组件演示门面（分组导航、搜索、首页快速开始、示例代码与 API 简表）。

### 变更

- 包名由 `@niuma/ui` 统一为 **`niuma-ui`**；公开 SemVer 基线为 **1.0.0**。
- 包不再标记为 `private`；消费方通过 npm / git tag / link 安装。
- `RsTable` 排序相关测试改为点击 `.rs-table__sort` 图标，与组件交互一致。

### 说明

- 1.0 之前的私有 tag（如 `v0.1.0`）仅作历史记录；新接入请依赖 `v1.0.0` 及之后版本。

[Unreleased]: https://github.com/Blair-Shang/niuma-ui/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.2
[1.0.1]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.1
[1.0.0]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.0
