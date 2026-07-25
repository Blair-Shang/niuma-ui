# @niuma/ui

Vue 3 设计系统与组件库。提供一致的 `Rs*` 组件、`--rs-*` 设计 token，以及面向桌面工具场景的编辑器 / 终端能力。

适用于运维控制台、数据库工作台、内部后台与产品官网等需要统一视觉与交互语言的 Vue 应用。

> 当前仓库为 Private。文档与 API 约定按可开源标准维护，便于日后公开及第三方产品接入。

## 特性

- **设计 token**：明暗主题通过 `data-rs-theme` 与 CSS 变量驱动，业务侧可用品牌层覆盖
- **Rs\* 组件**：Button、Form、Dialog、Table、Tree、Tabs 等完整交互控件
- **专业工具向**：Monaco、CodeMirror、xterm 等编辑器 / 终端封装（按需引入）
- **无障碍与焦点**：底层基于 [Reka UI](https://reka-ui.com/)，业务层只消费 `@niuma/ui`
- **Vite 友好**：源码直连联调；可选导出消费方 Vite 插件

## 要求

| 项 | 版本 |
|----|------|
| Node.js | ≥ 20 |
| 包管理器 | pnpm ≥ 9（推荐） |
| Vue | ^3.5（peerDependency） |
| 构建 | Vite 5+ / 8（推荐） |

## 快速开始

```bash
pnpm add @niuma/ui
# 或在发布到 npm 前使用 git 依赖，见 docs/consumers.md
```

```ts
import { createApp } from 'vue'
import { RsConfigProvider, RsButton } from '@niuma/ui'
import '@niuma/ui/styles.css'
import App from './App.vue'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { RsConfigProvider, RsButton } from '@niuma/ui'
</script>

<template>
  <RsConfigProvider theme="light" locale="zh-CN">
    <RsButton variant="primary">Hello</RsButton>
  </RsConfigProvider>
</template>
```

完整接入（本地 link、锁定 tag、Vite 配置、包体积建议）见 **[消费方指南](./docs/consumers.md)**。

## 使用约定

1. 应用与业务模块只允许 `import { … } from '@niuma/ui'`，**禁止**直接依赖 `reka-ui`。
2. 样式入口：`import '@niuma/ui/styles.css'`（须在业务品牌 CSS 之前或按文档顺序加载）。
3. 根节点使用 `RsConfigProvider` 提供主题、语言与默认控件尺寸。
4. 营销站 / 轻量应用避免从主入口导入 Monaco、Terminal、重型 Table 编辑能力；按文件路径或自建薄封装按需引用（见消费方指南）。

## 本地开发

```bash
pnpm install
pnpm dev          # 组件 Playground，默认 http://localhost:5180
pnpm test         # Vitest
pnpm test:watch
```

| 路径 | 说明 |
|------|------|
| `src/components/` | `Rs*` 组件实现 |
| `src/styles.css` | Token 与全局样式 |
| `src/theme/` | 主题应用与品牌覆盖示例 |
| `src/monaco/` | Monaco 语言与 Worker 辅助 |
| `playground/` | 组件演示应用 |
| `vite-plugins/` | 可供宿主工程复用的 Vite 插件 |
| `docs/` | 接入与贡献类文档 |

## 版本与发版

遵循 [Semantic Versioning](https://semver.org/)：

| 变更类型 | 版本 |
|----------|------|
| 缺陷修复、文档（兼容） | PATCH `0.1.x` |
| 新增组件 / 能力（兼容） | MINOR `0.x.0` |
| 破坏性 API 或 token 更名 | MAJOR `x.0.0` |

```bash
# 1. 更新 package.json 的 version
# 2. 更新 CHANGELOG（建议）
git tag v0.1.1
git push origin v0.1.1
```

消费方应锁定 **tag**（或日后 npm 精确版本），避免长期跟踪 `main`。

## 相关文档

| 文档 | 内容 |
|------|------|
| [docs/consumers.md](./docs/consumers.md) | 宿主工程接入、联调、CI、体积与插件 |
| [src/theme/brand.example.css](./src/theme/brand.example.css) | 品牌色覆盖示例 |

## 仓库状态

- **包名**：`@niuma/ui`
- **源码**：https://github.com/Blair-Shang/niuma-ui
- **首发标签**：`v0.1.0`
- **许可**：目前 Private；开源前将补充 `LICENSE` 与贡献指南

## 致谢

交互原语基于 Reka UI；图标默认集成 Lucide；代码编辑能力基于 Monaco Editor 与 CodeMirror。
