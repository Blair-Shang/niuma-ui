# niuma-ui

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/niuma-ui.svg)](https://www.npmjs.com/package/niuma-ui)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-42b883.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

[English](./README.md) | 简体中文

Vue 3 **工作台**设计系统：一致的 `Rs*` 组件与 `--rs-*` Token，以及按需使用的编辑器 / 终端封装。

适用于运维控制台、数据库工作台、内部后台。营销站也可以用具名导入。`npm install` 会带上 Monaco、CodeMirror、xterm，体积靠具名导入摇树。

**状态：** [Apache License 2.0](./LICENSE)，自 v1.0.0 开源。自 v1.2.0 起 npm 发布编译 ESM。当前主线 **2.0.0**。1.x 见分支 `1.x`。

## 特性

- **Design Token**：明暗主题走 `data-rs-theme`（`light` / `dark` / `system`）与 CSS 变量，宿主用品牌层覆盖
- **Rs\* 组件**：Button、Form、Dialog、Table、Tree、Tabs、Anchor 等
- **专业工具**：Monaco、CodeMirror、xterm（只在用到的路由引入）
- **无障碍**：底层 [Reka UI](https://reka-ui.com/)，应用只依赖 `niuma-ui`
- **国际化**：未设 `locale` 时跟本机语言（中文系统就是 `zh-CN`）；认不出回退中文。第三方语言用 `registerRsLocale`，见 [docs/locales.md](./docs/locales.md)
- **Vite**：`import { RsButton } from 'niuma-ui'` 即可打包；`niumaUiHost` 仅本机 `pnpm dev` 联调源码

## 要求

| 项 | 版本 |
|----|------|
| Node.js | ≥ 20 |
| 包管理器 | npm / pnpm / yarn（本仓库开发用 pnpm ≥ 9） |
| Vue | ^3.5（peerDependency） |
| 打包器 | 推荐 Vite 5+；`RsMonacoEditor` 需要 Vite 处理 `?worker` |
| 样式 | `import 'niuma-ui/styles.css'`（独立 CSS，不含 Tailwind） |

## 安装

```bash
pnpm add niuma-ui
# 或 npm install niuma-ui / yarn add niuma-ui
```

建议锁定兼容范围，例如 `^2.0.0`。精确复现请钉死 **2.0.0**。1.x 请用 `niuma-ui@1`。

本地改源码、Vite 插件、包体积见 **[消费方指南](./docs/consumers.md)**（[English](./docs/consumers.en.md)）。

## 快速开始

```ts
// main.ts
import { createApp } from 'vue'
import 'niuma-ui/styles.css'
import App from './App.vue'

createApp(App).mount('#app')
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { RsConfigProvider, RsButton } from 'niuma-ui'
</script>

<template>
  <RsConfigProvider theme="light" locale="zh-CN">
    <RsButton variant="primary">你好</RsButton>
  </RsConfigProvider>
</template>
```

未设 `locale` 时跟本机语言：中文环境仍是中文。更多语言见 [社区语言包](./docs/locales.md)。

## 使用约定

1. 只从包根具名导入：`import { RsButton } from 'niuma-ui'`。**不要**直接依赖 `reka-ui`，不要 `import *`。
2. 样式只引一次 `niuma-ui/styles.css`，再加载你的品牌 CSS。
3. 根节点包 `RsConfigProvider`（主题、语言、默认控件尺寸）。
4. 轻量站点在自己的 `ui.ts` 里再导出用到的符号。不要把包名别名到本仓库的 `src/index.ts`。

组件 API 以文档站为准。仓库里的架构契约给维护者：[组件规范](./docs/components.md)（[English](./docs/components.en.md)）。

## 文档

- **组件文档（官网）**：[https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/)（源码 `site/`）
- 本地文档站：`pnpm dev:site` → http://127.0.0.1:5181
- **演示与 API 写法**：[site/README.md](./site/README.md)（[English](./site/README.en.md)）— catalog 必须写清 props / events / slots / methods，演示要中英对照且事件可感知
- `playground/` 仅内部冒烟与像素回归（`pnpm dev` → :5180），不提供对外用法

| 文档 | 给谁看 |
|------|--------|
| [docs/consumers.md](./docs/consumers.md) | 把库装进产品的人（[English](./docs/consumers.en.md)） |
| [docs/locales.md](./docs/locales.md) | 登记第三方语言（[English](./docs/locales.en.md)） |
| [site/README.md](./site/README.md) | 文档站演示与 API 表怎么写（[English](./site/README.en.md)） |
| [docs/components.md](./docs/components.md) | 改本仓库的人（[English](./docs/components.en.md)） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | PR、测试、发版（[English](./CONTRIBUTING.en.md)） |
| [CHANGELOG.md](./CHANGELOG.md) | 版本记录 |
| [SECURITY.md](./SECURITY.md) | 漏洞私下报告 |

## 本地开发

```bash
pnpm install
pnpm dev:site     # 文档站
pnpm test         # Vitest
pnpm build        # 库 → dist/
```

贡献步骤见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 版本

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：

| 变更 | 版本 |
|------|------|
| 兼容的缺陷 / 文档 | PATCH |
| 兼容的新组件 / 能力 | MINOR |
| 破坏性 API 或 Token 更名 | MAJOR |

正式版更新 npm dist-tag **`latest`**，预发布走 **`next`**。没有名为 `latest` 的 Git 标签。发版流程只在 [CONTRIBUTING.md](./CONTRIBUTING.md)，不在本页。

## 许可与致谢

[Apache License 2.0](./LICENSE)。版权与第三方声明见 [NOTICE](./NOTICE)。

交互原语：[Reka UI](https://reka-ui.com/)。图标：[Lucide](https://lucide.dev/)。编辑器：[Monaco](https://microsoft.github.io/monaco-editor/)、[CodeMirror](https://codemirror.net/)。终端：[xterm.js](https://xtermjs.org/)。

- 文档站：https://blair-shang.github.io/niuma-ui/
- npm：https://www.npmjs.com/package/niuma-ui
- 源码：https://github.com/Blair-Shang/niuma-ui
- Issues：https://github.com/Blair-Shang/niuma-ui/issues
