# 变更日志

本文件记录项目的重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]


## [2.1.4] - 2026-09-23

### 变更

- 文档站：组件页和指南页共用 `site-doc` 文章样式（眉题、标题、导语、小节）。演示、代码块、API / Token 表、翻页和首页卡片的圆角与底色走 `--site-panel-radius` / `--site-panel-bg`，暗色不再单独换成抬升表面。文档区背景跟首页画布，网格线走 `--site-home-grid`；暗色画布用 `--rs-bg`，网格为浅色细线。

## [2.1.3] - 2026-09-22

### 变更

- 颜色主题：`applyColorTheme` / `clearColorTheme`。主题包只覆盖 `RS_COLOR_THEME_VARS` 里的语义 `--rs-*`，并标记 `data-rs-color-theme`。明暗仍是 `data-rs-theme="light|dark"`。同一明暗下更换皮肤时，代码编辑器、Monaco、终端和代码块会重读 token。文档站「主题定制」有可切换的演示。

## [2.1.2] - 2026-09-22

### 修复

- 对话框里的代码块「复制」没有写入剪贴板。临时输入框原先挂在 `body` 上，打开的 `dialog` 不会把焦点交出去，报文和 Header 点复制没有效果。现在挂在当前对话框内，并在点击当下同步复制。只读代码块改为 `readOnly`，正文仍可选、可复制。

## [2.1.1] - 2026-09-22

### 修复

- `RsDialog` / `RsConfirmDialog`：关闭时不挂 Teleport，打开时再解析 `teleportTo`。1.x 的 Reka 只在打开时传送；2.x 若在组件挂载时就解析，宿主在 `onMounted` 才创建的挂载点会被记成 null，再次打开会在空节点上更新。
- 开发时宿主插件对纯再导出再跟一层。`isRsBrandIconName` 改写到 `icons/brand.ts`，不再经过 `icons/registry.ts`，具名导入不会把 Lucide 全库一起求值。导出表在进程启动时建立；遇到尚未收录的运行时导出会重读一次，避免长开的 dev server 对新增导出回 500。

### 变更

- `RsIcon`：业务用 `registerRsIcon(name, component)` 登记自己的 kebab-case 图标。页签、菜单、树、右键的 `icon` 字符串可以引用。内置 Lucide 名和品牌 mark 不能被盖掉。这个登记模块不引入 Lucide。
- `RsTabs`：`draggable` 仍整项可拖。`showDragHandle` 默认改为 `false`，不再默认画出六点 grip（与 1.x 一致）。要图标时显式传 `showDragHandle`。
- `RsDialog`：可拖动的窗口对话框改挂到 `body`。业务挂载点常有 `overflow: hidden`，拖出后背景会被裁掉。全屏逻辑不变。KeepAlive 切走页签时卸掉 body 上的浮层，并放开滚动锁、inert 和 document 监听，回到该页再占上。

## [2.1.0] - 2026-09-22

### 变更

- 去掉 `reka-ui`。`RsConfigProvider` 不再包一层 Reka `ConfigProvider`。`theme` / `locale` / `dir` / `controlSize` / `controlRadius` / `themeScope` 语义不变；语言和书写方向仍由 `applyLocale` 写到 `document` 或 Provider 根节点。
- 文档站版本改为读取 `package.json`。推送 `v*` 标签时与 npm 发布同一提交重新部署 GitHub Pages。
- `RsButton` 轮廓描边改跟 `--rs-input-border`。亮色不再用 `#6e6e73`，暗色不再用 `#a3a3a3`。
- `RsButton`：未传 `bordered` 回到 `false`（与 2.0.3 之前一致）。要描边须显式传 `bordered`。

## [2.0.9] - 2026-09-22

### 变更

- `RsTable`：原先就不引用 Reka。`data` / 排序 / 选择 / 虚拟滚动 / 编辑 / 树表 / 右键语义不变。补组件名。`nullLabel` 未传时走 `table.nullValue`。默认字符串排序和筛选跟当前 locale（`localeCompare` / `toLocaleLowerCase`）；列上的 `sorter` 仍由宿主比较。颜色改跟 `--rs-surface` / `--rs-text-primary` / `--rs-border`，高对比会跟着走。选中色条、列拖放线和展开箭头在 RTL 转向。减少动态时外壳挂 `rs-motion-reduce`。单元格日期失焦提交的定时器在卸载时清掉；滚动布局卸载时作废尚未写回的帧并断开 ResizeObserver。列宽拖拽仍在松开和卸载时摘掉 document 监听。`subscribeAnalytics` 返回的取消函数不调用会留到表格卸载。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，并补排序、勾选、筛选、空态、虚拟、插槽、合计、分组、右键、实例 API、主题和键盘。
- `RsTree`：原先就不引用 Reka。`v-model` / `v-model:expandedKeys` / `v-model:checkedKeys` / `v-model:halfCheckedKeys` / 勾选、拖拽、过滤、懒加载、虚拟滚动与 `expandAll` / `collapseAll` / `expandNode` / `collapseNode` / `focusNode` 语义不变。补 `disabled`（含 Form.disabled）/ `ariaLabel` / `id`、`#icon` / `#empty`、`focus()` / `scrollToKey()` / `getSelectedKeys()` / `getCheckedKeys()` / `getExpandedKeys()` / `getHalfCheckedKeys()` 与公开类型 `RsTreeExpose` / `RsTreeInstance`。未传 `size` 跟 Form / ConfigProvider。树是一个 Tab 停靠点（`aria-activedescendant`）；方向键在 RTL 对调；字符前缀跳转，输入法组合键不抢；`*` 展开当前层已加载的兄弟。`aria-setsize` / `aria-posinset` 按兄弟计。半选写到 checkbox 的 `indeterminate`。过滤与高亮用 `toLocaleLowerCase`。虚拟列表按行号滚动，不再依赖未挂载的行节点。`virtual` 开关时成对连接 / 断开 ResizeObserver；`loadData` 在卸载后不再改展开；输入跳转定时器卸载时清掉。行引用离开窗口就从 Map 删除。开发环境在虚拟滚动开启时 `console.info` 一行（节点数、视口高度），未开启不打印。名称走 `tree.*`。高亮、拖入和勾选标记走 `--rs-tree-highlight-bg` / `--rs-tree-drop-inside-bg` / `--rs-tree-check-fg`，间距用逻辑属性，减少动态时关掉过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsMonacoEditor`：补 `contextMenu`（默认开，仍是 Monaco 原生右键）和 `contextmenu`（行、列、选中文本、指针坐标）。关掉后不再弹出原生菜单，并拦住浏览器菜单；事件仍发，监听随编辑器释放。`options.contextmenu` 不盖过这个开关。
- `RsContextMenu`：打开和子菜单先按实测尺寸摆好再淡入。未摆好前不显示，避免边缩放边改 `top` / `left` 时跳动。上下移动高亮只更新条目列表，不再重测面板，层节点的 ref 保持同一个函数。
- `RsTerminal`：原先就不引用 Reka。`data` / `write` / `resize` / 右键项 / `inputEnabled` / 搜索 / `copyOnSelect` / `minimumContrastRatio` 语义不变。补 `cursorStyle` / `screenReaderMode` / `openLinks` / `rescaleOverlappingGlyphs`（默认开，便于 GB18030 歧义宽度）/ `ariaLabel` / `id`，以及 `titleChange` / `bell` / `link`。http(s) 与 mailto 新开标签并带 noopener，`javascript:` 与 `data:` 忽略。`inputEnabled` 为 false 时关掉 stdin。画面 `dir=ltr`。`themeMode=auto` 跟最近的 `data-rs-theme`，颜色从宿主继承的 token 来。多个实例共用一个主题观察器，最后一个卸载才断开。卸载同时摘掉 ResizeObserver、滚轮、减少动态监听和 xterm 订阅；首次 fit 还在等字体时卸载，之后不再挂观察器。搜索插件只在 `searchEnabled` 时加载。没有匹配时搜索框说明走 `terminal.searchEmpty`，输入法组合中的 Enter 不跳下一条。名称走 `terminal.label`。外壳阴影走 `--rs-shadow-sm`，搜索焦点环走 `--rs-focus-*`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。

## [2.0.8] - 2026-09-22

### 变更

- `RsLog`：原先就不引用 Reka。`v-model:lines` / `v-model:search` / `v-model:levels` / `text` / 高度、虚拟、折行、级别推断、`inferMarkers`、`maxLines`、`follow`、`live`、复制与 `append` / `clear` / `scrollTo*` 语义不变。补 `id`。展示、搜索、复制和级别推断去掉 ANSI，`getLines().text` 仍是源文本，并多了 `plain`。工具条跟页面书写方向，正文默认 `dir=ltr`。贴底被上滚或框选打断时出现「回到最新」，并带新增行数；搜索显示匹配条数，Enter / Shift+Enter 在匹配行之间移动（输入法组合键不抢）。级别名和时间也能被当前 locale 搜到。`Intl.DateTimeFormat` 与标识正则各最多缓存 24 / 64 个。字符串 `append` 只按行裁剪，不再为了 `maxLines` 整段归一化。虚拟列表用稳定 key，窗口滑动时同一行不换键。高亮每行只算一次。复制定时器在卸载时清掉，剪贴板若在卸载后返回不再排新定时器。没有 window 监听，也没有 ResizeObserver。名称走 `log.*`。描边、级别色和当前行色条走 `--rs-log-*`，色条在逻辑起点。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsMarkdown`：原先就不引用 Reka。`v-model` / `v-model:mode` / `readonly` / `height` / `placeholder` / `theme` / `rounded` / `showModeToggle` / `breaks` / `disabled` 语义不变；readonly 仍强制预览并隐藏模式条。补 `ariaLabel` / `id` 与 `focus()`。模式条是原生 tablist（方向键 / Home / End，RTL 左右对调）。外链（http(s)、mailto、tel）仍新开标签并带 noopener；锚点、站内路径和相对路径留在当前页。图片增加站内路径，并拒绝 SVG data URL。标题带稳定 id，代码块 `dir=ltr`。编辑模式不解析；预览击键约 32ms 合并，切模式立即解析，定时器在卸载和停用时清掉。主题岛上的 MutationObserver 同样在卸载和停用时断开。`theme=light|dark` 写到根的 `data-rs-theme`。描边与表面走 `--rs-markdown-*`，间距用逻辑属性。文案走 `markdown.*`。无 window 时 `renderMarkdown` 返回空字符串。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsMonacoEditor`：外框用 `overflow: hidden` 把 Monaco 画布裁进圆角。补 `radius`（默认 md，跟 ConfigProvider）。`embedded` 去掉自己的边框和底色，圆角改跟父级，不再用 `block-size: 100%` 盖掉 `height`。
- `RsMonacoEditor`：原先就不引用 Reka。`v-model` / `language` / `height` / `readonly` / `theme` / `minimap` / `glyphMargin` / `debugCurrentLine` / `debugBreakpoints` / `embedded` / `jsonSchema` / `snippets` / `completionRequest` / `completionTriggerCharacters` / `completionPrefixResolver` / `options` 与 `glyphMarginClick` / `format()` / `getEditor()` / `revealLine()` 语义不变。补 `disabled` / `placeholder` / `ariaLabel` / `id`、`focus` / `blur` / `ready` 与 `focus()` / `blur()`，公开类型增加 `RsMonacoEditorInstance` / `RsMonacoEditorTheme`。`theme="auto"` 在未写 `data-rs-theme` 时跟浅色（与全库一致）；`light` / `vs-dark` 落到带 token 色的 `rs-light` / `rs-dark`（语法色仍继承 vs / vs-dark）。Monaco 的 `setTheme` 仍是进程级，同一页不能同时呈现两套主题。源码面 `dir=ltr`。减少动态时关掉平滑滚动和光标动画。多个实例共用一个主题观察器和每种语言一个补全 Provider；卸载摘掉内容 / 焦点 / glyph 监听、编辑器、Model、自己的 JSON Schema，并在最后一个实例离开时断开观察器。名称走 `monaco.label`。描边与表面走 `--rs-monaco-*`，Find Widget 层级用 `--rs-z-dropdown`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsCodeEditor`：原先就不引用 Reka。`v-model` / `language` / `theme` / `height` / `readonly` / `disabled` / `showToolbar` / `embedded` / `rounded` / `gutterWidth` / `foldGutter` / `diagnostics` / `placeholder` / `sqlConfig` / `filePath` / 悬停、定义、补全、行内编辑 / `goto-definition` / `ready` / `#toolbar` / `goToPosition` 语义不变。补 `wrap`（默认开）/ `autofocus` / `ariaLabel` / `id`、`focus()` 与公开类型 `RsCodeEditorExpose`。`theme=auto` 仍跟页面；`light` / `dark` 在根上写 `data-rs-theme`，语法色跟这一档。toml 有高亮。行内编辑、诊断和取消文案走 `codeEditor.*` / `common.cancel`。显式主题、占位、折行和只读不再整篇重建。悬停、定义、补全、行内编辑在下一次请求或卸载时 abort 可选 `signal`，销毁后不再 `dispatch`。多个编辑器共用一个主题监听，最后一个卸载才断开。诊断字段不再共用一个 CodeMirror compartment。SQL schema 变化仍重建，并尽量保住光标。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。

