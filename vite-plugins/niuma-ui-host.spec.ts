import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  emitLiveReexportIndex,
  parseRuntimeBindings,
  rewriteHostModule,
  rewriteHostStatement,
  scriptBlocks,
  toSourceRel,
  type NiumaUiBinding,
} from './niuma-ui-host'

const map = new Map<string, NiumaUiBinding>([
  ['RsButton', { from: './components/RsButton.vue', kind: 'default' }],
  ['supportsRsButtonTone', { from: './components/button-utils', kind: 'named' }],
])

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function published(from: string): string {
  let rel = from.replace(/^\.\//, '').replace(/\.vue$/, '.js')
  if (!rel.endsWith('.js')) rel += '.js'
  return `@niuma/ui/${rel}`
}

const DIST_BARREL = `
import RsConfigProvider_default from "./components/RsConfigProvider.js";
import RsBadge_default from "./components/RsBadge.js";
import RsButton_default from "./components/RsButton.js";
import { isRsButtonFilledVariant, supportsRsButtonTone } from "./components/button-utils.js";
import { useRsToast } from "./composables/useRsToast.js";
export { RsBadge_default as RsBadge, RsButton_default as RsButton, RsConfigProvider_default as RsConfigProvider, isRsButtonFilledVariant, supportsRsButtonTone, useRsToast };
`

describe('parseRuntimeBindings', () => {
  it('parses src/index.ts re-exports', () => {
    const source = readFileSync(join(pkgRoot, 'src/index.ts'), 'utf8')
    const parsed = parseRuntimeBindings(source)
    expect(parsed.get('RsButton')).toEqual({ from: './components/RsButton.vue', kind: 'default' })
    expect(parsed.get('RsConfigProvider')).toEqual({
      from: './components/RsConfigProvider.vue',
      kind: 'default',
    })
    expect(parsed.get('supportsRsButtonTone')).toEqual({
      from: './components/button-utils',
      kind: 'named',
      sourceName: 'supportsRsButtonTone',
    })
    expect(parsed.has('RsCardVariant')).toBe(false)
  })

  it('maps real dist monaco named exports onto files, not ./monaco', () => {
    const dist = join(pkgRoot, 'dist/index.js')
    if (!existsSync(dist)) return
    const parsed = parseRuntimeBindings(readFileSync(dist, 'utf8'))
    expect(parsed.get('setupMonacoWorkers')?.from).toMatch(/monaco\/setup\.js$/)
    expect(parsed.get('setupMonacoWorkers')?.from).not.toBe('./monaco')
  })

  it('parses published dist barrel import + export aliases', () => {
    const parsed = parseRuntimeBindings(DIST_BARREL)
    expect(parsed.get('RsButton')).toEqual({
      from: './components/RsButton.js',
      kind: 'default',
    })
    expect(parsed.get('RsConfigProvider')).toEqual({
      from: './components/RsConfigProvider.js',
      kind: 'default',
    })
    expect(parsed.get('RsBadge')).toEqual({
      from: './components/RsBadge.js',
      kind: 'default',
    })
    expect(parsed.get('supportsRsButtonTone')).toEqual({
      from: './components/button-utils.js',
      kind: 'named',
      sourceName: 'supportsRsButtonTone',
    })
    expect(parsed.get('useRsToast')).toEqual({
      from: './composables/useRsToast.js',
      kind: 'named',
      sourceName: 'useRsToast',
    })
  })
})

describe('emitLiveReexportIndex', () => {
  it('emits from-clause re-exports, not an import-all facade', () => {
    const parsed = parseRuntimeBindings(DIST_BARREL)
    const out = emitLiveReexportIndex(parsed)
    expect(out).toContain(`export { default as RsButton } from './components/RsButton.js'`)
    expect(out).toContain(`export { supportsRsButtonTone } from './components/button-utils.js'`)
    expect(out).not.toContain('RsButton_default')
    expect(out).not.toMatch(/^import /m)
  })
})

describe('toSourceRel', () => {
  it('returns a relative @source path', () => {
    expect(toSourceRel(join('repo', 'niuma-ui', 'dist'), join('repo', 'niuma-site'))).toBe(
      '../../niuma-site',
    )
    expect(toSourceRel(join('repo', 'app'), join('repo', 'app'))).toBe('.')
  })
})

describe('scriptBlocks', () => {
  it('returns the whole module for ts/js', () => {
    const code = `import { RsButton } from '@niuma/ui'\n`
    expect(scriptBlocks(code, '/app/ui.ts')).toEqual([{ start: 0, code }])
  })

  it('extracts script setup from a raw vue SFC', () => {
    const sfc = [
      `<script setup lang="ts">`,
      `import { RsButton } from '@niuma/ui'`,
      `</script>`,
      `<template>`,
      `  <RsButton />`,
      `</template>`,
      ``,
    ].join('\n')
    const blocks = scriptBlocks(sfc, '/app/App.vue')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.code).toBe(`\nimport { RsButton } from '@niuma/ui'\n`)
    const block = blocks[0]
    expect(block).toBeDefined()
    if (!block) return
    expect(sfc.slice(block.start, block.start + block.code.length)).toBe(block.code)
  })

  it('treats vue type=script query as already-extracted JS', () => {
    const js = `import { RsButton } from '@niuma/ui'\n`
    expect(scriptBlocks(js, '/app/App.vue?vue&type=script&setup&lang.ts')).toEqual([
      { start: 0, code: js },
    ])
  })

  it('skips vue template and style submodules', () => {
    expect(scriptBlocks('<div/>', '/app/App.vue?vue&type=template')).toEqual([])
    expect(scriptBlocks('.x{}', '/app/App.vue?vue&type=style&index=0')).toEqual([])
  })
})

