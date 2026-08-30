/**
 * 第一方宿主插件：业务 `pnpm dev` 联调源码，`vite build` / npm 包走 dist。
 *
 * 禁止把 @niuma/ui 别名到 src/index.ts。Vite 评估整桶会灌入未使用组件 CSS，
 * 和打包摇树后的模块图不一致。本插件只改写用到的具名导入：
 * - serve + 存在 src：绝对路径指向 .vue / .ts，组件可 HMR
 * - build 或仅有 dist：包内子路径 .js，与 npm 发布面一致
 * styles.css 在 serve 时指到源码（与 dist 同一份，含 @import tailwindcss）。
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'

type BindingKind = 'default' | 'named'

/** RuntimeBinding 记录 index 里一个运行时导出对应的源码 from。 */
type RuntimeBinding = {
  from: string
  kind: BindingKind
}

const SPECIFIERS = ['@niuma/ui', 'niuma-ui'] as const

/**
 * NiumaUiHost 让宿主 dev 走源码、build 走发布子路径，模块图对齐。
 */
export function niumaUiHost(): Plugin {
  const root = resolvePkgRoot()
  const srcRoot = join(root, 'src')
  const hasSrc = existsSync(join(srcRoot, 'index.ts'))
  const map = loadRuntimeBindings(root)
  let useSource = false

  return {
    name: 'niuma-ui-host',
    enforce: 'pre',
    config(_user, env) {
      useSource = env.command === 'serve' && hasSrc
      if (!useSource) return {}
      const styles = join(srcRoot, 'styles.css')
      const alias: { find: string; replacement: string }[] = []
      if (existsSync(styles)) {
        alias.push(
          { find: '@niuma/ui/styles.css', replacement: styles },
          { find: 'niuma-ui/styles.css', replacement: styles },
        )
      }
      return {
        resolve: { alias },
        optimizeDeps: {
          exclude: ['@niuma/ui', 'niuma-ui'],
        },
      }
    },
    transform(code, id) {
      if (!/\.(mjs|cjs|js|ts|tsx|vue)$/.test(id.split('?')[0] ?? '')) return null
      if (id.includes('node_modules') && !id.includes('niuma-ui')) return null
      let next = code
      let changed = false
      for (const spec of SPECIFIERS) {
        const rewritten = rewriteBlock(next, spec, map, (from) =>
          resolveTarget(from, spec, root, useSource),
        )
        if (rewritten !== next) {
          next = rewritten
          changed = true
        }
      }
      return changed ? { code: next, map: null } : null
    },
  }
}

/**
 * RewriteNiumaUiNamedImports 与 niumaUiHost 相同，保留旧导出名。
 */
export const rewriteNiumaUiNamedImports = niumaUiHost

/**
 * ResolvePkgRoot 定位本包根目录。
 */
function resolvePkgRoot(): string {
  const require = createRequire(import.meta.url)
  try {
    return dirname(require.resolve('@niuma/ui/package.json'))
  } catch {
    return dirname(require.resolve('niuma-ui/package.json'))
  }
}

/**
 * LoadRuntimeBindings 从 src/index.ts 或 dist/index.js 收集运行时导出。
 */
function loadRuntimeBindings(root: string): Map<string, RuntimeBinding> {
  const indexPath = existsSync(join(root, 'src/index.ts'))
    ? join(root, 'src/index.ts')
    : join(root, 'dist/index.js')
  const source = readFileSync(indexPath, 'utf8')
  const map = new Map<string, RuntimeBinding>()
  const re = /export\s*\{([^}]+)\}\s*from\s*['"](\.[^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source)) !== null) {
    const from = match[2] ?? ''
    if (!from) continue
    for (const raw of (match[1] ?? '').split(',')) {
      const part = raw.trim()
      if (!part || part.startsWith('type ')) continue
      const def = part.match(/^default\s+as\s+(\w+)$/)
      if (def?.[1]) {
        map.set(def[1], { from, kind: 'default' })
        continue
      }
      const aliased = part.match(/^(\w+)\s+as\s+(\w+)$/)
      if (aliased?.[2]) {
        map.set(aliased[2], { from, kind: 'named' })
        continue
      }
      if (/^\w+$/.test(part)) {
        map.set(part, { from, kind: 'named' })
      }
    }
  }
  return map
}

/**
 * ResolveTarget 把 index 里的 from 收成 Vite 可解析的说明符。
 */
function resolveTarget(from: string, spec: string, root: string, useSource: boolean): string {
  if (!useSource) return `${spec}/${toPublishedRel(from)}`
  const rel = from.replace(/\\/g, '/').replace(/^\.\//, '')
  let abs = join(root, 'src', rel)
  if (!existsSync(abs)) {
    if (existsSync(`${abs}.ts`)) abs = `${abs}.ts`
    else if (existsSync(`${abs}.js`)) abs = `${abs}.js`
  }
  return toViteFsPath(abs)
}

/**
 * ToPublishedRel 把源码 `./components/RsButton.vue` 收成 `components/RsButton.js`。
 */
function toPublishedRel(from: string): string {
  let rel = from.replace(/\\/g, '/')
  rel = rel.replace(/^\.\//, '')
  rel = rel.replace(/\.vue$/, '.js')
  if (!rel.endsWith('.js') && !rel.endsWith('.css')) {
    rel = `${rel}.js`
  }
  return rel
}

/**
 * ToViteFsPath 把本机绝对路径写成 Vite 能 import 的形式（Windows 带盘符）。
 */
function toViteFsPath(abs: string): string {
  const posix = abs.replace(/\\/g, '/')
  if (/^[A-Za-z]:\//.test(posix)) return `/${posix}`
  return posix
}

/**
 * RewriteBlock 替换一处 `import|export { ... } from 'spec'`。
 */
function rewriteBlock(
  code: string,
  spec: string,
  map: Map<string, RuntimeBinding>,
  targetOf: (from: string) => string,
): string {
  const escaped = spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `(import|export)\\s*\\{([^}]+)\\}\\s*from\\s*['"]${escaped}['"]`,
    'g',
  )
  return code.replace(re, (full, keyword: string, inner: string) => {
    const runtime: string[] = []
    const types: string[] = []
    for (const raw of inner.split(',')) {
      const part = raw.trim()
      if (!part) continue
      const typeMatch = part.match(/^type\s+(.+)$/)
      if (typeMatch?.[1]) {
        types.push(typeMatch[1].trim())
        continue
      }
      const name = part.includes(' as ') ? (part.split(/\s+as\s+/).pop() ?? part) : part
      const binding = map.get(name)
      if (!binding) {
        types.push(part)
        continue
      }
      const target = targetOf(binding.from)
      if (binding.kind === 'default') {
        runtime.push(`${keyword} { default as ${name} } from '${target}'`)
      } else {
        runtime.push(`${keyword} { ${part} } from '${target}'`)
      }
    }
    const lines = [...runtime]
    if (types.length > 0) {
      const kw = keyword === 'import' ? 'import type' : 'export type'
      lines.push(`${kw} { ${types.join(', ')} } from '${spec}'`)
    }
    return lines.length > 0 ? lines.join('\n') : full
  })
}