## [2.0.7] - 2026-09-22

### 变更

- `RsCodeBlock`：原先就不引用 Reka。根仍是原生 `figure`，`code` / `lang` / `editable` / `showBar` / `downloadFilename` / 文案覆盖与 `update:code`、`getSelection()` 语义不变；只读仍藏光标，`showBar=false` 仍去掉语言条并取消最大高度。补 `filename` / `lineNumbers` / `wordWrap` / `highlightLines` / `maxHeight` / `ariaLabel` / `id` / `copyFailedLabel`、`#actions`、`copy` 与 `focus()`。复制改走 `copyTextToClipboard`（非安全上下文有兜底），失败文案走 `codeBlock.copyFailed`，结果用 `role=status` 播报。工具条名称走 `codeBlock.toolbar`。代码区 `dir=ltr`。主题只在明暗翻转时重配语法色（按最近的 `data-rs-theme`，深色岛不必改 documentElement），不销毁文档；多个实例共用一个 `data-rs-theme` 观察器，最后一个卸载才断开。语言包异步返回后若已卸载或已被更新的初始化取代，不再挂上编辑器。下载对象 URL 延迟回收，卸载时撤销。外部改 `code` 不再回声 `update:code`。描边与表面走 `--rs-code-block-*`，间距用逻辑属性，减少动态时关掉按钮过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsVirtualList`：控件已是原生 overflow，无 Reka。`items` / `itemSize` / `height` / `overscan` / `activeIndex` / `layoutActive` / `radius` / 默认插槽 `{ item, index }` / `scrollToIndex(index, align = 'center')` 语义不变；`scroll` 仍把原生 `Event` 交给监听方（日志跟底靠 `target.scrollTop`）。`itemSize` 为函数时按索引变高（原先只用第 0 项的高度）。补 `itemSize="auto"` / `estimateSize` / `orientation` / `itemKey` / `keyboard` / `bordered` / `ariaLabel` / `id`、`#empty`、`change` 与 `scrollToOffset` / `getScrollOffset` / `getViewport` / `focus`。键盘默认关，避免抢走日志的方向键；打开后根是 listbox，方向键 / Home / End 移动当前项（横向在 RTL 对调）。滚动位置同一事件里更新窗口，避免慢一帧；`activeIndex` 的对齐、测量和 keep-alive 恢复仍走 rAF，卸载取消帧、断开 ResizeObserver、清掉滚动中的定时器。`auto` 只观察可见行，离开视口就 `unobserve`。总高度超过 800 万像素时压缩滚动条，行高仍是真实像素。当前项色条用逻辑起点。空态与 listbox 名称走 `virtualList.*`。描边与表面走 `--rs-virtual-list-*`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点定高、变高、当前项、横向、测量、空态、键盘、事件、无限滚动（滚近底部追加下一页，并显示已加载条数）与 `scrollToIndex()` / `scrollToOffset()` / `getScrollOffset()` / `getViewport()` / `focus()`。
- `RsDescriptions` / `RsDescriptionsItem`：原先就不引用 Reka。`title` / `items` / `columns` / `labelPlacement` / `bordered` / `size` / `radius` 与 `#title` / 默认插槽 / `item-${key}` 语义不变；空值仍只替换 null / undefined（默认 —，空字符串和 0 原样）。根改为包一层 `dl`，条目是 `dt` / `dd`。补 `colon`（走 `label.colon`，默认关）/ `labelWidth` / `labelAlign`（start / center / end，跟书写方向）/ `emptyText` / `ariaLabel` / `id`、`#extra` / `label-${key}` / `#label` 与公开类型 `RsDescriptionsLabelAlign`。未传 `size` 仍跟 Form / ConfigProvider。描边、标题、标签与值改走 `--rs-descriptions-*`（文字用 `--rs-text-primary` / `--rs-text-secondary`），间距用逻辑属性。无窗口监听、无定时器、无 ResizeObserver。不提供 `column` 别名、响应式列对象或 labelStyle。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsStatCard`：控件已是原生 `section`，无 Reka。`label` / `value` / `description` / `accent` / `loading` 与 `#value` / 默认插槽语义不变；未开 `format` 时数字仍是原文（12480 不会变成 12,480）。补 `prefix` / `suffix` / `trend` / `delta` / `trendTone` / `format` / `precision` / `size` / `id` / `ariaLabel`、`#prefix` / `#suffix` / `#icon` / `#trend` / `#description` 与公开类型 `RsStatAccent` / `RsStatTrend` / `RsStatTrendTone` / `RsStatSize` / `RsStatFormat`。涨跌方向与好坏分开，箭头对读屏隐藏，方向文案走 `statCard.trend.*`。加载态 `aria-busy`，文案走 `statCard.loading`，不设 live region。`Intl.NumberFormat` 最多缓存 24 个，非法选项回退原文。无窗口监听、无定时器、无 ResizeObserver。颜色走 `--rs-*`，间距用逻辑属性，骨架脉冲在减少动态时停住。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。

## [2.0.6] - 2026-09-22

### 变更

- `RsToaster`：去掉 `vue-sonner`（该组件原先不引用 Reka）。`useRsToast` 的 success / error / info / warning、字符串或 `{ title, description, position, duration }`、`dismiss()` 语义不变，并返回 id。补 `message` / `loading` / `promise` / `update`、`action` / `cancel`、`onDismiss` / `onAutoClose`、`toasterId`，以及宿主上的 `duration` / `visibleToasts` / `offset` / `swipe` / `pauseOnHover` / `hotkey` / `ariaLabel` / `teleportTo` / `id` 与 `dismiss(id)`。错误是 `role=alert`，其余是 `role=status`。关闭文案走 `toaster.close`。悬停、焦点、页面隐藏暂停倒计时；滑动只在这一次手势上捕获指针。每个宿主最多留 24 条，定时器和 `visibilitychange` 在队列清空时摘掉，卸载摘掉快捷键。颜色走 `--rs-toast-*`，方位用物理角，条内间距用逻辑属性，减少动态时不做离场等待、也不模糊。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsConfirmDialog`：去掉 Reka `AlertDialog*`，改为原生 `dialog`（`role="alertdialog"`，带 `open`，不调用 `showModal`）+ Teleport。`v-model:open` / 文案 / `tone` / `icon` / `width` / 确认取消 / `confirmLoading` / `autoCloseOnConfirm` / `beforeClose` / `showOverlay` / `teleportTo` / `#icon` / `#extra` 与 `close` 语义不变。补 `closeOnEsc` / `lockScroll` / `zIndex` / `ariaLabel` / `id`、`focus()` 与公开类型 `RsConfirmDialogExpose` / `RsConfirmDialogInstance`。始终模态：焦点陷阱、Esc 只关最上层（与 Dialog 共用层栈）、关闭还焦点、透明层挡住点击；`showOverlay` 只负责涂暗，点遮罩不关闭。`lockScroll` 默认 true，引用计数并补滚动条宽度。父级把 `open` 设为 false 仍走 `beforeClose('programmatic')`，被拦住会重新打开。确认关闭不发 `cancel`。打开时才挂 keydown，卸载摘掉。面板抄触发处的 `data-rs-theme` / `dir` / `lang`。间距用逻辑属性，减少动态时关掉模糊。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点危险确认、色相、单按钮、拦截、附加内容、遮罩、挂载、叠加与 `close()` / `focus()`。

## [2.0.5] - 2026-09-22

### 变更

