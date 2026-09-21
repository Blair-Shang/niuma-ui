# 消费方接入指南

把 `niuma-ui` 装进宿主应用（桌面壳、后台、官网）。请先读根目录 [README.md](../README.md)。架构与清单：[components.md](./components.md)。English: [consumers.en.md](./consumers.en.md)。

组件用法、何时使用、API 只认文档站 [https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/)（源码 `site/`，本地 `pnpm dev:site`）。`playground/` 是维护者内部测试台，不写对外说明。

**定位：** 工作台设计系统，不是轻量通用 UI 套件。自 **1.2.0** 起 npm 为编译 ESM。安装会带上 Monaco / CodeMirror / xterm；体积靠**具名导入**和下面的入口约定摇树。当前发布版本 **2.0.0**。1.x 见分支 `1.x`。

**契约：** 公共 API 是包根具名导入。`vite build` / CI 走包入口，不依赖改写插件。`niumaUiHost` **只服务**本机 `pnpm dev`。不要把包名别名到 `src/index.ts`。

1. `styles.css` 是独立样式（token + reset + 组件），**不含** Tailwind。宿主 `import 'niuma-ui/styles.css'`。数据源品牌图标色再加 `import 'niuma-ui/brand-icons.css'`。业务若自己用工具类，在宿主 CSS 里自行引入 Tailwind。
2. 本地改源码时启用 `niumaUiHost()`（`niuma-ui/vite-plugins/niuma-ui-host`）：
   - `pnpm dev` + `link:`：具名导入改到 `src/**/*.vue`，可 HMR。
   - `vite build` / CI：不改写，解析 `dist/index.js`。
3. **禁止**把包别名到 `src/index.ts`。整桶求值会灌入未使用组件 CSS，摇树失效。
4. 一律从根入口具名导入。轻量站点在自己的 `src/ui.ts` 再导出用到的符号。不要 `import *`。
5. 子路径（`vite-plugins/*`、`styles.css`、`vite-prebundle/*`）给工具链，不是日常组件导入。

## 1. 怎么依赖

npm 包名是 **`niuma-ui`**。正式版更新 dist-tag **`latest`**，预发布 **`next`**。没有名为 `latest` 的 Git 标签。

| 场景 | 推荐 | 说明 |
|------|------|------|
| 对着本仓库改组件、HMR | `"niuma-ui": "link:../niuma-ui"` | 路径相对**声明依赖的 package.json** |
| 第三方，要兼容补丁 | `"niuma-ui": "^2.0.0"` | 只吃 2.x 兼容变更 |
| 必须可复现 | `"niuma-ui": "2.0.0"` | 钉死当前版本 |
| 仍用 1.x | `"niuma-ui": "^1.3.9"` | Tailwind 透传约定，见 `1.x` 分支 |
| 下游 CI 曾 checkout 本仓 | `npm:niuma-ui@latest` | 从 registry 装，不要在产品 CI 里 clone 本 Git 仓 |

开源基线 **1.0.0**，[Apache License 2.0](../LICENSE)。旧包名 `@niuma/ui` 已不再发布，请用 **`niuma-ui`**。

### 1.1 本地 `link`

```text
workspace/
  niuma-ui/          # 本仓库
  your-app/          # 宿主（若在子目录，路径改为 ../../niuma-ui）
```

```json
{
  "dependencies": {
    "niuma-ui": "link:../niuma-ui",
    "vue": "^3.5.0"
  }
}
```

```bash
cd ../niuma-ui && pnpm install   # 缺 dist 时 prepare 会 build
cd ../your-app && pnpm install
pnpm dev
```

`exports` 只认 `dist`。clone 后在 **niuma-ui** 里 `pnpm install` 会编出插件和桶。`link:` + `pnpm dev` 时 `niumaUiHost` 把用到的组件指到源码。生产 / CI 仍解析 npm `dist`。改 Vite 插件源码后需再 `pnpm build`。

### 1.2 npm（默认推荐）

```bash
pnpm add niuma-ui          # 当前 latest
pnpm add niuma-ui@2.0.0    # 钉死
```

优先 semver，少用 `git+https://…#v2.0.0`。不要 checkout GitHub `ref: latest`（没有这个标签）。

### 1.3 下游仍提交 `link:` 时的 CI（可选）

若宿主仓提交的仍是 `link:`，CI 应改写成 npm，**不要**再 clone 本仓库：

```bash
pnpm pkg set "dependencies.niuma-ui=npm:niuma-ui@${NIUMA_UI_VERSION:-latest}"
pnpm install --no-frozen-lockfile
```

`--frozen-lockfile` 和 `latest` 冲突。需要可复现构建时设 `NIUMA_UI_VERSION=2.0.0`。

## 2. 最小集成

1. 安装 `vue`（peer）与 `niuma-ui`。
2. 入口只引一次样式：

   ```ts
   import 'niuma-ui/styles.css'
   import 'niuma-ui/brand-icons.css' // 可选：数据源 mark 官方色
   ```

   不要写 `@import 'niuma-ui/src/styles.css'`。

3. 根节点包 `RsConfigProvider`：

   ```vue
   <RsConfigProvider theme="light" locale="zh-CN" control-size="md">
     <RouterView />
   </RsConfigProvider>
   ```

   现支持 `zh-CN` | `en-US`。

4. 组件和 composable 只从 `niuma-ui` 导入，不要装 `reka-ui`。

### 主题与品牌

