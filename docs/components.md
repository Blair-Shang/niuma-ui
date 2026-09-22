# 组件规范

本文是 `niuma-ui` 的**架构契约**。改组件、加导出、动 Token 之前先对照这里。违反下列红线即破坏架构，须 MAJOR 或先收回。

English: [components.en.md](./components.en.md)。两份清单必须同步更新。接入：[consumers.md](./consumers.md) / [consumers.en.md](./consumers.en.md)。贡献：[CONTRIBUTING.md](../CONTRIBUTING.md) / [CONTRIBUTING.en.md](../CONTRIBUTING.en.md)。

稳定导入只允许包根：

```ts
import { RsButton, RsConfigProvider } from 'niuma-ui'
```

**禁止** `import … from 'reka-ui'`，禁止未文档化的深路径（`niuma-ui/src/…`、内部 `*-utils` 文件）。

---

## 1. 文档分工（不要写错地方）

| 文档 | 只写什么 | 不写什么 |
|------|----------|----------|
| **本文** | 架构红线、命名、公开面、Token、Vue/CSS/浮层/表单/a11y/i18n/SSR、新增检查清单、组件目录 | 某个 prop 的逐条 API（去文档站） |
| `site/` | 对外用法：何时使用、Demo、API、Token、FAQ | 内部像素回归 |
| `playground/` | 维护者冒烟与像素回归 | 对外用法、安装教程、完整 API |
| `src/index.ts` | 唯一 SemVer 公开面 | 未登记的「顺便导出」 |
| `docs/consumers.md` | 宿主 Vite / 体积 / CI | 组件内部结构 |
| `CONTRIBUTING.md` | PR、测试、发版 | 重复本文细则 |

组件 API 以文档站为准：`#/components/{slug}`（本地 `pnpm dev:site`）。清单与 `site/catalog/components/` 必须同增同删。

---

## 2. 架构红线

维护者**不得**在未开 Issue / 未 MAJOR 的情况下做这些事：

