# @niuma/ui

NiuMa 设计系统组件库（`Rs*` 组件 + `--rs-*` token）。

独立仓库，供桌面端 [niuma](https://github.com/Blair-Shang/niuma)、官网 `niuma-site` 及其它工程复用。

## 安装

**本地源码联调（推荐开发机）：**

```json
"@niuma/ui": "link:../niuma-ui"
```

**锁定版本（CI / 发布）：**

```json
"@niuma/ui": "git+https://github.com/Blair-Shang/niuma-ui.git#v0.1.0"
```

私有仓库需本机 / CI 具备读权限（`gh auth login` 或 PAT）。

## 使用

```ts
import { RsButton, RsConfigProvider } from '@niuma/ui'
import '@niuma/ui/styles.css'
```

业务层禁止直接 `import 'reka-ui'`。

## 开发

```bash
pnpm install
pnpm dev          # Playground :5180
pnpm test
```

## 版本

遵循 SemVer。发版：

```bash
# 修改 package.json version 后
git tag v0.1.1
git push origin v0.1.1
```

消费方更新依赖中的 tag 并重新 `pnpm install`。

## 目录

| 路径 | 说明 |
|------|------|
| `src/components/` | `Rs*` 组件 |
| `src/styles.css` | 设计 token 与全局样式 |
| `playground/` | 组件预览 |
| `vite-plugins/` | 供消费方 Vite 复用的插件 |
