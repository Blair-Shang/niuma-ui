# 消费方接入指南

本文面向将 `niuma-ui` 集成到宿主应用（桌面端、Web 后台、官网等）的工程团队。阅读前请先浏览仓库根目录 [README.md](../README.md)。组件清单与设计约定见 [components.md](./components.md)。

在线组件演示：[https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/)。

**定位：** 工作台设计系统，不是轻量通用 UI 套件。自 **1.2.0** 起 npm 包为编译 ESM。安装会带上 Monaco / CodeMirror / xterm；打包体积靠具名导入 + 下面的入口约定摇树。

**契约：业务 `pnpm dev` 联调源码，流水线 / `vite build` 用 npm `dist`，两边模块图和样式一致。** 不要在单个产品里补 Tailwind 或改栏宽。

1. `styles.css` 源码与发布包同一份，**透传** `@import 'tailwindcss'`。宿主入口只 `import 'niuma-ui/styles.css'`，用 `@tailwindcss/vite` 处理这一行；不要在业务 CSS 里再写一遍 `@import 'tailwindcss'`，也不要剥掉发布包里的这一行。
2. 宿主启用 `niumaUiHost()`（`niuma-ui/vite-plugins/niuma-ui-host`）：
   - `pnpm dev` + `link:`：具名导入改到 `src/**/*.vue`，`styles.css` 指到源码，组件可 HMR。
   - `vite build` / CI 装 npm：同一批具名导入改到 `dist/**/*.js`。
3. **禁止**把 `@niuma/ui` 别名到 `src/index.ts`。评估整桶会灌入未使用组件 CSS，和打包摇树对不齐。
4. 一律从主入口具名导入。官网等轻量宿主在自己的 `src/ui.ts` 里只 re-export 用到的符号。不要 `import *`。

## 1. 选择依赖方式

npm 包名是 **`niuma-ui`**。正式版 `pnpm publish` 会更新 dist-tag **`latest`**（当前 1.2.0）；预发布打 **`next`**。不维护 GitHub 标签 `latest`。

| 场景 | 推荐写法 | 说明 |
|------|----------|------|
| 本机改组件、热更新联调 | `"@niuma/ui": "link:../niuma-ui"` | 与 UI 仓同级；`web/` 里用 `../../niuma-ui` |
| niuma-cloud / NiuMa 流水线 | `npm:niuma-ui@latest` | workflow 里改依赖后从 registry 安装，不 checkout 兄弟仓 |
| 第三方 / 要锁补丁 | `"niuma-ui": "^1.2.0"` | 自动吃兼容 PATCH，不跟 major |
| 必须可复现 | `"niuma-ui": "1.2.0"` | 钉死精确版本 |

开源基线 **1.0.0**，许可证 [Apache License 2.0](../LICENSE)。第一方宿主（cloud Admin、桌面 `web/`）依赖键常用 `@niuma/ui`，用 `npm:niuma-ui@…` 或 `link:` 指向同一份包。

### 1.1 本地 link（开发机）

目录约定示例：

```text
workspace/
  niuma-ui/          # 本仓库
  your-app/          # 宿主（若在子目录则 link 路径改为 ../../niuma-ui）
```

`your-app/package.json`（第一方也可用 `@niuma/ui` 作为依赖键）：

```json
{
  "dependencies": {
    "@niuma/ui": "link:../niuma-ui",
    "vue": "^3.5.0"
  }
}
```

若宿主位于 monorepo 的 `web/` 下：

```json
"@niuma/ui": "link:../../niuma-ui"
```

```bash
pnpm install
pnpm dev
```

`link:` 之后直接 `pnpm dev`。`niumaUiHost` 会把用到的组件指到兄弟仓 `src/`，改 `.vue` 即可 HMR。打包 / CI 仍解析 npm `dist`，不必为本机联调先 `pnpm build` niuma-ui（改宿主 Vite 插件本身除外）。

### 1.2 第一方流水线（niuma-cloud / NiuMa）

仓库里的 `package.json` 保持 `link:` 方便本机。CI **不要** checkout `niuma-ui` Git 仓，安装前改成 npm：

```bash
# niuma-cloud（根 package.json）
pnpm pkg set "dependencies.@niuma/ui=npm:niuma-ui@${NIUMA_UI_VERSION:-latest}"
pnpm install --no-frozen-lockfile

# NiuMa（workspace 包 @niuma/web）
# 不要用 --filter pkg set：会被当成脚本名，改不到 web/package.json。
pnpm --filter @niuma/web add "@niuma/ui@npm:niuma-ui@${NIUMA_UI_VERSION:-latest}"
```

- 默认 `latest`：niuma-ui 发正式版后，下次跑 cloud / 桌面打包即用新包。
- 钉死：仓库变量 `NIUMA_UI_VERSION=1.2.0`，或 workflow 输入 `niuma_ui_version`。
- `--frozen-lockfile` 会钉住锁文件里的旧解析，跟 `latest` 冲突，流水线必须用 `--no-frozen-lockfile`（或先改依赖再装）。
- Vite 用 `require.resolve('@niuma/ui/package.json')` 定位包根，给 `server.fs.allow`。启用 `niumaUiHost()`，不要把主入口别名到 `src/index.ts`。