1. 让业务或文档站直接依赖 `reka-ui`、Lucide 内部路径、或本包 `src/` 深路径。
2. 在 `src/index.ts` 增加导出却不更新本文「公开面」与文档站。
3. 把 DOM 实现细节（滚动计算、墨点、Portal 节点查询）当成稳定 API 导出。
4. 用 `:deep` 或硬编码 px / hex / system 字体栈代替 `--rs-*`。
5. 新开平行包、平行入口、或第二套主题属性（主题只走 `data-rs-theme` + `RsConfigProvider`；`system` 只多一个 `data-rs-theme-pref`）。
6. 在宿主产品仓复制一份 `Rs*` 并改内部类名。要改，回本仓改。
7. 把 Monaco / xterm / 表格富编辑打进轻量默认路径，或要求营销站 `import *`。
8. 把 `playground/` 写成对外用法或官网；对外说明只认 `site/`。
9. 拆掉 `*-utils.ts` 的纯函数，把可测逻辑写回模板。
10. 用 `window` / `document` 在工具函数里假设浏览器一定存在（SSR / jsdom 必须可退化）。
11. 能用原生 HTML 语义时改用 `div` + `role` / 自造键盘（WHATWG 优先；APG 的第一条也是「先用原生」）。
12. 新的对话框、菜单、 Combobox、Tabs、Grid / Tree 不按 [APG](https://www.w3.org/WAI/ARIA/apg/) 做键盘、焦点与可访问名称。

拿不准：**不导出**。宿主真需要，先写进本文再导出。

### 外部规范（遵守范围）

下列规范中适用于本库的条款必须遵守。冲突时：WHATWG 语义 > APG 键盘/角色 > Vue 风格。不把整本规范当作已全文审计。

| 规范 | 怎么遵守 | 不怎么遵守 |
|------|----------|------------|
| [WHATWG HTML](https://html.spec.whatwg.org/multipage/) | 按钮用 `<button type>`，分组用 `fieldset`/`legend`，导航用 `<nav>`，链接用 `<a href>`，禁用走原生 `disabled` 并转发 | 不把组件库写成「完整 HTML 文档规范」。工作台控件（虚拟表格、日志）在原生不够时才上 ARIA widget |
| [Vue Style Guide](https://vuejs.org/style-guide/) | **A（防错）必须**；**B（强烈建议）新代码必须**（含 `defineOptions({ name: 'RsXxx' })`、禁止同节点 `v-if`+`v-for`） | **C** 已选定：Composition API + `<script setup>` + scoped，不再每 PR 重选。**D** 少用（`$parent`、递归隐式、非受控与受控混用无文档） |
| [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) | 自定义 widget 对上对应 pattern：Dialog、Menu、Combobox、Tabs、Grid、Tree、Window Splitter。可访问名称、焦点陷阱、`Esc`、方向键以 APG 为准；装饰物 `aria-hidden` | 不做「每个 pattern 的读屏矩阵已签核」的对外承诺，直到该组件有键盘单测或清单 |
| Google HTML/CSS Style Guide | **不作为本库规范** | 省略可选闭合标签与 Vue 模板冲突；类名用 BEM `.rs-block__el--mod`，不用 Google 短横线单词表 |

实现细节见 §7、§10、§12。存量债（例如部分 `Rs*` 尚未写 `name`）新 PR 顺手补，新组件不得再缺。

---

## 3. 命名与文件

| 种类 | 规则 | 例 |
|------|------|-----|
| 公开组件 | `Rs` + PascalCase，`defineOptions({ name: 'RsXxx' })` | `RsAnchor.vue` |
| 公开类型 | `Rs` 前缀 | `RsAnchorItem`、`RsButtonTone` |
| 内部工具 | kebab + `-utils.ts`，**无** `Rs` 文件名 | `anchor-utils.ts` |
| 内部函数 | 可无前缀；一旦导出必须 `Rs` 或已登记动词（`flattenAnchorItems`） | |
| CSS 块 | `.rs-{name}`，元素 `__`，修饰 `--` | `.rs-anchor__link--active` |
| Token | `--rs-*`；子系统 `--rs-table-*` / `--rs-terminal-*` / `--rs-log-*` / `--rs-code-*` / `--rs-prose-*` | |
| 文档站 slug | kebab-case，与文件 `site/demos/{slug}.vue` 一致 | `anchor`、`code-editor` |
| 语言包 key | `dot.case`，组件名小写 | `anchor.label`、`breadcrumb.separator` |

### 3.1 组件目录

```text
src/
  components/{slug}/
    index.ts            # export { default as RsXxx } from './src/RsXxx.vue'
    src/                # 实现：SFC + *-utils.ts（默认平铺）
    style/              # 仅有独立 CSS 时（如表格 rs-table.css）
    __tests__/          # 本组件单测（不进 npm）
  components/table/     # 唯一「引擎级」例外，见 §3.2
  components/_shared/   # 跨组件内部工具；公开 helper 仍只经 src/index.ts
  composables/          # 跨组件：useRsConfig、useRsI18n、useRsToast …
  utils/                # 无 DOM：日期、剪贴板
  styles/index.css      # token + reset + 全局样式
  theme/                # token 类型、预设、applyTheme
  locale/               # zh-CN / en-US
  monaco/               # Worker / 语言，仅编辑器路径
  icons/                # 注册表，不是第三套图标体系
  dev/                  # 宿主 Vite prebundle 种子（CodeMirror / xterm）
  __tests__/            # 仅 setup 与跨组件冒烟
  index.ts              # export { RsXxx } from './components/{slug}'
```

**组件与组件之间按 slug 平铺**（`components/table`，不要 `data/table`）。**每个组件内部**固定四槽：`index.ts` / `src/` / 可选 `style/` / `__tests__/`。目录名 = `site/catalog` 的 slug。一个对外组件一个目录（`tree-select/` 不进 `select/`）。子控件（`RsRadioItem`、`RsFormItem`、`RsConfirmDialog`）跟父组件目录。

归类（只改 `site/catalog/components/{group}.ts`，不改源码层级）：

| group | 放什么 |
|-------|--------|
| `basic` | 按钮、图标、链接、徽章、标签、分割、头像、卡片、容器、滚动条、ConfigProvider |
| `form` | 表单与录入控件（含 TreeSelect、Upload、日期时间） |
| `nav` | 锚点、面包屑、菜单、侧栏、页签、步骤、下拉、工具条、分栏、分页 |
| `feedback` | 提示、空态、加载、浮层、对话框、抽屉、右键、Toaster |
| `data` | 表格、树、虚拟列表、描述列表、统计卡 |
| `editor` | 代码块 / 编辑器、Markdown、日志、终端、Prose |

新官方组件只加 `src/components/{slug}/`（`index.ts` + `src/RsXxx.vue` + `__tests__/`；逻辑进 `src/*-utils.ts`）。`src/index.ts` 只写 `export { RsXxx } from './components/{slug}'`，不要指到 `.vue` 深路径。禁止在 `src/` 根再开平行「组件包」。禁止把实现摊回组件根目录（根上只留 `index.ts`）。禁止再开 `src/lib/`。禁止按 group 嵌套源码目录。禁止没有独立 CSS 时空建 `style/`。

### 3.2 何时再拆 `src/`

`src/` **默认平铺**。只有同时满足下面两条才分子目录：

1. 实现文件（不含测试）**超过约 12 个**，或出现两块以上独立 UI 区域（表头 / 表体 / 表尾）。
2. 子目录名表示职责，不用 group：`table-header`、`composables`、`utils`、`context`、`features`。

2.0 只有 `components/table/src` 达标。Form（8）、CodeEditor（8）及以下保持平铺。禁止给 Button / Input 预建空的 `composables/`。

### 3.3 仓库根（本包目录）

```text
src/            库源码（唯一实现）
site/           对外文档站
playground/     内部冒烟，禁止当用法说明
e2e/            Playwright 像素回归
docs/           维护者契约（不进 npm）
vite-plugins/   宿主 Vite 插件源码
scripts/        构建 / 准备脚本
dist/           构建产物（gitignore，npm files 发布）
```

禁止在仓库根再开第二套 `components/`。`playground-dist` / `site-dist` / `test-results` 只作本地产物，不提交。

### 3.4 发布面（`package.json`）

| 字段 | 2.0 约定 |
|------|----------|
| `exports["."]` | 唯一组件入口：`dist/index.js` + `dist/index.d.ts` |
| `exports["./styles.css"]` | 独立样式，不含 Tailwind |
| `exports["./vite-plugins/*"]` | 工具链，不是日常组件导入 |
| `exports["./vite-prebundle/*"]` | 宿主 Vite 预构建种子 |
| `files` | 只 `dist`、`LICENSE`、`NOTICE`、`README*.md`、`CHANGELOG.md` |
| 禁止 | `exports["./*"]`；把 `src/`、`docs/`、`site/` 写进 `files` |

消费方只 `import { RsButton } from 'niuma-ui'` 与 `import 'niuma-ui/styles.css'`。深路径（`niuma-ui/src/…`、内部 `*-utils`）无 SemVer。

---

## 4. 公开面与 SemVer

仅 `src/index.ts` 的符号享受 SemVer。分四层：

| 层 | 可导出 | 例 | 变更 |
|----|--------|----|------|
| **组件** | `Rs*` SFC | `RsAnchor` | 删组件 / 改默认行为 → MAJOR |
| **契约类型** | props / item 上出现的类型 | `RsAnchorItem`、`RsButtonVariant` | 改字段 → MAJOR |
| **宿主 helper** | 无 DOM、有单测、文档站或 consumers 写过 | `hrefToAnchorId`、`resolveRsButtonVariant` | 改语义 → MAJOR |
| **内部** | 不导出 | `scrollContainerTo`、`findLinkByHref` | 可随时改 |

新增导出的检查：

1. 类型是否出现在公开 props / 事件上？是 → 导出类型。
2. 宿主是否必须调用才能正确集成？否 → **不要导出**。
3. 导出后写入本文清单或文档站 API，并加单测。

破坏性变更（须 MAJOR + CHANGELOG 迁移说明）：

- 更名 / 删除 props、事件、插槽、导出、CSS 类、Token
- 改变 `v-model` 类型或默认值语义
- `changeHash` 等默认值翻转

兼容（MINOR / PATCH）：新增可选 props、新增组件、修 bug 且旧用法结果不变。

---

## 5. Token、尺寸、圆角、排版

主题只通过 `RsConfigProvider` + `data-rs-theme`。`theme` 可为 `light` | `dark` | `system`。`system` 跟 `prefers-color-scheme`，`applyTheme` 仍把解析结果写成 `data-rs-theme="light|dark"`，并标 `data-rs-theme-pref="system"`。无属性时 CSS 按浅色（`:root:not([data-rs-theme])`），与 Provider 默认 `light` 一致。首屏请在 `index.html` 写好 `data-rs-theme`。

色值只认 `styles.css` / 宿主 brand.css。`themePresets` 是参考色板，不驱动画面。品牌覆盖复制 `src/theme/brand.example.css`，在 `styles.css` **之后**加载同名 `--rs-*`。

可安装的颜色主题走 `applyColorTheme`。一份主题是 `{ id, label, uiTheme, colors }`：`id` 不翻译（如 `example.ink`），`label` 用英文，`uiTheme` 只能是 `light` 或 `dark`，`colors` 只填 `RS_COLOR_THEME_VARS` 里的语义令牌。调用后把这些 `--rs-*` 写到元素内联样式上，并标记 `data-rs-color-theme`（身份，组件样式不要选择它）。`clearColorTheme` 回到样式表。未列入的键和含 `url(`、分号的值会被丢掉。跟随系统仍先解析明暗，再套上该明暗下选中的颜色主题。同一明暗换皮肤时，代码编辑器、Monaco、终端和代码块会重读 token。

文字只认 `--rs-text-primary` / `--rs-text-secondary` / `--rs-text-tertiary` / `--rs-text-disabled` / `--rs-text-inverse` / `--rs-text-link`。`--rs-text` / `--rs-muted` / `--rs-placeholder` 只是别名，新覆盖不要写它们。

Lucide 线标走 `--rs-icon-color`。数据源品牌 mark 色是可选子系统：`import 'niuma-ui/brand-icons.css'`（`--rs-icon-{name}-accent`）。不引入则 mark 为 `currentColor`。

高对比：`forced-colors: active` 时语义 token 映射到 `Canvas` / `CanvasText` / `Highlight` 等系统色，组件不必各写一套。

禁止：

- 组件里写死 `#6366f1`、`14px`、`system-ui, sans-serif`
- 业务 `:deep(.rs-xxx)` 改高度 / 圆角 / 字号（应用 `size` / `radius` / Token）
- 新开 `--niuma-*`、`--el-*` 第二套变量

尺寸（`RsComponentSize`）：`ssm` < `sm` < `md`（默认）< `lg`。高度走 `--rs-control-height-*`。解析顺序：**props → `RsForm` → `RsConfigProvider` → `md`**。用 `useResolvedRsComponentSize` / `resolveRsComponentSize`，不要自己读 context。

圆角（`RsRadius`）：`none | xs | sm | md | lg | full`。用 `useResolvedRsRadius` / `rsRadiusCss`，对应 `--rs-radius-*`。

字号 / 字重 / 字族：只走 `--rs-font-size-*`、`--rs-font-weight-*`、`--rs-font-sans|mono|serif`。CodeMirror / Monaco / xterm 只要数字时，用 `readCssLengthPx` / `readCodeFontFamily` 从 Token 读。

z-index 只使用 `--rs-z-tooltip`（10）、`--rs-z-dropdown`（50）、`--rs-z-panel`（80）、`--rs-z-modal`（100）、`--rs-z-loading-bar`（190）、`--rs-z-toast`（200）。禁止魔法数字。

---

## 6. 形态 × 语义色

形态与色相分开，禁止一个 prop 同时改形状和颜色。

- **`variant`**：形态（实心 / 描边 / 幽灵 / 文字 / 链接）。不要用 variant 表达「危险」。
- **`tone`**：色相（`neutral` / `primary` / `danger` / `success` / `warning` / `info`）。

`RsButton`：`variant="default" tone="warning"` 才是描边警告。历史 `variant="danger"` 视为 `primary + tone=danger` 的兼容别名，新组件不要再发明这种混用。

新组件若同时有形态和颜色，必须正交，禁止再做一个 `type="success"` 同时改形状和颜色。

---

## 7. Vue 契约

```vue
<script setup lang="ts">
defineOptions({ name: 'RsXxx' })
const model = defineModel<string>({ default: '' }) // 单值优先 defineModel
</script>
```

遵守 [Vue Style Guide](https://vuejs.org/style-guide/) 的 A/B。公开组件**必须** `defineOptions({ name: 'RsXxx' })`（文件名不能代替 `name`，DevTools / keep-alive / 警告栈都靠它）。

| 主题 | 规则 |
|------|------|
| 受控值 | 优先 `defineModel` / `v-model`。多值用 `v-model:visible` 这种具名。 |
| 事件 | 用户动作 `click` / `change`；值同步走 `update:modelValue`。载荷用元组 `defineEmits<{ change: [href: string] }>()`。 |
| 布尔 props | 默认 `false`，在模板里当开关（`affix`、`lineless`）。 |
| 函数 props | `getContainer?: () => HTMLElement \| Window \| null`，允许返回空，组件自己回退。 |
| 插槽 | `default` 主内容；具名用语义英文（`prefix` / `suffix` / `title`）。不要 `#slot1`。 |
| 禁用 | `disabled` 统一词，并转发到原生 / ARIA。 |
| 尺寸 | 控件类 props 叫 `size`，类型 `RsComponentSize`。 |
| Hash 路由 | 会写 `location.hash` 的能力必须提供关闭开关（如 `changeHash`，文档站默认 `false`）。 |

组件只做 UI 与已有 Token / 已有宿主桥。禁止在组件里直连数据库、写 SQL、或复制产品后台逻辑。

---

## 8. CSS

- 根类 `.rs-{name}`，与 `name: 'RsXxx'` 对应（Anchor → `rs-anchor`）。
- 状态用修饰类，不用内联调色：`.rs-anchor__link--active`。
- 间距 / 颜色用 Token 或 `color-mix(in srgb, var(--rs-primary) …)`。
- 逻辑属性：`inset-inline-start`、`padding-inline`、`margin-block`，方便以后 RTL。
- `scoped` 只包自己的块。改子组件外观用 props / Token，不 `:deep` 掏内部。
- 动效尊重 `prefers-reduced-motion: reduce`（滚动 `behavior: 'auto'`，缩短或取消 transition）。

---

## 9. 浮层

Tooltip / Popover / Dropdown / Dialog / Drawer / ContextMenu / Select 面板：

1. 原语只封装在本包 `components/reka` 一类入口，**对外仍是 `Rs*`**。
2. 弹出层走 Portal，z-index 用第 5 节的 `--rs-z-*`。
3. 模态层必须焦点陷阱、Esc 关闭、恢复焦点；非模态不锁滚动。
4. 定位复用已有 `overlay-utils`（翻转、夹视口），不要每个浮层重写一套。
5. 文档站与工作台共用同一套，禁止 site 里再引一个 headless 库。

---

## 10. 表单

- 字段唯一注册点是 `RsFormItem`，不是每个 Input 自己挂到 Form。
- 控件加入 Form 时走 `form-utils` 的 context，尺寸跟随 Form。
- 校验消息走 `validateMessages` / locale，不要硬编码中文。
- `RsFieldset` 是 WHATWG `fieldset`/`legend`，**不是** `RsCard`。
- `RsFormList` 只管理数组字段（`add` / `remove` / `move`）。

---

## 11. 国际化

组件 API（props / 事件 / 插槽 / 类名）只用英文；用户可见字符串必须可翻译。

- 运行时文案（`aria-label`、空态、占位、按钮）走 `useRsI18n()` + `src/locale/messages.ts`。
- **内置 locale：** `zh-CN`、`en-US`（BCP-47）。未设 `locale` 时按本机语言选择（`zh*` → `zh-CN`，`en*` → `en-US`），认不出回退 `zh-CN`。新增或修改 key 必须两种语言同一天合入。社区语言：[docs/locales.md](./locales.md)。
- **内置 locale 只维护 `zh-CN` / `en-US`。** 其它语言由使用方或社区用 `registerRsLocale` 登记，本包不发官方 ja / ar / ko 等表。
- **第三方语言：** `registerRsLocale('ja-JP', messages, { dir: 'ltr' })`，然后 `RsConfigProvider locale="ja-JP"`。缺 key 回退 `en-US` → `zh-CN`。不要再改 `RsLocale` 联合类型。
- 数字 / 日期走 `Intl.*`。`t()` 支持 ICU 子集复数：`{count, plural, one {# item} other {# items}}`，可用 `=0`；类别由 `Intl.PluralRules(locale)` 决定，`#` 换成数字。组件里传 `{ count }` / `{ total }`，不要 `.replace('{total}', …)`。
- **书写方向：** `RsConfigProvider dir`（`ltr` / `rtl` / `auto`）。`auto` 跟 locale（`ar` / `he` / `fa` / `ur` 为 rtl）。写入元素的 `dir`、`lang`、`data-rs-dir`。CSS 只用逻辑属性（`padding-inline-start`、`inset-inline-end`、`text-align: start`）；禁止负 margin 硬翻，不开第二套类名。视口居中的 `left: 50%`、Drawer / Toaster 的物理 `left`/`right` 放置、对话框拖拽把手、JS `style.left` 除外。RTL 像素回归：Playground `/#/visual/rs-rtl`，`pnpm test:visual`。
- 文档站文案在 `site/i18n.ts`，**不要**把官网句子写进组件 locale。
- 仓库规范文档中英文同步更新（`docs/*.md` 与 `docs/*.en.md`）。组件清单两份一起改。

---

## 12. 无障碍

遵守 [APG](https://www.w3.org/WAI/ARIA/apg/) 与 WCAG 2.2 AA。顺序固定：

1. **先原生**（WHATWG）：能用 `<button>` / `<a href>` / `<input>` / `fieldset` 就不要 `div[role=…]`。
2. **原生不够再用 ARIA**：角色、状态、键盘一次配齐，禁止只挂 `role` 不挂键盘。
3. **名称**：图标按钮必须 `tooltip` 或 `aria-label`；导航 `<nav>` + `aria-label`；当前项 `aria-current="page"` 或 `"location"`（页内目录用 `location`）。
4. **焦点**：`outline: none` 必须同时有 `:focus-visible` + `--rs-focus-ring`。模态层：陷阱、`Esc`、关闭后恢复焦点。
5. **装饰**：轨道 / 墨点 / 纯视觉图标 `aria-hidden="true"`。
6. **对照 pattern**：Dialog、Menu / MenuBar、Combobox、Tabs、Grid（`RsTable`）、Tree、Window Splitter（`RsSplitPane`）。新浮层先对 APG 再写样式。

状态色对比不得低于现有语义 Token（日志色条、终端 `minimumContrastRatio` 是先例）。

---

## 13. SSR 与运行时环境

工具函数必须能在无 `window` 时安全返回或空操作，禁止未守卫的 `throw`。

检测滚动容器用特征（`scrollY` / `nodeType`），不要依赖跨 iframe 的 `instanceof Window`。

`getElementById` 的 id 先 `decodeURIComponent`（hash 可能是 `%20` / 中文编码）。

---

## 14. 工具函数与测试

复杂逻辑放 `*-utils.ts`：纯输入输出、可单测。Vue 文件只绑生命周期、事件、样式。

`src/components/{slug}/__tests__/RsXxx.spec.ts` 最低要求：

1. 挂载冒烟（渲染标题 / 角色）。
2. 用户动作发出约定事件。
3. utils 的边界：空列表、编码、缺容器、默认值。

跨组件冒烟放 `src/__tests__/`。e2e / 像素回归仍在仓库根 `e2e/`。禁止用无断言的「能 import 就算过」。

---

## 15. 新增组件检查清单

缺一项即视为未完成。

1. `src/components/{slug}/src/RsXxx.vue` + 需要时 `src/xxx-utils.ts` + 根 `index.ts`（UTF-8 无 BOM）。`src/` 默认平铺，勿预建子目录（§3.2）。
2. `defineOptions({ name: 'RsXxx' })`，类名 `.rs-xxx`。
3. `src/index.ts` 写 `export { RsXxx } from './components/{slug}'`；公开类型 / 宿主 helper 按第 4 节筛选，从同一目录再导出。
4. `src/locale/messages.ts` 中英 key。
5. `src/components/{slug}/__tests__/RsXxx.spec.ts`。
6. `site/catalog/components/{group}.ts` 登记（`basic` / `form` / `nav` / `feedback` / `data` / `editor`）：介绍、何时使用、**props / events / slots / methods**、Token、FAQ。中英与源码对齐，细则见 [site/README.md](../site/README.md)。
7. `site/demos/{slug}.vue`（`DocDemo`，中英对照、可复制英文代码；有事件必须能点出结果）。
8. 更新本文「组件清单」；slug 与 catalog 一致。
9. `CHANGELOG.md` `[Unreleased]`。
10. 交互回归可补 `playground/routes.ts`（可选，**不能代替** site）。
11. 若是 Dialog / Menu / Combobox / Tabs / Grid / Tree：键盘路径按 APG（Tab / 方向键 / Esc / Enter），单测或 FAQ 写明。
12. 能用原生语义就不要新 `role`。

---

## 16. 重型模块

`RsMonacoEditor`、`RsTerminal`、`RsCodeEditor`、表格富编辑会拉大依赖。官网与轻量后台必须具名导入，并在产品层 `ui.ts` 再导出用到的符号。安装体积说明见 [consumers.md](./consumers.md)。

---

## 17. 组件清单

下列为稳定 `Rs*`。API 细节以文档站为准，此处只作 SemVer 目录。新增必须同步 `site/catalog`。

### 基础

| 组件 | 说明 | 文档站 |
|------|------|--------|
| `RsConfigProvider` | 主题、语言、默认控件尺寸 | `#/components` 根配置见指南 |
| `RsIcon` | Lucide（及自定义）按名渲染 | `#/components/icon` |
| `RsContainer` | 响应式宽度 / 内边距 | `#/components/container` |
| `RsScrollbar` | 滚动区域 | `#/components/scrollbar` |
| `RsLoading` | 加载指示；原生 div[role=status]，不包 Reka；可包裹内容 | `#/components/loading` |
| `RsEmpty` | 空状态；原生 div[role=status]，不包 Reka | `#/components/empty` |
| `RsLink` | 原生 `<a>` 文字链接（不包 Reka） | `#/components/link` |
| `RsBadge` | 状态芯片；可选 count / dot 角标 | `#/components/badge` |
| `RsTag` | 标签芯片 | `#/components/tag` |
| `RsAvatar` | 头像 / 回退（原生 img，不包 Reka） | `#/components/avatar` |
| `RsLabel` | 表单标签（原生 label，不包 Reka） | `#/components/label` |
| `RsCard` | 内容卡；原生 section，不包 Reka | `#/components/card` |
| `RsDivider` | 分隔线 | `#/components/divider` |
| `RsAlert` | 反馈提示条；原生 div，不包 Reka | `#/components/alert` |
| `RsDescriptions` / `RsDescriptionsItem` | 描述列表；原生 dl / dt / dd，不包 Reka | `#/components/descriptions` |
| `RsLoadingBar` | 顶栏进度；原生 div[role=progressbar]，不包 Reka（`useRsLoadingBar`） | `#/components/loading-bar` |

### 操作与输入

| 组件 | 说明 | 文档站 |
|------|------|--------|
| `RsButton` | `variant` × `tone`、加载、仅图标 | `#/components/button` |
| `RsCheckbox` | 复选框 | `#/components/checkbox` |
| `RsSwitch` | `checkedValue` / `uncheckedValue` | `#/components/switch` |
| `RsRadio` / `RsRadioItem` | 原生 radiogroup；`change` | `#/components/radio` |
| `RsInput` | 原生 input；校验；prefix/suffix；addon；`validate` / `setValue` | `#/components/input` |
| `RsTextarea` | 原生 textarea；autosize；`focus` / `validate` | `#/components/textarea` |
| `RsInputNumber` | 数字输入 | `#/components/input-number` |
| `RsSelect` | 原生 combobox；搜索 / 创建 / 远程 / `maxTagCount` | `#/components/select` |
| `RsAutoComplete` | 原生 combobox；自由输入；`search` / `focus` | `#/components/auto-complete` |
| `RsCascader` | 多列级联 | `#/components/cascader` |
| `RsTreeSelect` | 复用 `RsTree`；原生 button + Teleport，不包 Reka | `#/components/tree-select` |
| `RsMentions` | 原生 textarea combobox；插入符浮层；不包 Reka | `#/components/mentions` |
| `RsDynamicTags` | 原生 fieldset + input；可增删短文本；不包 Reka | `#/components/dynamic-tags` |
| `RsUpload` | 原生 file input；拖拽 / 粘贴 / 目录；不包 Reka；无存储协议 | `#/components/upload` |
| `RsForm` / `RsFormItem` / `RsFormList` | 表单、字段注册、数组字段 | `#/components/form` |
| `RsFieldset` | `fieldset`/`legend`，不是 Card | `#/components/fieldset` |
| `RsDatePicker` / `RsDateTimePicker` / `RsTimePicker` | 日期时间；DatePicker / TimePicker 原生 button + Teleport，不包 Reka | `#/components/date-picker` `#/components/datetime-picker` `#/components/time-picker` |
| `RsCalendarGrid` / `RsTimePickerColumns` | 日历 / 时间列原语；CalendarGrid 原生 table + button，不包 Reka | `#/components/calendar-grid` |

### 导航与布局

| 组件 | 说明 | 文档站 |
|------|------|--------|
| `RsBreadcrumb` | 面包屑；原生 nav + ol，不包 Reka | `#/components/breadcrumb` |
| `RsAnchor` | 页内目录；原生 nav，不包 Reka；Hash 路由须 `changeHash=false` | `#/components/anchor` |
| `RsToolbar` | 工具条；原生 header/div，不包 Reka；#start/#center/#end；可选 APG 键盘 | `#/components/toolbar` |
| `RsTabs` | 标签页；原生 tablist，不包 Reka；关闭 / 重命名 / 溢出 | `#/components/tabs` |
| `RsSteps` | 步骤条；原生 nav + ol，不包 Reka；v-model 绑 value | `#/components/steps` |
| `RsMenu` | 菜单；原生 nav + button / a，不包 Reka；折叠 flyout 走 Teleport | `#/components/menu` |
| `RsDropdown` | 下拉命令；原生 button + Teleport，不包 Reka | `#/components/dropdown` |
| `RsSidebar` / `RsSidebarGroup` / `RsSidebarItem` | 侧栏壳；原生 aside + nav，不包 Reka | `#/components/sidebar` |
| `RsSplitPane` | 可拖拽分栏；原生 group + hr，不包 Reka；百分比、APG Window Splitter | `#/components/split-pane` |
| `RsPagination` | 分页；原生 nav + button，不包 Reka；跳转走 RsInput，每页条数走 RsSelect | `#/components/pagination` |
| `RsVirtualList` | 虚拟列表；原生 overflow，不包 Reka；定高 / 函数 / auto，横向与键盘可选 | `#/components/virtual-list` |

### 浮层与反馈

| 组件 | 说明 | 文档站 |
|------|------|--------|
| `RsTooltip` / `RsTooltipProvider` | 提示；原生触发器 + Teleport，不包 Reka；悬停 / 键盘焦点，贴边翻转 | `#/components/tooltip` |
| `RsPopover` | 气泡卡片；触发器合并属性 + Teleport，不包 Reka | `#/components/popover` |
| `RsDialog` / `RsConfirmDialog` | 对话框与确认框：原生 dialog + Teleport，不包 Reka。确认框是 alertdialog | `#/components/dialog`、`#/components/confirm-dialog` |
| `RsDrawer` | 抽屉；原生 dialog + Teleport，不包 Reka；四向、可拖、模态焦点陷阱 | `#/components/drawer` |
| `RsContextMenu` | 右键菜单 | `#/components/context-menu` |
| `RsToaster` | Toast 宿主；原生 region + Teleport，不包 Reka / vue-sonner（`useRsToast`） | `#/components/toaster` |

### 数据展示

| 组件 | 说明 | 文档站 |
|------|------|--------|
| `RsStatCard` | 指标卡；原生 section，不包 Reka。数值默认原样，`format` / `precision` 才走 `Intl` | `#/components/stat-card` |
| `RsTable` | 排序、选择、虚拟、编辑。架构 [rs-table-architecture.md](./rs-table-architecture.md)；SSR [rs-table-ssr.md](./rs-table-ssr.md)；图表 [rs-table-chart-adapter.md](./rs-table-chart-adapter.md)；像素 [rs-table-visual.md](./rs-table-visual.md) | `#/components/table` |
| `RsTableCellEditor` | 单元格编辑器 | `#/components/table-cell-edit` |
| `RsTableHeader` / `RsTableBody` / `RsTableColGroup` | 表格视图子件（ViewContext） | 随 Table |
| `RsTree` | 勾选、拖拽、虚拟；原生 role=tree，不包 Reka。RTL 方向键对调，过滤跟 locale | `#/components/tree` |
| `RsCodeBlock` | 只读代码；原生 figure，不包 Reka。`editable` / `showBar`；主题切换不重建文档 | `#/components/code-block` |
| `RsMarkdown` | Markdown 编辑与预览；带名称的 section，不包 Reka；GFM 消毒，主题跟 data-rs-theme | `#/components/markdown` |
| `RsProseEditor` | 富文本表面 | 随编辑器族 |

### 编辑器与终端（重型）

| 组件 | 说明 | 文档站 |
|------|------|--------|
| `RsCodeEditor` | CodeMirror 轻量编辑；原生区域，不包 Reka；`theme=auto` 跟 `data-rs-theme` | `#/components/code-editor` |
| `RsMonacoEditor` | Monaco；原生容器，不包 Reka；主题跟 data-rs-theme | `#/components/monaco-editor` |
| `RsTerminal` | xterm | `#/components/terminal` |
| `RsLog` | 只读日志（不是 PTY）；原生区域，不包 Reka。展示去掉 ANSI，源文本留在 getLines().text | `#/components/log` |

### 已登记的宿主 helper（摘）

完整符号以 `src/index.ts` 为准。下列类别允许导出；**未列的 DOM 实现函数默认内部**。

| 类别 | 例 | 说明 |
|------|-----|------|
| 按钮 | `resolveRsButtonVariant` / `resolveRsButtonTone` | 形态与色相 |
| 锚点 | `hrefToAnchorId`、`flattenAnchorItems`、`pickActiveAnchorHref` | 纯函数；滚动 / ink 不导出 |
| 尺寸 / 圆角 | `useResolvedRsComponentSize`、`rsRadiusCss` | |
| 主题 | `applyTheme`、`resolveThemeMode`、`readResolvedTheme`；`applyColorTheme` / `clearColorTheme` 写语义 `--rs-*`；`themePresets` 仅参考 | |
| i18n | `useRsI18n`、`registerRsLocale`、`applyLocale`、`resolveHostLocale`、`resolveDirMode`、`rsLocaleMessageKeys` | |
| 表单 / 日期校验 | `validateDateValue`、`formatPickerDisplay`、`resolveWeekStartsOn` 等 | 无 DOM |
| 表格 | `useRsTable*`（见表格架构文） | 勿在业务再写一套 engine |

---

## 18. 文档站与内部测试台

对外用法只认 `site/`：

1. 新组件在 `site/catalog/components/` 登记介绍、何时使用、API、Token、FAQ。
2. 可复制示例在 `site/demos/{slug}.vue`，用 `DocDemo`。
3. 本地 `pnpm dev:site` → http://127.0.0.1:5181 ；`pnpm build:site` 部署 GitHub Pages（https://blair-shang.github.io/niuma-ui/）。

`playground/` 是维护者内部测试台，**不是**第二份官网：

1. `playground/routes.ts` 只登记测试页路径。
2. `DemoPage` / `DemoBlock` 做冒烟；Playwright 做像素回归。
3. `pnpm dev` → http://127.0.0.1:5180。
4. 禁止在此写安装教程或把简表当成对外 API。

宿主产品（含网关控制台）说明 `Rs*` 用法时，链接文档站，不要链 playground。playground 与本文或 site 冲突时，以本文红线 + site API 为准。