- `theme`（`light` | `dark` | `system`）。`system` 跟随操作系统明暗；DOM 上仍是 `data-rs-theme="light|dark"`。
- 无属性时样式按浅色。首屏请在 `index.html` 写 `<html data-rs-theme="light">`（或 `dark`）。
- 色值只认 CSS。`themePresets` 是参考，改它不会换肤。
- 业务 CSS 覆盖同名 `--rs-*`，见 [`src/theme/brand.example.css`](../src/theme/brand.example.css)。
- 文字覆盖 `--rs-text-primary`（不要新写 `--rs-text`）。
- 品牌图标色是可选子系统：`import 'niuma-ui/brand-icons.css'`。不引入则 mark 为单色。
- 第三方语言（社区 / 宿主维护，本包不发官方 ja / ar 等）：`registerRsLocale('ja-JP', { 'select.placeholder': '…' })`，再设 `locale="ja-JP"`。`t()` 支持 `{count, plural, one {#} other {#}}`。RTL：`dir="rtl"` 或登记时 `{ dir: 'rtl' }`。
- 子系统：`--rs-table-*`、`--rs-terminal-*`、`--rs-code-*`、`--rs-prose-*`。
- 排版：`--rs-font-size-*`、`--rs-font-weight-*`、`--rs-font-sans|mono|serif`。
- JS：`RS_FONT_SIZE_CSS`、`readCssLengthPx`、`readCodeFontFamily`。

### TypeScript

npm 入口是编译 ESM + `.d.ts`（类型指向 `.js`，不是 `.vue`）。宿主 `"moduleResolution": "bundler"` / `node16` / `nodenext` 即可，不要 path-map 到本包 `src/`。

## 3. Vite

### 3.1 允许读取 link 目录

```ts
import { dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const uiRoot = dirname(require.resolve('niuma-ui/package.json'))

export default defineConfig({
  server: {
    fs: {
      allow: [/* 宿主根 */, uiRoot],
    },
  },
})
```

### 3.2 官方插件

```ts
import { niumaUiHost } from 'niuma-ui/vite-plugins/niuma-ui-host'

export default defineConfig({
  plugins: [...niumaUiHost()],
})
```

| 插件 | 用途 |
|------|------|
| `niumaUiHost` | 本地 `link` 建议开。只服务 `pnpm dev`（HMR、styles）。build 走包入口。 |
| `monacoZhNlsPlugin` | Monaco 中文 NLS（可选） |
| `silenceAntlrParseConsole` | 抑制 SQL 语言半成品 parse 日志（可选） |

后两个仅在使用 `RsMonacoEditor` / SQL 语言时启用。

### 3.3 `optimizeDeps`（重型编辑器）

不要把整个 Monaco 放进 `optimizeDeps.include`。CodeMirror / xterm 用公开预打包路径：

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

## 4. 包体积

- 一律 `import { RsButton } from 'niuma-ui'`。官网在宿主 `src/ui.ts` 再导出用到的符号。
- 不要 `import *`。
- 样式只用 `niuma-ui/styles.css`。

## 5. RsTable SSR / 图表

- SSR：优先 `useRsTableHeadless`；首屏可用只读 `<RsTable>`（关掉 virtual / editable / contextMenu / cellTooltip）。见 [rs-table-ssr.md](./rs-table-ssr.md)。
- 图表：`createChartSeriesTableFeature` + `mapRsTableSeriesToEChartsOption`，echarts 留在宿主。见 [rs-table-chart-adapter.md](./rs-table-chart-adapter.md)。

## 6. 升级

1. 读目标版本 [CHANGELOG](../CHANGELOG.md) / GitHub Release。
2. 改 `package.json` 后 `pnpm install`。跟 `latest` 的流水线改完依赖须 `--no-frozen-lockfile`。
3. 冒烟：主题切换、Dialog、Table，以及你用到的编辑器。
4. MAJOR 前核对：props 更名、Token 删除、peer Vue。

## 7. 常见问题

**Q: link 后找不到 `dist/vite-plugins/niuma-ui-host.js`？**  
A: 仓库不提交 dist。到 niuma-ui 根目录 `pnpm install` 或 `pnpm build`。不要把 `exports` 指到源码 `.ts`。

**Q: link 解析到错误目录？**  
A: 路径相对**声明依赖的 package.json**，不是仓库根。应用在 `web/` 下通常要用 `../../niuma-ui`。

**Q: 还要 `shamefully-hoist=true` 吗？**  
A: 不要。发布包是编译产物，pnpm 隔离目录即可解析 `reka-ui`。

**Q: 本机正常、CI 没有样式？**  
A: 核对是否 `import 'niuma-ui/styles.css'`、是否把入口别名到了 `src/index.ts`。`niumaUiHost` 不参与 `vite build`。2.0 起样式不再依赖 Tailwind。

**Q: 必须用 pnpm / Vite 吗？**  
A: 安装用 npm / pnpm / yarn 均可。普通组件不绑死 Vite；`RsMonacoEditor` 与官方插件需要 Vite 5+。

**Q: 能和其他组件库混用吗？**  
A: 技术可以，视觉和焦点层容易打架。新界面请只用 `Rs*`。

**Q: 支持 Vue 2？**  
A: 不支持。

**Q: 许可证？**  
A: [Apache License 2.0](../LICENSE)。见 [NOTICE](../NOTICE)。依赖库保留各自许可证。

## 8. 支持

- Issues：https://github.com/Blair-Shang/niuma-ui/issues  
- 安全：[SECURITY.md](../SECURITY.md)  
- 贡献：[CONTRIBUTING.md](../CONTRIBUTING.md)  

讨论 API 时请附：框架版本、最小复现、期望与实际行为。第三方产品建议钉 minor（`^2.0.0` 起）并在自有文档记录版本。
