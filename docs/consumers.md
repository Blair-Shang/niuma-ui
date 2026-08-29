# 消费方接入指南

本文面向将 `niuma-ui` 集成到宿主应用（桌面端、Web 后台、官网等）的工程团队。阅读前请先浏览仓库根目录 [README.md](../README.md)。组件清单与设计约定见 [components.md](./components.md)。

在线组件演示：[https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/)。

## 1. 选择依赖方式

npm 包名是 **`niuma-ui`**。正式版 `pnpm publish` 会更新 dist-tag **`latest`**（当前如 1.1.11）；预发布打 **`next`**。不维护 GitHub 标签 `latest`。

| 场景 | 推荐写法 | 说明 |
|------|----------|------|
| 本机改组件、热更新联调 | `"@niuma/ui": "link:../niuma-ui"` | 与 UI 仓同级；`web/` 里用 `../../niuma-ui` |
| niuma-cloud / NiuMa 流水线 | `npm:niuma-ui@latest` | workflow 里改依赖后从 registry 安装，不 checkout 兄弟仓 |
| 第三方 / 要锁补丁 | `"niuma-ui": "^1.1.11"` | 自动吃兼容 PATCH，不跟 major |
| 必须可复现 | `"niuma-ui": "1.1.11"` | 钉死精确版本 |

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
    "vue": "^3.5.39"
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

使用 Vite 且指向源码时，修改 `niuma-ui/src/**/*.vue` 一般可即时 HMR，无需先发版。

### 1.2 第一方流水线（niuma-cloud / NiuMa）

仓库里的 `package.json` 保持 `link:` 方便本机。CI **不要** checkout `niuma-ui` Git 仓，安装前改成 npm：

```bash
# niuma-cloud（根 package.json）
pnpm pkg set "dependencies.@niuma/ui=npm:niuma-ui@${NIUMA_UI_VERSION:-latest}"
pnpm install --no-frozen-lockfile

# NiuMa（workspace 包 @niuma/web）
pnpm --filter @niuma/web pkg set "dependencies.@niuma/ui=npm:niuma-ui@${NIUMA_UI_VERSION:-latest}"
pnpm install --no-frozen-lockfile
```

- 默认 `latest`：niuma-ui 发正式版后，下次跑 cloud / 桌面打包即用新包。
- 钉死：仓库变量 `NIUMA_UI_VERSION=1.1.11`，或 workflow 输入 `niuma_ui_version`。
- `--frozen-lockfile` 会钉住锁文件里的旧解析，跟 `latest` 冲突，流水线必须用 `--no-frozen-lockfile`（或先改依赖再装）。
- Vite 用 `require.resolve('@niuma/ui/package.json')`（或 `niuma-ui`）定位包根；本机有同级源码目录时可优先走源码，见 cloud `admin/vite.config.ts`。

`niuma-site` 若仍 `link:` + checkout 兄弟仓，与上述无关；要对齐时用同一套 npm 改写。

### 1.3 第三方 npm

```bash
pnpm add niuma-ui          # 装当前 latest
pnpm add niuma-ui@1.1.11   # 钉死
```

不推荐 `git+https://…#v1.1.11`，除非内网拉不到 npm。也不要 `ref: latest` 去 checkout Git。

## 2. 最小集成清单

1. 安装 `vue`（满足 peer）与 `niuma-ui`。
2. 在应用入口引入样式：

   ```ts
   import 'niuma-ui/styles.css'
   ```

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

宿主 `tsconfig` 使用 `"moduleResolution": "bundler"`（或等价）即可解析本包的 `.ts` / `.vue` 导出。若使用 path alias 做按需封装，需与 Vite `resolve.alias` 保持一致。

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

### 3.2 官方 Vite 插件（可选）

包导出：

```ts
import { monacoZhNlsPlugin } from 'niuma-ui/vite-plugins/monaco-zh-nls'
import { silenceAntlrParseConsole } from 'niuma-ui/vite-plugins/silence-antlr-parse-console'
```

| 插件 | 用途 |
|------|------|
| `monacoZhNlsPlugin` | Monaco 右键菜单等 UI 中文 NLS |
| `silenceAntlrParseConsole` | 抑制 SQL 语言服务半成品 parse 的 console 噪音 |

仅在使用 `RsMonacoEditor` / SQL 语言能力的宿主中启用即可。

### 3.3 optimizeDeps（桌面重型编辑器场景）

Monaco 体积大，不建议整包放入 `optimizeDeps.include`。可将 CodeMirror 相关入口列入 `entries` / `warmup`，具体路径以安装后的 `niuma-ui` 包内 `src/dev/vite-codemirror-deps.ts` 为准。

## 4. 包体积与按需引入

`niuma-ui` 主入口聚合了面向 IDE / 运维工作台的完整能力。若宿主是**官网、落地页、轻量后台**：

- **不要** `import { … } from 'niuma-ui'` 一次导入会间接带上 Monaco / xterm 等重型模块（取决于打包器与静态分析边界）。
- **推荐**：在宿主内维护薄封装（例如 `src/ui.ts`），仅 re-export 所需组件文件，例如 Button、Card、Badge、ConfigProvider。
- 样式仍使用 `niuma-ui/styles.css`；CSS 体积相对可控，但亦可在未来版本提供 `core` 样式入口（规划中）。

桌面端 / 完整控制台可直接使用主入口。

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

第三方产品建议固定 minor（`^1.1.11`）并在自有文档记录版本。第一方打包跟 npm `latest`，出问题用 `NIUMA_UI_VERSION` 回退。
