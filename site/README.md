# 文档站（对外用法）

[English](./README.en.md)

`site/` 是 niuma-ui **唯一对外用法说明**。国际使用者应能看懂何时用、怎么写、事件落在哪。写决策，不抄别家页面。

| 入口 | 地址 |
|------|------|
| 本地 | `pnpm dev:site` → http://127.0.0.1:5181 |
| 官网 | https://blair-shang.github.io/niuma-ui/ |
| 路由 | Hash：`#/components/{slug}`、`#/guide/{slug}` |

`playground/` 只做内部冒烟与像素回归（`:5180`），禁止当用法说明。架构契约仍在 [docs/components.md](../docs/components.md)。

## 文件分工

| 路径 | 只写什么 |
|------|----------|
| `catalog/components/{group}.ts` | 介绍、何时使用、演示目录、**props / events / slots / methods**、Token、FAQ |
| `demos/{slug}.vue` | `DocDemo`：预览 + 可复制代码 |
| `src/components/{slug}` | 实现。catalog 必须跟源码走，禁止编造 prop |

`slug` = 组件目录名 = 路由。分组只改 catalog：`basic` / `form` / `nav` / `feedback` / `data` / `editor`。

演示与文档**禁止** `import … from 'reka-ui'`，只从 `niuma-ui` 导入。

## Catalog（API 必须写全）

每个 `ComponentDoc` 按 `RsXxx.vue` 的 `defineProps` / `defineEmits` / `defineModel` / `<slot>` / `defineExpose` 逐项登记。缺一项即未完成。

| 字段 | 要求 |
|------|------|
| `description` + `descriptionEn` | 首段说明形态与边界，不是 slogan |
| `whenToUse` + `whenToUseEn` | 决策列表：何时用、何时用别的组件 |
| `demos` | `{ id, title, titleEn }`，`id` 与 `DocDemo` 的 `id` 一致 |
| `props` | `name` / `type` / `default` / `description` / **`descriptionEn`**。有默认值写 `defaultEn` |
| `events` | 组件 `emit` 与 `update:*`（含 `v-model`）。**没有**组件事件也要写明（如 Icon：`none`，原生监听会落到 svg） |
| `slots` | `default` 与全部具名插槽 |
| `methods` | `defineExpose` 的**每一个**键：函数与暴露出去的实例 / ref。没有 `defineExpose` 也要写明 `none` |
| `tokens` | 该组件写入或依赖的 `--rs-*` |
| `faq` | 选型、幽灵 API、事件为何没反应 |

禁止：

- 目录里出现源码没有的字段（例如 Divider 的 `label`、Scrollbar 的 `direction`）
- 只写中文一行 `description`，国际页读不懂
- 用泛型 `string` 代替实际联合类型
- 漏掉 `v-model` 对应的 `update:*`
- 漏掉 `defineExpose` 里的任何一个键（含只给父组件用的校验 / 开关方法）

## Methods（`defineExpose`）

`catalog.methods` 与源码 `defineExpose({ ... })` **键集合必须相同**。少写、多写、改名都算未完成。

要登记的不只是「给产品模板 `ref` 用的命令式 API」：

| 谁在调用 | 也要写进 methods |
|----------|------------------|
| 宿主：`formRef.value.validate()`、`dialogRef.value.close()` | 是 |
| 本库父组件：Form 调 FormItem 的 `validate` / `setValue` | 是 |
| 暴露的实例：`view`、`getViewport()` 拿到的 DOM / 编辑器 | 是 |

每一行写：`name`、完整类型（参数 + 返回值）、`description` + `descriptionEn`。一句话写清谁调用、做什么、失败时返回什么。

没有 `defineExpose` 的组件（Button、Icon）在 methods 写 `none`，不要留空让人以为漏了表。

子控件（`RsFormItem`、`RsConfirmDialog`、列选择器等）只要自己 `defineExpose`，必须在对应文档页列出；不要只写父组件那一张表。

禁止：

- 只登记「对外看起来重要」的两三个方法，把内部调用的藏起来
- 把未 expose 的文件内函数写成 methods
- 只写中文方法名说明