- `RsDrawer`：去掉 Reka `Dialog*`，改为原生 `dialog` + Teleport。`v-model:open` / `title` / `description` / `side` / `size` / `width` / `height` / `resizable` / `minSize` / `maxSize` / `modal` / `showOverlay` / `overlayOpacity` / `overlayBlur` / `showClose` / `closeOnOverlayClick` / `closeOnEsc` / `teleportTo` / `beforeClose` 与 `close` / `openDrawer`、`afterOpen` / `afterClose` / `resize` 语义不变。补 `destroyOnClose`（默认 true，与原先关闭后卸载一致）/ `forceRender` / `lockScroll` / `zIndex` / `ariaLabel` / `id`、`#extra` 与公开类型 `RsDrawerExpose` / `RsDrawerInstance`。模态锁焦点、Tab 循环、Esc 只关最上层，关闭后把焦点还回去；未传 `modal` 时仍跟随遮罩。挂到 body 的模态才锁滚动并补滚动条宽度，引用计数，卸载成对恢复。打开手势的指针监听多实例共用，卸载减到 0 才摘掉；外部点击、Esc、拖拽监听只在打开时挂上。拖拽仍先写 DOM，松手再提交。分隔条走 APG（方向键 / Home / End）。面板抄触发处的 `data-rs-theme` / `dir` / `lang`。`will-change` 只在滑动期间。正文在抽屉内滚动。描边与表面走 `--rs-drawer-*`，间距用逻辑属性，贴屏幕的一边留安全区，减少动态时不等待滑出。没有推开页面、没有手势甩关。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点方向、尺寸、模态、拖拽、插槽、beforeClose、深色岛、事件与 `openDrawer()` / `focus()` / `close()`。
- `RsDialog`：去掉 Reka `Dialog*`，改为原生 `dialog` + Teleport（带 `open`，不调用 `showModal`，以便拖拽、非模态和自定义遮罩）。`v-model:open` / `layout` / `width` / `height` / 拖拽缩放全屏 / `beforeClose` / 页脚 / `teleportTo` 语义不变。默认插槽现在会进主体（原先只有 `#body` 能显示，文档示例是空的）。补 `lockScroll` / `zIndex` / `id` / `ariaLabel`、`focus()` 与公开类型 `RsDialogExpose` / `RsDialogInstance`。模态走 APG：焦点陷阱、Esc 只关最上层、关闭还焦点、`aria-modal`；背后兄弟 `inert`，`lockScroll` 引用计数并补滚动条宽度。非模态不挡点击、不锁滚动。打开时才挂 keydown / 外部 pointerdown，卸载摘掉并取消 rAF / afterOpen 定时器。拖拽监听只绑一次，`pointercancel` 也会松手，并恢复原来的 `user-select` / `cursor`。`beforeClose` 抛错时保持打开。tone 描边走语义色。面板抄最近的 `data-rs-theme` / `dir` / `lang`。间距用逻辑属性，拖拽把手保持物理方向。减少动态时关掉遮罩和 form 的模糊。编辑器（Monaco / CodeMirror / xterm 或 `data-rs-dialog-tab-owner`）保留 Tab。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点表单、工作窗、模态、拦截、插槽、事件与 `openDialog()` / `close()` / `focus()`。
- `RsPopover`：去掉 Reka `Popover*`，改为把打开属性合并到默认插槽的触发器上，面板 Teleport + `placeAlignedPopup`。`v-model:open` / `side` / `align` / `sideOffset` / `modal` / `width` / `lazyMount` / `forceMount` / `popupClassName` / `#content` 语义不变。补 `alignOffset` / `trigger` / `disabled` / `title` / `arrow` / `showClose` / `closeOnEsc` / `closeOnOutside` / `mouseEnterDelay` / `mouseLeaveDelay` / `getPopupContainer` / `size` / `radius` / `ariaLabel` / `id`、`openChange`、`#title` 与公开类型 `RsPopoverExpose` / `RsPopoverInstance`。面板是 `role=dialog`，触发器带 `aria-expanded` / `aria-haspopup`。`modal` 只困 Tab，不锁页面滚动。打开时才挂 pointerdown / keydown / resize / scroll / ResizeObserver，卸载成对摘掉，悬停定时器有上限并在卸载时清掉。描边与文字改走 `--rs-popover-*`，间距用逻辑属性，减少动态时关闭过渡。深色岛抄 `data-rs-theme`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点方位、悬停、事件与 `open()` / `close()` / `focus()`。
- `RsTooltip` / `RsTooltipProvider`：去掉 Reka `Tooltip*`，改为原生触发器 + Teleport 气泡 + `placeAlignedPopup`。`content` / `side` / `align` / `sideOffset` / `disabled` / `ignoreNonKeyboardFocus` / `nowrap` / `icon` / `iconName` / `ariaLabel` / `#content` 与 Provider 的 `delayDuration` / `skipDelayDuration` / `ignoreNonKeyboardFocus` 语义不变。补 `v-model:open` / `delayDuration`（单条覆盖）/ `interactive` / `arrow` / `maxWidth` / `getContainer` / `id`、`openChange` 与 `open()` / `close()`。不包 Provider 也能用（延迟 300）。打开时才挂 scroll / resize / keydown / pointerdown / ResizeObserver，卸载成对摘掉并清定时器。Esc 关闭。贴边翻转；上下方向的 start / end 在 RTL 对调。层级用 `--rs-tooltip-z`（盖住 Dialog），颜色走 `--rs-tooltip-*`。帮助图标名称与正文不同时才挂 `aria-describedby`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ。
- `RsLoading`：控件已是原生 `div[role=status]`，无 Reka。`loading` / `variant` / `size` / `tone` / `label` / `showLabel` / `block` / `overlay` / `skeletonLines` 语义不变；`tone="default"` 现在用次级文字色（原先类名在、颜色未生效）。补 `neutral` / `success` / `warning` / `danger` / `info`、`ariaLabel` / `fullscreen` / `lock` / `delay` / `minDuration` / `blur` / `getContainer` / `id`、默认插槽（盖住内容并 `inert`）、`#indicator` / `#label` 与公开类型 `RsLoadingSize` / `RsLoadingTone` / `RsLoadingVariant`。圆点与骨架行高跟 `size`。骨架超过 12 行截断。`delay` / `minDuration` 上限 60 秒；定时器在状态变化和卸载时清除，服务端不注册。`lock` 只在全屏且可见时锁 `body` 滚动和点击，并给 `html` 标 `aria-busy`，引用计数恢复原值，重复释放无操作。扫光改走 `transform`。减少动态时圆环和圆点改为透明度脉冲，骨架扫光停住，模糊关掉。描边与遮罩改走 `--rs-loading-*`，间距用逻辑属性，全屏层级用 `--rs-z-modal`。没有 `spinning` / `tip` / 百分比 / 指令。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点形态、尺寸、色相、文案、开关、包裹、遮罩、延迟、骨架、插槽、全屏、深色岛与 inspect none。
- `RsLoadingBar`：控件已是原生 `div[role=progressbar]`，无 Reka。`progress` / `height` / `color` / `errorColor` 与 `start` / `finish` / `error`、`useRsLoadingBar` 空操作语义不变；未开 `nesting` 时重复 `start` 仍回到 `minimum`。补 `tone` / `position` / `attach` / `trickle` / `trickleSpeed` / `minimum` / `maximum` / `delay` / `finishDuration` / `errorDuration` / `nesting` / `indeterminate` / `ariaLabel` / `id`、`start` / `finish` / `error` / `change` 与 `set` / `inc` / `getProgress` / `isStarted`。传了 `progress` 时显隐只跟该值，到 100 后淡出（原先到 100 会因为 `progress > 0` 一直留着）。`finish` 期间再 `start` 会清掉上一次淡出定时器。trickle 到 `maximum` 后停表，卸载清 interval / timeout。无 window 不排定时器。颜色走 `--rs-loading-bar-*`，位置用逻辑属性，未知进度滑动在 RTL 下跟 `inset-inline-start`，减少动态时停住。读屏名称走 `loadingBar.*`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点壳层、事件、`set` / `inc`、重叠请求、受控、未知进度、贴边与 `delay`。
- `RsEmpty`：控件已是原生 `div[role=status]`，无 Reka。`title` / `description` / `fill` / `radius` / `iconRadius` 与 `#icon` / 默认插槽语义不变；`description` 改为可选，未传走 `empty.description`（`preset=search` 走 `empty.search`），显式空字符串隐藏说明。补 `preset` / `size` / `image` / `imageAlt` / `imageSize` / `showImage` / `ariaLabel` / `id`、`#image` / `#title` / `#description` 与公开类型 `RsEmptyPreset` / `RsEmptySize`。无插槽时画主题色线稿，不再留空徽章。描边与文字改走 `--rs-empty-*`，间距用逻辑属性。无窗口监听、无定时器、无 object URL。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点预设、尺寸、图标、插图、fill、圆角、插槽、场景与 inspect none。
- `RsAlert`：控件已是原生 `div[role=status|alert]`，无 Reka。`type` / `title` / `closable` / `bordered` / `close` / `#icon` / `#title` 语义不变。补 `tone`（与 `type` 同值，同时传时 `tone` 为准）/ `variant`（soft / outline / solid）/ `description` / `showIcon` / `banner` / `closeText` / `size` / `radius` / `ariaLabel` / `id`、`#action` / `#close` 与公开类型 `RsAlertExpose` / `RsAlertInstance` / `RsAlertTone` / `RsAlertVariant` / `RsAlertSize`。未传 `size` 跟 Form / ConfigProvider（`ssm` 落到 `sm`）。点关闭仍只发 `close`，不自己卸载。warning / danger 用 `role=alert`，其余用 `role=status`。描边与文字改走 `--rs-alert-*`，间距用逻辑属性，减少动态时关闭过渡。无窗口监听、无定时器。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点形态、关闭、图标、横幅、尺寸、插槽、事件与 `focus()`。
- `RsPagination`：控件已是原生 `nav` + `button`，无 Reka；跳转仍走 `RsInput`，每页条数仍走 `RsSelect`。`v-model:page` / `v-model:pageSize` / `total` / `siblingCount` / `showSummary` / `showPageSize` / `showQuickJumper` / `showJumpConfirm` / `pageSizeOptions` / `disabled` / `size` 语义不变。补 `showFirstLast` / `simple` / `hideOnSinglePage` / `align` / `ariaLabel` / `id`、`change` / `pageSizeChange`、`#item` / `#summary` 与公开类型 `RsPaginationExpose` / `RsPaginationInstance` / `RsPaginationAlign` / `RsPaginationItemSlot`。未传 `size` 跟 Form / ConfigProvider（`ssm` 落到 `sm`，不提供 ssm）。页码条左右键只移焦点（RTL 对调），改页走点击或 `goTo()` / `next()` / `prev()` / `first()` / `last()`。当前页 `aria-current="page"`。描边与文字改走 `--rs-pagination-*`，间距用逻辑属性，减少动态时关闭过渡。无窗口监听、无定时器。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点尺寸、省略号、跳转、每页条数、首页末页、简洁、单页隐藏、对齐、插槽、事件与 `goTo()` / `next()` / `focus()`。
- `RsSplitPane`：控件已是原生 `div[role=group]` + `hr` 分隔条，无 Reka。`panes` / `v-model:sizes` / `orientation` / `disabled` / `keyboardStep` / `withHandle` / `fill` 与 `#pane.key` 语义不变。补 `id` / `ariaLabel`、条目 `resizable` / `resizerAriaLabel`、`resize-start` 与公开类型 `RsSplitPaneSlot`；expose 增加 `focus()`。拖拽仍只写 DOM `flex-grow` 再在抬起时 commit，避免每帧重渲染；卸载取消 rAF、释放指针捕获并清折叠记忆。RTL 下横向指针与左右键取反，分隔条跟手。键盘走 APG Window Splitter（方向键 / Home / End / Enter）；`aria-controls` / `aria-valuetext` 挂到缝上。描边与抓手改走 `--rs-split-*`，命中区用逻辑属性，减少动态时关闭过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点纵向、约束、折叠、auto、fill、禁用、嵌套、事件与 `collapse()` / `expand()` / `reset()` / `getSizes()` / `focus()`。
- `RsToolbar`：无中间区时 start 占剩余宽度并裁切，end 按内容宽度贴在行尾（不再 `1fr / 1fr` 对半切）。有 `#center` 时为 `1fr / auto / 1fr`，缺一侧也占列，中间光学居中。竖排 start 在上、end 贴底，栏宽跟最宽的一项（`--rs-toolbar-rail-min` 默认 0）。密度对齐工作台 32 / 40 / 48；字重回到 regular；elevated 只用 `--rs-surface-elevated`；sticky 半透明 + `backdrop-filter`（减少透明时关闭）。
- `RsToolbar`：控件已是原生 `header` / `div`，无 Reka。`tag` / `size` / `border` / `elevated` / `compact` / `#left` / `#center` / `#right` / `label` 语义不变。补 `orientation` / `wrap` / `sticky` / `stickyOffset` / `disabled` / `keyboard` / `loop` / `ariaLabel` / `id`、`#start` / `#end` 与公开类型 `RsToolbarExpose` / `RsToolbarInstance` / `RsToolbarOrientation`。未传 `size` 跟 ConfigProvider（四档 `ssm`–`lg`）。默认 APG 键盘：方向键 / Home / End 在命令控件间移动（RTL 左右对调）；输入框不拦截。无窗口监听、无定时器、无 MutationObserver，只在根上委托 `keydown` / `focusin`。描边与文字改走 `--rs-toolbar-*`，间距用逻辑属性。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点密度、竖排、换行、吸附、禁用、事件与 `focus()` / `blur()`。
- `RsDropdown`：去掉 Reka `DropdownMenu*`，改为原生 `button`（`aria-haspopup=menu`）+ Teleport 面板 + `placeDropdownPopup`。`v-model` / `items` / `showSelected` / `placeholder` / `size` / `contentWidth` / `#trigger` / `select` 语义不变。补 `v-model:open` / `trigger` / `placement` / `hideOnClick` / `getPopupContainer` / `popupClassName` / `maxHeight` / `radius` / `ariaLabel` / `id` / `destroyOnHide`、条目 `type=divider` / `tone` / `href` / `shortcut` / `children`、`change` / `openChange`、`#item` 与公开类型 `RsDropdownExpose` / `RsDropdownInstance`。键盘走 APG Menu（方向键 / Home / End / Esc / 首字母；RTL 子菜单左右对调）。打开时才挂 pointerdown / resize / scroll / ResizeObserver，卸载成对摘掉。描边与文字改走 `--rs-dropdown-*`，间距用逻辑属性，减少动态时关闭过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点操作菜单、悬停、分组、危险项、子菜单、插槽、事件与 `open()` / `close()` / `focus()`。
- `RsSteps`：控件已是原生 `nav` + `ol`，无 Reka。`v-model` / `items` / `orientation` / `clickable` 语义不变。补 `labelPlacement` / `type` / `status` / `percent` / `ariaLabel` / `id`、条目 `icon`、`change` / `click` 与公开类型 `RsStepsExpose` / `RsStepsInstance` / `RsStepsLabelPlacement` / `RsStepsType` / `RsStepsItemSlot`。未传 `size` 跟 ConfigProvider（四档 `ssm`–`lg`）。可点时方向键只移焦点（RTL 左右对调），改当前步走点击或 `next()` / `prev()` / `goTo()`。完成步显示勾、错误显示叉；完成连线走 `--rs-steps-separator-finish`。描边与文字改走 `--rs-steps-*`，间距用逻辑属性，减少动态时关闭过渡。读屏用 `aria-current="step"` 与 `steps.*` 状态文案。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点尺寸、标题位置、状态、点状、图标、插槽、事件与 `next()` / `prev()` / `goTo()` / `focus()`。
- `RsTabs`：去掉 Reka `Tabs*` / `DropdownMenu*`，改为原生 `tablist` / `tab` / `tabpanel`。`v-model` / `items` / `closable` / `addable` / `renamable` / `draggable` / `overflow` / `contextMenu` / `beforeLeave` / `panelless` / `borderless` / `justify` / `contentGap` 语义不变。补 `tabPosition` / `activation` / `lazy` / `destroyInactive`（默认 true，与原 Reka 卸载一致）/ `ariaLabel` / `id` / `size=lg`、`change`、`#tab` 与公开类型 `RsTabsExpose` / `RsTabsInstance` / `RsTabsPosition` / `RsTabsActivation` / `RsTabsTabSlot`。键盘走 APG（方向键 / Home / End；RTL 左右对调；竖排只用上下）。溢出「更多」走 `RsDropdown`；`contextMenu=false` 时不挂 Reka。未传 `size` 跟 ConfigProvider。描边与文字改走 `--rs-tabs-*`，间距用逻辑属性，减少动态时关闭过渡。ResizeObserver / 非 passive `wheel` / rAF 卸载成对摘掉，激活项滚进视口不再调用 `scrollIntoView`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点形态、位置、溢出、工作台页签、懒挂载、插槽、事件与 `selectTab()` / `focus()`。
- `RsSidebar` / `RsSidebarGroup` / `RsSidebarItem`：控件已是原生 `aside` + `nav` + `button` / `a`，无 Reka。`title` / `subtitle` / `collapsible` / `width` / `orientation` / `placement` / `v-model:collapsed` 与 `#header` / `#footer` 语义不变。补 `hotkey` / `ariaLabel` / `id`、Item `href` / `to` / `target` / `rel` / `badge`、`change` 与公开类型 `RsSidebarExpose` / `RsSidebarInstance` / `RsSidebarOrientation` / `RsSidebarPlacement` / `RsSidebarWidth`。折叠态 provide/inject 下传，子组件不必再手传 `collapsed`。外链 `_blank` 补 `noopener noreferrer`。`hotkey` 打开时才挂 `keydown`，输入框内不触发，卸载成对摘掉。描边与文字改走 `--rs-sidebar-*`，间距用逻辑属性，减少动态时关闭过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点宽度、左右、横向、链接、插槽、事件与 `expand()` / `collapse()` / `toggle()` / `focus()`。

