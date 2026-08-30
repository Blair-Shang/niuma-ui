import { describe, expect, it } from 'vitest'
import { rewriteHostStatement, type NiumaUiBinding } from './niuma-ui-host'

const map = new Map<string, NiumaUiBinding>([
  ['RsButton', { from: './components/RsButton.vue', kind: 'default' }],
  ['supportsRsButtonTone', { from: './components/button-utils', kind: 'named' }],
])

function published(from: string): string {
  let rel = from.replace(/^\.\//, '').replace(/\.vue$/, '.js')
  if (!rel.endsWith('.js')) rel += '.js'
  return `@niuma/ui/${rel}`
}

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
})
