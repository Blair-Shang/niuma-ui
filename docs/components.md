# 组件说明

`niuma-ui` 的公开能力面。稳定导入必须来自包根入口：

```ts
import { RsButton, RsConfigProvider } from 'niuma-ui'
```

**禁止**直接从 `reka-ui` 导入，也不要依赖未文档化的深路径。

## 设计约定

1. **前缀**：公开 UI 为 `Rs*`；内部工具文件不使用此前缀（如 `table-utils.ts`）。
2. **配置根**：应用使用 `RsConfigProvider` 包裹（`theme`、`locale`、`control-size`）。
3. **Token**：使用 `--rs-*`（以及 `--rs-table-*`、`--rs-terminal-*`、`--rs-code-*`、`--rs-prose-*` 等子系统变量）。品牌覆盖见 `src/theme/brand.example.css`。
4. **排版**：字号 / 字重 / 字族只走 `--rs-font-size-*`、`--rs-font-weight-*`、`--rs-font-sans|mono|serif`。CodeMirror / Monaco / xterm 等只接受数字的 API，用 `readCssLengthPx` / `readCodeFontFamily` 从 token 读取，禁止硬编码 px 或 system 字体栈。
5. **组合**：在本仓库内封装 Reka UI 原语；浮层行为与现有 `RsDialog`、`RsPopover` 等保持一致。
6. **公开 vs 内部**：仅 `src/index.ts` 中的符号纳入 SemVer 保证。宿主确需的表格子件等可导出，但须写进下方清单。
7. **重型模块**：`RsMonacoEditor`、`RsTerminal`、表格富编辑会引入大体积依赖。官网 / 轻量后台建议薄封装按需引用（见 [consumers.md](./consumers.md)）。

## 组件清单

### 基础

| 组件 | 说明 |
|------|------|
| `RsConfigProvider` | 主题、语言、默认控件尺寸 |
| `RsIcon` | 按名称渲染 Lucide（及自定义）图标 |
| `RsContainer` | 响应式宽度 / 内边距容器 |
| `RsScrollbar` | 滚动区域 |
| `RsLoading` | 加载指示 |
| `RsEmpty` | 空状态 |
| `RsLink` | 文字链接 |
| `RsBadge` | 状态 / 数量徽标 |
| `RsTag` / `RsDynamicTags` | 标签 / 可编辑标签组 |
| `RsAvatar` | 头像 / 回退 |
| `RsLabel` | 表单标签 |
| `RsCard` / `RsStatCard` | 内容卡 / 指标卡 |
| `RsDivider` | 分隔线 |
| `RsAlert` | 反馈提示条 |
| `RsDescriptions` / `RsDescriptionsItem` | 描述列表 |
| `RsLoadingBar` | 顶栏加载进度（配合 `useRsLoadingBar`） |

### 操作与输入

| 组件 | 说明 |
|------|------|
| `RsButton` | 按钮（变体、加载、仅图标） |
| `RsCheckbox` | 复选框 |
| `RsSwitch` | 开关（`checkedValue` / `uncheckedValue` 自定义选中值） |
| `RsRadio` / `RsRadioItem` | 单选分组 |
| `RsInput` | 文本输入与校验；框内 prefix/suffix（清除在自定义 suffix 前）；框外连体 `addonBefore` / `addonAfter` |
| `RsInputNumber` | 数字输入 |
| `RsSelect` | 选择器（`string | number` / `labelInValue` / `fieldNames`、分组、搜索、远程、虚拟滚动、多选折叠、分隔符提交、选项与面板插槽） |
| `RsUpload` | 文件选择与校验辅助 |
| `RsForm` | 表单布局、`model` / NamePath、`validateMessages`、`getFieldsValue` |
| `RsFormItem` | 表单项（字段唯一注册点；`dependencies` / `help` / `extra`；对标 Form.Item） |
| `RsFormList` | 动态数组字段（`add` / `remove` / `move`，对标 Form.List） |
| `RsDatePicker` / `RsDateTimePicker` / `RsTimePicker` | 日期时间选择 |
| `RsCalendarGrid` | 日历网格原语 |
| `RsTimePickerColumns` | 时间列原语 |

### 导航与布局

| 组件 | 说明 |
|------|------|
| `RsBreadcrumb` | 面包屑 |
| `RsToolbar` | 工具条 |
| `RsTabs` | 标签页（关闭 / 重命名 / 溢出） |
| `RsSteps` | 步骤条 |
| `RsMenu` | 菜单 |
| `RsDropdown` | 下拉菜单 |
| `RsSidebar` / `RsSidebarGroup` / `RsSidebarItem` | 侧边栏 |
| `RsSplitPane` | 可拖拽分栏 |
| `RsPagination` | 分页 |
| `RsVirtualList` | 虚拟列表 |

### 浮层与反馈

| 组件 | 说明 |
|------|------|
| `RsTooltip` / `RsTooltipProvider` | 提示 |
| `RsPopover` | 气泡卡片 |
| `RsDialog` / `RsConfirmDialog` | 对话框 / 确认框 |
| `RsDrawer` | 抽屉 |
| `RsContextMenu` | 右键菜单 |
| `RsToaster` | Toast 宿主（配合 `useRsToast`） |

### 数据展示

| 组件 | 说明 |
|------|------|
| `RsTable` | 数据表（排序、选择、虚拟、编辑）；架构见 [rs-table-architecture.md](./rs-table-architecture.md)；SSR [rs-table-ssr.md](./rs-table-ssr.md)；图表 [rs-table-chart-adapter.md](./rs-table-chart-adapter.md)；像素回归 [rs-table-visual.md](./rs-table-visual.md) |
| `RsTableCellEditor` | 单元格编辑器 |
| `RsTableHeader` / `RsTableBody` / `RsTableColGroup` | 表格视图子件（ViewContext inject） |
| `RsTree` | 树（勾选、拖拽、虚拟） |
| `RsCodeBlock` | 代码块（默认只读；`editable` 可改正文；`showBar` 可隐藏工具条） |
| `RsMarkdown` | Markdown 渲染 |
| `RsProseEditor` | 富文本编辑表面 |

### 编辑器与终端（重型）

| 组件 | 说明 |
|------|------|
| `RsCodeEditor` | 基于 CodeMirror 的编辑器 |
| `RsMonacoEditor` | 基于 Monaco 的编辑器 |
| `RsTerminal` | 基于 xterm 的终端 |

## 相关导出

根入口除 Vue 组件外，还导出配套工具与类型（表格 / 树辅助、日期校验、Monaco Worker、剪贴板、主题 API、i18n 等）。请优先使用 `src/index.ts` 的具名导出，不要复制内部文件。

## 目录结构

```text
src/
  components/          # Rs*.vue + *-utils.ts
  components/table/    # 表格子模块
  composables/         # useRsConfig、useRsToast、useRsI18n 等
  theme/               # token、预设、applyTheme
  locale/              # 语言包
  monaco/              # Monaco 语言 / Worker
  icons/               # 图标注册表
  index.ts             # 仅公开 API
```

拿不准时：宿主产品需要的就导出并写入本文档；否则保持未导出。

## 演示站约定

`playground/` 是对外演示门面（非内部验收实验室）：

1. 新组件在 `playground/routes.ts` 登记 `group`、`description`（可选 `featured`）。
2. 页面使用 `DemoPage`；关键示例块用 `DemoBlock` 的 `code` 提供可复制源码。
3. 高频组件补充 `DemoPage` 的 `api` 简表（见 `ButtonPage.vue`）。
4. 本地 `pnpm dev`；生产构建 `pnpm build:playground`。
