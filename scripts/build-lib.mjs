/**
 * 构建 npm 发布产物：ESM + 类型声明 + 独立 CSS + 编译后的 Vite 插件。
 * 用法：node scripts/build-lib.mjs
 */
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')
const require = createRequire(import.meta.url)
const utf8 = 'utf8'

/**
 * Run 在仓库根执行一条命令，失败则退出。
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

/**
 * Walk 递归收集目录下的文件路径。
 * @param {string} dir
 * @returns {string[]}
 */
function walkFiles(dir) {
  /** @type {string[]} */
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(full))
    else out.push(full)
  }
  return out
}

/**
 * RewriteText 按映射表替换文件中的旧文件名。
 * @param {string} file
 * @param {Map<string, string>} renameMap
 */
function rewriteText(file, renameMap) {
  let code = readFileSync(file, utf8)
  const original = code
  for (const [from, to] of renameMap) {
    if (from === to) continue
    code = code.split(from).join(to)
  }
  if (code !== original) writeFileSync(file, code, utf8)
}

/**
 * LinkExtractedCss 把 SFC 抽出的 CSS 重新 import 进组件包装入口。
 * @param {string} dir
 */
function linkExtractedCss(dir) {
  /** @type {Map<string, string[]>} */
  const byComponent = new Map()
  for (const css of walkFiles(dir)) {
    if (!css.includes('.vue_vue_type_style_') || !css.endsWith('.css')) continue
    const js = css.replace(/\.vue_vue_type_style_.*\.css$/, '.js')
    if (!existsSync(js)) continue
    const list = byComponent.get(js) ?? []
    list.push(css)
    byComponent.set(js, list)
  }
  for (const [js, list] of byComponent) {
    let code = readFileSync(js, utf8)
    const jsDir = dirname(js)
    const imports = list
      .map((css) => {
        const rel = relative(jsDir, css).replace(/\\/g, '/')
        return `import './${rel}'`
      })
      .filter((line) => !code.includes(line))
    if (imports.length === 0) continue
    code = code.replace(/\/\* empty css[\s\S]*?\*\//g, '')
    writeFileSync(js, `${imports.join('\n')}\n${code}`, utf8)
  }
}

/**
 * FlattenVueArtifacts 把 Vite 的长文件名收成 Component.impl.js / Component.css。
 * @param {string} dir
 */
function flattenVueArtifacts(dir) {
  /** @type {Map<string, string>} */
  const renameMap = new Map()
  const files = walkFiles(dir)

  for (const file of files) {
    const name = file.replace(/\\/g, '/').split('/').pop() ?? ''
    if (name.includes('.vue_vue_type_script_') && name.endsWith('.js')) {
      const next = file.replace(/\.vue_vue_type_script_.*\.js$/, '.impl.js')
      renameMap.set(name, next.replace(/\\/g, '/').split('/').pop() ?? name)
      if (file !== next) renameSync(file, next)
      continue
    }
    const style = name.match(/^(.*)\.vue_vue_type_style_index_(\d+)_[^.]+\.css$/)
    if (style) {
      const [, base, index] = style
      const nextName = index === '0' ? `${base}.css` : `${base}-${index}.css`
      const next = join(dirname(file), nextName)
      renameMap.set(name, nextName)
      if (file !== next) renameSync(file, next)
    }
  }

  if (renameMap.size === 0) return
  for (const file of walkFiles(dir)) {
    if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.d.ts')) {
      rewriteText(file, renameMap)
    }
  }
}

/**
 * WriteStandaloneCss 发布与源码同一套样式：透传 @import 'tailwindcss'，内联 vue-sonner。
 * 禁止剥掉 Tailwind，否则本机联调源码和 npm dist 的 Preflight 对不齐。
 */
function writeStandaloneCss() {
  const sonnerPath = require.resolve('vue-sonner/style.css')
  const sonner = readFileSync(sonnerPath, utf8)
  let css = readFileSync(resolve(root, 'src/styles.css'), utf8)
  css = css.replace(/@import\s+['"]vue-sonner\/style\.css['"]\s*;\s*/g, `${sonner}\n`)
  writeFileSync(resolve(distDir, 'styles.css'), css, utf8)
  mkdirSync(resolve(distDir, 'theme'), { recursive: true })
  cpSync(
    resolve(root, 'src/theme/brand.example.css'),
    resolve(distDir, 'theme/brand.example.css'),
  )
}

/**
 * RewriteDts 把类型入口从 .vue 改到 .js，与编译产物对齐。
 * @param {string} dir
 */
function rewriteDts(dir) {
  for (const file of walkFiles(dir)) {
    if (!file.endsWith('.vue.d.ts')) continue
    const jsDts = file.replace(/\.vue\.d\.ts$/, '.d.ts')
    cpSync(file, jsDts)
    rmSync(file)
  }
  for (const file of walkFiles(dir)) {
    if (!file.endsWith('.d.ts')) continue
    let text = readFileSync(file, utf8)
    const next = text.replace(/(['"])([^'"]+)\.vue\1/g, '$1$2.js$1')
    if (next !== text) writeFileSync(file, next, utf8)
  }
}

/**
 * AssertPublishedSurface 检查发布契约，避免把源码期布局再发出去。
 */
function assertPublishedSurface() {
  const required = [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/styles.css',
    'dist/vite-plugins/niuma-ui-host.js',
    'dist/vite-plugins/niuma-ui-host.d.ts',
    'dist/vite-plugins/rewrite-named-imports.js',
    'dist/vite-plugins/rewrite-named-imports.d.ts',
    'dist/vite-plugins/monaco-zh-nls.js',
    'dist/vite-plugins/monaco-zh-nls.d.ts',
    'dist/vite-plugins/silence-antlr-parse-console.js',
    'dist/vite-plugins/silence-antlr-parse-console.d.ts',
    'dist/dev/vite-codemirror-deps.js',
    'dist/dev/vite-xterm-deps.js',
    'dist/theme/brand.example.css',
  ]
  for (const rel of required) {
    if (!existsSync(resolve(root, rel))) {
      console.error(`[build-lib] missing ${rel}`)
      process.exit(1)
    }
  }

  const styles = readFileSync(resolve(distDir, 'styles.css'), utf8)
  if (!styles.includes("@import 'tailwindcss'") && !styles.includes('@import "tailwindcss"')) {
    console.error('[build-lib] dist/styles.css must pass through @import tailwindcss')
    process.exit(1)
  }

  const ugly = walkFiles(distDir).filter((f) => f.includes('.vue_vue_type_'))
  if (ugly.length > 0) {
    console.error(`[build-lib] leftover Vite SFC artifact:\n${ugly[0]}`)
    process.exit(1)
  }

  const indexDts = readFileSync(resolve(distDir, 'index.d.ts'), utf8)
  if (indexDts.includes('.vue\'' ) || indexDts.includes('.vue"')) {
    console.error('[build-lib] dist/index.d.ts still references .vue modules')
    process.exit(1)
  }
}

run('pnpm', ['exec', 'vite', 'build', '--config', 'vite.config.lib.ts'])
linkExtractedCss(distDir)
flattenVueArtifacts(distDir)
writeStandaloneCss()
run('pnpm', ['exec', 'vue-tsc', '-p', 'tsconfig.build.json'])
rewriteDts(distDir)
run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.plugins.json'])
assertPublishedSurface()

console.log('[build-lib] dist ESM + d.ts + standalone CSS + vite-plugins ready')
