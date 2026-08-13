import { defineConfig, devices } from '@playwright/test'

const PORT = 5180
const baseURL = `http://127.0.0.1:${PORT}`

/**
 * RsTable 等组件像素回归。
 * - 本地：pnpm test:visual
 * - 更新基线：pnpm test:visual:update
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  // 不带 OS 后缀，避免 win 基线在 ubuntu CI 找不到
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      // CI Linux 与本机字体略有差异，允许小比例偏差
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    colorScheme: 'light',
    locale: 'en-US',
    // 动效已由 expect.toHaveScreenshot.animations: 'disabled' 关闭；
    // 当前 @playwright/test 类型无 reducedMotion 字段。
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