## [2.0.4] - 2026-09-22

### 修复

- `RsAnchor`：最后一节高度不够贴顶时，滚到底仍高亮最后一项；点击后锁定到滚动停稳，避免墨点跳回上一项。滚动帧只量一次容器矩形，激活未变不重算墨点。

### 变更

- `RsMenu`：去掉 Reka `Collapsible*` / `Popover*`，改为原生 `nav` + `button` / `a[href]`；垂直折叠子菜单是 Teleport + `placeSidePopup`。`v-model` / `openKeys` / `mode` / `collapsed` / `highlightParent` / `select` 语义不变。补 `accordion` / `triggerSubMenuAction` / `size` / `radius` / `indent` / `ariaLabel` / `id` / `getPopupContainer`、条目 `href` / `to` / `target` / `rel` / `extra` / `type=divider`、`click` / `openChange`、`#item` / `#icon` / `#extra` 与公开类型 `RsMenuExpose` / `RsMenuInstance`。键盘走披露式导航（方向键 / Home / End / Esc；不锁 Tab）。选中叶子时祖先已展开不再重写 `openKeys`。打开 flyout 才挂 pointerdown / keydown / resize / scroll / ResizeObserver，卸载成对摘掉。描边与文字改走 `--rs-menu-*`，间距用逻辑属性，减少动态时关闭过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点嵌套、分组、横向、折叠、手风琴、链接、尺寸、插槽、事件与 `focus()` / `blur()`。
- `RsBreadcrumb`：控件已是原生 `nav` + `ol`，无 Reka。`items.label` / `href` / `to` 与末级当前页语义不变；只传 `to` 时现在会写到 `a[href]`。补 `separator` / `separatorIcon` / `maxItems` / `itemsBeforeCollapse` / `itemsAfterCollapse` / `ariaLabel` / `id`、条目 `icon` / `disabled` / `target` / `rel` / `key`、`click` 与 `#item` / `#separator` / `#more`。外链 `_blank` 补 `noopener noreferrer`。折叠用纯函数裁索引，点省略号展开，无 ResizeObserver / 定时器 / 窗口监听。描边与文字改走 `--rs-breadcrumb-*`，间距用逻辑属性，减少动态时关闭过渡；RTL 下分隔图标水平翻转。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点分隔符、图标、折叠、禁用、插槽与 `click`。
- `RsCalendarGrid`：控件已是原生 `table` + `button`，无 Reka。`viewYear` / `viewMonth` / `select` / `selected` / `rangeStart` / `rangeEnd` / `minDate` / `maxDate` / `disabledDates` / `disabledDate` / `weekStartsOn` 语义不变。补 `size` / `radius` / `disabled` / `highlightToday` / `showOutside` / `selectOutside` / `showWeekNumbers` / `ariaLabel` / `id`、`#title` / `#cell` 与公开类型 `RsCalendarGridExpose` / `RsCalendarGridInstance` / `RsCalendarGridCellSlot`。组禁用继承 Form.disabled。键盘走 APG（方向键 / Home / End / PageUp / PageDown / Enter；RTL 左右对调）。格子状态一次算完，禁用日用 Set；无窗口监听、无定时器。描边与文字改走 `--rs-calendar-grid-*`，间距用逻辑属性，减少动态时关闭过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点范围、边界、周起始、周序号、插槽、事件与 `focus()` / `goToToday()`。
- `RsAnchor`：控件已是原生 `nav` + `a[href]`，无 Reka。`items` / `v-model` / `offset` / `targetOffset` / `bounds` / `affix` / `lineless` / `changeHash` / `getContainer` / `click` / `change` 语义不变。补 `direction` / `replace` / `scrollBehavior` / `affixOffset` / `getCurrentAnchor` / `ariaLabel` / `id`、条目 `disabled`、`#item` 与公开类型 `RsAnchorExpose` / `RsAnchorInstance` / `RsAnchorDirection`。`hrefToAnchorId` 解码 `%xx` / 非 ASCII。滚动用 `scrollY`/`nodeType` 判断 window，不用 `instanceof`。监听按容器节点而不是 `getContainer` 函数引用重绑；rAF / ResizeObserver / scroll / resize 卸载成对摘掉。墨点改 `getBoundingClientRect`，颜色走 `--rs-anchor-*`，减少动态时关闭过渡与平滑滚动。当前项 `aria-current="location"`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点横向、偏移、插槽、事件与 `scrollTo()`。
- `RsDateTimePicker`：文档站按 site README 补全中英演示（范围、秒、format、快捷项、边界、禁用、事件、`focus()` / `setValue()`）。catalog 补齐 props / events / slots / methods / tokens / FAQ。事件从 DatePicker 显式转发。
- `RsTimePicker`：去掉 Reka `Popover*`，改为原生 `button`（`aria-haspopup=dialog`）+ Teleport 面板 + `placeAnchoredPopup`。`v-model` / `open` / `range` / `withSeconds` / `minTime` / `maxTime` / `embedded` 语义不变。补 `hourCycle` / `minuteStep` / `disabledTime` / `shortcuts` / `clearable` / `readonly` / `radius` / `name` / `getPopupContainer` 与公开类型 `RsTimePickerExpose` / `RsTimePickerInstance`。组禁用继承 Form.disabled。打开时才挂 pointerdown / resize / scroll / ResizeObserver，卸载成对摘掉。`hourCycle=12` 只改展示与列（AM/PM 跟 locale），绑定仍是 24 小时墙钟。嵌在 DatePicker 里时面板高一档，点时间列不关日期面板。文档站按 site README 补全中英演示，可点 12 小时、步进、快捷项、事件与 `focus()` / `setValue()`。
- `RsDatePicker`：去掉 Reka `Popover*`，改为原生 `button`（`aria-haspopup=dialog`）+ Teleport 面板 + `placeAnchoredPopup`。`v-model` / `open` / `range` / `withTime` / `valueFormat` / 快捷项 / 表单校验语义不变。补 `format` / `weekStartsOn` / `disabledDate` / `disabledDates` / `clearable` / `readonly` / `radius` / `getPopupContainer` 与公开类型 `RsDatePickerExpose` / `RsDatePickerInstance`。组禁用继承 Form.disabled。打开时才挂 pointerdown / resize / scroll / ResizeObserver，卸载成对摘掉；嵌套 TimePicker 点击不关日期面板。日历一周起始跟 locale（en-US 周日，zh-CN 周一）。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点范围、日期时间、format、快捷项、边界、事件与 `focus()` / `setValue()`。

