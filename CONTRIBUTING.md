# 贡献指南

感谢参与 `niuma-ui` 的贡献。本文说明如何在本仓库中开发、文档化并合入变更。

请同时阅读 [行为准则](./CODE_OF_CONDUCT.md)。

English: [CONTRIBUTING.en.md](./CONTRIBUTING.en.md) · [docs/components.en.md](./docs/components.en.md) · [docs/consumers.en.md](./docs/consumers.en.md) · [README.md](./README.md). PR descriptions may be Chinese or English.

用户向文档（README、consumers）不要写发版密钥或个人 npm 账号。发版只写在本文。

## 开发环境

```bash
pnpm install
pnpm dev:site     # 文档站（对外用法）：http://127.0.0.1:5181
pnpm dev          # 内部测试台：http://127.0.0.1:5180（禁止当官网）
pnpm build        # 库产物 → dist/
pnpm test
pnpm test:watch
```

要求：Node.js ≥ 20，本仓库开发用 pnpm ≥ 9，Vue ^3.5。发布包不强制消费方使用 pnpm。

## Pull Request 流程

1. 大型功能或破坏性 API 变更请先开 Issue 讨论。
2. 单个 PR 聚焦一件事。
3. 行为变更时在对应模块的 `__tests__/` 补充或更新 `*.spec.ts`（组件跟 `src/components/{slug}/__tests__/`；跨组件冒烟才放 `src/__tests__/`）。
4. 对外用法**必须**写在文档站 `site/`（catalog + `demos/{slug}.vue`），写法见 [site/README.md](./site/README.md)。`playground/` 只做内部冒烟与像素回归，禁止当作用法说明。
5. 涉及公开 API、token、架构或安装步骤时同步更新：
   - [docs/components.md](./docs/components.md)（架构红线；英文 [components.en.md](./docs/components.en.md)）
   - [docs/consumers.md](./docs/consumers.md) / [docs/consumers.en.md](./docs/consumers.en.md)
   - [README.md](./README.md) / [README.zh-CN.md](./README.zh-CN.md)（若安装/约定变化）
   - [CHANGELOG.md](./CHANGELOG.md) 的 `[Unreleased]` 段落
6. 非发版 PR 不要擅自改 `package.json` 的 `version`。

### 提交说明

建议简洁祈使句（中英文均可）：

- `feat: 为 RsXxx 增加折叠模式`
- `fix: 过滤后保持 RsTable 选中`
- `docs: 补充 Tree fieldNames 说明`
- `chore: 收紧 CI`

本地提交请使用本人 git 身份，不要使用 Cursor / bot 账号作为 author。

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

**完整架构契约**（红线、公开面、Token、Vue/CSS/浮层/表单/a11y/SSR、检查清单）见：

- 中文：[docs/components.md](./docs/components.md)
- English: [docs/components.en.md](./docs/components.en.md)

摘要（细节以该文档为准，冲突时以红线为准）：

| 规则 | 说明 |
|------|------|
| 命名 | 公开组件 `Rs*`；内部 `*-utils.ts` 无 Rs 前缀 |
| 公开 API | 只从 `src/index.ts` 导出；DOM 实现细节默认不导出 |
| Reka UI | 原语封在本包；消费方与 site 不得直接依赖 `reka-ui` |
| Token | `--rs-*`；禁止硬编码品牌色、px、system 字体栈 |
| 尺寸 / 圆角 | `RsComponentSize` / `RsRadius` + resolve hooks |
| 形态 × 色 | `variant` 管形状，`tone` 管色相 |
| 国际化 | `useRsI18n`，未设 locale 跟本机语言，回退 zh-CN；zh-CN / en-US 成对。社区语言见 [docs/locales.md](./docs/locales.md) |
| 外部规范 | WHATWG 语义、Vue Style Guide A/B、APG 键盘；Google HTML/CSS 不作合同 |
| 无障碍 | 先原生后 ARIA；图标按钮要标签；当前项 `aria-current`；浮层焦点陷阱 |
| 文档 | 对外用法只认 `site/`；`playground/` 仅内部测试 |
| 测试 | 挂载冒烟 + utils 边界 |
| 目录 | 组件 `index.ts` + `src/` + `__tests__/`；`src/` 默认平铺；仅表格级再拆。细则 [§3](./docs/components.md) |

### 新增组件步骤

按 [docs/components.md §15](./docs/components.md) 检查清单执行。目录模板：

```text
src/components/{slug}/
  index.ts              # export { default as RsXxx } from './src/RsXxx.vue'
  src/
    RsXxx.vue
    xxx-utils.ts        # 需要时
  style/                # 仅有独立 CSS 时
  __tests__/
    RsXxx.spec.ts
```

`src/index.ts` 只增加一行：`export { RsXxx } from './components/{slug}'`。目录名等于文档站 slug，并在 `site/catalog/components/{group}.ts` 归入 `basic` / `form` / `nav` / `feedback` / `data` / `editor`。不要按 group 再套一层源码目录。然后 locale → **site catalog + demo** → 更新清单 → CHANGELOG。playground 可选。

## 社区语言包

官方只维护 zh-CN / en-US。登记其它语言、key 清单与复数写法见 [docs/locales.md](./docs/locales.md)。不要把 ja / ar / ko 官方表推进 `messages.ts`。

### 破坏性变更

Props / 事件 / 插槽 / 导出 / Token / 默认值语义变更须 **MAJOR**，CHANGELOG 写迁移。未登记的新导出视为破坏架构。

## 缺陷与需求

请使用 GitHub Issues 模板。尽量附上 Vue / Vite / `niuma-ui` 版本与最小复现。

## 安全

见 [SECURITY.md](./SECURITY.md)。请勿在公开 Issue 中披露未修复漏洞。

## 许可

提交贡献即表示你同意将贡献按 [Apache License 2.0](./LICENSE) 授权给本项目。