describe('rewriteHostModule', () => {
  it('rewrites named imports inside a vue SFC without parsing the template', async () => {
    const sfc = [
      `<script setup lang="ts">`,
      `import { RsButton } from '@niuma/ui'`,
      `</script>`,
      `<template>`,
      `  <RsButton />`,
      `</template>`,
      ``,
    ].join('\n')
    const out = await rewriteHostModule(sfc, '/app/App.vue', map, (from) => published(from))
    expect(out?.code).toContain(
      `import { default as RsButton } from '@niuma/ui/components/RsButton.js'`,
    )
    expect(out?.code).toContain('<template>')
    expect(out?.code).toContain('</script>')
  })
})

describe('rewriteHostStatement', () => {
  it('splits named default re-exports onto published subpaths', () => {
    const next = rewriteHostStatement(
      `import { RsButton, type RsCardVariant } from '@niuma/ui'`,
      '@niuma/ui',
      map,
      published,
    )
    expect(next).toBe(
      [
        `import { default as RsButton } from '@niuma/ui/components/RsButton.js'`,
        `import type { RsCardVariant } from '@niuma/ui'`,
      ].join('\n'),
    )
  })

  it('keeps import type and namespace imports', () => {
    expect(
      rewriteHostStatement(`import type { RsButton } from '@niuma/ui'`, '@niuma/ui', map, published),
    ).toBeNull()
    expect(
      rewriteHostStatement(`import * as UI from '@niuma/ui'`, '@niuma/ui', map, published),
    ).toBeNull()
  })

  it('rewrites default import and named alias', () => {
    const next = rewriteHostStatement(
      `import RsButton, { supportsRsButtonTone as toneOk } from '@niuma/ui'`,
      '@niuma/ui',
      map,
      published,
    )
    expect(next).toBe(
      [
        `import { default as RsButton } from '@niuma/ui/components/RsButton.js'`,
        `import { supportsRsButtonTone as toneOk } from '@niuma/ui/components/button-utils.js'`,
      ].join('\n'),
    )
  })

  it('rewrites export { } from', () => {
    const next = rewriteHostStatement(
      `export { RsButton } from '@niuma/ui'`,
      '@niuma/ui',
      map,
      published,
    )
    expect(next).toBe(`export { default as RsButton } from '@niuma/ui/components/RsButton.js'`)
  })

  it('rewrites site ui.ts barrel from published dist bindings', () => {
    const parsed = parseRuntimeBindings(DIST_BARREL)
    const next = rewriteHostStatement(
      `export { RsConfigProvider, RsButton, RsBadge } from '@niuma/ui'`,
      '@niuma/ui',
      parsed,
      published,
    )
    expect(next).toBe(
      [
        `export { default as RsConfigProvider } from '@niuma/ui/components/RsConfigProvider.js'`,
        `export { default as RsButton } from '@niuma/ui/components/RsButton.js'`,
        `export { default as RsBadge } from '@niuma/ui/components/RsBadge.js'`,
      ].join('\n'),
    )
  })

  it('throws when a runtime export is missing from the binding map', () => {
    expect(() =>
      rewriteHostStatement(`export { RsMissing } from '@niuma/ui'`, '@niuma/ui', map, published),
    ).toThrow(/RsMissing/)
  })
})