- `RsUpload`：控件已是原生隐藏 `input[type=file]` + `label[for]` / `button`，无 Reka。`v-model` File[]、`accept` / `multiple` / `maxSize` / `maxCount` / `label` / `hint` / `showFileList` / `showDownload` / `hideDropzoneWhenFull` / `reject` / `download` / `remove` 语义不变；单文件仍默认追加。补 `size` / `id` / `name` / `ariaLabel` / `listType` / `variant` / `directory` / `capture` / `replace` / `paste` / `skipDuplicate` / `showPreview` / `beforeSelect` / `beforeRemove` 与公开类型 `RsUploadExpose` / `RsUploadInstance`。新增 `change` / `preview` 与 expose `open` / `focus` / `blur` / `clear`。组禁用继承 Form.disabled。`name` 只向 Form 注册 File[]，不写到会清空的原生 input。图片缩略图 `createObjectURL` 在移除 / 卸载时 revoke；`download` 延迟 1.5s 再 revoke，避免立刻回收打断下载。拖拽态只在拖入时挂 `dragend` / `blur`，卸载成对摘掉。描边与表面改走 `--rs-upload-*`，间距用逻辑属性，减少动态时关闭过渡。没有 `action` / `customRequest` / `validate()`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点列表形态、按钮、尺寸、插槽、事件与 `open()` / `clear()`。
- `RsDynamicTags`：控件已是原生 `fieldset` + `input`，无 Reka。补 `readonly` / `separators` / `parse` / `allowClear` / `ariaLabel` / `id` 与公开类型 `RsDynamicTagsExpose` / `RsDynamicTagsInstance` / `RsDynamicTagsParse`。`v-model` / `inputMode` / `max` / `allowDuplicate` / `commitOnBlur` / `create` / `remove` / `reject` 语义不变；`reject` 增加 `invalid`。新增 `clear` / `focus` / `blur` 事件与 expose（含已有 `validate` / `clearValidation` / `setValue` / `setError`）。组禁用继承 Form.disabled。Enter / Tab 提交，IME 合成中不写入。反馈定时器卸载清除；抖动尊重减少动态。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点分隔粘贴、插槽、事件与 `focus()` / `blur()` / `setValue()`。
- `RsFieldset`：控件已是原生 `fieldset` / `legend`，无 Reka。补 `form` / `id` / `required` / `invalid` / `error` 与 `#error`。`legend` / `tooltip` / `disabled` / `size` / 边框与标题清晰度语义不变。`description` 仍映射到 tip。组禁用继承 Form.disabled；禁用时 tip 改成可见说明（原生 fieldset 会禁用组内 button）。描边与标题色改走 `--rs-fieldset-*`，间距用逻辑属性。没有 defineEmits / defineExpose，也不做折叠。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点密度、边框、插槽、禁用说明、组错误与 inspect none。
- `RsLabel`：控件已是原生 `label`，无 Reka。补 `name`、`htmlFor` / `for` 别名、`id` / `optional` / `colon` / `hintId` 与 `#hint`。必填星号仍 `aria-hidden`，读屏走 `label.required`；选填与冒号跟 locale。组禁用继承 Form.disabled。间距与禁用透明度改走 `--rs-label-gap` / `--rs-label-mark-gap` / `--rs-label-disabled-opacity`。没有 defineEmits / defineExpose。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点原生 for 聚焦与 inspect none。
- `RsTreeSelect`：去掉 `RsPopover` / Reka，改为原生 `button`（`aria-haspopup=tree`）+ Teleport 面板 + `placeAnchoredPopup`。面板样式进全局 `styles.css`（与 Select 一样），尺寸变量写在面板上，深色岛跟 `data-rs-theme`。不拆子组件。`v-model` / `open` / `treeData` / `allowClear` / `multiple` / `checkable` / `searchable` 语义不变；勾选改为写 `checkedKeys`（原先只绑选中，勾选框改不了 v-model）。补 `checkStrictly` / `onlyCheckLeaf` / `showCheckedStrategy` / `maxTagCount` / `virtual` / `loadData` / `getPopupContainer` 与公开类型 `RsTreeSelectExpose` / `RsTreeSelectInstance`。继承 `Form.disabled`。清除钮是并列控件，不嵌进触发 button。打开时才挂 pointerdown / resize / scroll / ResizeObserver，卸载成对摘掉。文档站按 site README 补全中英演示，可点 change 与 `focus()`。
- `RsMentions`：控件已是原生 `textarea[role=combobox]` + Teleport listbox，无 Reka。补 `name` / `id` / `ariaLabel` / `readonly` / `loading` / `filterOption` / `debounce` / `allowClear` 与公开类型 `RsMentionsExpose` / `RsMentionsInstance`。`v-model` / `prefix` / `split` / `rows` / `search` / `select` 语义不变。新增 `focus` / `blur` / `clear` 事件与 expose。组禁用继承 Form.disabled。打开时才挂 pointerdown / resize / scroll，卸载成对摘掉；失焦定时器、search 防抖与插入符镜像节点一并释放。IME 合成中 Enter 不写入提及。面板抄输入框最近的 `data-rs-theme`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点多触发符、远程搜索、插槽、事件与 `focus()` / `blur()`。
- `RsAutoComplete`：控件已是原生 `input[role=combobox]` + Teleport listbox，无 Reka。补 `name` / `id` / `ariaLabel` / `loading` 与公开类型 `RsAutoCompleteExpose` / `RsAutoCompleteInstance`。`v-model` / `open` / `filterOption` / `debounce` / `allowClear` / `search` / `select` / `clear` 语义不变。新增 `focus` / `blur` 事件与 expose。组禁用继承 Form.disabled。失焦定时器与 search 防抖在卸载时清除。建议列表是原生 `select` + `option`（Teleport + placeAnchoredPopup），抄输入框最近的 `data-rs-theme`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点远程搜索、插槽、事件与 `focus()` / `blur()`。

