/**
 * 第一方宿主插件：`pnpm dev` 联调用到的源码，`vite build` / npm 走发布子路径。
 * 禁止把 @niuma/ui 别名到 src/index.ts（评估整桶会灌入未使用组件 CSS）。
 *
 * 写法对齐 Vite / unplugin 惯例：工厂 + options、createFilter、
 * es-module-lexer 定位静态 import/export、magic-string 保留 sourcemap、
 * apply / configResolved 区分 serve 与 build。
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
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
  viteRoot: string
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
    viteRoot: process.cwd(),
    hasSrc: existsSync(join(root, 'src/index.ts')),
    useSource: false,
    map: loadRuntimeBindings(root),
    filter: createFilter(
      options.include ?? [/\.([cm]?[jt]sx?|vue)(?:$|\?)/],
      options.exclude ?? [/\/node_modules\//],
    ),
  }
  return [niumaUiHostAlias(ctx), niumaUiHostRewrite(ctx), niumaUiHostTailwindSource(ctx)]
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
      ctx.viteRoot = config.root
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

const NIUMA_UI_STYLES = /niuma-ui[\\/](?:src|dist)[\\/]styles\.css$/

/**
 * NiumaUiHostTailwindSource 给 niuma-ui/styles.css 补上宿主根与包内扫描目录。
 * CI 只看 node_modules 里的 styles.css 时，Tailwind 否则扫不到官网 / Ops 源码。
 */
function niumaUiHostTailwindSource(ctx: HostContext): Plugin {
  return {
    name: 'niuma-ui-host:tailwind-source',
    enforce: 'pre',
    configResolved(config) {
      ctx.viteRoot = config.root
    },
    transform(code, id) {
      const file = id.split('?')[0] ?? id
      if (!NIUMA_UI_STYLES.test(file.replace(/\\/g, '/'))) return null
      if (!code.includes('tailwindcss')) return null
      const cssDir = dirname(file)
      const pkgScan =
        ctx.useSource && existsSync(join(ctx.root, 'src'))
          ? join(ctx.root, 'src')
          : existsSync(join(ctx.root, 'dist'))
            ? join(ctx.root, 'dist')
            : ctx.root
      const specs = [ctx.viteRoot, pkgScan]
        .map((dir) => toSourceRel(cssDir, dir))
        .filter((spec, i, all) => all.indexOf(spec) === i)
      const inject = specs
        .filter((spec) => !code.includes(`@source '${spec}'`) && !code.includes(`@source "${spec}"`))
        .map((spec) => `@source '${spec}';`)
        .join('\n')
      if (!inject) return null
      const next = code.replace(
        /@import\s+['"]tailwindcss['"]\s*;/,
        `@import 'tailwindcss';\n${inject}`,
      )
      if (next === code) return null
      return { code: next, map: null }
    },
  }
}

/**
 * ToSourceRel 把目录收成 Tailwind @source 可用的相对路径。
 */
export function toSourceRel(fromDir: string, targetDir: string): string {
  let rel = relative(fromDir, targetDir).replace(/\\/g, '/')
  if (rel === '') return '.'
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
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
      throw new Error(`niumaUiHost: 未找到运行时导出 ${parsed.defaultName}，无法改写到发布子路径`)
    }
    lines.push(emitBinding(keyword, binding.kind, parsed.defaultName, parsed.defaultName, targetOf(binding.from)))
  }

  for (const part of parsed.named) {
    if (part.isType) {
      types.push(part.clause)
      continue
    }
    const binding = map.get(part.imported)
    if (!binding) {
      throw new Error(`niumaUiHost: 未找到运行时导出 ${part.imported}，无法改写到发布子路径`)
    }
    lines.push(emitBinding(keyword, binding.kind, part.imported, part.local, targetOf(binding.from)))
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

type Specifier = {
  left: string
  right: string
  isDefault: boolean
}

/**
 * ParseRuntimeBindings 从主入口抽出运行时导出名到文件的映射。
 * 同时认源码 `export { default as RsX } from './...'` 和发布桶
 * `import RsX_default from './...'` + `export { RsX_default as RsX }`。
 */
export function parseRuntimeBindings(source: string): Map<string, NiumaUiBinding> {
  const map = new Map<string, NiumaUiBinding>()
  const reexport = /^[ \t]*export\s+(?!type\b)\{([^}]+)\}\s+from\s*['"](\.[^'"]+)['"]/gm
  let match: RegExpExecArray | null
  while ((match = reexport.exec(source)) !== null) {
    const from = match[2] ?? ''
    if (!from) continue
    for (const spec of parseSpecifierList(match[1] ?? '')) {
      map.set(spec.right, { from, kind: spec.isDefault ? 'default' : 'named' })
    }
  }

  const locals = new Map<string, NiumaUiBinding>()
  const imports = /^[ \t]*import\s+(?!type\b)([\s\S]+?)\s+from\s*['"](\.[^'"]+)['"]/gm
  while ((match = imports.exec(source)) !== null) {
    const from = match[2] ?? ''
    if (!from) continue
    recordImportLocals(match[1] ?? '', from, locals)
  }

  const barrel = /^[ \t]*export\s+(?!type\b)\{([^}]+)\}(?!\s*from)/gm
  while ((match = barrel.exec(source)) !== null) {
    for (const spec of parseSpecifierList(match[1] ?? '')) {
      if (map.has(spec.right)) continue
      const binding = locals.get(spec.left)
      if (binding) map.set(spec.right, binding)
    }
  }
  return map
}

