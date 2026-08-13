# RsTable Playwright 像素回归

自动化截图对比，防止样式/布局静默漂移。与 DOM 基线互补：DOM 锁结构，像素锁观感。

## 命令

```bash
# 首次或本机需装浏览器
pnpm exec playwright install chromium

# 跑回归（自动起 playground :5180）
pnpm test:visual

# 有意改 UI 后更新基准图（务必将 PNG 一并提交）
pnpm test:visual:update
```

## 夹具页

- 路由：`/#/visual/rs-table`（不进侧栏）
- 固定英文/浅色/固定行列与宽度，降低抖动

## CI

GitHub Actions job `visual`：`pnpm test:visual`（`CI=true`）。  
失败产物：`test-results/`、`playwright-report/`（workflow 上传）。

## 约定

1. 只截 `.rs-table-shell`（或夹具根），不截整站侧栏。  
2. 改视觉后必须本地看 diff，再 `--update-snapshots`。  
3. 跨 OS 允许 `maxDiffPixelRatio: 0.02`；若仍抖，优先改夹具字体/尺寸而非盲目放宽容差。
