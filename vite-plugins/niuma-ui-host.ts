/**
 * 第一方宿主插件：`pnpm dev` 联调用到的源码，`vite build` / npm 走发布子路径。
 * 禁止把 @niuma/ui 别名到 src/index.ts（评估整桶会灌入未使用组件 CSS）。
 *
 * 写法对齐 Vite / unplugin 惯例：工厂 + options、createFilter、
 * es-module-lexer 定位静态 import/export、magic-string 保留 sourcemap、
 * apply / configResolved 区分 serve 与 build。
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { createFilter, type FilterPattern } from '@rollup/pluginutils'
import { init, parse } from 'es-module-lexer'
import MagicString from 'magic-string'
import type { Plugin } from 'vite'

const SPECIFIERS = new Set(['@niuma/ui', 'niuma-ui'])

/** NiumaUiHostOptions 为宿主提供 include / exclude / 包根覆盖。 */
export type NiumaUiHostOptions = {
  include?: FilterPattern
  exclude?: FilterPattern
  root?: string
}

/** NiumaUiBinding 描述主入口一个运行时导出如何落到源码 from。 */
export type NiumaUiBinding = {
  from: string
  kind: 'default' | 'named'
}

type HostContext = {
  root: string
  hasSrc: boolean
  useSource: boolean
  map: Map<string, NiumaUiBinding>
  filter: (id: string) => boolean
}

/**
 * NiumaUiHost 返回一组插件（Vite 会摊平）。serve 做 styles alias，两侧都改写具名导入。
 */
export function niumaUiHost(options: NiumaUiHostOptions = {}): Plugin[] {
  const root = options.root ?? resolvePkgRoot()
  const ctx: HostContext = {
    root,
    hasSrc: existsSync(join(root, 'src/index.ts')),
    useSource: false,
    map: loadRuntimeBindings(root),
    filter: createFilter(
      options.include ?? [/\.([cm]?[jt]sx?|vue)(?:$|\?)/],
      options.exclude ?? [/\/node_modules\//],
    ),
  }
  return [niumaUiHostAlias(ctx), niumaUiHostRewrite(ctx)]
}

/**
 * NiumaUiHostAlias 仅在 serve 且存在 src 时把 styles.css 指到源码，并排除整桶预构建。
 */
function niumaUiHostAlias(ctx: HostContext): Plugin {
  return {
    name: 'niuma-ui-host:alias',
    apply: 'serve',
    enforce: 'pre',
    config() {
      if (!ctx.hasSrc) return {}
      const styles = join(ctx.root, 'src/styles.css')
      const alias = existsSync(styles)
        ? [
            { find: '@niuma/ui/styles.css', replacement: styles },
            { find: 'niuma-ui/styles.css', replacement: styles },
          ]
        : []
      return {
        resolve: alias.length > 0 ? { alias } : {},
        optimizeDeps: {
          exclude: ['@niuma/ui', 'niuma-ui'],
        },
      }
    },
  }
}

/**
 * NiumaUiHostRewrite 把静态具名导入改到源码文件或 dist 子路径。
 */
function niumaUiHostRewrite(ctx: HostContext): Plugin {
  return {
    name: 'niuma-ui-host:rewrite',
    enforce: 'pre',
    configResolved(config) {
      ctx.useSource = config.command === 'serve' && ctx.hasSrc
    },
    async transform(code, id) {
      if (!ctx.filter(id)) return null
      if (!code.includes('@niuma/ui') && !code.includes('niuma-ui')) return null
      await init
      const [imports] = parse(code)
      const s = new MagicString(code)
      let changed = false
      for (const im of imports) {
        if (im.d !== -1) continue
        const spec = im.n
        if (!spec || !SPECIFIERS.has(spec)) continue
        const stmt = code.slice(im.ss, im.se)
        const next = rewriteHostStatement(stmt, spec, ctx.map, (from) =>
          resolveTarget(from, spec, ctx.root, ctx.useSource),
        )
        if (next && next !== stmt) {
          s.overwrite(im.ss, im.se, next)
          changed = true
        }
      }
      if (!changed) return null
      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary', source: id }),
      }
    },
  }
}

/**
 * RewriteHostStatement 改写一条已由 lexer 切出的静态 import/export。
 * 类型-only、namespace、动态 import 原样返回 null。
 */