`niuma-site` 若仍 `link:` + checkout 兄弟仓，与上述无关；要对齐时用同一套 npm 改写。

### 1.3 第三方 npm

```bash
pnpm add niuma-ui          # 装当前 latest
pnpm add niuma-ui@1.2.0    # 钉死
```

不推荐 `git+https://…#v1.2.0`，除非内网拉不到 npm。也不要 `ref: latest` 去 checkout Git。第三方大工程请钉 `^1.2.0`，不要跟 `latest`。

## 2. 最小集成清单

1. 安装 `vue`（满足 peer）与 `niuma-ui`。
2. 在应用入口引入样式（含 token、vue-sonner，以及透传的 `@import 'tailwindcss'`）：

   ```ts
   import 'niuma-ui/styles.css'
   ```

   Vite 宿主加上 `@tailwindcss/vite`，让这一行在 dev 和 build 都被展开。不要手写 `@import 'niuma-ui/src/styles.css'`，也不要在业务 CSS 里再 `@import 'tailwindcss'`。

   - CodeMirror 6 主题在 JS 里；xterm / Monaco 的 CSS 跟组件 `import`。`vite-prebundle/*` 只给本机 `optimizeDeps`。

3. 根组件包裹 `RsConfigProvider`：

   ```vue
   <RsConfigProvider theme="light" locale="zh-CN" control-size="md">
     <RouterView />
   </RsConfigProvider>
   ```

4. 业务只从 `niuma-ui` 导入组件与 composable，不要直接安装或引用 `reka-ui`。

### 主题与品牌

- 默认主题由 `RsConfigProvider` 的 `theme`（`light` | `dark` | …）写入 `data-rs-theme`。
- 产品品牌色可在业务 CSS 中覆盖同名 `--rs-*` 变量；参考 [`src/theme/brand.example.css`](../src/theme/brand.example.css)。
- 表格、终端、代码编辑器等子系统另有 `--rs-table-*`、`--rs-terminal-*`、`--rs-code-*`、`--rs-prose-*` 等 token，可按需覆盖。
- 排版与文字语义（对齐 Ant Design / Arco 常用档位）：
  - 字号：`--rs-font-size-xs` … `--rs-font-size-3xl`
  - 字重：`--rs-font-weight-regular|medium|semibold|bold`
  - 字体族：`--rs-font-sans` / `--rs-font-mono` / `--rs-font-serif` / `--rs-font-rounded`
  - 代码 / 终端：`--rs-code-font-family|size`、`--rs-terminal-font-family|size|weight`（Monaco / xterm 从这些 token 读取）
  - 文字色：`--rs-text-primary|secondary|tertiary|disabled|inverse|link|link-hover`
    （兼容旧名 `--rs-text` / `--rs-muted` / `--rs-placeholder`）
  - JS 侧也可使用导出的 `RS_FONT_SIZE_CSS` / `RS_FONT_WEIGHT_CSS`，以及 `readCssLengthPx` / `readCodeFontFamily`

### TypeScript

npm 包入口是编译后的 ESM + `.d.ts`（类型指向 `.js`，不再暴露 `.vue`）。宿主 `tsconfig` 使用 `"moduleResolution": "bundler"` / `node16` / `nodenext` 即可，不必把路径指到本包的 `src/`，也不需要 `shamefully-hoist`。

类型始终走包入口 `.d.ts`。`pnpm dev` 运行时由 `niumaUiHost` 指到源码，不必为了看效果先 build。

## 3. Vite 配置要点

### 3.1 允许读取 link 目录

```ts
import { dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const uiRoot = dirname(require.resolve('@niuma/ui/package.json'))
// 第三方依赖键为 niuma-ui 时：require.resolve('niuma-ui/package.json')

export default defineConfig({
  server: {
    fs: {
      allow: [/* 宿主根 */, uiRoot],
    },
  },
})
```

### 3.2 官方 Vite 插件

```ts
import { niumaUiHost } from 'niuma-ui/vite-plugins/niuma-ui-host'
import { monacoZhNlsPlugin } from 'niuma-ui/vite-plugins/monaco-zh-nls'
import { silenceAntlrParseConsole } from 'niuma-ui/vite-plugins/silence-antlr-parse-console'

export default defineConfig({
  plugins: [...niumaUiHost()],
})
```

| 插件 | 用途 |
|------|------|
| `niumaUiHost` | 第一方宿主必开。dev 联调源码，build 走 dist 子路径。旧路径 `vite-plugins/rewrite-named-imports` 仍 re-export，勿再新写。 |
| `monacoZhNlsPlugin` | Monaco 右键菜单等 UI 中文 NLS |
| `silenceAntlrParseConsole` | 抑制 SQL 语言服务半成品 parse 的 console 噪音 |