## 演示（`demos/{slug}.vue`）

完整示例：`demos/button.vue` / `icon.vue` / `link.vue`。

1. **国际化**：站点壳层走 **vue-i18n**（`site/locales/{locale}/` 按 nav / home / doc 拆文件，`t('doc.showCode')` / `chrome`）。语言与 `RsConfigProvider.locale` 同步（`setSiteLocale`），并写入 `localStorage`。catalog 成对字段仍用 `pickSitePair`（非中文回退英文）。演示预览用 `useSiteDemo({ 'zh-CN', 'en-US', … })`。**禁止** `isEn`。加语言：复制一份 locale 目录 + `SITE_LOCALES` + 演示字典；未补演示回退 `en-US`。vue-i18n 只在文档站，不进 niuma-ui 包。
1b. **主题**：颜色走 `--rs-*`；深色岛用 `data-rs-theme`。要读当前明暗用 `useSiteI18n().resolvedTheme`（与顶栏 `setTheme` 同一条），不要写死 hex。
2. **可复制代码**：`code` 用英文示例，与预览同一套 API，不要只展示中文 JSX 注释。
3. **讲用法，不展览 props**：每段一个决策（形态、禁用、组合）。颜色走 token；深色底用 `data-rs-theme`，不要写死 hex。
4. **事件可感知**：有 `click` / `change` / `close` 就绑回调并在预览里显示结果（如 `click → Save`）。`loading` 拦住要点出来。没有组件事件就同时写出「点图标没反应 / 点按钮有回调」。
5. **可点击走控件**：操作绑 `RsButton` / 原生语义节点。不要给装饰性 `RsIcon` 绑 `@click` 当按钮（没有焦点环）。
6. **插槽看得到**：有 `#header` / `#trigger` / `#fallback` 就在演示里用，不要只写在 API 表。
7. **方法看得到**：宿主会调的 expose（`validate`、`close`、`scrollTop`、`focus`）用模板 `ref` 加一颗按钮，预览里显示调用结果。只给本库父组件用的方法可以不做按钮，但仍须出现在 methods 表。

## 新增或改 API 时

1. 先改 `src/components/{slug}` 与测试。
2. 同步 `catalog/components/{group}.ts`（中英 props / events / slots / methods）。
3. 同步 `demos/{slug}.vue`（缺段补 `DocDemo`；事件与宿主会调的 expose 要能点出结果）。
4. 更新 [docs/components.md](../docs/components.md) 清单与 `CHANGELOG.md` `[Unreleased]`。

完整页：`#/components/button`、`#/components/icon`、`#/components/link`、`#/components/badge`、`#/components/tag`、`#/components/divider`、`#/components/avatar`、`#/components/card`、`#/components/stat-card`、`#/components/container`、`#/components/scrollbar`、`#/components/form`、`#/components/input`、`#/components/textarea`、`#/components/input-number`、`#/components/checkbox`、`#/components/radio`、`#/components/switch`、`#/components/select`、`#/components/auto-complete`、`#/components/cascader`、`#/components/tree-select`、`#/components/mentions`、`#/components/label`、`#/components/fieldset`、`#/components/dynamic-tags`、`#/components/upload`、`#/components/date-picker`、`#/components/datetime-picker`、`#/components/time-picker`、`#/components/calendar-grid`、`#/components/anchor`、`#/components/breadcrumb`、`#/components/menu`、`#/components/sidebar`、`#/components/tabs`、`#/components/steps`、`#/components/dropdown`、`#/components/toolbar`、`#/components/split-pane`、`#/components/pagination`、`#/components/alert`、`#/components/empty`、`#/components/loading`、`#/components/loading-bar`、`#/components/tooltip`、`#/components/popover`、`#/components/dialog`、`#/components/confirm-dialog`、`#/components/drawer`、`#/components/toaster`、`#/components/descriptions`、`#/components/virtual-list`、`#/components/code-block`、`#/components/code-editor`、`#/components/monaco-editor`、`#/components/markdown`。