- `RsCascader`：去掉 `RsPopover` / Reka，改为原生 `button` + Teleport 面板 + `placeAnchoredPopup`。`v-model` 路径、`open`、`changeOnSelect` / `expandTrigger` / `allowClear` / `change` 语义不变。hover 展开仍只写 v-model、不发 change。公开类型 `RsCascaderExpose` / `RsCascaderInstance`，并继承 `Form.disabled`。清除钮是并列的 `RsButton`，不嵌进触发 button。打开时才挂 pointerdown / resize / scroll，卸载成对摘掉。触发器跟 Select 同一套输入 token（悬停边框、聚焦环、占位色、开合箭头）；面板抄 `data-rs-theme`，选中走 `--rs-primary`。四档 `size` 同时改触发器与面板选项。文档站按 site README 补全中英演示，可点尺寸、change 与 `focus()`。
- `RsSelect`：去掉 Reka `Combobox*` / `useFilter`，改为原生 `button[role=combobox]` + Teleport 面板 + `placeAnchoredPopup`；补 `name` 与公开类型 `RsSelectExpose` / `RsSelectInstance`。`v-model` / `open` / `searchValue`、多选 / 搜索 / 创建 / 远程 / `maxTagCount` 与事件插槽语义不变。可选 `name` 写隐藏 input。键盘走 APG（方向键 / Home / End / Enter / Esc）。选项 hover 跟 `--rs-item-hover`；警告边框只走 `--rs-warning`；Teleport 面板抄触发器最近的 `data-rs-theme`，深色岛下拉不再跟错页主题。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点 select / clear 与 `focus()` / `setValue()`。
- `RsSwitch`：去掉 Reka `SwitchRoot` / `SwitchThumb`，改为原生 `checkbox` + `role=switch`；补 `name` 与公开类型 `RsSwitchExpose` / `RsSwitchInstance`。`v-model` / `checkedValue` / `uncheckedValue` / `change` 语义不变。可选 `name`，并继承 `Form.disabled`。轨道点击与标签仍切换；减少动态时关闭过渡。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点 change 与 `focus()`。
- `RsRadio` / `RsRadioItem`：去掉 Reka `RadioGroup*`，改为原生 `div[role=radiogroup]` + `input[type=radio]`；补 `name`。`v-model` / `change` / `orientation` / `name` / Item `value` 语义不变。公开类型仍是 `RsRadioValue`，并导出 `RsRadioOrientation`；helper 保持内部。组禁用继承 Form.disabled。可选 `ariaLabel`。没有 defineExpose。选中指示点常驻、行高跟同档 Input / Switch，竖排切换不再撑开父级。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点 change、尺寸、整组/单项禁用与 inspect none。
- `RsCheckbox`：控件已是原生 `label` + `checkbox`，无 Reka。补 `name` 与公开类型 `RsCheckboxExpose` / `RsCheckboxInstance`。`v-model` / `indeterminate` / `change` 语义不变；`class` 仍落在 label（表格单元格 `click.prevent` 可用）。半选写入原生 `indeterminate` IDL。可选 `name` / `required`，并继承 `Form.disabled`。文档站按 site README 补全中英演示 / tokens / FAQ。
- `RsInputNumber`：控件已是原生 `input` + `role=spinbutton`，无 Reka。补 `name` 与公开类型 `RsInputNumberExpose` / `RsInputNumberInstance`。`v-model` / `stringMode` / `controls` / `keyboard` / `changeOnWheel` 与 `focus` / `blur` / `commit` / `setValue` / `step` 语义不变。`class` / `aria-*` 落到 input；IME 合成中不步进、不发 `pressEnter`。文档站按 site README 补全中英 props / events / methods / tokens / FAQ。
- `RsTextarea`：补 `name`；抽 `textarea-utils`。控件已是原生 `textarea`，无 Reka。`validate` / `clearValidation` / `setValue` / `setError` / `focus` / `blur` 与 props / 事件语义不变。公开类型仍是 `RsTextareaExpose` / `RsTextareaInstance` / `RsTextareaAutosize` / `RsTextareaResize`；helper 保持内部。无 autosize 时不再每键 `nextTick`。字段 `#error` 与 Input 一样可走 Form `errorRender`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点事件与六个 expose，并露出 `#count` / `#error` 与禁用只读。
- `RsForm`：补 `name`；根节点仍是原生 `form`，无 Reka。`model` / `rules` / `validateOnSubmit` 与九个 expose 语义不变。没有 `validateFields`。公开类型新增 `RsFormExpose` / `RsFormInstance`。`maxWidth` 三档走 `--rs-form-max-*`（仍是 24/32/48rem）。根节点 `novalidate`，避免原生约束气泡抢走 submit。`scrollToField` 只在本表根内查找，减少动态时用 `auto`。字段按 name 建索引；卸载清表且不再 `emit`。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点 submit / validate 与全部宿主 expose，并露出 `#error` 与深色岛。
- `RsInput`：补 `name`；抽 `input-utils`。控件已是原生 `input`，无 Reka。`validate` / `clearValidation` / `setValue` / `setError` 与 props / 事件语义不变。公开类型仍是 `RsInputExpose` / `RsInputInstance`，并导出 `RsInputType`；helper 保持内部。文档站按 site README 补全中英 props / events / slots / methods / tokens / FAQ，演示可点事件与四个 expose，并露出 `#suffix` / `#addonBefore` / `#addonAfter` / `#error` 与禁用只读。
- `RsAvatar`：去掉 Reka `AvatarRoot` / `Image` / `Fallback`，改为原生 `span` + `img`；补 `name` 与公开类型 `RsAvatarSize` / `Shape` / `Tone`。`src` / `name` / `fallback` / `icon` 与失败回退语义不变。helper 保持内部。
- `RsCard`：去掉 Reka `Primitive`，改为原生 `section`（`as` 可换标签）；补 `name`。`title` / `variant` / `size` / `radius` / 插槽语义不变。公开类型仍是 `RsCardSize` / `RsCardVariant`；helper 保持内部。文档站按 site README 补全演示（五档表面、疏密、贴边嵌套、`#cover`）、tokens / FAQ（中英）。grouped / glass 的明暗差改走 `--rs-card-*`，不再用 `[data-rs-theme=light]` 后代选择器，深色岛与未写属性的浅色页跟 token。
- `RsContainer`：补 `name`；抽 `container-utils`。`maxWidth` / `padding` / `fluid` / `grid` / `tag` 与响应式对象语义不变。公开类型仍从包根导出；`resolveRsContainerStyle` 保持内部。
- `RsScrollbar`：去掉 Reka `ScrollArea*`，改为原生 overflow 视口 + 自绘滑块；补 `name`。`type` / `orientation` / `scrollHideDelay` / 高度与 `scrollTop` / `scrollTopLeft` / `getViewport` 语义不变。公开类型仍是 `RsScrollbarType` / `RsScrollbarOrientation`；helper 保持内部。视口可访问名称走 `scrollbar.viewport`（中英）。文档站按 site README 补全显隐 / 横向演示、`scrollTopLeft`、tokens / FAQ。拖拽用指针捕获成对恢复 `user-select`；溢出标志与滑块写入同一条 rAF（滚动与插槽更新）。

## [2.0.3] - 2026-09-21

### 新增

- 文档站接入 vue-i18n（`site/locales`）。顶栏切语言同步 `RsConfigProvider.locale` 与 vue-i18n，并记住上次选择。只用于 site，不进组件库依赖。
- `RsBadge`：补 `name` 与公开类型 `RsBadgeVariant`。只写 `variant` + 默认插槽时仍是原来的状态芯片。可选 `count` / `max` / `dot` / `showZero`：有插槽时为角标，无插槽时只渲染数字或点。文档站按 site README 补全 events / methods / tokens / FAQ。

### 变更

- 文档站演示与壳层不再用 `isEn` 二分。文案按 locale 表选取（`useSiteDemo` / `pickSitePair`），缺语言回退 en-US → zh-CN；顶栏语言按 `SITE_LOCALES` 轮换。主题仍走 `resolvedTheme` / `data-rs-theme` / token。
- `RsTag`：补 `name`；关闭钮改用 `RsButton`（仍是 `.rs-tag__close`，props / `close` 语义与原来相同）。文档站按 site README 补全 events / methods / tokens（中英）。
- `RsDivider`：补 `name` 与公开类型 `RsDividerOrientation`。仍是 `div[role=separator]`，`orientation` / `dashed` / 默认插槽语义不变。文档站按 site README 补全 events / methods / tokens / FAQ（中英）。
- 文档站基础组 Avatar / Card / Container / Scrollbar：按 site README 补全中英演示、events / methods / tokens / FAQ。Scrollbar 演示可点 `scrollTop` / `getViewport`。
- `RsIcon`：补 `name`；尺寸档位与 `RS_COMPONENT_SIZE_ICON_PX` 对齐（lg 现为 18）；抽 `icon-utils`；`spin` 尊重减少动态。文档站 Icon 用法与 Button 对齐（中英）。
- 文档站基础组：Button 补 `iconSize` / 原生 `click` / 事件演示；Badge–Scrollbar 按源码补全 props、事件、插槽、方法（中英）。
- `RsLink`：去掉 Reka `Primitive`，改为原生 `<a>`；补 `name`、`tone`、`icon`；样式改 scoped，并尊重减少动态。默认 `inline`（有图标才 `inline-flex`）。文档站按 site README 补 events / methods / tokens、跟正文与可感知 click。公开类型 `RsLinkTone` / `RsLinkUnderline`；helper 保持内部。不设 size / theme prop。

### 修复

- `RsTimePicker` / `RsDatePicker`：时间列滚轮与滚动条不再带动外层页面（`overscroll-behavior: contain` + 非 passive `wheel` 到顶/到底拦截）；窗口 capture `scroll` 忽略列内滚动，避免拖列滚动条时反复 `placeAnchoredPopup`。
- `RsButton`：补 `name`，loading 时拦住点击；内置 tip 用自研定位，不再提 Reka。图标在按钮内为装饰，可访问名称只走 `aria-label`。
- `RsButton` 内置 tip 回到 `calc(var(--rs-z-modal) + 2)`，与 `RsTooltip` / Dialog 内浮层同一档，避免在对话框里被盖住。
- `RsButton` 幽灵：未传 `bordered` 时不再被 Vue 收成 false（与 text 撞车）；hover 改为 `--rs-surface-hover` 实底，语义色再叠 14% 色相。

## [2.0.2] - 2026-09-21

### 变更

- 未设 `locale` 时按本机语言选择（`navigator.languages`）：`zh*` → `zh-CN`，`en*` → `en-US`，已登记语言按前缀匹配。无法识别或 SSR 回退 `zh-CN`。显式传 `locale` 的应用不受影响。

### 新增

- `t()` ICU 子集复数：`{count, plural, one {#} other {#}}`，`Intl.PluralRules`。
- `rsLocaleMessageKeys`：社区语言包 key 清单。说明见 `docs/locales.md`。
- `RsConfigProvider` 把解析后的 `dir` / `locale` 传给 Reka，Select 等浮层跟书写方向。
- 公开导出 `resolveDirMode`、`resolveHostLocale`。
- 文档站 / npm README 默认英文；中文见 `README.zh-CN.md`。
- RTL 像素回归：`/#/visual/rs-rtl`。

## [2.0.1] - 2026-09-21

### 变更

