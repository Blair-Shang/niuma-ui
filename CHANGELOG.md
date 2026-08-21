# 变更日志

本文件记录项目的重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [1.1.7] - 2026-08-21

### 新增

- `RsDatePicker` / `RsCalendarGrid`：面板标题两侧增加上一年 / 下一年双箭头，月份仍用单箭头前后切换。

### 变更

- `RsInput`：清除按钮与密码显隐按钮 `tabindex="-1"`，Tab 只停在输入框（对齐 `RsInputNumber` 步进按钮）；鼠标点击与 `aria-label` 不变。

## [1.1.6] - 2026-08-20

### 变更

- `package.json` 增加 `sideEffects`（仅 CSS）：宿主从入口 barrel 按需导入时，可摇掉未使用的 Monaco / Terminal / CodeMirror。按文档具名导入并引入 `niuma-ui/styles.css` 的用法不受影响。

## [1.1.5] - 2026-08-19

### 修复

- 命令式 `rsConfirm` / `openRsDialog`：销毁改为幂等，并在测试收尾走正规 `unmount`（不再先拆 Teleport 节点）。避免 Vue 卸载时 `nextSibling` 未处理异常导致 CI 失败。

## [1.1.4] - 2026-08-19

### 新增

- `RsDialog`：`layout="form"` 作为居中轻量表单/说明窗的正式布局；`layout="confirm"` 仍可用，开发环境继续警告并视作 form 的历史别名。确认/提示请用 `RsConfirmDialog` / `rsConfirm`。
- `RsSelect.fillSearchWithValue`：打开下拉时把当前选中项写入搜索框并参与过滤（默认 `false`，搜索框保持空白）。
- **RsIcon `postgres`**：PostgreSQL 官方大象品牌图标，token `--rs-icon-postgres-accent`。
- `MONACO_POSTGRESQL_LANGUAGE`（`postgresql`）：官方 PostgreSQL 的 Monaco languageId，走 Bridge LSP；`RsMonacoEditor` 对 postgresql / clickhouse / sqlite / sqlserver / oracle 同样不再注册实例级补全。
- `RsTerminal`：`selectionChange` 事件；expose `getSelection` / `hasSelection` / `getGeometry` 与类型 `RsTerminalExpose` / `RsTerminalGeometry`。
- `src/dev/vite-xterm-deps.ts`：供宿主 Vite `optimizeDeps` 预构建 xterm，避免控制台首次加载 504。

### 变更

- `RsSelect`：`filterOption` 默认 `true`（修复 Vue 把 boolean 联合类型当成 Boolean prop，未传入即 `false`、可搜索列表永远不过滤）。
- `RsSelect`：`searchable` 一律走本地过滤并关掉 Reka 内置 filter，避免手输关键字时匹配项被挡住。
- `RsTerminal`：`inheritAttrs: false`，`class` / `style` 落到 `.rs-terminal`；`wheelScrollModifier="shift"` 仅在备用屏（vim/top）把滚轮转成方向键，普通 shell 滚历史。
- `RsTableColumn.tooltip`：只写格子里看不到的额外提示；可见文本被截断时用 `ellipsis`。
- `RsMonacoEditor`：当前行高亮改为整行 `line`（不再只画 gutter）。

### 修复

- `RsTable`：自定义 slot + `ellipsis` 也能挂溢出 tooltip；slot 不再 `max-width: 100%` 导致溢出检测失效。
- `RsTable` 共享 tooltip：z-index 改为 `--rs-z-dropdown`；`findTipHost` 兼容文本节点，避免悬停到文字时丢宿主。
- `RsTerminal`：宿主负字距不再让 xterm 行尾被裁；xterm 6 空 viewport 滚动条不再挡住最后一列；滑块对齐 RsScrollbar；flex 项 `min-width: 0` 以便列数随容器收缩。

## [1.1.3] - 2026-08-14

### 新增

- **RsDrawer 内边缘拖拽缩放**：默认 `resizable`（`size=full` 除外）。左右改宽、上下改高，可配 `minSize` / `maxSize`，支持键盘方向键。

### 修复

- **RsDrawer 贴边定位**：覆盖 Reka DialogContent 默认居中，避免抽屉被压成标题条。

## [1.1.2] - 2026-08-14

### 修复

- **RsIcon 在 pnpm/npm 宿主中为空**：不再用 `import.meta.glob` 扫 `node_modules/@lucide/vue`（该路径在 pnpm 虚拟 store 下不存在）。改为 `import * as LucideVue from '@lucide/vue'`，走正常包解析，宿主安装 `niuma-ui` 即可使用图标。

## [1.1.1] - 2026-08-14

### 修复

- `RsTableCellEditor`：单元格 Select 的 `update:model-value` 对齐 `RsSelectModelValue`（含 number / 多选 / labelInValue）。
- `useRsTableCore`：`compact` / `size` 为 undefined 时回退默认值，避免宿主 `vue-tsc` 失败。
- `useRsTableHeadless`：`rowKey` 区分无参 getter 与行访问器，避免误当成需传入 row 的函数调用。

