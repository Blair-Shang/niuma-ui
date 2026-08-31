/**
 * 开发仓（有 src）在 pnpm install 后若还没有 dist，则编一次。
 * npm 包只有 dist、没有 src，直接退出，避免消费者重编。
 * 发布走 prepublishOnly，不会只靠本脚本。
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (!existsSync(resolve(root, 'src/index.ts'))) {
  process.exit(0)
}
if (process.env.SKIP_NIUMA_UI_PREPARE === '1') {
  process.exit(0)
}
if (existsSync(resolve(root, 'dist/vite-plugins/niuma-ui-host.js'))) {
  process.exit(0)
}

const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})
process.exit(result.status ?? 1)
