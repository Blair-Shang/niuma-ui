import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

/**
 * 依赖与 Vite 查询串（如 `?worker`）留给宿主打包器解析。
 * 这样 Monaco Worker 仍由消费方 Vite 处理，pnpm 隔离目录也能从本包找到 reka-ui。
 */
function isExternal(id: string): boolean {
  if (/\?(?:worker|url|raw)(?:&|$)/.test(id)) return true
  if (id.includes('?vue')) return false
  if (id.startsWith('\0')) return false
  if (id.startsWith('.') || id.startsWith('/') || /^[A-Za-z]:/.test(id)) return false
  if (id.endsWith('.vue')) return false
  return true
}

const sharedOutput = {
  preserveModules: true,
  preserveModulesRoot: 'src',
  entryFileNames: '[name].js',
}

export default defineConfig({
  plugins: [vue()],
  publicDir: false,
  build: {
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
        'dev/vite-codemirror-deps': resolve(root, 'src/dev/vite-codemirror-deps.ts'),
        'dev/vite-xterm-deps': resolve(root, 'src/dev/vite-xterm-deps.ts'),
      },
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      external: isExternal,
      output: sharedOutput,
    },
    rolldownOptions: {
      external: isExternal,
      output: sharedOutput,
    },
  },
})