export function rewriteHostStatement(
  stmt: string,
  spec: string,
  map: Map<string, NiumaUiBinding>,
  targetOf: (from: string) => string,
): string | null {
  const parsed = parseStaticImport(stmt)
  if (!parsed) return null
  const keyword = parsed.isExport ? 'export' : 'import'
  const lines: string[] = []
  const types: string[] = []

  if (parsed.defaultName) {
    const binding = map.get(parsed.defaultName)
    if (!binding) {
      lines.push(`${keyword} ${parsed.defaultName} from '${spec}'`)
    } else {
      const target = targetOf(binding.from)
      lines.push(emitBinding(keyword, binding.kind, parsed.defaultName, parsed.defaultName, target))
    }
  }

  for (const part of parsed.named) {
    if (part.isType) {
      types.push(part.clause)
      continue
    }
    const binding = map.get(part.imported)
    if (!binding) {
      types.push(part.clause)
      continue
    }
    const target = targetOf(binding.from)
    lines.push(emitBinding(keyword, binding.kind, part.imported, part.local, target))
  }

  if (types.length > 0) {
    const kw = parsed.isExport ? 'export type' : 'import type'
    lines.push(`${kw} { ${types.join(', ')} } from '${spec}'`)
  }
  return lines.length > 0 ? lines.join('\n') : null
}

function emitBinding(
  keyword: string,
  kind: NiumaUiBinding['kind'],
  imported: string,
  local: string,
  target: string,
): string {
  if (kind === 'default') {
    return `${keyword} { default as ${local} } from '${target}'`
  }
  const inner = imported === local ? imported : `${imported} as ${local}`
  return `${keyword} { ${inner} } from '${target}'`
}

type NamedPart = {
  imported: string
  local: string
  isType: boolean
  clause: string
}

function parseStaticImport(stmt: string): {
  isExport: boolean
  defaultName?: string
  named: NamedPart[]
} | null {
  const lead = stmt.trimStart()
  if (lead.startsWith('import type ') || lead.startsWith('export type ')) return null
  if (/\*\s+as\s+\w+/.test(stmt)) return null
  const isExport = lead.startsWith('export')
  let defaultName: string | undefined
  if (!isExport) {
    const m = lead.match(/^import\s+(\w+)\s*(?:,|from\b)/)
    if (m?.[1] && m[1] !== 'type') defaultName = m[1]
  }
  const named: NamedPart[] = []
  const open = stmt.indexOf('{')
  if (open !== -1) {
    const close = stmt.lastIndexOf('}')
    if (close > open) {
      for (const raw of stmt.slice(open + 1, close).split(',')) {
        const part = raw.trim()
        if (!part) continue
        const typeOnly = /^type\s+/.test(part)
        const body = typeOnly ? part.replace(/^type\s+/, '') : part
        const aliased = body.match(/^(\w+)(?:\s+as\s+(\w+))?$/)
        if (!aliased?.[1]) continue
        named.push({
          imported: aliased[1],
          local: aliased[2] ?? aliased[1],
          isType: typeOnly,
          clause: body,
        })
      }
    }
  }
  if (!defaultName && named.length === 0) return null
  return { isExport, defaultName, named }
}

function resolvePkgRoot(): string {
  const require = createRequire(import.meta.url)
  try {
    return dirname(require.resolve('@niuma/ui/package.json'))
  } catch {
    return dirname(require.resolve('niuma-ui/package.json'))
  }
}

function loadRuntimeBindings(root: string): Map<string, NiumaUiBinding> {
  const indexPath = existsSync(join(root, 'src/index.ts'))
    ? join(root, 'src/index.ts')
    : join(root, 'dist/index.js')
  const source = readFileSync(indexPath, 'utf8')
  const map = new Map<string, NiumaUiBinding>()
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

function toPublishedRel(from: string): string {
  let rel = from.replace(/\\/g, '/')
  rel = rel.replace(/^\.\//, '')
  rel = rel.replace(/\.vue$/, '.js')
  if (!rel.endsWith('.js') && !rel.endsWith('.css')) {
    rel = `${rel}.js`
  }
  return rel
}

function toViteFsPath(abs: string): string {
  const posix = abs.replace(/\\/g, '/')
  if (/^[A-Za-z]:\//.test(posix)) return `/${posix}`
  return posix
}