function parseSpecifierList(inner: string): Specifier[] {
  const out: Specifier[] = []
  for (const raw of inner.split(',')) {
    const part = raw.trim()
    if (!part || part.startsWith('type ')) continue
    const def = part.match(/^default\s+as\s+(\w+)$/)
    if (def?.[1]) {
      out.push({ left: 'default', right: def[1], isDefault: true })
      continue
    }
    const aliased = part.match(/^(\w+)\s+as\s+(\w+)$/)
    if (aliased?.[1] && aliased[2]) {
      out.push({ left: aliased[1], right: aliased[2], isDefault: false })
      continue
    }
    if (/^\w+$/.test(part)) {
      out.push({ left: part, right: part, isDefault: false })
    }
  }
  return out
}

function recordImportLocals(
  clause: string,
  from: string,
  locals: Map<string, NiumaUiBinding>,
): void {
  const trimmed = clause.trim()
  if (!trimmed || trimmed.startsWith('*')) return
  const namedStart = trimmed.indexOf('{')
  if (namedStart === -1) {
    if (/^\w+$/.test(trimmed)) locals.set(trimmed, { from, kind: 'default' })
    return
  }
  const before = trimmed.slice(0, namedStart).replace(/,\s*$/, '').trim()
  if (before && /^\w+$/.test(before)) {
    locals.set(before, { from, kind: 'default' })
  }
  const namedEnd = trimmed.lastIndexOf('}')
  if (namedEnd <= namedStart) return
  for (const spec of parseSpecifierList(trimmed.slice(namedStart + 1, namedEnd))) {
    if (spec.isDefault) continue
    locals.set(spec.right, { from, kind: 'named' })
  }
}

function loadRuntimeBindings(root: string): Map<string, NiumaUiBinding> {
  const srcIndex = join(root, 'src/index.ts')
  const distIndex = join(root, 'dist/index.js')
  const indexPath = existsSync(srcIndex) ? srcIndex : distIndex
  if (!existsSync(indexPath)) {
    throw new Error(`niumaUiHost: 未找到 ${srcIndex} 或 ${distIndex}`)
  }
  const map = parseRuntimeBindings(readFileSync(indexPath, 'utf8'))
  if (map.size === 0) {
    throw new Error(
      `niumaUiHost: ${indexPath} 没有解析到运行时导出（需要 src re-export 或 dist 桶 import/export）`,
    )
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
