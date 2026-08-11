# 变更日志

本文件记录项目的重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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

[Unreleased]: https://github.com/Blair-Shang/niuma-ui/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Blair-Shang/niuma-ui/releases/tag/v1.0.0