- 单测放到对应模块的 `__tests__/`；跨组件冒烟仍留在 `src/__tests__/`。
- 每个组件目录增加 `index.ts`，`src/index.ts` 只从目录再导出。
- `src/lib` 并入 `src/utils`。
- `RsTreeSelect` 独立目录 `components/tree-select/`。组件与组件之间按 slug 平铺；归类只写文档站 `basic` / `form` / `nav` / `feedback` / `data` / `editor`。
- 每个组件内部为 `index.ts` + `src/` + 可选 `style/` + `__tests__/`。
- 表格 `src/` 再拆：`table-header` / `table-body` / `table-footer` / `composables` / `context` / `features` / `utils`。
- 架构契约补齐目录规范：组件四槽、`src/` 再拆门槛、仓库根、`package.json` 发布面（`docs/components.md` §3）。
- `:root` 不再默认暗色。未写属性时用浅色 token。暗色宿主请在 `index.html` 写 `data-rs-theme="dark"` 或 `theme="dark"`，避免首屏闪浅色。
- `themePresets` 标明仅参考，不驱动画面。
- 文字公开 token 改为 `--rs-text-primary` 等；`--rs-text` / `--rs-muted` / `--rs-placeholder` 降为别名。
- 数据源品牌色移出通用 `styles.css`。需要官方色的宿主加 `import 'niuma-ui/brand-icons.css'`。

### 新增

- `RsConfigProvider` `theme` 支持 `system`，跟随 `prefers-color-scheme`。`applyTheme` 仍写解析后的 `data-rs-theme="light|dark"`，并标 `data-rs-theme-pref="system"`。
- `resolveThemeMode` / `readResolvedTheme` / `useRsConfig().resolvedTheme`。无 `data-rs-theme` 时按浅色，与 Provider 默认一致。
- 内置品牌图标名单 `rsBrandIconNames`；Lucide 走 `--rs-icon-color`。图形规则在 `src/icons/style/brand-icons.css`。
- `registerRsLocale`：第三方登记 BCP-47 文案；缺 key 回退 en-US。
- `RsConfigProvider dir`（`ltr` / `rtl` / `auto`），写入 `dir` / `lang` / `data-rs-dir`。
- 高对比：`forced-colors` 下语义 token 映射系统色。
- 可选 `niuma-ui/brand-icons.css`：数据源 mark 色。不引入则 mark 为 currentColor。

## [2.0.0] - 2026-09-21

### 破坏性变更

- 移除 Tailwind。`styles.css` 只含 `--rs-*` token、reset 与组件样式；宿主不再需要 `@tailwindcss/vite`。若业务自己写了工具类，在宿主 CSS 里自行引入 Tailwind。
- 源码按组件分目录：`src/components/{name}/`。表格引擎从 `composables/` 并入 `src/components/table/`。样式源码为 `src/styles/index.css`。
- 去掉 `exports["./*"]`。只从包根具名导入，不要 `niuma-ui/components/...`。
- 1.x 维护线见 Git 分支 `1.x`（含 Tailwind 透传约定）。

### 迁移

1. 继续 `import 'niuma-ui/styles.css'`。
2. 若只为展开本包才装 `@tailwindcss/vite`，可以卸掉。
3. 深路径导入改回 `import { RsButton } from 'niuma-ui'`。
4. 仍要 1.3.x 行为请装 `niuma-ui@1` 或跟踪 `1.x` 分支。

## [1.3.9] - 2026-09-21

### 新增

- `RsAnchor`：页内目录。滚动容器可注入、墨点跟随、嵌套标题；Hash 路由设 `changeHash=false`。

### 文档

- 新增 `site/` 文档站（何时使用、代码演示、API、Design Token）。GitHub Pages 部署 `pnpm build:site`。`playground/` 仅内部测试，`pnpm dev` 不变。
- `docs/components.md` 补为维护者架构契约（红线、公开面分层、Token / Vue / 浮层 / 表单 / a11y / SSR、新增检查清单）；英文 `docs/components.en.md`。`CONTRIBUTING.md` 改为 site 优先，playground 不能代替文档站。
- `docs/components.en.md` 含完整组件清单；新增 `docs/consumers.en.md`；规范写明第三语言与 RTL 扩展步骤。中英清单必须同 PR 更新。
- README / 接入指南按消费方改写：用户页不写发版密钥；版本统一 1.3.8；快速开始可复制；`consumers.md` 与英文同步。发版步骤只留在 `CONTRIBUTING.md` / `CONTRIBUTING.en.md`。
- npm `description` 改为英文；`homepage` 指向文档站。`SECURITY.md` 中英并列。文档站指南页随 locale 切换英文正文。
- 架构契约写明外部规范范围：尽量遵守 WHATWG HTML、Vue Style Guide A/B、WAI-ARIA APG；Google HTML/CSS Style Guide 不作合同。冲突时语义 > APG 键盘 > Vue 风格。
- 明确 `playground/` 仅为内部冒烟与像素回归；对外用法只认 `site/` 文档站。playground 首页不再写安装教程。

## [1.3.8] - 2026-09-17

### 修复

- `RsSelect`：`size` 四档（`ssm` 极小 / `sm` / `md` / `lg`）同步到 Portal 下拉面板。选项行高、搜索框、空态跟触发器同档，不再一律按 md 高度。

## [1.3.7] - 2026-09-15

### 新增

- `RsDropdown`：`size`、`contentWidth="fit"`、菜单项 `hint`。工具条动作菜单走公开档位，不要 `:deep` 改菜单内边距。

## [1.3.6] - 2026-09-14

### 新增

- `RsSplitPane`：`fill`（默认关）铺满父级并拉高插槽根节点，业务不要 `:deep` 改 `.rs-split__pane`。
- `RsSplitPane`：`collapsible` 只表示可吸附折叠（拖过阈值 / Enter / `collapse()`）。分隔条不画折叠钮，与 Allotment、react-resizable-panels 一致。

## [1.3.5] - 2026-09-12

### 修复

- `RsTerminal`：默认 `minimumContrastRatio=4.5`。浅色主题下 `ls --color` 软链接（黑底叠深色字）不再看不清；传 `1` 可关闭。
- `RsTerminal`：`fit` 按宿主 `clientWidth/Height` 纠正行列，避免 FitAddon 把 `height: 100%` 算成内容高、PTY 停在默认 80×24。画布仍高出一行再减行。全屏清屏 / 进备用屏才回视口底部。

## [1.3.4] - 2026-09-11

### 修复

- `RsLog` 在 HTTP（非安全上下文）下复制：不再先走会失败的 Clipboard API（`await` 会丢掉用户手势），改为同步 `execCommand`；级别/行号不可选中，避免复制出「输出」「信息」。失败时工具栏提示复制失败。

## [1.3.3] - 2026-09-09

### 修复

- `RsLog` 开启 `wrap` 时不再把每一行拉成整栏高度，避免日志区上半空白、正文挤在底部。Playground `/log` 增加撑满栏折行示例；`/#/visual/rs-log` + `pnpm test:visual` 用几何断言锁行高（jsdom 测不到）。

## [1.3.2] - 2026-09-09

### 修复

- `rs-dayjs`：插件改从 `dayjs/esm` 引入。宿主 `optimizeDeps.exclude` `@niuma/ui` 时，Vite 不再把 CJS UMD 插件当成缺少 `default` 的 ESM。

## [1.3.1] - 2026-09-09

### 修复

- `RsLog` 工具栏复制改为复制全文（有选区仍只复制选区），不再只拷当前行或搜索匹配行。
- `RsInput`：`type="search"` 且 `clearable` 时隐藏浏览器自带取消钮，避免和组件清除 x 叠成两个（`RsLog` 过滤框同此）。
- `inferLogLevel`：只认方括号级别、行首级别词，以及 `BUILD SUCCESS` / `BUILD FAILURE` / `Exception in thread` / `panic:`。不再用正文里的「失败 / 成功 / error」上色；摘要句写 `RsLogLine.level`。

### 新增

- `RsFieldset`：表单分区。原生 `fieldset` / `legend`（WHATWG / WCAG 组名）。说明走标题旁 `tooltip`（locale `fieldset.help`）；`borderStyle` / `borderTone`（含 faded 虚化）；`titleWeight` / `titleTone` / `titleSize` 调标题清晰度。`description` 仍映射到 tip。Playground `/fieldset`。
- `RsButton`：`tone` 与 `variant` 正交（对齐 Ant `color` / Element `type`）。`variant="default" tone="warning"` 为描边 + 浅底语义色；`variant="primary" tone="success"` 为实心语义色。`variant="danger"` 仍保留。
- `RsTable`：`cellFocus`（`fill` / `outline` / `none`）。只读表可关掉焦点格内部底色，避免自定义插槽再套一块高亮；键盘漫游不受影响。
- `RsTextarea`：多行输入，边框 / 焦点 / 校验与 `RsInput` 同一套 token，可放在 `RsFormItem` 里。对齐 Ant `Input.TextArea` / Element textarea：`autosize`、`showCount`（无 `maxlength` 也可）、`clearable`、`pressEnter`、`focus()` / `blur()`。Playground `/textarea` 作为官方用法与参数说明。
- `RsFormItem`：`tooltip` 在标签同行显示帮助图标（对齐 Ant Design Form.Item），不再把说明单独占一行。
- `RsDialog`：window 布局支持 `height`（与 `width` 相同单位，`%` 相对视口扣除 inset），打开时作为初始高度。
- `RsLog`：只读日志查看器。按行虚拟滚动；级别对齐 RFC 5424 / OpenTelemetry（另保留 UI `success`）；默认带搜索与复制（选区 > 当前行 > 可见/匹配行，Ctrl/⌘+F / Ctrl/⌘+C）；过滤 / 行插槽；键盘漫游；级别不只靠颜色（色条 + 读屏名称）；`live` 默认 `off` 以免虚拟回收刷读屏。折行默认关闭虚拟（无变高虚拟）。作业与发版日志用这个，PTY 仍走 `RsTerminal`。Playground `/log`。
- `RsLog` / `inferLogLevel`：`inferMarkers` 供调用方传入成功 / 失败等标识（字符串按拉丁词边界，中日韩按子串；或 RegExp）。内置仍只扫 `[ERROR]`、行首级别词、工具链行首；多条标识同时命中取更严重档。行上已有 `level` 时不扫描。

## [1.3.0] - 2026-09-07

### 新增

- `RsTerminal`：`searchEnabled`（默认 `false`）打开终端内查找。`Ctrl/⌘+F`、右键「搜索」调出浮层；Enter / Shift+Enter 下一个 / 上一个，Esc 关闭。依赖 `@xterm/addon-search`，已列入 `niuma-ui/vite-prebundle/xterm`。
- `RsTerminal`：`copyOnSelect`（默认 `false`）在鼠标松开且有选区时复制，接近原生终端 copy-on-select。
- `RsTerminal`：`#overlayAction` 插槽。有插槽时遮罩可点，便于宿主放「重连」等操作；仅 `overlay` 文案时仍拦截点击。
- `RsTerminalAction` 增加 `search`。中英 locale：`terminal.search` / `searchPlaceholder` / `searchNext` / `searchPrev` / `searchClose`。

