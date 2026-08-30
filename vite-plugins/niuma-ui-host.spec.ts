import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  parseRuntimeBindings,
  rewriteHostStatement,
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
    })
    expect(parsed.has('RsCardVariant')).toBe(false)
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
    })
    expect(parsed.get('useRsToast')).toEqual({
      from: './composables/useRsToast.js',
      kind: 'named',
    })
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
