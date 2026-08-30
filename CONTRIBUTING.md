# 贡献指南

感谢参与 `niuma-ui` 的贡献。本文说明如何在本仓库中开发、文档化并合入变更。

请同时阅读 [行为准则](./CODE_OF_CONDUCT.md)。

English note: component and install docs are maintained in Chinese first; PRs may describe changes in Chinese or English.

## 开发环境

```bash
pnpm install
pnpm dev          # Playground：http://localhost:5180
pnpm build        # 库产物 → dist/（npm 发布用；本机 link 的类型检查也依赖它）
pnpm test         # Vitest 单次
pnpm test:watch
```

要求：Node.js ≥ 20，本仓库开发用 pnpm ≥ 9，Vue ^3.5。发布包不强制消费方使用 pnpm。

## Pull Request 流程

1. 大型功能或破坏性 API 变更请先开 Issue 讨论。
2. 单个 PR 聚焦一件事。
3. 行为变更时补充或更新 `src/__tests__/` 测试。
4. 新 UI 在 `playground/` 提供演示入口：于 `playground/routes.ts` 登记 `group` / `description`，并尽量为关键 DemoBlock 补充可复制 `code` 与 `DemoPage` 的 `api` 简表。
5. 涉及公开 API、token 或安装步骤时同步更新：
   - [README.md](./README.md)
   - [docs/consumers.md](./docs/consumers.md)
   - [docs/components.md](./docs/components.md)
   - [CHANGELOG.md](./CHANGELOG.md) 的 `[Unreleased]` 段落
6. 非发版 PR 不要擅自改 `package.json` 的 `version`。

### 提交说明

建议简洁祈使句（中英文均可）：

- `feat: 为 RsXxx 增加折叠模式`
- `fix: 过滤后保持 RsTable 选中`
- `docs: 补充 Tree fieldNames 说明`
- `chore: 收紧 CI`

本地提交请使用本人身份（例如 name=`shangjian`），不要使用 Cursor / bot 账号作为 author。

## 发版

1. 把变更写进 [CHANGELOG.md](./CHANGELOG.md) 的 `[Unreleased]`，再把它改成 `## [X.Y.Z] - YYYY-MM-DD`。
2. 更新 `package.json` 的 `version`。
3. 合并到 `main` 后打 **附注 tag**（说明会出现在 `git show vX.Y.Z`）：

   ```bash
   git tag -a vX.Y.Z -m "niuma-ui X.Y.Z

   从 CHANGELOG 复制本版本的修复/新增要点。"
   git push origin main
   git push origin vX.Y.Z
   ```

4. GitHub Actions **Publish** 会：跑测试、`prepublishOnly` 构建 `dist/`、`pnpm publish`，并从 CHANGELOG 该版本段落生成 **GitHub Release** 说明（npm 页面与 Releases 都能看到）。
5. 已推过的 tag 若漏了 Release 说明：Actions → Publish → **Run workflow**，填写 `tag`（如 `v1.1.1`），勾选 `skip_npm`。

仓库需配置 Secret：`NPM_TOKEN`。

生成方式（避免 CI 报 `EOTP`）：

1. npm → Access Tokens → **Granular Access Token**
2. 包 `niuma-ui`：**Read and write**
3. 勾选 **Bypass two-factor authentication**
4. 将 token 写入 GitHub Actions Secret `NPM_TOKEN`

不要使用会过期的 OTP 作为 Secret。

## 组件规范

完整清单与规则见 **[docs/components.md](./docs/components.md)**。摘要：

| 规则 | 说明 |
|------|------|
| 命名 | 公开组件使用 `Rs*` 前缀（如 `RsButton.vue`） |
| 公开 API | 仅通过 `src/index.ts` 导出；稳定能力不要要求消费方深路径导入 |
| Reka UI | 原语封装在本包内；消费方不得直接依赖 `reka-ui` |
| Token | 视觉值走 `--rs-*` / 主题预设，避免写死品牌色、字号 px 或 system 字体栈 |
| 尺寸 / 圆角 | 优先 `RsComponentSize` / `RsRadius` 与对应 resolve hooks |
| 国际化 | 用户可见文案尽量走 `useRsI18n` / locale 表 |
| 无障碍 | 图标按钮需标签；保持键盘焦点与对话框焦点陷阱 |
| 重型依赖 | Monaco / xterm 等放在专用组件；轻量应用勿盲目用主入口 |
| 测试 | 新组件至少有挂载冒烟测试；工具函数覆盖边界情况 |

### 新增组件步骤

1. 实现 `src/components/RsYourComponent.vue`（复杂逻辑可拆 `*-utils.ts`）。
2. 在 `src/index.ts` 导出组件及公开类型 / 辅助函数。
3. 添加 `src/__tests__/RsYourComponent.spec.ts`。
4. 在 Playground 增加演示。
5. 更新 [docs/components.md](./docs/components.md) 清单。
6. 在 `CHANGELOG.md` 记录。

### 破坏性变更

Props 更名、删除导出、删除 token 等需 **MAJOR** 版本，并在 CHANGELOG 写清迁移说明。

## 缺陷与需求

请使用 GitHub Issues 模板。尽量附上 Vue / Vite / `niuma-ui` 版本与最小复现。

## 安全

见 [SECURITY.md](./SECURITY.md)。请勿在公开 Issue 中披露未修复漏洞。

## 许可

提交贡献即表示你同意将贡献按 [Apache License 2.0](./LICENSE) 授权给本项目。