## [1.2.9] - 2026-09-01

### 修复

- `RsCodeEditor` 切换主题只换配色，不再拆掉重建，正文不会空白

## [1.2.8] - 2026-09-01

### 新增

- 选择器家族：`RsAutoComplete`、`RsCascader`、`RsTreeSelect`、`RsMentions`。
- `RsMentions` 按 [WAI-ARIA APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)：浮层贴插入符、Teleport 到 `body`、视口翻转夹边、方向键 / Home / End / Enter / Tab / Esc；测量节点复用，滚动用 rAF。不跟 Ant Mentions 的触发器内输入模型。
- `RsAutoComplete` 同样按 APG Combobox：建议列表贴输入框、Teleport、`placeAnchoredPopup` 视口翻转夹边并与框等宽。不再走 Reka 未开 popper 的错误落点。输入框与面板跟 `RsSelect` 同一套 token（elevated 表面、大阴影、焦点环、选项 hover）；匹配高亮用 span，避免 `<mark>` 被文档样式染成链接色。
- `RsSelect` 对齐 Ant / Element 的远程 `debounce`、匹配高亮、`variant`、`autoFocus`、`maxTagCount="responsive"`，以及 `focus` / `blur` / `dropdownVisibleChange` / `popupScroll`。面板内搜索与创建保持原交互。

## [1.2.7] - 2026-09-01

### 修复

- `RsSelect` 的 `multiple` 不再用泛型 boolean 声明（否则 `:multiple="true"` 可能进 attrs，Combobox 仍按单选）。触发器标签改看 `isMultiple`，空串 / 裸属性也会累加。
- `RsSelect` 的 v-model 按运行时收 `RsSelectModelValue`（string / number / 数组 / labeled），模板不必再写泛型。

## [1.2.6] - 2026-09-01

### 修复

- `niumaUiHost` 不再把 `reka-ui` / `@lucide/vue` / `vue-sonner` 写进宿主 `optimizeDeps.include`。这些包在 pnpm 下只装在 niuma-ui 里，cloud / site 解析不到会告警。
- `RsSplitPane` 的 `collapse` / `expand` 在尺寸已到位时不再提交新数组、不再重复发事件。

### 变更

- `exports` 一律指向 `dist`（含 vite-plugins）。开发仓 `pnpm install` 时若还没有 dist，`prepare` 会编一次；npm 包没有 src，不会重编。`pnpm dev` 联调源码仍由 `niumaUiHost` 改写。

## [1.2.5] - 2026-08-30

### 变更

- 发布桶 `dist/index.js` 改为带 `from` 的真实 re-export，与 `.d.ts` 同形。宿主 `import { RsButton } from 'niuma-ui'` / `export { RsButton } from '@niuma/ui'` 在 `vite build` 下走包主入口，不再依赖改写插件。
- `niumaUiHost` 改写只服务 `pnpm dev`（源码 HMR）。`vite build` / CI 不改写导入。
- `exports` 增加 `"./*": "./dist/*"`，不再手补 `lib` / `icons` 等子目录。

### 修复

- `niumaUiHost` 改写宿主 `.vue` 时只解析 `<script>`。此前把整份 SFC 交给 `es-module-lexer`，Vite 8 / Rolldown 在 `</script>` 处 `Parse error`。

## [1.2.4] - 2026-08-30

### 变更

- `styles.css` 自己收口盒模型：`html { box-sizing: border-box }`，其余 `inherit`。Rs* 宽高不再赌宿主 Tailwind Preflight。

## [1.2.3] - 2026-08-30

### 修复

- 库打包把脚本里的 `import './x.css'` 写回入口。此前 Vite 收成 empty css 注释，`RsTable` 的 `rs-table.css`、Monaco 调试装饰等旁路样式进不了 npm，Ops 等宿主生产表格 / 编辑器与 `pnpm dev` 对不齐。
- `niumaUiHost` 给 `styles.css` 补 Tailwind `@source`（宿主根 + 包内 components/composables）。CI 只处理 `node_modules` 里的 CSS 时，扫描范围与本机联调源码一致。

## [1.2.2] - 2026-08-30

### 修复

- `niumaUiHost` 能解析 npm `dist/index.js` 桶（`import X_default` + `export { X_default as RsX }`）。此前只认源码 `export { default as RsX } from './...'`，宿主 `vite build` 会把具名 re-export 收成 `export type`，官网等产品打包报 `MISSING_EXPORT`。解析不到运行时导出时直接失败，不再静默改成 type-only。

## [1.2.1] - 2026-08-30

### 变更

- Vite 插件按库级惯例收口：`niumaUiHost` 走 `es-module-lexer` + `magic-string` + `createFilter`，导出改为 `niuma-ui/vite-plugins/niuma-ui-host`；`monaco-zh-nls` 统一 `node:`；`silence-antlr-parse-console` 带 options 与 sourcemap。

### 变更

- `styles.css` 源码与 `dist` 都透传 `@import 'tailwindcss'`，打包不再剥掉。宿主只处理这一份，业务 CSS 不要再写一遍。
- 宿主插件 `niumaUiHost`：业务 `pnpm dev` 联调用到的源码（HMR），`vite build` / npm 走同一批组件的 `dist` 子路径。不要把主入口别名到 `src/index.ts`。轻量宿主在自己的 `ui.ts` 里具名 re-export，不在本包维护第二入口。

## [1.2.0] - 2026-08-30

### 变更

- npm 包改为发布编译后的 ESM + `.d.ts` + 独立 CSS（`dist/`），不再把 Vue/TS 源码当作入口。`npm` / `pnpm` / `yarn` 安装后按包名导入即可，不必 `shamefully-hoist`。
- `niuma-ui/styles.css` 为独立样式（token + vue-sonner），**不再** `@import 'tailwindcss'`。`package.json` 增加 `style` 字段。
- Vite 插件改为发布 JS + `.d.ts`（`niuma-ui/vite-plugins/*`）。
- 类型声明指向 `.js`，不再把 `.vue` 当作模块说明符。
- `engines` 只约束 Node ≥ 20；`vue` peer 放宽为 `^3.5.0`；`vite` 为 optional peer（仅插件 / Monaco Worker 需要）。
- 正式发布带 npm provenance（`publishConfig.provenance` + CI `--provenance`）。
- 新增 `pnpm build`（`prepublishOnly` 发版前自动执行）。本机 `link` 联调仍可用源码 HMR。
- 新增子路径 `niuma-ui/vite-prebundle/codemirror` 与 `niuma-ui/vite-prebundle/xterm`，供宿主 Vite `optimizeDeps`。

### 说明

- 本包面向运维控制台 / 数据库工作台。安装会带上 Monaco、CodeMirror、xterm；官网等轻量场景请具名导入并自建薄封装。后续若提供 `lite` 入口将是加法，不改主包合约。

## [1.1.12] - 2026-08-30

### 说明

- 正式版 `pnpm publish` 打 npm dist-tag `latest`；预发布打 `next`。不维护 GitHub 标签 `latest`。niuma-cloud / NiuMa 流水线从 npm 装 `@latest`（可用 `NIUMA_UI_VERSION` 钉死）。

## [1.1.11] - 2026-08-29

### 优化

- `RsTree`：`nodes` 变更不再 `deep` 监听，避免万级节点每次替换都整树深遍历；仍会清空拖拽态。

## [1.1.10] - 2026-08-29

### 修复

- `RsTree`：虚拟 / 限高视口套上 `rs-native-scrollbar`，滚动条颜色随 `--rs-*` 主题变化。
- `RsContextMenu`：菜单改为实色底，不再依赖 `backdrop-filter`。CEF 等环境 GPU 崩溃后右键菜单不再透出下层。

## [1.1.9] - 2026-08-28

### 修复

- `RsTable`：子表 / 表头默认 `T = any`，避免 inject 子组件把插槽 `row` 收成 `object`。宿主 `#col="{ row }"` 即可用行字段，不必断言。公开类型仍导出 `RsTableSlots` / `RsTableColumnSlotProps`。
- `RsSelect`：增加泛型 `Value` / `Multiple` / `LabelInValue`，默认单选 `string`。`@update:model-value` 不再是 `string | number | 数组 | labeled` 大联合。数字 value 写 `RsSelect<number>`；`labelInValue` 仍可用。
- `RsSplitPane`：导出 `RsSplitPaneExpose` / `RsSplitPaneInstance`，模板 ref 用该类型，避免 `InstanceType<typeof RsSplitPane>` 把 vue-tsc 打爆。
- `RsMonacoEditor`：导出 `RsMonacoEditorExpose`，模板 ref 用该类型，避免 `InstanceType<typeof RsMonacoEditor>` 把 vue-tsc 打爆。
- `RsInput`：导出 `RsInputExpose` / `RsInputInstance`，模板 ref 用该类型，避免 `InstanceType<typeof RsInput>` 把 vue-tsc 打爆。

运行时兼容 1.1.8；以上为 TypeScript 合约收口。

## [1.1.8] - 2026-08-28

### 新增

- `RsCodeBlock`：`editable`（默认 `false`，只读行为不变）；可写时 `update:code` 同步正文；expose `getSelection` 返回选区文本与起止行号。可写态显示光标。`showBar`（默认 `true`）为 `false` 时隐藏语言条与复制/下载。
- `RsTree`：`node-contextmenu`（`node, key, event`）；行节点带 `data-tree-key`，便于宿主挂右键菜单。
- `RsPopover.popupClassName`：附加到弹出层 class，对齐 `RsSelect`。
- `renderMarkdownInline`：行内 Markdown（不包 `<p>`），并从包入口导出。

### 修复

- `RsButton`：内置 `tooltip` 打开时 Teleport 到 `document.body`（`position: fixed`），避免侧栏 / Dialog 等 overflow 父级裁切。关闭即卸载；延迟 300ms、Escape 关闭；有可见文案时用 `aria-describedby`，仅图标走 `aria-label` 不重复朗读。
- `RsMarkdown`：GFM 表格对齐 `align`；裸 URL 与行内代码中的 `http(s)` 可点击；任务列表改为 span 标记并禁止消毒后的 `<input>`。

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