## [1.1.0] - 2026-08-14

### 新增

- `RsFormItem`：对标 Ant Design Form.Item / Element `ElFormItem`。声明 `name` 后成为字段唯一注册点；内置 `RsInput` 等在 Item 内不再重复注册。支持 `help` / `extra` / `validateStatus` / `#label` / `noStyle`。
- `RsForm.model`、NamePath（`user.email`）、`getFieldsValue` / `setFieldsValue` / `scrollToField`、`validateMessages`。
- `RsFormList`：动态数组字段（`add` / `remove` / `move`），子 Item 相对 name 自动拼前缀。
- `RsFormItem.dependencies`：依赖字段变化时重校验；`validator(value, { getFieldValue, getFieldsValue })` 可读整表。
- `RsSwitch.checkedValue` / `uncheckedValue`：自定义打开/关闭写入 v-model 的值（默认 `true` / `false`，既有 boolean 用法不变）。
- `RsDatePicker` / `RsDateTimePicker`：`valueFormat` 对齐 Element Plus / Ant Design Vue——展示仍为墙钟，绑定可选用 `string`（默认）、`timestamp`、`iso`（本地偏移 RFC3339），或任意 dayjs 模板。`iso` 空值为 `null`。
- `RsSelect`：`option.value` / `v-model` 支持 `string | number`（数字 `0` 可回显）；`filterOption` / `optionFilterProp` / `filterSort`；多选 `maxTagCount` / `maxTagTextLength` / `multipleLimit` / `tokenSeparators`；`labelInValue`；`fieldNames` / `optionLabelProp`；`v-model:searchValue`；`listHeight` / `placement` / `popupClassName` / `status` / `showArrow` / `getPopupContainer`；事件 `select` / `deselect` / `clear`；插槽 `#prefix` `#option` `#tag` `#header` `#footer` `#dropdownRender` `#suffixIcon` `#clearIcon` `#empty` `#loading`。选择逻辑抽到 `use-rs-select.ts`。
- `RsInput`：框内 affix 顺序固定为字数 / 清除 / 密码显隐 / 自定义 `suffix`；新增框外连体 `addonBefore` / `addonAfter`（及同名插槽）；IME `compositionstart/end` 期间不触发校验与 `pressEnter`。
- `RsInput.addonAfterIcon` / `addonAfterIconLabel` / `addonAfterClick`：选择器等后置图标按钮走连体 `addonAfter`，由组件自绘；连体外壳统一外边框，避免 input/addon 拼缝。
- `hasByNamePath`：判断 NamePath 是否已存在于对象树（含叶子为 null / undefined）。
- 排版子系统 token：`--rs-font-serif`、`--rs-code-font-*`、`--rs-prose-font-*`、`--rs-terminal-font-*`。JS 导出 `readCssVar` / `readCssLengthPx` / `readCodeFontFamily` / `readTerminalFontFamily` 等，供 Monaco / xterm 读取。

### 变更

- Form 校验 / `resetFields` 只收集带 `name` 的字段（无 name 不进字段表，避免弹层搜索框误校验）。请给控件加 `name` 或包 `RsFormItem`。
- 封装开源组件排版对齐 token：CodeMirror / Monaco / xterm / marked / vue-sonner 不再硬编码字体栈或 px。`RsTerminal` 未传 `fontFamily` / `fontSize` / `fontWeight` 时改为读 CSS token（默认 `--rs-font-size-sm` / regular，不再写死 13px / 300）。组件字重改为 `--rs-font-weight-*`。
- `.rs-field--label-left`：有 `--rs-field-label-width` 时固定标签列宽（不再 `max-content` 撑开），栅格内控件起点对齐；过长标签省略。
- `RsFormItem`：子控件已绑定 v-model 时不再覆盖（避免 switch 的 Y/N 被注入成非 boolean）。
- `RsDatePicker` / `RsTimePicker` / `RsSelect`：校验失败时红框画在 trigger 上（与 `RsInput` 一致）。未声明的 attrs（`class` / `style` / `aria-*`）同样落到 trigger；`v-model` 与事件签名不变。
- `RsTooltip` / `RsTooltipProvider`：默认开启 `ignoreNonKeyboardFocus`（仅 `:focus-visible` 因焦点打开 tip），避免 Dialog/Popover 关闭回焦后误开提示；悬停与键盘聚焦行为不变。
- `RsInputNumber` / `RsTabs`：用 `v-on` 条件对象绑定 `wheel`（避免 `@wheel="cond ? fn : undefined"` 被编译成常驻包装函数仍挂非 passive 监听）；Tabs 导航 `@scroll` 改为 passive。

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

[Unreleased]: https://github.com/Blair-Shang/niuma-ui/compare/v1.1.7...HEAD
[1.1.7]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.7
[1.1.6]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.6
[1.1.5]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.5
[1.1.4]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.4
[1.1.3]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.3
[1.1.2]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.2
[1.1.1]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.1
[1.1.0]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.1.0
[1.0.2]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.2
[1.0.1]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.1
[1.0.0]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.0
