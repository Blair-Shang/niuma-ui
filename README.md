# niuma-ui

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-42b883.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-yellow.svg)](https://pnpm.io/)

[English](./README.en.md) | 简体中文

Vue 3 **工作台**设计系统：一致的 `Rs*` 组件、`--rs-*` token，以及面向桌面工具的编辑器 / 终端封装。

适用于运维控制台、数据库工作台、内部后台。营销站 / 落地页也可以用，但请具名导入；本包不是 Ant Design 那种轻量通用库，`npm install` 会带上 Monaco、CodeMirror、xterm。

**状态：** 自 **v1.0.0** 起按 [Apache License 2.0](./LICENSE) 开源。自 **v1.2.0** 起 npm 发布编译后的 ESM（`install` 后按包名导入即可）。

## 特性

- **设计 token**：明暗主题通过 `data-rs-theme` 与 CSS 变量驱动，业务侧可用品牌层覆盖
- **Rs\* 组件**：Button、Form、Dialog、Table、Tree、Tabs 等完整交互控件
- **专业工具向**：Monaco、CodeMirror、xterm 等编辑器 / 终端封装（按需引入）
- **无障碍与焦点**：底层基于 [Reka UI](https://reka-ui.com/)，业务层只消费 `niuma-ui`
- **Vite 友好**：`import { RsButton } from 'niuma-ui'` 即可打包；`niumaUiHost` 只服务本机 `pnpm dev` 联调源码

## 要求

| 项 | 版本 |
|----|------|
| Node.js | ≥ 20 |
| 包管理器 | npm / pnpm / yarn（本仓库开发用 pnpm） |
| Vue | ^3.5.0（peerDependency） |
| 打包器 | Vite 5+ 推荐；使用 `RsMonacoEditor` 时需要 Vite 处理 `?worker` |
| 样式 | `import 'niuma-ui/styles.css'`（透传 `@import 'tailwindcss'`）；Vite 宿主用 `@tailwindcss/vite` 处理 |

## 安装

```bash
pnpm add niuma-ui
# 或 npm install niuma-ui / yarn add niuma-ui
# 业务流水线跟最新正式版（npm dist-tag latest，无 GitHub 标签 latest）
pnpm add niuma-ui@latest
```

钉死某一版：

```bash
pnpm add niuma-ui@1.2.0
# 或
pnpm add git+https://github.com/Blair-Shang/niuma-ui.git#v1.2.0
```

本地 link、Vite 配置、包体积建议见 **[消费方指南](./docs/consumers.md)**。

## 快速开始

```ts
import { createApp } from 'vue'
import { RsConfigProvider, RsButton } from 'niuma-ui'
import 'niuma-ui/styles.css'
import App from './App.vue'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { RsConfigProvider, RsButton } from 'niuma-ui'
</script>

<template>
  <RsConfigProvider theme="light" locale="zh-CN">
    <RsButton variant="primary">Hello</RsButton>
  </RsConfigProvider>
</template>
```

## 使用约定

1. 应用与业务模块只允许 `import { … } from 'niuma-ui'`，**禁止**直接依赖 `reka-ui`。
2. 样式入口：`import 'niuma-ui/styles.css'`（须在业务品牌 CSS 之前或按文档顺序加载）。
3. 根节点使用 `RsConfigProvider` 提供主题、语言与默认控件尺寸。
4. 从主入口具名导入；轻量宿主在自己的 `ui.ts` 里再导出。启用 `niumaUiHost`，不要 `import *`，也不要把主入口别名到 `src/index.ts`。

组件清单与新增组件规范见 **[组件说明](./docs/components.md)**。

## 在线演示

- **组件演示站**：[https://blair-shang.github.io/niuma-ui/](https://blair-shang.github.io/niuma-ui/)（随 `main` 由 [pages.yml](./.github/workflows/pages.yml) 部署）
- 首次启用：仓库 **Settings → Pages → Source** 选 **GitHub Actions**
- 本地：`pnpm dev` → http://localhost:5180

## 本地开发

```bash
pnpm install
pnpm dev                 # 组件演示，默认 http://localhost:5180
pnpm build               # 库产物 → dist/（npm 发布）
pnpm build:playground    # 构建演示站静态资源 → playground-dist/
pnpm test                # Vitest
pnpm test:watch
```

| 路径 | 说明 |
|------|------|
| `src/components/` | `Rs*` 组件实现 |
| `src/styles.css` | Token 与全局样式 |
| `src/theme/` | 主题应用与品牌覆盖示例 |
| `src/monaco/` | Monaco 语言与 Worker 辅助 |
| `playground/` | 组件演示应用（对外演示门面） |
| `vite-plugins/` | 可供宿主工程复用的 Vite 插件 |
| `docs/` | 接入与组件类文档 |

## 版本与发版

遵循 [Semantic Versioning](https://semver.org/)：

| 变更类型 | 版本 |
|----------|------|
| 缺陷修复、文档（兼容） | PATCH `1.0.x` |
| 新增组件 / 能力（兼容） | MINOR `1.x.0` |
| 破坏性 API 或 token 更名 | MAJOR `x.0.0` |

```bash
# 1. 更新 package.json 的 version
# 2. 更新 CHANGELOG.md
# 3. 提交并推送 main 后打 tag（推送 tag 会触发 Publish 流水线自动 pnpm publish）
git tag v1.0.1
git push origin v1.0.1
```

需在仓库 Settings → Secrets 配置 **`NPM_TOKEN`**：

1. 打开 https://www.npmjs.com/settings/shangjian/tokens → **Generate New Token** → **Granular Access Token**
2. Permissions：对包 `niuma-ui` 勾选 **Read and write**
3. 务必开启 **Bypass two-factor authentication**（否则 CI 会报 `EOTP`）
4. 把 token 填进 GitHub Secret 名 `NPM_TOKEN`

不要配置 `NPM_OTP`：一次性验证码约 30 秒过期，无法用于自动发版。

也可在 Actions 里手动运行 **Publish** 工作流。

正式版会更新 npm dist-tag **`latest`**（`niuma-ui@latest`），不维护 GitHub 标签 `latest`。可复现发版请钉 SemVer tag；预发布走 npm tag `next`。

详见 [CHANGELOG.md](./CHANGELOG.md)。

## 相关文档

| 文档 | 内容 |
|------|------|
| [docs/consumers.md](./docs/consumers.md) | 宿主工程接入、联调、CI、体积与插件 |
| [docs/components.md](./docs/components.md) | 公开组件清单与设计约定 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | 行为准则 |
| [SECURITY.md](./SECURITY.md) | 安全漏洞报告 |
| [NOTICE](./NOTICE) | Apache 版权与第三方声明 |
| [README.en.md](./README.en.md) | English README |
| [src/theme/brand.example.css](./src/theme/brand.example.css) | 品牌色覆盖示例 |

## 仓库信息

- **包名**：`niuma-ui`
- **源码**：https://github.com/Blair-Shang/niuma-ui
- **Issues**：https://github.com/Blair-Shang/niuma-ui/issues
- **开源基线**：`v1.0.0`
- **许可**：[Apache License 2.0](./LICENSE)

## 致谢

交互原语基于 [Reka UI](https://reka-ui.com/)；图标默认集成 [Lucide](https://lucide.dev/)；代码编辑能力基于 [Monaco Editor](https://microsoft.github.io/monaco-editor/) 与 [CodeMirror](https://codemirror.net/)；终端基于 [xterm.js](https://xtermjs.org/)。