后两个仅在使用 `RsMonacoEditor` / SQL 语言能力的宿主中启用即可。

### 3.3 optimizeDeps（桌面重型编辑器场景）

Monaco 体积大，不建议整包放入 `optimizeDeps.include`。CodeMirror / xterm 用公开子路径：

```ts
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default defineConfig({
  optimizeDeps: {
    entries: [
      'index.html',
      require.resolve('niuma-ui/vite-prebundle/codemirror'),
      require.resolve('niuma-ui/vite-prebundle/xterm'),
    ],
  },
})
```

## 4. 包体积与按需引入

`niuma-ui` 主入口聚合了面向 IDE / 运维工作台的完整能力。

- 一律 `import { RsButton } from 'niuma-ui'`，加 `niumaUiHost`。官网在宿主 `src/ui.ts` 里只 re-export 用到的符号。
- 不要 `import * as UI from 'niuma-ui'`。
- 样式一律 `niuma-ui/styles.css`。

## 5. RsTable SSR / 图表

- SSR：优先 `useRsTableHeadless`；首屏只用轻量只读 `<RsTable>`（关 virtual / editable / contextMenu / cellTooltip）。详见 [rs-table-ssr.md](./rs-table-ssr.md)。
- 图表：用 `createChartSeriesTableFeature` + `mapRsTableSeriesToEChartsOption`，echarts 留在宿主。详见 [rs-table-chart-adapter.md](./rs-table-chart-adapter.md)。

## 6. 升级策略

1. 阅读目标版本的 [CHANGELOG](../CHANGELOG.md) / GitHub Release。
2. 第一方流水线跟 `latest` 时无需改 workflow；要验证某版设 `NIUMA_UI_VERSION`。第三方改 `package.json` 版本后 `pnpm install`。
3. 跑宿主测试与关键冒烟（主题切换、Dialog、Table、若有则编辑器）。
4. MAJOR 升级前检查：组件 props 更名、token 删除、peer Vue 版本。

本地 `link` 开发不必先发 npm；合并 / 打包前用流水线的 npm `latest`（或钉死版本）再验一遍。

## 7. 常见问题

**Q: link 后解析到错误路径？**  
A: `link:` 相对路径相对的是**声明依赖的 package.json 所在目录**，不是仓库根。`web/package.json` 通常要用 `../../niuma-ui`。

**Q: CI 还在 checkout niuma-ui Git 仓？**  
A: cloud / 桌面 Pack 已改为 npm `niuma-ui@latest`。若仍失败，看是否误写 GitHub `ref: latest`（没有这个 git 标签），或 registry 装不到 `niuma-ui`。

**Q: 装了 latest 但 CI 还是旧版？**  
A: 锁文件 + `--frozen-lockfile` 不会漂。第一方 workflow 须 `pkg set` 后再 `--no-frozen-lockfile`。

**Q: 还要 `shamefully-hoist=true` 吗？**  
A: 不要。当前 npm 包是编译产物，pnpm 隔离目录即可解析 `reka-ui` 等依赖。那是源码发布时期的权宜之计。

**Q: 本机好看、流水线构建像缺样式 / 栏宽对不齐？**  
A: 不是 CodeMirror / 终端没打进包。核对：`styles.css` 是否还带着 `@import 'tailwindcss'`、宿主是否开了 `niumaUiHost` 和 `@tailwindcss/vite`、是否把主入口别名到了整桶 `index.ts`。不要在单个产品里再引一遍 Tailwind 或改栏宽来「对齐」。

**Q: 必须用 pnpm / Tailwind / Vite 吗？**  
A: 安装用 npm / pnpm / yarn 均可。`styles.css` 透传 Tailwind，Vite 宿主需要 `@tailwindcss/vite`。普通组件不绑死 Vite；`RsMonacoEditor` 与官方 `vite-plugins/*` 需要 Vite 5+（Worker / 插件 API）。

**Q: 能否与 Element Plus / Ant Design Vue 混用？**  
A: 技术上可以，但视觉与焦点层易冲突。新界面请统一 `Rs*`；存量迁移可分区推进。

**Q: 支持 Vue 2？**  
A: 不支持。仅 Vue 3。

**Q: 许可证？**  
A: [Apache License 2.0](../LICENSE)。版权与第三方声明见 [NOTICE](../NOTICE)。依赖库各自保留其原许可证（Reka UI、Lucide、Monaco、CodeMirror、xterm 等）。

## 8. 支持与反馈

- Issues：https://github.com/Blair-Shang/niuma-ui/issues  
- 安全漏洞：[SECURITY.md](../SECURITY.md)  
- 贡献：[CONTRIBUTING.md](../CONTRIBUTING.md)  

设计与 API 讨论请附：宿主框架版本、复现仓库或最小示例、期望行为与实际行为。

第三方产品建议固定 minor（`^1.2.0` 起的编译包）并在自有文档记录版本。第一方打包跟 npm `latest`，出问题用 `NIUMA_UI_VERSION` 回退。
